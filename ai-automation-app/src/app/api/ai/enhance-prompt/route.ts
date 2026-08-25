export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/api-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, category } = body;
    if (!prompt) return NextResponse.json({ success: false, error: 'Prompt required' }, { status: 400 });
    
    try {
      const result = await backendPost('/api/v1/prompts/enhance', { prompt, category }, req) as any;
      return NextResponse.json({ success: true, ...( result.data || result) });
    } catch {
      // Fallback enhancement
      const enhanced = `${prompt}, highly detailed, professional lighting, 8K resolution, photorealistic, award-winning`;
      return NextResponse.json({ success: true, original: prompt, enhanced, improved: true, demo: true });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
