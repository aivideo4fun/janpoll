import 'server-only';
import { db } from '@/lib/db';
export function analyticsDays(value?:string){const n=Number(value);return [7,30,90].includes(n)?n:30;}
export async function getAnalytics(days:number){
 const since=new Date(Date.now()-days*86400000);const liveSince=new Date(Date.now()-300000);
 const [polls,votes,tally,loginVotes,attempts,traffic,sessions,activeSessions,devices,paths,referrers,daily,states,running]=await Promise.all([
  db.poll.count(),db.vote.count({where:{createdAt:{gte:since}}}),db.pollOption.aggregate({_sum:{voteCount:true}}),db.vote.count({where:{createdAt:{gte:since},userId:{not:null}}}),
  db.voteAttempt.groupBy({by:['outcome'],where:{createdAt:{gte:since}},_count:{_all:true}}),
  db.trafficEvent.count({where:{createdAt:{gte:since}}}),
  db.$queryRaw<{count:bigint}[]>`SELECT COUNT(DISTINCT "sessionHash") AS count FROM "TrafficEvent" WHERE "createdAt">=${since}`,
  db.$queryRaw<{count:bigint}[]>`SELECT COUNT(DISTINCT "sessionHash") AS count FROM "TrafficEvent" WHERE "createdAt">=${liveSince}`,
  db.trafficEvent.groupBy({by:['deviceType'],where:{createdAt:{gte:since}},_count:{_all:true}}),
  db.trafficEvent.groupBy({by:['path'],where:{createdAt:{gte:since}},_count:{_all:true},orderBy:{_count:{path:'desc'}},take:15}),
  db.trafficEvent.groupBy({by:['referrerHost'],where:{createdAt:{gte:since}},_count:{_all:true},orderBy:{_count:{id:'desc'}},take:10}),
  db.$queryRaw<{day:string;votes:bigint}[]>`SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata','YYYY-MM-DD') AS day, COUNT(*) AS votes FROM "Vote" WHERE "createdAt">=${since} GROUP BY day ORDER BY day`,
  db.$queryRaw<{state:string;polls:bigint;votes:bigint}[]>`WITH totals AS (SELECT "pollId",SUM("voteCount") AS votes FROM "PollOption" GROUP BY "pollId") SELECT COALESCE(p."stateCode",CASE WHEN p."districtId" IS NOT NULL OR p."districtName" IS NOT NULL THEN 'RJ (legacy)' ELSE p."scope"::text END) AS state,COUNT(*) AS polls,COALESCE(SUM(t.votes),0)::bigint AS votes FROM "Poll" p LEFT JOIN totals t ON t."pollId"=p.id GROUP BY state ORDER BY votes DESC`,
  db.$queryRaw<{count:bigint}[]>`SELECT COUNT(*) AS count FROM "Poll" WHERE active=true AND "createdAt"+(COALESCE("deadlineDays",3)*INTERVAL '1 day')>NOW() AT TIME ZONE 'UTC'`,
 ]);
 const recordedTotal=await db.vote.count();
 return {days,since,polls,running:Number(running[0]?.count||0),votes,tally:tally._sum.voteCount||0,recordedTotal,loginVotes,attempts,traffic,sessions:Number(sessions[0]?.count||0),activeSessions:Number(activeSessions[0]?.count||0),devices,paths,referrers,daily:daily.map(row=>({...row,votes:Number(row.votes)})),states:states.map(row=>({...row,polls:Number(row.polls),votes:Number(row.votes)}))};
}
