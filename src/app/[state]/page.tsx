import Link from 'next/link';
import type { Metadata } from 'next';

import { db } from '@/lib/db';
import {
  REGIONS,
  regionHref,
  type Region,
} from '@/lib/regions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'राज्यवार जनमत | JanPoll India',
  description:
    'अपने राज्य या केंद्र शासित प्रदेश के जनमत सर्वेक्षण देखें और संबंधित क्षेत्र में नया पोल बनाएँ।',
  alternates: {
    canonical: 'https://janpoll.in/states',
  },
  openGraph: {
    title: 'राज्यवार जनमत | JanPoll India',
    description:
      'अपना राज्य चुनें, स्थानीय मुद्दों पर राय जानें और चुनावी जनमत सर्वेक्षण बनाएँ।',
    url: 'https://janpoll.in/states',
    siteName: 'JanPoll India',
    locale: 'hi_IN',
    type: 'website',
  },
};

type PageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

const numbers = new Intl.NumberFormat('en-IN');

const focusClass =
  'focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-4 ' +
  'focus-visible:outline-emerald-600';

async function getStateCounts() {
  try {
    const rows = await db.poll.groupBy({
      by: ['stateCode'],

      where: {
        active: true,
        scope: 'STATE',
        stateCode: {
          in: REGIONS.map((region) => region.code),
        },
      },

      _count: {
        _all: true,
      },
    });

    const counts = new Map<string, number>();

    for (const row of rows) {
      if (row.stateCode) {
        counts.set(row.stateCode, row._count._all);
      }
    }

    return {
      counts,
      loaded: true,
    };
  } catch (error) {
    console.error('State directory counts failed', error);

    return {
      counts: new Map<string, number>(),
      loaded: false,
    };
  }
}

function getElectionCreateHref(region: Region) {
  return '/create?state=' + encodeURIComponent(region.slug);
}

