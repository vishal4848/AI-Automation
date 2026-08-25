import { NextResponse } from 'next/server';
import { backendDelete } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = (await backendDelete(`/api/v1/social/facebook/accounts/${id}`, req)) as any;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect Facebook account.' },
      { status: error.status || 500 }
    );
  }
}
