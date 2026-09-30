import Link from 'next/link';
import { notFound } from 'next/navigation';

import { db } from '@/lib/db';
import PollClientView from './PollClientView';

type PollPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PollPage({ params }: PollPageProps) {
  const { id } = await params;

  const poll = await db.poll.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      question: true,
      deadlineDays: true,
      options: {
        select: {
          id: true,
          text: true,
          voteCount: true,
        },
        orderBy: {
          id: 'asc',
        },
      },
    },
  });

  if (!poll) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <span aria-hidden="true">←</span>
            होम पेज पर वापस जाएं
          </Link>
        </nav>

        <PollClientView poll={poll} />
      </div>
    </main>
  );
}