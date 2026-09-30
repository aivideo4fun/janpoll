import React from 'react';

export const metadata = {
  title: 'गोपनीयता नीति (Privacy Policy) — JanPoll',
  description: 'JanPoll ki privacy policy aur data protection guidelines ki professional jankari.',
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-gray-800">
      <h1 className="text-3xl md:text-4xl font-black text-emerald-900 mb-2">गोपनीयता नीति (Privacy Policy)</h1>
      <p className="text-sm text-gray-500 mb-8">अंतिम अद्यतन (Last Updated): 30 सितंबर, 2026</p>

      <div className="space-y-6 text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-2">1. प्रस्तावना</h2>
          <p>
            <strong>JanPoll</strong> (https://janpoll.in पर उपलब्ध) में आपका स्वागत है। हम अपने उपयोगकर्ताओं की गोपनीयता (Privacy) की पूरी सुरक्षा करने के लिए प्रतिबद्ध हैं। यह गोपनीयता नीति दस्तावेज बताती है कि हम आपकी किन जानकारियों को एकत्र करते हैं और उनका उपयोग कैसे किया जाता है।
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-2">2. हम कौन सी जानकारी एकत्र करते हैं?</h2>
          <p>
            जब आप हमारी वेबसाइट पर आते हैं, तो हम स्वचालित (Automatically) रूप से कुछ सामान्य तकनीकी जानकारी एकत्र करते हैं, जैसे आपका आईपी (IP) पता, ब्राउज़र का प्रकार, डिवाइस की जानकारी और देखे गए पृष्ठ। इसके अलावा, जब आप किसी पोल में भाग लेते हैं या अपना मत दर्ज करते हैं, तो हम सटीक सार्वजनिक जनमत परिणाम प्रदर्शित करने के लिए आपके वोट को सुरक्षित रूप से संग्रहीत करते हैं।
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-2">3. Google AdSense और कुकीज़ (Cookies)</h2>
          <p>
            हमारी वेबसाइट विज्ञापनों को प्रदर्शित करने के लिए Google सहित तृतीय-पक्ष (Third-party) विक्रेताओं का उपयोग करती है। Google हमारी या अन्य वेबसाइटों पर आपके पिछले दौरों के आधार पर विज्ञापन दिखाने के लिए कुकीज़ (जैसे DART कुकी) का उपयोग करता है। उपयोगकर्ता Google विज्ञापन और सामग्री नेटवर्क गोपनीयता नीति पर जाकर DART कुकी के उपयोग से बाहर (Opt-out) हो सकते हैं।
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-2">4. लॉग फ़ाइलें (Log Files)</h2>
          <p>
            JanPoll लॉग फ़ाइलों के उपयोग की एक मानक प्रक्रिया का पालन करता है। जब उपयोगकर्ता वेबसाइटों पर जाते हैं, तो ये फ़ाइलें उन्हें लॉग करती हैं। लॉग फ़ाइलों द्वारा एकत्र की गई जानकारी में इंटरनेट प्रोटोकॉल (IP) पते, ब्राउज़र का प्रकार, इंटरनेट सेवा प्रदाता (ISP), दिनांक और समय स्टamp, और संदर्भित/निकास पृष्ठ शामिल हैं।
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-2">5. तृतीय-पक्ष गोपनीयता नीतियां</h2>
          <p>
            JanPoll की गोपनीयता नीति अन्य विज्ञापनदाताओं या वेबसाइटों पर लागू नहीं होती है। इसलिए, हम आपको अधिक विस्तृत जानकारी के लिए इन तृतीय-पक्ष विज्ञापन सर्वरों की संबंधित गोपनीयता नीतियों से परामर्श करने की सलाह देते हैं।
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-2">6. सहमति</h2>
          <p>
            हमारी वेबसाइट का उपयोग करके, आप एतद्द्वारा हमारी गोपनीयता नीति और उसके नियमों व शर्तों से अपनी सहमति व्यक्त करते हैं।
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-2">7. संपर्क करें</h2>
          <p>
            यदि आपके पास हमारी गोपनीयता नीति के संबंध में कोई प्रश्न या सुझाव हैं, तो आप हमारे संपर्क पृष्ठ के माध्यम से हमसे बेझिझक संपर्क कर सकते हैं।
          </p>
        </section>
      </div>
    </div>
  );
}