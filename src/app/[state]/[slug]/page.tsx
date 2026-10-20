import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import StatePollBrowser, {
  type BrowserSearch,
} from '@/components/StatePollBrowser';

import { getRegionBySlug } from '@/lib/regions';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{
    state: string;
    slug: string;
  }>;
  searchParams?: Promise<BrowserSearch>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = await params;
  if (route.state !== 'state') return {};

  const region = getRegionBySlug(route.slug);

  if (!region) return {};

  const canonical =
    region.code === 'RJ'
      ? '/rajasthan'
      : `/state/${region.slug}`;

  return {
    title: `${region.name} के पोल और जनमत | JanPoll India`,
    keywords: [region.en + ' polls', region.name + ' जनमत', 'JanPoll India'],
    description:
      `${region.name} में जनमत, राजनीति, सामाजिक मुद्दों और खेल के पोल देखें। अपने क्षेत्र में नया पोल बनाएँ।`,
    alternates: {
      canonical: `https://janpoll.in${canonical}`,
    },
  };
}

export default async function StatePage({
  params,
  searchParams,
}: Props) {
  const route = await params;
  if (route.state !== 'state') {
    notFound();
  }

  const region = getRegionBySlug(route.slug);

  if (!region) {
    notFound();
  }

  return (
    <StatePollBrowser
      region={region}
      basePath={`/state/${region.slug}`}
      searchParams={await searchParams}
    />
  );
}