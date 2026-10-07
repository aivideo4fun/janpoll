'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import NativeBanner from '@/components/NativeBanner';
import AdsterraBanner from '@/components/AdsterraBanner';

// ---------- सेटिंग्स (यहीं से बदलें) ----------
const POLLS_PER_PAGE = 15;
const REFRESH_MS = 15000; // आँकड़े अपने आप कितनी देर में अपडेट हों
const SUPPORT_HREF = '/contact'; // सहायता / सपोर्ट पेज

// ---------- विज्ञापन (Adsterra) ----------
type AdKind = 'native' | 'banner300' | 'banner320' | 'banner728';

const BANNER_SRC_BASE = 'https://bicea.org/22/';

const ADS = {
  banner300: { key: '4801d526481e48f32daba116c6ca2a7c', width: 300, height: 250 }, // Banner 300x250
  banner320: { key: '41a306430c4cf4c05f5cca80c78a3fef', width: 320, height: 50 }, // Banner 320x50
  banner728: { key: '284cee4d0f75c889cb2c8420f6c1834f', width: 728, height: 90 }, // Banner 728x90
};

// हर पेज पर: इस क्रमांक के पोल के बाद, मोबाइल और डेस्कटॉप पर कौन सा विज्ञापन
const AD_AFTER_POLL: Record<number, { mobile: AdKind; desktop: AdKind }> = {
  5: { mobile: 'banner320', desktop: 'banner728' },
  10: { mobile: 'banner300', desktop: 'banner300' },
};
// 15 पोल के नीचे आने वाला विज्ञापन
const END_AD: AdKind = 'native';

type HomePoll = {
  id: string;
  slug: string | null;
  question: string;
  createdAt: string | Date;
  deadlineDays: number | null;
  active?: boolean;
  options: { id: string; text: string; voteCount: number }[];
  totalVotes: number;
  districtName?: string | null;
  samitiName?: string | null;
  gramPanchayatName?: string | null;
};

function getDeadline(createdAt: string | Date, deadlineDays: number | null) {
  const date = new Date(createdAt);
  const days = deadlineDays ?? 3;
  date.setDate(date.getDate() + days);
  return date;
}

function isPollOpen(poll: { createdAt: string | Date; deadlineDays: number | null; active?: boolean }) {
  if (poll.active === false) return false;
  const deadline = getDeadline(poll.createdAt, poll.deadlineDays);
  return new Date().getTime() < deadline.getTime();
}

