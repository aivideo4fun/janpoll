import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getDeadline, isPollOpen } from '@/lib/poll-utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'JanPoll Rajasthan - राजस्थान की जनता की राय और ऑनलाइन पोल',
  description: 'राजस्थान के स्थानीय मुद्दों, ग्राम पंचायत, सरपंच चुनाव और राजनीतिक विषयों पर ऑनलाइन वोटिंग करें और जनता की राय जानें।',
  keywords: ['rajasthan poll', 'sarpanch poll', 'vote poll', 'create poll', 'rajasthan public poll', 'janpoll'],
  openGraph: {
    title: 'JanPoll - राजस्थान पब्लिक पोल',
    description: 'अपने स्थानीय मुद्दों पर अपनी राय दें और देखें जनता क्या सोचती है।',
    url: 'https://janpoll.in',
    siteName: 'JanPoll',
    locale: 'hi_IN',
    type: 'website',
  },
};

type HomePoll = {
  id: string;
  slug: string | null;
  question: string;
  createdAt: Date;
  deadlineDays: number | null;
  options: { id: string; text: string; voteCount: number }[];
  totalVotes: number;
};

function daysLeft(poll: HomePoll) {
  const ms = getDeadline(poll.createdAt, poll.deadlineDays).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default async function Home() {
  let polls: HomePoll[] = [];
  let totalVotesCount = 0;
  let dbError = false;

  try {
    const [allPolls, voteSum] = await Promise.all([
      db.poll.findMany({
        where: { active: true },
        select: {
          id: true,
          slug: true,
          question: true,
          active: true,
          createdAt: true,
          deadlineDays: true,
          options: {
            select: { id: true, text: true, voteCount: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      db.pollOption.aggregate({ _sum: { voteCount: true } }),
    ]);

    const activePolls = allPolls.filter(isPollOpen);

    const pollsWithVotes = activePolls.map((poll) => {
      const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
      return { ...poll, totalVotes };
    });

    pollsWithVotes.sort((a, b) => b.totalVotes - a.totalVotes);
    polls = pollsWithVotes.slice(0, 10);

    totalVotesCount = voteSum._sum.voteCount ?? 0;
  } catch (error) {
    console.error('Error fetching home polls:', error);
    dbError = true;
  }

  const runningPollsCount = polls.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 md:p-10 mb-6 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
          राजस्थान की जनता की राय, एक जगह
        </span>
        <h1 className="text-3xl md:text-4xl font-black mt-3 mb-2 tracking-tight">
          आपकी राय, जनता की आवाज़।
        </h1>
        <p className="text-emerald-100 text-sm md:text-base max-w-lg mx-auto mb-6">
          राजस्थान के स्थानीय मुद्दों, ग्राम पंचायत और सरपंच चुनाव पर अपनी राय दें और देखें कि जनता क्या सोचती है।
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/create"
            className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-6 py-2.5 rounded-xl shadow transition text-base inline-block"
          >
            ＋ पोल बनाएँ
          </Link>
          <a
            href="#recent-polls"
            className="bg-emerald-900/40 hover:bg-emerald-900/60 text-white font-medium px-5 py-2.5 rounded-xl transition text-base border border-emerald-500/30 inline-block"
          >
            लोकप्रिय पोल देखें ↓
          </a>
        </div>
      </div>

      {/* 📢 Rajasthan Panchayati Raj Election 2026 Notice Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 md:p-6 mb-8 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📢</span>
          <div>
            <h2 className="text-base font-bold text-amber-900 mb-1">
              राजस्थान पंचायती राज आम चुनाव, 2026 विशेष अपडेट
            </h2>
            <p className="text-xs md:text-sm text-amber-800 leading-relaxed mb-3">
              राज्य निर्वाचन आयोग, राजस्थान द्वारा पंचायतीराज संस्थाओं के आम चुनाव कुल <strong>4 चरणों</strong> में घोषित कर दिए गए हैं।
            </p>
            <Link
              href="/rajasthan-election-2026"
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
            >
              👉 चुनाव का पूरा चरणवार कार्यक्रम और विस्तृत सूची यहाँ देखें →
            </Link>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">
            {runningPollsCount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 font-medium mt-1">🗳 चल रहे पोल</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">
            {totalVotesCount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 font-medium mt-1">👥 कुल वोट</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">राजस्थान</div>
          <div className="text-xs text-gray-500 font-medium mt-1">📍 कवरेज</div>
        </div>
      </div>

      {/* Interactive Categories Linked to Hierarchy */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          📂 पोल की श्रेणियाँ एवं स्तर
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/rajasthan"
            className="bg-white border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50 transition"
          >
            🟢 सरपंच चुनाव
          </Link>
          <Link
            href="/rajasthan"
            className="bg-white border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50 transition"
          >
            🏛️ ग्राम पंचायत
          </Link>
          <Link
            href="/rajasthan"
            className="bg-white border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50 transition"
          >
            🔵 पंचायत समिति
          </Link>
          <Link
            href="/rajasthan"
            className="bg-white border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50 transition"
          >
            🟠 जिला परिषद
          </Link>
          {['स्थानीय मुद्दे', 'राजस्थान', 'युवा'].map((cat) => (
            <span
              key={cat}
              className="bg-white border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Real Top 10 Trending / Active Polls from DB */}
      <div id="recent-polls" className="mb-10">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          🔥 सर्वाधिक लोकप्रिय पोल्स (शीर्ष 10 ट्रेंडिंग)
        </h2>

        {dbError ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
            डेटाबेस से कनेक्ट नहीं हो पाया। कृपया थोड़ी देर बाद रिफ्रेश करें।
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-emerald-100 text-gray-500 shadow-sm">
            अभी कोई पोल चालू नहीं है। सबसे पहला पोल आप बनाएँ!
            <div className="mt-4">
              <Link href="/create" className="text-emerald-700 font-bold underline hover:text-emerald-800">
                पोल बनाएँ
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => {
              const pollTotalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
              const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;

              return (
                <div
                  key={poll.id}
                  className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                      🗳 कुल वोट: {pollTotalVotes.toLocaleString('en-IN')}
                    </span>
                    <span className="flex items-center gap-3">
                      <span>⏳ {daysLeft(poll)} दिन बचे</span>
                      <span>{new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-emerald-900 mb-4">{poll.question}</h3>

                  <div className="space-y-2 mb-5">
                    {poll.options.map((opt) => (
                      <div
                        key={opt.id}
                        className="text-sm font-medium text-gray-700 bg-emerald-50/20 p-3 rounded-xl border border-emerald-100"
                      >
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`🗳️ ${poll.question}\nअपनी राय दें: https://janpoll.in${pollUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                    >
                      <span>💬</span> WhatsApp पर भेजें
                    </a>

                    <Link
                      href={pollUrl}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow ml-auto"
                    >
                      वोट दें और परिणाम देखें →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Page Ending Create Poll Call-to-Action */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-3xl p-8 text-center shadow-lg my-10">
        <h2 className="text-2xl font-black mb-2">क्या आप अपनी पंचायत या वार्ड का पोल बनाना चाहते हैं?</h2>
        <p className="text-emerald-100 text-xs md:text-sm max-w-md mx-auto mb-6">
          अपने गाँव, सरपंच पद या मंडल सदस्य के लिए तुरंत डिजिटल ओपिनियन पोल शुरू करें और जनता की राय जानें।
        </p>
        <Link
          href="/create"
          className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-8 py-3 rounded-2xl shadow transition text-base inline-block"
        >
          ＋ नया पोल बनाएँ
        </Link>
      </div>
    </div>
  );
}