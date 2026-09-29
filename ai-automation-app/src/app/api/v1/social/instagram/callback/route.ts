export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const targetUrl = new URL('/api/v1/social/instagram/callback', backendUrl);
    
    // Forward all query parameters from Instagram
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    return NextResponse.redirect(targetUrl.toString());
  } catch (error: any) {
    console.error('Error forwarding Instagram callback to backend:', error);
    return NextResponse.redirect('http://localhost:3000/social-accounts?error=Callback_Forwarding_Error');
  }
}
