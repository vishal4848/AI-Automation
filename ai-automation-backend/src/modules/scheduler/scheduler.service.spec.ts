import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { InstagramPublisher } from './publishers/instagram.publisher';
import { FacebookPublisher } from './publishers/facebook.publisher';
import { LinkedInPublisher } from './publishers/linkedin.publisher';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: PrismaService;

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const mockPrisma = {
    socialAccount: {
      findFirst: jest.fn(),
    },
    scheduledPost: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    uploadedAsset: {
      findFirst: jest.fn(),
    },
    generatedImage: {
      findFirst: jest.fn(),
    },
    generatedVideo: {
      findFirst: jest.fn(),
    },
  };

  const mockInstagramPublisher = { publish: jest.fn().mockResolvedValue('ig-post-123') };
  const mockFacebookPublisher = { publish: jest.fn().mockResolvedValue('fb-post-123') };
  const mockLinkedInPublisher = { publish: jest.fn().mockResolvedValue('li-post-123') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('instagram-publish'), useValue: mockQueue },
        { provide: InstagramPublisher, useValue: mockInstagramPublisher },
        { provide: FacebookPublisher, useValue: mockFacebookPublisher },
        { provide: LinkedInPublisher, useValue: mockLinkedInPublisher },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('createScheduledPost', () => {
    it('should reject post if scheduled time is in the past', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        status: 'CONNECTED',
      });

      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();

      await expect(
        service.createScheduledPost('user-1', {
          platform: 'Instagram',
          socialAccountId: 'acc-1',
          mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          caption: 'Test caption',
          scheduledAtUTC: pastDate,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject post if social account is not connected or does not belong to user', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.createScheduledPost('user-1', {
          platform: 'Instagram',
          socialAccountId: 'acc-other-user',
          mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          caption: 'Test caption',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject localhost media URLs', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        status: 'CONNECTED',
      });

      await expect(
        service.createScheduledPost('user-1', {
          platform: 'Instagram',
          socialAccountId: 'acc-1',
          mediaUrl: 'http://localhost:3000/test.png',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create post scoped to authenticated userId and add job to queue with exponential backoff', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        status: 'CONNECTED',
      });

      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

      mockPrisma.scheduledPost.create.mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        socialAccountId: 'acc-1',
        platform: 'Instagram',
        mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        caption: 'Future post',
        scheduledAtUTC: new Date(futureDate),
        status: 'SCHEDULED',
      });

      const result = await service.createScheduledPost('user-1', {
        platform: 'Instagram',
        socialAccountId: 'acc-1',
        mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        caption: 'Future post',
        scheduledAtUTC: futureDate,
      });

      expect(result.userId).toBe('user-1');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'publish-post',
        { postId: 'post-1' },
        expect.objectContaining({ attempts: 3, backoff: { type: 'exponential', delay: 30000 } })
      );
    });

    it('should create multiple posts when scheduling to both Instagram and Facebook simultaneously', async () => {
      mockPrisma.socialAccount.findFirst.mockImplementation(({ where }: any) => {
        if (where.id === 'acc-ig') return Promise.resolve({ id: 'acc-ig', userId: 'user-1', platform: 'Instagram', status: 'CONNECTED' });
        if (where.id === 'acc-fb') return Promise.resolve({ id: 'acc-fb', userId: 'user-1', platform: 'Facebook', status: 'CONNECTED' });
        return Promise.resolve(null);
      });

      mockPrisma.scheduledPost.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: `post-${data.platform}`,
          userId: data.userId,
          socialAccountId: data.socialAccountId,
          platform: data.platform,
          mediaUrl: data.mediaUrl,
          caption: data.caption,
          status: 'PROCESSING',
        });
      });

      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      const result = await service.createScheduledPost('user-1', {
        socialAccountIds: ['acc-ig', 'acc-fb'],
        mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        caption: 'Multi-platform post',
        scheduledAtUTC: futureDate,
      });

      expect(result.createdPosts).toHaveLength(2);
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should create multiple posts when scheduling to Instagram, Facebook, and LinkedIn simultaneously', async () => {
      mockPrisma.socialAccount.findFirst.mockImplementation(({ where }: any) => {
        if (where.id === 'acc-ig') return Promise.resolve({ id: 'acc-ig', userId: 'user-1', platform: 'Instagram', status: 'CONNECTED' });
        if (where.id === 'acc-fb') return Promise.resolve({ id: 'acc-fb', userId: 'user-1', platform: 'Facebook', status: 'CONNECTED' });
        if (where.id === 'acc-li') return Promise.resolve({ id: 'acc-li', userId: 'user-1', platform: 'LinkedIn', status: 'CONNECTED' });
        return Promise.resolve(null);
      });

      mockPrisma.scheduledPost.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: `post-${data.platform}`,
          userId: data.userId,
          socialAccountId: data.socialAccountId,
          platform: data.platform,
          mediaUrl: data.mediaUrl,
          caption: data.caption,
          status: 'SCHEDULED',
        });
      });

      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      const result = await service.createScheduledPost('user-1', {
        socialAccountIds: ['acc-ig', 'acc-fb', 'acc-li'],
        mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        caption: 'Omnichannel post across IG, FB, and LinkedIn',
        scheduledAtUTC: futureDate,
      });

      expect(result.createdPosts).toHaveLength(3);
      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should resolve local media URL to data URI and schedule post for LinkedIn', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'acc-li-1',
        userId: 'user-1',
        platform: 'LinkedIn',
        status: 'CONNECTED',
      });

      mockPrisma.generatedImage.findFirst.mockResolvedValue({
        id: 'img-1',
        userId: 'user-1',
        url: '/generated/images/cmtvvydik000hln20kgophh96.png',
        prompt: 'A futuristic cybernetic tiger prowling through a neon jungle',
      });

      mockPrisma.scheduledPost.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 'post-li-1',
          ...data,
          status: 'SCHEDULED',
        });
      });

      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      const result = await service.createScheduledPost('user-1', {
        socialAccountIds: ['acc-li-1'],
        mediaAssetId: 'img-1',
        mediaUrl: '/generated/images/cmtvvydik000hln20kgophh96.png',
        caption: 'A futuristic cybernetic tiger prowling through a neon jungle',
        scheduledAtUTC: futureDate,
      });

      expect(result.createdPosts).toHaveLength(1);
      expect(result.createdPosts[0].mediaUrl).toMatch(/^data:image\/png;base64,/);
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should reject post if mediaAssetId does not belong to authenticated user (IDOR security)', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        status: 'CONNECTED',
      });
      mockPrisma.uploadedAsset.findFirst.mockResolvedValue(null);
      mockPrisma.generatedImage.findFirst.mockResolvedValue(null);
      mockPrisma.generatedVideo.findFirst.mockResolvedValue(null);

      await expect(
        service.createScheduledPost('user-1', {
          socialAccountId: 'acc-1',
          mediaAssetId: 'asset-belonging-to-other-user',
          mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid owned mediaAssetId and associate uploadedAssetId', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        platform: 'Instagram',
        status: 'CONNECTED',
      });
      mockPrisma.uploadedAsset.findFirst.mockResolvedValue({
        id: 'asset-123',
        userId: 'user-1',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      });
      mockPrisma.scheduledPost.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 'post-123',
          ...data,
        });
      });

      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      const result = await service.createScheduledPost('user-1', {
        socialAccountId: 'acc-1',
        mediaAssetId: 'asset-123',
        mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        scheduledAtUTC: futureDate,
      });

      expect(result.uploadedAssetId).toBe('asset-123');
      expect(mockPrisma.scheduledPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            uploadedAssetId: 'asset-123',
          }),
        })
      );
    });

    it('should reject incompatible media formats for Instagram (e.g. webm)', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'acc-ig',
        userId: 'user-1',
        platform: 'Instagram',
        status: 'CONNECTED',
      });

      await expect(
        service.createScheduledPost('user-1', {
          socialAccountId: 'acc-ig',
          mediaUrl: 'https://res.cloudinary.com/demo/video/upload/sample.webm',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should isolate failures when publishing immediately to multiple accounts (Post Now)', async () => {
      mockPrisma.socialAccount.findFirst.mockImplementation(({ where }: any) => {
        if (where.id === 'acc-ig-1') return Promise.resolve({ id: 'acc-ig-1', userId: 'user-1', platform: 'Instagram', status: 'CONNECTED' });
        if (where.id === 'acc-ig-2') return Promise.resolve({ id: 'acc-ig-2', userId: 'user-1', platform: 'Instagram', status: 'CONNECTED' });
        return Promise.resolve(null);
      });

      mockPrisma.scheduledPost.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: `post-${data.socialAccountId}`,
          userId: data.userId,
          socialAccountId: data.socialAccountId,
          platform: data.platform,
          mediaUrl: data.mediaUrl,
          status: 'PROCESSING',
          socialAccount: { id: data.socialAccountId, platform: data.platform },
        });
      });

      mockPrisma.scheduledPost.findUnique.mockImplementation(({ where }: any) => {
        return Promise.resolve({
          id: where.id,
          userId: 'user-1',
          platform: 'Instagram',
          socialAccountId: where.id.replace('post-', ''),
          socialAccount: { id: where.id.replace('post-', ''), platform: 'Instagram' },
        });
      });

      // Acc 1 succeeds, Acc 2 throws
      mockInstagramPublisher.publish.mockImplementation((acc: any) => {
        if (acc.id === 'acc-ig-1') return Promise.resolve('ig-post-success');
        throw new Error('INSTAGRAM_TOKEN_EXPIRED: Token expired');
      });

      mockPrisma.scheduledPost.update.mockImplementation(({ where, data }: any) => {
        return Promise.resolve({
          id: where.id,
          ...data,
        });
      });

      const result = await service.createScheduledPost('user-1', {
        socialAccountIds: ['acc-ig-1', 'acc-ig-2'],
        mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      });

      expect(result.createdPosts).toHaveLength(2);
      expect(result.createdPosts[0].status).toBe('PUBLISHED');
      expect(result.createdPosts[1].status).toBe('FAILED');
      expect(result.createdPosts[1].errorMessage).toContain('INSTAGRAM_TOKEN_EXPIRED');
    });
  });

  describe('publishNow', () => {
    it('should prevent User A from publishing User B post (IDOR protection)', async () => {
      mockPrisma.scheduledPost.findFirst.mockResolvedValue(null);

      await expect(
        service.publishNow('attacker-user', 'victim-post-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should immediately execute publish and update status to PUBLISHED', async () => {
      mockPrisma.scheduledPost.findFirst.mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        status: 'SCHEDULED',
        platform: 'Instagram',
        socialAccount: { id: 'acc-1', platform: 'Instagram' },
      });
      mockPrisma.scheduledPost.findUnique.mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        status: 'PROCESSING',
        platform: 'Instagram',
        socialAccount: { id: 'acc-1', platform: 'Instagram' },
      });
      mockPrisma.scheduledPost.update.mockResolvedValue({
        id: 'post-1',
        status: 'PUBLISHED',
        externalPostId: 'ig-post-123',
      });

      const result = await service.publishNow('user-1', 'post-1');

      expect(result.status).toBe('PUBLISHED');
      expect(mockInstagramPublisher.publish).toHaveBeenCalled();
    });
  });

  describe('cancelScheduledPost', () => {
    it('should reject cancellation if post does not belong to the user', async () => {
      mockPrisma.scheduledPost.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelScheduledPost('user-attacker', 'post-victim')
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject cancellation if post is already published', async () => {
      mockPrisma.scheduledPost.findFirst.mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        status: 'PUBLISHED',
      });

      await expect(
        service.cancelScheduledPost('user-1', 'post-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully cancel post owned by authenticated user and remove queue job', async () => {
      mockPrisma.scheduledPost.findFirst.mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        status: 'SCHEDULED',
      });

      mockPrisma.scheduledPost.update.mockResolvedValue({
        id: 'post-1',
        status: 'CANCELLED',
      });

      const result = await service.cancelScheduledPost('user-1', 'post-1');
      expect(result.status).toBe('CANCELLED');
      expect(mockQueue.remove).toHaveBeenCalledWith('post-post-1');
    });
  });
});
