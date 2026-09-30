'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { castVote } from '@/lib/actions';
import { getOrCreateAnonymousUserId } from '@/lib/anonymous-user';

const COLORS = [
  '#047857',
  '#059669',
  '#10B981',
  '#34D399',
  '#6EE7B7',
  '#A7F3D0',
  '#065F46',
  '#022C22',
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
  options: PollOption[];
};

type PollClientViewProps = {
  poll: Poll;
};

type ChartDataItem = {
  name: string;
  votes: number;
  percentage: number;
};

const VOTED_POLLS_KEY = 'voted_polls';

function getVotedPolls(): Record<string, boolean> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const storedValue = localStorage.getItem(VOTED_POLLS_KEY);

    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);

    return parsedValue &&
      typeof parsedValue === 'object' &&
      !Array.isArray(parsedValue)
      ? parsedValue
      : {};
  } catch {
    return {};
  }
}

export default function PollClientView({
  poll,
}: PollClientViewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const anonymousUserId = getOrCreateAnonymousUserId();

    setUserId(anonymousUserId);

    const votedPolls = getVotedPolls();

    if (votedPolls[poll.id]) {
      setHasVoted(true);
    }
  }, [poll.id]);

  const totalVotes = useMemo(
    () =>
      poll.options.reduce(
        (total, option) => total + option.voteCount,
        0,
      ),
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

  const saveVotedPoll = useCallback(() => {
    const votedPolls = getVotedPolls();

    localStorage.setItem(
      VOTED_POLLS_KEY,
      JSON.stringify({
        ...votedPolls,
        [poll.id]: true,
      }),
    );
  }, [poll.id]);

  const handleVoteSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedOption) {
      setMessage('कृपया पहले कोई एक विकल्प चुनें।');
      return;
    }

    if (!userId) {
      setMessage('यूज़र पहचान तैयार नहीं हुई। कृपया दोबारा प्रयास करें।');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await castVote(
        poll.id,
        selectedOption,
        userId,
      );

      if (response.success) {
        saveVotedPoll();
        setHasVoted(true);
        setMessage('आपका वोट सफलतापूर्वक दर्ज हो गया।');
        return;
      }

      setMessage(
        response.message || 'वोट दर्ज नहीं हो सका। कृपया दोबारा प्रयास करें।',
      );

      // Server ने बताया कि इस user ने पहले vote किया है।
      if (
        response.message?.toLowerCase().includes('already') ||
        response.message?.includes('पहले') ||
        response.message?.includes('vote')
      ) {
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      setMessage(
        'वोट दर्ज करते समय समस्या आई। कृपया थोड़ी देर बाद दोबारा प्रयास करें।',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    const shareData = {
      title: poll.question,
      text: `🗳️ इस JanPoll पर अपनी राय दें:\n\n${poll.question}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setMessage('पोल लिंक क्लिपबोर्ड पर कॉपी हो गया है।');
    } catch (error) {
      // User ने share dialog cancel किया हो तो error दिखाने की जरूरत नहीं।
      if ((error as DOMException)?.name !== 'AbortError') {
        setMessage('पोल शेयर नहीं हो सका। कृपया दोबारा प्रयास करें।');
      }
    }
  };

  const deadline = poll.deadlineDays ?? 3;

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
              समय सीमा: {deadline} दिन
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

          {!hasVoted ? (
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
                <p className="font-bold text-emerald-900">
                  ✅ परिणाम और आंकड़े
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  अब तक कुल {totalVotes.toLocaleString('en-IN')} वोट
                </p>
              </div>

              {totalVotes > 0 ? (
                <>
                  <div
                    className="h-72 w-full"
                    aria-label="पोल परिणामों का pie chart"
                  >
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

                        <Tooltip
                          formatter={(value, name) => [
                            `${value} वोट`,
                            name,
                          ]}
                        />

                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{
                            fontSize: '12px',
                          }}
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
                          <span className="font-semibold text-slate-700">
                            {item.name}
                          </span>

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
                              backgroundColor:
                                COLORS[index % COLORS.length],
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

              <button
                type="button"
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <span aria-hidden="true">📲</span>
                पोल शेयर करें
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-xs leading-relaxed text-slate-500 shadow-sm">
        JanPoll के सभी पोल्स केवल जनता की राय जानने के लिए हैं। यह किसी
        सरकारी संस्था या आधिकारिक चुनावी मतदान प्रणाली का हिस्सा नहीं है।
      </aside>
    </section>
  );
}