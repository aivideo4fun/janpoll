import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'राजस्थान जिला चयन - JanPoll',
  description: 'अपने जिले का चयन करें और अपनी ग्राम पंचायत, पंचायत समिति या जिला परिषद के चुनाव पोल देखें।',
};

export default async function RajasthanStatePage() {
  let districts: { id: string; nameEn: string; nameHi: string }[] = [];

  try {
    districts = await db.district.findMany({
      orderBy: { nameHi: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition">
          ← होमपेज पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          📍 राजस्थान जिला चयन (District Selection)
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          अपनी स्थानीय पंचायत और निकाय चुनावों के रुझान देखने के लिए अपने जिले का चयन करें।
        </p>
      </div>

      {districts.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
          डेटाबेस में अभी जिलों की सूची लोड नहीं की गई है। कृपया थोड़ी देर बाद प्रयास करें।
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {districts.map((district) => (
            <Link
              key={district.id}
              href={`/rajasthan/${district.nameEn.toLowerCase()}`}
              className="bg-white hover:bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow transition flex items-center justify-between group"
            >
              <div>
                <h3 className="text-base font-bold text-emerald-900 group-hover:text-emerald-700">
                  {district.nameHi}
                </h3>
                <span className="text-xs text-gray-400 font-medium">{district.nameEn}</span>
              </div>
              <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-xl group-hover:bg-emerald-700 group-hover:text-white transition">
                चुनें →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}