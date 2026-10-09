import Link from 'next/link';

export const metadata = {
  title: 'यह कैसे काम करता है? — JanPoll राजस्थान',
  description: 'JanPoll पर पोल बनाने और मतदान करने की पूरी प्रक्रिया जानें।',
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl bg-white rounded-3xl shadow-sm border border-emerald-100 p-6 sm:p-10 space-y-8">
        
        <div className="border-b border-emerald-100 pb-6">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            प्रक्रिया गाइड
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-3">
            यह कैसे काम करता है?
          </h1>
          <p className="text-xs text-gray-500 mt-1">JanPoll पर मतदान और पोल बनाने की सरल प्रक्रिया</p>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-2">
              <span className="text-2xl">🗳️</span>
              <h3 className="font-bold text-emerald-900 text-base">1. राय दें (Vote)</h3>
              <p className="text-xs text-gray-600">होम पेज या जिला पेज पर जाएं, अपने पसंद के पोल पर क्लिक करें और बिना किसी झंझट के तुरंत अपना मत दर्ज करें।</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-2">
              <span className="text-2xl">📊</span>
              <h3 className="font-bold text-emerald-900 text-base">2. लाइव परिणाम देखें</h3>
            <p className="text-xs text-gray-600">वोट करने के तुरंत बाद आपको ग्राफिकल और प्रतिशत के रूप में वास्तविक लाइव परिणाम देखने को मिलते हैं।</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-2">
              <span className="text-2xl">➕</span>
              <h3 className="font-bold text-emerald-900 text-base">3. नया पोल बनाएं</h3>
              <p className="text-xs text-gray-600">आप अपने क्षेत्र के मुद्दों पर खुद का नया पोल तैयार कर सकते हैं और उसे राजस्थान के लोगों के साथ शेयर कर सकते हैं।</p>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-100 pt-6 text-center">
          <Link href="/" className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow">
            ← होम पेज पर वापस जाएं
          </Link>
        </div>

      </div>
    </main>
  );
}