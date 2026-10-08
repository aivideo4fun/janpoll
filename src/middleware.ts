// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Agar user /admin par ja raha hai (login page ko chhod kar ya session check ke liye)
  if (path.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session')?.value;

    // Agar session cookie nahi hai, toh user ko block karne ki zaroorat nahi hai 
    // kyunki page khud LoginScreen dikha deta hai, lekin agar aap chahein toh 
    // yhin se redirect bhi kar sakte hain.
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};