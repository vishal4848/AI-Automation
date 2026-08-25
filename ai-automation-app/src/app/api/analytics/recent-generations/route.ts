import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const response = await backendFetch(`/api/v1/analytics/recent-generations`, { method: 'GET' }, req);
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: `Backend error: ${response.status}` }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
