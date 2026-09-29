import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { REPLICATE_MODELS } from '../ai/providers/replicate.config';

export interface ModelCapability {
  supportsTextToImage?: boolean;
  supportsImageToImage?: boolean;
  supportsTextToVideo?: boolean;
  supportsImageToVideo?: boolean;
  supportsNegativePrompt?: boolean;
  supportsSeed?: boolean;
  maxResolution?: string;
  maxDuration?: number;
}

export interface ModelSupportedInputs {
  aspectRatios?: string[];
  outputFormats?: string[];
  resolutions?: string[];
  durations?: number[];
  supportsReferenceImage?: boolean;
  supportsNegativePrompt?: boolean;
}

export interface ModelRegistryEntry {
  provider: string;
  name: string; // Model ID
  displayName: string;
  category: 'IMAGE' | 'VIDEO';
  isFree: boolean;
  pricingType: string;
  creditsPerGeneration: number;
  pricePerGeneration: number;
  supportsTextToImage?: boolean;
  supportsImageToImage?: boolean;
  supportsTextToVideo?: boolean;
  supportsImageToVideo?: boolean;
  supportsNegativePrompt?: boolean;
  supportsSeed?: boolean;
  maxResolution?: string;
  maxDuration?: number;
  capabilities: ModelCapability;
  supportedInputs: ModelSupportedInputs;
}

