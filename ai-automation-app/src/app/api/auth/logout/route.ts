import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('auth_token', '', {
      httpOnly: true,
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

