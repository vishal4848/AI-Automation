import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ReplicateProvider } from '../../ai/providers/replicate.provider';
import { CloudinaryService } from '../../storage/cloudinary.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

@Processor('video-generation')
export class VideoGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly replicateProvider: ReplicateProvider,
    private readonly cloudinary: CloudinaryService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ videoId: string; userId: string; dto: any }>): Promise<any> {
    const { videoId, userId, dto } = job.data;
    const start = Date.now();

    const video = await this.prisma.generatedVideo.findUnique({ where: { id: videoId } });
    if (!video) {
      this.logger.warn(`Video ${videoId} not found. Skipping job.`);
      return;
    }

    if (video.status === 'COMPLETED' || video.status === 'CANCELLED') {
      this.logger.log(`Video ${videoId} status is ${video.status}. Skipping.`);
      return;
    }

    // Set to PROCESSING
    await this.prisma.generatedVideo.update({
      where: { id: videoId },
      data: { status: 'PROCESSING' },
    });

    const backendUrl = this.config.get<string>('BACKEND_URL') || 'http://localhost:3001';
    const webhookUrl = `${backendUrl}/api/v1/videos/webhook`;

    try {
      this.logger.log(`[BullMQ Worker] Creating prediction for videoId: ${videoId}`);
      const modelId = dto.model || 'wan-3';
      const resolvedModel = typeof this.replicateProvider.resolveVideoModel === 'function'
        ? this.replicateProvider.resolveVideoModel(modelId)
        : (this.config.get<string>('REPLICATE_VIDEO_MODEL') || 'wan-video/wan-2.1-t2v-480p');

      const input: any = {
        prompt: dto.prompt,
      };
      if (dto.duration) input.duration = dto.duration;
      if (dto.aspectRatio) input.aspect_ratio = dto.aspectRatio;
      if (dto.resolution) input.resolution = dto.resolution;
      if (dto.inputImage) input.image = dto.inputImage;

      // Create prediction on Replicate with webhook
      const prediction = await this.replicateProvider.createPrediction(
        resolvedModel,
        input,
        webhookUrl,
      );

      this.logger.log(`[BullMQ Worker] Prediction created on Replicate: ${prediction.id}`);

      // Store predictionId
      await this.prisma.generatedVideo.update({
        where: { id: videoId },
        data: {
          predictionId: prediction.id,
          jobId: job.id ? String(job.id) : null,
        },
      });

      // Poll until finished or webhook completes it
      let currentPrediction = prediction;
      if (currentPrediction.status !== 'succeeded' && currentPrediction.status !== 'failed') {
        const maxPolls = 60; // 5 minutes max
        for (let i = 0; i < maxPolls; i++) {
          await new Promise((r) => setTimeout(r, 5000));

          // Check if webhook already completed or failed the video
          const checkVideo = await this.prisma.generatedVideo.findUnique({
            where: { id: videoId },
            select: { status: true },
          });
          if (checkVideo?.status === 'COMPLETED' || checkVideo?.status === 'CANCELLED') {
            return;
          }

          currentPrediction = await this.replicateProvider.getPrediction(prediction.id);
          if (currentPrediction.status === 'succeeded' || currentPrediction.status === 'failed') {
            break;
          }
        }
      }

      if (currentPrediction.status === 'succeeded') {
        // Verify idempotency
        const fresh = await this.prisma.generatedVideo.findUnique({ where: { id: videoId } });
        if (fresh?.status === 'COMPLETED') return;

        const rawOutput = currentPrediction.output;
        let videoUrl = '';
        if (Array.isArray(rawOutput) && rawOutput.length > 0) {
          videoUrl = typeof rawOutput[0] === 'string' ? rawOutput[0] : String(rawOutput[0]);
        } else if (typeof rawOutput === 'string') {
          videoUrl = rawOutput;
        }

        if (videoUrl) {
          const upload = await this.cloudinary.uploadVideoUrl(videoUrl);
          const finalUrl = upload.secureUrl || upload.url;

          await this.prisma.generatedVideo.update({
            where: { id: videoId },
            data: {
              url: finalUrl,
              cloudinaryId: upload.publicId,
              status: 'COMPLETED',
              metadata: {
                predictionId: prediction.id,
                latencyMs: Date.now() - start,
                completedAt: new Date(),
              },
            },
          });

          await this.notifications.create(userId, {
            type: 'VIDEO_GENERATED',
            title: 'AI Video Completed',
            message: `Your video "${dto.prompt.slice(0, 35)}..." has finished rendering.`,
            data: { videoId, url: finalUrl },
          });

          return { success: true, url: finalUrl };
        }
      }

      if (currentPrediction.status === 'failed') {
        throw new Error(currentPrediction.error || 'Replicate prediction failed');
      }
    } catch (error: any) {
      this.logger.error(`[BullMQ Worker] Video generation failed for ${videoId}: ${error.message}`);

      await this.prisma.generatedVideo.update({
        where: { id: videoId },
        data: {
          status: 'FAILED',
          metadata: { error: error.message },
        },
      }).catch(() => {});

      // Only refund once on final attempt
      const isLastAttempt = (job.attemptsMade + 1) >= (job.opts?.attempts || 1);
      if (isLastAttempt) {
        await this.prisma.refundCreditsAtomically(
          userId,
          video.creditsUsed || 20,
          `Refund for failed video generation (${dto.prompt?.slice(0, 30)})`,
          { videoId, error: error.message },
        ).catch(() => {});
      }

      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`BullMQ job ${job.id} failed after attempts: ${err.message}`);
  }
}
