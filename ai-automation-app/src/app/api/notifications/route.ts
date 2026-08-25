export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const response = await backendFetch(`/api/v1/notifications?page=${page}&limit=${limit}`, {}, req);
    const data = await response.json().catch(() => ({ notifications: [], unreadCount: 0 }));
    const payload = data?.data !== undefined ? data.data : data;
    return NextResponse.json({
      success: response.ok,
      notifications: payload?.notifications || [],
      total: payload?.total || 0,
      unreadCount: payload?.unreadCount || 0,
    }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, notifications: [], total: 0, unreadCount: 0, error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const response = await backendFetch('/api/v1/notifications', { method: 'DELETE' }, req);
    const data = await response.json().catch(() => ({}));
    const payload = data?.data !== undefined ? data.data : data;
    return NextResponse.json({ success: response.ok, ...payload }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
