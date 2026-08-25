import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const result = await backendPost(`/api/v1/scheduler/posts/${params.id}/publish`, {}, req) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
