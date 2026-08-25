import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const response = await backendFetch(`/api/v1/social/accounts/${params.id}`, { method: 'DELETE' }, req);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Backend error' }));
      throw new Error(error.message || `Backend error: ${response.status}`);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
