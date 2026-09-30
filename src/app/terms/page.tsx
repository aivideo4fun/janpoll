import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href="/" className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm flex items-center gap-1">
          &larr; होम पेज पर वापस जाएं
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 md:p-10 space-y-6">
        <h1 className="text-2xl md:text-3xl font-black text-emerald-900 border-b border-emerald-100 pb-4">
          नियम और शर्ते (Terms & Conditions)
        </h1>
        
        <p className="text-sm text-gray-600 leading-relaxed">
          JanPoll वेबसाइट पर आपका स्वागत है। इस वेबसाइट का उपयोग करके, आप निम्नलिखित नियमों और शर्तों से बंधे होने the सहमति देते हैं। कृपया इन्हें ध्यान से पढ़ें।
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">1. मंच का उद्देश्य</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            JanPoll राजस्थान के नागरिकों के लिए एक स्वतंत्र सार्वजनिक राय (Public Opinion) प्लेटफॉर्म है। यह किसी भी सरकारी निकाय, राजनीतिक दल या आधिकारिक चुनावी आयोग से संबंधित नहीं है।
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">2. उपयोगकर्ता आचरण</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            पोल बनाते समय या उसमें भाग लेते समय किसी भी प्रकार की आपत्तिजनक, भड़काऊ, असामाजिक या भ्रामक सामग्री का उपयोग न करें। एडमिनिस्ट्रेटर के पास ऐसे किसी भी पोल को हटाने का अधिकार सुरक्षित है।
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">3. वोटिंग नियम</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            निष्पक्षता बनाए रखने के लिए प्रत्येक उपयोगकर्ता प्रत्येक पोल पर केवल एक बार ही वोट कर सकता है। सिस्टम द्वारा धोखाधड़ी या बॉट प्रविष्टि पाए जाने पर वोट अमान्य किए जा सकते हैं।
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">4. दायित्व की सीमा</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            JanPoll पर प्रदर्शित होने वाले पोल परिणाम केवल उपयोगकर्ताओं की तात्कालिक राय को दर्शाते हैं। इन्हें आधिकारिक या वैज्ञानिक सर्वेक्षण के रूप में नहीं माना जाना चाहिए।
          </p>
        </section>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
          अंतिम अपडेट: 2026 • JanPoll Rajasthan
        </div>
      </div>
    </div>
  );
}