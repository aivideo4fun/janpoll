import Link from 'next/link';

import { db } from '@/lib/db';
import type { Region } from '@/lib/regions';

export type BrowserSearch = Record<
  string,
  string | string[] | undefined
>;

const PAGE_SIZE = 12;
const numbers = new Intl.NumberFormat('en-IN');

const primary =
  'inline-flex min-h-12 items-center justify-center rounded-xl ' +
  'bg-emerald-800 px-5 py-3 text-sm font-semibold leading-7 ' +
  'text-white transition hover:bg-emerald-900';

async function loadPolls(
  region: Region,
  searchParams: BrowserSearch,
) {
  const where = {
    active: true,
    scope: 'STATE' as const,
    stateCode: region.code,
  };

  const total = await db.poll.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rawPage = searchParams.page;

  const requested = Number(
    Array.isArray(rawPage) ? rawPage[0] : rawPage,
  );

  const page = Math.min(
    pages,
    Number.isSafeInteger(requested) && requested > 0 ? requested : 1,
  );

  const polls = await db.poll.findMany({
    where,
    select: {
      id: true,
      question: true,
      createdAt: true,
      deadlineDays: true,
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
    orderBy: [
      { createdAt: 'desc' },
      { id: 'asc' },
    ],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return { polls, total, page, pages };
}

export default async function StatePollBrowser({
  region,
  basePath,
  searchParams = {},
}: {
  region: Region;
  basePath: string;
  searchParams?: BrowserSearch;
}) {
  const result = await loadPolls(region, searchParams).catch(
    (error: unknown) => {
      console.error('State polls failed', error);
      return null;
    },
  );

  const createHref =
    `/create/public?state=${encodeURIComponent(region.slug)}`;

  return (
    <main
      lang="hi"
      className="min-h-screen bg-[#F5F8F6] text-slate-800"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs leading-7 text-slate-500"
        >
          <Link href="/">होम</Link>
          <span aria-hidden="true">›</span>
          <Link href="/states">सभी राज्य</Link>
          <span aria-hidden="true">›</span>
          <span>{region.name}</span>
        </nav>

        <section className="mt-6 rounded-3xl bg-emerald-900 p-6 text-white sm:p-9">
          <p className="text-xs font-semibold tracking-widest text-emerald-200">
            JANPOLL / {region.en.toUpperCase()}
          </p>

          <h1 className="mt-3 text-3xl font-semibold leading-normal sm:text-4xl">
            {region.name} की राय, एक जगह
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-8 text-emerald-100">
            अपना सवाल पूछें और जनता की राय जानें।
            यहाँ इस राज्य में बनाए गए पोल दिखाई देंगे।
          </p>

          <Link
            href={createHref}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold leading-7 text-emerald-900 hover:bg-emerald-50"
          >
            ＋ अपना पोल बनाएँ
          </Link>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold leading-9 text-emerald-950">
              {region.name} के पोल
            </h2>

            {result && (
              <p className="text-sm leading-7 text-slate-500">
                {numbers.format(result.total)} उपलब्ध पोल
              </p>
            )}
          </div>

          {!result ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p role="alert" className="text-sm leading-7 text-amber-800">
                पोल लोड नहीं हो सके। दोबारा कोशिश करें।
              </p>

              <Link
                href={basePath}
                className="mt-3 inline-block text-sm leading-7 text-emerald-800 underline"
              >
                फिर से खोलें
              </Link>
            </div>
          ) : result.polls.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-emerald-200 bg-white px-5 py-10 text-center">
              <h3 className="text-lg font-semibold leading-9 text-emerald-950">
                अभी कोई पोल उपलब्ध नहीं है
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                पहला सवाल पूछकर बातचीत शुरू करें।
              </p>

              <Link href={createHref} className={`${primary} mt-5`}>
                अपना पोल बनाएँ
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {result.polls.map((poll) => {
                  const totalVotes = poll.options.reduce(
                    (total, option) => total + option.voteCount,
                    0,
                  );

                  const ended =
                    poll.createdAt.getTime() +
                      poll.deadlineDays * 86400000 <=
                    Date.now();

                  return (
                    <article
                      key={poll.id}
                      className="flex min-w-0 flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs leading-7 text-slate-500">
                        <span>{region.name}</span>
                        <span>
                          {ended ? 'अवधि समाप्त' : 'जनमत पोल'}
                        </span>
                      </div>

                      <h3 className="mt-3 break-words text-lg font-semibold leading-9 text-emerald-950">
                        {poll.question}
                      </h3>

                      <div className="mt-4 space-y-2">
                        {poll.options.slice(0, 2).map((option) => (
                          <p
                            key={option.id}
                            className="break-words rounded-xl bg-slate-50 px-3 py-2 text-sm leading-7 text-slate-600"
                          >
                            {option.text}
                          </p>
                        ))}

                        {poll.options.length > 2 && (
                          <p className="text-xs leading-7 text-slate-400">
                            और {poll.options.length - 2} विकल्प
                          </p>
                        )}
                      </div>

                      <div className="mt-auto pt-5">
                        <p className="text-xs leading-7 text-slate-500">
                          {numbers.format(totalVotes)} वोट
                        </p>

                        <Link
                          href={`/poll/${encodeURIComponent(poll.id)}`}
                          className={`${primary} mt-3 w-full`}
                        >
                          {ended ? 'परिणाम देखें →' : 'पोल खोलें →'}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {result.pages > 1 && (
                <nav
                  aria-label="Poll pagination"
                  className="mt-6 flex items-center justify-between gap-3"
                >
                  {result.page > 1 ? (
                    <Link
                      href={`${basePath}?page=${result.page - 1}`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-emerald-800"
                    >
                      ← पिछला
                    </Link>
                  ) : <span />}

                  <span className="text-xs text-slate-500">
                    {result.page} / {result.pages}
                  </span>

                  {result.page < result.pages ? (
                    <Link
                      href={`${basePath}?page=${result.page + 1}`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-emerald-800"
                    >
                      अगला →
                    </Link>
                  ) : <span />}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}