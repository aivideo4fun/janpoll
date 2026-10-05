import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-white mt-auto pt-10 pb-6 border-t border-emerald-900">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-emerald-900/60 pb-6 gap-4">
          <div>
            <h3 className="text-xl font-black tracking-wider text-emerald-400">JANPOLL <span className="text-xs font-normal text-emerald-200">राजस्थान</span></h3>
            <p className="text-xs text-emerald-200/80 mt-1">राजस्थान की जनता की राय, एक जगह।</p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs font-medium text-emerald-100">
            <Link href="/" className="hover:text-white transition">होम (Home)</Link>
            <Link href="/create" className="hover:text-white transition">पोल बनाएँ</Link>
            <Link href="/privacy-policy" className="hover:text-white transition">गोपनीयता नीति</Link>
            <Link href="/terms" className="hover:text-white transition">नियम और शर्तें</Link>
            <Link href="/disclaimer" className="hover:text-white transition">अस्वीकरण</Link>
            <Link href="/contact" className="hover:text-white transition">संपर्क करें</Link>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="my-6 p-4 bg-emerald-900/40 rounded-xl text-xs text-emerald-100/90 leading-relaxed border border-emerald-700/30 shadow-inner">
          <strong className="text-white">महत्वपूर्ण सूचना:</strong> JanPoll पर दिखाए गए polls केवल जनता की राय/जनमत जानने के लिए हैं। 
          ये किसी सरकारी संस्था, निर्वाचन आयोग या आधिकारिक चुनावी मतदान प्रणाली का हिस्सा नहीं हैं। 
          JanPoll के परिणाम आधिकारिक चुनाव परिणाम नहीं माने जाने चाहिए।
        </div>

        {/* 📢 Footer AdSense Banner */}
        <div className="my-6 py-2 bg-emerald-900/30 rounded-xl flex justify-center items-center overflow-hidden border border-emerald-800/40">
          <ins className="adsbygoogle"
               style={{ display: 'block', textAlign: 'center' }}
               data-ad-client="ca-pub-4603205178906314"
               data-ad-slot="YOUR_FOOTER_AD_SLOT"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({});' }} />
        </div>

        <div className="text-center text-xs text-emerald-300/60 pt-2 flex flex-col md:flex-row justify-between items-center gap-2">
          <span>© {new Date().getFullYear()} JanPoll.in — All rights reserved.</span>
          <span className="text-[11px]">Designed for Rajasthan Public Opinion Platform</span>
        </div>
      </div>
    </footer>
  );
}