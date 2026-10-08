import { NextResponse } from 'next/server';
import { backendGet, backendPatch, backendDelete } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const result = await backendGet(`/api/v1/scheduler/posts/${params.id}`, req) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await req.json();
    const result = await backendPatch(`/api/v1/scheduler/posts/${params.id}`, body, req) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const result = await backendDelete(`/api/v1/scheduler/posts/${params.id}`, req) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
