'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Ad728x90 from '@/components/Ad728x90';

type HomePoll = {
  id: string;
  slug: string | null;
  question: string;
  createdAt: string;
  deadlineDays: number | null;
  options: { id: string; text: string; voteCount: number }[];
  totalVotes: number;
  districtName: string | null;
  samitiName: string | null;
  gramPanchayatName: string | null;
};

function getDeadline(createdAt: string, deadlineDays: number | null) {
  const date = new Date(createdAt);
  const days = deadlineDays ?? 7;
  date.setDate(date.getDate() + days);
  return date;
}

function isPollOpen(poll: HomePoll) {
  const deadline = getDeadline(poll.createdAt, poll.deadlineDays);
  return deadline.getTime() > Date.now();
}

function daysLeft(poll: HomePoll) {
  const ms = getDeadline(poll.createdAt, poll.deadlineDays).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function HomePage() {
  const [polls, setPolls] = useState<HomePoll[]>([]);
  const [totalVotesCount, setTotalVotesCount] = useState(0);
  const [totalRunningPollsCount, setTotalRunningPollsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dbError, setDbError] = useState(false);
  const [loading, setLoading] = useState(true);

  const pollsPerPage = 15;

  // Real-time data fetch function (auto-updates every 10 seconds)
  const fetchPollsData = async (query = '') => {
    try {
      const res = await fetch(`/api/home-polls?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setPolls(data.polls);
        setTotalVotesCount(data.totalVotesCount);
        setTotalRunningPollsCount(data.totalRunningPollsCount);
        setTotalPages(Math.max(1, Math.ceil(data.polls.length / pollsPerPage)));
        setDbError(false);
      } else {
        setDbError(true);
      }
    } catch (error) {
      console.error('डाटा फेच करने में त्रुटि:', error);
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  // Initial load & Auto-refresh interval (हर 10 सेकंड में ऑटो-अपडेट)
  useEffect(() => {
    fetchPollsData(searchQuery);

    const interval = setInterval(() => {
      fetchPollsData(searchQuery);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get('q') as string) || '';
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const paginatedPolls = polls.slice(
    (currentPage - 1) * pollsPerPage,
    currentPage * pollsPerPage
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-6 text-gray-800 overflow-x-hidden box-border">
      
      {/* टॉप बार */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          📍 राजस्थान का नंबर 1 ओपिनियन पोल प्लेटफॉर्म
        </span>
        <div className="flex items-center gap-2">
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300">
            🇮🇳 भारत: जल्द आ रहा है (Coming Soon)
          </span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition"
          >
            <span>💬</span> सहायता / संपर्क
          </Link>
        </div>
      </div>

      {/* मुख्य बैनर */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 md:p-10 mb-6 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
          राजस्थान की जनता की राय, एक मंच पर
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-3 mb-2 tracking-tight">
          आपकी राय, जनता की आवाज़।
        </h1>
        <p className="text-emerald-100 text-xs sm:text-sm md:text-base max-w-lg mx-auto mb-6">
          राजस्थान के स्थानीय मुद्दों, ग्राम पंचायत और सरपंच चुनाव पर अपनी राय दें और देखें कि जनता क्या सोचती है।
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/rajasthan"
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-5 py-2.5 rounded-xl shadow transition text-xs sm:text-sm inline-block"
          >
            📍 राजस्थान चुनाव / जिला चयन →
          </Link>
          <Link
            href="/create"
            className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-5 py-2.5 rounded-xl shadow transition text-xs sm:text-sm inline-block"
          >
            ＋ नया पोल बनाएँ
          </Link>
        </div>
      </div>

      {/* सर्च बार */}
      <div className="mb-6 bg-white p-3 sm:p-4 rounded-2xl border border-emerald-100 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="अपनी ग्राम पंचायत, जिला या सवाल से पोल खोजें..."
            className="flex-1 px-4 py-2.5 border border-emerald-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20 w-full"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm flex-1 sm:flex-none"
            >
              खोजें 🔍
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center justify-center"
              >
                रीसेट
              </button>
            )}
          </div>
        </form>
      </div>

      {/* चुनाव अपडेट बॉक्स */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 md:p-6 mb-8 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-xl sm:text-2xl">📢</span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-amber-900 mb-1">
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

      {/* लाइव आँकड़े */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-800">
            {totalRunningPollsCount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1">🗳 चल रहे पोल</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-800">
            {totalVotesCount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1">👥 कुल वोट</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-800">राजस्थान</div>
          <div className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1">📍 कवरेज</div>
        </div>
      </div>

      {/* समाप्त हो चुके पोल्स */}
      <div className="mb-8 text-center">
        <Link
          href="/closed-polls"
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold px-4 sm:px-5 py-2.5 rounded-xl text-xs md:text-sm transition shadow-sm"
        >
          <span>📁</span> समाप्त हो चुके पोल्स और पुराना इतिहास देखें →
        </Link>
      </div>

      {/* विज्ञापन */}
      <div className="my-6 bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
        <Ad728x90 />
      </div>

      {/* सक्रिय पोल्स की सूची */}
      <div id="recent-polls" className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-2 flex items-center gap-2">
          🔥 सक्रिय पोल्स की सूची {searchQuery ? `(खोज परिणाम: "${searchQuery}")` : ''}
        </h2>
        <p className="mb-6 text-xs text-gray-500">
          पृष्ठ {currentPage} / {totalPages} (कुल सक्रिय पोल: {totalRunningPollsCount})
        </p>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">पोल्स लोड हो रहे हैं...</div>
        ) : dbError ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center text-xs sm:text-sm">
            डेटाबेस से कनेक्ट नहीं हो पाया। कृपया थोड़ी देर बाद पुनः प्रयास करें।
          </div>
        ) : paginatedPolls.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-emerald-100 text-gray-500 shadow-sm">
            {searchQuery ? 'आपके खोज शब्द से मिलता-जुलता कोई पोल नहीं मिला।' : 'अभी कोई पोल चालू नहीं है। सबसे पहला पोल आप बनाएँ!'}
            <div className="mt-4">
              <Link href="/create" className="text-emerald-700 font-bold underline hover:text-emerald-800 text-xs sm:text-sm">
                नया पोल बनाएँ
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedPolls.map((poll, index) => {
              const pollTotalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
              const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;
              const showAdAfterThis = index === 4;
              const location = [poll.gramPanchayatName, poll.samitiName, poll.districtName].filter(Boolean).join(' · ');

              return (
                <React.Fragment key={poll.id}>
                  <div className="bg-white rounded-2xl p-4 sm:p-6 border border-emerald-100 shadow-sm hover:shadow-md transition w-full overflow-hidden">
                    <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500 mb-3">
                      <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                        🗳 कुल वोट: {pollTotalVotes.toLocaleString('en-IN')}
                      </span>
                      <span className="flex items-center gap-3">
                        <span>⏳ {daysLeft(poll)} दिन शेष</span>
                        <span>{new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                      </span>
                    </div>

                    {location && <p className="mb-2 text-xs font-semibold text-emerald-700">📍 {location}</p>}

                    <h3 className="text-base sm:text-lg font-bold text-emerald-900 mb-4 break-words">{poll.question}</h3>

                    <div className="space-y-2 mb-5">
                      {poll.options.map((opt) => (
                        <div
                          key={opt.id}
                          className="text-xs sm:text-sm font-medium text-gray-700 bg-emerald-50/20 p-3 rounded-xl border border-emerald-100 break-words"
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
                        className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 font-bold px-3.5 py-2 rounded-xl text-xs transition"
                      >
                        <span>💬</span> WhatsApp पर शेयर करें
                      </a>

                      <Link
                        href={pollUrl}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 sm:px-5 py-2 rounded-xl text-xs transition shadow ml-auto"
                      >
                        वोट दें और परिणाम देखें →
                      </Link>
                    </div>
                  </div>

                  {showAdAfterThis && (
                    <div className="my-6 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 overflow-hidden">
                      <Ad728x90 />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 pt-6 pb-2">
                {currentPage > 1 ? (
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition shadow-sm"
                  >
                    &larr; पिछला पेज
                  </button>
                ) : (
                  <span className="px-3.5 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed">
                    &larr; पिछला पेज
                  </span>
                )}

                <span className="text-xs font-semibold text-gray-600">
                  पेज {currentPage} / {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition shadow-sm"
                  >
                    अगला पेज &rarr;
                  </button>
                ) : (
                  <span className="px-3.5 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed">
                    अगला पेज &rarr;
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* कॉल-टू-एक्शन */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 text-center shadow-lg my-10">
        <h2 className="text-xl sm:text-2xl font-black mb-2">क्या आप अपनी पंचायत या वार्ड का पोल बनाना चाहते हैं?</h2>
        <p className="text-emerald-100 text-xs md:text-sm max-w-md mx-auto mb-6">
          अपने गाँव, सरपंच पद या वार्ड सदस्य के लिए तुरंत डिजिटल ओपिनियन पोल शुरू करें और जनता की राय जानें।
        </p>
        <Link
          href="/create"
          className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-6 sm:px-8 py-3 rounded-2xl shadow transition text-sm sm:text-base inline-block"
        >
          ＋ नया पोल बनाएँ
        </Link>
      </div>
    </div>
  );
}