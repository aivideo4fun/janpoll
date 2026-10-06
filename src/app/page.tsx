import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getDeadline, isPollOpen } from '@/lib/poll-utils';
import NativeBanner from '@/components/NativeBanner'; // 👈 नेटिव बैनर इम्पोर्ट किया

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'JanPoll Rajasthan - Rajasthan ki janta ki ray aur online poll',
  description: 'Rajasthan ke sthaniya muddo, gram panchayat, sarpanch chunav aur raajnitik vishayo par online voting karein aur janta ki ray janein.',
  keywords: ['rajasthan poll', 'sarpanch poll', 'vote poll', 'create poll', 'rajasthan public poll', 'janpoll'],
  openGraph: {
    title: 'JanPoll - Rajasthan Public Poll',
    description: 'Apne sthaniya muddo par apni ray dein aur dekhein janta kya sochti hai.',
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
  let totalRunningPollsCount = 0;
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
    totalRunningPollsCount = activePolls.length;

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 md:p-10 mb-6 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
          Rajasthan ki janta ki ray, ek jagah
        </span>
        <h1 className="text-3xl md:text-4xl font-black mt-3 mb-2 tracking-tight">
          Aapki ray, janta ki aawaz.
        </h1>
        <p className="text-emerald-100 text-sm md:text-base max-w-lg mx-auto mb-6">
          Rajasthan ke sthaniya muddo, gram panchayat aur sarpanch chunav par apni ray dein aur dekhein ki janta kya sochti hai.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/rajasthan"
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded-xl shadow transition text-base inline-block"
          >
            📍 Rajasthan Chunav / Zila Chayan →
          </Link>
          <Link
            href="/create"
            className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-6 py-2.5 rounded-xl shadow transition text-base inline-block"
          >
            ＋ Poll Banayein
          </Link>
        </div>
      </div>

      {/* 📢 Rajasthan Panchayati Raj Election 2026 Notice Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 md:p-6 mb-8 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📢</span>
          <div>
            <h2 className="text-base font-bold text-amber-900 mb-1">
              Rajasthan Panchayati Raj Aam Chunav, 2026 Vishesh Update
            </h2>
            <p className="text-xs md:text-sm text-amber-800 leading-relaxed mb-3">
              Rajya Nirvachan Aayog, Rajasthan dwara panchayatiraj sansthaon ke aam chunav kul <strong>4 charno</strong> mein ghoshit kar diye gaye hain.
            </p>
            <Link
              href="/rajasthan-election-2026"
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
            >
              👉 Chunav ka pura charanwar karyakram aur vistrit suchi yahan dekhein →
            </Link>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">
            {totalRunningPollsCount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 font-medium mt-1">🗳 Chal rahe poll</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">
            {totalVotesCount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 font-medium mt-1">👥 Kul votes</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">Rajasthan</div>
          <div className="text-xs text-gray-500 font-medium mt-1">📍 Coverage</div>
        </div>
      </div>

      {/* 📁 Closed Polls Quick Navigation Link */}
      <div className="mb-8 text-center">
        <Link
          href="/closed-polls"
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold px-5 py-2.5 rounded-xl text-xs md:text-sm transition shadow-sm"
        >
          <span>📁</span> Samapt ho chuke polls aur purana itihas dekhein →
        </Link>
      </div>

      {/* Categories */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          📂 Poll ki Shreniyan evam Star
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🟢 Sarpanch Chunav
          </Link>
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🏛️ Gram Panchayat
          </Link>
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🔵 Panchayat Samiti
          </Link>
          <Link href="/rajasthan" className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition">
            🟠 Zila Parishad
          </Link>
        </div>
      </div>

      {/* 📢 Home Page Adsterra Native Banner */}
      <NativeBanner />

      {/* Real Top 10 Trending / Active Polls */}
      <div id="recent-polls" className="mb-10">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          🔥 Sarvadhik Lokpriya Polls (Sh शीर्ष 10 Trending)
        </h2>

        {dbError ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
            Database se connect nahi ho paya. Kripya thodi der baad refresh karein.
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-emerald-100 text-gray-500 shadow-sm">
            Abhi koi poll chalu nahi hai. Sabse pehla poll aap banayein!
            <div className="mt-4">
              <Link href="/create" className="text-emerald-700 font-bold underline hover:text-emerald-800">
                Poll Banayein
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
                      🗳 Kul Votes: {pollTotalVotes.toLocaleString('en-IN')}
                    </span>
                    <span className="flex items-center gap-3">
                      <span>⏳ {daysLeft(poll)} din bache</span>
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
                      href={`https://wa.me/?text=${encodeURIComponent(`🗳️ ${poll.question}\nApni ray dein: https://janpoll.in${pollUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                    >
                      <span>💬</span> WhatsApp par bhejein
                    </a>

                    <Link
                      href={pollUrl}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow ml-auto"
                    >
                      Vote dein aur parinaam dekhein →
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
        <h2 className="text-2xl font-black mb-2">Kya aap apni panchayat ya ward ka poll banana chahte hain?</h2>
        <p className="text-emerald-100 text-xs md:text-sm max-w-md mx-auto mb-6">
          Apne gaon, sarpanch pad ya mandal sadasya ke liye turant digital opinion poll shuru karein aur janta ki ray janein.
        </p>
        <Link
          href="/create"
          className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-8 py-3 rounded-2xl shadow transition text-base inline-block"
        >
          ＋ Naya Poll Banayein
        </Link>
      </div>
    </div>
  );
}