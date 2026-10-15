import { Injectable, OnModuleInit, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { REPLICATE_MODELS } from '../ai/providers/replicate.config';

export interface ModelCapability {
  supportsTextToImage?: boolean;
  supportsImageToImage?: boolean;
  supportsTextToVideo?: boolean;
  supportsImageToVideo?: boolean;
  supportsNegativePrompt?: boolean;
  supportsSeed?: boolean;
  supportsPromptEnhance?: boolean;
  supportsMultimodal?: boolean;
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

export interface ModelExample {
  title: string;
  description: string;
  samplePrompt: string;
}

export interface ModelRegistryEntry {
  provider: string;
  name: string; // Model ID
  displayName: string;
  category: 'IMAGE' | 'VIDEO' | 'TEXT' | 'AUDIO';
  isFree: boolean;
  pricingType: 'FREE TIER' | 'PAID' | 'USAGE-BASED' | 'PRO' | 'LOCAL';
  creditsPerGeneration: number;
  pricePerGeneration: number;
  description?: string;
  howItWorks?: string;
  bestFor?: string;
  strengths?: string[];
  limitations?: string[];
  inputTypes?: string[];
  outputTypes?: string[];
  supportedCapabilities?: string[];
  pricingReference?: string;
  documentationUrl?: string;
  requiresCredentials?: string;
  qualityScore?: number;
  speedScore?: string;
  costScore?: string;
  examples?: ModelExample[];
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
  // ─── OFFICIAL REPLICATE CURATED MODELS ─────────────────────────────────
  ...(REPLICATE_MODELS.image as ModelRegistryEntry[]),
  ...(REPLICATE_MODELS.video as ModelRegistryEntry[]),

  // ─── VERIFIED OPENAI MODELS HOSTED ON REPLICATE ────────────────────────
  {
    provider: 'replicate',
    name: 'openai/gpt-4o',
    displayName: 'ChatGPT GPT-4o (Replicate)',
    category: 'TEXT',
    isFree: false,
    pricingType: 'USAGE-BASED',
    creditsPerGeneration: 5,
    pricePerGeneration: 5,
    supportsTextToImage: false,
    description: "OpenAI's flagship ChatGPT multimodal model hosted on Replicate for prompt enhancement, high-converting copy, image understanding, and campaign strategy.",
    howItWorks: 'Processes text and image inputs via Replicate unified cloud API infrastructure with 128k context length.',
    bestFor: 'Viral social copy, image understanding, complex prompt expansion, campaign ideation, and multi-channel marketing scripts.',
    strengths: [
      'State-of-the-art reasoning and nuance comprehension',
      'Advanced vision and image understanding',
      'Unified Replicate API execution alongside FLUX and video models',
      'Adaptable brand voice and tone matching'
    ],
    limitations: [
      'Text and multimodal reasoning engine; does not render raw video or raster pixels directly',
      'Usage-based billing via Replicate API'
    ],
    inputTypes: ['Text Prompt', 'Images (Vision)', 'Tone / Target Platform'],
    outputTypes: ['Text / Structured JSON / Enhanced Prompts'],
    supportedCapabilities: ['Text & Prompts', 'Image Understanding', 'Prompt Enhancement', 'Copywriting'],
    pricingReference: 'Replicate catalog: ~$0.005 / generation (5 credits)',
    documentationUrl: 'https://replicate.com/openai/gpt-4o',
    requiresCredentials: 'REPLICATE_API_TOKEN',
    qualityScore: 9.9,
    speedScore: 'Fast (1-3s)',
    costScore: '~$0.005 / gen',
    examples: [
      {
        title: 'Campaign Copywriting',
        description: 'Creates viral multi-platform copy tailored for Instagram, LinkedIn, and X.',
        samplePrompt: 'Write a high-converting Instagram caption for our new sustainable luxury sneaker launch, with engaging hook, storytelling body, and call-to-action.'
      },
      {
        title: 'Master Prompt Engineering',
        description: 'Expands rough user concepts into master prompts for FLUX or Kling.',
        samplePrompt: 'Transform this prompt into an ultra-detailed FLUX 1.1 Pro prompt with camera lens specifications, lighting setup, and materials: "luxury watch on table".'
      }
    ],
    capabilities: {
      supportsPromptEnhance: true,
      supportsMultimodal: true,
    },
    supportedInputs: {
      supportsReferenceImage: true,
    },
  },
  {
    provider: 'replicate',
    name: 'openai/gpt-4o-mini',
    displayName: 'ChatGPT GPT-4o mini (Replicate)',
    category: 'TEXT',
    isFree: false,
    pricingType: 'USAGE-BASED',
    creditsPerGeneration: 2,
    pricePerGeneration: 2,
    supportsTextToImage: false,
    description: 'Fast, cost-efficient intelligence engine hosted on Replicate for instant prompt rewriting, social captions, and hashtag clustering.',
    howItWorks: 'Distilled multimodal architecture on Replicate delivering sub-second response times with strong instruction adherence and cost efficiency.',
    bestFor: 'High-frequency caption generation, hashtag discovery, prompt optimization, and instant social drafts.',
    strengths: [
      'Sub-second latency (under 1s)',
      'Highly economical Replicate compute pricing',
      'Crisp instruction-following format',
      'Reliable JSON output structure'
    ],
    limitations: [
      'Slightly lower creative depth than GPT-4o for long narrative scripts'
    ],
    inputTypes: ['Text Prompt', 'Platform Target', 'Tone'],
    outputTypes: ['Text / Captions / Hashtags'],
    supportedCapabilities: ['Text & Prompts', 'Fast Inference (<1s)', 'Hashtags', 'Prompt Enhancement'],
    pricingReference: 'Replicate catalog: ~$0.001 / generation (2 credits)',
    documentationUrl: 'https://replicate.com/openai/gpt-4o-mini',
    requiresCredentials: 'REPLICATE_API_TOKEN',
    qualityScore: 9.2,
    speedScore: 'Instant (<1s)',
    costScore: '~$0.001 / gen',
    examples: [
      {
        title: 'Instant Social Captions',
        description: 'Generates 3 engaging caption variations with hashtag clusters in under a second.',
        samplePrompt: 'Generate 3 engaging captions for a travel photo of sunset in Santorini with 15 relevant hashtags.'
      }
    ],
    capabilities: {
      supportsPromptEnhance: true,
    },
    supportedInputs: {},
  },

  // ─── OFFICIAL GOOGLE GEMINI CURATED TEXT MODELS ─────────────────────────
  {
    provider: 'gemini',
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    category: 'TEXT',
    isFree: true,
    pricingType: 'FREE TIER',
    creditsPerGeneration: 0,
    pricePerGeneration: 0,
    supportsTextToImage: false,
    description: "Google's lightweight, high-speed multimodal workhorse with 1M token context, ideal for fast captions, prompt expansion, and visual inspection.",
    howItWorks: 'Sparse Mixture-of-Experts (MoE) architecture designed for high throughput, sub-second latency, and multimodal comprehension.',
    bestFor: 'Automated social post drafts, instant prompt expansion, visual asset tagging, and multi-image comparison.',
    strengths: [
      'Generous free tier available in Google AI Studio',
      'Massive 1,000,000 token context window',
      'High-speed inference and sub-second generation',
      'Exceptional multimodal image inspection'
    ],
    limitations: [
      'Text and multimodal model; does not directly produce raw image pixels',
      'Direct Google AI Studio endpoint; not hosted as a standalone first-party model on Replicate'
    ],
    inputTypes: ['Text Prompt', 'Image Input', 'Tone Settings'],
    outputTypes: ['Text / Captions / Analysis'],
    supportedCapabilities: ['Text & Prompts', 'Image Understanding', 'Free Tier Available', 'Prompt Expansion'],
    pricingReference: 'Google AI Studio: Free tier up to 15 RPM; paid tier $0.075 / 1M input tokens (0 credits)',
    documentationUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    requiresCredentials: 'GEMINI_API_KEY',
    qualityScore: 9.3,
    speedScore: 'Instant (<1s)',
    costScore: 'Free tier available',
    examples: [
      {
        title: 'Visual Content Analysis',
        description: 'Analyzes uploaded creative assets and writes matching social captions.',
        samplePrompt: 'Analyze this product image and write a caption highlighting its key features for Instagram Reels.'
      }
    ],
    capabilities: {
      supportsPromptEnhance: true,
      supportsMultimodal: true,
    },
    supportedInputs: {
      supportsReferenceImage: true,
    },
  },
  {
    provider: 'gemini',
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    category: 'TEXT',
    isFree: false,
    pricingType: 'USAGE-BASED',
    creditsPerGeneration: 4,
    pricePerGeneration: 4,
    supportsTextToImage: false,
    description: "Google's flagship multimodal reasoning engine with a breakthrough 2M token context window for deep visual analysis and complex campaigns.",
    howItWorks: 'Massive Mixture-of-Experts model trained on cross-modal tokens capable of analyzing entire brand books, hours of video, or thousands of images.',
    bestFor: 'Comprehensive content strategies, detailed visual critique, multi-slide social campaigns, and brand voice adherence.',
    strengths: [
      'Breakthrough 2,000,000 token context window',
      'World-class multimodal understanding',
      'Complex logical reasoning and analysis',
      'Nuanced creative writing in dozens of languages'
    ],
    limitations: [
      'Slower inference than Flash',
      'Text & multimodal analysis only',
      'Direct Google AI Studio endpoint; not hosted as a standalone first-party model on Replicate'
    ],
    inputTypes: ['Text Prompt', 'Images / Video Clips', 'Documents'],
    outputTypes: ['Text / Structured Strategy / Copy'],
    supportedCapabilities: ['Text & Prompts', 'Image Understanding', '2M Context Window', 'Multimodal Reasoning'],
    pricingReference: 'Google AI Studio: $1.25 / 1M input tokens up to 128k (4 credits)',
    documentationUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    requiresCredentials: 'GEMINI_API_KEY',
    qualityScore: 9.8,
    speedScore: 'Moderate (2-4s)',
    costScore: '$1.25 / 1M tokens',
    examples: [
      {
        title: 'Omnichannel Campaign Plan',
        description: 'Develops full multi-week content calendars from raw brand briefs.',
        samplePrompt: 'Develop a 4-week product launch content calendar for our fitness app, including Instagram carousel concepts, TikTok hooks, and LinkedIn thought leadership posts.'
      }
    ],
    capabilities: {
      supportsPromptEnhance: true,
      supportsMultimodal: true,
    },
    supportedInputs: {
      supportsReferenceImage: true,
    },
  },

  // ─── FAL.AI PRESERVED MODELS ───────────────────────────────────────────
  {
    provider: 'fal',
    name: 'flux-pro',
    displayName: 'FLUX Pro (Fal.ai)',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 10,
    pricePerGeneration: 10,
    supportsTextToImage: true,
    supportsNegativePrompt: true,
    maxResolution: '2048x2048',
    description: 'High-speed FLUX Pro inference hosted on Fal.ai with dedicated GPU scaling.',
    howItWorks: 'High-throughput cloud endpoints optimized for low latency FLUX 1.0 synthesis.',
    bestFor: 'Real-time studio generation and responsive design workflows.',
    strengths: ['Low latency on Fal.ai cloud', 'High resolution generation', 'Negative prompt support'],
    limitations: ['Requires Fal.ai API key'],
    inputTypes: ['Text Prompt', 'Aspect Ratio'],
    outputTypes: ['Image (WebP / JPEG / PNG)'],
    supportedCapabilities: ['Text-to-Image', 'High Resolution', 'Fast Inference'],
    pricingReference: 'Fal.ai catalog: ~$0.05 per image (10 credits)',
    documentationUrl: 'https://fal.ai/models/fal-ai/flux-pro',
    requiresCredentials: 'FAL_KEY',
    qualityScore: 9.6,
    speedScore: 'Fast (3-5s)',
    costScore: '~$0.05 / gen',
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: true },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: true },
  },
  {
    provider: 'fal',
    name: 'wan-t2v',
    displayName: 'Wan T2V (Fal.ai)',
    category: 'VIDEO',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 20,
    pricePerGeneration: 20,
    supportsTextToVideo: true,
    maxResolution: '720p',
    maxDuration: 5,
    description: 'Wan 2.1 video generation on Fal.ai with fast GPU spin-up.',
    howItWorks: 'Wan 2.1 diffusion architecture executed on Fal serverless GPU infrastructure.',
    bestFor: 'Social video shorts and rapid motion concepts.',
    strengths: ['Rapid GPU cold start', 'Reliable motion rendering'],
    limitations: ['5s max clip duration'],
    inputTypes: ['Text Prompt', 'Duration'],
    outputTypes: ['Video (MP4)'],
    supportedCapabilities: ['Text-to-Video', 'Social Video'],
    pricingReference: 'Fal.ai catalog: ~$0.08 per video (20 credits)',
    documentationUrl: 'https://fal.ai/models/fal-ai/wan-t2v',
    requiresCredentials: 'FAL_KEY',
    qualityScore: 9.0,
    speedScore: 'Queued (40-70s)',
    costScore: '~$0.08 / gen',
    capabilities: { supportsTextToVideo: true },
    supportedInputs: { durations: [3, 5] },
  },
  {
    provider: 'fal',
    name: 'kling-video',
    displayName: 'Kling Video (Fal.ai)',
    category: 'VIDEO',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 25,
    pricePerGeneration: 25,
    supportsTextToVideo: true,
    maxResolution: '1080p',
    maxDuration: 10,
    description: 'Kling cinematic video synthesis powered by Fal.ai inference pipeline.',
    howItWorks: 'High-motion video transformer for cinematic b-roll and animations.',
    bestFor: 'Cinematic shorts and camera movements.',
    strengths: ['1080p HD', 'Smooth camera pan'],
    limitations: ['Higher compute cost'],
    inputTypes: ['Text Prompt', 'Duration'],
    outputTypes: ['Video (MP4)'],
    supportedCapabilities: ['Text-to-Video', '1080p HD'],
    pricingReference: 'Fal.ai catalog: ~$0.12 per video (25 credits)',
    documentationUrl: 'https://fal.ai/models/fal-ai/kling-video',
    requiresCredentials: 'FAL_KEY',
    qualityScore: 9.4,
    speedScore: 'Queued (60-100s)',
    costScore: '~$0.12 / gen',
    capabilities: { supportsTextToVideo: true },
    supportedInputs: { durations: [5, 10] },
  },

  // ─── HUGGINGFACE PRESERVED MODELS ──────────────────────────────────────
  {
    provider: 'huggingface',
    name: 'flux-schnell',
    displayName: 'FLUX Schnell (HF)',
    category: 'IMAGE',
    isFree: true,
    pricingType: 'FREE TIER',
    creditsPerGeneration: 0,
    pricePerGeneration: 0,
    supportsTextToImage: true,
    supportsNegativePrompt: true,
    maxResolution: '1024x1024',
    description: 'Free-tier serverless FLUX Schnell inference via Hugging Face Inference API.',
    howItWorks: 'Community-accessible serverless inference endpoint on HuggingFace Hub.',
    bestFor: 'Prototyping, testing, and free generation without API credit charges.',
    strengths: ['Free tier access', 'Fast 4-step generation'],
    limitations: ['Rate limits apply on free HuggingFace endpoints'],
    inputTypes: ['Text Prompt', 'Aspect Ratio'],
    outputTypes: ['Image (WebP / JPEG / PNG)'],
    supportedCapabilities: ['Text-to-Image', 'Free Tier Available'],
    pricingReference: 'Hugging Face Serverless Inference: Free tier (0 credits)',
    documentationUrl: 'https://huggingface.co/black-forest-labs/FLUX.1-schnell',
    requiresCredentials: 'HUGGINGFACE_API_TOKEN',
    qualityScore: 9.0,
    speedScore: 'Fast (3-6s)',
    costScore: 'Free tier available',
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: true },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: true },
  },
  {
    provider: 'huggingface',
    name: 'sdxl',
    displayName: 'SDXL 1.0 (HF)',
    category: 'IMAGE',
    isFree: false,
    pricingType: 'PAID',
    creditsPerGeneration: 4,
    pricePerGeneration: 4,
    supportsTextToImage: true,
    supportsNegativePrompt: true,
    maxResolution: '1024x1024',
    description: 'Hugging Face hosted Stable Diffusion XL 1.0 model with full negative prompt support.',
    howItWorks: 'Hosted inference endpoint running stabilityai/stable-diffusion-xl-base-1.0.',
    bestFor: 'Stylized illustrations, artwork, and negative prompt filtering.',
    strengths: ['Negative prompts', 'Diverse styles'],
    limitations: ['Standard latency'],
    inputTypes: ['Text Prompt', 'Negative Prompt', 'Aspect Ratio'],
    outputTypes: ['Image (PNG / JPEG)'],
    supportedCapabilities: ['Text-to-Image', 'Negative Prompting'],
    pricingReference: 'Hugging Face Inference: 4 credits per generation',
    documentationUrl: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0',
    requiresCredentials: 'HUGGINGFACE_API_TOKEN',
    qualityScore: 8.7,
    speedScore: 'Fast (4-7s)',
    costScore: '4 credits',
    capabilities: { supportsTextToImage: true, supportsNegativePrompt: true },
    supportedInputs: { aspectRatios: ['1:1', '16:9', '9:16'], supportsNegativePrompt: true },
  },

  // ─── REPLICATE ALIAS MODELS (FOR BACKWARDS COMPATIBILITY) ──────────────
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
    description: 'High-efficiency fast image generation alias mapped to FLUX Schnell.',
    howItWorks: 'Routes to Replicate FLUX Schnell pipeline with optimized parameter mappings.',
    bestFor: 'Fast social media graphics and concepts.',
    strengths: ['Fast execution', 'Economical credits'],
    limitations: ['No high-res 2k'],
    inputTypes: ['Text Prompt', 'Aspect Ratio'],
    outputTypes: ['Image (WebP / JPEG / PNG)'],
    supportedCapabilities: ['Text-to-Image', 'Fast Generation'],
    pricingReference: 'Replicate alias: 5 credits',
    documentationUrl: 'https://replicate.com/explore',
    requiresCredentials: 'REPLICATE_API_TOKEN',
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
    description: 'Premium photorealism alias mapped to FLUX 1.1 Pro.',
    howItWorks: 'Routes to Replicate FLUX 1.1 Pro pipeline with 2K resolution capability.',
    bestFor: 'Commercial photography and product shots.',
    strengths: ['2048x2048 support', 'Commercial photorealism'],
    limitations: ['Moderate latency'],
    inputTypes: ['Text Prompt', 'Aspect Ratio'],
    outputTypes: ['Image (WebP / JPEG / PNG)'],
    supportedCapabilities: ['Text-to-Image', 'Commercial Grade', '2K Resolution'],
    pricingReference: 'Replicate alias: 8 credits',
    documentationUrl: 'https://replicate.com/explore',
    requiresCredentials: 'REPLICATE_API_TOKEN',
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
    description: 'Video generation alias mapped to Wan 2.1 video pipeline.',
    howItWorks: 'Routes to Replicate Wan 2.1 pipeline.',
    bestFor: 'Short form social video.',
    strengths: ['Smooth motion', 'Cohesive animation'],
    limitations: ['Standard latency'],
    inputTypes: ['Text Prompt', 'Duration'],
    outputTypes: ['Video (MP4)'],
    supportedCapabilities: ['Text-to-Video'],
    pricingReference: 'Replicate alias: 20 credits',
    documentationUrl: 'https://replicate.com/explore',
    requiresCredentials: 'REPLICATE_API_TOKEN',
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
    description: 'Cinematic video alias mapped to Kling v1.6 Standard.',
    howItWorks: 'Routes to Replicate Kling v1.6 pipeline with full HD rendering.',
    bestFor: 'Cinematic b-roll and animations.',
    strengths: ['1080p Full HD', 'Dynamic motion'],
    limitations: ['Queued processing'],
    inputTypes: ['Text Prompt', 'Duration'],
    outputTypes: ['Video (MP4)'],
    supportedCapabilities: ['Text-to-Video', '1080p Full HD'],
    pricingReference: 'Replicate alias: 30 credits',
    documentationUrl: 'https://replicate.com/explore',
    requiresCredentials: 'REPLICATE_API_TOKEN',
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
];

