import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPost } from '@/lib/api-client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await backendPost('/api/v1/auth/logout', {}, req).catch(() => {});
    const cookieStore = await cookies();
    cookieStore.set('auth_token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    cookieStore.delete('auth_token');
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: true, message: 'Logged out.' });
  }
}
