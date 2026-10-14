import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { normalizeName, safeDecode } from '@/lib/location';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ district: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const decodedDistrict = safeDecode(district);
  return {
    title: `${decodedDistrict.toUpperCase()} पंचायत समिति (मंडल) सदस्य चुनाव और लाइव पोल्स | JanPoll`,
    description: 'अपनी पंचायत समिति चुनें, मंडल सदस्य चुनाव के लाइव ओपिनियन पोल देखें व नए पोल बनाएं।',
  };
}

export default async function MandalIndexPage({ params }: Props) {
  const { district } = await params;
  const decodedDistrict = safeDecode(district);

  let mandalsWithPolls: any[] = [];
  let districtNameHi = decodedDistrict;

  try {
    const districtRecord = await db.district.findFirst({
      where: { nameEn: { equals: decodedDistrict, mode: 'insensitive' } },
      include: { 
        panchayatSamitis: { 
          orderBy: { nameHi: 'asc' } 
        } 
      },
    });

    if (districtRecord) {
      districtNameHi = districtRecord.nameHi;
      const mandals = districtRecord.panchayatSamitis;

      // सभी सक्रिय पोल्स फेच करना
      const polls = (await db.poll.findMany({
        where: { active: true },
        include: { options: true },
        orderBy: { createdAt: 'desc' },
      })) as any[];

      mandalsWithPolls = mandals.map((mandal) => {
        const matchedPolls = polls.filter((p) => {
          if (p.panchayatSamitiId && Number(p.panchayatSamitiId) === Number(mandal.id)) return true;
          if (!p.panchayatSamitiName) return false;
          const dbName = normalizeName(p.panchayatSamitiName);
          const hiName = normalizeName(mandal.nameHi);
          const enName = normalizeName(mandal.nameEn);
          return dbName === hiName || dbName === enName || dbName.includes(hiName) || hiName.includes(dbName);
        });
        return { ...mandal, polls: matchedPolls };
      });
    }
  } catch (error) {
    console.error('Error fetching mandals with polls:', error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href={`/rajasthan/${district}`} className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition">
          ← जिला श्रेणियों पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-blue-800 to-indigo-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          🔵 पंचायत समिति (मंडल सदस्य) चुनाव - {districtNameHi}
        </h1>
        <p className="text-blue-100 text-xs md:text-sm">
          अपनी पंचायत समिति चुनें, लाइव पोल्स पर वोट दें या अधिकतम 5 पोल बनाएँ।
        </p>
      </div>

      {mandalsWithPolls.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
          इस जिले में अभी मंडल समितियों का डेटा उपलब्ध नहीं है।
        </div>
      ) : (
        <div className="space-y-6">
          {mandalsWithPolls.map((mandal) => {
            const pollCount = mandal.polls ? mandal.polls.length : 0;
            const hasReachedLimit = pollCount >= 5;

            return (
              <div key={mandal.id} className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">{mandal.nameHi}</h3>
                    <span className="text-xs text-gray-400 font-medium">{mandal.nameEn} Panchayat Samiti</span>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                    {pollCount}/5 पोल चालू
                  </span>
                </div>

                {pollCount > 0 && (
                  <div className="space-y-3">
                    {mandal.polls.map((poll: any) => {
                      const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;
                      const totalVotes = poll.options ? poll.options.reduce((s: number, o: any) => s + (o.voteCount || 0), 0) : 0;

                      return (
                        <div key={poll.id} className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              🗳 कुल वोट: {totalVotes.toLocaleString('en-IN')}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 leading-snug">{poll.question}</h4>
                          </div>
                          <Link href={pollUrl} className="shrink-0 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-sm">
                            वोट दें और परिणाम देखें →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">
                    {hasReachedLimit ? '⚠️ इस मंडल में अधिकतम 5 पोल की सीमा पूरी हो चुकी है।' : 'नया पोल जोड़ सकते हैं।'}
                  </span>

                  {!hasReachedLimit && (
                    <Link 
                      href={`/create?samitiId=${mandal.id}&samiti=${encodeURIComponent(mandal.nameHi)}&district=${encodeURIComponent(districtNameHi)}&category=mandal`} 
                      className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow inline-block"
                    >
                      ＋ नया पोल बनाएँ →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}