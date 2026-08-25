import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, GenerateImageParams, GenerateVideoParams, EnhancePromptParams, AIProviderResponse, GeneratedImageResult, GeneratedVideoResult } from '../base/ai-provider.interface';

@Injectable()
export class FalProvider implements AIProvider {
  readonly name = 'fal';
  readonly supportedImageModels = [];
  readonly supportedVideoModels = ['wan-t2v', 'kling-video', 'luma-dream-machine'];

  private readonly MODEL_ENDPOINTS: Record<string, string> = {
    'wan-t2v': 'fal-ai/wan-t2v',
    'kling-video': 'fal-ai/kling-video/v1.6/standard/text-to-video',
    'luma-dream-machine': 'fal-ai/luma-dream-machine',
  };

  constructor(private config: ConfigService) {}

  isAvailable(): boolean {
    return !!this.config.get<string>('ai.fal');
  }

  async generateImage(params: GenerateImageParams): Promise<AIProviderResponse<GeneratedImageResult>> {
    return { success: false, error: 'Image generation not supported by Fal provider', provider: this.name, model: params.model, latencyMs: 0 };
  }

  async generateVideo(params: GenerateVideoParams): Promise<AIProviderResponse<GeneratedVideoResult>> {
    const start = Date.now();
    const falKey = this.config.get<string>('ai.fal');
    const endpoint = this.MODEL_ENDPOINTS[params.model] || this.MODEL_ENDPOINTS['wan-t2v'];

    if (!falKey) {
      return {
        success: true,
        data: { url: '/demo-video.mp4', duration: params.duration },
        provider: this.name, model: params.model, latencyMs: Date.now() - start, demo: true,
      };
    }

    try {
      const submitRes = await fetch(`https://queue.fal.run/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: params.prompt, duration: params.duration || 5 }),
      });
      const submitted = await submitRes.json() as any;
      const requestId = submitted.request_id;
      
      // Poll for result (max 120s)
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(`https://queue.fal.run/${endpoint}/requests/${requestId}`, {
          headers: { 'Authorization': `Key ${falKey}` },
        });
        const status = await statusRes.json() as any;
        if (status.status === 'COMPLETED') {
          const videoUrl = status.output?.video?.url || status.video?.url || '';
          return { success: true, data: { url: videoUrl, duration: params.duration }, provider: this.name, model: params.model, latencyMs: Date.now() - start };
        }
        if (status.status === 'FAILED') throw new Error('Video generation failed');
      }
      throw new Error('Video generation timed out');
    } catch (error: any) {
      return { success: false, error: error.message, provider: this.name, model: params.model, latencyMs: Date.now() - start };
    }
  }

  async enhancePrompt(params: EnhancePromptParams): Promise<AIProviderResponse<string>> {
    return { success: true, data: params.prompt, provider: this.name, model: 'passthrough', latencyMs: 0 };
  }
}
