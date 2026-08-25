import { NextResponse } from 'next/server';
import { backendGet } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const result = (await backendGet('/api/v1/social/facebook/accounts', req)) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch Facebook accounts.' },
      { status: error.status || 500 }
    );
  }
}
