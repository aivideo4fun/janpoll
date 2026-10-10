import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasAlreadyVoted } from '@/lib/voter';
import type { Metadata } from 'next';

import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';
import PollClientView from './PollClientView';
export const dynamic = 'force-dynamic';

type PollPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PollPageProps): Promise<Metadata> {
  const { id } = await params;
  
  const poll = await db.poll.findUnique({
    where: { id },
    select: { question: true },
  });

  if (!poll) {
    return {
      title: 'पोल नहीं मिला - JanPoll',
      description: 'यह पोल अब उपलब्ध नहीं है।',
    };
  }

  return {
    title: `${poll.question} - JanPoll Rajasthan`,
    description: `इस विषय पर अपना वोट दें और राजस्थान की जनता का मत जानें।`,
    openGraph: {
      title: poll.question,
      description: 'JanPoll पर अपना वोट दर्ज करें और परिणाम देखें।',
      type: 'article',
    },
  };
}

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
      districtName: true,
      samitiName: true,
      gramPanchayatName: true,
      gramPanchayatId: true,
      options: {
        select: { id: true, text: true, voteCount: true, order: true, createdAt: true },
      },
    },
  });

  if (!poll) {
    notFound();
  }

  const sortedOptions = poll.options.sort((a, b) => {
    if (a.order !== null && b.order !== null && a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const alreadyVoted = await hasAlreadyVoted(poll.id);

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

          {/* 🛠️ Safe optional chaining applied here */}
          {poll?.gramPanchayatName && (
            <Link
              href={`/create?gpId=${poll.gramPanchayatId || ''}&gp=${encodeURIComponent(poll.gramPanchayatName)}&samiti=${encodeURIComponent(poll.samitiName || '')}&district=${encodeURIComponent(poll.districtName || '')}`}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow inline-block"
            >
              ＋ इस पंचायत में नया पोल बनाएँ →
            </Link>
          )}
        </nav>

        <PollClientView
          poll={{
            id: poll!.id,
            question: poll!.question,
            deadlineDays: poll!.deadlineDays,
            createdAt: poll!.createdAt.toISOString(),
            options: sortedOptions,
          }}
          alreadyVoted={alreadyVoted}
          isOpen={isOpen}
        />

        <div className="mt-8 p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm text-center">
          <span className="text-[10px] text-gray-400 block mb-2 uppercase tracking-wider font-semibold">विज्ञापन</span>
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-4603205178906314"
               data-ad-slot="YOUR_POLL_PAGE_AD_SLOT"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({});' }} />
        </div>
      </div>
    </main>
  );
}