function RegionCard({
  region,
  count,
  loaded,
}: {
  region: Region;
  count: number;
  loaded: boolean;
}) {
  return (
    <article
      className={[
        'group flex min-w-0 flex-col rounded-3xl',
        'border border-emerald-100 bg-white p-5',
        'shadow-sm transition duration-200',
        'hover:-translate-y-1 hover:border-emerald-300',
        'hover:shadow-lg hover:shadow-emerald-950/5',
        'motion-reduce:transform-none',
        'motion-reduce:transition-none sm:p-6',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={[
            'inline-flex min-h-9 min-w-10 items-center',
            'justify-center rounded-xl border',
            'border-emerald-100 bg-emerald-50',
            'px-3 font-sans text-xs font-semibold',
            'tracking-wider text-emerald-800',
          ].join(' ')}
        >
          {region.code}
        </span>

        <span className="text-[11px] leading-6 text-slate-500">
          {region.type === 'UT'
            ? 'Union Territory'
            : 'State'}
        </span>
      </div>

      <h3 className="mt-5 break-words text-xl font-semibold leading-9 text-emerald-950">
        <Link
          href={regionHref(region)}
          className={`rounded-md ${focusClass}`}
        >
          {region.name}
        </Link>
      </h3>

      <p className="mt-1 font-sans text-xs leading-6 text-slate-400">
        {region.en}
      </p>

      <div className="mt-4 flex items-center gap-2 text-xs leading-7">
        {loaded ? (
          <>
            <span
              aria-hidden="true"
              className={[
                'h-2 w-2 shrink-0 rounded-full',
                count > 0
                  ? 'bg-emerald-500'
                  : 'bg-slate-300',
              ].join(' ')}
            />

            <span className="text-slate-500">
              {count > 0
                ? `${numbers.format(count)} सक्रिय पोल`
                : 'अभी कोई सक्रिय पोल नहीं'}
            </span>
          </>
        ) : (
          <span className="text-amber-700">
            Poll count उपलब्ध नहीं है
          </span>
        )}
      </div>

      <div className="mt-auto pt-6">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={regionHref(region)}
            aria-label={`${region.name} के पोल देखें`}
            className={[
              'inline-flex min-h-11 items-center',
              'justify-center rounded-xl border',
              'border-slate-200 bg-white px-3 py-2',
              'text-xs font-medium leading-7',
              'text-slate-700 transition',
              'hover:border-emerald-300',
              'hover:bg-emerald-50',
              focusClass,
            ].join(' ')}
          >
            पोल देखें
            <span className="ml-2" aria-hidden="true">
              ↗
            </span>
          </Link>

          <Link
            href={getElectionCreateHref(region)}
            aria-label={`${region.name} में पोल बनाएँ`}
            className={[
              'inline-flex min-h-11 items-center',
              'justify-center rounded-xl',
              'bg-emerald-800 px-3 py-2',
              'text-xs font-medium leading-7',
              'text-white transition',
              'hover:bg-emerald-900',
              focusClass,
            ].join(' ')}
          >
            ＋ पोल बनाएँ
          </Link>
        </div>
      </div>
    </article>
  );
}

function RegionGroup({
  id,
  title,
  subtitle,
  regions,
  counts,
  loaded,
}: {
  id: string;
  title: string;
  subtitle: string;
  regions: Region[];
  counts: Map<string, number>;
  loaded: boolean;
}) {
  if (regions.length === 0) {
    return null;
  }

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-sans text-[10px] font-semibold tracking-[0.18em] text-emerald-700">
            {subtitle}
          </p>

          <h2
            id={`${id}-title`}
            className="mt-2 text-2xl font-semibold leading-[1.8] text-emerald-950"
          >
            {title}
          </h2>
        </div>

        <span className="rounded-full border border-emerald-100 bg-white px-4 py-1 text-xs leading-7 text-emerald-800">
          {numbers.format(regions.length)} क्षेत्र
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {regions.map((region) => (
          <RegionCard
            key={region.code}
            region={region}
            count={counts.get(region.code) ?? 0}
            loaded={loaded}
          />
        ))}
      </div>
    </section>
  );
}

export default async function StatesPage({
  searchParams,
}: PageProps) {
  const { counts, loaded } = await getStateCounts();

  const rawQuery = searchParams?.q;

  const query = (
    Array.isArray(rawQuery)
      ? rawQuery[0] ?? ''
      : rawQuery ?? ''
  )
    .trim()
    .slice(0, 80);

  const normalizedQuery = query
    .normalize('NFC')
    .toLocaleLowerCase();

  const matchingRegions = REGIONS.filter((region) => {
    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [
      region.name,
      region.en,
      region.code,
      region.slug,
    ]
      .join(' ')
      .normalize('NFC')
      .toLocaleLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  const states = matchingRegions.filter(
    (region) => region.type === 'STATE',
  );

  const territories = matchingRegions.filter(
    (region) => region.type === 'UT',
  );

const totalPolls = Array.from(counts.values()).reduce(
  (total, count) => total + count,
  0,
);

  const stats = [
    {
      label: 'राज्य',
      value: numbers.format(
        REGIONS.filter(
          (region) => region.type === 'STATE',
        ).length,
      ),
    },
    {
      label: 'केंद्र शासित प्रदेश',
      value: numbers.format(
        REGIONS.filter(
          (region) => region.type === 'UT',
        ).length,
      ),
    },
    {
      label: 'राज्य / UT के सक्रिय पोल',
      value: loaded
        ? numbers.format(totalPolls)
        : '—',
    },
    {
      label: 'क्षेत्र जहाँ पोल हैं',
      value: loaded
        ? numbers.format(counts.size)
        : '—',
    },
  ];

  return (
    <main
      lang="hi"
      className="min-h-screen bg-[#f5f8f6] text-slate-800"
    >
      {/* HERO */}
      <section className="border-b border-emerald-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs leading-7 text-slate-500"
          >
            <Link
              href="/"
              className={`rounded hover:text-emerald-800 ${focusClass}`}
            >
              होम
            </Link>

            <span aria-hidden="true">›</span>
            <span aria-current="page">सभी राज्य</span>
          </nav>

          <p className="font-sans text-[10px] font-semibold tracking-[0.2em] text-emerald-700">
            JANPOLL INDIA / STATE DIRECTORY
          </p>

          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.8] text-emerald-950 sm:text-4xl">
            अपना राज्य चुनें।
            <br />
            <span className="text-emerald-700">
              अपने क्षेत्र की राय जानें।
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-500">
            राज्य या केंद्र शासित प्रदेश के पोल
            देखें। चुनावी पोल बनाने पर चुना हुआ
            राज्य अगले page पर पहले से भरा मिलेगा।
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col rounded-2xl border border-emerald-100 bg-[#f8fbf9] p-4 sm:p-5"
              >
                <dt className="text-xs leading-7 text-slate-500">
                  {stat.label}
                </dt>

                <dd className="mt-1 font-sans text-2xl font-semibold tabular-nums text-emerald-950">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* SEARCH + DIRECTORY */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <form
          action="/states"
          method="GET"
          role="search"
          className="mb-9 rounded-3xl border border-emerald-100 bg-white p-4 sm:p-5"
        >
          <label
            htmlFor="region-search"
            className="mb-2 block text-sm font-medium text-emerald-950"
          >
            अपना राज्य खोजें
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="region-search"
              name="q"
              type="search"
              maxLength={80}
              defaultValue={query}
              placeholder="राजस्थान, Rajasthan या RJ…"
              className={[
                'min-h-12 min-w-0 flex-1 rounded-2xl',
                'border border-slate-200 bg-white',
                'px-4 py-3 text-sm leading-7',
                'outline-none focus:border-emerald-500',
                'focus:ring-4 focus:ring-emerald-50',
              ].join(' ')}
            />

            <button
              type="submit"
              className={[
                'min-h-12 rounded-2xl bg-emerald-800',
                'px-6 py-3 text-sm font-medium',
                'leading-7 text-white transition',
                'hover:bg-emerald-900',
                focusClass,
              ].join(' ')}
            >
              खोजें →
            </button>
          </div>

          {query && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs leading-7">
              <span className="text-slate-500">
                “{query}” के लिए{' '}
                {numbers.format(matchingRegions.length)} परिणाम
              </span>

              <Link
                href="/states"
                className={`rounded text-emerald-800 underline ${focusClass}`}
              >
                सभी दिखाएँ
              </Link>
            </div>
          )}
        </form>

        {!loaded && (
          <div
            role="status"
            className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800"
          >
            Poll counts अभी लोड नहीं हो सके।
            आप नीचे से राज्य का page फिर भी खोल सकते हैं।
          </div>
        )}

        {matchingRegions.length > 0 ? (
          <div className="space-y-12">
            <RegionGroup
              id="states"
              title="भारत के राज्य"
              subtitle="STATES"
              regions={states}
              counts={counts}
              loaded={loaded}
            />

            <RegionGroup
              id="union-territories"
              title="केंद्र शासित प्रदेश"
              subtitle="UNION TERRITORIES"
              regions={territories}
              counts={counts}
              loaded={loaded}
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-5 py-12 text-center">
            <h2 className="text-xl font-semibold leading-9 text-emerald-950">
              इस नाम का राज्य नहीं मिला
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              हिंदी, English या state code से खोजें।
            </p>

            <Link
              href="/states"
              className={[
                'mt-5 inline-flex min-h-11 items-center',
                'rounded-full bg-emerald-800 px-5 py-2',
                'text-sm leading-7 text-white',
                focusClass,
              ].join(' ')}
            >
              सभी राज्य देखें
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}