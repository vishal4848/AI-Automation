import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { PrismaService } from '../../database/prisma.service';
import { AIGatewayService } from '../ai-gateway/ai-gateway.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ImagesService - Delete Feature & Security', () => {
  let service: ImagesService;
  let prisma: PrismaService;
  let cloudinary: CloudinaryService;

  const mockPrisma = {
    generatedImage: {
      findFirst: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    favorite: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    promptHistory: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockAiGateway = {
    enhancePrompt: jest.fn(),
    generateImage: jest.fn(),
  };

  const mockCloudinary = {
    uploadBase64Image: jest.fn(),
    uploadVideoUrl: jest.fn(),
    deleteAsset: jest.fn().mockResolvedValue(undefined),
  };

  const mockAnalytics = {
    recordUsage: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AIGatewayService, useValue: mockAiGateway },
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    prisma = module.get<PrismaService>(PrismaService);
    cloudinary = module.get<CloudinaryService>(CloudinaryService);
    jest.clearAllMocks();
  });

  describe('deleteImage', () => {
    it('1. Authenticated user can delete their own image', async () => {
      mockPrisma.generatedImage.findFirst.mockResolvedValue({
        id: 'img-123',
        userId: 'user-alice',
        cloudinaryId: 'cld-asset-123',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      });
      mockPrisma.generatedImage.delete.mockResolvedValue({ id: 'img-123' });

      const result = await service.deleteImage('user-alice', 'img-123');

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
      expect(result.id).toBe('img-123');
      expect(mockPrisma.generatedImage.delete).toHaveBeenCalledWith({
        where: { id: 'img-123' },
      });
      expect(mockCloudinary.deleteAsset).toHaveBeenCalledWith('cld-asset-123');
    });

    it('2. Unauthenticated request / missing user ID throws BadRequestException', async () => {
      await expect(service.deleteImage('', 'img-123')).rejects.toThrow(BadRequestException);
    });

    it('3. User A cannot delete User B image (IDOR protection)', async () => {
      mockPrisma.generatedImage.findFirst.mockResolvedValue({
        id: 'img-victim',
        userId: 'user-bob',
        cloudinaryId: 'cld-bob-asset',
      });

      await expect(service.deleteImage('user-attacker', 'img-victim')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.generatedImage.delete).not.toHaveBeenCalled();
      expect(mockCloudinary.deleteAsset).not.toHaveBeenCalled();
    });

    it('4. Non-existent image returns 404 NotFoundException', async () => {
      mockPrisma.generatedImage.findFirst.mockResolvedValue(null);

      await expect(service.deleteImage('user-alice', 'img-non-existent')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.generatedImage.delete).not.toHaveBeenCalled();
      expect(mockCloudinary.deleteAsset).not.toHaveBeenCalled();
    });

    it('5. Successful deletion removes the Prisma record', async () => {
      mockPrisma.generatedImage.findFirst.mockResolvedValue({
        id: 'img-delete-test',
        userId: 'user-alice',
      });
      mockPrisma.generatedImage.delete.mockResolvedValue({ id: 'img-delete-test' });

      await service.deleteImage('user-alice', 'img-delete-test');

      expect(mockPrisma.generatedImage.delete).toHaveBeenCalledWith({
        where: { id: 'img-delete-test' },
      });
    });

    it('6. Cloudinary deletion is called for images that have a Cloudinary asset', async () => {
      mockPrisma.generatedImage.findFirst.mockResolvedValue({
        id: 'img-with-cld',
        userId: 'user-alice',
        cloudinaryId: 'ai-automation/images/cld-999',
      });
      mockPrisma.generatedImage.delete.mockResolvedValue({ id: 'img-with-cld' });

      await service.deleteImage('user-alice', 'img-with-cld');

      expect(mockCloudinary.deleteAsset).toHaveBeenCalledWith('ai-automation/images/cld-999');
    });

    it('7. Missing Cloudinary public ID is handled safely without error', async () => {
      mockPrisma.generatedImage.findFirst.mockResolvedValue({
        id: 'img-no-cld',
        userId: 'user-alice',
        cloudinaryId: null,
      });
      mockPrisma.generatedImage.delete.mockResolvedValue({ id: 'img-no-cld' });

      const result = await service.deleteImage('user-alice', 'img-no-cld');

      expect(result.success).toBe(true);
      expect(mockCloudinary.deleteAsset).not.toHaveBeenCalled();
      expect(mockPrisma.generatedImage.delete).toHaveBeenCalledWith({
        where: { id: 'img-no-cld' },
      });
    });

    it('8. Duplicate deletion returns 404 on second attempt', async () => {
      // First deletion: exists
      mockPrisma.generatedImage.findFirst.mockResolvedValueOnce({
        id: 'img-dup',
        userId: 'user-alice',
      });
      mockPrisma.generatedImage.delete.mockResolvedValueOnce({ id: 'img-dup' });

      const first = await service.deleteImage('user-alice', 'img-dup');
      expect(first.success).toBe(true);

      // Second deletion: no longer exists
      mockPrisma.generatedImage.findFirst.mockResolvedValueOnce(null);
      await expect(service.deleteImage('user-alice', 'img-dup')).rejects.toThrow(NotFoundException);
    });
  });
});
