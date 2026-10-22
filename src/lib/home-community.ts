import 'server-only';
import { db } from '@/lib/db';
export const ISSUE_POLL_ID = 'aed4d5d2-6280-47d0-93a2-e4d2049345b1';
export async function getRecentSessions() {
  // Counts recent consenting sessions, not verified unique people or page views.
  const rows = await db.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(DISTINCT "sessionHash")::bigint AS count FROM "TrafficEvent" WHERE "createdAt" >= ${new Date(Date.now()-5*60000)}`;
  return Number(rows[0]?.count || 0);
}
export async function getIssuePoll() {
  return db.poll.findUnique({where:{id:ISSUE_POLL_ID},select:{id:true,question:true,active:true,createdAt:true,deadlineDays:true}}).catch(()=>null);
}
