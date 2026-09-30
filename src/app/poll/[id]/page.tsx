import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PollClientView from './PollClientView';

export default async function PollPage({ params }: { params: { id: string } }) {
  const { id } = params;

  let poll = null;
  try {
    poll = await db.poll.findUnique({
      where: { id },
      include: {
        options: true,
        votes: true,
      },
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
  }

  if (!poll) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-gray-800">
      {/* Top Back Link */}
      <div className="mb-6">
        <Link href="/" className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm flex items-center gap-1">
          &larr; होम पेज पर वापस जाएं
        </Link>
      </div>

      {/* Render Client View */}
      <PollClientView poll={poll} />
    </div>
  );
}