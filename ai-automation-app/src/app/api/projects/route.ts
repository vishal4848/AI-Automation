export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(req: Request) {
  try {
    const response = await backendFetch('/api/v1/projects', {}, req);
    const data = await response.json().catch(() => ({ projects: [], total: 0 }));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ projects: [], total: 0, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await backendFetch('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }, req);
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: error.status || 500 });
  }
}
