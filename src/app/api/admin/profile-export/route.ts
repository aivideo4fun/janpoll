import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { toCsv } from '@/lib/admin-export/format';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 if(!await isAdmin())return new NextResponse('Unauthorized',{status:401,headers});
 const mobileOnly=new URL(request.url).searchParams.get('mobile')==='1';
 try {
  const users=await db.$queryRaw<Array<{id:string;name:string|null;email:string|null;mobile:string|null}>>`SELECT id,name,email,mobile FROM "User" WHERE (${mobileOnly}=false OR mobile IS NOT NULL) ORDER BY id LIMIT 200001`;
  if(users.length>200000)return new NextResponse('More than 200,000 accounts. Export in smaller batches with administrator assistance.',{status:413,headers});
  return new NextResponse(toCsv(['user_id','name','email','optional_mobile','mobile_verification'],users.map(u=>[u.id,u.name,u.email,u.mobile,u.mobile?'self-reported; not OTP verified':'not provided'])),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="janpoll-account-profiles.csv"'}});
 }catch{return new NextResponse('Profile export unavailable. Apply the profile-mobile migration and retry.',{status:503,headers});}
}
