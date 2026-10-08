import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/ai-image',
  '/ai-video',
  '/ai-caption',
  '/hashtag',
  '/analytics',
  '/scheduler',
  '/social-accounts',
  '/content-library',
  '/upload',
  '/settings',
  '/workspace',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already authenticated and visits login/signup, redirect to dashboard
  if (authToken && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/ai-image/:path*',
    '/ai-video/:path*',
    '/ai-caption/:path*',
    '/hashtag/:path*',
    '/analytics/:path*',
    '/scheduler/:path*',
    '/social-accounts/:path*',
    '/content-library/:path*',
    '/upload/:path*',
    '/settings/:path*',
    '/workspace/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
};
