import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { takeRateLimit } from '@/lib/rate-limit';
export const dynamic='force-dynamic';
const schema=z.object({id:z.string().uuid(),sessionId:z.string().uuid(),path:z.string().min(1).max(500),referrerHost:z.string().max(255).nullable(),deviceType:z.enum(['mobile','desktop']),consent:z.literal(true)}).strict();
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(process.env.NEXTAUTH_URL||request.url).origin)return new NextResponse(null,{status:403});
 try {
  const raw=await request.text();if(raw.length>2000)return new NextResponse(null,{status:413});
  const parsed=schema.safeParse(JSON.parse(raw));if(!parsed.success)return new NextResponse(null,{status:400});
  const input=parsed.data;
  if(!input.path.startsWith('/')||input.path.includes('?')||input.path.includes('#')||/^\/(api|admin|profile|my-polls|poll-created)(\/|$)/.test(input.path))return new NextResponse(null,{status:400});
  if(!process.env.VOTE_SALT)return new NextResponse(null,{status:503});
  const sessionHash=createHmac('sha256',process.env.VOTE_SALT).update('analytics:'+input.sessionId).digest('hex');
  if(!(await takeRateLimit('analytics',sessionHash,60)).allowed)return new NextResponse(null,{status:429});
  const host=input.referrerHost&&/^[a-z0-9.-]+$/i.test(input.referrerHost)?input.referrerHost.toLowerCase():null;
  await db.trafficEvent.upsert({where:{id:input.id},update:{},create:{id:input.id,path:input.path,referrerHost:host,deviceType:input.deviceType,sessionHash}});
  return new NextResponse(null,{status:204});
 }catch{return new NextResponse(null,{status:400});}
}
