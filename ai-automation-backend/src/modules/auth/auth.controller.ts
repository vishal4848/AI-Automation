import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  SendOtpDto,
  VerifyOtpDto,
  ResendOtpDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('send-login-otp')
  sendLoginOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendLoginOtp(dto.email);
  }

  @Public()
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.email, dto.purpose || 'LOGIN');
  }

  @Public()
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.code, dto.purpose || 'LOGIN');
  }

  @Public()
  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.sendOtp(dto.email, dto.purpose || 'LOGIN');
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.authService.logout(userId);
  }

  @Public()
  @Get('google')
  googleAuth(@Res() res: Response) {
    try {
      const url = this.authService.getGoogleAuthUrl();
      return res.redirect(url);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Google Auth is not configured.');
    }
  }

  @Public()
  @Get('google/callback')
  async googleAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/login?error=google_missing_parameters`);
    }

    try {
      const { user, accessToken, refreshToken } = await this.authService.handleGoogleCallback(
        code,
        state,
      );

      // Set auth_token cookie
      res.cookie('auth_token', accessToken, {
        httpOnly: false, // Accessible by frontend Next.js middleware and client
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${frontendUrl}/dashboard?token=${accessToken}`);
    } catch (error: any) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(error.message || 'Google login failed')}`,
      );
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.authService.getProfile(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() body: { name?: string; bio?: string; avatarUrl?: string },
  ) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.authService.updateProfile(userId, body);
  }
}
