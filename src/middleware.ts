import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Agar user /admin ya uske andar ke kisi route par ja raha hai
  if (path.startsWith('/admin')) {
    // Admin session cookie check karein (jo login hone par set hoti hai)
    const adminSession = request.cookies.get('admin_session')?.value;

    // Agar session cookie nahi milti, toh user ko admin login page par redirect kar dein
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};