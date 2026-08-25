export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  model: string;
  style?: string;
  ratio?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  numImages?: number;
}

export interface GenerateVideoParams {
  prompt: string;
  model: string;
  duration?: number;
  resolution?: string;
  fps?: number;
  style?: string;
}

export interface EnhancePromptParams {
  prompt: string;
  category?: 'image' | 'video';
  style?: string;
}

export interface AIProviderResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  provider: string;
  model: string;
  latencyMs: number;
  demo?: boolean;
}

export interface GeneratedImageResult {
  url: string;
  base64?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface GeneratedVideoResult {
  url: string;
  duration?: number;
  thumbnailUrl?: string;
}

export interface AIProvider {
  readonly name: string;
  readonly supportedImageModels: string[];
  readonly supportedVideoModels: string[];
  isAvailable(): boolean;
  generateImage(params: GenerateImageParams): Promise<AIProviderResponse<GeneratedImageResult>>;
  generateVideo(params: GenerateVideoParams): Promise<AIProviderResponse<GeneratedVideoResult>>;
  enhancePrompt(params: EnhancePromptParams): Promise<AIProviderResponse<string>>;
}

export function getSvgFallbackImage(prompt: string, model: string, provider: string, style?: string): string {
  const enhancedPrompt = style ? `${prompt}, in ${style} style` : prompt;
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(enhancedPrompt || 'futuristic artwork');
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`;
}

