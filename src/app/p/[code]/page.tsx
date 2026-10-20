import { notFound, redirect } from 'next/navigation';

import { db } from '@/lib/db';
import { decodePublicPollId } from '@/lib/public-poll-id';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ShortPollPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const id = decodePublicPollId(code);

  if (!id) notFound();

  const poll = await db.poll.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!poll) notFound();

  redirect(`/poll/${encodeURIComponent(poll.id)}`);
}