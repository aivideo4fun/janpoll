import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { POST as createPublicPoll } from './public/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [polls, voteSum] = await Promise.all([
      db.poll.findMany({
        where: { active: true },
        select: {
          id: true,
          slug: true,
          question: true,
          active: true,
          createdAt: true,
          deadlineDays: true,
          options: {
            select: {
              id: true,
              text: true,
              voteCount: true,
            },
            orderBy: [
              { order: 'asc' },
              { createdAt: 'asc' },
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      db.pollOption.aggregate({
        _sum: { voteCount: true },
      }),
    ]);

    return NextResponse.json({
      polls,
      totalVotesSum: voteSum._sum.voteCount ?? 0,
    });
  } catch (error) {
    console.error('Poll data fetch failed', error);

    return NextResponse.json(
      { message: 'पोल डेटा लोड नहीं हो सका।' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return createPublicPoll(request);
}