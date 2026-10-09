import Link from 'next/link';

export const metadata = {
  title: 'अक्सर पूछे जाने वाले प्रश्न (FAQ) — JanPoll',
  description: 'JanPoll मंच से जुड़े आपके आम सवालों के जवाब।',
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl bg-white rounded-3xl shadow-sm border border-emerald-100 p-6 sm:p-10 space-y-8">
        
        <div className="border-b border-emerald-100 pb-6">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            सहायता केंद्र
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-3">
            अक्सर पूछे जाने वाले प्रश्न (FAQ)
          </h1>
          <p className="text-xs text-gray-500 mt-1">आपके सामान्य प्रश्नों के स्पष्ट उत्तर</p>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-1">
              <h3 className="font-bold text-emerald-950">Q1. क्या JanPoll पर वोट देना पूरी तरह से मुफ्त है?</h3>
              <p className="text-xs text-gray-600">हाँ, JanPoll पर किसी भी पोल में भाग लेना और मतदान करना 100% निःशुल्क है।</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-1">
              <h3 className="font-bold text-emerald-950">Q2. क्या मेरा वोट गुप्त रहता है?</h3>
              <p className="text-xs text-gray-600">बिल्कुल। आपकी व्यक्तिगत पहचान गुप्त रखी जाती है और डेटा पूरी तरह से सुरक्षित रहता है।</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-1">
              <h3 className="font-bold text-emerald-950">Q3. क्या यह कोई सरकारी आधिकारिक मतदान प्रणाली है?</h3>
              <p className="text-xs text-gray-600">नहीं, यह केवल जनता की राय जानने का एक स्वतंत्र डिजिटल जनमत मंच है। इसे सरकारी चुनाव परिणाम न समझा जाए।</p>
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