import type { Metadata } from 'next';

import StatePollBrowser, {
  type BrowserSearch,
} from '@/components/StatePollBrowser';

import { getRegionByCode } from '@/lib/regions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'राजस्थान के पोल और स्थानीय जनमत | JanPoll India',
  description:
    'राजस्थान में चुनाव, राजनीति, सामाजिक मुद्दों और खेल के पोल देखें। अपना जिला, विधानसभा या पंचायत क्षेत्र चुनें।',
  alternates: {
    canonical: 'https://janpoll.in/rajasthan',
  },
};

export default function RajasthanPage({
  searchParams,
}: {
  searchParams?: BrowserSearch;
}) {
  const region = getRegionByCode('RJ');

  if (!region) {
    throw new Error('Rajasthan region configuration missing.');
  }

  return (
    <StatePollBrowser
      region={region}
      basePath="/rajasthan"
      searchParams={searchParams}
    />
  );
}