@Injectable()
export class ModelRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModelRegistryService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      for (const model of CENTRAL_MODEL_REGISTRY) {
        const metadataPayload = {
          capabilities: model.capabilities,
          supportedInputs: model.supportedInputs,
          description: model.description,
          howItWorks: model.howItWorks,
          bestFor: model.bestFor,
          strengths: model.strengths,
          limitations: model.limitations,
          inputTypes: model.inputTypes,
          outputTypes: model.outputTypes,
          supportedCapabilities: model.supportedCapabilities,
          pricingReference: model.pricingReference,
          documentationUrl: model.documentationUrl,
          requiresCredentials: model.requiresCredentials,
          qualityScore: model.qualityScore,
          speedScore: model.speedScore,
          costScore: model.costScore,
          examples: model.examples,
        };

        await this.prisma.aIModel.upsert({
          where: { provider_name: { provider: model.provider, name: model.name } },
          update: {
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
            defaultParams: metadataPayload as any,
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
            defaultParams: metadataPayload as any,
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
   * Merges rich metadata directly from defaultParams into response.
   */
  async getActiveModels(category?: string) {
    try {
      const dbModels = await this.prisma.aIModel.findMany({
        where: { isActive: true, ...(category ? { category: category.toUpperCase() as any } : {}) },
        orderBy: [{ category: 'asc' }, { provider: 'asc' }],
      });

      return dbModels.map((m) => {
        const meta = (m.defaultParams as any) || {};
        return {
          ...m,
          ...meta,
          capabilities: meta.capabilities || {
            supportsTextToImage: m.supportsTextToImage,
            supportsImageToImage: m.supportsImageToImage,
            supportsTextToVideo: m.supportsTextToVideo,
            supportsImageToVideo: m.supportsImageToVideo,
            supportsNegativePrompt: m.supportsNegativePrompt,
            supportsSeed: m.supportsSeed,
            maxResolution: m.maxResolution,
            maxDuration: m.maxDuration,
          },
          supportedInputs: meta.supportedInputs || {},
        };
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
          description: m.description,
          howItWorks: m.howItWorks,
          bestFor: m.bestFor,
          strengths: m.strengths,
          limitations: m.limitations,
          inputTypes: m.inputTypes,
          outputTypes: m.outputTypes,
          supportedCapabilities: m.supportedCapabilities,
          pricingReference: m.pricingReference,
          documentationUrl: m.documentationUrl,
          requiresCredentials: m.requiresCredentials,
          qualityScore: m.qualityScore,
          speedScore: m.speedScore,
          costScore: m.costScore,
          examples: m.examples,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }
  }

  /**
   * Return configuration and health status of all supported AI model providers.
   */
  getProvidersStatus() {
    const replicateConfigured = !!(
      this.config.get<string>('REPLICATE_API_TOKEN') ||
      this.config.get<string>('ai.replicate')
    );
    const openaiConfigured = !!(
      this.config.get<string>('OPENAI_API_KEY') ||
      this.config.get<string>('ai.openai')
    );
    const geminiConfigured = !!(
      this.config.get<string>('GEMINI_API_KEY') ||
      this.config.get<string>('GOOGLE_AI_API_KEY') ||
      this.config.get<string>('ai.gemini') ||
      this.config.get<string>('ai.google')
    );
    const falConfigured = !!(
      this.config.get<string>('FAL_KEY') ||
      this.config.get<string>('ai.fal')
    );
    const hfConfigured = !!(
      this.config.get<string>('HUGGINGFACE_API_TOKEN') ||
      this.config.get<string>('HF_TOKEN') ||
      this.config.get<string>('ai.huggingface')
    );

    return [
      {
        id: 'replicate',
        name: 'Replicate',
        configured: replicateConfigured,
        envVar: 'REPLICATE_API_TOKEN',
        description: 'Host and run open-source AI models at scale via cloud API',
        categories: ['IMAGE', 'VIDEO', 'TEXT'],
        modelsCount: CENTRAL_MODEL_REGISTRY.filter((m) => m.provider === 'replicate').length,
      },
      {
        id: 'openai',
        name: 'OpenAI / ChatGPT',
        configured: openaiConfigured,
        envVar: 'OPENAI_API_KEY',
        description: 'Pioneering frontier models including DALL-E 3, GPT-4o, and GPT-4o-mini',
        categories: ['IMAGE', 'TEXT', 'MULTIMODAL'],
        modelsCount: CENTRAL_MODEL_REGISTRY.filter((m) => m.provider === 'openai').length,
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        configured: geminiConfigured,
        envVar: 'GEMINI_API_KEY',
        description: 'Google DeepMind flagship models including Imagen 3 and Gemini 1.5 Flash/Pro',
        categories: ['IMAGE', 'TEXT', 'MULTIMODAL'],
        modelsCount: CENTRAL_MODEL_REGISTRY.filter((m) => m.provider === 'gemini').length,
      },
      {
        id: 'fal',
        name: 'Fal.ai',
        configured: falConfigured,
        envVar: 'FAL_KEY',
        description: 'High-speed generative media inference platform',
        categories: ['IMAGE', 'VIDEO'],
        modelsCount: CENTRAL_MODEL_REGISTRY.filter((m) => m.provider === 'fal').length,
      },
      {
        id: 'huggingface',
        name: 'Hugging Face',
        configured: hfConfigured,
        envVar: 'HUGGINGFACE_API_TOKEN',
        description: 'Open-source ML community hub and Serverless Inference API',
        categories: ['IMAGE'],
        modelsCount: CENTRAL_MODEL_REGISTRY.filter((m) => m.provider === 'huggingface').length,
      },
    ];
  }

  /**
   * Find a model by its identifier and provider.
   */
  getModel(name: string, provider?: string): ModelRegistryEntry | undefined {
    let target = name;
    if (name === 'chatgpt' || name === 'chatgpt-image' || name === 'dall-e-3') {
      target = 'openai/dall-e-3';
    } else if (name === 'gemini' || name === 'gemini-image' || name === 'google-gemini' || name === 'imagen-3') {
      target = 'google/imagen-3';
    } else if (name === 'imagen-3-fast') {
      target = 'google/imagen-3-fast';
    } else if (name === 'gpt-4o') {
      target = 'openai/gpt-4o';
    } else if (name === 'gpt-4o-mini') {
      target = 'openai/gpt-4o-mini';
    }
    return CENTRAL_MODEL_REGISTRY.find(
      (m) => (m.name === name || m.name === target) && (!provider || m.provider === provider || provider === 'replicate'),
    );
  }

  /**
   * Retrieve full details for a single model by identifier or display name.
   */
  getModelDetails(name: string): ModelRegistryEntry {
    let target = name;
    if (name === 'chatgpt' || name === 'chatgpt-image' || name === 'dall-e-3') {
      target = 'openai/dall-e-3';
    } else if (name === 'gemini' || name === 'gemini-image' || name === 'google-gemini' || name === 'imagen-3') {
      target = 'google/imagen-3';
    } else if (name === 'imagen-3-fast') {
      target = 'google/imagen-3-fast';
    } else if (name === 'gpt-4o') {
      target = 'openai/gpt-4o';
    } else if (name === 'gpt-4o-mini') {
      target = 'openai/gpt-4o-mini';
    }
    const model = CENTRAL_MODEL_REGISTRY.find(
      (m) =>
        m.name === name ||
        m.name === target ||
        m.displayName.toLowerCase() === name.toLowerCase(),
    );
    if (!model) {
      throw new NotFoundException(`Model '${name}' not found in registry.`);
    }
    return model;
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
      return { valid: true };
    }

    if (params.prompt !== undefined && (!params.prompt || !params.prompt.trim())) {
      return { valid: false, error: 'Prompt cannot be empty.' };
    }

    const { supportedInputs } = model;

    const ratio = params.ratio || params.aspectRatio;
    if (ratio && supportedInputs.aspectRatios && !supportedInputs.aspectRatios.includes(ratio)) {
      return {
        valid: false,
        error: `Aspect ratio '${ratio}' is not supported by model '${model.displayName}'. Supported: ${supportedInputs.aspectRatios.join(', ')}`,
      };
    }

    if (params.duration && supportedInputs.durations && !supportedInputs.durations.includes(params.duration)) {
      return {
        valid: false,
        error: `Duration '${params.duration}s' is not supported by model '${model.displayName}'. Supported: ${supportedInputs.durations.join(', ')}s`,
      };
    }

    if (params.resolution && supportedInputs.resolutions && !supportedInputs.resolutions.includes(params.resolution)) {
      return {
        valid: false,
        error: `Resolution '${params.resolution}' is not supported by model '${model.displayName}'. Supported: ${supportedInputs.resolutions.join(', ')}`,
      };
    }

    if (params.outputFormat && supportedInputs.outputFormats && !supportedInputs.outputFormats.includes(params.outputFormat)) {
      return {
        valid: false,
        error: `Output format '${params.outputFormat}' is not supported by model '${model.displayName}'. Supported: ${supportedInputs.outputFormats.join(', ')}`,
      };
    }

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
