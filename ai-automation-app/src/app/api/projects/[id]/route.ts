export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const response = await backendFetch(`/api/v1/projects/${resolvedParams.id}`, {}, req);
    const data = await response.json().catch(() => ({}));
    const payload = data?.data !== undefined ? data.data : data;
    return NextResponse.json({ success: response.ok, ...payload }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const response = await backendFetch(`/api/v1/projects/${resolvedParams.id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }, req);
    const data = await response.json().catch(() => ({}));
    const payload = data?.data !== undefined ? data.data : data;
    return NextResponse.json({ success: response.ok, ...payload }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const response = await backendFetch(`/api/v1/projects/${resolvedParams.id}`, {
      method: 'DELETE',
    }, req);
    const data = await response.json().catch(() => ({}));
    const payload = data?.data !== undefined ? data.data : data;
    return NextResponse.json({ success: response.ok, ...payload }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