export const CENTRAL_MODEL_REGISTRY: ModelRegistryEntry[] = [
  // --- OFFICIAL REPLICATE CURATED MODELS ---
  ...(REPLICATE_MODELS.image as ModelRegistryEntry[]),
  ...(REPLICATE_MODELS.video as ModelRegistryEntry[]),

  // --- REPLICATE ALIAS MODELS (FOR BACKWARDS COMPATIBILITY) ---
  {
    provider: 'replicate',
    name: 'nano-banana-2',
    displayName: 'Nano Banana 2',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 5,
    pricePerGeneration: 5,
    supportsTextToImage: true,
    supportsImageToImage: true,
    supportsNegativePrompt: true,
    supportsSeed: true,
    maxResolution: '1024x1024',
    capabilities: {
      supportsTextToImage: true,
      supportsImageToImage: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      maxResolution: '1024x1024',
    },
    supportedInputs: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2'],
      outputFormats: ['webp', 'jpg', 'png'],
      supportsReferenceImage: true,
      supportsNegativePrompt: true,
    },
  },
  {
    provider: 'replicate',
    name: 'nano-banana-pro',
    displayName: 'Nano Banana Pro',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PRO',
    creditsPerGeneration: 8,
    pricePerGeneration: 8,
    supportsTextToImage: true,
    supportsImageToImage: true,
    supportsNegativePrompt: true,
    supportsSeed: true,
    maxResolution: '2048x2048',
    capabilities: {
      supportsTextToImage: true,
      supportsImageToImage: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      maxResolution: '2048x2048',
    },
    supportedInputs: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2', '21:9'],
      outputFormats: ['webp', 'jpg', 'png'],
      supportsReferenceImage: true,
      supportsNegativePrompt: true,
    },
  },
  {
    provider: 'replicate',
    name: 'flux-2-max',
    displayName: 'FLUX.2 Max',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PRO',
    creditsPerGeneration: 10,
    pricePerGeneration: 10,
    supportsTextToImage: true,
    supportsImageToImage: false,
    supportsNegativePrompt: true,
    supportsSeed: true,
    maxResolution: '2048x2048',
    capabilities: {
      supportsTextToImage: true,
      supportsImageToImage: false,
      supportsNegativePrompt: true,
      supportsSeed: true,
      maxResolution: '2048x2048',
    },
    supportedInputs: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2'],
      outputFormats: ['webp', 'jpg', 'png'],
      supportsReferenceImage: false,
      supportsNegativePrompt: true,
    },
  },
  {
    provider: 'replicate',
    name: 'qwen-image-3-pro',
    displayName: 'Qwen Image 3 Pro',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 6,
    pricePerGeneration: 6,
    supportsTextToImage: true,
    supportsImageToImage: true,
    supportsNegativePrompt: true,
    supportsSeed: true,
    maxResolution: '1024x1024',
    capabilities: {
      supportsTextToImage: true,
      supportsImageToImage: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      maxResolution: '1024x1024',
    },
    supportedInputs: {
      aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
      outputFormats: ['webp', 'jpg', 'png'],
      supportsReferenceImage: true,
      supportsNegativePrompt: true,
    },
  },

  // --- REPLICATE VIDEO MODELS ---
  {
    provider: 'replicate',
    name: 'wan-3',
    displayName: 'WAN 3',
    category: 'VIDEO',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 20,
    pricePerGeneration: 20,
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    maxResolution: '720p',
    maxDuration: 10,
    capabilities: {
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      maxResolution: '720p',
      maxDuration: 10,
    },
    supportedInputs: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      resolutions: ['480p', '720p'],
      durations: [3, 5, 8, 10],
      supportsReferenceImage: true,
    },
  },
  {
    provider: 'replicate',
    name: 'seedance',
    displayName: 'Seedance',
    category: 'VIDEO',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 25,
    pricePerGeneration: 25,
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    maxResolution: '1080p',
    maxDuration: 10,
    capabilities: {
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      maxResolution: '1080p',
      maxDuration: 10,
    },
    supportedInputs: {
      aspectRatios: ['16:9', '9:16'],
      resolutions: ['720p', '1080p'],
      durations: [5, 10],
      supportsReferenceImage: true,
    },
  },
  {
    provider: 'replicate',
    name: 'kling',
    displayName: 'Kling',
    category: 'VIDEO',
    isFree: false,
    pricingType: 'PRO',
    creditsPerGeneration: 30,
    pricePerGeneration: 30,
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    maxResolution: '1080p',
    maxDuration: 15,
    capabilities: {
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      maxResolution: '1080p',
      maxDuration: 15,
    },
    supportedInputs: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      resolutions: ['720p', '1080p'],
      durations: [5, 10, 15],
      supportsReferenceImage: true,
    },
  },
  {
    provider: 'replicate',
    name: 'veo',
    displayName: 'Veo',
    category: 'VIDEO',
    isFree: false,
    pricingType: 'PRO',
    creditsPerGeneration: 35,
    pricePerGeneration: 35,
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    maxResolution: '1080p',
    maxDuration: 15,
    capabilities: {
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      maxResolution: '1080p',
      maxDuration: 15,
    },
    supportedInputs: {
      aspectRatios: ['16:9', '9:16', '1:1'],
      resolutions: ['720p', '1080p'],
      durations: [5, 10, 15],
      supportsReferenceImage: true,
    },
  },

  // --- EXISTING PRESERVED MODELS ---
  {
    provider: 'gemini',
    name: 'nano-banana',
    displayName: 'Nano Banana',
    category: 'IMAGE',
    isFree: true,
    pricingType: 'FREE TIER',
    creditsPerGeneration: 0,
    pricePerGeneration: 0,
    supportsTextToImage: true,
    supportsNegativePrompt: false,
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: false },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'] },
  },
  {
    provider: 'huggingface',
    name: 'flux-schnell',
    displayName: 'FLUX Schnell',
    category: 'IMAGE',
    isFree: true,
    pricingType: 'FREE_TIER',
    creditsPerGeneration: 0,
    pricePerGeneration: 0,
    supportsTextToImage: true,
    supportsNegativePrompt: true,
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: true },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: true },
  },
  {
    provider: 'huggingface',
    name: 'flux-dev',
    displayName: 'FLUX Dev',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 5,
    pricePerGeneration: 5,
    supportsTextToImage: true,
    supportsNegativePrompt: true,
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: true },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: true },
  },
  {
    provider: 'fal',
    name: 'flux-pro',
    displayName: 'FLUX Pro',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 10,
    pricePerGeneration: 10,
    supportsTextToImage: true,
    supportsNegativePrompt: true,
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: true },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: true },
  },
  {
    provider: 'huggingface',
    name: 'sdxl',
    displayName: 'SDXL',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 4,
    pricePerGeneration: 4,
    supportsTextToImage: true,
    supportsNegativePrompt: true,
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: true },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: true },
  },
  {
    provider: 'huggingface',
    name: 'sd3',
    displayName: 'SD 3.5',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 5,
    pricePerGeneration: 5,
    supportsTextToImage: true,
    supportsNegativePrompt: true,
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: true },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: true },
  },
  {
    provider: 'openai',
    name: 'dall-e-3',
    displayName: 'DALL-E 3',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 10,
    pricePerGeneration: 10,
    supportsTextToImage: true,
    supportsNegativePrompt: false,
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: false },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: false },
  },
  {
    provider: 'gemini',
    name: 'imagen-3',
    displayName: 'Imagen 3',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 8,
    pricePerGeneration: 8,
    supportsTextToImage: true,
    supportsNegativePrompt: false,
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: false },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: false },
  },
  {
    provider: 'local',
    name: 'comfyui-flux',
    displayName: 'FLUX Local',
    category: 'IMAGE',
    isFree: true,
    pricingType: 'LOCAL',
    creditsPerGeneration: 0,
    pricePerGeneration: 0,
    supportsTextToImage: true,
    supportsNegativePrompt: true,
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: true },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: true },
  },
  {
    provider: 'fal',
    name: 'wan-t2v',
    displayName: 'Wan T2V',
    category: 'VIDEO',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 20,
    pricePerGeneration: 20,
    supportsTextToVideo: true,
    capabilities: { supportsTextToVideo: true },
    supportedInputs: { durations: [3, 5] },
  },
  {
    provider: 'fal',
    name: 'kling-video',
    displayName: 'Kling Video',
    category: 'VIDEO',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 25,
    pricePerGeneration: 25,
    supportsTextToVideo: true,
    capabilities: { supportsTextToVideo: true },
    supportedInputs: { durations: [5, 10] },
  },
  {
    provider: 'fal',
    name: 'luma-dream-machine',
    displayName: 'Luma Dream Machine',
    category: 'VIDEO',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 30,
    pricePerGeneration: 30,
    supportsTextToVideo: true,
    capabilities: { supportsTextToVideo: true },
    supportedInputs: { durations: [5] },
  },
];

