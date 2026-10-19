import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { db } from '@/lib/db';
import { hasAlreadyVoted } from '@/lib/voter';
import { isPollOpen } from '@/lib/poll-utils';
import { getRegionByCode } from '@/lib/regions';

import SmartBackLink from '@/components/SmartBackLink';
import PollClientView from './[id]/PollClientView';

type Props = {
  params: {
    id: string;
    slug?: string[];
  };
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;

  const poll = await db.poll.findUnique({
    where: { id },
    select: {
      question: true,
      scope: true,
      stateCode: true,
      districtName: true,
      gramPanchayatName: true,
    },
  });

  if (!poll) {
    return {
      title: 'पोल नहीं मिला | JanPoll India',
      description: 'यह पोल उपलब्ध नहीं है।',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const region = getRegionByCode(poll.stateCode);

  const location =
    poll.scope === 'NATIONAL'
      ? 'भारत'
      : [
          region?.name,
          poll.districtName,
          poll.gramPanchayatName,
        ]
          .filter(Boolean)
          .join(' · ') || 'आपके क्षेत्र';

  const title = `${poll.question} | JanPoll India`;

  const description =
    `${location} के इस सवाल पर सार्वजनिक राय जानें। ` +
    'यह opinion poll है, आधिकारिक चुनावी मतदान नहीं।';

  const canonical =
    `https://janpoll.in/poll/${encodeURIComponent(id)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'JanPoll India',
      locale: 'hi_IN',
      type: 'website',
    },
  };
}

export default async function PollPage({ params }: Props) {
  const { id } = await params;

  // Only public poll information is selected.
  // Creator details and individual voter records are excluded.
  const poll = await db.poll.findUnique({
    where: { id },
    select: {
      id: true,
      question: true,
      deadlineDays: true,
      active: true,
      createdAt: true,

      scope: true,
      stateCode: true,
      topic: true,
      categoryType: true,
      electionType: true,

      districtId: true,
      districtName: true,
      samitiId: true,
      gramPanchayatId: true,
      gramPanchayatName: true,
      samitiWardId: true,
      zilaWardId: true,
      assemblyId: true,

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
  });

  if (!poll) {
    notFound();
  }

  const region = getRegionByCode(poll.stateCode);

  const locationLabel =
    poll.scope === 'NATIONAL'
      ? 'राष्ट्रीय जनमत'
      : [
          region?.name,
          poll.districtName,
          poll.gramPanchayatName,
        ]
          .filter(Boolean)
          .join(' · ') || 'JanPoll India';

  const query = new URLSearchParams();
  let createHref = '/create';

  if (region && poll.scope === 'STATE') {
    query.set('state', region.slug);

    const electionType = poll.electionType ?? '';

    const isElection = [
      'assembly',
      'sarpanch',
      'samiti',
      'zila',
    ].includes(electionType);

    if (isElection) {
      query.set('electionType', electionType);

      if (poll.districtId) {
        query.set('districtId', poll.districtId);
      }

      if (
        (electionType === 'sarpanch' || electionType === 'samiti') &&
        poll.samitiId
      ) {
        query.set('samitiId', poll.samitiId);
      }

      if (
        electionType === 'sarpanch' &&
        poll.gramPanchayatId
      ) {
        query.set('gramPanchayatId', poll.gramPanchayatId);
      }

      if (
        electionType === 'samiti' &&
        poll.samitiWardId
      ) {
        query.set('samitiWardId', poll.samitiWardId);
      }

      if (
        electionType === 'zila' &&
        poll.zilaWardId
      ) {
        query.set('zilaWardId', poll.zilaWardId);
      }

      if (
        electionType === 'assembly' &&
        poll.assemblyId
      ) {
        query.set('assemblyId', poll.assemblyId);
      }

      createHref = `/create/election?${query.toString()}`;
    } else {
      const topic =
        ['political', 'social', 'sports', 'others'].find(
          (value) => value === poll.topic,
        ) ??
        (
          poll.categoryType === 'political'
            ? 'political'
            : 'others'
        );

      query.set('topic', topic);

      if (poll.districtId) {
        query.set('districtId', poll.districtId);
      }

      createHref = `/create/public?${query.toString()}`;
    }
  } else if (poll.scope === 'NATIONAL') {
    const topic =
      ['political', 'social', 'sports', 'others'].find(
        (value) => value === poll.topic,
      ) ??
      (
        poll.categoryType === 'political'
          ? 'political'
          : 'others'
      );

    query.set('topic', topic);
    createHref = `/create/public?${query.toString()}`;
  }

  const alreadyVoted = await hasAlreadyVoted(poll.id);
  const isOpen = isPollOpen(poll);

  const fallbackHref =
    region && poll.scope === 'STATE'
      ? region.code === 'RJ'
        ? '/rajasthan'
        : `/state/${region.slug}`
      : '/';

  return (
    <main
      lang="hi"
      className="min-h-screen bg-[#F5F8F6] px-4 py-6 sm:px-6 sm:py-9"
    >
      <div className="mx-auto w-full max-w-5xl">
        <nav
          aria-label="Poll navigation"
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <SmartBackLink
            fallbackHref={fallbackHref}
            className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm leading-7 text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            ← वापस जाएँ
          </SmartBackLink>

          <Link
            href={createHref}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm leading-7 text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            ＋ नया पोल बनाएँ
          </Link>
        </nav>

        <PollClientView
          key={poll.id}
          poll={{
            id: poll.id,
            locationLabel,
            createHref,
            question: poll.question,
            deadlineDays: poll.deadlineDays,
            createdAt: poll.createdAt.toISOString(),
            options: poll.options,
          }}
          alreadyVoted={alreadyVoted}
          isOpen={isOpen}
        />
      </div>
    </main>
  );
}