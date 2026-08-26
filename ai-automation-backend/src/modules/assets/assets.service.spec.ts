import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: PrismaService;
  let cloudinary: CloudinaryService;

  const mockPrisma = {
    uploadedAsset: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
    scheduledPost: {
      findFirst: jest.fn(),
    },
  };

  const mockCloudinary = {
    uploadBuffer: jest.fn(),
    deleteAsset: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotifications = {
    create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    prisma = module.get<PrismaService>(PrismaService);
    cloudinary = module.get<CloudinaryService>(CloudinaryService);
    jest.clearAllMocks();
  });

  describe('validateFile', () => {
    it('1. should accept valid JPEG image under 10MB', () => {
      const mockFile: any = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 5 * 1024 * 1024,
        buffer: Buffer.from('fake-data'),
      };
      const result = service.validateFile(mockFile);
      expect(result.resourceType).toBe('image');
    });

    it('2. should accept valid MP4 video under 100MB', () => {
      const mockFile: any = {
        originalname: 'video.mp4',
        mimetype: 'video/mp4',
        size: 50 * 1024 * 1024,
        buffer: Buffer.from('fake-video'),
      };
      const result = service.validateFile(mockFile);
      expect(result.resourceType).toBe('video');
    });

    it('3. should reject unsupported file type (.pdf, .exe)', () => {
      const mockFile: any = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('fake-pdf'),
      };
      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
    });

    it('4. should reject image larger than 10MB', () => {
      const mockFile: any = {
        originalname: 'large.png',
        mimetype: 'image/png',
        size: 11 * 1024 * 1024,
        buffer: Buffer.from('huge-image'),
      };
      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
    });

    it('5. should reject video larger than 100MB', () => {
      const mockFile: any = {
        originalname: 'huge-video.mp4',
        mimetype: 'video/mp4',
        size: 105 * 1024 * 1024,
        buffer: Buffer.from('huge-video'),
      };
      expect(() => service.validateFile(mockFile)).toThrow(BadRequestException);
    });
  });

  describe('upload', () => {
    it('6. should upload image to Cloudinary and create record in PostgreSQL', async () => {
      const mockFile: any = {
        originalname: 'brand-banner.png',
        mimetype: 'image/png',
        size: 2 * 1024 * 1024,
        buffer: Buffer.from('test-buffer'),
      };

      mockCloudinary.uploadBuffer.mockResolvedValue({
        url: 'http://res.cloudinary.com/demo/image/upload/v1/brand-banner.png',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/brand-banner.png',
        publicId: 'ai-automation/uploads/images/brand-banner-123',
        width: 1920,
        height: 1080,
        format: 'png',
        bytes: 2048,
        resourceType: 'image',
      });

      mockPrisma.uploadedAsset.create.mockResolvedValue({
        id: 'asset-1',
        userId: 'user-1',
        fileName: 'brand-banner.png',
        originalName: 'brand-banner.png',
        mimeType: 'image/png',
        resourceType: 'image',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/brand-banner.png',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/brand-banner.png',
        cloudinaryPublicId: 'ai-automation/uploads/images/brand-banner-123',
        width: 1920,
        height: 1080,
        fileSize: 2 * 1024 * 1024,
        source: 'UPLOAD',
        createdAt: new Date(),
      });

      const result = await service.upload('user-1', mockFile);

      expect(result.id).toBe('asset-1');
      expect(result.secureUrl).toBe(
        'https://res.cloudinary.com/demo/image/upload/v1/brand-banner.png',
      );
      expect(mockCloudinary.uploadBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.objectContaining({
          folder: 'ai-automation/uploads/images',
          resourceType: 'image',
        }),
      );
      expect(mockPrisma.uploadedAsset.create).toHaveBeenCalled();
    });

    it('7. should reject unauthenticated request', async () => {
      const mockFile: any = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('data'),
      };
      await expect(service.upload('', mockFile)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findAll', () => {
    it('8. should only return assets belonging to authenticated user', async () => {
      mockPrisma.uploadedAsset.findMany.mockResolvedValue([
        { id: 'asset-1', userId: 'user-1', fileName: 'one.jpg' },
      ]);
      mockPrisma.uploadedAsset.count.mockResolvedValue(1);

      const result = await service.findAll('user-1');
      expect(result.assets).toHaveLength(1);
      expect(mockPrisma.uploadedAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });
  });

  describe('delete & protection', () => {
    it('9. should reject deletion when asset is referenced by active scheduled post (SCHEDULED/PROCESSING)', async () => {
      mockPrisma.uploadedAsset.findFirst.mockResolvedValue({
        id: 'asset-active-post',
        userId: 'user-1',
        url: 'https://cloudinary.com/media.jpg',
        secureUrl: 'https://cloudinary.com/media.jpg',
        cloudinaryPublicId: 'cld-1',
        resourceType: 'image',
      });

      mockPrisma.scheduledPost.findFirst.mockResolvedValue({
        id: 'post-1',
        status: 'SCHEDULED',
        mediaUrl: 'https://cloudinary.com/media.jpg',
      });

      await expect(
        service.delete('user-1', 'asset-active-post'),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.uploadedAsset.delete).not.toHaveBeenCalled();
      expect(mockCloudinary.deleteAsset).not.toHaveBeenCalled();
    });

    it('10. should allow deletion and clean up Cloudinary and PostgreSQL when not in use', async () => {
      mockPrisma.uploadedAsset.findFirst.mockResolvedValue({
        id: 'asset-free',
        userId: 'user-1',
        url: 'https://cloudinary.com/free.jpg',
        secureUrl: 'https://cloudinary.com/free.jpg',
        cloudinaryPublicId: 'ai-automation/uploads/images/free-1',
        resourceType: 'image',
      });

      mockPrisma.scheduledPost.findFirst.mockResolvedValue(null);
      mockPrisma.uploadedAsset.delete.mockResolvedValue({ id: 'asset-free' });

      const result = await service.delete('user-1', 'asset-free');
      expect(result.success).toBe(true);
      expect(mockCloudinary.deleteAsset).toHaveBeenCalledWith(
        'ai-automation/uploads/images/free-1',
        'image',
      );
      expect(mockPrisma.uploadedAsset.delete).toHaveBeenCalledWith({
        where: { id: 'asset-free' },
      });
    });

    it('11. should prevent User A from deleting User B asset (IDOR protection)', async () => {
      mockPrisma.uploadedAsset.findFirst.mockResolvedValue(null);
      await expect(
        service.delete('user-attacker', 'user-victim-asset'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
