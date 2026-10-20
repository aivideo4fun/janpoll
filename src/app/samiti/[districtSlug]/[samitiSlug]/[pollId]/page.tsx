import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import SmartBackLink from '@/components/SmartBackLink';

interface PageProps {
  params: Promise<{
    districtSlug: string;
    samitiSlug: string;
    pollId: string;
  }>;
}

export default async function SamitiPollDetailPage({ params }: PageProps) {
  const { pollId, districtSlug, samitiSlug } = await params;

  // Database se poll aur uske options fetch karein
  const poll = await db.poll.findUnique({
    where: { id: pollId },
    include: {
      options: true,
      district: true,
      samiti: true,
    },
  });

  // Agar poll na mile ya URL ke slugs match na karein toh 404 dikhayein
  if (!poll) {
    notFound();
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
      <div className="bg-white rounded-3xl shadow-md border border-emerald-100 p-8 md:p-10 space-y-6">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex justify-between items-center border-b border-emerald-100 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            📍 {poll.district?.nameHi || districtSlug} › {poll.samiti?.nameHi || samitiSlug}
          </span>
          <SmartBackLink fallbackHref="/" className="text-xs text-emerald-700 font-bold underline">
            &larr; वापस जाएं
          </SmartBackLink>
        </div>

        {/* Poll Question */}
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-black text-emerald-900 leading-snug">
            {poll.question}
          </h1>
          <p className="text-xs text-slate-500">
            स्थिति: {poll.active ? 'सक्रिय (Active)' : 'समाप्त'}
          </p>
        </div>

        {/* Options / Voting Area */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">विकल्प / उम्मीदवार:</h3>
          {poll.options.map((option) => (
            <div 
              key={option.id}
              className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex justify-between items-center text-sm font-medium text-gray-800 shadow-sm"
            >
              <span>{option.text}</span>
              <span className="font-mono-num font-bold text-emerald-700 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                {option.voteCount} वोट
              </span>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
export async function generateMetadata({params}:PageProps) { const {pollId}=await params; const poll=await db.poll.findUnique({where:{id:pollId},select:{question:true}});return {title:poll?poll.question+' | JanPoll India':'पोल नहीं मिला',description:'जनमत poll के विकल्प और दर्ज परिणाम देखें।',keywords:['JanPoll India','पंचायत समिति poll'],alternates:{canonical:'/poll/'+encodeURIComponent(pollId)}}; }