function daysLeft(poll: HomePoll) {
  const ms = getDeadline(poll.createdAt, poll.deadlineDays).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function normalizeText(value?: string | null) {
  return (value ?? '').normalize('NFC').toLowerCase();
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const wanted = Array.from(new Set([1, total, current - 1, current, current + 1]))
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | '…')[] = [];
  wanted.forEach((p, i) => {
    if (i > 0 && p - wanted[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
}

// स्क्रीन 768px या उससे बड़ी है या नहीं (सही साइज़ का विज्ञापन ही लोड हो)
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

// ---------- विज्ञापन की जगह (ऊँचाई पहले से तय, छोटी स्क्रीन पर पूरी चौड़ाई) ----------
function AdSlot({ kind, slotKey }: { kind: AdKind; slotKey: string }) {
  let content: React.ReactNode = null;

  if (kind === 'native') {
    content = (
      <NativeBanner
        key={slotKey}
        className="flex min-h-[110px] w-full items-center justify-center overflow-hidden"
      />
    );
  } else {
    const cfg = ADS[kind];
    if (!cfg.key) return null;

    content = (
      <AdsterraBanner
        key={`${slotKey}-${kind}`}
        adKey={cfg.key}
        width={cfg.width}
        height={cfg.height}
        src={`${BANNER_SRC_BASE}${cfg.key}`}
        className="flex w-full items-center justify-center overflow-hidden"
      />
    );
  }

  return (
    <div className="-mx-4 my-6 flex flex-col items-center border-y border-emerald-100 bg-emerald-50/40 py-3 sm:mx-0 sm:rounded-2xl sm:border">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">विज्ञापन</p>
      {content}
    </div>
  );
}

// ---------- पेज बदलने के बटन ----------
function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  const base =
    'min-h-[44px] min-w-[44px] rounded-xl border px-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <nav aria-label="पोल पेज सूची" className="mt-6 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className={`${base} border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          ← पिछला
        </button>

        <span className="text-sm font-semibold text-gray-600">
          पृष्ठ {current} / {total}
        </span>

        <button
          type="button"
          onClick={() => onChange(current + 1)}
          disabled={current === total}
          className={`${base} border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          अगला →
        </button>
      </div>

      <div className="hidden flex-wrap items-center justify-center gap-2 sm:flex">
        {getPageNumbers(current, total).map((p, i) =>
          p === '…' ? (
            <span key={`dots-${i}`} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === current ? 'page' : undefined}
              className={`${base} ${
                p === current
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>
    </nav>
  );
}

export default function Home() {
  const [allPolls, setAllPolls] = useState<HomePoll[]>([]);
  const [totalVotesCount, setTotalVotesCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [dbError, setDbError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const hasLoaded = useRef(false);
  const isDesktop = useIsDesktop();

  // 🔄 बिना पेज रिफ्रेश किए आँकड़े अपडेट (टैब छुपा हो तो रुका रहता है)
  useEffect(() => {
    let cancelled = false;

    const fetchPollsData = async () => {
      if (hasLoaded.current && document.visibilityState === 'hidden') return;

      try {
        const res = await fetch('/api/polls', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (cancelled) return;

        const activePolls: HomePoll[] = (data.polls || [])
          .filter(isPollOpen)
          .map((poll: any) => ({
            ...poll,
            totalVotes: poll.options.reduce((sum: number, opt: any) => sum + opt.voteCount, 0),
          }));

        setAllPolls(activePolls);
        setTotalVotesCount(data.totalVotesSum ?? 0);
        setDbError(false);
        hasLoaded.current = true;
      } catch (err) {
        console.error('डाटा लोड करने में त्रुटि:', err);
        // पहले से दिख रहा डाटा न हटे, त्रुटि सिर्फ़ तब दिखे जब कभी डाटा आया ही नहीं
        if (!cancelled && !hasLoaded.current) setDbError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPollsData();
    const interval = setInterval(fetchPollsData, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchPollsData();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // सर्वाधिक वोट वाले पोल सबसे ऊपर, बराबरी पर नया पोल पहले
  const sortedPolls = useMemo(
    () =>
      [...allPolls].sort(
        (a, b) =>
          b.totalVotes - a.totalVotes ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [allPolls],
  );

  const filteredPolls = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    if (!q) return sortedPolls;
    return sortedPolls.filter((p) =>
      [p.question, p.gramPanchayatName, p.samitiName, p.districtName].some((v) =>
        normalizeText(v).includes(q),
      ),
    );
  }, [sortedPolls, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPolls.length / POLLS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagePolls = filteredPolls.slice(
    (currentPage - 1) * POLLS_PER_PAGE,
    currentPage * POLLS_PER_PAGE,
  );

  const goToPage = (target: number) => {
    setPage(Math.min(Math.max(target, 1), totalPages));
    document.getElementById('recent-polls')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-gray-800">
      {/* मुख्य बैनर (Hero Section) */}
      <div className="relative bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl px-4 pb-6 pt-14 sm:px-6 md:px-10 md:pb-10 mb-6 text-center shadow-md">
        {/* 💬 सहायता बटन: ऊपर दाएँ कोने में */}
        <Link
          href={SUPPORT_HREF}
          className="absolute right-3 top-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-emerald-900 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          <span aria-hidden="true">💬</span> सहायता
        </Link>

        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
          राजस्थान की जनता की राय, एक मंच पर
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-3 mb-2 tracking-tight">
          आपकी राय, जनता की आवाज़।
        </h1>
        <p className="text-emerald-100 text-sm md:text-base max-w-lg mx-auto mb-6">
          राजस्थान के स्थानीय मुद्दों, ग्राम पंचायत और सरपंच चुनाव पर अपनी राय दें और देखें कि जनता क्या सोचती है।
        </p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3">
          <Link
            href="/rajasthan"
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-3 rounded-xl shadow transition text-base inline-block w-full sm:w-auto"
          >
            📍 राजस्थान चुनाव / जिला चयन →
          </Link>
          <Link
            href="/create"
            className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-6 py-3 rounded-xl shadow transition text-base inline-block w-full sm:w-auto"
          >
            ＋ नया पोल बनाएँ
          </Link>
        </div>
      </div>

      {/* 🔍 सर्च बार (Search Bar) */}
      <div className="mb-6 bg-white p-3 sm:p-4 rounded-2xl border border-emerald-100 shadow-sm">
        <div className="flex gap-2">
          <input
            type="search"
            inputMode="search"
            aria-label="पोल खोजें"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="ग्राम पंचायत, जिला या सवाल से पोल खोजें..."
            className="min-w-0 flex-1 px-4 py-3 border border-emerald-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-3 rounded-xl text-sm transition flex items-center"
            >
              रीसेट
            </button>
          )}
        </div>
      </div>

      {/* 📢 राजस्थान पंचायती राज चुनाव 2026 सूचना बॉक्स */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 md:p-6 mb-8 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📢</span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-amber-900 mb-1">
              राजस्थान पंचायती राज आम चुनाव, 2026 विशेष अपडेट
            </h2>
            <p className="text-xs md:text-sm text-amber-800 leading-relaxed mb-3">
              राज्य निर्वाचन आयोग, राजस्थान द्वारा पंचायतीराज संस्थाओं के आम चुनाव कुल <strong>4 चरणों</strong> में घोषित कर दिए गए हैं।
            </p>
            <Link
              href="/rajasthan-election-2026"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-3 rounded-xl text-xs transition shadow-sm"
            >
              👉 चुनाव का पूरा चरणवार कार्यक्रम यहाँ देखें →
            </Link>
          </div>
        </div>
      </div>

      {/* लाइव आँकड़े (Live Stats) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-800">
            {allPolls.length.toLocaleString('en-IN')}
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
          <div className="text-lg sm:text-2xl md:text-3xl font-black text-emerald-800">राजस्थान</div>
          <div className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1">📍 कवरेज</div>
        </div>
      </div>

      {/* 📁 समाप्त हो चुके पोल्स का लिंक */}
      <div className="mb-8 text-center">
        <Link
          href="/closed-polls"
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold px-5 py-3 rounded-xl text-xs md:text-sm transition shadow-sm"
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
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🟢 सरपंच चुनाव
          </Link>
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🏛️ ग्राम पंचायत
          </Link>
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🔵 पंचायत समिति
          </Link>
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🟠 जिला परिषद
          </Link>
        </div>
      </div>

      {/* सर्वाधिक लोकप्रिय पोल्स (15 प्रति पेज) और हर पेज के नीचे विज्ञापन */}
      <div id="recent-polls" className="mb-10 scroll-mt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-2 flex flex-wrap items-center gap-2">
          🔥 सक्रिय पोल्स की सूची {searchQuery ? `(खोज परिणाम: "${searchQuery}")` : ''}
        </h2>

        {!loading && !dbError && filteredPolls.length > 0 && (
          <p className="mb-5 text-xs text-gray-500">
            कुल {filteredPolls.length.toLocaleString('en-IN')} पोल · सबसे ज़्यादा वोट वाले पहले · पृष्ठ {currentPage} / {totalPages}
          </p>
        )}

        {dbError ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
            डेटाबेस से कनेक्ट नहीं हो पाया। कृपया थोड़ी देर बाद पुनः प्रयास करें।
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl p-8 text-center border border-emerald-100 text-gray-500 shadow-sm">
            पोल लोड हो रहे हैं...
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-emerald-100 text-gray-500 shadow-sm">
            {searchQuery ? 'आपके खोज शब्द से मिलता-जुलता कोई पोल नहीं मिला।' : 'अभी कोई पोल चालू नहीं है। सबसे पहला पोल आप बनाएँ!'}
            <div className="mt-4">
              <Link href="/create" className="text-emerald-700 font-bold underline hover:text-emerald-800">
                नया पोल बनाएँ
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {pagePolls.map((poll, index) => {
                const number = index + 1;
                const pollTotalVotes = poll.totalVotes;
                const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;
                const location = [poll.gramPanchayatName, poll.samitiName, poll.districtName]
                  .filter(Boolean)
                  .join(' · ');

                // बीच का विज्ञापन तभी, जब उसके बाद भी कोई पोल बचा हो (अंत वाला विज्ञापन अलग आता है)
                const slot = number < pagePolls.length ? AD_AFTER_POLL[number] : undefined;
                const midAdKind: AdKind | undefined =
                  slot && isDesktop !== null ? (isDesktop ? slot.desktop : slot.mobile) : undefined;

                return (
                  <React.Fragment key={poll.id}>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-emerald-100 shadow-sm hover:shadow-md transition">
                      <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500 mb-3">
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                          🗳 कुल वोट: {pollTotalVotes.toLocaleString('en-IN')}
                        </span>
                        <span className="flex items-center gap-3">
                          <span>⏳ {daysLeft(poll)} दिन शेष</span>
                          <span>{new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                        </span>
                      </div>

                      {location && (
                        <p className="mb-2 text-xs font-semibold text-emerald-700">📍 {location}</p>
                      )}

                      <h3 className="text-base sm:text-lg font-bold text-emerald-900 mb-4 leading-snug">
                        {poll.question}
                      </h3>

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

                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
                        <Link
                          href={pollUrl}
                          className="order-1 sm:order-2 sm:ml-auto flex min-h-[44px] items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-3 rounded-xl text-sm sm:text-xs transition shadow"
                        >
                          वोट दें और परिणाम देखें →
                        </Link>

                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`🗳️ ${poll.question}\nअपनी राय यहाँ दें: https://janpoll.in${pollUrl}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="order-2 sm:order-1 flex min-h-[44px] items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 font-bold px-4 py-3 rounded-xl text-sm sm:text-xs transition"
                        >
                          <span>💬</span> WhatsApp पर शेयर करें
                        </a>
                      </div>
                    </div>

                    {midAdKind && <AdSlot kind={midAdKind} slotKey={`mid-${currentPage}-${number}`} />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* हर पेज के 15 पोल के नीचे विज्ञापन, उसके बाद अगला पेज बटन */}
            <AdSlot kind={END_AD} slotKey={`end-${currentPage}`} />

            <Pagination current={currentPage} total={totalPages} onChange={goToPage} />
          </>
        )}
      </div>

      {/* पेज के अंत में कॉल-टू-एक्शन */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 text-center shadow-lg my-10">
        <h2 className="text-xl sm:text-2xl font-black mb-2">क्या आप अपनी पंचायत या वार्ड का पोल बनाना चाहते हैं?</h2>
        <p className="text-emerald-100 text-xs md:text-sm max-w-md mx-auto mb-6">
          अपने गाँव, सरपंच पद या वार्ड सदस्य के लिए तुरंत डिजिटल ओपिनियन पोल शुरू करें और जनता की राय जानें।
        </p>
        <Link
          href="/create"
          className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-8 py-3 rounded-2xl shadow transition text-base inline-block w-full sm:w-auto"
        >
          ＋ नया पोल बनाएँ
        </Link>
      </div>
    </div>
  );
}