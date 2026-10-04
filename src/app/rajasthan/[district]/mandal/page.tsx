import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

type Props = {
  params: Promise<{ district: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  return {
    title: `${district.toUpperCase()} - पंचायत समिति (मंडल) सदस्य चुनाव | JanPoll`,
    description: 'पंचायत समिति सदस्य चुनाव के लिए मंडल और वार्डवार पोल देखें।',
  };
}

export default async function MandalIndexPage({ params }: Props) {
  const { district } = await params;

  let mandals: { id: string; nameEn: string; nameHi: string }[] = [];
  try {
    const districtRecord = await db.district.findFirst({
      where: { nameEn: { equals: district, mode: 'insensitive' } },
      include: { panchayatSamitis: { orderBy: { nameHi: 'asc' } } },
    });
    if (districtRecord) {
      mandals = districtRecord.panchayatSamitis;
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

      <div className="bg-gradient-to-r from-blue-800 to-indigo-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          🔵 पंचायत समिति (मंडल सदस्य) चुनाव - {district.toUpperCase()}
        </h1>
        <p className="text-blue-100 text-xs md:text-sm">
          अपनी पंचायत समिति/मंडल का चयन करें और मंडल सदस्य के लिए चल रहे ओपिनियन पोल देखें।
        </p>
      </div>

      {mandals.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
          इस जिले में अभी मंडल समितियों का डेटा उपलब्ध नहीं है।
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mandals.map((mandal) => (
            <div key={mandal.id} className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-blue-900 mb-1">{mandal.nameHi}</h3>
                <span className="text-xs text-gray-400 font-medium">{mandal.nameEn} Mandal</span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded-md">
                  मंडल पोल
                </span>
                <Link href={`/create?mandal=${mandal.id}`} className="text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-xl transition">
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