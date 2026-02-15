import { NextRequest, NextResponse } from 'next/server';

// Protect certain paths (server-side middleware)
const PROTECTED_PATHS = ['/dashboard', '/profile', '/games', '/analysis'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const auth = req.headers.get('authorization') || req.cookies.get('sb:token')?.value;
    if (!auth) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/games/:path*', '/analysis/:path*'],
};
