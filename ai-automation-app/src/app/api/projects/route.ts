export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(req: Request) {
  try {
    const response = await backendFetch('/api/v1/projects', {}, req);
    const data = await response.json().catch(() => ({ projects: [], total: 0 }));
    const payload = data?.data !== undefined ? data.data : data;
    const projects = payload?.projects || (Array.isArray(payload) ? payload : []);
    const total = payload?.total !== undefined ? payload.total : projects.length;
    return NextResponse.json({
      success: response.ok,
      projects,
      total,
    }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, projects: [], total: 0, error: error.message }, { status: error.status || 500 });
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
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: data.message || data.error || 'Failed to create project',
      }, { status: response.status });
    }
    const payload = data?.data !== undefined ? data.data : data;
    return NextResponse.json({
      success: true,
      ...payload,
    }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create project' }, { status: error.status || 500 });
  }
}
