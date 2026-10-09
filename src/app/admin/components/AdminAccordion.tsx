import type { ReactNode } from 'react';

type Tone = 'emerald' | 'blue' | 'amber';

type AdminAccordionProps = {
  icon: string;
  title: string;
  subtitle: string;
  count: number;
  countLabel: string;
  tone?: Tone;
  defaultOpen?: boolean;
  children: ReactNode;
};

const TONES: Record<Tone, { iconBox: string; badge: string }> = {
  emerald: {
    iconBox: 'bg-emerald-100 text-emerald-800',
    badge: 'bg-emerald-700 text-white',
  },
  blue: {
    iconBox: 'bg-blue-100 text-blue-800',
    badge: 'bg-blue-700 text-white',
  },
  amber: {
    iconBox: 'bg-amber-100 text-amber-800',
    badge: 'bg-amber-600 text-white',
  },
};

export default function AdminAccordion({
  icon,
  title,
  subtitle,
  count,
  countLabel,
  tone = 'emerald',
  defaultOpen = false,
  children,
}: AdminAccordionProps) {
  const t = TONES[tone];

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition open:shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${t.iconBox}`}
        >
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-base font-black text-gray-900 sm:text-lg">{title}</span>
          <span className="mt-0.5 block text-xs text-gray-500">{subtitle}</span>
        </span>

        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${t.badge}`}>
          {countLabel}: {count.toLocaleString('en-IN')}
        </span>

        <span className="shrink-0 text-lg text-gray-400 transition-transform duration-200 group-open:rotate-180">
          ⌄
        </span>
      </summary>

      {/* अंदर के कंपोनेंट का अपना बड़ा हेडर छिपाकर साफ़ लुक देता है */}
      <div className="max-h-[75vh] overflow-y-auto border-t border-gray-200 bg-slate-50/60 p-3 sm:p-4 [&>section]:rounded-2xl [&>section]:shadow-none [&>section>div:first-child]:hidden">
        {children}
      </div>
    </details>
  );
}