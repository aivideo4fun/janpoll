import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

type Props = {
  params: Promise<{ district: string; samiti: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { samiti } = await params;
  const decodedSamiti = decodeURIComponent(samiti);
  return {
    title: `${decodedSamiti} पंचायत समिति - ग्राम पंचायत सूची और लाइव पोल्स | JanPoll`,
    description: 'अपनी ग्राम पंचायत चुनें और सरपंच चुनाव के लिए लाइव ओपिनियन पोल देखें व वोट दें।',
  };
}

export default async function PanchayatPollingPage({ params }: Props) {
  const { district, samiti } = await params;
  const decodedSamiti = decodeURIComponent(samiti);

  let panchayatsWithPolls: any[] = [];
  try {
    const samitiRecord = await db.panchayatSamiti.findFirst({
      where: { nameEn: { equals: decodedSamiti, mode: 'insensitive' } },
      include: {
        gramPanchayats: {
          orderBy: { nameHi: 'asc' },
        },
      },
    });

    if (samitiRecord && samitiRecord.gramPanchayats) {
      const panchayats = samitiRecord.gramPanchayats;
      
      panchayatsWithPolls = await Promise.all(
        panchayats.map(async (gp) => {
          // 🛡️ सुरक्षित और एरर-फ्री डेटाबेस क्वेरी (पुराने पोल्स पूरी तरह सुरक्षित रहेंगे)
          const polls = await db.poll.findMany({
            where: {
              active: true,
              gramPanchayatName: gp.nameHi, // 👈 Strict match ताकि कोई टाइपस्किप्ट एरर न आए
            },
            include: {
              options: true, // 👈 ऑप्शंस को शामिल किया गया है ताकि .options पर एरर न आए
            },
            orderBy: { createdAt: 'desc' },
          });

          return {
            ...gp,
            polls,
          };
        })
      );
    }
  } catch (error) {
    console.error('Error fetching panchayats and polls:', error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link
          href={`/rajasthan/${district}/sarpanch`}
          className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition"
        >
          ← पंचायत समिति सूची पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          पंचायत समिति: {decodedSamiti.toUpperCase()}
        </span>
        <h1 className="text-2xl md:text-3xl font-black mt-3 mb-2">
          अपनी ग्राम पंचायत चुनें और लाइव पोल्स देखें
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          यहाँ आपकी पंचायत के सभी सक्रिय ओपिनियन पोल और सरपंच उम्मीदवारों के रुझान दिखाई देंगे।
        </p>
      </div>

      {panchayatsWithPolls.length === 0 ? (
        <div className="bg-white border border-emerald-100 p-8 rounded-2xl text-center shadow-sm">
          <p className="text-gray-600 text-sm mb-4">
            इस पंचायत समिति के अंतर्गत अभी ग्राम पंचायतों की सूची उपलब्ध नहीं है। आप चाहें तो नया पोल बना सकते हैं!
          </p>
          <Link
            href="/create"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow inline-block"
          >
            ＋ अपनी पंचायत के लिए पोल बनाएँ
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {panchayatsWithPolls.map((gp) => (
            <div
              key={gp.id}
              className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">{gp.nameHi}</h3>
                  <span className="text-xs text-gray-400 font-medium">{gp.nameEn} ग्राम पंचायत</span>
                </div>
                <Link
                  href={`/create?gp=${encodeURIComponent(gp.nameHi)}&samiti=${encodeURIComponent(decodedSamiti)}`}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs py-2 px-4 rounded-xl border border-emerald-200 transition"
                >
                  ＋ इस पंचायत में पोल बनाएँ
                </Link>
              </div>

              {gp.polls.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    इस ग्राम पंचायत में अभी तक कोई पोल नहीं बनाया गया है। सबसे पहला पोल आप शुरू करें!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gp.polls.map((poll: any) => {
                    const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;
                    const pollTotalVotes = poll.options.reduce(
                      (sum: number, opt: any) => sum + opt.voteCount,
                      0
                    );

                    return (
                      <div
                        key={poll.id}
                        className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            🗳 कुल वोट: {pollTotalVotes.toLocaleString('en-IN')}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900 leading-snug">
                            {poll.question}
                          </h4>
                        </div>
                        <Link
                          href={pollUrl}
                          className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-sm"
                        >
                          वोट दें और परिणाम देखें →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}