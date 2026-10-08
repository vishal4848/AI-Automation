export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/api-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await backendPost<any>('/api/v1/prompts/copilot', body, req);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get copilot response' },
      { status: error.status || 500 },
    );
  }
}
