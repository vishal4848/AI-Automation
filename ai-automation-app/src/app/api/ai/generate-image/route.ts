export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/api-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Route exclusively through NestJS backend
    const result = await backendPost('/api/v1/images/generate', {
      prompt: body.prompt,
      negativePrompt: body.negative_prompt || body.negativePrompt,
      model: body.model || 'flux-schnell',
      style: body.style,
      ratio: body.ratio,
      steps: body.steps,
      enhancePrompt: body.enhancePrompt || false,
      provider: body.provider,
    }, req) as any;
    
    // Normalize response for existing frontend
    const imageData = result.data || result;
    return NextResponse.json({
      success: true,
      image: imageData.url,
      imageUrl: imageData.url,
      model: imageData.model,
      prompt: imageData.prompt,
      enhancedPrompt: imageData.enhancedPrompt,
      provider: imageData.provider,
      demo: imageData.demo,
      id: imageData.id,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
