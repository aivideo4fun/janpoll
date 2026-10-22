'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { castVote } from '@/lib/actions';
import { getDeadline } from '@/lib/poll-utils';
import Adsterra728 from '@/components/home/Adsterra728';

type Poll = {
  requiresLogin?: boolean;
  id: string;
  locationLabel?: string;
  createHref?: string;
  question: string;
  deadlineDays: number | null;
  createdAt: string | Date;
  options: {
    id: string;
    text: string;
    voteCount: number;
  }[];
};

const COLORS = [
  '#059669',
  '#D97706',
  '#2563EB',
  '#DC2626',
  '#7C3AED',
  '#DB2777',
  '#0D9488',
  '#EA580C',
];

const SOCIALS = [
  { name: 'Telegram', href: 'https://t.me/janpollindia', icon: '/images/telegram.svg' },
  {
    name: 'WhatsApp',
    href: 'https://whatsapp.com/channel/0029VbEDUaJ5Ui2OzmpEYI3D',
    icon: '/images/whatsapp.png',
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/janpoll.in',
    icon: '/images/instagram.png',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61595121995283',
    icon: '/images/facebook.png',
  },
  {
    name: 'X',
    href: 'https://twitter.com/janpollindia',
    icon: '/images/x.png',
  },
];

const primary =
  'inline-flex min-h-12 items-center justify-center rounded-xl ' +
  'bg-emerald-800 px-4 py-3 text-sm font-semibold leading-7 ' +
  'text-white transition hover:bg-emerald-900 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

async function getDeviceSig(): Promise<string | undefined> {
  try {
    const ratio = window.devicePixelRatio || 1;

    const physical = [
      window.screen.width,
      window.screen.height,
    ]
      .map((value) => Math.round((value * ratio) / 10) * 10)
      .sort((a, b) => a - b);

    const traits = [
      physical.join('x'),
      window.screen.colorDepth,
      navigator.hardwareConcurrency ?? 0,
      navigator.maxTouchPoints ?? 0,
      navigator.platform ?? '',
      Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    ].join('|');

    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(traits),
    );

    return Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
  } catch {
    return undefined;
  }
}

