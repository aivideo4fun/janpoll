'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

const COLORS = [
  '#10B981', // hara
  '#F59E0B', // kesariya
  '#3B82F6', // nila
  '#EF4444', // laal
  '#8B5CF6', // baangni
  '#EC4899', // gulabi
  '#14B8A6', // teel
  '#F97316', // narangi
];

function PollBanner300x250() {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerRef.current) return;
    bannerRef.current.innerHTML = '';

    const confScript = document.createElement('script');
    confScript.type = 'text/javascript';
    confScript.text = `
      atOptions = {
        'key' : '4801d526481e48f32daba116c6ca2a7c',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;
    bannerRef.current.appendChild(confScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://bicea.org/22/4801d526481e48f32daba116c6ca2a7c';
    bannerRef.current.appendChild(invokeScript);
  }, []);

  return <div ref={bannerRef} className="flex justify-center my-4 overflow-hidden" />;
}

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
    return <span>Poll band ho chuka hai</span>;
  }

  if (!timeLeft) {
    const defaultDays = deadlineDays ?? 3;
    return <span>Samay seema: {defaultDays} din</span>;
  }

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return <span className="text-red-600 font-bold">Poll samapt</span>;
  }

  return (
    <span className="font-mono font-bold text-emerald-900">
      Shesh: {timeLeft.days} din {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
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
  const [message, setMessage] = useState(
    alreadyVoted ? 'Aap is poll mein pehle hi vote de chuke hain.' : '',
  );

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
      setMessage('Kripya pehle koi ek vikalp chunein.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await castVote(poll.id, selectedOption);

      if (response.success) {
        setHasVoted(true);
        setMessage('Aapka vote safalpurvak darj ho gaya.');
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
      setMessage('Vote darj karte samay samasya aayi. Kripya thodi der baad dobara prayas karein.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: poll.question,
      text: `🗳️ Is JanPoll par apni ray dein:\n\n${poll.question}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareData.url);
      setMessage('Poll link clipboard par copy ho gaya hai.');
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        setMessage('Poll share nahi ho saka. Kripya dobara prayas karein.');
      }
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-white px-5 py-6 sm:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
              <span aria-hidden="true">📍</span>
              Rajasthan Public Poll
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <span aria-hidden="true">⏳</span>
              <LiveCountdown createdAt={poll.createdAt} deadlineDays={poll.deadlineDays} isOpen={isOpen} />
            </span>
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            Aapki ray mahatvapurna hai
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
                  Neeche diye gaye vikalpo mein se ek chunein
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
                    Vote submit ho raha hai...
                  </>
                ) : (
                  'Vote Submit Karein'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-7">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                <p className="font-bold text-emerald-900">✅ Parinaam aur Aankde</p>
                <p className="mt-1 text-sm text-emerald-700">
                  Ab tak kul {totalVotes.toLocaleString('en-IN')} votes
                </p>
              </div>

              {totalVotes > 0 ? (
                <>
                  <div className="h-72 w-full" aria-label="Poll parinaamo ka pie chart">
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

                        <Tooltip formatter={(value, name) => [`${value} votes`, name]} />

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
                    Abhi tak koi vote darj nahi hua hai.
                  </p>
                </div>
              )}

              {/* 📢 Vote Submit / Result ke baad Adsterra 300x250 Banner */}
              <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center flex justify-center overflow-hidden">
                <PollBanner300x250 />
              </div>

              {/* 📢 Google AdSense Slot (Optional) */}
              <div className="my-4 p-2 bg-white rounded-xl border border-emerald-100 text-center">
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-4603205178906314"
                     data-ad-slot="YOUR_VOTE_RESULT_AD_SLOT"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
                <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({});' }} />
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <span aria-hidden="true">📲</span>
                Poll Share Karein
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-xs leading-relaxed text-slate-500 shadow-sm">
        JanPoll ke sabhi polls kewal janata ki ray janne ke liye hain. Yeh kisi sarkari sanstha ya aadhikarika chunavi matdan pranali ka hissa nahi hai.
      </aside>
    </section>
  );
}