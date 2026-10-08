import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.initMailer();
  }

  private initMailer() {
    const host = this.config.get<string>('EMAIL_HOST');
    const port = this.config.get<number>('EMAIL_PORT') || 587;
    const user = this.config.get<string>('EMAIL_USER');
    const pass = this.config.get<string>('EMAIL_PASSWORD');

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure: Number(port) === 465,
          auth: { user, pass },
        });
        this.logger.log('SMTP mail transporter initialized successfully.');
      } catch (err: any) {
        this.logger.warn(`Failed to initialize SMTP transporter: ${err.message}`);
      }
    } else {
      this.logger.log('SMTP not fully configured; OTPs will operate in mock delivery mode.');
    }
  }

  /**
   * Generates and dispatches a cryptographically secure 6-digit OTP.
   */
  async sendOtp(email: string, purpose: string = 'REGISTRATION'): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check resend cooldown (~60 seconds)
    const recentOtp = await this.prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        createdAt: { gte: new Date(Date.now() - 60000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000);
      throw new BadRequestException(`Please wait ${waitSeconds} seconds before requesting another code.`);
    }

    // Clean up older expired/stale OTPs for this email & purpose
    await this.prisma.otpVerification.deleteMany({
      where: { email: normalizedEmail, purpose },
    }).catch(() => {});

    // Cryptographically secure 6-digit number
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await this.prisma.otpVerification.create({
      data: {
        email: normalizedEmail,
        otpHash,
        purpose,
        attempts: 0,
        expiresAt,
      },
    });

    // Send email
    await this.deliverEmail(normalizedEmail, otp, purpose);

    const masked = this.maskEmail(normalizedEmail);
    this.logger.log(`[OTP] 6-digit verification code generated and dispatched to ${masked}`);

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${masked}. It expires in 10 minutes.`,
    };
  }

  /**
   * Verifies the provided 6-digit OTP against the stored bcrypt hash.
   */
  async verifyOtp(email: string, code: string, purpose: string = 'REGISTRATION'): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = (code || '').trim();

    if (!cleanCode || cleanCode.length !== 6) {
      throw new BadRequestException('A valid 6-digit OTP code is required.');
    }

    const record = await this.prisma.otpVerification.findFirst({
      where: { email: normalizedEmail, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('No active OTP found. Please request a new verification code.');
    }

    // Check expiration
    if (new Date() > record.expiresAt) {
      await this.prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {});
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    // Check max attempts
    if (record.attempts >= 5) {
      await this.prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {});
      throw new BadRequestException('Maximum verification attempts exceeded. Please request a new code.');
    }

    const isValid = await bcrypt.compare(cleanCode, record.otpHash);
    if (!isValid) {
      const remaining = 4 - record.attempts;
      await this.prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      if (remaining <= 0) {
        await this.prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {});
        throw new BadRequestException('Maximum verification attempts exceeded. Please request a new code.');
      }

      throw new BadRequestException(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    // Success: invalidate OTP immediately to prevent replay
    await this.prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {});

    // Update user isEmailVerified if user exists
    await this.prisma.user.updateMany({
      where: { email: normalizedEmail },
      data: { isEmailVerified: true },
    }).catch(() => {});

    return true;
  }

  private async deliverEmail(to: string, code: string, purpose: string) {
    const from = this.config.get<string>('EMAIL_FROM') || 'no-reply@ai-automation.app';
    const subject = purpose === 'PASSWORD_RESET' 
      ? 'Password Reset Code — AI Automation' 
      : 'Verify Your Email — AI Automation';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #09090b; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a;">
        <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #ffffff;">Verification Code</h2>
        <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5;">Please use the following 6-digit code to complete your verification for AI Automation. This code is valid for 10 minutes.</p>
        <div style="margin: 28px 0; text-align: center;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; padding: 14px 28px; background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; color: #38bdf8; display: inline-block;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #71717a;">If you did not request this verification code, please ignore this email or contact support if you have concerns.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"AI Automation" <${from}>`,
          to,
          subject,
          html,
        });
      } catch (err: any) {
        this.logger.error(`Failed to send email via SMTP: ${err.message}`);
      }
    }
  }

  private maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return '***';
    const visible = user.slice(0, Math.min(2, user.length));
    return `${visible}***@${domain}`;
  }
}
