import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HfInference } from '@huggingface/inference';
import { AIProvider, GenerateImageParams, GenerateVideoParams, EnhancePromptParams, AIProviderResponse, GeneratedImageResult, GeneratedVideoResult, getSvgFallbackImage } from '../base/ai-provider.interface';

@Injectable()
export class HuggingFaceProvider implements AIProvider {
  readonly name = 'huggingface';
  readonly supportedImageModels = ['flux-schnell', 'flux-dev', 'sd3', 'sdxl'];
  readonly supportedVideoModels = [];
  
  private readonly logger = new Logger(HuggingFaceProvider.name);

  private readonly MODEL_MAP: Record<string, string> = {
    'flux-schnell': 'black-forest-labs/FLUX.1-schnell',
    'flux-dev': 'black-forest-labs/FLUX.1-dev',
    'sd3': 'stabilityai/stable-diffusion-3.5-large', // Updated to currently supported HF model
    'sdxl': 'stabilityai/stable-diffusion-xl-base-1.0',
  };

  constructor(private config: ConfigService) {}

  isAvailable(): boolean {
    return !!this.config.get<string>('HF_TOKEN') || !!this.config.get<string>('HUGGINGFACE_API_TOKEN');
  }

  private getToken(): string | undefined {
    return this.config.get<string>('HF_TOKEN') || this.config.get<string>('HUGGINGFACE_API_TOKEN');
  }

  async generateImage(params: GenerateImageParams): Promise<AIProviderResponse<GeneratedImageResult>> {
    const start = Date.now();
    const token = this.getToken();
    const modelId = this.MODEL_MAP[params.model] || this.MODEL_MAP['flux-schnell'];

    if (!token) {
      const fallbackUrl = getSvgFallbackImage(params.prompt, params.model || 'flux-schnell', this.name);
      return {
        success: true,
        data: { url: fallbackUrl, base64: fallbackUrl, width: 1024, height: 1024, mimeType: 'image/svg+xml' },
        provider: this.name,
        model: params.model,
        latencyMs: Date.now() - start,
        demo: true,
      };
    }

    const hf = new HfInference(token);

    try {
      this.logger.log(`Generating image with HF model: ${modelId}`);
      
      const blob = await hf.textToImage({
        model: modelId,
        inputs: params.prompt,
        parameters: {
          negative_prompt: params.negativePrompt || undefined,
          num_inference_steps: params.steps,
        }
      }) as any;

      if (!blob.arrayBuffer) {
        throw new Error('Hugging Face did not return a valid Blob object.');
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      const base64 = `data:${blob.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      
      return { 
        success: true, 
        data: { url: base64, base64, mimeType: blob.type || 'image/jpeg' }, 
        provider: this.name, 
        model: params.model, 
        latencyMs: Date.now() - start 
      };
      
    } catch (error: any) {
      this.logger.error(`HF Image Generation Error: ${error.message}`, error.stack);
      
      const errorMessage = error.message?.toLowerCase() || '';
      let errorCode = 'GENERATION_FAILED';
      let userMessage = 'Image generation failed. Please try again.';
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests') || errorMessage.includes('quota') || errorMessage.includes('429')) {
        errorCode = 'QUOTA_EXCEEDED';
        userMessage = 'Hugging Face free testing quota has been exhausted.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('model is loading') || errorMessage.includes('is currently loading') || errorMessage.includes('temporarily unavailable')) {
        errorCode = 'MODEL_NOT_AVAILABLE';
        userMessage = 'The selected Hugging Face model is currently unavailable.';
      }

      return { 
        success: false, 
        error: userMessage,
        errorCode,
        provider: this.name, 
        model: params.model, 
        latencyMs: Date.now() - start 
      };
    }
  }

  async generateVideo(params: GenerateVideoParams): Promise<AIProviderResponse<GeneratedVideoResult>> {
    return { success: false, error: 'Video generation not supported by HuggingFace provider', provider: this.name, model: params.model, latencyMs: 0 };
  }

  async enhancePrompt(params: EnhancePromptParams): Promise<AIProviderResponse<string>> {
    const start = Date.now();
    const token = this.getToken();
    
    if (!token) {
      return { 
        success: false, 
        error: 'Hugging Face provider is not configured.',
        errorCode: 'PROVIDER_NOT_CONFIGURED',
        provider: this.name, 
        model: 'prompt-enhancer', 
        latencyMs: Date.now() - start 
      };
    }
    
    const hf = new HfInference(token);
    
    try {
      const instruction = `Enhance this ${params.category || 'image'} generation prompt to be more detailed, vivid and descriptive. Return ONLY the enhanced prompt, nothing else.\n\nOriginal: ${params.prompt}\n\nEnhanced:`;
      
      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: instruction,
        parameters: { max_new_tokens: 200, temperature: 0.7 }
      });
      
      const enhanced = response.generated_text?.split('Enhanced:').pop()?.trim() || params.prompt;
      
      return { 
        success: true, 
        data: enhanced, 
        provider: this.name, 
        model: 'mistral-7b', 
        latencyMs: Date.now() - start 
      };
    } catch (error: any) {
      this.logger.error(`HF Prompt Enhancement Error: ${error.message}`);
      return { success: true, data: params.prompt, provider: this.name, model: 'fallback', latencyMs: Date.now() - start };
    }
  }
}
