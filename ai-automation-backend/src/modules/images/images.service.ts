import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AIGatewayService } from '../ai-gateway/ai-gateway.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GenerateImageDto } from './dto/generate-image.dto';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private prisma: PrismaService,
    private aiGateway: AIGatewayService,
    private cloudinary: CloudinaryService,
    private analyticsService: AnalyticsService,
    private notificationsService: NotificationsService,
  ) {}

  async generate(userId: string, dto: GenerateImageDto) {
    const start = Date.now();
    let enhancedPrompt = dto.prompt;

    // Enhance prompt if requested
    if (dto.enhancePrompt) {
      enhancedPrompt = await this.aiGateway.enhancePrompt({
        prompt: dto.prompt, category: 'image', style: dto.style,
      });
      this.logger.log(`Prompt enhanced: "${dto.prompt}" → "${enhancedPrompt}"`);
    }

    // Generate image
    const result = await this.aiGateway.generateImage({
      prompt: enhancedPrompt,
      negativePrompt: dto.negativePrompt,
      model: dto.model || 'flux-schnell',
      style: dto.style,
      ratio: dto.ratio,
      steps: dto.steps,
    }, { preferredProvider: dto.provider });

    if (!result.success || !result.data) {
      throw new BadRequestException(result.error || 'Image generation failed');
    }

    // Upload to Cloudinary
    let finalUrl = result.data.url;
    let cloudinaryId: string | undefined;
    if (result.data.base64 || result.data.url.startsWith('data:')) {
      const upload = await this.cloudinary.uploadBase64Image(result.data.url);
      finalUrl = upload.url;
      cloudinaryId = upload.publicId;
    }

    // Save to DB (graceful — skip if DB not connected)
    let savedImage: any = null;
    try {
      savedImage = await this.prisma.generatedImage.create({
        data: {
          userId,
          projectId: dto.projectId || null,
          provider: result.provider,
          model: dto.model || 'flux-schnell',
          prompt: dto.prompt,
          negPrompt: dto.negativePrompt,
          style: dto.style,
          ratio: dto.ratio,
          url: finalUrl,
          cloudinaryId,
          creditsUsed: 5,
          metadata: { enhancedPrompt, demo: result.demo, latencyMs: result.latencyMs },
        },
      });

      // Save prompt history
      await this.prisma.promptHistory.create({
        data: {
          userId,
          originalPrompt: dto.prompt,
          enhancedPrompt: dto.enhancePrompt ? enhancedPrompt : undefined,
          provider: result.provider,
          model: dto.model,
          category: 'IMAGE',
          creditsUsed: 5,
          generationMs: Date.now() - start,
          status: 'COMPLETED',
        },
      });

      // Deduct credits
      await this.prisma.user.update({ where: { id: userId }, data: { credits: { decrement: 5 } } });

      // Create live notification
      await this.notificationsService.create(userId, {
        type: 'IMAGE_GENERATED',
        title: 'AI Image Generated',
        message: `Generated "${dto.prompt.slice(0, 35)}${dto.prompt.length > 35 ? '...' : ''}"`,
        data: { imageId: savedImage?.id, url: finalUrl, projectId: dto.projectId },
      });
    } catch (dbErr: any) {
      this.logger.warn(`DB save skipped: ${dbErr.message}`);
    }

    const imageResult = {
      id: savedImage?.id || `img-${Date.now()}`,
      url: finalUrl,
      prompt: dto.prompt,
      enhancedPrompt: dto.enhancePrompt ? enhancedPrompt : undefined,
      model: dto.model || 'FLUX Schnell',
      provider: result.provider,
      style: dto.style,
      ratio: dto.ratio,
      projectId: dto.projectId || undefined,
      demo: result.demo,
      latencyMs: result.latencyMs,
      createdAt: new Date(),
    };

    return imageResult;
  }

  async getImages(userId: string, page = 1, limit = 20, projectId?: string) {
    try {
      const whereClause: any = { userId };
      if (projectId) {
        whereClause.projectId = projectId;
      }

      const [images, total] = await Promise.all([
        this.prisma.generatedImage.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.generatedImage.count({ where: whereClause }),
      ]);
      return { images, total, page, pages: Math.ceil(total / limit) };
    } catch {
      return { images: [], total: 0, page, pages: 0 };
    }
  }

  async deleteImage(userId: string, imageId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!imageId) {
      throw new BadRequestException('Image ID is required');
    }

    const image = await this.prisma.generatedImage.findFirst({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    if (image.userId !== userId) {
      throw new NotFoundException('Image not found or access denied');
    }

    if (image.cloudinaryId) {
      try {
        await this.cloudinary.deleteAsset(image.cloudinaryId);
      } catch (err: any) {
        this.logger.warn(`Cloudinary asset deletion failed for image ${imageId}: ${err.message}`);
      }
    } else {
      this.logger.log(`No Cloudinary public ID for image ${imageId}, skipping Cloudinary asset deletion.`);
    }

    await this.prisma.generatedImage.delete({
      where: { id: imageId },
    });

    return { success: true, message: 'Image deleted successfully', id: imageId, deleted: true };
  }

  async toggleFavorite(userId: string, imageId: string) {
    const existing = await this.prisma.favorite.findFirst({ where: { userId, imageId } });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      await this.prisma.generatedImage.update({ where: { id: imageId }, data: { isFavorite: false } });
      return { favorited: false };
    } else {
      await this.prisma.favorite.create({ data: { userId, imageId } });
      await this.prisma.generatedImage.update({ where: { id: imageId }, data: { isFavorite: true } });
      return { favorited: true };
    }
  }
}
