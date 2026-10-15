import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderManagerService } from './provider-manager.service';
import {
  GenerateImageParams,
  GenerateVideoParams,
  EnhancePromptParams,
  AIProviderResponse,
  GeneratedImageResult,
  GeneratedVideoResult,
} from '../providers/base/ai-provider.interface';

interface GatewayOptions {
  preferredProvider?: string;
  maxRetries?: number;
  timeoutMs?: number;
  enableFallback?: boolean;
}

@Injectable()
export class AIGatewayService {
  private readonly logger = new Logger(AIGatewayService.name);

  constructor(
    private providerManager: ProviderManagerService,
    private config: ConfigService,
  ) {}

  async generateImage(
    params: GenerateImageParams,
    options: GatewayOptions = {},
  ): Promise<AIProviderResponse<GeneratedImageResult>> {
    const { maxRetries = 2, enableFallback = true, preferredProvider } = options;

    const lowerModel = (params.model || '').toLowerCase();
    const isReplicateTarget =
      preferredProvider === 'replicate' ||
      lowerModel.startsWith('replicate/') ||
      lowerModel.includes('dall-e-3') ||
      lowerModel.includes('chatgpt') ||
      lowerModel.includes('imagen-3') ||
      lowerModel.includes('google/');

    const provider = isReplicateTarget
      ? this.providerManager.getProvider('replicate') || this.providerManager.getProviderForModel(params.model)
      : preferredProvider
      ? this.providerManager.getProvider(preferredProvider) ||
        this.providerManager.getProviderForModel(params.model)
      : this.providerManager.getProviderForModel(params.model);

    this.logger.log(`Image generation request: model=${params.model} provider=${provider.name}`);

    // If Replicate was explicitly chosen or routed and is not available, return REPLICATE_NOT_CONFIGURED immediately
    if (provider.name === 'replicate' && !provider.isAvailable()) {
      return {
        success: false,
        error: 'Replicate API token is not configured',
        errorCode: 'REPLICATE_NOT_CONFIGURED',
        provider: 'replicate',
        model: params.model,
        latencyMs: 0,
      };
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          provider.generateImage(params),
          new Promise<AIProviderResponse<GeneratedImageResult>>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), options.timeoutMs || 120000),
          ),
        ]);

        if (result.success) {
          this.logger.log(`Image generated in ${result.latencyMs}ms via ${result.provider}`);
          return result;
        }

        // Do not retry permanent errors or rate limits
        if (
          result.errorCode === 'PROVIDER_NOT_CONFIGURED' ||
          result.errorCode === 'REPLICATE_NOT_CONFIGURED' ||
          result.errorCode === 'REPLICATE_AUTH_FAILED' ||
          result.errorCode === 'REPLICATE_PAYMENT_REQUIRED' ||
          result.errorCode === 'REPLICATE_RATE_LIMITED' ||
          result.errorCode === 'REPLICATE_INVALID_INPUT' ||
          result.errorCode === 'REPLICATE_MODEL_NOT_FOUND' ||
          result.errorCode === 'QUOTA_EXCEEDED'
        ) {
          return result;
        }

        this.logger.warn(`Attempt ${attempt + 1} failed: ${result.error}`);
        if (attempt === maxRetries) {
          // If fallback is enabled and we have other available providers, try fallback (unless preferredProvider was strictly Replicate)
          if (enableFallback && preferredProvider !== 'replicate' && provider.name !== 'replicate') {
            const available = this.providerManager.getAvailableProviders();
            const fallbackProviderName = available.find((p) => p !== provider.name);
            if (fallbackProviderName) {
              const fallbackProvider = this.providerManager.getProvider(fallbackProviderName);
              if (fallbackProvider) {
                this.logger.log(`Falling back to provider ${fallbackProviderName}`);
                return await fallbackProvider.generateImage(params);
              }
            }
          }
          return result;
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      } catch (err: any) {
        this.logger.warn(`Attempt ${attempt + 1} error: ${err.message}`);
        if (attempt === maxRetries) {
          return {
            success: false,
            error: err.message,
            errorCode: 'GENERATION_FAILED',
            provider: provider.name,
            model: params.model,
            latencyMs: 0,
          };
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    return {
      success: false,
      error: 'Provider not configured or API error',
      errorCode: 'GENERATION_FAILED',
      provider: provider.name,
      model: params.model,
      latencyMs: 0,
    };
  }

  async generateVideo(
    params: GenerateVideoParams,
    options: GatewayOptions = {},
  ): Promise<AIProviderResponse<GeneratedVideoResult>> {
    const { maxRetries = 1, enableFallback = true, preferredProvider } = options;
    const provider = preferredProvider
      ? this.providerManager.getProvider(preferredProvider) ||
        this.providerManager.getProviderForModel(params.model)
      : this.providerManager.getProviderForModel(params.model);

    this.logger.log(`Video generation request: model=${params.model} provider=${provider.name}`);

    // If Replicate was explicitly chosen or routed and is not available, return REPLICATE_NOT_CONFIGURED immediately
    if (provider.name === 'replicate' && !provider.isAvailable()) {
      return {
        success: false,
        error: 'Replicate API token is not configured',
        errorCode: 'REPLICATE_NOT_CONFIGURED',
        provider: 'replicate',
        model: params.model,
        latencyMs: 0,
      };
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await provider.generateVideo(params);
        if (result.success) return result;

        if (
          result.errorCode === 'PROVIDER_NOT_CONFIGURED' ||
          result.errorCode === 'REPLICATE_NOT_CONFIGURED' ||
          result.errorCode === 'REPLICATE_AUTH_FAILED' ||
          result.errorCode === 'REPLICATE_PAYMENT_REQUIRED' ||
          result.errorCode === 'REPLICATE_RATE_LIMITED' ||
          result.errorCode === 'REPLICATE_INVALID_INPUT' ||
          result.errorCode === 'REPLICATE_MODEL_NOT_FOUND'
        ) {
          return result;
        }

        if (attempt === maxRetries) {
          return result;
        }
      } catch (err: any) {
        this.logger.warn(`Video attempt ${attempt + 1} error: ${err.message}`);
        if (attempt === maxRetries) {
          return {
            success: false,
            error: err.message || 'Provider not configured or API error',
            errorCode: 'GENERATION_FAILED',
            provider: provider.name,
            model: params.model,
            latencyMs: 0,
          };
        }
      }
    }

    return {
      success: false,
      error: 'Provider not configured or API error',
      errorCode: 'GENERATION_FAILED',
      provider: provider.name,
      model: params.model,
      latencyMs: 0,
    };
  }

  async enhancePrompt(
    params: EnhancePromptParams,
    options: GatewayOptions = {},
  ): Promise<string> {
    const availableProviders = this.providerManager.getAvailableProviders();
    const preferred = options.preferredProvider || availableProviders[0] || 'huggingface';
    const provider =
      this.providerManager.getProvider(preferred) || this.providerManager.getAllProviders()[0];

    try {
      const result = await provider.enhancePrompt(params);
      return result.success && result.data ? result.data : params.prompt;
    } catch {
      return params.prompt;
    }
  }

  getAvailableProviders() {
    return this.providerManager.getAvailableProviders();
  }
}
