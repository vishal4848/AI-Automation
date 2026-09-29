import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';
import {
  AIProvider,
  GenerateImageParams,
  GenerateVideoParams,
  EnhancePromptParams,
  AIProviderResponse,
  GeneratedImageResult,
  GeneratedVideoResult,
} from '../../providers/base/ai-provider.interface';
import { REPLICATE_MODELS } from './replicate.config';
import {
  REPLICATE_ERRORS,
  ReplicateImageInput,
  ReplicateVideoInput,
} from './replicate.types';

export { REPLICATE_ERRORS } from './replicate.types';
export type { ReplicateImageInput, ReplicateVideoInput } from './replicate.types';

@Injectable()
export class ReplicateProvider implements AIProvider {
  readonly name = 'replicate';
  private readonly logger = new Logger(ReplicateProvider.name);

  readonly supportedImageModels: string[] = [
    'black-forest-labs/flux-schnell',
    'black-forest-labs/flux-1.1-pro',
    'black-forest-labs/flux-dev',
    'stability-ai/sdxl',
    'nano-banana-2',
    'nano-banana-pro',
    'flux-2-max',
    'qwen-image-3-pro',
  ];

  readonly supportedVideoModels: string[] = [
    'wan-video/wan-2.1-t2v-480p',
    'kwaivgi/kling-v1.6-standard',
    'minimax/video-01',
    'wan-3',
    'seedance',
    'kling',
    'veo',
  ];

  // Map application/registry model aliases to official Replicate model identifiers
  private readonly MODEL_MAP: Record<string, string> = {
    'nano-banana-2': 'black-forest-labs/flux-schnell',
    'nano-banana-pro': 'black-forest-labs/flux-1.1-pro',
    'flux-2-max': 'black-forest-labs/flux-1.1-pro',
    'qwen-image-3-pro': 'black-forest-labs/flux-dev',
    'black-forest-labs/flux-schnell': 'black-forest-labs/flux-schnell',
    'black-forest-labs/flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
    'black-forest-labs/flux-dev': 'black-forest-labs/flux-dev',
    'stability-ai/sdxl': 'stability-ai/sdxl',
    'wan-3': 'wan-video/wan-2.1-t2v-480p',
    'seedance': 'minimax/video-01',
    'kling': 'kwaivgi/kling-v1.6-standard',
    'veo': 'google/veo',
    'wan-video/wan-2.1-t2v-480p': 'wan-video/wan-2.1-t2v-480p',
    'kwaivgi/kling-v1.6-standard': 'kwaivgi/kling-v1.6-standard',
    'minimax/video-01': 'minimax/video-01',
  };

  constructor(private readonly config: ConfigService) {}

  /**
   * Check if Replicate API token is configured.
   */
  isAvailable(): boolean {
    return !!this.getToken();
  }

  /**
   * Retrieve API token securely without exposing it.
   */
  private getToken(): string | undefined {
    return (
      this.config.get<string>('REPLICATE_API_TOKEN') ||
      this.config.get<string>('ai.replicate')
    );
  }

  /**
   * Get configured default image model.
   */
  private getDefaultImageModel(): string {
    return (
      this.config.get<string>('REPLICATE_IMAGE_MODEL') ||
      this.config.get<string>('ai.replicateImageModel') ||
      'black-forest-labs/flux-schnell'
    );
  }

  /**
   * Get configured default video model.
   */
  private getDefaultVideoModel(): string {
    return (
      this.config.get<string>('REPLICATE_VIDEO_MODEL') ||
      this.config.get<string>('ai.replicateVideoModel') ||
      'wan-video/wan-2.1-t2v-480p'
    );
  }

  /**
   * Resolve model identifier from requested model name or configuration.
   */
  resolveImageModel(modelName?: string): string {
    if (modelName && this.MODEL_MAP[modelName]) {
      return this.MODEL_MAP[modelName];
    }
    if (modelName && modelName.includes('/')) {
      return modelName;
    }
    return this.getDefaultImageModel();
  }

  /**
   * Resolve video model identifier from requested model name or configuration.
   */
  resolveVideoModel(modelName?: string): string {
    if (modelName && this.MODEL_MAP[modelName]) {
      return this.MODEL_MAP[modelName];
    }
    if (modelName && modelName.includes('/')) {
      return modelName;
    }
    return this.getDefaultVideoModel();
  }

