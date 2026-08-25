export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const response = await backendFetch(`/api/v1/videos/${resolvedParams.id}`, { method: 'DELETE' }, req);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const response = await backendFetch(`/api/v1/videos/${resolvedParams.id}/favorite`, { method: 'PATCH', body: JSON.stringify(body) }, req);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
