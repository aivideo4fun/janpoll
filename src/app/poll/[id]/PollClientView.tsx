'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { castVote } from '@/lib/actions';
import { getDeadline } from '@/lib/poll-utils';
import Ad728x90 from '@/components/Ad728x90';

const COLORS = [
  '#10B981', // हरा
  '#F59E0B', // केसरिया
  '#3B82F6', // नीला
  '#EF4444', // लाल
  '#8B5CF6', // बैंगनी
  '#EC4899', // गुलाबी
  '#14B8A6', // टील
  '#F97316', // नारंगी
];

const SOCIAL_LINKS = [
  {
    name: 'व्हाट्सएप चैनल',
    href: 'https://whatsapp.com/channel/0029VbEDUaJ5Ui2OzmpEYI3D',
    icon: '/images/whatsapp.png',
  },
  {
    name: 'इंस्टाग्राम',
    href: 'https://instagram.com/janpoll.in',
    icon: '/images/instagram.png',
  },
  {
    name: 'फेसबुक',
    href: 'https://www.facebook.com/profile.php?id=61595121995283',
    icon: '/images/facebook.png',
  },
  {
    name: 'X (ट्विटर)',
    href: 'https://twitter.com/janpollindia',
    icon: '/images/x.png',
  },
  {
    name: 'यूट्यूब',
    href: 'https://youtube.com/shorts/f7N05oSyfXc?feature=shared',
    icon: '/images/youtube.png',
  },
];

type PollOption = {
  id: string;
  text: string;
  voteCount: number;
};

type Poll = {
  id: string;
  question: string;
  deadlineDays: number | null;
  createdAt: string | Date;
  options: PollOption[];
};

type PollClientViewProps = {
  poll: Poll;
  alreadyVoted: boolean;
  isOpen: boolean;
};

type ChartDataItem = {
  name: string;
  votes: number;
  percentage: number;
};

