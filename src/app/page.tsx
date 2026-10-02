import Link from 'next/link';

import { db } from '@/lib/db';
import { getDeadline, isPollOpen } from '@/lib/poll-utils';

export const dynamic = 'force-dynamic';

type HomePoll = {
  id: string;
  slug: string | null;
  question: string;
  createdAt: Date;
  deadlineDays: number | null;
  options: { id: string; text: string; voteCount: number }[];
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
        orderBy: { createdAt: 'desc' },
      }),
      db.pollOption.aggregate({ _sum: { voteCount: true } }),
    ]);

    // सिर्फ़ वही पोल जो अभी चल रहे हैं (समय सीमा खत्म नहीं हुई)
    polls = allPolls.filter(isPollOpen);
    totalVotesCount = voteSum._sum.voteCount ?? 0;
  } catch (error) {
    console.error('Error fetching home polls:', error);
    dbError = true;
  }

  const runningPollsCount = polls.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 md:p-10 mb-8 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
          राजस्थान की जनता की राय, एक जगह
        </span>
        <h1 className="text-3xl md:text-4xl font-black mt-3 mb-2 tracking-tight">
          आपकी राय, जनता की आवाज़।
        </h1>
        <p className="text-emerald-100 text-sm md:text-base max-w-lg mx-auto mb-6">
          राजस्थान के मुद्दों और स्थानीय विषयों पर अपनी राय दें और देखें कि जनता क्या सोचती है।
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
            ताज़ा पोल देखें ↓
          </a>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">
            {runningPollsCount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 font-medium mt-1">🗳️ चल रहे पोल</div>
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

      {/* Categories */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          📂 पोल की श्रेणियाँ
        </h3>
        <div className="flex flex-wrap gap-2">
          {['स्थानीय मुद्दे', 'ग्राम पंचायत', 'शहर', 'राजस्थान', 'शिक्षा', 'युवा', 'अन्य'].map((cat) => (
            <span
              key={cat}
              className="bg-white border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Article */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-emerald-100 shadow-sm mb-10 space-y-4">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wide">
          जनता की आवाज़ • विशेष लेख
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-emerald-900 leading-snug">
          सवाल पूछना जनता का काम है, और अपनी राय रखना हर नागरिक का अधिकार!
        </h2>
        <div className="text-sm text-gray-600 leading-relaxed space-y-3">
          <p>
            लोकतंत्र की असल खूबसूरती इस बात में है कि शासन व्यवस्था में हर व्यक्ति की आवाज़ सुनी जाए। एक स्वस्थ समाज के निर्माण के लिए यह जरूरी है कि स्थानीय मुद्दों, विकास कार्यों, शिक्षा, स्वास्थ्य और युवाओं से जुड़े विषयों पर खुलकर चर्चा हो।
          </p>
          <p>
            <strong>JanPoll</strong> इसी सोच के साथ राजस्थान के हर कोने तक जनता की राय पहुँचाने का एक निष्पक्ष डिजिटल मंच है। आपका एक वोट और आपका एक सवाल व्यवस्था को बेहतर बनाने में अहम भूमिका निभा सकता है।
          </p>
        </div>
      </div>

      {/* Recent Polls */}
      <div id="recent-polls" className="mb-10">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          🔥 ताज़ा पोल्स
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
              
              // सुरक्षित लिंक: अगर slug है तो SEO URL, वरना पुरानी ID लिंक
              const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;

              return (
                <div
                  key={poll.id}
                  className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                      🗳️ कुल वोट: {pollTotalVotes.toLocaleString('en-IN')}
                    </span>
                    <span className="flex items-center gap-3">
                      <span>⏳ {daysLeft(poll)} दिन बचे</span>
                      <span>{new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-emerald-900 mb-4">{poll.question}</h3>

                  {/* Home page par sirf options dikhenge, kisko kitne votes mile woh nahi */}
                  <div className="space-y-2 mb-5">
                    {poll.options.map((opt) => (
                      <div
                        key={opt.id}
                        className="text-sm font-medium text-gray-700 bg-emerald-50/20 p-3 rounded-xl border border-emerald-100 flex items-center justify-between"
                      >
                        <span>{opt.text}</span>
                        <span className="text-xs text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-1 rounded-lg">
                          चुनें →
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={pollUrl}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow"
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
    </div>
  );
}