import { notFound, redirect } from 'next/navigation';

import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{
    code: string;
  }>;
};

export default async function SharedPollPage({ params }: Props) {
  const { code } = await params;

  if (!/^[A-Za-z0-9_-]{8}$/.test(code)) {
    notFound();
  }

  const poll = await db.poll.findUnique({
    where: {
      shareCode: code,
    },
    select: {
      id: true,
    },
  });

  if (!poll) {
    notFound();
  }

  redirect(`/poll/${encodeURIComponent(poll.id)}`);
}