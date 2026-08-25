import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = (await backendPost('/api/v1/social/token-connect', body, req)) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to connect social account with access token.' },
      { status: error.status || 500 }
    );
  }
}
