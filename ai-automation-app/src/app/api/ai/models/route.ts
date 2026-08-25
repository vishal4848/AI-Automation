import { NextResponse } from 'next/server';
import { backendGet } from '@/lib/api-client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    // Call the NestJS backend
    const url = category ? `/api/v1/models?category=${category}` : '/api/v1/models';
    const models = await backendGet<any>(url, req);
    
    return NextResponse.json({ success: true, models: models.data || models });
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
