import Link from 'next/link';
import { db } from '@/lib/db';

export default async function Home() {
  let polls: any[] = [];
  let totalPollsCount = 0;
  let totalVotesCount = 0;
  let dbError = false;

  try {
    // 1. Database se actual polls fetch karna (Recent 10)
    polls = await db.poll.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        options: true,
        votes: true 
      },
      take: 10,
    });

    // 2. Total Polls count
    totalPollsCount = await db.poll.count();

    // 3. Total Votes count (Sabhi votes ka real-time total)
    const votesData = await db.vote.count();
    totalVotesCount = votesData;

  } catch (error) {
    console.error("Database fetch error:", error);
    dbError = true;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-gray-800">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 md:p-10 mb-8 text-center shadow-md">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
          राजस्थान की जनता की राय, एक जगह
        </span>
        <h1 className="text-3xl md:text-4xl font-black mt-3 mb-2 tracking-tight">
          आपकी राय, जनता की आवाज़।
        </h1>
        <p className="text-emerald-100 text-sm md:text-base max-w-lg mx-auto mb-6">
          राजस्थान के मुद्दों और स्थानीय विषयों पर अपनी राय दें और देखें कि जनता क्या सोचती है।
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/create"
            className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-6 py-2.5 rounded-xl shadow transition text-base inline-block"
          >
            ＋ पोल बनाएँ
          </Link>
          <a
            href="#recent-polls"
            className="bg-emerald-900/40 hover:bg-emerald-900/60 text-white font-medium px-5 py-2.5 rounded-xl transition text-base border border-emerald-500/30 inline-block"
          >
            ताज़ा पोल देखें ↓
          </a>
        </div>
      </div>

      {/* Real-time Dynamic Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">{totalPollsCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">🗳️ कुल पोल (Polls)</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">{totalVotesCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">👥 कुल वोट (Votes)</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-emerald-800">राजस्थान</div>
          <div className="text-xs text-gray-500 font-medium mt-1">📍 कवरेज (Coverage)</div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          📂 पोल की श्रेणियाँ (Categories)
        </h3>
        <div className="flex flex-wrap gap-2">
          {['स्थानीय मुद्दे', 'ग्राम पंचायत', 'शहर', 'राजस्थान', 'शिक्षा', 'युवा', 'अन्य'].map((cat, idx) => (
            <span key={idx} className="bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition shadow-xs">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Professional Hindi Blog Section */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-emerald-100 shadow-sm mb-10 space-y-4">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wide">
          जनता की आवाज़ • विशेष लेख
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-emerald-900 leading-snug">
          सवाल पूछना जनता का काम है, और अपनी राय रखना हर नागरिक का अधिकार!
        </h2>
        <div className="text-sm text-gray-600 leading-relaxed space-y-3">
          <p>
            लोकतंत्र की असल खूबसूरती इस बात में है कि शासन व्यवस्था में हर व्यक्ति की आवाज़ सुनी जाए। एक स्वस्थ समाज के निर्माण के लिए यह जरूरी है कि स्थानीय मुद्दों, विकास कार्यों, शिक्षा, स्वास्थ्य और युवाओं से जुड़े विषयों पर खुलकर चर्चा हो। सवाल पूछना केवल राजनेताओं या पत्रकारों का काम नहीं है, बल्कि यह जागरूक जनता का सबसे बड़ा अधिकार और कर्तव्य है।
          </p>
          <p>
            <strong>JanPoll</strong> इसी सोच के साथ राजस्थान के हर कोने तक जनता की राय पहुँचाने का एक निष्पक्ष डिजिटल मंच है। यहाँ गाँव की ग्राम पंचायत से लेकर पूरे प्रदेश के स्तर तक, हर नागरिक को अपने मन की बात रखने और यह जानने का मौका मिलता है कि बाकी जनता क्या सोचती है। आपका एक वोट और आपका एक सवाल व्यवस्था को बेहतर बनाने में अहम भूमिका निभा सकता है।
          </p>
        </div>

        {/* Create Poll Call-to-Action inside Blog */}
        <div className="pt-4 border-t border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-emerald-50/50 p-5 rounded-xl border border-emerald-200">
          <div>
            <h4 className="font-bold text-emerald-900 text-base">क्या आपके मन में भी कोई सवाल है?</h4>
            <p className="text-xs text-gray-600 mt-0.5">अपना खुद का पोल बनाएं और राजस्थान की जनता की राय जानें।</p>
          </div>
          <Link
            href="/create"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl shadow transition text-sm whitespace-nowrap"
          >
            ＋ अपना पोल बनाएँ (Create Poll)
          </Link>
        </div>
      </div>

      {/* Recent Polls Section (Real Data) */}
      <div id="recent-polls" className="mb-10">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          🔥 ताज़ा पोल्स (Recent Polls)
        </h2>

        {dbError ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
            डेटाबेस कनेक्ट हो रहा है... कृपया 5 सेकंड बाद पेज को रिफ्रेश (Refresh) करें।
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-emerald-100 text-gray-500 shadow-sm">
            अभी तक कोई पोल नहीं बना है। सबसे पहला पोल आप बनाएँ!
            <div className="mt-4">
              <Link href="/create" className="text-emerald-700 font-bold underline hover:text-emerald-800">
                Create Poll Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {polls.map((poll) => {
              const voteCount = poll.votes ? poll.votes.length : 0;
              return (
                <div key={poll.id} className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold mb-2">
                      <span>📍 राजस्थान</span>
                      <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        ⏳ अवधि: {poll.deadlineDays} दिन
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-gray-800 mb-3 line-clamp-2">
                      {poll.question}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                      <span>👥 {voteCount} Votes</span>
                      <span>🕐 {new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/poll/${poll.id}`}
                      className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition text-xs shadow-xs"
                    >
                      वोट दें / परिणाम देखें &rarr;
                    </Link>
                    <Link
                      href={`/poll/${poll.id}`}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs transition flex items-center justify-center font-medium"
                      title="Share Poll"
                    >
                      ↗ शेयर
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trust / How it works Section */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm mb-12">
        <h3 className="text-lg font-bold text-emerald-900 mb-4 text-center">
          ❓ JanPoll कैसे काम करता है?
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="font-bold text-emerald-800 text-base mb-1">① पोल बनाएँ</div>
            <p className="text-xs text-gray-600">कोई भी नागरिक अपना सार्वजनिक पोल और समय सीमा (Deadline) सेट कर सकता है।</p>
          </div>
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="font-bold text-emerald-800 text-base mb-1">② जनता वोट करे</div>
            <p className="text-xs text-gray-600">दिए गए विकल्पों में से सुरक्षित और आसान तरीके से अपनी पसंद चुनें।</p>
          </div>
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="font-bold text-emerald-800 text-base mb-1">③ परिणाम देखें</div>
            <p className="text-xs text-gray-600">वोट सबमिट करने के तुरंत बाद लाइव परिणाम और आंकड़े देखें।</p>
          </div>
        </div>
      </div>

    </div>
  );
}