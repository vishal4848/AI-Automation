import { NextResponse } from 'next/server';
import { backendGet, backendFetch } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const profile = await backendGet('/api/v1/auth/profile', req);
    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profile' },
      { status: error.status || 401 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const res = await backendFetch(
      '/api/v1/auth/profile',
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
      req,
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Update failed' }));
      return NextResponse.json(
        { success: false, error: err.message || 'Failed to update profile' },
        { status: res.status },
      );
    }

    const updated = await res.json();
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: error.status || 500 },
    );
  }
}
