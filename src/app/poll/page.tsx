import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import PollClientView from './PollClientView';

export default async function PollPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const poll = await db.poll.findUnique({
    where: { id },
    include: {
      options: {
        orderBy: { voteCount: 'asc' },
      },
    },
  });

  if (!poll) {
    notFound();
  }

  return <PollClientView poll={poll} />;
}