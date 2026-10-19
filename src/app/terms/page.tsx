import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'नियम और शर्तें (Terms & Conditions) | JanPoll',
  description: 'JanPoll प्लेटफॉर्म के उपयोग से संबंधित नियम, शर्तें और नीतियां पढ़ें।',
};
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
          JanPoll वेबसाइट पर आपका स्वागत है। इस वेबसाइट का उपयोग करके, आप निम्नलिखित नियमों और शर्तों से बंधे होने की सहमति देते हैं। कृपया इन्हें ध्यान से पढ़ें।
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">1. मंच का उद्देश्य</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            JanPoll भारत के नागरिकों के लिए एक स्वतंत्र सार्वजनिक राय (Public Opinion) प्लेटफॉर्म है। यह किसी भी सरकारी निकाय, राजनीतिक दल या आधिकारिक चुनावी आयोग से संबंधित नहीं है।
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

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">5. पोल बनाना और सत्यापन</h2>
          <p className="text-sm leading-8 text-gray-600">पोल sign-in के साथ या guest के रूप में बनाया जा सकता है; दोनों में इन शर्तों की स्वीकृति आवश्यक है। Guest creator का management access इसी browser की सुरक्षित cookie पर निर्भर है। Browser data हटाने पर access खो सकता है; केवल Reference ID से ownership प्रमाणित नहीं होती। पोल बनाने वाले की जिम्मेदारी है कि सवाल और विकल्प स्पष्ट तथा गैर-भ्रामक हों। Verified badge केवल JanPoll की समीक्षा को दर्शाता है; यह सरकारी प्रमाणन या परिणाम की गारंटी नहीं है।</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">6. Deactivation और deletion</h2>
          <p className="text-sm leading-8 text-gray-600">पोल बनाने वाला अपने पोल को deactivate करने का अनुरोध बिना शुल्क कर सकता है। सामान्य स्थायी deletion request के लिए ₹199 + लागू GST का सेवा शुल्क है। पहले अनुरोध और स्वामित्व की जाँच होगी; कुल देय राशि तथा भुगतान निर्देश बताए जाने के बाद ही भुगतान करें। किसी public poll ID या share link का पता होना स्वामित्व का प्रमाण नहीं है।</p>
          <p className="text-sm leading-8 text-gray-600">गैरकानूनी सामग्री, privacy शिकायत या कानूनन आवश्यक removal इस शुल्क के अधीन नहीं हैं। आवश्यक audit records और backups अपनी लागू retention प्रक्रिया के अनुसार हटेंगे; तत्काल सभी प्रतियों के मिटने का दावा नहीं किया जाता। अनुरोध support@janpoll.in पर भेजें।</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">7. जिम्मेदार भागीदारी और गोपनीयता</h2>
          <p className="text-sm leading-8 text-gray-600">अलग browser, incognito, कई accounts या automation से परिणाम प्रभावित करने का प्रयास न करें। कुछ polls में sign-in आवश्यक हो सकता है। बिना login वाले polls में तकनीकी duplicate checks की सीमाएँ हैं। सार्वजनिक परिणाम में मतदाता की पसंद और पहचान प्रदर्शित नहीं की जानी चाहिए; इसे database से पूर्ण anonymity या encrypted secret ballot की गारंटी न समझें।</p>
        </section>
        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
          अंतिम अपडेट: 19 अक्टूबर 2026 • JanPoll India
        </div>
      </div>
    </div>
  );
}