@Injectable()
export class ModelRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModelRegistryService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      for (const model of CENTRAL_MODEL_REGISTRY) {
        await this.prisma.aIModel.upsert({
          where: { provider_name: { provider: model.provider, name: model.name } },
          update: {
            displayName: model.displayName,
            category: model.category as any,
            supportsTextToImage: model.supportsTextToImage || false,
            supportsImageToImage: model.supportsImageToImage || false,
            supportsTextToVideo: model.supportsTextToVideo || false,
            supportsImageToVideo: model.supportsImageToVideo || false,
            supportsNegativePrompt: model.supportsNegativePrompt || false,
            supportsSeed: model.supportsSeed || false,
            maxResolution: model.maxResolution || null,
            maxDuration: model.maxDuration || null,
            defaultParams: {
              capabilities: model.capabilities,
              supportedInputs: model.supportedInputs,
            } as any,
          },
          create: {
            provider: model.provider,
            name: model.name,
            displayName: model.displayName,
            category: model.category as any,
            isFree: model.isFree,
            pricingType: model.pricingType,
            creditsPerGeneration: model.creditsPerGeneration,
            pricePerGeneration: model.pricePerGeneration,
            supportsTextToImage: model.supportsTextToImage || false,
            supportsImageToImage: model.supportsImageToImage || false,
            supportsTextToVideo: model.supportsTextToVideo || false,
            supportsImageToVideo: model.supportsImageToVideo || false,
            supportsNegativePrompt: model.supportsNegativePrompt || false,
            supportsSeed: model.supportsSeed || false,
            maxResolution: model.maxResolution || null,
            maxDuration: model.maxDuration || null,
            defaultParams: {
              capabilities: model.capabilities,
              supportedInputs: model.supportedInputs,
            } as any,
          },
        });
      }
      this.logger.log(
        `Central model registry initialized with ${CENTRAL_MODEL_REGISTRY.length} models`,
      );
    } catch (err: any) {
      this.logger.warn(`Model registry init skipped (DB may not be connected): ${err.message}`);
    }
  }

  /**
   * Get all active models, optionally filtered by category.
   */
  async getActiveModels(category?: string) {
    try {
      return await this.prisma.aIModel.findMany({
        where: { isActive: true, ...(category ? { category: category as any } : {}) },
        orderBy: [{ category: 'asc' }, { provider: 'asc' }],
      });
    } catch {
      const filtered = category
        ? CENTRAL_MODEL_REGISTRY.filter((m) => m.category === category.toUpperCase())
        : CENTRAL_MODEL_REGISTRY;
      return filtered.map((m, i) => ({
        id: String(i),
        ...m,
        isActive: true,
        version: null,
        defaultParams: {
          capabilities: m.capabilities,
          supportedInputs: m.supportedInputs,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }
  }

  /**
   * Find a model by its identifier and provider.
   */
  getModel(name: string, provider?: string): ModelRegistryEntry | undefined {
    return CENTRAL_MODEL_REGISTRY.find(
      (m) => m.name === name && (!provider || m.provider === provider),
    );
  }

  /**
   * Validate parameters according to the selected model.
   */
  validateModelParams(
    modelId: string,
    params: {
      prompt?: string;
      negativePrompt?: string;
      ratio?: string;
      aspectRatio?: string;
      duration?: number;
      resolution?: string;
      outputFormat?: string;
      image?: string;
      referenceImages?: any;
    },
  ): { valid: boolean; error?: string } {
    const model = CENTRAL_MODEL_REGISTRY.find((m) => m.name === modelId);
    if (!model) {
      // If it's a raw model identifier (e.g. org/model), allow standard execution
      return { valid: true };
    }

    // Validate prompt
    if (params.prompt !== undefined && (!params.prompt || !params.prompt.trim())) {
      return { valid: false, error: 'Prompt cannot be empty.' };
    }

    const { supportedInputs } = model;

    // Validate aspect ratio
    const ratio = params.ratio || params.aspectRatio;
    if (ratio && supportedInputs.aspectRatios && !supportedInputs.aspectRatios.includes(ratio)) {
      return {
        valid: false,
        error: `Aspect ratio '${ratio}' is not supported by model '${model.displayName}'. Supported: ${supportedInputs.aspectRatios.join(', ')}`,
      };
    }

    // Validate duration
    if (params.duration && supportedInputs.durations && !supportedInputs.durations.includes(params.duration)) {
      return {
        valid: false,
        error: `Duration '${params.duration}s' is not supported by model '${model.displayName}'. Supported: ${supportedInputs.durations.join(', ')}s`,
      };
    }

    // Validate resolution
    if (params.resolution && supportedInputs.resolutions && !supportedInputs.resolutions.includes(params.resolution)) {
      return {
        valid: false,
        error: `Resolution '${params.resolution}' is not supported by model '${model.displayName}'. Supported: ${supportedInputs.resolutions.join(', ')}`,
      };
    }

    // Validate output format
    if (params.outputFormat && supportedInputs.outputFormats && !supportedInputs.outputFormats.includes(params.outputFormat)) {
      return {
        valid: false,
        error: `Output format '${params.outputFormat}' is not supported by model '${model.displayName}'. Supported: ${supportedInputs.outputFormats.join(', ')}`,
      };
    }

    // Validate image-to-video capability
    const refImage = params.image || params.referenceImages;
    if (refImage && model.category === 'VIDEO' && model.capabilities?.supportsImageToVideo === false) {
      return {
        valid: false,
        error: `Model '${model.displayName}' does not support image-to-video generation.`,
      };
    }

    return { valid: true };
  }
}