function Countdown({
  createdAt,
  deadlineDays,
  isOpen,
}: {
  createdAt: string | Date;
  deadlineDays: number | null;
  isOpen: boolean;
}) {
  const [label, setLabel] = useState('समय सीमा जाँची जा रही है…');

  useEffect(() => {
    if (!isOpen) return;

    const deadline = getDeadline(
      new Date(createdAt),
      deadlineDays,
    ).getTime();

    const update = () => {
      const remaining = Math.max(0, deadline - Date.now());

      if (!remaining) {
        setLabel('पोल समाप्त');
        return;
      }

      const seconds = Math.floor(remaining / 1000);
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const lastSeconds = seconds % 60;

      setLabel(
        `${days} दिन · ` +
        `${String(hours).padStart(2, '0')}:` +
        `${String(minutes).padStart(2, '0')}:` +
        `${String(lastSeconds).padStart(2, '0')}`,
      );
    };

    update();

    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, [createdAt, deadlineDays, isOpen]);

  return <span>{isOpen ? label : 'पोल बंद है'}</span>;
}

export default function PollClientView({
  poll,
  alreadyVoted,
  isOpen,
}: {
  poll: Poll;
  alreadyVoted: boolean;
  isOpen: boolean;
}) {
  const router = useRouter();

  const [selectedOption, setSelectedOption] = useState('');
  const [hasVoted, setHasVoted] = useState(alreadyVoted);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [shareUrl, setShareUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareLoading, setShareLoading] = useState(true);

  const voteLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    setShareUrl('');
    setShareMessage('');
    setShareLoading(true);

    const prepareLink = async () => {
      try {
        const response = await fetch('/api/public-share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollId: poll.id }),
          signal: controller.signal,
          cache: 'no-store',
        });

        const data = await response.json();

        if (
          !response.ok ||
          typeof data.sharePath !== 'string' ||
          !/^\/s\/[A-Za-z0-9_-]{8}$/.test(data.sharePath)
        ) {
          throw new Error(
            data.message || 'Share link तैयार नहीं हो सका।',
          );
        }

        if (!controller.signal.aborted) {
          setShareUrl(
            new URL(data.sharePath, window.location.origin).href,
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setShareMessage(
            error instanceof Error
              ? error.message
              : 'Share link तैयार नहीं हो सका।',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setShareLoading(false);
        }
      }
    };

    void prepareLink();

    return () => controller.abort();
  }, [poll.id]);

  useEffect(() => {
    if (alreadyVoted) setHasVoted(true);
  }, [alreadyVoted]);

  const totalVotes = useMemo(
    () =>
      poll.options.reduce(
        (total, option) => total + option.voteCount,
        0,
      ),
    [poll.options],
  );

  const results = useMemo(
    () =>
      poll.options.map((option) => ({
        ...option,
        percentage:
          totalVotes > 0
            ? Number(
                ((option.voteCount / totalVotes) * 100).toFixed(1),
              )
            : 0,
      })),
    [poll.options, totalVotes],
  );

  const showResults = hasVoted || alreadyVoted || !isOpen;

  const shareLink = async () => {
    if (!shareUrl) return;

    setShareMessage('');

    try {
      if (navigator.share) {
        await navigator.share({
          title: poll.question,
          text: poll.question,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${poll.question}\n\n${shareUrl}`);
        setShareMessage('Share link कॉपी हो गया।');
      }
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.name !== 'AbortError'
      ) {
        setShareMessage('Share नहीं हो सका। दोबारा कोशिश करें।');
      }
    }
  };

  const shareWhatsApp = () => {
    if (!shareUrl) return;

    const text = `${poll.question}\n\n${shareUrl}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const vote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (voteLock.current || hasVoted || !isOpen) return;

    if (!selectedOption) {
      setMessage('पहले एक विकल्प चुनें।');
      return;
    }

    voteLock.current = true;
    setBusy(true);
    setMessage('');

    try {
      const deviceSig = await getDeviceSig();

      const response = await castVote(
        poll.id,
        selectedOption,
        deviceSig,
      );

      if (response.success) {
        setHasVoted(true);
        setMessage('आपका वोट दर्ज हो गया है।');
        router.refresh();
      } else {
        setMessage(response.message);
        if (response.code === 'AUTH_REQUIRED') {
          await signIn('google', { callbackUrl: window.location.href });
          return;
        }

        if (response.code === 'ALREADY_VOTED') {
          setHasVoted(true);
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Vote submission failed', error);

      setMessage(
        'वोट की पुष्टि नहीं हो सकी। दोबारा प्रयास करने से पहले page refresh करें।',
      );
    } finally {
      voteLock.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <article className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
        <header className="border-b border-emerald-100 bg-emerald-50/50 p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs leading-7">
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-emerald-800">
              {poll.locationLabel || 'JanPoll India'}
            </span>

            <span className="text-slate-500">
              <Countdown
                createdAt={poll.createdAt}
                deadlineDays={poll.deadlineDays}
                isOpen={isOpen}
              />
            </span>
          </div>

          <p className="mt-5 text-xs font-semibold tracking-wider text-emerald-700">
            आपकी राय महत्वपूर्ण है
          </p>

          <h1 className="mt-3 break-words text-2xl font-semibold leading-normal text-emerald-950 sm:text-3xl">
            {poll.question}
          </h1>
        </header>

        <div className="space-y-6 p-5 sm:p-8">
          {message && (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-900"
            >
              {message}
            </p>
          )}

          {alreadyVoted && !message && (
            <p className="text-sm leading-7 text-emerald-800">
              आप इस पोल में पहले ही वोट दे चुके हैं।
            </p>
          )}

          {poll.requiresLogin && <p className="rounded-xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-900">इस poll में vote देने के लिए sign-in आवश्यक है। एक account से एक vote स्वीकार किया जाता है।</p>}

          {!showResults ? (
            <form onSubmit={vote} className="space-y-5">
              <fieldset disabled={busy}>
                <legend className="mb-3 text-sm font-semibold leading-7 text-slate-700">
                  एक विकल्प चुनें
                </legend>

                <div className="space-y-3">
                  {poll.options.map((option) => (
                    <label
                      key={option.id}
                      className={[
                        'flex min-h-14 cursor-pointer items-start',
                        'gap-3 rounded-2xl border p-4',
                        'focus-within:ring-2 focus-within:ring-emerald-600',
                        selectedOption === option.id
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-slate-200 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="poll-option"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={() => {
                          setSelectedOption(option.id);
                          setMessage('');
                        }}
                        className="mt-1 h-5 w-5 shrink-0 accent-emerald-700"
                      />

                      <span className="min-w-0 break-words text-sm leading-7 text-slate-800">
                        {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={busy || !selectedOption}
                className={`${primary} w-full`}
              >
                {busy ? 'वोट दर्ज हो रहा है…' : 'वोट सबमिट करें'}
              </button>
            </form>
          ) : (
            <section id="printable-result" className="space-y-5">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <h2 className="text-lg font-semibold leading-8 text-emerald-950">
                  {isOpen ? 'अब तक के परिणाम' : 'समाप्त पोल के परिणाम'}
                </h2>

                <p className="mt-2 text-sm leading-7 text-emerald-800">
                  कुल {totalVotes.toLocaleString('en-IN')} वोट
                </p>
              </div>

              {totalVotes > 0 && results.length <= 6 && (
                <div className="h-64 w-full" aria-label="परिणामों का chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={results}
                        dataKey="voteCount"
                        nameKey="text"
                        innerRadius={45}
                        outerRadius={85}
                        paddingAngle={2}
                        isAnimationActive={false}
                      >
                        {results.map((option, index) => (
                          <Cell
                            key={option.id}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {results.map((option, index) => (
                <div
                  key={option.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 break-words text-sm font-medium leading-7 text-slate-700">
                      {option.text}
                    </p>

                    <p className="text-sm font-semibold leading-7 text-emerald-800">
                      {option.voteCount.toLocaleString('en-IN')} वोट
                      {' '}({option.percentage}%)
                    </p>
                  </div>

                  <div
                    role="progressbar"
                    aria-label={option.text}
                    aria-valuenow={option.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${option.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}

              {totalVotes === 0 && (
                <p className="text-center text-sm leading-7 text-slate-500">
                  इस पोल में कोई वोट दर्ज नहीं हुआ है।
                </p>
              )}

              {!isOpen && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`${primary} print:hidden`}
                >
                  परिणाम Print / Save as PDF
                </button>
              )}
            </section>
          )}

          <div className="grid gap-3 sm:grid-cols-2 print:hidden">
            <Link
              href="/states"
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm leading-7 text-slate-700 hover:bg-slate-50"
            >
              अन्य पोल देखें
            </Link>

            <Link
              href={poll.createHref || '/create'}
              className={primary}
            >
              ＋ नया पोल बनाएँ
            </Link>
          </div>

          {/* Only two sharing options */}
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 print:hidden">
            <h2 className="text-center text-base font-semibold leading-8 text-emerald-950">
              अपनी आवाज़ आगे पहुँचाएँ
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={shareLink}
                disabled={!shareUrl || shareLoading}
                className={primary}
              >
                Share Poll
              </button>

              <button
                type="button"
                onClick={shareWhatsApp}
                disabled={!shareUrl || shareLoading}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold leading-7 text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Image
                  src="/images/whatsapp.png"
                  alt=""
                  width={19}
                  height={19}
                />
                WhatsApp
              </button>
            </div>

            {shareLoading && (
              <p role="status" className="mt-3 text-center text-xs leading-7 text-slate-500">
                पोल शेयर करने की तैयारी हो रही है…
              </p>
            )}

            {shareMessage && (
              <p role="status" className="mt-3 text-center text-sm leading-7 text-emerald-800">
                {shareMessage}
              </p>
            )}
          </section>

          {/* Social media below sharing */}
          <section className="rounded-2xl border border-slate-200 p-4 print:hidden">
            <h2 className="text-center text-sm font-semibold leading-7 text-slate-700">
              JanPoll से जुड़ें
            </h2>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  title={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 motion-reduce:transform-none"
                >
                  <Image
                    src={social.icon}
                    alt=""
                    width={24}
                    height={24}
                  />
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 print:hidden"><h2 className="font-semibold text-emerald-950">इस पोल में सहायता चाहिए?</h2><p className="mt-2 text-sm leading-7 text-slate-600">तकनीकी समस्या, गलत सामग्री या voting संबंधी शिकायत भेजें।</p><a href={`mailto:support@janpoll.in?subject=${encodeURIComponent('Poll support')}&body=${encodeURIComponent(poll.question + '\nhttps://janpoll.in/poll/' + poll.id + '\n\nसमस्या: ')}`} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-5 text-sm text-white">Support / शिकायत भेजें</a></section>
          {/* Advertisement last */}
          <section
            aria-label="विज्ञापन"
            className="overflow-hidden rounded-2xl border border-slate-100 p-3 print:hidden"
          >
            <Adsterra728 placement="poll" />
          </section>
        </div>
      </article>

      <p className="mt-5 text-center text-xs leading-7 text-slate-500">
        JanPoll सार्वजनिक राय का मंच है। ये आधिकारिक परिणाम नहीं हैं।
      </p>
    </section>
  );
}