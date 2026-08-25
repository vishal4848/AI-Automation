export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const response = await backendFetch(`/api/v1/videos?page=${page}&limit=${limit}`, {}, req);
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: true, data: { videos: [], total: 0, page: 1, pages: 0 } });
  }
}
