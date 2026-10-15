import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, GenerateImageParams, GenerateVideoParams, EnhancePromptParams, AIProviderResponse, GeneratedImageResult, GeneratedVideoResult, getSvgFallbackImage } from '../base/ai-provider.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  readonly supportedImageModels = ['imagen-3', 'imagen-2'];
  readonly supportedVideoModels = [];

  constructor(private config: ConfigService) {}

  private getToken(): string | undefined {
    return (
      this.config.get<string>('GEMINI_API_KEY') ||
      this.config.get<string>('GOOGLE_AI_API_KEY') ||
      this.config.get<string>('ai.gemini') ||
      this.config.get<string>('ai.google')
    );
  }

  isAvailable(): boolean {
    return !!this.getToken();
  }

  async generateImage(params: GenerateImageParams): Promise<AIProviderResponse<GeneratedImageResult>> {
    const start = Date.now();
    const token = this.getToken();

    if (!token) {
      const fallbackUrl = getSvgFallbackImage(params.prompt, params.model || 'imagen-3', this.name);
      return {
        success: true,
        data: { url: fallbackUrl, base64: fallbackUrl, width: 1024, height: 1024, mimeType: 'image/svg+xml' },
        provider: this.name, model: params.model, latencyMs: Date.now() - start, demo: true,
      };
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [
            {
              prompt: params.prompt
            }
          ],
          parameters: {
            sampleCount: 1
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }
      
      const result = await response.json() as any;
      const base64Data = result.predictions?.[0]?.bytesBase64Encoded;
      const mimeType = result.predictions?.[0]?.mimeType || 'image/png';
      
      if (!base64Data) {
        throw new Error('No image returned from Gemini API');
      }

      const base64 = `data:${mimeType};base64,${base64Data}`;
      
      return {
        success: true,
        data: { url: base64, base64, mimeType },
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      return { success: false, error: error.message, provider: this.name, model: params.model, latencyMs: Date.now() - start };
    }
  }

  async generateVideo(params: GenerateVideoParams): Promise<AIProviderResponse<GeneratedVideoResult>> {
    return { success: false, error: 'Video generation not supported by Gemini provider', provider: this.name, model: params.model, latencyMs: 0 };
  }

  async enhancePrompt(params: EnhancePromptParams): Promise<AIProviderResponse<string>> {
    const start = Date.now();
    const token = this.config.get<string>('ai.gemini');
    if (!token) {
      return { success: true, data: `${params.prompt}, cinematic, masterpiece, highly detailed`, provider: this.name, model: 'prompt-enhancer', latencyMs: 0, demo: true };
    }
    try {
      const instruction = `Enhance this ${params.category || 'image'} generation prompt to be more detailed, vivid and descriptive. Return ONLY the enhanced prompt, nothing else.\n\nOriginal: ${params.prompt}\n\nEnhanced:`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: { temperature: 0.7 }
        }),
      });
      const result = await response.json() as any;
      const enhanced = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || params.prompt;
      return { success: true, data: enhanced, provider: this.name, model: 'gemini-1.5-flash', latencyMs: Date.now() - start };
    } catch {
      return { success: true, data: params.prompt, provider: this.name, model: 'fallback', latencyMs: Date.now() - start };
    }
  }
}
