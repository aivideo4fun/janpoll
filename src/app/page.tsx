import Link from 'next/link';
import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getDeadline, isPollOpen } from '@/lib/poll-utils';
import NativeBanner from '@/components/NativeBanner';

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
  districtName: string | null;
  samitiName: string | null;
  gramPanchayatName: string | null;
};

function daysLeft(poll: HomePoll) {
  const ms = getDeadline(poll.createdAt, poll.deadlineDays).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

type HomeProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { q, page } = await searchParams;
  const searchQuery = (q ?? '').trim().toLowerCase();
  const currentPage = Math.max(1, parseInt(page ?? '1', 10));
  const pollsPerPage = 15;

  let polls: HomePoll[] = [];
  let totalVotesCount = 0;
  let totalRunningPollsCount = 0;
  let totalPages = 1;
  let dbError = false;

  try {
    const [allPolls, voteSum] = await Promise.all([
      db.poll.findMany({
        where: { active: true },
        select: {
          id: true,
          slug: true,
          question: true,
          districtName: true,
          samitiName: true,
          gramPanchayatName: true,
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
    totalRunningPollsCount = activePolls.length;

    let pollsWithVotes = activePolls.map((poll) => {
      const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
      return { ...poll, totalVotes };
    });

    // सर्वाधिक वोटों वाले पोल सबसे ऊपर
    pollsWithVotes.sort((a, b) => b.totalVotes - a.totalVotes);

    // सर्च लॉजिक
   if (searchQuery) {
  pollsWithVotes = pollsWithVotes.filter((p: any) => {
    const qText = p.question.toLowerCase();
    const dist = ((p.districtName as string) ?? '').toLowerCase();
    const samiti = ((p.samitiName as string) ?? '').toLowerCase();
    const gp = ((p.gramPanchayatName as string) ?? '').toLowerCase();

    return (
      qText.includes(searchQuery) ||
      dist.includes(searchQuery) ||
      samiti.includes(searchQuery) ||
      gp.includes(searchQuery)
    );
  });
}

    totalPages = Math.max(1, Math.ceil(pollsWithVotes.length / pollsPerPage));
    const validPage = Math.min(currentPage, totalPages);
    const startIndex = (validPage - 1) * pollsPerPage;
    
    polls = pollsWithVotes.slice(startIndex, startIndex + pollsPerPage);
    totalVotesCount = voteSum._sum.voteCount ?? 0;
  } catch (error) {
    console.error('होम पोल लोड करने में त्रुटि:', error);
    dbError = true;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-gray-800">
      
      {/* 🛠️ टॉप बार (सहायता बटन) */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          📍 राजस्थान का नंबर 1 ओपिनियन पोल प्लेटफॉर्म
        </span>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition"
        >
          <span>💬</span> सहायता / संपर्क
        </Link>
      </div>

      {/* मुख्य बैनर */}
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

      {/* सर्च बार */}
      <div className="mb-6 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
        <form method="GET" action="/" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="अपनी ग्राम पंचायत, जिला या सवाल से पोल खोजें..."
            className="flex-1 px-4 py-2.5 border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20"
          />
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-sm"
          >
            खोजें 🔍
          </button>
          {searchQuery && (
            <Link
              href="/"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-sm transition flex items-center"
            >
              रीसेट
            </Link>
          )}
        </form>
      </div>

      {/* चुनाव अपडेट बॉक्स */}
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

      {/* लाइव आँकड़े */}
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

      {/* समाप्त हो चुके पोल्स */}
      <div className="mb-8 text-center">
        <Link
          href="/closed-polls"
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold px-5 py-2.5 rounded-xl text-xs md:text-sm transition shadow-sm"
        >
          <span>📁</span> समाप्त हो चुके पोल्स और पुराना इतिहास देखें →
        </Link>
      </div>

      {/* श्रेणियाँ */}
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

      {/* सक्रिय पोल्स की सूची और पेिजिनेशन */}
      <div id="recent-polls" className="mb-10">
        <h2 className="text-2xl font-bold text-emerald-900 mb-2 flex items-center gap-2">
          🔥 सक्रिय पोल्स की सूची {searchQuery ? `(खोज परिणाम: "${searchQuery}")` : ''}
        </h2>
        <p className="mb-6 text-xs text-gray-500">
          पृष्ठ {currentPage} / {totalPages} (कुल सक्रिय पोल: {totalRunningPollsCount})
        </p>

        {dbError ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
            डेटाबेस से कनेक्ट नहीं हो पाया। कृपया थोड़ी देर बाद पुनः प्रयास करें।
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
              const showAdAfterThis = (index + 1) % 5 === 0;
              const location = [poll.gramPanchayatName, poll.samitiName, poll.districtName].filter(Boolean).join(' · ');

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

                    {location && <p className="mb-2 text-xs font-semibold text-emerald-700">📍 {location}</p>}

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

            {/* 📄 Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-6 pb-2">
                {currentPage > 1 ? (
                  <Link
                    href={`/?page=${currentPage - 1}${searchQuery ? `&q=${searchQuery}` : ''}`}
                    className="px-4 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition shadow-sm"
                  >
                    &larr; पिछला पेज
                  </Link>
                ) : (
                  <span className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed">
                    &larr; पिछला पेज
                  </span>
                )}

                <span className="text-xs font-semibold text-gray-600">
                  पेज {currentPage} / {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/?page=${currentPage + 1}${searchQuery ? `&q=${searchQuery}` : ''}`}
                    className="px-4 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition shadow-sm"
                  >
                    अगला पेज &rarr;
                  </Link>
                ) : (
                  <span className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed">
                    अगला पेज &rarr;
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* कॉल-टू-एक्शन */}
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