function LiveCountdown({ createdAt, deadlineDays, isOpen }: { createdAt: string | Date; deadlineDays: number | null; isOpen: boolean }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const deadlineDate = getDeadline(new Date(createdAt), deadlineDays).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = deadlineDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt, deadlineDays, isOpen]);

  if (!isOpen) {
    return <span>पोल बंद हो चुका है</span>;
  }

  if (!timeLeft) {
    const defaultDays = deadlineDays ?? 3;
    return <span>समय सीमा: {defaultDays} दिन</span>;
  }

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return <span className="text-red-600 font-bold">पोल समाप्त</span>;
  }

  return (
    <span className="font-mono font-bold text-emerald-900">
      शेष: {timeLeft.days} दिन {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}

export default function PollClientView({
  poll,
  alreadyVoted,
  isOpen,
}: PollClientViewProps) {
  const router = useRouter();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(alreadyVoted);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState(
    alreadyVoted ? 'आप इस पोल में पहले ही वोट दे चुके हैं।' : '',
  );

  // 🛠️ महत्वपूर्ण सुधार: जब भी पोल ID बदले (दूसरा पोल खुले), तो स्टेट बिल्कुल ताजा हो जाए
  useEffect(() => {
    setHasVoted(alreadyVoted);
    setMessage(alreadyVoted ? 'आप इस पोल में पहले ही वोट दे चुके हैं।' : '');
    setSelectedOption(null);
  }, [poll.id, alreadyVoted]);

  const showResults = hasVoted || !isOpen;

  const totalVotes = useMemo(
    () => poll.options.reduce((total, option) => total + option.voteCount, 0),
    [poll.options],
  );

  const chartData = useMemo<ChartDataItem[]>(
    () =>
      poll.options.map((option) => ({
        name: option.text,
        votes: option.voteCount,
        percentage:
          totalVotes > 0
            ? Number(((option.voteCount / totalVotes) * 100).toFixed(1))
            : 0,
      })),
    [poll.options, totalVotes],
  );

  const handleVoteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedOption) {
      setMessage('कृपया पहले कोई एक विकल्प चुनें।');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await castVote(poll.id, selectedOption);

      if (response.success) {
        setHasVoted(true);
        setMessage('आपका वोट सफलतापूर्वक दर्ज हो गया।');
        router.refresh();
        return;
      }

      setMessage(response.message);

      if (response.code === 'ALREADY_VOTED') {
        setHasVoted(true);
        router.refresh();
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      setMessage('वोट दर्ज करते समय समस्या आई। कृपया थोड़ी देर बाद दोबारा प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: poll.question,
      text: `🗳️ इस JanPoll पर अपनी राय दें:\n\n${poll.question}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await handleCopyLink();
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        setMessage('पोल शेयर नहीं हो सका। कृपया दोबारा प्रयास करें।');
      }
    }
  };

  const handleWhatsAppShare = () => {
    const text = `🗳️ ${poll.question}\nअपनी राय यहाँ दें: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage('लिंक कॉपी नहीं हो सका। कृपया ऐड्रेस बार से कॉपी करें।');
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-white px-5 py-6 sm:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
              <span aria-hidden="true">📍</span>
              राजस्थान पब्लिक पोल
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <span aria-hidden="true">⏳</span>
              <LiveCountdown createdAt={poll.createdAt} deadlineDays={poll.deadlineDays} isOpen={isOpen} />
            </span>
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            आपकी राय महत्वपूर्ण है
          </p>

          <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {poll.question}
          </h1>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          {message && (
            <div
              role="status"
              aria-live="polite"
              className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800"
            >
              {message}
            </div>
          )}

          {!showResults ? (
            <form onSubmit={handleVoteSubmit} className="space-y-5">
              <fieldset disabled={loading}>
                <legend className="mb-3 text-sm font-bold text-slate-700">
                  नीचे दिए गए विकल्पों में से एक चुनें
                </legend>

                <div className="space-y-3">
                  {poll.options.map((option) => {
                    const isSelected = selectedOption === option.id;

                    return (
                      <label
                        key={option.id}
                        className={[
                          'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all',
                          'focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2',
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="poll-option"
                          value={option.id}
                          checked={isSelected}
                          onChange={() => {
                            setSelectedOption(option.id);
                            setMessage('');
                          }}
                          className="h-5 w-5 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />

                        <span
                          className={[
                            'text-base',
                            isSelected
                              ? 'font-bold text-emerald-900'
                              : 'font-medium text-slate-700',
                          ].join(' ')}
                        >
                          {option.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={loading || !selectedOption}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    वोट सबमिट हो रहा है...
                  </>
                ) : (
                  'वोट सबमिट करें'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-7">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                <p className="font-bold text-emerald-900">✅ परिणाम और आंकड़े</p>
                <p className="mt-1 text-sm text-emerald-700">
                  अब तक कुल {totalVotes.toLocaleString('en-IN')} वोट
                </p>
              </div>

              {totalVotes > 0 ? (
                <>
                  <div className="h-72 w-full" aria-label="पोल परिणामों का पाई चार्ट">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="votes"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          innerRadius={45}
                          outerRadius={88}
                          paddingAngle={2}
                          label={({ percentage }) => `${percentage}%`}
                          labelLine={false}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip formatter={(value, name) => [`${value} वोट`, name]} />

                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {chartData.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-2 flex items-start justify-between gap-4 text-sm">
                          <span className="font-semibold text-slate-700">{item.name}</span>
                          <span className="shrink-0 font-bold text-emerald-800">
                            {item.votes} ({item.percentage}%)
                          </span>
                        </div>

                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-slate-200"
                          role="progressbar"
                          aria-valuenow={item.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${item.name}: ${item.percentage}%`}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    अभी तक कोई वोट दर्ज नहीं हुआ है।
                  </p>
                </div>
              )}

              {/* 📲 शेयर सेक्शन */}
              <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm sm:p-5">
                <p className="mb-1 text-center text-sm font-black text-emerald-900 sm:text-base">
                  📣 इस पोल को दोस्तों और गाँव के ग्रुप में शेयर करें
                </p>
                <p className="mb-4 text-center text-xs text-slate-500">
                  जितने ज़्यादा लोग जुड़ेंगे, उतनी ज़्यादा आवाज़ें सुनी जाएँगी।
                </p>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-lg font-black text-white shadow-md transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <span aria-hidden="true">📲</span>
                  पोल शेयर करें
                </button>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
                  >
                    <Image src="/images/whatsapp.png" alt="" width={18} height={18} className="object-contain" />
                    WhatsApp पर भेजें
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-3 text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                  >
                    {copied ? '✓ लिंक कॉपी हुआ' : '🔗 लिंक कॉपी करें'}
                  </button>
                </div>
              </div>

              <div className="my-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <Ad728x90 />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 py-3 text-sm font-bold shadow-sm transition"
                >
                  <span>🔥</span> अन्य ट्रेंडिंग पोल्स देखें
                </Link>

                <Link
                  href="/create"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-4 py-3 text-sm font-bold shadow-sm transition"
                >
                  <span>＋</span> नया पोल बनाएँ
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-center text-xs font-bold text-slate-600">🌐 हमसे जुड़ें</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center text-[11px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <Image
                        src={social.icon}
                        alt={social.name}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span>{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-xs leading-relaxed text-slate-500 shadow-sm">
        JanPoll के सभी पोल्स केवल जनता की राय जानने के लिए हैं। यह किसी सरकारी संस्था या आधिकारिक चुनावी मतदान प्रणाली का हिस्सा नहीं है।
      </aside>
    </section>
  );
}