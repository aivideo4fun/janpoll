import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { safeDecode } from '@/lib/location';

type Props = {
  params: Promise<{ district: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const decodedDistrict = safeDecode(district);
  return {
    title: `${decodedDistrict.toUpperCase()} - पंचायत समिति (मंडल) सदस्य चुनाव | JanPoll`,
    description: 'अपनी पंचायत समिति चुनें और मंडल सदस्य चुनाव के लिए लाइव ओपिनियन पोल देखें।',
  };
}

export default async function MandalIndexPage({ params }: Props) {
  const { district } = await params;
  const decodedDistrict = safeDecode(district);

  let mandals: any[] = [];
  let districtNameHi = decodedDistrict;

  try {
    const districtRecord = await db.district.findFirst({
      where: { nameEn: { equals: decodedDistrict, mode: 'insensitive' } },
      include: { 
        panchayatSamitis: { 
          include: { gramPanchayats: true },
          orderBy: { nameHi: 'asc' } 
        } 
      },
    });

    if (districtRecord) {
      districtNameHi = districtRecord.nameHi;
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
          🔵 पंचायत समिति (मंडल सदस्य) चुनाव - {districtNameHi}
        </h1>
        <p className="text-blue-100 text-xs md:text-sm">
          अपनी पंचायत समिति/मंडल का चयन करें और वार्डवार लाइव पोल्स देखें व वोट दें।
        </p>
      </div>

      {mandals.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
          इस जिले में अभी मंडल समितियों का डेटा उपलब्ध नहीं है।
        </div>
      ) : (
        <div className="space-y-4">
          {mandals.map((mandal) => (
            <div key={mandal.id} className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-blue-900">{mandal.nameHi}</h3>
                <span className="text-xs text-gray-400 font-medium">{mandal.nameEn} Panchayat Samiti</span>
              </div>
              <Link 
                href={`/rajasthan/${district}/mandal/${encodeURIComponent(mandal.nameEn)}`} 
                className="text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2.5 rounded-xl transition shadow"
              >
                मंडल और वार्ड पोल्स देखें →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}