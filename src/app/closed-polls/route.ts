import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allPolls = await db.poll.findMany({
      where: { active: true },
      select: {
        id: true,
        slug: true,
        question: true,
        active: true,
        createdAt: true,
        deadlineDays: true,
        options: {
          select: { id: true, text: true, voteCount: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const closedPolls = allPolls.filter((poll) => !isPollOpen(poll));
    return NextResponse.json({ polls: closedPolls });
  } catch (error) {
    return NextResponse.json({ polls: [], error: 'Failed' }, { status: 500 });
  }
}