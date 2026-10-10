import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { subscribeNewsletter } from '@/app/actions/newsletterAction';
import Ad728x90 from '@/components/Ad728x90';

export default function Footer() {
  return <FooterContent />;
}

async function FooterContent() {
  let totalVotes = 0;
  let totalPolls = 0;
  let totalDistricts = 0;

  try {
    totalPolls = await db.poll.count();

    const voteSum = await db.pollOption.aggregate({
      _sum: {
        voteCount: true,
      },
    });
    totalVotes = voteSum._sum.voteCount ?? 0;

    totalDistricts = await db.district.count();
  } catch (error) {
    console.error('फूटर डेटा लोड करने में त्रुटि:', error);
  }

  return (
    <footer className="bg-[#031d15] text-white pt-12 pb-8 border-t border-emerald-900/50 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* महत्वपूर्ण सूचना बॉक्स */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 sm:p-5 flex items-start gap-3 shadow-inner">
          <span className="text-emerald-400 text-xl">ℹ️</span>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
            <strong className="text-white font-bold">महत्वपूर्ण सूचना:</strong> JanPoll पर दिखाए गए पोल्स केवल जनता की राय/जनमत जानने के लिए हैं। ये किसी सरकारी संस्था, निर्वाचन आयोग या आधिकारिक चुनावी मतदान प्रणाली का हिस्सा नहीं हैं।
          </p>
        </div>

        {/* मुख्य फूटर ग्रिड कॉलम */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">JANPOLL</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-md">राजस्थान</span>
            </div>
            
            <p className="text-xs sm:text-sm text-emerald-100/80 font-medium">
              राजस्थान की जनता की राय, एक जगह।
            </p>

            <p className="text-xs text-gray-300 leading-relaxed max-w-md">
              JanPoll.in एक स्वतंत्र जनमत मंच है जहाँ आप राजस्थान के स्थानीय मुद्दों, ग्राम पंचायत, पंचायत समिति और जिला परिषद पर अपनी राय साझा कर सकते हैं।
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/60 px-3 py-1.5 text-xs text-emerald-200">
                <span>🟢</span>
                <span>राजस्थान: लाइव (सक्रिय)</span>
              </div>
            </div>
          </div>

          {/* मुख्य लिंक */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-900 pb-2">
              <span>🔗</span> मुख्य लिंक
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-300 font-medium">
              <li><Link href="/" className="hover:text-emerald-400 transition flex items-center gap-1.5">› होम पेज</Link></li>
              <li><Link href="/create" className="hover:text-emerald-400 transition flex items-center gap-1.5">› पोल बनाएं</Link></li>
              <li><Link href="/rajasthan" className="hover:text-emerald-400 transition flex items-center gap-1.5">› लोकप्रिय पोल</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-emerald-400 transition flex items-center gap-1.5">› गोपनीयता नीति</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition flex items-center gap-1.5">› नियम और शर्तें</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition flex items-center gap-1.5">› संपर्क करें</Link></li>
            </ul>
          </div>

          {/* सहायता एवं जानकारी */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-900 pb-2">
              <span>❓</span> सहायता एवं जानकारी
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-300 font-medium">
              <li><Link href="/about" className="hover:text-emerald-400 transition flex items-center gap-1.5">› JanPoll क्या है?</Link></li>
              <li><Link href="/how-it-works" className="hover:text-emerald-400 transition flex items-center gap-1.5">› यह कैसे काम करता है?</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-emerald-400 transition flex items-center gap-1.5">› सुरक्षा और गोपनीयता</Link></li>
              <li><Link href="/faq" className="hover:text-emerald-400 transition flex items-center gap-1.5">› अक्सर पूछे जाने वाले प्रश्न</Link></li>
              <li><Link href="/feedback" className="hover:text-emerald-400 transition flex items-center gap-1.5">› सुझाव या शिकायत</Link></li>
            </ul>
          </div>

          {/* सोशल मीडिया और न्यूज़लेटर */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-900 pb-2">
              <span>👥</span> हमसे जुड़ें
            </h3>
            
            <div className="flex items-center gap-3 pt-1">
              <a href="https://www.facebook.com/profile.php?id=61595121995283" target="_blank" rel="noreferrer" title="Facebook" className="h-10 w-10 rounded-full bg-white/10 p-2 flex items-center justify-center hover:bg-white/20 transition shadow">
                <Image src="/images/facebook.png" alt="Facebook" width={24} height={24} className="object-contain" />
              </a>
              <a href="https://www.instagram.com/janpoll.in" target="_blank" rel="noreferrer" title="Instagram" className="h-10 w-10 rounded-full bg-white/10 p-2 flex items-center justify-center hover:bg-white/20 transition shadow">
                <Image src="/images/instagram.png" alt="Instagram" width={24} height={24} className="object-contain" />
              </a>
              <a href="https://twitter.com/janpollindia" target="_blank" rel="noreferrer" title="X (Twitter)" className="h-10 w-10 rounded-full bg-white/10 p-2 flex items-center justify-center hover:bg-white/20 transition shadow">
                <Image src="/images/x.png" alt="X (Twitter)" width={24} height={24} className="object-contain" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" title="YouTube" className="h-10 w-10 rounded-full bg-white/10 p-2 flex items-center justify-center hover:bg-white/20 transition shadow">
                <Image src="/images/youtube.png" alt="YouTube" width={24} height={24} className="object-contain" />
              </a>
            </div>

            {/* न्यूज़लेटर फॉर्म */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/50 p-3 space-y-2">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>✉️</span> जानकारी पाएं
              </p>
              <form action={async (formData) => { 'use server'; await subscribeNewsletter(formData); }} className="flex flex-col gap-2">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="अपना ईमेल दर्ज करें"
                  className="w-full rounded-xl border border-emerald-800 bg-[#01140e] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-500 py-2 text-xs font-bold text-emerald-950 hover:bg-emerald-400 transition shadow"
                >
                  सब्सक्राइब करें
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* 100% रियल डेटाबेस आंकड़े */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/30 p-4 text-center">
            <p className="text-xl sm:text-2xl font-black text-white">{totalVotes.toLocaleString('en-IN')}+</p>
            <p className="text-xs text-emerald-300 font-medium">कुल वोटर्स</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/30 p-4 text-center">
            <p className="text-xl sm:text-2xl font-black text-white">{totalPolls.toLocaleString('en-IN')}+</p>
            <p className="text-xs text-emerald-300 font-medium">कुल पोल</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/30 p-4 text-center">
            <p className="text-xl sm:text-2xl font-black text-white">{totalDistricts}+</p>
            <p className="text-xs text-emerald-300 font-medium">जिलों से सहभागिता</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/30 p-4 text-center">
            <p className="text-xl sm:text-2xl font-black text-white">100%</p>
            <p className="text-xs text-emerald-300 font-medium">सुरक्षित राय</p>
          </div>
        </div>

        {/* 📢 विज्ञापन / प्रायोजक बैनर स्लॉट (अब कुल वोटर्स के ठीक नीचे / फूटर के बॉटम में) */}
        <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-950/30 p-6 text-center space-y-3 relative overflow-hidden shadow-sm">
          <span className="absolute top-2 right-3 text-[10px] uppercase tracking-widest text-emerald-400/60 font-bold bg-emerald-900/50 px-2 py-0.5 rounded">
            विज्ञापनों की जगह (Ad Space)
          </span>
          <p className="text-xs font-bold text-emerald-300">📢 प्रायोजक एवं विज्ञापन (Sponsored / Ads)</p>
          
          <div className="flex flex-wrap justify-center items-center gap-4 py-2">
            <AdsterraBanner adKey="284cee4d0f75c889cb2c8420f6c1834f" width={728} height={90} src="https://bicea.org/22/284cee4d0f75c889cb2c8420f6c1834f" />
            <AdsterraBanner adKey="4801d526481e48f32daba116c6ca2a7c" width={300} height={250} src="https://bicea.org/22/4801d526481e48f32daba116c6ca2a7c" />
          </div>
        </div>

        {/* कॉपीराइट और बॉटम लिंक्स */}
        <div className="border-t border-emerald-900/80 pt-6 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-gray-400 text-center lg:text-left">
          <p>© 2026 JanPoll.in — सभी अधिकार सुरक्षित।</p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium">
            <Link href="/privacy-policy" className="hover:text-emerald-400 transition">गोपनीयता नीति</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-emerald-400 transition">नियम और शर्तें</Link>
            <span>•</span>
            <Link href="/disclaimer" className="hover:text-emerald-400 transition">अस्वीकरण</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-emerald-400 transition">संपर्क करें</Link>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <span>❤️ राजस्थान के लोगों के लिए, जनता द्वारा 🇮🇳</span>
          </div>
        </div>

      </div>
    </footer>
  );
}