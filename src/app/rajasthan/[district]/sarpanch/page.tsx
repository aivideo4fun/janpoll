import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

type Props = {
  params: Promise<{ district: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  return {
    title: `${district.toUpperCase()} - सरपंच चुनाव / पंचायत समिति सूची | JanPoll`,
    description: 'अपनी पंचायत समिति का चयन करें और ग्राम पंचायत वार सरपंच उम्मीदवारों की सूची देखें।',
  };
}

export default async function SarpanchIndexPage({ params }: Props) {
  const { district } = await params;

  let mandals: { id: string; nameEn: string; nameHi: string }[] = [];
  try {
    const districtRecord = await db.district.findFirst({
      where: { nameEn: { equals: district, mode: 'insensitive' } },
      include: { mandals: { orderBy: { nameHi: 'asc' } } },
    });
    if (districtRecord) {
      mandals = districtRecord.mandals;
    }
  } catch (error) {
    console.error('Error fetching mandals:', error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href={`/rajasthan/${district}`} className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition">
          ← जिला श्रेणियों पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          🟢 सरपंच चुनाव - पंचायत समिति चयन ({district.toUpperCase()})
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          अपनी पंचायत समिति चुनें ताकि उसके अंतर्गत आने वाली ग्राम पंचायतें दिखाई दे सकें।
        </p>
      </div>

      {mandals.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
          इस जिले के लिए अभी पंचायत समितियों का डेटा लोड नहीं किया गया है। आप चाहें तो नीचे सीधा पोल बना सकते हैं।
          <div className="mt-4">
            <Link href="/create" className="bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs inline-block">
              ＋ पोल बनाएँ
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mandals.map((mandal) => (
            <Link
              key={mandal.id}
              href={`/rajasthan/${district}/sarpanch/${mandal.nameEn.toLowerCase()}`}
              className="bg-white hover:bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow transition flex items-center justify-between group"
            >
              <div>
                <h3 className="text-base font-bold text-emerald-900 group-hover:text-emerald-700">
                  {mandal.nameHi}
                </h3>
                <span className="text-xs text-gray-400 font-medium">{mandal.nameEn} Samiti</span>
              </div>
              <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-xl group-hover:bg-emerald-700 group-hover:text-white transition">
                खोलें →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}