import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, GenerateImageParams, GenerateVideoParams, EnhancePromptParams, AIProviderResponse, GeneratedImageResult, GeneratedVideoResult, getSvgFallbackImage } from '../base/ai-provider.interface';

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly supportedImageModels = ['dall-e-3', 'dall-e-2', 'chatgpt', 'chatgpt-image'];
  readonly supportedVideoModels = [];

  constructor(private config: ConfigService) {}

  isAvailable(): boolean {
    return !!this.config.get<string>('ai.openai');
  }

  async generateImage(params: GenerateImageParams): Promise<AIProviderResponse<GeneratedImageResult>> {
    const start = Date.now();
    const token = this.config.get<string>('ai.openai');
    const targetModel =
      params.model === 'chatgpt' || params.model === 'chatgpt-image'
        ? 'dall-e-3'
        : (params.model || 'dall-e-3');

    if (!token) {
      const fallbackUrl = getSvgFallbackImage(params.prompt, targetModel, this.name);
      return {
        success: true,
        data: { url: fallbackUrl, base64: fallbackUrl, width: 1024, height: 1024, mimeType: 'image/svg+xml' },
        provider: this.name, model: params.model, latencyMs: Date.now() - start, demo: true,
      };
    }

    try {
      const response = await fetch(`https://api.openai.com/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: targetModel,
          prompt: params.prompt,
          n: params.numImages || 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
      }
      
      const result = await response.json() as any;
      const base64Data = result.data[0].b64_json;
      const base64 = `data:image/png;base64,${base64Data}`;
      
      return {
        success: true,
        data: { url: base64, base64, mimeType: 'image/png' },
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      return { success: false, error: error.message, provider: this.name, model: params.model, latencyMs: Date.now() - start };
    }
  }

  async generateVideo(params: GenerateVideoParams): Promise<AIProviderResponse<GeneratedVideoResult>> {
    return { success: false, error: 'Video generation not supported by OpenAI provider', provider: this.name, model: params.model, latencyMs: 0 };
  }

  async enhancePrompt(params: EnhancePromptParams): Promise<AIProviderResponse<string>> {
    const start = Date.now();
    const token = this.config.get<string>('ai.openai');
    if (!token) {
      return { success: true, data: `${params.prompt}, highly detailed, photorealistic, 8K resolution, stunning lighting`, provider: this.name, model: 'prompt-enhancer', latencyMs: 0, demo: true };
    }
    try {
      const instruction = `Enhance this ${params.category || 'image'} generation prompt to be more detailed, vivid and descriptive. Return ONLY the enhanced prompt, nothing else.\n\nOriginal: ${params.prompt}\n\nEnhanced:`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: instruction }],
          temperature: 0.7,
        }),
      });
      const result = await response.json() as any;
      const enhanced = result.choices?.[0]?.message?.content?.trim() || params.prompt;
      return { success: true, data: enhanced, provider: this.name, model: 'gpt-4o-mini', latencyMs: Date.now() - start };
    } catch {
      return { success: true, data: params.prompt, provider: this.name, model: 'fallback', latencyMs: Date.now() - start };
    }
  }
}
