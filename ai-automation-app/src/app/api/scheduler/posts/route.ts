import { NextResponse } from 'next/server';
import { backendGet, backendPost } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const result = await backendGet('/api/v1/scheduler/posts', req) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await backendPost('/api/v1/scheduler/posts', body, req) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
