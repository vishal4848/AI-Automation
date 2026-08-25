import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
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
      },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return { user, ...tokens };
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

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
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

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh session.');
    }

    const isRefreshValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isRefreshValid) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return tokens;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('jwt.secret') || 'dev-secret-change-in-production-must-be-32-chars-long',
        expiresIn: (this.config.get<string>('jwt.expiresIn') || '7d') as any,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret') || 'dev-refresh-secret-change-in-production-32-chars',
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
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
