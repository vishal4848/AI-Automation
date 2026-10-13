import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { OtpService } from './otp.service';
import { createSignedOAuthState, verifySignedOAuthState } from '../../common/utils/encryption.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private otpService: OtpService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const exists = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      throw new ConflictException('An account with this email already exists.');
    }

    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hash,
        name: dto.name?.trim() || null,
        credits: 100,
        role: 'USER',
        isActive: true,
        isEmailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Send OTP verification email
    try {
      await this.otpService.sendOtp(normalizedEmail, 'REGISTRATION');
    } catch (err: any) {
      this.logger.warn(`Could not dispatch OTP on registration: ${err.message}`);
    }

    return {
      user,
      requiresOtp: true,
      purpose: 'REGISTRATION',
      email: normalizedEmail,
      message: `Account created. A 6-digit verification code has been dispatched to ${this.otpService.maskEmail(normalizedEmail)}.`,
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated. Please contact support.');
    }

    if (!user.password) {
      throw new UnauthorizedException('This account was created via social login. Please use Google Login.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // If OTP code is already supplied in request, verify and complete login immediately
    if (dto.code && dto.code.trim().length === 6) {
      await this.otpService.verifyOtp(normalizedEmail, dto.code.trim(), 'LOGIN');
      const tokens = await this.generateTokens(user.id, user.email);
      const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefreshToken, isEmailVerified: true },
      });

      const { password, refreshToken, ...safeUser } = user;
      return { user: safeUser, ...tokens };
    }

    // Step 2: Trigger OTP for login verification
    try {
      await this.otpService.sendOtp(normalizedEmail, 'LOGIN');
    } catch (err: any) {
      this.logger.warn(`OTP dispatch notice for login (${normalizedEmail}): ${err.message}`);
    }

    return {
      requiresOtp: true,
      purpose: 'LOGIN',
      email: normalizedEmail,
      message: `A 6-digit login verification code has been sent to ${this.otpService.maskEmail(normalizedEmail)}. Please enter it to complete sign-in.`,
    };
  }

  async sendLoginOtp(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new BadRequestException('No account found with this email. Please sign up first.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated. Please contact support.');
    }

    await this.otpService.sendOtp(normalizedEmail, 'LOGIN');
    return {
      requiresOtp: true,
      purpose: 'LOGIN',
      email: normalizedEmail,
      message: `A 6-digit login verification code has been dispatched to ${this.otpService.maskEmail(normalizedEmail)}.`,
    };
  }

  async sendOtp(email: string, purpose: string = 'LOGIN') {
    return this.otpService.sendOtp(email, purpose);
  }

  async verifyOtp(email: string, code: string, purpose: string = 'LOGIN') {
    await this.otpService.verifyOtp(email, code, purpose);
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated.');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken, isEmailVerified: true },
    });
    const { password, refreshToken, ...safeUser } = user;
    return {
      success: true,
      message: 'Verification successful. Logged in successfully.',
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(param1: string, param2?: string) {
    const refreshToken = param2 || param1;
    const fallbackUserId = param2 ? param1 : undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const secret =
      this.config.get<string>('jwt.refreshSecret') ||
      'dev-refresh-secret-change-in-production-32-chars';

    let decoded: any;
    try {
      decoded = await this.jwt.verifyAsync(refreshToken, { secret });
    } catch {
      if (fallbackUserId) {
        decoded = { sub: fallbackUserId };
      } else {
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }
    }

    const userId = decoded?.sub || fallbackUserId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh session.');
    }

    const isRefreshValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isRefreshValid) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Token rotation
    const tokens = await this.generateTokens(user.id, user.email);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    }).catch(() => {});
    return { success: true, message: 'Logged out successfully.' };
  }

  getGoogleAuthUrl(): string {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri =
      this.config.get<string>('GOOGLE_REDIRECT_URI') ||
      'http://localhost:3001/api/v1/auth/google/callback';
    const signingKey =
      this.config.get<string>('TOKEN_ENCRYPTION_KEY') ||
      this.config.get<string>('jwt.secret') ||
      'dev-token-encryption-key-32-chars-long';

    if (!clientId) {
      throw new BadRequestException('GOOGLE_NOT_CONFIGURED: Google Client ID is missing in server environment.');
    }

    const state = createSignedOAuthState('google_login', signingKey);
    const scopes = ['openid', 'profile', 'email'].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string, state: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri =
      this.config.get<string>('GOOGLE_REDIRECT_URI') ||
      'http://localhost:3001/api/v1/auth/google/callback';
    const signingKey =
      this.config.get<string>('TOKEN_ENCRYPTION_KEY') ||
      this.config.get<string>('jwt.secret') ||
      'dev-token-encryption-key-32-chars-long';

    try {
      verifySignedOAuthState(state, signingKey);
    } catch (e: any) {
      throw new BadRequestException(`Invalid Google OAuth state: ${e.message}`);
    }

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Google OAuth client configuration is incomplete.');
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new BadRequestException(`Failed to exchange Google OAuth code: ${err}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch userinfo from Google
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userinfoRes.ok) {
      throw new BadRequestException('Failed to fetch user profile from Google.');
    }

    const googleUser = await userinfoRes.json();
    const email = googleUser.email?.toLowerCase().trim();
    if (!email) {
      throw new BadRequestException('No email address provided by Google profile.');
    }

    // Find or create user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { googleId: googleUser.sub }],
      },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.sub,
          avatarUrl: user.avatarUrl || googleUser.picture || null,
          isEmailVerified: true,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          name: googleUser.name || 'Google User',
          googleId: googleUser.sub,
          avatarUrl: googleUser.picture || null,
          credits: 100,
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    const { password, refreshToken, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret:
          this.config.get<string>('jwt.secret') ||
          'dev-secret-change-in-production-must-be-32-chars-long',
        expiresIn: (this.config.get<string>('jwt.expiresIn') || '7d') as any,
      }),
      this.jwt.signAsync(payload, {
        secret:
          this.config.get<string>('jwt.refreshSecret') ||
          'dev-refresh-secret-change-in-production-32-chars',
        expiresIn: (this.config.get<string>('jwt.refreshExpiresIn') || '30d') as any,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        bio: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  async updateProfile(userId: string, data: { name?: string; bio?: string; avatarUrl?: string }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.bio !== undefined) updateData.bio = data.bio.trim();
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        bio: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return user;
  }
}

