import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SmartBackLink from '@/components/SmartBackLink';

interface ZilaWardPageProps {
  params: Promise<{
    districtSlug: string;
    wardId: string;
  }>;
}

export default async function ZilaWardPollsPage({ params }: ZilaWardPageProps) {
  const { districtSlug, wardId } = await params;

  // 1. Database se Zila Ward aur District ki jankari fetch karein
  const ward = await db.zilaParishadWard.findUnique({
    where: { id: wardId },
    include: {
      district: true,
      polls: {
        where: { active: true },
        include: { options: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Agar ward na mile toh 404 dikhayein
  if (!ward) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="space-y-6">
        
        {/* Back Navigation */}
        <div className="flex justify-between items-center">
          <SmartBackLink fallbackHref={`/rajasthan/${districtSlug}/zila-parishad`} className="text-xs text-amber-700 font-bold underline">
            &larr; जिला परिषद वॉर्ड सूची पर वापस जाएं
          </SmartBackLink>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            📍 {ward.district.nameHi} &rsaquo; वॉर्ड संख्या {ward.wardNo}
          </span>
        </div>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-800 to-orange-700 text-white rounded-3xl p-6 md:p-8 shadow-md">
          <h1 className="text-xl md:text-2xl font-black mb-1">
            🟠 जिला परिषद वॉर्ड: {ward.nameHi} (वॉर्ड {ward.wardNo})
          </h1>
          <p className="text-amber-100 text-xs md:text-sm">
            {ward.district.nameHi} जिले के इस वॉर्ड के अंतर्गत चल रहे लाइव पोल्स और जनता का रुझान।
          </p>
        </div>

        {/* Polls List */}
        {ward.polls.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-amber-100 text-center shadow-sm space-y-4">
            <p className="text-sm text-gray-600">
              इस वॉर्ड में अभी कोई सक्रिय पोल उपलब्ध नहीं है।
            </p>
            <Link
              href={`/create/rajasthan?district=${encodeURIComponent(ward.district.nameEn)}&districtId=${ward.districtId}&zilaWardId=${ward.id}&wardNo=${ward.wardNo}&category=zila-parishad`}
              className="inline-block bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow"
            >
              ＋ इस वॉर्ड का पहला पोल बनाएँ →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">सक्रिय पोल्स:</h3>
            {ward.polls.map((poll) => {
              const totalVotes = poll.options.reduce((s, o) => s + (o.voteCount || 0), 0);
              
              // Short link format jo seedha poll detail page par le jayega
              const pollUrl = `/poll/${poll.id}`;

              return (
                <div
                  key={poll.id}
                  className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      🗳 कुल वोट: {totalVotes.toLocaleString('en-IN')}
                    </span>
                    <h4 className="text-base font-bold text-gray-900 leading-snug">
                      {poll.question}
                    </h4>
                  </div>
                  <Link
                    href={pollUrl}
                    className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-sm"
                  >
                    वोट दें और परिणाम देखें →
                  </Link>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
export async function generateMetadata({params}:ZilaWardPageProps) { const {districtSlug,wardId}=await params;return {title:'जिला परिषद वार्ड के polls | JanPoll India',description:'जिला परिषद वार्ड में बनाए गए जनमत polls देखें।',keywords:['JanPoll Rajasthan','जिला परिषद वार्ड poll'],alternates:{canonical:'/zila/'+encodeURIComponent(districtSlug)+'/'+encodeURIComponent(wardId)}}; }
