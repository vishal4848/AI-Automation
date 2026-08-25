export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  try {
    const response = await backendFetch(`/api/v1/models${category ? `?category=${category}` : ''}`, {}, req);
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    // Fallback: return hardcoded model list
    return NextResponse.json({ success: true, data: [
      { id: '1', provider: 'huggingface', name: 'flux-schnell', displayName: 'FLUX Schnell', category: 'IMAGE', pricePerGeneration: 3, isActive: true },
      { id: '2', provider: 'huggingface', name: 'flux-dev', displayName: 'FLUX Dev', category: 'IMAGE', pricePerGeneration: 5, isActive: true },
      { id: '3', provider: 'huggingface', name: 'sdxl', displayName: 'SDXL', category: 'IMAGE', pricePerGeneration: 4, isActive: true },
      { id: '4', provider: 'fal', name: 'wan-t2v', displayName: 'Wan T2V', category: 'VIDEO', pricePerGeneration: 20, isActive: true },
    ]});
  }
}
