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
          // 🔍 डेटाबेस से जांच करें कि क्या इस ग्राम पंचायत का कोई पोल पहले से बना है या नहीं
          const polls = await db.poll.findMany({
            where: {
              active: true,
              gramPanchayatName: gp.nameHi,
            },
            include: {
              options: true,
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
          ग्राम पंचायत वार लाइव पोल्स
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          यहाँ देखें कि आपकी ग्राम पंचायत में कौन सा ओपिनियन पोल चल रहा है।
        </p>
      </div>

      {panchayatsWithPolls.length === 0 ? (
        <div className="bg-white border border-emerald-100 p-8 rounded-2xl text-center shadow-sm">
          <p className="text-gray-600 text-sm mb-4">
            इस पंचायत समिति के अंतर्गत अभी ग्राम पंचायतों की सूची उपलब्ध नहीं है।
          </p>
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
              </div>

              {/* 🛑 यदि इस पंचायत में कोई पोल नहीं बना है, तो नया पोल बनाने का ऑप्शन दें */}
              {gp.polls.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  تحقیق: इस ग्राम पंचायत में अभी तक कोई पोल नहीं बनाया गया है।
                  <Link
                    href={`/create?gp=${encodeURIComponent(gp.nameHi)}&samiti=${encodeURIComponent(decodedSamiti)}&district=${encodeURIComponent(district)}`}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow"
                  >
                    ＋ इस पंचायत के लिए पोल बनाएँ →
                  </Link>
                </div>
              ) : (
                /* ✅ यदि पोल बना हुआ है, तो सीधा पोल दिखाएं ताकि रीडायरेक्ट न होना पड़े */
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
                        className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
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