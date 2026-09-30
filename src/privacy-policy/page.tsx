import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href="/" className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm flex items-center gap-1">
          &larr; होम पेज पर वापस जाएं
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 md:p-10 space-y-6">
        <h1 className="text-2xl md:text-3xl font-black text-emerald-900 border-b border-emerald-100 pb-4">
          गोपनीयता नीति (Privacy Policy)
        </h1>
        
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong>JanPoll</strong> ("हम", "हमारी") आपकी गोपनीयता का सम्मान करती है। यह गोपनीयता नीति पृष्ठ समझाता है कि जब आप हमारी वेबसाइट पर आते हैं या पोल में भाग लेते हैं, तो हम कौन सी जानकारी एकत्र करते हैं और उसका उपयोग कैसे किया जाता है।
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">1. हम कौन सी जानकारी एकत्र करते हैं?</h2>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li><strong>वोटिंग डेटा:</strong> जब आप किसी पोल पर वोट करते हैं, तो हम आपके द्वारा चुने गए विकल्प को दर्ज करते हैं।</li>
            <li><strong>सुरक्षा और पहचान (Anonymous ID & IP Address):</strong> यह सुनिश्चित करने के लिए कि एक डिवाइस/नेटवर्क से केवल एक ही बार वोट दिया जा सके, हम एक सुरक्षित गुमनाम यूजर आईडी (Anonymous Cookie) और आईपी एड्रेस (IP Address) का उपयोग करते हैं।</li>
            <li><strong>स्वैच्छिक जानकारी:</strong> यदि आप पोल बनाते समय अपना नाम या ईमेल दर्ज करते हैं, तो वह सुरक्षित रूप से सहेजा जाता है।</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">2. कुकीज़ (Cookies) का उपयोग</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            हम आपके ब्राउज़र में छोटी कुकीज़ का उपयोग यह ट्रैक करने के लिए करते हैं कि आपने किन पोल्स पर पहले ही वोट दे दिया है, ताकि आपको बार-बार वोट करने से रोका जा सके और एक निष्पक्ष प्रक्रिया बनी रहे।
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">3. तृतीय-पक्ष विज्ञापन (Google AdSense)</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            हम भविष्य में वेबसाइट के संचालन और रखरखाव के लिए Google AdSense जैसे विज्ञापनों का उपयोग कर सकते हैं। गूगल जैसी थर्ड-पार्टी कंपनियां विज्ञापनों को दिखाने के लिए कुकीज़ (যেমন DART cookie) का उपयोग कर सकती हैं।
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-emerald-800">4. डेटा सुरक्षा</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            हम आपके डेटा की सुरक्षा के लिए उचित तकनीकी और संगठनात्मक उपायों का पालन करते हैं। हम आपका व्यक्तिगत डेटा किसी भी बाहरी व्यक्ति को नहीं बेचते हैं।
          </p>
        </section>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
          अंतिम अपडेट: 2026 • JanPoll Rajasthan
        </div>
      </div>
    </div>
  );
}