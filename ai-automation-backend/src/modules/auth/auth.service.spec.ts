import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwt = {
    signAsync: jest.fn().mockImplementation((payload) => Promise.resolve(`jwt_mock_token_${payload.sub}`)),
  };

  const mockOtpService = {
    generateAndSendOtp: jest.fn().mockResolvedValue({ success: true }),
    sendOtp: jest.fn().mockResolvedValue({ success: true, message: 'OTP sent' }),
    verifyOtp: jest.fn().mockResolvedValue(true),
    maskEmail: jest.fn().mockReturnValue('te***@example.com'),
  };

  const mockConfig = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'jwt.secret') return 'test-secret-key-min-32-chars-long';
      if (key === 'jwt.expiresIn') return '7d';
      if (key === 'jwt.refreshSecret') return 'test-refresh-secret-key-32-chars';
      if (key === 'jwt.refreshExpiresIn') return '30d';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user with hashed password and require OTP verification', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100,
        role: 'USER',
        createdAt: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.requiresOtp).toBe(true);
      expect(result.purpose).toBe('REGISTRATION');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      // Ensure password stored was hashed, not plaintext
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('Password123!');
      expect(await bcrypt.compare('Password123!', createCall.data.password)).toBe(true);
    });

    it('should throw ConflictException if email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should authenticate valid credentials and dispatch OTP when code is not provided', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        isActive: true,
        credits: 100,
        role: 'USER',
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'CorrectPassword123!',
      });

      expect(result.requiresOtp).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(result.purpose).toBe('LOGIN');
      expect(mockOtpService.sendOtp).toHaveBeenCalledWith('test@example.com', 'LOGIN');
    });

    it('should authenticate valid credentials with OTP code and return user and tokens', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        isActive: true,
        credits: 100,
        role: 'USER',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login({
        email: 'test@example.com',
        password: 'CorrectPassword123!',
        code: '123456',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('jwt_mock_token_user-1');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'SomePassword!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for deactivated user', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'deactivated@example.com',
        password: hashedPassword,
        isActive: false,
      });

      await expect(
        service.login({
          email: 'deactivated@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should validate bcrypt hashed refresh token and issue new tokens', async () => {
      const rawRefreshToken = 'valid_raw_refresh_token';
      const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        refreshToken: hashedRefreshToken,
        isActive: true,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const tokens = await service.refresh('user-1', rawRefreshToken);

      expect(tokens.accessToken).toBe('jwt_mock_token_user-1');
      expect(tokens.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const hashedRefreshToken = await bcrypt.hash('valid_token', 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        refreshToken: hashedRefreshToken,
        isActive: true,
      });

      await expect(
        service.refresh('user-1', 'tampered_or_invalid_token')
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
