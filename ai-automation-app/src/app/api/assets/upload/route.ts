export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Extract authorization header or cookie
    let authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/auth_token=([^;]+)/);
      if (match && match[1]) {
        authHeader = `Bearer ${decodeURIComponent(match[1])}`;
      }
    }

    if (!authHeader) {
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (token) {
          authHeader = `Bearer ${token}`;
        }
      } catch {}
    }

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/assets/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    const payload = data?.data !== undefined ? data.data : data;

    return NextResponse.json(
      { success: response.ok, ...payload },
      { status: response.status },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to forward asset upload to backend.' },
      { status: error.status || 500 },
    );
  }
}
