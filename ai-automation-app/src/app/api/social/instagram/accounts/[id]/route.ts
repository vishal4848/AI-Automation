import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await backendFetch(`/api/v1/social/instagram/accounts/${id}`, {
      method: 'DELETE',
    }, req);

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}
