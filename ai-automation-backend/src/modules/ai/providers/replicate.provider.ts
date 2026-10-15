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
    'openai/dall-e-3',
    'chatgpt',
    'chatgpt-image',
    'dall-e-3',
    'google/imagen-3',
    'google/imagen-3-fast',
    'gemini',
    'gemini-image',
    'google-gemini',
    'imagen-3',
    'imagen-3-fast',
    'timothybrooks/instruct-pix2pix',
    'nightmareai/real-esrgan',
    'cjwbw/rembg',
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
    'openai/dall-e-3': 'openai/dall-e-3',
    'chatgpt': 'openai/dall-e-3',
    'chatgpt-image': 'openai/dall-e-3',
    'dall-e-3': 'openai/dall-e-3',
    'google/imagen-3': 'google/imagen-3',
    'google/imagen-3-fast': 'google/imagen-3-fast',
    'gemini': 'google/imagen-3',
    'gemini-image': 'google/imagen-3',
    'google-gemini': 'google/imagen-3',
    'imagen-3': 'google/imagen-3',
    'imagen-3-fast': 'google/imagen-3-fast',
    'timothybrooks/instruct-pix2pix': 'timothybrooks/instruct-pix2pix',
    'nightmareai/real-esrgan': 'nightmareai/real-esrgan',
    'cjwbw/rembg': 'cjwbw/rembg',
    'openai/gpt-4o': 'openai/gpt-4o',
    'openai/gpt-4o-mini': 'openai/gpt-4o-mini',
    'gpt-4o': 'openai/gpt-4o',
    'gpt-4o-mini': 'openai/gpt-4o-mini',
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

    if (
      status === 402 ||
      msg.includes('payment required') ||
      msg.includes('insufficient credit') ||
      msg.includes('credit card') ||
      msg.includes('billing')
    ) {
      return {
        errorCode: REPLICATE_ERRORS.PAYMENT_REQUIRED,
        errorMessage: 'Replicate billing issue or insufficient balance. Please check your Replicate account billing.',
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
      const resetSec = msg.match(/resets in ~?(\d+)s/i)?.[1] || error.retry_after;
      const resetMsg = resetSec ? ` Resets in ~${resetSec}s.` : ' Please wait a few seconds before trying again.';
      const creditNotice = msg.includes('less than $5')
        ? ' (Replicate rate limit: 6 req/min for accounts with under $5 balance).'
        : '';
      return {
        errorCode: REPLICATE_ERRORS.RATE_LIMITED,
        errorMessage: `Replicate rate limit exceeded.${creditNotice}${resetMsg}`,
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

        // For rate-limited calls, wait the full reset window if specified or backoff with at least 4s
        let delay = Math.min(baseDelay * Math.pow(2, attempt), 8000);
        if (errorCode === REPLICATE_ERRORS.RATE_LIMITED && !isTest) {
          // If already retried once for 429, don't spam further
          if (attempt >= 1) {
            throw err;
          }
          const rawMsg = err.message || '';
          const resetSec = parseInt(rawMsg.match(/resets in ~?(\d+)s/i)?.[1] || err.retry_after, 10);
          delay = resetSec && !isNaN(resetSec) ? (resetSec + 1) * 1000 : 4000;
        }

        this.logger.warn(
          `Replicate attempt ${attempt + 1} failed with ${errorCode}. Retrying in ${delay}ms...`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError;
  }

  /**
   * Robustly extracts a media URL from various Replicate SDK output formats.
   * Handles string URLs, array of URLs, nested arrays, FileOutput objects (.url()), and URL objects.
   */
  private extractMediaUrl(output: any): string {
    if (!output) return '';
    if (typeof output === 'string') {
      const trimmed = output.trim();
      return trimmed.startsWith('http') || trimmed.startsWith('data:') ? trimmed : '';
    }
    if (Array.isArray(output)) {
      for (const item of output) {
        const found = this.extractMediaUrl(item);
        if (found) return found;
      }
      return '';
    }
    if (typeof output === 'object') {
      if (typeof output.url === 'function') {
        try {
          const res = output.url();
          const parsed = this.extractMediaUrl(res);
          if (parsed) return parsed;
        } catch {}
      }
      if (output.url) {
        const parsed = this.extractMediaUrl(output.url);
        if (parsed) return parsed;
      }
      if (typeof output.href === 'string' && (output.href.startsWith('http') || output.href.startsWith('data:'))) {
        return output.href.trim();
      }
      if (typeof output.src === 'string' && (output.src.startsWith('http') || output.src.startsWith('data:'))) {
        return output.src.trim();
      }
      if (typeof output.toString === 'function') {
        try {
          const str = output.toString();
          if (str && typeof str === 'string' && (str.startsWith('http') || str.startsWith('data:'))) {
            return str.trim();
          }
        } catch {}
      }
    }
    return '';
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
    const replicate = new Replicate({ auth: token, useFileOutput: false });

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
    const input: any = {
      prompt: params.prompt.trim(),
    };

    if (params.negativePrompt && params.negativePrompt.trim()) {
      input.negative_prompt = params.negativePrompt.trim();
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

    if (modelId.includes('instruct-pix2pix')) {
      if (!refImage) {
        return {
          success: false,
          error: 'InstructPix2Pix requires an input reference image to edit.',
          errorCode: REPLICATE_ERRORS.INVALID_INPUT,
          provider: this.name,
          model: params.model,
          latencyMs: Date.now() - start,
        };
      }
      delete input.aspect_ratio;
      delete input.negative_prompt;
      delete input.output_format;
      input.image = refImage;
      input.prompt = params.prompt.trim();
    } else if (modelId.includes('real-esrgan')) {
      if (!refImage) {
        return {
          success: false,
          error: 'Real-ESRGAN requires an input image to upscale.',
          errorCode: REPLICATE_ERRORS.INVALID_INPUT,
          provider: this.name,
          model: params.model,
          latencyMs: Date.now() - start,
        };
      }
      delete input.aspect_ratio;
      delete input.negative_prompt;
      delete input.output_format;
      input.image = refImage;
      input.scale = 4;
      input.face_enhance = true;
    } else if (modelId.includes('rembg')) {
      if (!refImage) {
        return {
          success: false,
          error: 'Rembg requires an input image for background removal.',
          errorCode: REPLICATE_ERRORS.INVALID_INPUT,
          provider: this.name,
          model: params.model,
          latencyMs: Date.now() - start,
        };
      }
      delete input.aspect_ratio;
      delete input.negative_prompt;
      delete input.output_format;
      input.image = refImage;
    } else if (modelId.includes('dall-e-3')) {
      delete input.size;
      delete input.negative_prompt;
      delete input.output_format;
      input.prompt = params.prompt.trim();
      input.aspect_ratio = params.ratio === '16:9' || params.ratio === '21:9'
        ? '3:2'
        : params.ratio === '9:16' || params.ratio === '3:4'
        ? '2:3'
        : '1:1';
      input.style = params.style === 'natural' ? 'natural' : 'vivid';
    } else if (modelId.includes('imagen-3') || modelId.includes('google/')) {
      delete input.negative_prompt;
      delete input.size;
      delete input.image;
      input.prompt = params.prompt.trim();
      input.aspect_ratio = params.ratio === '16:9' ? '16:9'
        : params.ratio === '9:16' ? '9:16'
        : params.ratio === '4:3' ? '4:3'
        : params.ratio === '3:4' ? '3:4'
        : '1:1';
      input.output_format = 'jpg';
    } else if (modelId.includes('flux')) {
      // Flux models reject negative_prompt with 422 Unprocessable Entity
      delete input.negative_prompt;
      if (refImage) {
        if (modelId.includes('flux-1.1-pro')) {
          // FLUX 1.1 Pro takes `image_prompt`
          input.image_prompt = refImage;
        } else {
          // FLUX Dev, SDXL, and other models take `image`
          input.image = refImage;
        }
      }
    } else if (refImage) {
      input.image = refImage;
    }

    try {
      this.logger.log(`Invoking Replicate image model: ${modelId}`);
      let activeModelId = modelId;
      const output = await this.executeWithRetry(async () => {
        let res: any;
        try {
          res = await replicate.run(activeModelId as any, {
            input,
            wait: { mode: 'poll', interval: 1000 },
          });
        } catch (runErr: any) {
          // If dall-e-3 has upstream container error on Replicate ("response_format"), seamlessly fallback to flux-1.1-pro on Replicate
          if (
            activeModelId.includes('dall-e-3') &&
            (runErr.message?.includes('response_format') || runErr.message?.includes('Failed to generate'))
          ) {
            this.logger.warn(
              `openai/dall-e-3 upstream error on Replicate (${runErr.message}). Falling back to black-forest-labs/flux-1.1-pro on Replicate...`,
            );
            activeModelId = 'black-forest-labs/flux-1.1-pro';
            delete input.style;
            input.aspect_ratio = params.ratio || '1:1';
            return await replicate.run(activeModelId as any, {
              input,
              wait: { mode: 'poll', interval: 1000 },
            });
          }

          if (runErr.message?.includes('Prediction failed') || runErr.message?.includes('Failed to generate')) {
            throw runErr;
          }

          if (typeof (replicate as any).wait === 'function') {
            this.logger.warn(`replicate.run image failed (${runErr.message}), falling back to direct prediction polling`);
            const pred = await replicate.predictions.create({ model: activeModelId, input });
            const completed = await (replicate as any).wait(pred, { interval: 1000 });
            if (completed?.status === 'failed') {
              throw new Error(completed.error || 'Prediction failed');
            }
            res = completed?.output;
          } else {
            throw runErr;
          }
        }

        if (!res && typeof (replicate as any).wait === 'function') {
          this.logger.warn(`replicate.run returned empty response for ${activeModelId}, polling via predictions API...`);
          const pred = await replicate.predictions.create({ model: activeModelId, input });
          const completed = await (replicate as any).wait(pred, { interval: 1000 });
          if (completed?.status === 'failed') {
            throw new Error(completed.error || 'Prediction failed');
          }
          res = completed?.output;
        }

        return res;
      });

      const imageUrl = this.extractMediaUrl(output);

      if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error('Replicate did not return a valid image URL');
      }

      return {
        success: true,
        data: {
          url: imageUrl,
        },
        provider: this.name,
        model: activeModelId !== modelId ? activeModelId : params.model,
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
    const replicate = new Replicate({ auth: token, useFileOutput: false });

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
        let res: any;
        try {
          res = await replicate.run(modelId as any, {
            input,
            wait: { mode: 'poll', interval: 1000 },
          });
        } catch (runErr: any) {
          if (typeof (replicate as any).wait === 'function') {
            this.logger.warn(`replicate.run video failed (${runErr.message}), falling back to direct prediction polling`);
            const pred = await replicate.predictions.create({ model: modelId, input });
            const completed = await (replicate as any).wait(pred, { interval: 1000 });
            if (completed?.status === 'failed') {
              throw new Error(completed.error || 'Video prediction failed');
            }
            res = completed?.output;
          } else {
            throw runErr;
          }
        }

        if (!res && typeof (replicate as any).wait === 'function') {
          this.logger.warn(`replicate.run returned empty response for video model ${modelId}, polling via predictions API...`);
          const pred = await replicate.predictions.create({ model: modelId, input });
          const completed = await (replicate as any).wait(pred, { interval: 1000 });
          if (completed?.status === 'failed') {
            throw new Error(completed.error || 'Video prediction failed');
          }
          res = completed?.output;
        }

        return res;
      });

      const videoUrl = this.extractMediaUrl(output);

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

    const replicate = new Replicate({ auth: token, useFileOutput: false });
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
    const replicate = new Replicate({ auth: token, useFileOutput: false });
    return await replicate.predictions.get(predictionId);
  }

  /**
   * Enhance prompt using Replicate-hosted OpenAI LLM (or passthrough).
   */
  async enhancePrompt(params: EnhancePromptParams): Promise<AIProviderResponse<string>> {
    const token = this.getToken();
    if (!token) {
      return {
        success: true,
        data: params.prompt,
        provider: this.name,
        model: 'passthrough',
        latencyMs: 0,
      };
    }

    try {
      const replicate = new Replicate({ auth: token, useFileOutput: false });
      const modelId = params.model && params.model.includes('/') ? params.model : 'openai/gpt-4o-mini';
      const promptInstruction = `You are a master generative AI prompt engineering expert. Expand and enhance the following prompt for ultra-realistic generative media. Add cinematic lighting, atmosphere, intricate physical textures, and artistic framing. Return ONLY the enhanced prompt with no commentary:\n\n"${params.prompt}"`;

      const output = await this.executeWithRetry(async () => {
        return await replicate.run(modelId as any, {
          input: {
            prompt: promptInstruction,
            max_completion_tokens: 300,
          },
        });
      });

      const enhancedText = Array.isArray(output)
        ? output.join('')
        : typeof output === 'string'
        ? output
        : params.prompt;

      return {
        success: true,
        data: (enhancedText || params.prompt).trim(),
        provider: this.name,
        model: modelId,
        latencyMs: 0,
      };
    } catch {
      return {
        success: true,
        data: params.prompt,
        provider: this.name,
        model: 'passthrough',
        latencyMs: 0,
      };
    }
  }
}
