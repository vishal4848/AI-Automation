import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result: any = await backendPost('/api/v1/auth/resend-otp', body, req);
    const data = result?.data || result;
    return NextResponse.json({
      success: true,
      message: data?.message || result?.message || 'Verification code resent.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resend OTP' },
      { status: error.status || 400 },
    );
  }
}
