import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

type Props = {
  params: Promise<{ district: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  return {
    title: `${district.toUpperCase()} - पंचायत समिति सूची और सरपंच पोल | JanPoll`,
    description: `राजस्थान के ${district} जिले में अपनी पंचायत समिति चुनें और सरपंच चुनाव के लाइव ओपिनियन पोल देखें।`,
  };
}

export default async function DistrictSarpanchPage({ params }: Props) {
  const { district } = await params;

  let districtData = null;
  try {
    districtData = await db.district.findFirst({
      where: { nameEn: { equals: district, mode: 'insensitive' } },
      include: {
        tehsils: {
          include: {
            panchayatSamitis: {
              orderBy: { nameHi: 'asc' },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error('जिला पदानुक्रम प्राप्त करने में त्रुटि:', error);
  }

  const displayNameHi = districtData ? districtData.nameHi : district;
  
  // सभी तहसीलों की पंचायत समितियों को एक सूची में एकत्र करना ताकि UI साफ और व्यवस्थित दिखे
  const allSamitis = districtData?.tehsils
    ? districtData.tehsils.flatMap((t) => t.panchayatSamitis)
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link
          href={`/rajasthan/${district}`}
          className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition"
        >
          ← जिला मेनू पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          जिला: {displayNameHi} &bull; सरपंच चुनाव
        </span>
        <h1 className="text-2xl md:text-3xl font-black mt-3 mb-2">
          पंचायत समिति चुनें
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          अपनी संबंधित पंचायत समिति का चयन करें और उसके अंतर्गत आने वाली ग्राम पंचायतों के लाइव पोल देखें।
        </p>
      </div>

      {allSamitis.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
          इस जिले के लिए अभी पंचायत समिति का डेटा उपलब्ध नहीं है। आप चाहें तो अपना नया पोल बना सकते हैं!
          <div className="mt-4">
            <Link href="/create" className="bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs inline-block">
              ＋ नया पोल बनाएँ
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allSamitis.map((samiti) => (
            <div
              key={samiti.id}
              className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                  पंचायत समिति
                </span>
                <h3 className="text-lg font-bold text-emerald-900 mt-2">{samiti.nameHi}</h3>
                <p className="text-xs text-gray-400">{samiti.nameEn}</p>
              </div>

              <div className="mt-5">
                <Link
                  href={`/rajasthan/${district}/sarpanch/${encodeURIComponent(samiti.nameEn)}`}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl text-center transition block w-full shadow-sm"
                >
                  ग्राम पंचायत सूची देखें →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}