import { Injectable, Logger } from '@nestjs/common';
import { AIProvider } from '../providers/base/ai-provider.interface';
import { HuggingFaceProvider } from '../providers/huggingface/huggingface.provider';
import { FalProvider } from '../providers/fal/fal.provider';
import { OpenAIProvider } from '../providers/openai/openai.provider';
import { GeminiProvider } from '../providers/gemini/gemini.provider';
import { LocalProvider } from '../providers/local/local.provider';
import { ReplicateProvider } from '../ai/providers/replicate.provider';

@Injectable()
export class ProviderManagerService {
  private readonly logger = new Logger(ProviderManagerService.name);
  private readonly providers: Map<string, AIProvider>;

  constructor(
    private hf: HuggingFaceProvider,
    private fal: FalProvider,
    private openai: OpenAIProvider,
    private gemini: GeminiProvider,
    private local: LocalProvider,
    private replicate: ReplicateProvider,
  ) {
    this.providers = new Map<string, AIProvider>([
      ['huggingface', hf] as [string, AIProvider],
      ['fal', fal] as [string, AIProvider],
      ['openai', openai] as [string, AIProvider],
      ['gemini', gemini] as [string, AIProvider],
      ['local', local] as [string, AIProvider],
      ['replicate', replicate] as [string, AIProvider],
    ]);
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, p]) => p.isAvailable())
      .map(([name]) => name);
  }

  getProviderForModel(modelId: string): AIProvider {
    const lower = (modelId || '').toLowerCase();

    // Replicate models
    if (
      [
        'nano-banana-2',
        'nano-banana-pro',
        'flux-2-max',
        'qwen-image-3-pro',
        'wan-3',
        'seedance',
        'kling',
        'veo',
      ].includes(lower)
    ) {
      return this.replicate;
    }

    if (
      lower.startsWith('replicate/') ||
      this.replicate.supportedImageModels.includes(lower) ||
      this.replicate.supportedVideoModels.includes(lower)
    ) {
      return this.replicate;
    }

    // Existing model routing
    if (['flux-schnell', 'flux-dev', 'sd3', 'sdxl'].includes(lower)) return this.hf;
    if (['wan-t2v', 'kling-video', 'luma-dream-machine'].includes(lower)) return this.fal;
    if (['dall-e-3', 'dall-e-2'].includes(lower)) return this.openai;
    if (['imagen-3', 'imagen-2'].includes(lower)) return this.gemini;

    // Default fallback
    return this.hf;
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}