  /**
   * Map raw errors to standardized REPLICATE error codes and safe messages.
   */
  parseError(error: any): { errorCode: string; errorMessage: string; isTransient: boolean } {
    const status =
      error.status ||
      error.statusCode ||
      (error.message?.match(/\b(5\d{2}|4\d{2})\b/)?.[1]
        ? parseInt(error.message.match(/\b(5\d{2}|4\d{2})\b/)[1], 10)
        : 0);
    const msg = (error.message || '').toLowerCase();

    if (
      status === 401 ||
      msg.includes('unauthenticated') ||
      msg.includes('invalid api token') ||
      msg.includes('authentication')
    ) {
      return {
        errorCode: REPLICATE_ERRORS.AUTH_FAILED,
        errorMessage: 'Replicate authentication failed. Please verify API token.',
        isTransient: false,
      };
    }

    if (status === 404 || msg.includes('not found') || msg.includes('model not found')) {
      return {
        errorCode: REPLICATE_ERRORS.MODEL_NOT_FOUND,
        errorMessage: 'Selected Replicate model not found or unavailable.',
        isTransient: false,
      };
    }

    if (
      status === 422 ||
      msg.includes('validation') ||
      msg.includes('invalid input') ||
      msg.includes('invalid parameter') ||
      msg.includes('does not support')
    ) {
      return {
        errorCode: REPLICATE_ERRORS.INVALID_INPUT,
        errorMessage: error.message || 'Invalid parameters provided for the selected model.',
        isTransient: false,
      };
    }

    if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
      return {
        errorCode: REPLICATE_ERRORS.RATE_LIMITED,
        errorMessage: 'Replicate rate limit exceeded. Please try again later.',
        isTransient: true,
      };
    }

    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('econnaborted')) {
      return {
        errorCode: REPLICATE_ERRORS.TIMEOUT,
        errorMessage: 'Replicate generation timed out.',
        isTransient: true,
      };
    }

    if (status === 503 || msg.includes('unavailable') || msg.includes('capacity')) {
      return {
        errorCode: REPLICATE_ERRORS.MODEL_UNAVAILABLE,
        errorMessage: 'Replicate model is currently unavailable or at capacity.',
        isTransient: true,
      };
    }

    // Default to transient generation failure for 5xx errors or network glitches
    const isTransient =
      status >= 500 ||
      msg.includes('server error') ||
      msg.includes('500') ||
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('econnreset') ||
      msg.includes('enotfound') ||
      msg.includes('network');

    return {
      errorCode: REPLICATE_ERRORS.GENERATION_FAILED,
      errorMessage: 'Replicate generation failed.',
      isTransient,
    };
  }

  /**
   * Execute Replicate run with retry logic for transient errors.
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    const isTest = process.env.NODE_ENV === 'test';
    const baseDelay = isTest ? 10 : 1000;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        const { errorCode, isTransient } = this.parseError(err);
        // Do not retry permanent errors
        if (!isTransient || attempt === maxRetries) {
          throw err;
        }
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 8000);
        this.logger.warn(
          `Replicate attempt ${attempt + 1} failed with ${errorCode}. Retrying in ${delay}ms...`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError;
  }

  /**
   * Generate an image using Replicate.
   */
  async generateImage(
    params: GenerateImageParams & {
      outputFormat?: string;
      referenceImages?: string[] | string;
      referenceImage?: string;
    },
  ): Promise<AIProviderResponse<GeneratedImageResult>> {
    const start = Date.now();
    const token = this.getToken();

    if (!token) {
      this.logger.error('Replicate API token is not configured');
      return {
        success: false,
        error: 'Replicate API token is not configured',
        errorCode: REPLICATE_ERRORS.NOT_CONFIGURED,
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    }

    const modelId = this.resolveImageModel(params.model);
    const replicate = new Replicate({ auth: token });

    // Validate prompt
    if (!params.prompt || typeof params.prompt !== 'string' || !params.prompt.trim()) {
      return {
        success: false,
        error: 'Prompt is required and must not be empty.',
        errorCode: REPLICATE_ERRORS.INVALID_INPUT,
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    }

    // Build input tailored for the target model
    const input: ReplicateImageInput = {
      prompt: params.prompt.trim(),
    };

    if (params.negativePrompt) {
      input.negative_prompt = params.negativePrompt;
    }
    if (params.ratio) {
      input.aspect_ratio = params.ratio;
    }
    if (params.outputFormat) {
      input.output_format = params.outputFormat;
    }

    // Reference Image / Image-to-Image mapping
    const refImage =
      params.referenceImage ||
      (Array.isArray(params.referenceImages)
        ? params.referenceImages[0]
        : params.referenceImages);

    if (refImage) {
      if (modelId.includes('flux-1.1-pro')) {
        // FLUX 1.1 Pro takes `image_prompt`
        input.image_prompt = refImage;
      } else {
        // FLUX Dev, SDXL, and other models take `image`
        input.image = refImage;
      }
    }

    try {
      this.logger.log(`Invoking Replicate image model: ${modelId}`);
      const output = await this.executeWithRetry(async () => {
        return await replicate.run(modelId as any, { input });
      });

      // Replicate image models typically return an array of URLs or FileOutputs, or a single URL string
      let imageUrl = '';
      if (Array.isArray(output) && output.length > 0) {
        imageUrl = typeof output[0] === 'string' ? output[0] : String(output[0]);
      } else if (typeof output === 'string') {
        imageUrl = output;
      } else if (output && typeof output === 'object') {
        imageUrl = String(output);
      }

      if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error('Replicate did not return a valid image URL');
      }

      return {
        success: true,
        data: {
          url: imageUrl,
        },
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      const { errorCode, errorMessage } = this.parseError(err);
      this.logger.error(`Replicate image generation error [${errorCode}]: ${err.message}`);
      return {
        success: false,
        error: errorMessage,
        errorCode,
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    }
  }

  /**
   * Generate a video using Replicate.
   */
  async generateVideo(
    params: GenerateVideoParams & {
      inputImage?: string;
      referenceImage?: string;
      aspectRatio?: string;
    },
  ): Promise<AIProviderResponse<GeneratedVideoResult>> {
    const start = Date.now();
    const token = this.getToken();

    if (!token) {
      this.logger.error('Replicate API token is not configured');
      return {
        success: false,
        error: 'Replicate API token is not configured',
        errorCode: REPLICATE_ERRORS.NOT_CONFIGURED,
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    }

    const modelId = this.resolveVideoModel(params.model);
    const replicate = new Replicate({ auth: token });

    if (!params.prompt || typeof params.prompt !== 'string' || !params.prompt.trim()) {
      return {
        success: false,
        error: 'Prompt is required and must not be empty.',
        errorCode: REPLICATE_ERRORS.INVALID_INPUT,
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    }

    const refImage = params.inputImage || params.referenceImage;

    // Check capability: WAN 2.1 T2V strictly rejects image input
    if (refImage && modelId.includes('wan-2.1-t2v')) {
      return {
        success: false,
        error: 'This model does not support image-to-video generation.',
        errorCode: REPLICATE_ERRORS.INVALID_INPUT,
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    }

    const input: ReplicateVideoInput = {
      prompt: params.prompt.trim(),
    };

    // Model-specific parameter mapping
    if (refImage) {
      if (modelId.includes('minimax') || modelId.includes('video-01')) {
        input.first_frame_image = refImage;
        input.prompt_optimizer = true;
      } else if (modelId.includes('kling')) {
        input.start_image = refImage;
      } else {
        input.image = refImage;
      }
    }

    if (params.duration) {
      input.duration = params.duration;
    }
    if (params.aspectRatio) {
      input.aspect_ratio = params.aspectRatio;
    }
    if (params.resolution) {
      input.resolution = params.resolution;
    }

    try {
      this.logger.log(`Invoking Replicate video model: ${modelId}`);
      const output = await this.executeWithRetry(async () => {
        return await replicate.run(modelId as any, { input });
      });

      let videoUrl = '';
      if (Array.isArray(output) && output.length > 0) {
        videoUrl = typeof output[0] === 'string' ? output[0] : String(output[0]);
      } else if (typeof output === 'string') {
        videoUrl = output;
      } else if (output && typeof output === 'object') {
        videoUrl = String(output);
      }

      if (!videoUrl || !videoUrl.startsWith('http')) {
        throw new Error('Replicate did not return a valid video URL');
      }

      return {
        success: true,
        data: {
          url: videoUrl,
          duration: params.duration || 5,
        },
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      const { errorCode, errorMessage } = this.parseError(err);
      this.logger.error(`Replicate video generation error [${errorCode}]: ${err.message}`);
      return {
        success: false,
        error: errorMessage,
        errorCode,
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    }
  }

  /**
   * Create a prediction asynchronously (for long-running jobs / webhooks).
   */
  async createPrediction(
    modelId: string,
    input: Record<string, any>,
    webhookUrl?: string,
  ): Promise<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error(REPLICATE_ERRORS.NOT_CONFIGURED);
    }

    const replicate = new Replicate({ auth: token });
    const options: any = {
      model: modelId,
      input,
    };

    if (webhookUrl) {
      options.webhook = webhookUrl;
      options.webhook_events_filter = ['completed'];
    }

    return await replicate.predictions.create(options);
  }

  /**
   * Get prediction details.
   */
  async getPrediction(predictionId: string): Promise<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error(REPLICATE_ERRORS.NOT_CONFIGURED);
    }
    const replicate = new Replicate({ auth: token });
    return await replicate.predictions.get(predictionId);
  }

  /**
   * Enhance prompt (passthrough or optional Replicate LLM).
   */
  async enhancePrompt(params: EnhancePromptParams): Promise<AIProviderResponse<string>> {
    return {
      success: true,
      data: params.prompt,
      provider: this.name,
      model: 'passthrough',
      latencyMs: 0,
    };
  }
}
