import Link from 'next/link';
import type { Prisma } from '@prisma/client';

export type Poll = Prisma.PollGetPayload<{ include: { options: true } }>;
type Option = Poll['options'][number];

const numbers = new Intl.NumberFormat('en-IN');
const dates = new Intl.DateTimeFormat('hi-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4';

export function countVotes(poll: Poll) {
  return poll.options.reduce(
    (sum, option) => sum + Math.max(0, option.voteCount ?? 0),
    0,
  );
}

export function pollHref(poll: Poll) {
  const path = `/poll/${encodeURIComponent(String(poll.id))}`;
  return poll.slug ? `${path}/${encodeURIComponent(poll.slug)}` : path;
}

export function optionLabel(option: Option, index: number) {
  const record = option as unknown as Record<string, unknown>;
  for (const field of ['text', 'label', 'name', 'optionText', 'title']) {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return `विकल्प ${index + 1}`;
}

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      {diagonal ? (
        <path d="M6 18 18 6M6 6h12v12" />
      ) : (
        <path d="M4 12h16m-6-6 6 6-6 6" />
      )}
    </svg>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-800">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      सक्रिय
    </span>
  );
}

export function Results({ poll, limit = 2 }: { poll: Poll; limit?: number }) {
  const total = countVotes(poll);
  const options = poll.options.slice(0, limit);

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const votes = Math.max(0, option.voteCount ?? 0);
        const percent = total > 0 ? (votes / total) * 100 : 0;
        const label = optionLabel(option, index);

        return (
          <div key={index}>
            <div className="mb-1.5 flex items-start justify-between gap-4 text-xs leading-5">
              <span className="min-w-0 break-words text-slate-700">{label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-500">
                {percent.toFixed(1)}%
              </span>
            </div>

            <div
              role="progressbar"
              aria-label={`${label}: दर्ज वोटों का प्रतिशत`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Number(percent.toFixed(1))}
              className="h-1.5 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                style={{ width: `${percent}%` }}
                className={`h-full rounded-full ${
                  index === 0
                    ? 'bg-emerald-700'
                    : index === 1
                    ? 'bg-emerald-400'
                    : 'bg-emerald-200'
                }`}
              />
            </div>
          </div>
        );
      })}

      {poll.options.length > limit && (
        <p className="text-[11px] text-slate-500">
          +{poll.options.length - limit} अन्य विकल्प पोल में देखें
        </p>
      )}
    </div>
  );
}

export function PollCard({ poll }: { poll: Poll }) {
  const date = new Date(poll.createdAt);
  const validDate = !Number.isNaN(date.getTime());

  return (
    <article className="flex h-full flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="max-w-full break-words rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
          {poll.districtName || 'क्षेत्र निर्दिष्ट नहीं'}
        </span>
        <LiveBadge />
      </div>

      <h3 className="mb-5 break-words text-lg font-bold leading-relaxed text-slate-900">
        <Link href={pollHref(poll)} className={`rounded-md hover:text-emerald-800 ${focusRing}`}>
          {poll.question}
        </Link>
      </h3>

      <div className="mb-6">
        <Results poll={poll} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-500">
          <p className="font-semibold text-slate-700">{numbers.format(countVotes(poll))} वोट</p>
          {validDate && (
            <time dateTime={date.toISOString()} className="mt-1 block text-[11px]">
              {dates.format(date)}
            </time>
          )}
        </div>

        <Link
          href={pollHref(poll)}
          aria-label={`पोल खोलें: ${poll.question}`}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-900 transition hover:bg-emerald-800 hover:text-white ${focusRing}`}
        >
          <Arrow />
        </Link>
      </div>
    </article>
  );
}