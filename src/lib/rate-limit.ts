import 'server-only';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
export async function takeRateLimit(scope: string, actor: string, limit: number, seconds=60) {
  const window=Math.floor(Date.now()/(seconds*1000));
  const key=createHash('sha256').update(`${scope}:${actor}:${window}`).digest('hex');
  const bucket=await db.rateLimitBucket.upsert({where:{key},create:{key,count:1,expiresAt:new Date((window+2)*seconds*1000)},update:{count:{increment:1}},select:{count:true}});
  return {allowed:bucket.count<=limit,count:bucket.count};
}
