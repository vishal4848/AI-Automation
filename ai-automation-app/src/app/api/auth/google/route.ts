import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  return NextResponse.redirect(`${backendUrl}/api/v1/auth/google`);
}
