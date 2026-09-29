export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/api-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = (await backendPost(
      '/api/v1/videos/generate',
      {
        prompt: body.prompt,
        model: body.model || 'wan-3',
        duration: body.duration || 5,
        resolution: body.resolution,
        aspectRatio: body.aspectRatio,
        style: body.style,
        provider: body.provider,
        inputImage: body.inputImage || body.referenceImage || body.image,
      },
      req,
    )) as any;

    const videoData = result.data || result;
    return NextResponse.json({
      success: true,
      id: videoData.id,
      status: videoData.status || (videoData.url ? 'COMPLETED' : 'PROCESSING'),
      videoUrl: videoData.url || videoData.secureUrl,
      model: videoData.model,
      provider: videoData.provider,
      demo: videoData.demo,
      message: videoData.message,
    });
  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 },
    );
  }
}
