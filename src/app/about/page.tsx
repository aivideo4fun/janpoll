import Link from 'next/link';

export const metadata = {
  title: 'JanPoll क्या है? — राजस्थान जनमत मंच',
  description: 'JanPoll.in के उद्देश्य, विजन और राजस्थान के स्वतंत्र जनमत मंच के बारे में जानें।',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl bg-white rounded-3xl shadow-sm border border-emerald-100 p-6 sm:p-10 space-y-8">
        
        <div className="border-b border-emerald-100 pb-6">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            परिचय
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-3">
            JanPoll क्या है?
          </h1>
          <p className="text-xs text-gray-500 mt-1">राजस्थान का स्वतंत्र और डिजिटल जनमत मंच</p>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-emerald-900">डिजिटल लोकतंत्र की नई पहल</h2>
            <p>
              <strong>JanPoll.in</strong> राजस्थान की जनता की वास्तविक राय, विचारों और जनमत को पारदर्शी तरीके से सामने लाने वाला एक स्वतंत्र डिजिटल प्लेटफॉर्म है। हमारा मुख्य उद्देश्य राजस्थान के हर जिले, पंचायत समिति और ग्राम पंचायत स्तर पर जनता की आवाज को डिजिटल मंच प्रदान करना है।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-emerald-900">यह मंच क्यों खास है?</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>पूर्ण पारदर्शिता:</strong> हर नागरिक अपनी पसंद के पोल पर निष्पक्ष रूप से मतदान कर सकता है और लाइव परिणाम देख सकता है।</li>
              <li><strong>स्थानीय मुद्दों पर फोकस:</strong> राज्य स्तर से लेकर ग्राम पंचायत और स्थानीय विकास के मुद्दों पर राय साझा करने की सुविधा।</li>
              <li><strong>सुरक्षित और गोपनीय:</strong> उपयोगकर्ताओं की गोपनीयता का पूरा ध्यान रखा जाता है।</li>
            </ul>
          </section>
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