import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';
import { DEVICE_COOKIE } from '@/lib/voter';
import PollClientView from './PollClientView';

export const dynamic = 'force-dynamic';

type PollPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PollPage({ params }: PollPageProps) {
  const { id } = await params;

  const poll = await db.poll.findUnique({
    where: { id },
    select: {
      id: true,
      question: true,
      deadlineDays: true,
      active: true,
      createdAt: true,
      options: {
        select: { id: true, text: true, voteCount: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!poll) {
    notFound();
  }

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value;

  let alreadyVoted = false;
  if (deviceId) {
    const existingVote = await db.vote.findUnique({
      where: {
        pollId_anonymousUserId: {
          pollId: poll.id,
          anonymousUserId: deviceId,
        },
      },
    });
    if (existingVote) {
      alreadyVoted = true;
    }
  }

  const isOpen = isPollOpen(poll);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <span aria-hidden="true">←</span>
            होम पेज पर वापस जाएं
          </Link>
        </nav>

        <PollClientView
          poll={{
            id: poll.id,
            question: poll.question,
            deadlineDays: poll.deadlineDays,
            createdAt: poll.createdAt.toISOString(), // 👈 Countdown ke liye bheja gaya hai
            options: poll.options,
          }}
          alreadyVoted={alreadyVoted}
          isOpen={isOpen}
        />
      </div>
    </main>
  );
}