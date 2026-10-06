import Link from 'next/link';
import type { Metadata } from 'next';

import { db } from '@/lib/db';
import { normalizeName, safeDecode } from '@/lib/location';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ district: string; samiti: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { samiti } = await params;
  const decodedSamiti = safeDecode(samiti);
  return {
    title: `${decodedSamiti} panchayat samiti - gram panchayat list aur live polls | JanPoll`,
    description: 'Apni gram panchayat chunein aur sarpanch chunav ke liye live opinion poll dekhein v vote dein.',
  };
}

export default async function PanchayatPollingPage({ params }: Props) {
  const { district, samiti } = await params;
  const decodedSamiti = safeDecode(samiti);
  const decodedDistrict = safeDecode(district);

  let samitiTitle = decodedSamiti;
  let districtTitle = decodedDistrict;
  let panchayatsWithPolls: any[] = [];

  try {
    const samitiRecord = await db.panchayatSamiti.findFirst({
      where: {
        AND: [
          {
            OR: [
              { nameEn: { equals: decodedSamiti, mode: 'insensitive' } },
              { nameHi: { equals: decodedSamiti } },
            ],
          },
          {
            district: {
              OR: [
                { nameEn: { equals: decodedDistrict, mode: 'insensitive' } },
                { nameHi: { equals: decodedDistrict } },
              ],
            },
          },
        ],
      },
      include: {
        district: { select: { nameHi: true, nameEn: true } },
        gramPanchayats: { orderBy: { nameHi: 'asc' } },
      },
    });

    if (samitiRecord) {
      samitiTitle = samitiRecord.nameHi;
      districtTitle = samitiRecord.district.nameHi;

      const panchayats = samitiRecord.gramPanchayats;

      // 🛡️ Bina kisi strict filter ke saare active polls nikal lo taaki koi bhi poll miss na ho
      const polls = (await db.poll.findMany({
        where: { active: true },
        include: { options: true },
        orderBy: { createdAt: 'desc' },
      })) as any[];

      const samitiNames = [samitiRecord.nameHi, samitiRecord.nameEn, decodedSamiti].map(normalizeName);
      const districtNames = [samitiRecord.district.nameHi, samitiRecord.district.nameEn, decodedDistrict].map(normalizeName);

      panchayatsWithPolls = panchayats.map((gp) => {
        const matchedPolls = polls.filter((p) => {
          if (!p.gramPanchayatName) return false;
          
          const dbGp = normalizeName(p.gramPanchayatName);
          const gpHi = normalizeName(gp.nameHi);
          const gpEn = normalizeName(gp.nameEn);

          // Gaon ka naam match hona chahiye
          const sameGp = dbGp === gpHi || dbGp === gpEn || dbGp.includes(gpHi) || gpHi.includes(dbGp);
          
          // Agar poll me samiti ya district saved hai, toh check karo ki match hota hai ya nahi (khali hone par ignore karein)
          const sameSamiti = !p.samitiName || samitiNames.includes(normalizeName(p.samitiName)) || normalizeName(p.samitiName).includes(normalizeName(samitiTitle));
          const sameDistrict = !p.districtName || districtNames.includes(normalizeName(p.districtName)) || normalizeName(p.districtName).includes(normalizeName(districtTitle));

          return sameGp && sameSamiti && sameDistrict;
        });

        return { ...gp, polls: matchedPolls };
      });
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
          ← Panchayat samiti suchi par vapas jayein
        </Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Samiti: {samitiTitle}
        </span>
        <h1 className="text-2xl md:text-3xl font-black mt-3 mb-2">
          Gram Panchayat waar live polls aur naye vikalp
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          Apni gram panchayat chunein, active polls par vote karein ya naya poll banayein.
        </p>
      </div>

      {panchayatsWithPolls.length === 0 ? (
        <div className="bg-white border border-emerald-100 p-8 rounded-2xl text-center shadow-sm">
          <p className="text-gray-600 text-sm mb-4">
            Is panchayat samiti ke antargat abhi gram panchayatein uplabdh nahi hain.
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
                  <span className="text-xs text-gray-400 font-medium">{gp.nameEn} Gram Panchayat</span>
                </div>
                {gp.polls.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {gp.polls.length} poll chalu
                  </span>
                )}
              </div>

              {gp.polls.length > 0 && (
                <div className="space-y-3">
                  {gp.polls.map((poll: any) => {
                    const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;
                    const pollTotalVotes = poll.options.reduce(
                      (sum: number, opt: any) => sum + opt.voteCount,
                      0,
                    );

                    return (
                      <div
                        key={poll.id}
                        className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            🗳 Kul vote: {pollTotalVotes.toLocaleString('en-IN')}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900 leading-snug">{poll.question}</h4>
                        </div>
                        <Link
                          href={pollUrl}
                          className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-sm"
                        >
                          Vote dein aur parinaam dekhein →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  {gp.polls.length > 0
                    ? 'Kya aapko naya ya sudhar kiya hua poll banana hai?'
                    : 'Is gram panchayat mein abhi koi poll nahi hai.'}
                </span>
                <Link
                  href={`/create?gp=${encodeURIComponent(gp.nameHi)}&samiti=${encodeURIComponent(samitiTitle)}&district=${encodeURIComponent(districtTitle)}`}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow inline-block"
                >
                  ＋ Naya poll banayein →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}