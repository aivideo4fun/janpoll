import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

type Props = {
  params: Promise<{ district: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  return {
    title: `${district.toUpperCase()} जिला - चुनाव श्रेणियाँ | JanPoll`,
    description: `राजस्थान के ${district} जिले में सरपंच, पंचायत समिति और जिला परिषद चुनाव के लिए पोल देखें।`,
  };
}

export default async function DistrictPage({ params }: Props) {
  const { district } = await params;

  let districtData = null;
  try {
    districtData = await db.district.findFirst({
      where: { nameEn: { equals: district, mode: 'insensitive' } },
    });
  } catch (error) {
    console.error('Error fetching district:', error);
  }

  const displayNameHi = districtData ? districtData.nameHi : district;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href="/rajasthan" className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition">
          ← जिलों की सूची पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          जिला: {displayNameHi}
        </span>
        <h1 className="text-2xl md:text-3xl font-black mt-3 mb-2">
          चुनाव श्रेणी का चयन करें
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          अपने क्षेत्र के अनुसार सही चुनाव श्रेणी चुनें।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/rajasthan/${district}/sarpanch`}
          className="bg-white hover:bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100 shadow-sm transition flex flex-col justify-between group"
        >
          <div>
            <span className="text-2xl">🟢</span>
            <h3 className="text-lg font-bold text-emerald-900 mt-3 mb-1 group-hover:text-emerald-700">
              ग्राम पंचायत (सरपंच चुनाव)
            </h3>
            <p className="text-xs text-gray-500">
              अपनी पंचायत समिति और ग्राम पंचायत चुनकर सरपंच पद के पोल देखें।
            </p>
          </div>
          <div className="mt-6 text-emerald-700 font-bold text-xs bg-emerald-50 py-2 px-4 rounded-xl text-center group-hover:bg-emerald-700 group-hover:text-white transition">
            सरपंच सूची देखें →
          </div>
        </Link>

        <Link
          href={`/rajasthan/${district}/mandal`}
          className="bg-white hover:bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100 shadow-sm transition flex flex-col justify-between group"
        >
          <div>
            <span className="text-2xl">🔵</span>
            <h3 className="text-lg font-bold text-emerald-900 mt-3 mb-1 group-hover:text-emerald-700">
              पंचायत समिति (मंडल सदस्य)
            </h3>
            <p className="text-xs text-gray-500">
              पंचायत समिति सदस्यों के चुनाव के लिए जनता का रुझान जानें।
            </p>
          </div>
          <div className="mt-6 text-emerald-700 font-bold text-xs bg-emerald-50 py-2 px-4 rounded-xl text-center group-hover:bg-emerald-700 group-hover:text-white transition">
            मंडल सूची देखें →
          </div>
        </Link>

        <Link
          href={`/rajasthan/${district}/zila-parishad`}
          className="bg-white hover:bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100 shadow-sm transition flex flex-col justify-between group"
        >
          <div>
            <span className="text-2xl">🟠</span>
            <h3 className="text-lg font-bold text-emerald-900 mt-3 mb-1 group-hover:text-emerald-700">
              जिला परिषद सदस्य
            </h3>
            <p className="text-xs text-gray-500">
              जिला परिषद वार्डवार राजनीतिक दलों और उम्मीदवारों के पोल देखें।
            </p>
          </div>
          <div className="mt-6 text-emerald-700 font-bold text-xs bg-emerald-50 py-2 px-4 rounded-xl text-center group-hover:bg-emerald-700 group-hover:text-white transition">
            जिला परिषद देखें →
          </div>
        </Link>
      </div>
    </div>
  );
}