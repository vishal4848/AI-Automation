import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AIGatewayService } from '../ai-gateway/ai-gateway.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ModelRegistryService } from '../models/model-registry.service';
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
    private modelRegistry: ModelRegistryService,
  ) {}

  async generate(userId: string, dto: GenerateImageDto) {
    // Model-aware parameter validation
    const modelId = dto.model || 'flux-schnell';
    const validation = this.modelRegistry.validateModelParams(modelId, {
      prompt: dto.prompt,
      negativePrompt: dto.negativePrompt,
      ratio: dto.ratio,
    });
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // Atomically check and deduct user credits before generation
    const modelEntry = this.modelRegistry.getModel(modelId, dto.provider);
    const requiredCredits = modelEntry ? modelEntry.creditsPerGeneration : 5;

    try {
      await this.prisma.deductCreditsAtomically(
        userId,
        requiredCredits,
        `Generated image with ${modelId}`,
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

    const start = Date.now();
    let enhancedPrompt = dto.prompt;

    // Enhance prompt if requested
    if (dto.enhancePrompt) {
      enhancedPrompt = await this.aiGateway.enhancePrompt({
        prompt: dto.prompt,
        category: 'image',
        style: dto.style,
      });
      this.logger.log(`Prompt enhanced: "${dto.prompt}" → "${enhancedPrompt}"`);
    }

    // Generate image via AI Gateway
    const refImage = dto.referenceImage || (dto.referenceImages ? dto.referenceImages[0] : undefined);
    let result: any;
    try {
      result = await this.aiGateway.generateImage(
        {
          prompt: enhancedPrompt,
          negativePrompt: dto.negativePrompt,
          model: modelId,
          style: dto.style,
          ratio: dto.ratio,
          steps: dto.steps,
          referenceImage: refImage,
          referenceImages: dto.referenceImages,
        } as any,
        { preferredProvider: dto.provider },
      );
    } catch (err: any) {
      await this.prisma.refundCreditsAtomically(
        userId,
        requiredCredits,
        `Refund for failed image generation with ${modelId}`,
        { model: modelId, provider: dto.provider, error: err.message },
      );
      throw new BadRequestException(err.message || 'Image generation failed');
    }

    if (!result.success || !result.data) {
      await this.prisma.refundCreditsAtomically(
        userId,
        requiredCredits,
        `Refund for failed image generation with ${modelId}`,
        { model: modelId, provider: dto.provider, error: result.error },
      );
      throw new BadRequestException(result.error || 'Image generation failed');
    }

    // Upload to Cloudinary (support data URLs, base64, and remote HTTP URLs from Replicate)
    let finalUrl = result.data.url;
    let cloudinaryId: string | undefined;
    if (result.data.base64 || result.data.url.startsWith('data:')) {
      const upload = await this.cloudinary.uploadBase64Image(result.data.url);
      finalUrl = upload.secureUrl || upload.url;
      cloudinaryId = upload.publicId;
    } else if (result.data.url && result.data.url.startsWith('http')) {
      const upload = await this.cloudinary.uploadImageUrl(result.data.url);
      finalUrl = upload.secureUrl || upload.url;
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
          model: modelId,
          prompt: dto.prompt,
          negPrompt: dto.negativePrompt,
          style: dto.style,
          ratio: dto.ratio,
          url: finalUrl,
          cloudinaryId,
          creditsUsed: requiredCredits,
          metadata: {
            enhancedPrompt,
            demo: result.demo,
            latencyMs: result.latencyMs,
            resourceType: 'image',
          },
        },
      });

      // Save prompt history
      await this.prisma.promptHistory.create({
        data: {
          userId,
          originalPrompt: dto.prompt,
          enhancedPrompt: dto.enhancePrompt ? enhancedPrompt : undefined,
          provider: result.provider,
          model: modelId,
          category: 'IMAGE',
          creditsUsed: requiredCredits,
          generationMs: Date.now() - start,
          status: 'COMPLETED',
        },
      });

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
      secureUrl: finalUrl,
      cloudinaryId,
      prompt: dto.prompt,
      enhancedPrompt: dto.enhancePrompt ? enhancedPrompt : undefined,
      model: modelId,
      provider: result.provider,
      style: dto.style,
      ratio: dto.ratio,
      projectId: dto.projectId || undefined,
      demo: result.demo,
      latencyMs: result.latencyMs,
      createdAt: savedImage?.createdAt || new Date(),
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

    // Check if image is in use by an active scheduled post
    const inUse = await this.prisma.scheduledPost?.findFirst({
      where: {
        userId,
        status: { in: ['SCHEDULED', 'PROCESSING'] },
        OR: [
          { mediaUrl: image.url },
          ...(image.cloudinaryId ? [{ mediaUrl: { contains: image.cloudinaryId } }] : []),
        ],
      },
    });

    if (inUse) {
      throw new BadRequestException(
        'ASSET_IN_USE_BY_SCHEDULED_POST: This image is currently being used by an active scheduled post and cannot be deleted.',
      );
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
