import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

type Props = {
  params: Promise<{ district: string; samiti: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { samiti } = await params;
  return {
    title: `${samiti} पंचायत समिति - ग्राम पंचायत लिस्ट | JanPoll`,
    description: 'अपनी ग्राम पंचायत चुनें और सरपंच चुनाव के लिए लाइव ओपिनियन पोल में हिस्सा लें।',
  };
}

export default async function PanchayatPollingPage({ params }: Props) {
  const { district, samiti } = await params;

  let panchayats: { id: string; nameEn: string; nameHi: string }[] = [];
  try {
    const samitiRecord = await db.pachayatSamiti ?? await db.panchayatSamiti.findFirst({
      where: { nameEn: { equals: samiti, mode: 'insensitive' } },
      include: { gramPanchayats: { orderBy: { nameHi: 'asc' } } },
    });
    if (samitiRecord) {
      panchayats = samitiRecord.gramPanchayats;
    }
  } catch (error) {
    console.error('Error fetching panchayats:', error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href={`/rajasthan/${district}/sarpanch`} className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition">
          ← पंचायत समिति सूची पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          समिति: {samiti.toUpperCase()}
        </span>
        <h1 className="text-2xl md:text-3xl font-black mt-3 mb-2">
          अपनी ग्राम पंचायत चुनें (सरपंच चुनाव)
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          गाँव के लोग अपनी पंचायत चुनकर यहाँ अपने उम्मीदवारों के नाम जोड़ सकते हैं और लाइव वोटिंग शुरू कर सकते हैं।
        </p>
      </div>

      {panchayats.length === 0 ? (
        <div className="bg-white border border-emerald-100 p-8 rounded-2xl text-center shadow-sm">
          <p className="text-gray-600 text-sm mb-4">
            इस पंचायत समिति के अंतर्गत अभी ग्राम पंचायतों की सूची डेटाबेस में नहीं जुड़ी है। आप चाहें तो सीधे अपनी पंचायत का नया पोल बना सकते हैं!
          </p>
          <Link href="/create" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow inline-block">
            ＋ अपनी पंचायत के लिए पोल बनाएँ
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {panchayats.map((gp) => (
            <div key={gp.id} className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-emerald-900 mb-1">{gp.nameHi}</h3>
                <span className="text-xs text-gray-400 font-medium">{gp.nameEn} GP</span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md">
                  सरपंच पोल सक्रिय
                </span>
                <Link href={`/create?gp=${gp.id}`} className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-xl transition">
                  वोट दें →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}