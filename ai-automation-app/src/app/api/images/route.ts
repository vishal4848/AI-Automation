export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const projectId = searchParams.get('projectId');
    const query = new URLSearchParams({ page, limit });
    if (projectId) query.set('projectId', projectId);
    const response = await backendFetch(`/api/v1/images?${query.toString()}`, {}, req);
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: true, data: { images: [], total: 0, page: 1, pages: 0 } });
  }
}
