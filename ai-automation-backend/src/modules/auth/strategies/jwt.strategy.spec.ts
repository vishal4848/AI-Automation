import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('test-jwt-secret-key-min-32-chars-long'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate and return active database user', async () => {
      const dbUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Active User',
        role: 'USER',
        isActive: true,
        credits: 100,
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);

      const result = await strategy.validate({ sub: 'user-123', email: 'user@example.com' });

      expect(result).toEqual(dbUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.any(Object),
      });
    });

    it('should throw UnauthorizedException if user does not exist in database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'non-existent-id', email: 'ghost@example.com' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is deactivated', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        isActive: false,
      });

      await expect(
        strategy.validate({ sub: 'user-123', email: 'user@example.com' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token payload is missing sub', async () => {
      await expect(
        strategy.validate({ sub: '', email: 'user@example.com' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
