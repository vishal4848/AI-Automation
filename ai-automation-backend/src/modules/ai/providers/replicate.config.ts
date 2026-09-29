export interface ReplicateModelConfig {
  provider: 'replicate';
  name: string;
  modelIdentifier: string;
  displayName: string;
  category: 'IMAGE' | 'VIDEO';
  generationType: 'IMAGE' | 'VIDEO';
  isFree: boolean;
  pricePerGeneration: number;
  creditsPerGeneration: number;
  pricingType: 'FREE TIER' | 'PAID' | 'PRO';
  supportsTextToImage?: boolean;
  supportsImageToImage?: boolean;
  supportsTextToVideo?: boolean;
  supportsImageToVideo?: boolean;
  supportsReferenceImage?: boolean;
  supportsNegativePrompt?: boolean;
  supportsSeed?: boolean;
  outputType: string;
  enabled: boolean;
  maxResolution?: string;
  maxDuration?: number;
  capabilities: {
    supportsTextToImage?: boolean;
    supportsImageToImage?: boolean;
    supportsTextToVideo?: boolean;
    supportsImageToVideo?: boolean;
    supportsNegativePrompt?: boolean;
    supportsSeed?: boolean;
    maxResolution?: string;
    maxDuration?: number;
  };
  supportedInputs: {
    aspectRatios?: string[];
    outputFormats?: string[];
    resolutions?: string[];
    durations?: number[];
    supportsReferenceImage?: boolean;
    supportsNegativePrompt?: boolean;
  };
}

export const REPLICATE_MODELS: {
  image: ReplicateModelConfig[];
  video: ReplicateModelConfig[];
} = {
  image: [
    {
      provider: 'replicate',
      name: 'black-forest-labs/flux-schnell',
      modelIdentifier: 'black-forest-labs/flux-schnell',
      displayName: 'FLUX Schnell (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 5,
      creditsPerGeneration: 5,
      pricingType: 'PAID',
      supportsTextToImage: true,
      supportsImageToImage: false,
      supportsReferenceImage: false,
      supportsNegativePrompt: false,
      supportsSeed: true,
      outputType: 'image/webp',
      enabled: true,
      maxResolution: '1024x1024',
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: false,
        supportsNegativePrompt: false,
        supportsSeed: true,
        maxResolution: '1024x1024',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2', '21:9'],
        outputFormats: ['webp', 'jpg', 'png'],
        supportsReferenceImage: false,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'black-forest-labs/flux-1.1-pro',
      modelIdentifier: 'black-forest-labs/flux-1.1-pro',
      displayName: 'FLUX 1.1 Pro (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 8,
      creditsPerGeneration: 8,
      pricingType: 'PRO',
      supportsTextToImage: true,
      supportsImageToImage: true,
      supportsReferenceImage: true,
      supportsNegativePrompt: false,
      supportsSeed: true,
      outputType: 'image/webp',
      enabled: true,
      maxResolution: '2048x2048',
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: true,
        supportsNegativePrompt: false,
        supportsSeed: true,
        maxResolution: '2048x2048',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2', '21:9'],
        outputFormats: ['webp', 'jpg', 'png'],
        supportsReferenceImage: true,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'black-forest-labs/flux-dev',
      modelIdentifier: 'black-forest-labs/flux-dev',
      displayName: 'FLUX Dev (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 6,
      creditsPerGeneration: 6,
      pricingType: 'PAID',
      supportsTextToImage: true,
      supportsImageToImage: true,
      supportsReferenceImage: true,
      supportsNegativePrompt: false,
      supportsSeed: true,
      outputType: 'image/webp',
      enabled: true,
      maxResolution: '1024x1024',
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: true,
        supportsNegativePrompt: false,
        supportsSeed: true,
        maxResolution: '1024x1024',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2'],
        outputFormats: ['webp', 'jpg', 'png'],
        supportsReferenceImage: true,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'stability-ai/sdxl',
      modelIdentifier: 'stability-ai/sdxl',
      displayName: 'SDXL 1.0 (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 5,
      creditsPerGeneration: 5,
      pricingType: 'PAID',
      supportsTextToImage: true,
      supportsImageToImage: true,
      supportsReferenceImage: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      outputType: 'image/png',
      enabled: true,
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
        outputFormats: ['png', 'jpg', 'webp'],
        supportsReferenceImage: true,
        supportsNegativePrompt: true,
      },
    },
  ],
  video: [
    {
      provider: 'replicate',
      name: 'wan-video/wan-2.1-t2v-480p',
      modelIdentifier: 'wan-video/wan-2.1-t2v-480p',
      displayName: 'WAN 2.1 T2V 480p (Replicate)',
      category: 'VIDEO',
      generationType: 'VIDEO',
      isFree: false,
      pricePerGeneration: 20,
      creditsPerGeneration: 20,
      pricingType: 'PAID',
      supportsTextToVideo: true,
      supportsImageToVideo: false,
      supportsReferenceImage: false,
      outputType: 'video/mp4',
      enabled: true,
      maxResolution: '480p',
      maxDuration: 5,
      capabilities: {
        supportsTextToVideo: true,
        supportsImageToVideo: false,
        maxResolution: '480p',
        maxDuration: 5,
      },
      supportedInputs: {
        aspectRatios: ['16:9', '9:16', '1:1'],
        resolutions: ['480p'],
        durations: [5],
        supportsReferenceImage: false,
      },
    },
    {
      provider: 'replicate',
      name: 'kwaivgi/kling-v1.6-standard',
      modelIdentifier: 'kwaivgi/kling-v1.6-standard',
      displayName: 'Kling v1.6 Standard (Replicate)',
      category: 'VIDEO',
      generationType: 'VIDEO',
      isFree: false,
      pricePerGeneration: 30,
      creditsPerGeneration: 30,
      pricingType: 'PRO',
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      supportsReferenceImage: true,
      outputType: 'video/mp4',
      enabled: true,
      maxResolution: '1080p',
      maxDuration: 10,
      capabilities: {
        supportsTextToVideo: true,
        supportsImageToVideo: true,
        maxResolution: '1080p',
        maxDuration: 10,
      },
      supportedInputs: {
        aspectRatios: ['16:9', '9:16', '1:1'],
        resolutions: ['720p', '1080p'],
        durations: [5, 10],
        supportsReferenceImage: true,
      },
    },
    {
      provider: 'replicate',
      name: 'minimax/video-01',
      modelIdentifier: 'minimax/video-01',
      displayName: 'MiniMax Video-01 (Replicate)',
      category: 'VIDEO',
      generationType: 'VIDEO',
      isFree: false,
      pricePerGeneration: 25,
      creditsPerGeneration: 25,
      pricingType: 'PAID',
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      supportsReferenceImage: true,
      outputType: 'video/mp4',
      enabled: true,
      maxResolution: '720p',
      maxDuration: 6,
      capabilities: {
        supportsTextToVideo: true,
        supportsImageToVideo: true,
        maxResolution: '720p',
        maxDuration: 6,
      },
      supportedInputs: {
        aspectRatios: ['16:9', '9:16', '1:1'],
        resolutions: ['720p'],
        durations: [6],
        supportsReferenceImage: true,
      },
    },
  ],
};
