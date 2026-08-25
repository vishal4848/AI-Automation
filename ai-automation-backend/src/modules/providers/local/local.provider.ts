import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIProvider,
  GenerateImageParams,
  AIProviderResponse,
  GeneratedImageResult,
  GenerateVideoParams,
  GeneratedVideoResult,
  EnhancePromptParams
} from '../base/ai-provider.interface';

@Injectable()
export class LocalProvider implements AIProvider {
  name = 'local';
  supportedImageModels = ['comfyui-flux'];
  supportedVideoModels = [];
  
  private readonly logger = new Logger(LocalProvider.name);
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('LOCAL_AI_BASE_URL') || 'http://127.0.0.1:8188';
  }

  isAvailable(): boolean {
    return !!this.config.get<string>('AI_MODE') && this.config.get<string>('AI_MODE') === 'local';
  }

  async generateImage(params: GenerateImageParams): Promise<AIProviderResponse<GeneratedImageResult>> {
    if (!this.isAvailable()) {
      return { success: false, error: 'Local AI provider not configured or AI_MODE != local', provider: 'local', model: params.model, latencyMs: 0 };
    }

    try {
      const startTime = Date.now();
      this.logger.log(`Queueing prompt to ComfyUI at ${this.baseUrl}`);
      
      const response = await fetch(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: {
            "3": {
              "inputs": {
                "seed": params.seed || Math.floor(Math.random() * 10000000),
                "steps": params.steps || 20,
                "cfg": 8,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
              },
              "class_type": "KSampler"
            }
          }
        })
      });
      
      return {
        success: false,
        error: 'ComfyUI integration requires full workflow JSON setup. Placeholder response.',
        provider: 'local',
        model: params.model,
        latencyMs: Date.now() - startTime
      };
    } catch (error: any) {
      this.logger.error(`Local generation failed: ${error.message}`);
      return { success: false, error: error.message, provider: 'local', model: params.model, latencyMs: 0 };
    }
  }

  async generateVideo(params: GenerateVideoParams): Promise<AIProviderResponse<GeneratedVideoResult>> {
    return { success: false, error: 'Local video generation not implemented', provider: 'local', model: params.model, latencyMs: 0 };
  }

  async enhancePrompt(params: EnhancePromptParams): Promise<AIProviderResponse<string>> {
    return { success: false, error: 'Local prompt enhancement not implemented', provider: 'local', model: 'local', latencyMs: 0 };
  }
}
