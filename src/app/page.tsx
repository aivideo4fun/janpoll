'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import NativeBanner from '@/components/NativeBanner';

type HomePoll = {
  id: string;
  slug: string | null;
  question: string;
  createdAt: string | Date;
  deadlineDays: number | null;
  options: { id: string; text: string; voteCount: number }[];
  totalVotes: number;
};

function getDeadline(createdAt: string | Date, deadlineDays: number | null) {
  const date = new Date(createdAt);
  const days = deadlineDays ?? 3;
  date.setDate(date.getDate() + days);
  return date;
}

function isPollOpen(poll: { createdAt: string | Date; deadlineDays: number | null; active: boolean }) {
  if (!poll.active) return false;
  const deadline = getDeadline(poll.createdAt, poll.deadlineDays);
  return new Date().getTime() < deadline.getTime();
}

function daysLeft(poll: HomePoll) {
  const ms = getDeadline(poll.createdAt, poll.deadlineDays).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function Home() {
  const [polls, setPolls] = useState<HomePoll[]>([]);
  const [totalVotesCount, setTotalVotesCount] = useState<number>(0);
  const [totalRunningPollsCount, setTotalRunningPollsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dbError, setDbError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 🔄 Realtime data fetching bina page refresh kiye
  useEffect(() => {
    const fetchPollsData = async () => {
      try {
        const res = await fetch('/api/polls'); // ya aap apni API ya server action use kar sakte hain
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        const activePolls = (data.polls || []).filter(isPollOpen);
        setTotalRunningPollsCount(activePolls.length);

        let pollsWithVotes = activePolls.map((poll: any) => {
          const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.voteCount, 0);
          return { ...poll, totalVotes };
        });

        // सर्वाधिक वोटों वाले पोल सबसे ऊपर
        pollsWithVotes.sort((a: any, b: any) => b.totalVotes - a.totalVotes);

        if (searchQuery) {
          pollsWithVotes = pollsWithVotes.filter((p: any) =>
            p.question.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setPolls(pollsWithVotes);
        setTotalVotesCount(data.totalVotesSum ?? 0);
        setDbError(false);
      } catch (err) {
        console.error('डाटा लोड करने में त्रुटि:', err);
        setDbError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPollsData();

    // Har 5 second mein automatic background refresh
    const interval = setInterval(fetchPollsData, 5000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-gray-800">
      {/* मुख्य बैनर (Hero Section) */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 md:p-10 mb-6 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
          राजस्थान की जनता की राय, एक मंच पर
        </span>
        <h1 className="text-3xl md:text-4xl font-black mt-3 mb-2 tracking-tight">
          आपकी राय, जनता की आवाज़।
        </h1>
        <p className="text-emerald-100 text-sm md:text-base max-w-lg mx-auto mb-6">
          राजस्थान के स्थानीय मुद्दों, ग्राम पंचायत और सरपंच चुनाव पर अपनी राय दें और देखें कि जनता क्या सोचती है।
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/rajasthan"
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded-xl shadow transition text-base inline-block"
          >
            📍 राजस्थान चुनाव / जिला चयन →
          </Link>
          <Link
            href="/create"
            className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-6 py-2.5 rounded-xl shadow transition text-base inline-block"
          >
            ＋ नया पोल बनाएँ
          </Link>
        </div>
      </div>

      {/* 🔍 सर्च बार (Search Bar) */}
      <div className="mb-6 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="अपनी ग्राम पंचायत, जिला या सवाल से पोल खोजें..."
            className="flex-1 px-4 py-2.5 border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-sm transition flex items-center"
            >
              रीसेट
            </button>
          )}
        </div>
      </div>

      {/* 📢 राजस्थान पंचायती राज चुनाव 2026 सूचना बॉक्स */}
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
              👉 चुनाव का पूरा चरणवार कार्यक्रम यहाँ देखें →
            </Link>
          </div>
        </div>
      </div>

      {/* लाइव आँकड़े (Live Stats) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">
            {totalRunningPollsCount.toLocaleString('en-IN')}
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

      {/* 📁 समाप्त हो चुके पोल्स का लिंक */}
      <div className="mb-8 text-center">
        <Link
          href="/closed-polls"
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold px-5 py-2.5 rounded-xl text-xs md:text-sm transition shadow-sm"
        >
          <span>📁</span> समाप्त हो चुके पोल्स और पुराना इतिहास देखें →
        </Link>
      </div>

      {/* श्रेणियाँ (Categories) */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          📂 पोल की श्रेणियाँ एवं स्तर
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🟢 सरपंच चुनाव
          </Link>
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🏛️ ग्राम पंचायत
          </Link>
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🔵 पंचायत समिति
          </Link>
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🟠 जिला परिषद
          </Link>
        </div>
      </div>

      {/* सर्वाधिक लोकप्रिय पोल्स और स्मार्ट विज्ञापन (Smart Ads Every 20 Polls) */}
      <div id="recent-polls" className="mb-10">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          🔥 सक्रिय पोल्स की सूची {searchQuery ? `(खोज परिणाम: "${searchQuery}")` : ''}
        </h2>

        {dbError ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
            डेटाबेस से कनेक्ट नहीं हो पाया। कृपया थोड़ी देर बाद पुनः प्रयास करें।
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl p-8 text-center border border-emerald-100 text-gray-500 shadow-sm">
            पोल लोड हो रहे हैं...
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-emerald-100 text-gray-500 shadow-sm">
            {searchQuery ? 'आपके खोज शब्द से मिलता-जुलता कोई पोल नहीं मिला।' : 'अभी कोई पोल चालू नहीं है। सबसे पहला पोल आप बनाएँ!'}
            <div className="mt-4">
              <Link href="/create" className="text-emerald-700 font-bold underline hover:text-emerald-800">
                नया पोल बनाएँ
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll, index) => {
              const pollTotalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
              const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;
              const showAdAfterThis = (index + 1) % 20 === 0;

              return (
                <React.Fragment key={poll.id}>
                  <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500 mb-3">
                      <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                        🗳 कुल वोट: {pollTotalVotes.toLocaleString('en-IN')}
                      </span>
                      <span className="flex items-center gap-3">
                        <span>⏳ {daysLeft(poll)} दिन शेष</span>
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
                        href={`https://wa.me/?text=${encodeURIComponent(`🗳️ ${poll.question}\nअपनी राय यहाँ दें: https://janpoll.in${pollUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                      >
                        <span>💬</span> WhatsApp पर शेयर करें
                      </a>

                      <Link
                        href={pollUrl}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow ml-auto"
                      >
                        वोट दें और परिणाम देखें →
                      </Link>
                    </div>
                  </div>

                  {showAdAfterThis && (
                    <div className="my-6 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-center">
                      <NativeBanner />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* पेज के अंत में कॉल-टू-एक्शन */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-3xl p-8 text-center shadow-lg my-10">
        <h2 className="text-2xl font-black mb-2">क्या आप अपनी पंचायत या वार्ड का पोल बनाना चाहते हैं?</h2>
        <p className="text-emerald-100 text-xs md:text-sm max-w-md mx-auto mb-6">
          अपने गाँव, सरपंच पद या वार्ड सदस्य के लिए तुरंत डिजिटल ओपिनियन पोल शुरू करें और जनता की राय जानें।
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