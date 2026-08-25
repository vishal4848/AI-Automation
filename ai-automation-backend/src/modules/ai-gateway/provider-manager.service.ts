import { Injectable, Logger } from '@nestjs/common';
import { AIProvider } from '../providers/base/ai-provider.interface';
import { HuggingFaceProvider } from '../providers/huggingface/huggingface.provider';
import { FalProvider } from '../providers/fal/fal.provider';
import { OpenAIProvider } from '../providers/openai/openai.provider';
import { GeminiProvider } from '../providers/gemini/gemini.provider';
import { LocalProvider } from '../providers/local/local.provider';

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
  ) {
    this.providers = new Map<string, AIProvider>([
      ['huggingface', hf] as [string, AIProvider],
      ['fal', fal] as [string, AIProvider],
      ['openai', openai] as [string, AIProvider],
      ['gemini', gemini] as [string, AIProvider],
      ['local', local] as [string, AIProvider],
    ]);
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, p]) => p.isAvailable())
      .map(([name]) => name);
  }

  getProviderForModel(modelId: string): AIProvider {
    // Auto-route: find provider that supports this model
    if (['flux-schnell', 'flux-dev', 'sd3', 'sdxl'].includes(modelId)) return this.hf;
    if (['wan-t2v', 'kling-video', 'luma-dream-machine'].includes(modelId)) return this.fal;
    if (['dall-e-3', 'dall-e-2'].includes(modelId)) return this.openai;
    if (['imagen-3', 'imagen-2'].includes(modelId)) return this.gemini;
    // Default fallback
    return this.hf;
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}
