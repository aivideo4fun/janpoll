import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { exportData, ExportInputError } from '@/lib/admin-export/data';
import { toCsv } from '@/lib/admin-export/format';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const privateHeaders={'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request,{params}:{params:Promise<{kind:string}>}) {
  if(!(await isAdmin()))return new NextResponse('Unauthorized',{status:401,headers:privateHeaders});
  const {kind}=await params;
  if(kind!=='support'&&kind!=='creators')return new NextResponse('Unknown export type',{status:404,headers:privateHeaders});
  try{
    const data=await exportData(kind,new URL(request.url).searchParams);
    return new NextResponse(toCsv(data.headers,data.rows),{headers:{...privateHeaders,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="janpoll-${kind}-${data.view}-${new Date().toISOString().slice(0,10)}.csv"`}});
  }catch(error){
    if(error instanceof ExportInputError)return new NextResponse(error.message,{status:400,headers:privateHeaders});
    console.error('Admin export failed', error instanceof Error ? error.name : 'Unknown error');
    return new NextResponse('Export unavailable. Please retry or narrow the filters.',{status:503,headers:privateHeaders});
  }
}
