import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const path = `/api/v1/admin/${slug.join('/')}${url.search}`;
  try {
    const res = await backendFetch(path, { method: 'GET' }, req);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Admin operation failed' },
      { status: err.status || 500 },
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = `/api/v1/admin/${slug.join('/')}`;
  try {
    const body = await req.json();
    const res = await backendFetch(
      path,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      req,
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Admin operation failed' },
      { status: err.status || 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = `/api/v1/admin/${slug.join('/')}`;
  try {
    const body = await req.json();
    const res = await backendFetch(
      path,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
      req,
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Admin operation failed' },
      { status: err.status || 500 },
    );
  }
}
