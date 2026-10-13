import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result: any = await backendPost('/api/v1/auth/send-login-otp', body, req);
    const data = result?.data || result;
    return NextResponse.json({
      success: true,
      requiresOtp: true,
      email: data?.email || body?.email,
      purpose: 'LOGIN',
      message: data?.message || 'A 6-digit login verification code has been dispatched.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch login OTP.' },
      { status: error.status || 400 },
    );
  }
}
