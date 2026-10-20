import Link from 'next/link';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { safeDecode } from '@/lib/location';

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
    alternates: { canonical: `/rajasthan/${encodeURIComponent(district)}/zila-parishad` },
    keywords: [district, 'Rajasthan public opinion', 'JanPoll India'],
    title: `${decodedDistrict.toUpperCase()} जिला परिषद सदस्य जनमत और लाइव पोल्स | JanPoll`,
    description: 'जिला परिषद वार्डवार उम्मीदवारों और राजनीतिक दलों के लाइव ओपिनियन पोल देखें।',
  };
}

export default async function ZilaParishadIndexPage({ params }: Props) {
  const { district } = await params;
  const decodedDistrict = safeDecode(district);

  let districtNameHi = decodedDistrict;
  let districtId = '';
  let districtSlug = district;
  let wardsWithPolls: Array<{
    id: string;
    wardNo: number;
    nameHi: string;
    polls: PollWithOptions[];
  }> = [];

  try {
    const districtRecord = await db.district.findFirst({
      where: { nameEn: { equals: decodedDistrict, mode: 'insensitive' } },
      include: { zilaWards: { orderBy: { wardNo: 'asc' } } },
    });

    if (districtRecord) {
      districtNameHi = districtRecord.nameHi;
      districtId = districtRecord.id;
      districtSlug = districtRecord.nameEn.toLowerCase().replace(/\s+/g, '-');
      const wards = districtRecord.zilaWards;

      const polls = await db.poll.findMany({
        where: { active: true, zilaWardId: { in: wards.map((w) => w.id) } },
        include: { options: true },
        orderBy: { createdAt: 'desc' },
      });

      wardsWithPolls = wards.map((ward) => ({
        id: ward.id,
        wardNo: ward.wardNo,
        nameHi: ward.nameHi,
        polls: polls.filter((p) => p.zilaWardId === ward.id),
      }));
    }
  } catch (error) {
    console.error('Error fetching zila parishad wards with polls:', error);
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

      <div className="bg-gradient-to-r from-amber-800 to-orange-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          🟠 जिला परिषद सदस्य जनमत - {districtNameHi}
        </h1>
        <p className="text-amber-100 text-xs md:text-sm">
          जिला परिषद वॉर्ड वार जनमत और जनता के रुझान यहाँ देखे जा सकते हैं।
        </p>
      </div>

      {wardsWithPolls.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-amber-100 text-center shadow-sm space-y-4">
          <p className="text-sm text-gray-600">
            {districtNameHi} जिले के जिला परिषद वॉर्डों का डेटा उपलब्ध नहीं है।
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {wardsWithPolls.map((ward) => {
            const pollCount = ward.polls.length;
            const hasReachedLimit = pollCount >= MAX_POLLS;

            return (
              <div
                key={ward.id}
                className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-amber-900">
                      वॉर्ड संख्या: {ward.wardNo} — {ward.nameHi}
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">
                      Zila Parishad Ward {ward.wardNo}
                    </span>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    {pollCount}/{MAX_POLLS} पोल चालू
                  </span>
                </div>

                {pollCount > 0 && (
                  <div className="space-y-3">
                    {ward.polls.map((poll) => {
                      // 🟢 Zila Parishad ke liye short aur clean URL
                      const pollUrl = `/zila/${districtSlug}/${ward.id}`;
                      const totalVotes = poll.options.reduce((s, o) => s + (o.voteCount || 0), 0);

                      return (
                        <div
                          key={poll.id}
                          className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              🗳 कुल वोट: {totalVotes.toLocaleString('en-IN')}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 leading-snug">
                              {poll.question}
                            </h4>
                          </div>
                          <Link
                            href={pollUrl}
                            className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-sm"
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
                      ? `⚠️ इस वॉर्ड में अधिकतम ${MAX_POLLS} पोल की सीमा पूरी हो चुकी है।`
                      : pollCount > 0
                      ? 'मौजूदा पोल में वोट दें या नया पोल बनाएं।'
                      : 'नया पोल जोड़ सकते हैं।'}
                  </span>

                  {!hasReachedLimit && (
                    <Link
                      href={`/create?district=${encodeURIComponent(
                        district
                      )}&districtId=${districtId}&zilaWardId=${ward.id}&wardNo=${
                        ward.wardNo
                      }&category=zila-parishad`}
                      className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow inline-block"
                    >
                      ＋ इस वॉर्ड का पोल बनाएँ →
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