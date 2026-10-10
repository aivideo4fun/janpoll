import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasAlreadyVoted } from '@/lib/voter';
import type { Metadata } from 'next';
import SmartBackLink from '@/components/SmartBackLink';
import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';

import PollClientView from '@/app/poll/[id]/PollClientView';

export const dynamic = 'force-dynamic';

type PollPageProps = {
  params: Promise<{ id: string; slug?: string[] }>;
};

export async function generateMetadata({ params }: PollPageProps): Promise<Metadata> {
  const { id } = await params;
  
  const poll = await db.poll.findUnique({
    where: { id },
    select: { question: true, districtName: true, gramPanchayatName: true },
  });

  if (!poll) {
    return {
      title: 'पोल नहीं मिला - JanPoll',
      description: 'यह पोल अब उपलब्ध नहीं है।',
    };
  }

  const pageTitle = `${poll.question} | JanPoll Rajasthan`;
  const pageDesc = `${poll.districtName || 'राजस्थान'} ${poll.gramPanchayatName ? `- ${poll.gramPanchayatName}` : ''} के इस विषय पर अपनी राय दें और जनता का मत जानें।`;
  const canonicalUrl = `https://janpoll.in/poll/${id}`;

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      poll.question,
      `${poll.districtName || 'Rajasthan'} public poll`,
      'JanPoll Rajasthan',
      'राजस्थान जनता की राय',
      'ऑनलाइन वोटिंग पोल',
    ],
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: canonicalUrl,
      siteName: 'JanPoll',
      locale: 'hi_IN',
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
    notFound(); // 👈 यहाँ सही function (notFound) उपयोग किया गया है
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
        
        {/* H2 Sub-heading added for SEO structure */}
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            {poll.districtName ? `जिला: ${poll.districtName}` : 'राजस्थान'} {poll.gramPanchayatName ? `| ग्राम पंचायत: ${poll.gramPanchayatName}` : ''}
          </h2>
        </div>

        <nav aria-label="Breadcrumb" className="mb-6 flex justify-between items-center">
          <SmartBackLink
            fallbackHref="/"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <span aria-hidden="true">←</span>
            पिछले पेज पर वापस जाएं
          </SmartBackLink>

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
            id: poll.id,
            question: poll.question,
            deadlineDays: poll.deadlineDays,
            createdAt: poll.createdAt.toISOString(),
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