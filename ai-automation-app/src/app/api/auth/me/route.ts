import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'No active session.' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      cookieStore.delete('auth_token');
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Session expired.' },
        { status: 401 }
      );
    }

    const text = await response.text();
    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Invalid profile response.' },
        { status: 502 }
      );
    }
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: json.data || json,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
