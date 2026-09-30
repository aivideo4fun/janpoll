import Link from 'next/link';

export default function Disclaimer() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href="/" className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm flex items-center gap-1">
          &larr; होम पेज पर वापस जाएं
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 md:p-10 space-y-6">
        <h1 className="text-2xl md:text-3xl font-black text-emerald-900 border-b border-emerald-100 pb-4">
          अस्वीकरण (Disclaimer)
        </h1>
        
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-sm font-medium">
          ⚠️ <strong>महत्वपूर्ण सूचना:</strong> JanPoll केवल सार्वजनिक राय जानने का एक डिजिटल प्लेटफॉर्म है। यह किसी भी सरकारी संस्था, चुनाव आयोग या आधिकारिक मतदान प्रणाली का हिस्सा नहीं है।
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          इस वेबसाइट (JanPoll) पर प्रकाशित सभी पोल और उनके परिणाम केवल जनता के विचारों और सहभागिता को प्रदर्शित करने के उद्देश्य से हैं। इन परिणामों को किसी भी प्रकार का आधिकारिक चुनावी सर्वेक्षण या कानूनी रूप से मान्य जनमत संग्रह नहीं समझा जाना चाहिए।
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">तृतीय-पक्ष लिंक और विज्ञापन</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            हमारी वेबसाइट पर विज्ञापनों या अन्य बाहरी लिंक्स के माध्यम से प्रदर्शित सामग्री के लिए JanPoll प्रत्यक्ष रूप से जिम्मेदार नहीं है। विज्ञापनदाताओं की नीतियां अलग हो सकती हैं।
          </p>
        </section>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
          JanPoll • राजस्थान जनता की आवाज़
        </div>
      </div>
    </div>
  );
}