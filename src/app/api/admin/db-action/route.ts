import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
export const dynamic='force-dynamic';
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({message:'Unauthorized'},{status:401});
  return NextResponse.json({message:'Database schema changes must run through the reviewed server deployment process. Web-triggered Prisma commands are disabled.'},{status:410});
}
