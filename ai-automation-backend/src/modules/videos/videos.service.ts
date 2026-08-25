import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AIGatewayService } from '../ai-gateway/ai-gateway.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { GenerateVideoDto } from './dto/generate-video.dto';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private prisma: PrismaService,
    private aiGateway: AIGatewayService,
    private cloudinary: CloudinaryService,
  ) {}

  async generate(userId: string, dto: GenerateVideoDto) {
    const start = Date.now();

    // Generate video
    const result = await this.aiGateway.generateVideo({
      prompt: dto.prompt,
      model: dto.model || 'wan-t2v',
      duration: dto.duration,
      resolution: dto.resolution,
      fps: dto.fps,
      style: dto.style,
    }, { preferredProvider: dto.provider });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Video generation failed');
    }

    // Upload to Cloudinary
    const upload = await this.cloudinary.uploadVideoUrl(result.data.url);
    const finalUrl = upload.url;
    const cloudinaryId = upload.publicId;

    // Save to DB (graceful — skip if DB not connected)
    let savedVideo: any = null;
    try {
      savedVideo = await this.prisma.generatedVideo.create({
        data: {
          userId,
          provider: result.provider,
          model: dto.model || 'wan-t2v',
          prompt: dto.prompt,
          url: finalUrl,
          cloudinaryId,
          duration: dto.duration || 5,
          creditsUsed: 15, // Videos might cost more
          metadata: { demo: result.demo, latencyMs: result.latencyMs },
        },
      });

      // Save prompt history
      await this.prisma.promptHistory.create({
        data: {
          userId,
          originalPrompt: dto.prompt,
          provider: result.provider,
          model: dto.model,
          category: 'VIDEO',
          creditsUsed: 15,
          generationMs: Date.now() - start,
          status: 'COMPLETED',
        },
      });

      // Deduct credits
      await this.prisma.user.update({ where: { id: userId }, data: { credits: { decrement: 15 } } });
    } catch (dbErr: any) {
      this.logger.warn(`DB save skipped: ${dbErr.message}`);
    }

    return {
      id: savedVideo?.id || `temp-${Date.now()}`,
      url: finalUrl,
      prompt: dto.prompt,
      model: dto.model,
      provider: result.provider,
      demo: result.demo,
      latencyMs: result.latencyMs,
      createdAt: new Date(),
    };
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
    const video = await this.prisma.generatedVideo.findFirst({ where: { id: videoId, userId } });
    if (!video) throw new Error('Video not found');
    if (video.cloudinaryId) await this.cloudinary.deleteAsset(video.cloudinaryId, 'video');
    await this.prisma.generatedVideo.delete({ where: { id: videoId } });
    return { deleted: true };
  }
  
  async toggleFavorite(userId: string, videoId: string) {
    const existing = await this.prisma.favorite.findFirst({ where: { userId, videoId } });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      await this.prisma.generatedVideo.update({ where: { id: videoId }, data: { isFavorite: false } });
      return { favorited: false };
    } else {
      await this.prisma.favorite.create({ data: { userId, videoId } });
      await this.prisma.generatedVideo.update({ where: { id: videoId }, data: { isFavorite: true } });
      return { favorited: true };
    }
  }
}
