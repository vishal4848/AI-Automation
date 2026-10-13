import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPost } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result: any = await backendPost('/api/v1/auth/verify-otp', body, req);
    const data = result?.data || result;
    const accessToken = data?.accessToken || result?.accessToken;
    const user = data?.user || result?.user;

    if (accessToken) {
      const cookieStore = await cookies();
      cookieStore.set('auth_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return NextResponse.json({
      success: true,
      message: data?.message || result?.message || 'Verification successful',
      user,
      accessToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify OTP' },
      { status: error.status || 400 },
    );
  }
}
