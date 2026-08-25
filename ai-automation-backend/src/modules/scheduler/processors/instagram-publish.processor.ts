import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InstagramPublisher } from '../publishers/instagram.publisher';
import { FacebookPublisher } from '../publishers/facebook.publisher';
import { LinkedInPublisher } from '../publishers/linkedin.publisher';

@Processor('instagram-publish')
export class InstagramPublishProcessor extends WorkerHost {
  private readonly logger = new Logger(InstagramPublishProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly instagramPublisher: InstagramPublisher,
    private readonly facebookPublisher: FacebookPublisher,
    private readonly linkedinPublisher: LinkedInPublisher,
  ) {
    super();
  }

  async process(job: Job<{ postId: string }, any, string>): Promise<any> {
    const { postId } = job.data;

    const post = await this.prisma.scheduledPost.findUnique({
      where: { id: postId },
      include: { socialAccount: true },
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found, skipping job.`);
      return;
    }

    if (post.status === 'CANCELLED') {
      this.logger.log(`Post ${postId} was cancelled. Skipping.`);
      return;
    }

    if (post.status === 'PUBLISHED') {
      this.logger.log(`Post ${postId} is already published.`);
      return;
    }

    // Transition status to PROCESSING
    await this.prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'PROCESSING' },
    });

    if (!post.socialAccount) {
      const plat = post.platform || 'Social';
      await this.markFailed(postId, `${plat.toUpperCase()}_NOT_CONNECTED: No linked social account found.`);
      return;
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
        await this.markFailed(postId, `Unsupported platform: ${post.platform}`);
        return;
      }

      await this.prisma.scheduledPost.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          externalPostId,
          errorMessage: null,
        },
      });

      this.logger.log(`Post ${postId} successfully published to ${post.platform}! External ID: ${externalPostId}`);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown publishing error';
      this.logger.error(`Failed to publish post ${postId} to ${post.platform}: ${errorMsg}`);

      const isPermanent =
        errorMsg.includes('NOT_CONNECTED') ||
        errorMsg.includes('ACCOUNT_NOT_ELIGIBLE') ||
        errorMsg.includes('TOKEN_EXPIRED') ||
        errorMsg.includes('PERMISSION_DENIED') ||
        errorMsg.includes('PAGE_NOT_FOUND') ||
        errorMsg.includes('MEDIA_INVALID') ||
        errorMsg.includes('NOT_CONFIGURED');

      if (isPermanent) {
        await this.markFailed(postId, errorMsg);
        return; // Do not throw, avoid infinite retry loop for permanent errors
      }

      // If transient, throw error to trigger BullMQ exponential backoff retry
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(`BullMQ Job ${job.id} failed after attempts: ${error.message}`);
    const maxAttempts = job.opts.attempts || 3;
    if (job.attemptsMade >= maxAttempts && job.data?.postId) {
      await this.markFailed(job.data.postId, `PUBLISH_FAILED: ${error.message}`);
    }
  }

  private async markFailed(postId: string, errorMessage: string) {
    try {
      await this.prisma.scheduledPost.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to update post ${postId} status to FAILED: ${e.message}`);
    }
  }
}
