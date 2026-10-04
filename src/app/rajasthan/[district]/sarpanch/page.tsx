import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

type Props = {
  params: Promise<{ district: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  return {
    title: `${district.toUpperCase()} - सरपंच चुनाव एवं ग्राम पंचायत सूची | JanPoll`,
    description: `राजस्थान के ${district} जिले में तहसील, पंचायत समिति और ग्राम पंचायत वार सरपंच चुनाव के पोल देखें।`,
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
          orderBy: { nameHi: 'asc' },
          include: {
            panchayatSamitis: {
              include: {
                gramPanchayats: {
                  orderBy: { nameHi: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sarpanch hierarchy:', error);
  }

  const displayNameHi = districtData ? districtData.nameHi : district;
  const tehsils = districtData?.tehsils || [];

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
          तहसील और ग्राम पंचायत चयन
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          तहसील &rarr; पंचायत समिति &rarr; ग्राम पंचायत चुनकर सरपंच पद के पोल देखें।
        </p>
      </div>

      {tehsils.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
          इस जिले के लिए अभी तहसील और पंचायत डेटा अपलोड नहीं किया गया है। आप चाहें तो अपना नया पोल बना सकते हैं!
          <div className="mt-4">
            <Link href="/create" className="bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs inline-block">
              ＋ नया पोल बनाएँ
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {tehsils.map((tehsil) => (
            <div key={tehsil.id} className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <h2 className="text-xl font-bold text-emerald-900 mb-4 pb-2 border-b border-emerald-50 flex items-center gap-2">
                <span>🏛️ तहसील:</span> {tehsil.nameHi} <span className="text-xs text-gray-400">({tehsil.nameEn})</span>
              </h2>

              {tehsil.panchayatSamitis.length === 0 ? (
                <p className="text-xs text-gray-500 italic">इस तहसील के अंतर्गत अभी पंचायत समितियाँ उपलब्ध नहीं हैं।</p>
              ) : (
                <div className="space-y-4">
                  {tehsil.panchayatSamitis.map((samiti) => (
                    <div key={samiti.id} className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-100">
                      <h3 className="text-base font-bold text-emerald-800 mb-2 flex items-center gap-2">
                        <span>🔵 पंचायत समिति:</span> {samiti.nameHi}
                      </h3>

                      {samiti.gramPanchayats.length === 0 ? (
                        <p className="text-xs text-gray-500 italic pl-4">ग्राम पंचायतें अभी अपडेट नहीं हैं।</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {samiti.gramPanchayats.map((gp) => (
                            <div
                              key={gp.id}
                              className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between"
                            >
                              <div>
                                <h4 className="text-sm font-bold text-gray-800">{gp.nameHi}</h4>
                                <span className="text-[10px] text-gray-400">{gp.nameEn}</span>
                              </div>
                              <Link
                                href={`/create?gp=${encodeURIComponent(gp.nameHi)}&samiti=${encodeURIComponent(samiti.nameHi)}&district=${encodeURIComponent(displayNameHi)}`}
                                className="mt-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg text-center transition block"
                              >
                                सरपंच पोल देखें / बनाएँ →
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}