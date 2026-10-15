export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(req: Request) {
  try {
    const response = await backendFetch('/api/v1/models/providers/status', {}, req);
    const data = await response.json();
    return NextResponse.json({ success: true, providers: data.data || data });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      providers: [
        { id: 'replicate', name: 'Replicate', configured: false, envVar: 'REPLICATE_API_TOKEN', categories: ['IMAGE', 'VIDEO'] },
        { id: 'openai', name: 'OpenAI / ChatGPT', configured: false, envVar: 'OPENAI_API_KEY', categories: ['IMAGE', 'TEXT', 'MULTIMODAL'] },
        { id: 'gemini', name: 'Google Gemini', configured: false, envVar: 'GEMINI_API_KEY', categories: ['IMAGE', 'TEXT', 'MULTIMODAL'] },
        { id: 'fal', name: 'Fal.ai', configured: false, envVar: 'FAL_KEY', categories: ['IMAGE', 'VIDEO'] },
        { id: 'huggingface', name: 'Hugging Face', configured: false, envVar: 'HUGGINGFACE_API_TOKEN', categories: ['IMAGE'] },
      ],
      error: err.message,
    });
  }
}
