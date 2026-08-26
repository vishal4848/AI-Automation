export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const resourceType = searchParams.get('resourceType') || '';
    const projectId = searchParams.get('projectId') || '';

    let path = `/api/v1/assets?page=${page}&limit=${limit}`;
    if (resourceType) path += `&resourceType=${resourceType}`;
    if (projectId) path += `&projectId=${projectId}`;

    const response = await backendFetch(path, {}, req);
    const data = await response.json().catch(() => ({ assets: [], total: 0 }));
    const payload = data?.data !== undefined ? data.data : data;

    return NextResponse.json(
      {
        success: response.ok,
        assets: payload?.assets || (Array.isArray(payload) ? payload : []),
        total: payload?.total || 0,
        page: payload?.page || 1,
        pages: payload?.pages || 1,
      },
      { status: response.status },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, assets: [], total: 0, error: error.message },
      { status: error.status || 500 },
    );
  }
}
