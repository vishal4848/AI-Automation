import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { InstagramPublisher } from './publishers/instagram.publisher';
import { FacebookPublisher } from './publishers/facebook.publisher';
import { LinkedInPublisher } from './publishers/linkedin.publisher';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('instagram-publish') private readonly publishQueue: Queue,
    private readonly instagramPublisher: InstagramPublisher,
    private readonly facebookPublisher: FacebookPublisher,
    private readonly linkedinPublisher: LinkedInPublisher,
  ) {}

  async executePublish(postId: string): Promise<any> {
    const post = await this.prisma.scheduledPost.findUnique({
      where: { id: postId },
      include: { socialAccount: true },
    });

    if (!post) return null;
    if (post.status === 'PUBLISHED') return post;

    if (!post.socialAccount) {
      const plat = post.platform || 'Social';
      return await this.prisma.scheduledPost.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
          errorMessage: `${plat.toUpperCase()}_NOT_CONNECTED: No linked social account found.`,
        },
        include: {
          socialAccount: {
            select: { id: true, username: true, platform: true },
          },
        },
      });
    }

    try {
      let externalPostId: string;
      const platformLower = post.platform.toLowerCase();

      if (platformLower === 'instagram') {
        externalPostId = await this.instagramPublisher.publish(post.socialAccount, post);
      } else if (platformLower === 'facebook') {
        externalPostId = await this.facebookPublisher.publish(post.socialAccount, post);
      } else if (platformLower === 'linkedin') {
        externalPostId = await this.linkedinPublisher.publish(post.socialAccount, post);
      } else {
        throw new Error(`Unsupported platform: ${post.platform}`);
      }

      const publishedPost = await this.prisma.scheduledPost.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          externalPostId,
          errorMessage: null,
        },
        include: {
          socialAccount: {
            select: { id: true, username: true, platform: true },
          },
        },
      });

      this.logger.log(`Direct publish success for post ${postId} on ${post.platform}. External ID: ${externalPostId}`);
      return publishedPost;
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown publishing error';
      this.logger.error(`Direct publish failed for post ${postId}: ${errorMsg}`);

      return await this.prisma.scheduledPost.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
        },
        include: {
          socialAccount: {
            select: { id: true, username: true, platform: true },
          },
        },
      });
    }
  }

  async createScheduledPost(
    userId: string,
    dto: {
      platform?: string;
      socialAccountId?: string;
      socialAccountIds?: string[];
      mediaUrl: string;
      mediaAssetId?: string;
      uploadedAssetId?: string;
      caption?: string;
      scheduledAtUTC?: string;
    },
  ) {
    // 1. Resolve target social account IDs (deduplicating and filtering empty)
    const rawAccountIds: string[] = [];
    if (Array.isArray(dto.socialAccountIds) && dto.socialAccountIds.length > 0) {
      rawAccountIds.push(...dto.socialAccountIds);
    } else if (dto.socialAccountId) {
      rawAccountIds.push(dto.socialAccountId);
    }

    const targetAccountIds = Array.from(new Set(rawAccountIds.filter(Boolean)));

    if (targetAccountIds.length === 0) {
      throw new BadRequestException('SOCIAL_ACCOUNT_REQUIRED: Select at least one connected Instagram or Facebook Page account.');
    }

    // 2. Validate Media Asset Ownership and URLs
    const assetId = dto.mediaAssetId || dto.uploadedAssetId;
    let verifiedUploadedAssetId: string | null = null;
    let finalMediaUrl = dto.mediaUrl;

    if (assetId) {
      let foundMedia: any = null;

      // Check UploadedAsset if table exists in Prisma
      if (this.prisma.uploadedAsset) {
        const uploaded = await this.prisma.uploadedAsset.findFirst({
          where: { id: assetId, userId },
        });
        if (uploaded) {
          foundMedia = uploaded;
          verifiedUploadedAssetId = uploaded.id;
          finalMediaUrl = uploaded.secureUrl || uploaded.url || finalMediaUrl;
        }
      }

      // Check GeneratedImage if not found yet
      if (!foundMedia && this.prisma.generatedImage) {
        const genImg = await this.prisma.generatedImage.findFirst({
          where: { id: assetId, userId },
        });
        if (genImg) {
          foundMedia = genImg;
          finalMediaUrl = genImg.url || finalMediaUrl;
        }
      }

      // Check GeneratedVideo if not found yet
      if (!foundMedia && this.prisma.generatedVideo) {
        const genVid = await this.prisma.generatedVideo.findFirst({
          where: { id: assetId, userId },
        });
        if (genVid) {
          foundMedia = genVid;
          finalMediaUrl = genVid.url || finalMediaUrl;
        }
      }

      if (!foundMedia) {
        throw new BadRequestException('MEDIA_ASSET_NOT_FOUND: Selected media asset was not found or does not belong to your account.');
      }
    }

    if (!finalMediaUrl || typeof finalMediaUrl !== 'string') {
      throw new BadRequestException('MEDIA_URL_REQUIRED: Media URL is required.');
    }

    if (finalMediaUrl.includes('localhost') || finalMediaUrl.includes('127.0.0.1')) {
      throw new BadRequestException('MEDIA_URL_INVALID: Localhost URLs cannot be accessed by Meta. Please select media hosted on Cloudinary.');
    }

    if (!finalMediaUrl.startsWith('https://') && !finalMediaUrl.startsWith('http://') && !finalMediaUrl.startsWith('data:')) {
      throw new BadRequestException('MEDIA_URL_INVALID: Media URL must be a valid public link.');
    }

    // 3. Determine Schedule Delay
    let scheduledTime: Date | null = null;
    let delay = 0;

    if (dto.scheduledAtUTC) {
      scheduledTime = new Date(dto.scheduledAtUTC);
      const now = new Date();
      if (isNaN(scheduledTime.getTime())) {
        throw new BadRequestException('Invalid scheduled date/time format.');
      }
      if (scheduledTime.getTime() <= now.getTime()) {
        throw new BadRequestException('Scheduled time must be in the future.');
      }
      delay = scheduledTime.getTime() - now.getTime();
    }

    // 4. Validate all accounts and platform compatibility upfront
    const validatedAccounts: any[] = [];
    const isVideo =
      finalMediaUrl.endsWith('.mp4') ||
      finalMediaUrl.endsWith('.mov') ||
      finalMediaUrl.endsWith('.webm') ||
      finalMediaUrl.includes('/video/upload/');

    for (const accId of targetAccountIds) {
      const account = await this.prisma.socialAccount.findFirst({
        where: { id: accId, userId },
      });

      if (!account) {
        throw new BadRequestException(`SOCIAL_ACCOUNT_NOT_FOUND: Account with ID ${accId} not found or access denied.`);
      }

      if (account.status !== 'CONNECTED') {
        const plat = account.platform || 'Social';
        throw new BadRequestException(`${plat.toUpperCase()}_NOT_CONNECTED: Your ${plat} account connection has expired or is disconnected.`);
      }

      const postPlatform = account.platform || dto.platform || 'Instagram';
      const platformLower = postPlatform.toLowerCase();

      // Platform-media compatibility check
      if (platformLower === 'instagram' && isVideo && finalMediaUrl.endsWith('.webm')) {
        throw new BadRequestException('PLATFORM_MEDIA_INCOMPATIBLE: Instagram only supports MP4 or MOV video formats.');
      }

      validatedAccounts.push({ account, postPlatform });
    }

    // 5. Create independent posts and publishing jobs for each account
    const createdPosts: any[] = [];

    for (const { account, postPlatform } of validatedAccounts) {
      // Save to PostgreSQL
      const post = await this.prisma.scheduledPost.create({
        data: {
          userId,
          socialAccountId: account.id,
          platform: postPlatform,
          mediaUrl: finalMediaUrl,
          uploadedAssetId: verifiedUploadedAssetId,
          caption: dto.caption || '',
          scheduledAtUTC: scheduledTime,
          status: scheduledTime ? 'SCHEDULED' : 'PROCESSING',
        },
        include: {
          socialAccount: {
            select: { id: true, username: true, platform: true },
          },
        },
      });

      if (!scheduledTime) {
        // Immediate "Post Now": Execute direct publish
        const published = await this.executePublish(post.id);
        createdPosts.push(published || post);
      } else {
        // Scheduled Post: Add BullMQ Job with fallback
        try {
          await this.publishQueue.add(
            'publish-post',
            { postId: post.id },
            {
              delay,
              jobId: `post-${post.id}`,
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 30000, // 30s, 60s, 120s
              },
              removeOnComplete: true,
            },
          );
        } catch (e: any) {
          this.logger.warn(`BullMQ queue offline or Redis unavailable: ${e.message}`);
        }
        createdPosts.push(post);
      }
    }

    // Return primary post with createdPosts list (strictly non-circular copy)
    const primaryPost = createdPosts[0];
    return {
      ...primaryPost,
      createdPosts: createdPosts.map((p) => ({ ...p })),
    };
  }

  async publishNow(userId: string, postId: string) {
    const post = await this.prisma.scheduledPost.findFirst({
      where: { id: postId, userId },
      include: { socialAccount: true },
    });

    if (!post) {
      throw new NotFoundException('Scheduled post not found or access denied.');
    }

    if (post.status === 'PUBLISHED') {
      throw new BadRequestException('This post has already been published.');
    }

    // Remove any existing delayed job
    try {
      await this.publishQueue.remove(`post-${post.id}`);
    } catch {}

    // Execute direct publish
    return await this.executePublish(postId);
  }

  async cancelScheduledPost(userId: string, postId: string) {
    const post = await this.prisma.scheduledPost.findFirst({
      where: { id: postId, userId },
    });

    if (!post) {
      throw new NotFoundException('Scheduled post not found or access denied.');
    }

    if (post.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot cancel an already published post.');
    }

    if (post.status !== 'SCHEDULED') {
      throw new BadRequestException(`Cannot cancel post with status "${post.status}". Only SCHEDULED posts can be cancelled.`);
    }

    // Remove delayed job from BullMQ
    try {
      await this.publishQueue.remove(`post-${post.id}`);
    } catch {}

    // Update status to CANCELLED
    return this.prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'CANCELLED' },
      include: {
        socialAccount: {
          select: { id: true, username: true, platform: true },
        },
      },
    });
  }

  async getScheduledPosts(userId: string) {
    try {
      return await this.prisma.scheduledPost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          socialAccount: {
            select: { id: true, username: true, platform: true },
          },
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to get scheduled posts for user ${userId}: ${e.message}`);
      return [];
    }
  }

  async getPostById(userId: string, postId: string) {
    const post = await this.prisma.scheduledPost.findFirst({
      where: { id: postId, userId },
      include: {
        socialAccount: {
          select: { id: true, username: true, platform: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Scheduled post not found.');
    }

    return post;
  }
}
