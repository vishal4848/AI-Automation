import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const DEFAULT_MODELS = [
  { provider: 'gemini', name: 'nano-banana', displayName: 'Nano Banana', category: 'IMAGE', isFree: true, pricingType: 'FREE TIER', creditsPerGeneration: 0, pricePerGeneration: 0, supportsTextToImage: true, supportsNegativePrompt: false },
  { provider: 'huggingface', name: 'flux-schnell', displayName: 'FLUX Schnell', category: 'IMAGE', isFree: true, pricingType: 'FREE_TIER', creditsPerGeneration: 0, pricePerGeneration: 0, supportsTextToImage: true, supportsNegativePrompt: true },
  { provider: 'huggingface', name: 'flux-dev', displayName: 'FLUX Dev', category: 'IMAGE', isFree: false, pricingType: 'PAID', creditsPerGeneration: 5, pricePerGeneration: 5, supportsTextToImage: true, supportsNegativePrompt: true },
  { provider: 'fal', name: 'flux-pro', displayName: 'FLUX Pro', category: 'IMAGE', isFree: false, pricingType: 'PAID', creditsPerGeneration: 10, pricePerGeneration: 10, supportsTextToImage: true, supportsNegativePrompt: true },
  { provider: 'huggingface', name: 'sdxl', displayName: 'SDXL', category: 'IMAGE', isFree: false, pricingType: 'PAID', creditsPerGeneration: 4, pricePerGeneration: 4, supportsTextToImage: true, supportsNegativePrompt: true },
  { provider: 'huggingface', name: 'sd3', displayName: 'SD 3.5', category: 'IMAGE', isFree: false, pricingType: 'PAID', creditsPerGeneration: 5, pricePerGeneration: 5, supportsTextToImage: true, supportsNegativePrompt: true },
  { provider: 'openai', name: 'dall-e-3', displayName: 'DALL-E 3', category: 'IMAGE', isFree: false, pricingType: 'PAID', creditsPerGeneration: 10, pricePerGeneration: 10, supportsTextToImage: true, supportsNegativePrompt: false },
  { provider: 'gemini', name: 'imagen-3', displayName: 'Imagen 3', category: 'IMAGE', isFree: false, pricingType: 'PAID', creditsPerGeneration: 8, pricePerGeneration: 8, supportsTextToImage: true, supportsNegativePrompt: false },
  { provider: 'local', name: 'comfyui-flux', displayName: 'FLUX Local', category: 'IMAGE', isFree: true, pricingType: 'LOCAL', creditsPerGeneration: 0, pricePerGeneration: 0, supportsTextToImage: true, supportsNegativePrompt: true },
  { provider: 'fal', name: 'wan-t2v', displayName: 'Wan T2V', category: 'VIDEO', isFree: false, pricingType: 'PAID', creditsPerGeneration: 20, pricePerGeneration: 20, supportsTextToVideo: true },
  { provider: 'fal', name: 'kling-video', displayName: 'Kling Video', category: 'VIDEO', isFree: false, pricingType: 'PAID', creditsPerGeneration: 25, pricePerGeneration: 25, supportsTextToVideo: true },
  { provider: 'fal', name: 'luma-dream-machine', displayName: 'Luma Dream Machine', category: 'VIDEO', isFree: false, pricingType: 'PAID', creditsPerGeneration: 30, pricePerGeneration: 30, supportsTextToVideo: true },
];

@Injectable()
export class ModelRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModelRegistryService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      for (const model of DEFAULT_MODELS) {
        await this.prisma.aIModel.upsert({
          where: { provider_name: { provider: model.provider, name: model.name } },
          update: {},
          create: { ...model, category: model.category as any },
        });
      }
      this.logger.log(`Model registry initialized with ${DEFAULT_MODELS.length} models`);
    } catch (err: any) {
      this.logger.warn(`Model registry init skipped (DB may not be connected): ${err.message}`);
    }
  }

  async getActiveModels(category?: string) {
    try {
      return await this.prisma.aIModel.findMany({
        where: { isActive: true, ...(category ? { category: category as any } : {}) },
        orderBy: [{ category: 'asc' }, { provider: 'asc' }],
      });
    } catch {
      const filtered = category
        ? DEFAULT_MODELS.filter((m) => m.category === category.toUpperCase())
        : DEFAULT_MODELS;
      return filtered.map((m, i) => ({ id: String(i), ...m, isActive: true, version: null, maxResolution: null, supportsSeed: false, supportsStreaming: false, defaultParams: null, createdAt: new Date(), updatedAt: new Date() }));
    }
  }
}
