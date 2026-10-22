import 'server-only';
import type { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

export function indiaDayBounds(now = new Date()) {
  const offset = 330 * 60 * 1000;
  const india = new Date(now.getTime() + offset);
  const start = new Date(Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), india.getUTCDate()) - offset);
  return { start, end: new Date(start.getTime() + 86400000) };
}

const loadRanking = unstable_cache(async (start: string, end: string, filter: Prisma.PollWhereInput) => {
  const where: Prisma.PollWhereInput = { AND: [{ active: true }, filter] };
  const ranked = await db.vote.groupBy({
    by: ['pollId'],
    where: { createdAt: { gte: new Date(start), lt: new Date(end) }, poll: where },
    _count: { pollId: true },
    orderBy: [{ _count: { pollId: 'desc' } }, { pollId: 'asc' }],
    take: 4,
  });
  return ranked.map(row => ({id:row.pollId,votes:row._count.pollId}));
}, ['janpoll-daily-ranking-v3'], { revalidate: 30, tags: ['home-daily-ranking'] });

export async function getTodayTopPolls(filter: Prisma.PollWhereInput = {}) {
  const { start, end } = indiaDayBounds();
  const ranking = await loadRanking(start.toISOString(), end.toISOString(), filter);
  if (!ranking.length) return [];
  const ids=ranking.map(row=>row.id);
  // Keep Date objects outside the JSON data cache; poll expiry uses Date methods.
  const polls = await db.poll.findMany({
    where: { AND: [{ active: true }, filter, { id: { in: ids } }] },
    include: { options: true },
  });
  const byId = new Map(polls.map(poll => [poll.id, poll]));
  return ranking.flatMap(row => { const poll = byId.get(row.id); return poll ? [{...poll,todayVoteCount:row.votes}] : []; });
}
