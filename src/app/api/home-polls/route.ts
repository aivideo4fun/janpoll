import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getDeadline(createdAt: Date, deadlineDays: number | null) {
  const date = new Date(createdAt);
  const days = deadlineDays ?? 7;
  date.setDate(date.getDate() + days);
  return date;
}

function isPollOpen(poll: any) {
  const deadline = getDeadline(poll.createdAt, poll.deadlineDays);
  return deadline.getTime() > Date.now();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const searchQuery = q.trim().toLowerCase();

    const [allPolls, voteSum] = await Promise.all([
      db.poll.findMany({
        where: { active: true },
        select: {
          id: true,
          slug: true,
          question: true,
          districtName: true,
          samitiName: true,
          gramPanchayatName: true,
          active: true,
          createdAt: true,
          deadlineDays: true,
          options: {
            select: { id: true, text: true, voteCount: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.pollOption.aggregate({ _sum: { voteCount: true } }),
    ]);

    const activePolls = allPolls.filter(isPollOpen);
    const totalRunningPollsCount = activePolls.length;

    let pollsWithVotes = activePolls.map((poll) => {
      const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
      return { ...poll, totalVotes, createdAt: poll.createdAt.toISOString() };
    });

    pollsWithVotes.sort((a, b) => b.totalVotes - a.totalVotes);

    if (searchQuery) {
      pollsWithVotes = pollsWithVotes.filter((p: any) => {
        const qText = p.question.toLowerCase();
        const dist = ((p.districtName as string) ?? '').toLowerCase();
        const samiti = ((p.samitiName as string) ?? '').toLowerCase();
        const gp = ((p.gramPanchayatName as string) ?? '').toLowerCase();

        return (
          qText.includes(searchQuery) ||
          dist.includes(searchQuery) ||
          samiti.includes(searchQuery) ||
          gp.includes(searchQuery)
        );
      });
    }

    const totalVotesCount = voteSum._sum.voteCount ?? 0;

    return NextResponse.json({
      success: true,
      polls: pollsWithVotes,
      totalVotesCount,
      totalRunningPollsCount,
    });
  } catch (error) {
    console.error('Home polls API error:', error);
    return NextResponse.json({ success: false, polls: [] }, { status: 500 });
  }
}