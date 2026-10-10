import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'समाप्त हो चुके पोल्स (Closed Polls History) - JanPoll',
  description: 'राजस्थान के पुराने और समाप्त हो चुके ओपिनियन पोल्स के परिणाम और इतिहास देखें।',
};

type ClosedPoll = {
  id: string;
  slug: string | null;
  question: string;
  createdAt: Date;
  deadlineDays: number | null;
  options: { id: string; text: string; voteCount: number }[];
  active: boolean;
};

export default async function ClosedPollsPage() {
  let closedPolls: ClosedPoll[] = [];
  let dbError = false;

  try {
    // Database se sabhi polls layein (chahe active ho ya inactive, taaki expiry check ho sake)
    const allPolls = await db.poll.findMany({
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
    });

    // Jo polls ab band ya expired ho chuke hain ya active: false hain unhe filter karein
    closedPolls = allPolls.filter((poll) => !poll.active || !isPollOpen(poll));
  } catch (error) {
    console.error('Error fetching closed polls:', error);
    dbError = true;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition"
        >
          ← होमपेज पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          📁 समाप्त हो चुके पोल्स (Closed Polls History)
        </h1>
        <p className="text-slate-200 text-xs md:text-sm">
          यहाँ आप वे सभी पोल देख सकते हैं जिनकी समय सीमा समाप्त हो चुकी है और उनके अंतिम परिणाम सुरक्षित हैं।
        </p>
      </div>

      {dbError ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
          डेटाबेस से कनेक्ट नहीं हो पाया। कृपया थोड़ी देर बाद प्रयास करें।
        </div>
      ) : closedPolls.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-gray-500 shadow-sm">
          <span className="text-4xl mb-3 block">📭</span>
          फिलहाल कोई भी पोल समाप्त नहीं हुआ है, सभी सक्रिय पोल्स लाइव चल रहे हैं।
          <div className="mt-4">
            <Link href="/" className="text-emerald-700 font-bold underline hover:text-emerald-800">
              होमपेज पर जाकर सक्रिय पोल्स देखें
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {closedPolls.map((poll) => {
            const pollTotalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
            const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;

            return (
              <div
                key={poll.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm opacity-95 hover:opacity-100 transition"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500 mb-3">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold border border-slate-200">
                    🔒 पोल समाप्त (कुल वोट: {pollTotalVotes.toLocaleString('en-IN')})
                  </span>
                  <span>बनाए जाने की तिथि: {new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4">{poll.question}</h3>

                <div className="space-y-2 mb-5">
                  {poll.options.map((opt) => {
                    const percentage = pollTotalVotes > 0 ? Math.round((opt.voteCount / pollTotalVotes) * 100) : 0;
                    return (
                      <div
                        key={opt.id}
                        className="text-sm font-medium text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-200 relative overflow-hidden"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-slate-200/60 -z-0 transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <div className="relative z-10 flex justify-between items-center">
                          <span>{opt.text}</span>
                          <span className="font-bold text-xs text-slate-600">
                            {opt.voteCount} वोट ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <Link
                    href={pollUrl}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow"
                  >
                    अतिम परिणाम देखें →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}