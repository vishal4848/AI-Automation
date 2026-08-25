import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderManagerService } from './provider-manager.service';
import {
  GenerateImageParams, GenerateVideoParams, EnhancePromptParams,
  AIProviderResponse, GeneratedImageResult, GeneratedVideoResult, getSvgFallbackImage,
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

  async generateImage(params: GenerateImageParams, options: GatewayOptions = {}): Promise<AIProviderResponse<GeneratedImageResult>> {
    const { maxRetries = 2, enableFallback = true, preferredProvider } = options;
    
    const provider = preferredProvider
      ? this.providerManager.getProvider(preferredProvider) || this.providerManager.getProviderForModel(params.model)
      : this.providerManager.getProviderForModel(params.model);

    this.logger.log(`Image generation request: model=${params.model} provider=${provider.name}`);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          provider.generateImage(params),
          new Promise<AIProviderResponse<GeneratedImageResult>>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), options.timeoutMs || 120000)
          ),
        ]);
        if (result.success) {
          this.logger.log(`Image generated in ${result.latencyMs}ms via ${result.provider}`);
          return result;
        }
        
        // Do not retry for specific errors like configuration or quota issues
        if (result.errorCode === 'PROVIDER_NOT_CONFIGURED' || result.errorCode === 'QUOTA_EXCEEDED') {
          return result;
        }
        
        this.logger.warn(`Attempt ${attempt + 1} failed: ${result.error}`);
        if (attempt === maxRetries) {
          return result; // Return the last failure result
        }
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      } catch (err: any) {
        this.logger.warn(`Attempt ${attempt + 1} error: ${err.message}`);
        if (attempt === maxRetries) {
          return { success: false, error: err.message, errorCode: 'GENERATION_FAILED', provider: provider.name, model: params.model, latencyMs: 0 };
        }
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    
    return { success: false, error: 'Provider not configured or API error', errorCode: 'GENERATION_FAILED', provider: provider.name, model: params.model, latencyMs: 0 };
  }

  async generateVideo(params: GenerateVideoParams, options: GatewayOptions = {}): Promise<AIProviderResponse<GeneratedVideoResult>> {
    const { maxRetries = 1, enableFallback = true, preferredProvider } = options;
    const provider = preferredProvider
      ? this.providerManager.getProvider(preferredProvider) || this.providerManager.getProviderForModel(params.model)
      : this.providerManager.getProviderForModel(params.model);

    this.logger.log(`Video generation request: model=${params.model} provider=${provider.name}`);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await provider.generateVideo(params);
        if (result.success) return result;
      } catch (err: any) {
        this.logger.warn(`Video attempt ${attempt + 1} error: ${err.message}`);
        if (attempt === maxRetries) {
          throw new Error(`Provider not configured or API error: ${err.message}`);
        }
      }
    }
    
    throw new Error('Provider not configured or API error');
  }

  async enhancePrompt(params: EnhancePromptParams, options: GatewayOptions = {}): Promise<string> {
    const availableProviders = this.providerManager.getAvailableProviders();
    const preferred = options.preferredProvider || availableProviders[0] || 'huggingface';
    const provider = this.providerManager.getProvider(preferred) || this.providerManager.getAllProviders()[0];
    
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
