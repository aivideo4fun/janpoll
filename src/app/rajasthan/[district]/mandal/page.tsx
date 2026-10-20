import Link from 'next/link';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { normalizeName, safeDecode } from '@/lib/location';

export const dynamic = 'force-dynamic';

const MAX_POLLS = 5;

type Props = {
  params: Promise<{ district: string }>;
};

type PollWithOptions = Prisma.PollGetPayload<{ include: { options: true } }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const decodedDistrict = safeDecode(district);
  return {
    alternates: { canonical: `/rajasthan/${encodeURIComponent(district)}/mandal` },
    keywords: [district, 'Rajasthan public opinion', 'JanPoll India'],
    title: `${decodedDistrict.toUpperCase()} पंचायत समिति (मंडल) सदस्य जनमत और लाइव पोल्स | JanPoll`,
    description: 'अपनी पंचायत समिति चुनें, मंडल सदस्य जनमत के लाइव ओपिनियन पोल देखें व नए पोल बनाएं।',
  };
}

export default async function MandalIndexPage({ params }: Props) {
  const { district } = await params;
  const decodedDistrict = safeDecode(district);

  let districtNameHi = decodedDistrict;
  let districtId = '';
  let districtSlug = district;
  let mandalsWithPolls: Array<{
    id: string;
    nameHi: string;
    nameEn: string;
    polls: PollWithOptions[];
  }> = [];

  try {
    const districtRecord = await db.district.findFirst({
      where: { nameEn: { equals: decodedDistrict, mode: 'insensitive' } },
      include: { panchayatSamitis: { orderBy: { nameHi: 'asc' } } },
    });

    if (districtRecord) {
      districtNameHi = districtRecord.nameHi;
      districtId = districtRecord.id;
      // Agar district me slug field nahi hai toh nameEn ko slug bana lenge
      districtSlug = districtRecord.nameEn.toLowerCase().replace(/\s+/g, '-');
      const mandals = districtRecord.panchayatSamitis;

      const polls = await db.poll.findMany({
        where: {
          active: true,
          electionType: 'samiti',
          OR: [
            { samitiId: { in: mandals.map((m) => m.id) } },
            {
              samitiId: null,
              electionType: 'samiti',
              districtName: { in: [districtRecord.nameHi, districtRecord.nameEn] },
            },
          ],
        },
        include: { options: true },
        orderBy: { createdAt: 'desc' },
      });

      mandalsWithPolls = mandals.map((mandal) => {
        const names = [normalizeName(mandal.nameHi), normalizeName(mandal.nameEn)];
        const matchedPolls = polls.filter((p) => {
          if (p.samitiId) return p.samitiId === mandal.id;
          return !!p.samitiName && names.includes(normalizeName(p.samitiName));
        });
        return { id: mandal.id, nameHi: mandal.nameHi, nameEn: mandal.nameEn, polls: matchedPolls };
      });
    }
  } catch (error) {
    console.error('Error fetching mandals with polls:', error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link
          href={`/rajasthan/${district}`}
          className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition"
        >
          ← जिला श्रेणियों पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-blue-800 to-indigo-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          🔵 पंचायत समिति (मंडल सदस्य) जनमत - {districtNameHi}
        </h1>
        <p className="text-blue-100 text-xs md:text-sm">
          अपनी पंचायत समिति चुनें, लाइव पोल्स पर वोट दें या अधिकतम {MAX_POLLS} पोल बनाएँ।
        </p>
      </div>

      {mandalsWithPolls.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
          इस जिले में अभी मंडल समितियों का डेटा उपलब्ध नहीं है।
        </div>
      ) : (
        <div className="space-y-6">
          {mandalsWithPolls.map((mandal) => {
            const pollCount = mandal.polls.length;
            const hasReachedLimit = pollCount >= MAX_POLLS;
            const samitiSlug = mandal.nameEn.toLowerCase().replace(/\s+/g, '-');

            return (
              <div
                key={mandal.id}
                className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">{mandal.nameHi}</h3>
                    <span className="text-xs text-gray-400 font-medium">
                      {mandal.nameEn} Panchayat Samiti
                    </span>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                    {pollCount}/{MAX_POLLS} पोल चालू
                  </span>
                </div>

                {pollCount > 0 && (
                  <div className="space-y-3">
                    {mandal.polls.map((poll) => {
                      // 🟢 Short aur clean URL format (Jaise aapne manga tha)
                      const pollUrl = `/samiti/${districtSlug}/${samitiSlug}/${poll.id}`;
                      const totalVotes = poll.options.reduce((s, o) => s + (o.voteCount || 0), 0);

                      return (
                        <div
                          key={poll.id}
                          className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              🗳 कुल वोट: {totalVotes.toLocaleString('en-IN')}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 leading-snug">
                              {poll.question}
                            </h4>
                          </div>
                          <Link
                            href={pollUrl}
                            className="shrink-0 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-sm"
                          >
                            वोट दें और परिणाम देखें →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">
                    {hasReachedLimit
                      ? `⚠️ इस मंडल में अधिकतम ${MAX_POLLS} पोल की सीमा पूरी हो चुकी है।`
                      : pollCount > 0
                      ? 'मौजूदा पोल में वोट दें या नया पोल बनाएं।'
                      : 'नया पोल जोड़ सकते हैं।'}
                  </span>

                  {!hasReachedLimit && (
                    <Link
                      href={`/create?samitiId=${mandal.id}&samiti=${encodeURIComponent(
                        mandal.nameHi
                      )}&districtId=${districtId}&district=${encodeURIComponent(
                        districtNameHi
                      )}&category=mandal`}
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