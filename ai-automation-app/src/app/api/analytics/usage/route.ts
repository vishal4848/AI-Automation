import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '7d';
    
    const response = await backendFetch(`/api/v1/analytics/usage?period=${period}`, { method: 'GET' }, req);
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: `Backend error: ${response.status}` }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
