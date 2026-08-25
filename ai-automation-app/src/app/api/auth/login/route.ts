import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const text = await response.text();
    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Backend server returned an invalid response. Please ensure backend is running.' },
        { status: 502 }
      );
    }

    if (!response.ok || !json.success) {
      return NextResponse.json(
        { success: false, error: json.message || 'Invalid email or password.' },
        { status: response.status || 401 }
      );
    }

    const authData = json.data;
    const accessToken = authData.accessToken;
    const user = authData.user;

    const cookieStore = await cookies();
    cookieStore.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication failed. Please check backend connection.' },
      { status: 500 }
    );
  }
}
