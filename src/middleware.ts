import { NextResponse, type NextRequest } from 'next/server';
// Authorization remains in every admin page, route and server action.
// A cookie's presence is never treated as proof of admin access here.
export function middleware(request: NextRequest) {
  if (request.headers.has('x-middleware-subrequest')) {
    return new NextResponse('Invalid request header', { status: 400 });
  }
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'self'; base-uri 'self'; object-src 'none'");
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (/^\/(admin|profile|my-polls|poll-created|api)(\/|$)/.test(path)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'private, no-store');
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') response.headers.set('Cache-Control','no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|logo.png).*)'] };
