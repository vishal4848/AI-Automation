import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AIGatewayService } from '../ai-gateway/ai-gateway.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { ModelRegistryService } from '../models/model-registry.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReplicateProvider, REPLICATE_ERRORS } from '../ai/providers/replicate.provider';
import { GenerateVideoDto } from './dto/generate-video.dto';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AIGatewayService,
    private readonly cloudinary: CloudinaryService,
    private readonly modelRegistry: ModelRegistryService,
    private readonly notificationsService: NotificationsService,
    private readonly replicateProvider: ReplicateProvider,
    private readonly config: ConfigService,
    @InjectQueue('video-generation') private readonly videoQueue: Queue,
  ) {}

  /**
   * Determine if the requested generation targets Replicate.
   */
  private isReplicateTarget(dto: GenerateVideoDto): boolean {
    const provider = (dto.provider || '').toLowerCase();
    if (provider === 'replicate') return true;
    const model = (dto.model || '').toLowerCase();
    return (
      ['wan-3', 'seedance', 'kling', 'veo'].includes(model) ||
      model.startsWith('replicate/') ||
      this.replicateProvider.supportedVideoModels.includes(model)
    );
  }

  /**
   * Main video generation method.
   * Atomically checks & deducts credits, creates DB record, and enqueues to BullMQ.
   */
  async generate(userId: string, dto: GenerateVideoDto) {
    const modelId = dto.model || 'wan-3';

    // Validate parameters against model registry
    const validation = this.modelRegistry.validateModelParams(modelId, {
      prompt: dto.prompt,
      duration: dto.duration,
      resolution: dto.resolution,
    });

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // Atomically check and deduct user credits upfront
    const modelEntry = this.modelRegistry.getModel(modelId, dto.provider);
    const requiredCredits = modelEntry ? modelEntry.creditsPerGeneration : 20;

    try {
      await this.prisma.deductCreditsAtomically(
        userId,
        requiredCredits,
        `Video generation with ${modelId}`,
        'USAGE',
        { model: modelId, provider: dto.provider },
      );
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_CREDITS') {
        throw new BadRequestException({
          success: false,
          code: 'INSUFFICIENT_CREDITS',
          message: `Insufficient credits. Required: ${requiredCredits}.`,
        });
      }
      throw err;
    }

    const isReplicate = this.isReplicateTarget(dto);

    if (isReplicate) {
      if (!this.replicateProvider.isAvailable()) {
        // Refund credits if provider not configured
        await this.prisma.refundCreditsAtomically(
          userId,
          requiredCredits,
          `Refund: Replicate API token is not configured`,
        ).catch(() => {});
        throw new BadRequestException(REPLICATE_ERRORS.NOT_CONFIGURED);
      }

      // Create video record with PENDING status in DB
      let savedVideo: any = null;
      try {
        savedVideo = await this.prisma.generatedVideo.create({
          data: {
            userId,
            provider: 'replicate',
            model: modelId,
            prompt: dto.prompt,
            style: dto.style || null,
            duration: dto.duration || 5,
            resolution: dto.resolution || null,
            fps: dto.fps || null,
            status: 'PENDING',
            creditsUsed: requiredCredits,
            metadata: {
              aspectRatio: dto.aspectRatio,
              startedAt: new Date(),
            },
          },
        });
      } catch (dbErr: any) {
        this.logger.error(`DB save failed during video start: ${dbErr.message}`);
        await this.prisma.refundCreditsAtomically(
          userId,
          requiredCredits,
          `Refund: Database save failed`,
        ).catch(() => {});
        throw new BadRequestException('Failed to initiate video generation.');
      }

      // Dispatch to BullMQ queue for durable execution and retry
      try {
        await this.videoQueue.add(
          'generate-video',
          {
            videoId: savedVideo.id,
            userId,
            dto,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
          },
        );
      } catch (queueErr: any) {
        this.logger.warn(`BullMQ queue offline or Redis unavailable: ${queueErr.message}`);
      }

      return {
        id: savedVideo.id,
        status: 'PENDING',
        prompt: dto.prompt,
        model: modelId,
        provider: 'replicate',
        duration: dto.duration || 5,
        message: 'Video generation queued and is processing in the background.',
        createdAt: savedVideo.createdAt || new Date(),
      };
    }

    // Synchronous video generation path (e.g. Fal or demo)
    const start = Date.now();
    let result: any;
    try {
      result = await this.aiGateway.generateVideo(
        {
          prompt: dto.prompt,
          model: modelId,
          duration: dto.duration,
          resolution: dto.resolution,
          fps: dto.fps,
          style: dto.style,
        },
        { preferredProvider: dto.provider },
      );
    } catch (err: any) {
      await this.prisma.refundCreditsAtomically(
        userId,
        requiredCredits,
        `Refund for failed video generation with ${modelId}`,
        { error: err.message },
      ).catch(() => {});
      throw new BadRequestException(err.message || 'Video generation failed');
    }

    if (!result.success || !result.data) {
      await this.prisma.refundCreditsAtomically(
        userId,
        requiredCredits,
        `Refund for failed video generation with ${modelId}`,
        { error: result.error },
      ).catch(() => {});
      throw new BadRequestException(result.error || 'Video generation failed');
    }

    // Upload to Cloudinary
    const upload = await this.cloudinary.uploadVideoUrl(result.data.url);
    const finalUrl = upload.secureUrl || upload.url;
    const cloudinaryId = upload.publicId;

    let savedVideo: any = null;
    try {
      savedVideo = await this.prisma.generatedVideo.create({
        data: {
          userId,
          provider: result.provider,
          model: modelId,
          prompt: dto.prompt,
          url: finalUrl,
          cloudinaryId,
          duration: dto.duration || 5,
          status: 'COMPLETED',
          creditsUsed: requiredCredits,
          metadata: { demo: result.demo, latencyMs: result.latencyMs },
        },
      });

      // Save prompt history
      await this.prisma.promptHistory.create({
        data: {
          userId,
          originalPrompt: dto.prompt,
          provider: result.provider,
          model: modelId,
          category: 'VIDEO',
          creditsUsed: requiredCredits,
          generationMs: Date.now() - start,
          status: 'COMPLETED',
        },
      });
    } catch (dbErr: any) {
      this.logger.warn(`DB save skipped: ${dbErr.message}`);
    }

    return {
      id: savedVideo?.id || `temp-${Date.now()}`,
      url: finalUrl,
      secureUrl: finalUrl,
      status: 'COMPLETED',
      prompt: dto.prompt,
      model: modelId,
      provider: result.provider,
      demo: result.demo,
      latencyMs: result.latencyMs,
      createdAt: savedVideo?.createdAt || new Date(),
    };
  }

  /**
   * Get status of a generated video.
   */
  async getVideoStatus(userId: string, videoId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!videoId) {
      throw new BadRequestException('Video ID is required');
    }

    const video = await this.prisma.generatedVideo.findFirst({
      where: { id: videoId, userId },
    });

    if (!video) {
      throw new NotFoundException('Video not found or access denied');
    }

    return {
      id: video.id,
      status: video.status,
      url: video.url,
      secureUrl: video.url,
      prompt: video.prompt,
      model: video.model,
      provider: video.provider,
      duration: video.duration,
      isFavorite: video.isFavorite,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  }

  /**
   * Replicate Webhook signature validation & event handler.
   */
  async handleWebhook(headers: Record<string, string>, rawBody: string, parsedBody: any) {
    const webhookSecret = this.config.get<string>('REPLICATE_WEBHOOK_SECRET');

    // If secret configured, perform Svix / Standard Webhook signature verification
    if (webhookSecret) {
      const webhookId = headers['webhook-id'];
      const webhookTimestamp = headers['webhook-timestamp'];
      const webhookSignature = headers['webhook-signature'];

      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        throw new BadRequestException('Missing webhook signature headers');
      }

      // Check timestamp freshness (5 minutes tolerance)
      const now = Math.floor(Date.now() / 1000);
      const ts = parseInt(webhookTimestamp, 10);
      if (Math.abs(now - ts) > 300) {
        throw new BadRequestException('Webhook timestamp out of range');
      }

      // Calculate HMAC
      const secret = webhookSecret.startsWith('whsec_')
        ? webhookSecret.substring(6)
        : webhookSecret;
      const secretBytes = Buffer.from(secret, 'base64');
      const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
      const computedHmac = crypto
        .createHmac('sha256', secretBytes)
        .update(signedContent)
        .digest('base64');

      const expectedSignatures = webhookSignature
        .split(' ')
        .map((s) => s.replace(/^v1,/, ''));

      const isValid = expectedSignatures.some((sig) => {
        try {
          return crypto.timingSafeEqual(
            Buffer.from(sig, 'base64'),
            Buffer.from(computedHmac, 'base64'),
          );
        } catch {
          return false;
        }
      });

      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    // Process webhook event
    const predictionId = parsedBody?.id;
    const status = parsedBody?.status;
    const output = parsedBody?.output;

    this.logger.log(`Received Replicate webhook for prediction ${predictionId}, status: ${status}`);

    if (!predictionId) {
      return { received: true, ignored: true };
    }

    const video = await this.prisma.generatedVideo.findFirst({
      where: {
        OR: [
          { predictionId },
          { jobId: predictionId },
        ],
      },
    });

    if (!video) {
      this.logger.warn(`No video found matching predictionId: ${predictionId}`);
      return { received: true, notFound: true };
    }

    // Idempotency: skip if already COMPLETED or CANCELLED
    if (video.status === 'COMPLETED' || video.status === 'CANCELLED') {
      return { received: true, alreadyHandled: true };
    }

    if (status === 'succeeded' && output) {
      let videoUrl = '';
      if (Array.isArray(output) && output.length > 0) {
        videoUrl = typeof output[0] === 'string' ? output[0] : String(output[0]);
      } else if (typeof output === 'string') {
        videoUrl = output;
      }

      if (videoUrl) {
        const upload = await this.cloudinary.uploadVideoUrl(videoUrl);
        await this.prisma.generatedVideo.update({
          where: { id: video.id },
          data: {
            url: upload.secureUrl || upload.url,
            cloudinaryId: upload.publicId,
            status: 'COMPLETED',
            metadata: {
              completedVia: 'webhook',
              completedAt: new Date(),
            },
          },
        });

        await this.notificationsService.create(video.userId, {
          type: 'VIDEO_GENERATED',
          title: 'AI Video Completed',
          message: `Your video "${video.prompt.slice(0, 35)}..." is ready to view.`,
          data: { videoId: video.id, url: upload.secureUrl || upload.url },
        }).catch(() => {});

        this.logger.log(`Webhook updated video ${video.id} to COMPLETED`);
      }
    } else if (status === 'failed') {
      await this.prisma.generatedVideo.update({
        where: { id: video.id },
        data: {
          status: 'FAILED',
          metadata: {
            error: parsedBody?.error || 'Replicate prediction failed',
            failedVia: 'webhook',
          },
        },
      });

      // Refund credits
      await this.prisma.refundCreditsAtomically(
        video.userId,
        video.creditsUsed || 20,
        `Refund for failed video generation (${video.prompt?.slice(0, 30)})`,
        { videoId: video.id, error: parsedBody?.error },
      ).catch(() => {});

      await this.notificationsService.create(video.userId, {
        type: 'VIDEO_FAILED',
        title: 'Video Generation Failed',
        message: `Failed to render video: ${parsedBody?.error || 'Prediction failed'}. Credits have been refunded.`,
        data: { videoId: video.id },
      }).catch(() => {});
    }

    return { received: true };
  }

  async getVideos(userId: string, page = 1, limit = 20) {
    try {
      const [videos, total] = await Promise.all([
        this.prisma.generatedVideo.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.generatedVideo.count({ where: { userId } }),
      ]);
      return { videos, total, page, pages: Math.ceil(total / limit) };
    } catch {
      return { videos: [], total: 0, page, pages: 0 };
    }
  }

  async deleteVideo(userId: string, videoId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!videoId) {
      throw new BadRequestException('Video ID is required');
    }

    const video = await this.prisma.generatedVideo.findFirst({
      where: { id: videoId, userId },
    });

    if (!video) {
      throw new NotFoundException('Video not found or access denied');
    }

    // Check if video is in use by an active scheduled post
    if (video.url || video.cloudinaryId) {
      const inUse = await this.prisma.scheduledPost?.findFirst({
        where: {
          userId,
          status: { in: ['SCHEDULED', 'PROCESSING'] },
          OR: [
            ...(video.url ? [{ mediaUrl: video.url }] : []),
            ...(video.cloudinaryId ? [{ mediaUrl: { contains: video.cloudinaryId } }] : []),
          ],
        },
      });

      if (inUse) {
        throw new BadRequestException(
          'ASSET_IN_USE_BY_SCHEDULED_POST: This video is currently being used by an active scheduled post and cannot be deleted.',
        );
      }
    }

    if (video.cloudinaryId) {
      try {
        await this.cloudinary.deleteAsset(video.cloudinaryId, 'video');
      } catch (err: any) {
        this.logger.warn(`Cloudinary asset deletion failed for video ${videoId}: ${err.message}`);
      }
    }

    await this.prisma.generatedVideo.delete({ where: { id: videoId } });
    return { success: true, deleted: true, id: videoId };
  }

  async toggleFavorite(userId: string, videoId: string) {
    const existing = await this.prisma.favorite.findFirst({ where: { userId, videoId } });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      await this.prisma.generatedVideo.update({
        where: { id: videoId },
        data: { isFavorite: false },
      });
      return { favorited: false };
    } else {
      await this.prisma.favorite.create({ data: { userId, videoId } });
      await this.prisma.generatedVideo.update({
        where: { id: videoId },
        data: { isFavorite: true },
      });
      return { favorited: true };
    }
  }
}
