import { NextResponse } from 'next/server';
import { backendGet } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const flow = searchParams.get('flow');
    const path = flow ? `/api/v1/social/instagram/connect-url?flow=${encodeURIComponent(flow)}` : '/api/v1/social/instagram/connect-url';
    const result = (await backendGet(path, req)) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate Instagram OAuth.' },
      { status: error.status || 500 }
    );
  }
}
