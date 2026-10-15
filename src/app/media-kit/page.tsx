import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'मीडिया किट एवं विज्ञापन | JanPoll राजस्थान',
  description:
    'JanPoll पर विज्ञापन और प्रायोजित पोल: राजस्थान के ग्राम पंचायत स्तर तक पहुँचने वाला मोबाइल-फर्स्ट हिंदी ओपिनियन पोल मंच। विज्ञापन स्थान, नियम और संपर्क की पूरी जानकारी।',
  openGraph: {
    title: 'JanPoll मीडिया किट: विज्ञापन एवं साझेदारी',
    description: 'राजस्थान के स्थानीय दर्शकों तक अपने ब्रांड का संदेश पहुँचाएँ।',
    siteName: 'JanPoll',
    locale: 'hi_IN',
    type: 'website',
  },
};

// ---------- सेटिंग्स (यहीं से बदलें) ----------
const CONTACT_EMAIL = 'support@janpoll.in';

// true रखने पर पोल/वोट के असली आँकड़े डेटाबेस से दिखेंगे
const SHOW_LIVE_STATS = true;

// ट्रैफ़िक के आँकड़े तभी भरें जब वे Google Analytics या विज्ञापन नेटवर्क की रिपोर्ट से सत्यापित हों।
// खाली (null) रहने पर यह भाग पेज पर दिखाया ही नहीं जाएगा।
const TRAFFIC: {
  period: string; // जैसे 'सितंबर 2026'
  monthlyVisitors: number | null;
  monthlyPageViews: number | null;
  mobileSharePercent: number | null;
} = {
  period: '',
  monthlyVisitors: null,
  monthlyPageViews: null,
  mobileSharePercent: null,
};

// ---------- डेटाबेस से असली आँकड़े ----------
type LiveStats = {
  runningPolls: number;
  totalPolls: number;
  totalVotes: number;
  districts: number;
  gramPanchayats: number;
};

async function getLiveStats(): Promise<LiveStats | null> {
  try {
    const [polls, voteSum, districtRows, gpRows] = await Promise.all([
      db.poll.findMany({ select: { active: true, createdAt: true, deadlineDays: true } }),
      db.pollOption.aggregate({ _sum: { voteCount: true } }),
      db.poll.findMany({
        where: { districtName: { not: null } },
        distinct: ['districtName'],
        select: { districtName: true },
      }),
      db.poll.findMany({
        where: { gramPanchayatName: { not: null } },
        distinct: ['gramPanchayatName'],
        select: { gramPanchayatName: true },
      }),
    ]);

    return {
      runningPolls: polls.filter(isPollOpen).length,
      totalPolls: polls.length,
      totalVotes: voteSum._sum.voteCount ?? 0,
      districts: districtRows.length,
      gramPanchayats: gpRows.length,
    };
  } catch (error) {
    console.error('मीडिया किट के आँकड़े लोड करने में त्रुटि:', error);
    return null;
  }
}

// ---------- सामग्री ----------
const AD_FORMATS = [
  {
    name: 'नेटिव बैनर',
    size: 'लचीला आकार',
    device: 'मोबाइल और डेस्कटॉप',
    placement: 'होमपेज पर हर पृष्ठ की पोल सूची के नीचे',
    fit: 'ब्रांड पहचान और स्थानीय ऑफ़र',
  },
  {
    name: 'मोबाइल बैनर',
    size: '320 × 50',
    device: 'मोबाइल',
    placement: 'होमपेज पर 5वें पोल के बाद',
    fit: 'छोटा, स्पष्ट संदेश और वेबसाइट/ऐप क्लिक',
  },
  {
    name: 'मीडियम रेक्टैंगल',
    size: '300 × 250',
    device: 'मोबाइल और डेस्कटॉप',
    placement: 'होमपेज पर 10वें पोल के बाद',
    fit: 'विस्तृत संदेश, तस्वीर के साथ प्रचार',
  },
  {
    name: 'लीडरबोर्ड',
    size: '728 × 90',
    device: 'डेस्कटॉप / टैबलेट',
    placement: 'होमपेज पर 5वें पोल के बाद',
    fit: 'चौड़ी स्क्रीन पर प्रमुख उपस्थिति',
  },
  {
    name: 'प्रायोजित पोल',
    size: 'पूरा पोल कार्ड',
    device: 'सभी उपकरण',
    placement: 'पोल सूची में “प्रायोजित” चिह्न के साथ',
    fit: 'जनता की राय जानने के साथ ब्रांड संवाद',
  },
];

const STRENGTHS = [
  {
    icon: '📍',
    title: 'ग्राम पंचायत स्तर तक पहुँच',
    text: 'पोल जिला, पंचायत समिति और ग्राम पंचायत के अनुसार बनते हैं, जिससे संदेश सही क्षेत्र के दर्शकों तक पहुँचता है।',
  },
  {
    icon: '📱',
    title: 'मोबाइल-फर्स्ट, हिंदी में',
    text: 'पूरा प्लेटफ़ॉर्म स्मार्टफ़ोन के लिए बना है और हिंदी भाषी दर्शकों के लिए सरल रखा गया है।',
  },
  {
    icon: '✅',
    title: 'सत्यापित पोल निर्माता',
    text: 'पोल बनाने के लिए Google साइन-इन अनिवार्य है, ताकि पोल की साख बनी रहे।',
  },
  {
    icon: '🔒',
    title: 'निष्पक्ष वोटिंग',
    text: 'एक डिवाइस से एक पोल में एक ही वोट और नेटवर्क पर सीमा, ताकि नतीजे भरोसेमंद रहें।',
  },
  {
    icon: '💬',
    title: 'WhatsApp से तेज़ प्रसार',
    text: 'हर पोल पर WhatsApp शेयर का विकल्प है, इसलिए पोल लोगों के बीच आसानी से फैलते हैं।',
  },
  {
    icon: '🗓️',
    title: 'पंचायत चुनाव 2026 की जानकारी',
    text: 'चारों चरणों का कार्यक्रम और जिलेवार सूची देने वाला हमारा चुनाव पेज लोगों को बार-बार साइट पर लाता है।',
  },
];

const SUITABLE_FOR = [
  'स्थानीय दुकानदार और व्यापारी',
  'कोचिंग, स्कूल और शिक्षा संस्थान',
  'अस्पताल, क्लिनिक और स्वास्थ्य सेवाएँ',
  'कृषि, बीज, खाद और उपकरण विक्रेता',
  'मोबाइल ऐप, ऑनलाइन सेवाएँ और रोज़गार पोर्टल',
  'सामाजिक संगठन और जागरूकता अभियान',
];

const STEPS = [
  { title: 'संपर्क करें', text: 'अपना उद्देश्य, क्षेत्र और अवधि हमें ईमेल पर बताएँ।' },
  { title: 'प्रस्ताव', text: 'आपकी ज़रूरत के अनुसार विज्ञापन स्थान और अवधि का प्रस्ताव साझा किया जाता है।' },
  { title: 'सामग्री की स्वीकृति', text: 'विज्ञापन सामग्री की नियमों के अनुसार जाँच होती है।' },
  { title: 'अभियान शुरू', text: 'तय अवधि के लिए विज्ञापन साइट पर चलता है।' },
  { title: 'परिणाम सारांश', text: 'अभियान के बाद इम्प्रेशन और क्लिक का सारांश साझा किया जाता है।' },
];

const ACCEPTED = [
  'स्थानीय व्यवसाय, शिक्षा, स्वास्थ्य, कृषि और सेवाएँ',
  'सामाजिक और जागरूकता अभियान',
  'ऐप, वेबसाइट और रोज़गार संबंधी प्रचार',
];

const NOT_ACCEPTED = [
  'जुआ, सट्टा, सट्टेबाज़ी और अवैध सेवाएँ',
  'वयस्क या अश्लील सामग्री',
  'भ्रामक दावे, नकली ऑफ़र या धोखाधड़ी वाले विज्ञापन',
  'किसी समुदाय के प्रति घृणा या हिंसा भड़काने वाली सामग्री',
  'तंबाकू, शराब और प्रतिबंधित उत्पाद',
];

const FAQS: [string, string][] = [
  [
    'क्या प्रायोजक पोल के नतीजे बदल सकता है?',
    'नहीं। प्रायोजित पोल पर भी वोट सामान्य नियमों से गिने जाते हैं। प्रायोजक पोल के नतीजों या वोटों में किसी तरह का बदलाव नहीं कर सकता, और पोल पर साफ़ “प्रायोजित” चिह्न दिखाया जाता है।',
  ],
  [
    'क्या राजनीतिक या चुनाव से जुड़े विज्ञापन लगाए जा सकते हैं?',
    'ऐसे विज्ञापन केवल लागू नियमों और राज्य निर्वाचन आयोग के निर्देशों के अनुरूप ही स्वीकार किए जाते हैं। प्रत्येक सामग्री की जाँच के बाद ही स्वीकृति दी जाती है, और किसी भी विज्ञापन को अस्वीकार करने का अधिकार हमारे पास सुरक्षित है।',
  ],
  [
    'विज्ञापन सामग्री किस रूप में देनी होगी?',
    'ऊपर दिए गए आकारों में छवि (JPG या PNG) और क्लिक के लिए लिंक चाहिए। सामग्री हिंदी या अंग्रेज़ी में हो सकती है। मोबाइल पर पढ़ने में आसान, छोटा संदेश सबसे अच्छा रहता है।',
  ],
  [
    'दरें कैसे तय होती हैं?',
    'दरें विज्ञापन के आकार, स्थान और अवधि पर निर्भर करती हैं। अपनी ज़रूरत हमें ईमेल पर भेजें, हम उसी के अनुसार प्रस्ताव साझा करेंगे।',
  ],
];

// ---------- छोटे कंपोनेंट ----------
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 break-inside-avoid">
      <h2 className="text-xl font-black text-emerald-900 sm:text-2xl">{title}</h2>
      {subtitle ? <p className="mb-4 mt-1 text-sm text-slate-500">{subtitle}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm">
      <div className="text-2xl font-black text-emerald-800 sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function PlacementDiagram() {
  const feed = 'rounded-lg border border-emerald-100 bg-white p-2 text-center text-[11px] font-medium text-slate-500';
  const ad =
    'rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-2 text-center text-[11px] font-bold text-amber-800';

  return (
    <div className="mx-auto w-full max-w-sm space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
      <div className={feed}>पोल 1 से 5</div>
      <div className={ad}>विज्ञापन A: 320×50 (मोबाइल) / 728×90 (डेस्कटॉप)</div>
      <div className={feed}>पोल 6 से 10</div>
      <div className={ad}>विज्ञापन B: 300×250</div>
      <div className={feed}>पोल 11 से 15</div>
      <div className={ad}>विज्ञापन C: नेटिव बैनर</div>
      <div className={feed}>अगला / पिछला पृष्ठ</div>
    </div>
  );
}

export default async function MediaKitPage() {
  const stats = SHOW_LIVE_STATS ? await getLiveStats() : null;

  const hasTraffic =
    TRAFFIC.monthlyVisitors !== null ||
    TRAFFIC.monthlyPageViews !== null ||
    TRAFFIC.mobileSharePercent !== null;

  const updatedOn = new Date().toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const mailHref =
    `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent('JanPoll विज्ञापन पूछताछ')}` +
    `&body=${encodeURIComponent(
      'नमस्कार,\n\nब्रांड / संस्था का नाम:\nविज्ञापन का उद्देश्य:\nपसंदीदा जिला / क्षेत्र:\nअवधि:\nबजट (वैकल्पिक):\n\nधन्यवाद',
    )}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-gray-800 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="inline-flex min-h-[40px] items-center rounded-xl bg-emerald-50 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
        >
          ← होमपेज
        </Link>
        <PrintButton className="inline-flex min-h-[40px] items-center rounded-xl border border-emerald-200 bg-white px-4 text-xs font-bold text-emerald-900 transition hover:bg-emerald-50" />
      </div>

      {/* हीरो */}
      <header className="mb-10 rounded-3xl bg-gradient-to-r from-emerald-800 to-green-700 p-6 text-white shadow-md sm:p-10">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-100">
          मीडिया किट 2026
        </span>
        <h1 className="mb-3 mt-4 text-3xl font-black leading-tight sm:text-4xl">
          JanPoll पर अपने ब्रांड को राजस्थान की जनता तक पहुँचाएँ
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-emerald-50 sm:text-base">
          JanPoll राजस्थान का हिंदी ओपिनियन पोल मंच है, जहाँ लोग अपने गाँव, पंचायत और ज़िले के मुद्दों पर वोट देकर
          राय रखते हैं। यहाँ विज्ञापन और प्रायोजित पोल के ज़रिए आप स्थानीय दर्शकों से सीधे जुड़ सकते हैं।
        </p>
        <div className="mt-6 flex flex-col gap-3 print:hidden sm:flex-row">
          <a
            href={mailHref}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-emerald-900 shadow transition hover:bg-emerald-50"
          >
            📧 विज्ञापन के लिए संपर्क करें
          </a>
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/40 px-6 text-sm font-bold text-white transition hover:bg-white/10"
          >
            साइट देखें →
          </Link>
        </div>
      </header>

      {/* लाइव आँकड़े */}
      {stats && (
        <Section
          title="प्लेटफ़ॉर्म एक नज़र में"
          subtitle={`ये आँकड़े सीधे हमारे डेटाबेस से लिए गए हैं। अंतिम अपडेट: ${updatedOn}`}
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard value={stats.runningPolls.toLocaleString('en-IN')} label="अभी चल रहे पोल" />
            <StatCard value={stats.totalPolls.toLocaleString('en-IN')} label="कुल बने पोल" />
            <StatCard value={stats.totalVotes.toLocaleString('en-IN')} label="कुल वोट" />
            <StatCard value={stats.districts.toLocaleString('en-IN')} label="ज़िलों में पोल" />
            <StatCard value={stats.gramPanchayats.toLocaleString('en-IN')} label="ग्राम पंचायतों में पोल" />
          </div>
        </Section>
      )}

      {/* सत्यापित ट्रैफ़िक (सिर्फ़ तब, जब भरा हो) */}
      {hasTraffic && (
        <Section
          title="साइट ट्रैफ़िक"
          subtitle={TRAFFIC.period ? `अवधि: ${TRAFFIC.period}` : undefined}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TRAFFIC.monthlyVisitors !== null && (
              <StatCard value={TRAFFIC.monthlyVisitors.toLocaleString('en-IN')} label="मासिक विज़िटर" />
            )}
            {TRAFFIC.monthlyPageViews !== null && (
              <StatCard value={TRAFFIC.monthlyPageViews.toLocaleString('en-IN')} label="मासिक पेज व्यू" />
            )}
            {TRAFFIC.mobileSharePercent !== null && (
              <StatCard value={`${TRAFFIC.mobileSharePercent}%`} label="मोबाइल से आने वाले विज़िटर" />
            )}
          </div>
        </Section>
      )}

      {/* पहुँच: आयोग के आधिकारिक ढाँचे पर आधारित */}
      <Section
        title="पंचायत स्तर तक पहुँच"
        subtitle="राज्य निर्वाचन आयोग, राजस्थान के 2026 पंचायतीराज आम चुनाव का ढाँचा, जिसके हिसाब से हमारे पोल बनते हैं।"
      >
        <div className="grid grid-cols-3 gap-3">
          <StatCard value="41" label="ज़िला परिषद" />
          <StatCard value="457" label="पंचायत समितियाँ" />
          <StatCard value="14,403" label="ग्राम पंचायतें" />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          चुनाव चार चरणों में होंगे। चुनावी माहौल में स्थानीय मुद्दों पर लोगों की रुचि बढ़ती है, जिससे पोल और चुनाव
          जानकारी के पृष्ठों पर ध्यान जाता है।
        </p>
      </Section>

      {/* ताकत */}
      <Section title="JanPoll क्यों" subtitle="विज्ञापनदाताओं के लिए हमारे प्लेटफ़ॉर्म की खूबियाँ।">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STRENGTHS.map((item) => (
            <div key={item.title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="mb-2 text-2xl" aria-hidden="true">
                {item.icon}
              </div>
              <h3 className="mb-1 text-sm font-bold text-emerald-900">{item.title}</h3>
              <p className="text-xs leading-relaxed text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* विज्ञापन विकल्प */}
      <Section title="विज्ञापन के विकल्प" subtitle="उपलब्ध विज्ञापन स्थान, आकार और उनका उपयोग।">
        <div className="grid gap-3 sm:grid-cols-2">
          {AD_FORMATS.map((f) => (
            <div key={f.name} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-emerald-900">{f.name}</h3>
                <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  {f.size}
                </span>
              </div>
              <dl className="space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-semibold text-slate-500">उपकरण</dt>
                  <dd className="text-slate-700">{f.device}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-semibold text-slate-500">स्थान</dt>
                  <dd className="text-slate-700">{f.placement}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-semibold text-slate-500">उपयुक्त</dt>
                  <dd className="text-slate-700">{f.fit}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </Section>

      {/* विज्ञापन कहाँ दिखते हैं */}
      <Section title="होमपेज पर विज्ञापन कहाँ दिखते हैं" subtitle="हर पृष्ठ पर 15 पोल, और उनके बीच-बीच में विज्ञापन।">
        <PlacementDiagram />
      </Section>

      {/* प्रायोजित पोल */}
      <Section title="प्रायोजित पोल" subtitle="जनता की राय जानने के साथ अपने ब्रांड को जोड़ने का तरीका।">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✔ पोल पर साफ़ “प्रायोजित” चिह्न दिखाया जाता है।</li>
            <li>✔ वोटों और नतीजों में प्रायोजक का कोई दखल नहीं होता।</li>
            <li>✔ सवाल निष्पक्ष और तथ्यों पर आधारित होना ज़रूरी है।</li>
            <li>✔ क्षेत्र (ज़िला / पंचायत समिति / ग्राम पंचायत) के अनुसार पोल बनाए जा सकते हैं।</li>
          </ul>
        </div>
      </Section>

      {/* किनके लिए */}
      <Section title="ये विज्ञापनदाताओं के लिए उपयुक्त है">
        <div className="flex flex-wrap gap-2">
          {SUITABLE_FOR.map((item) => (
            <span
              key={item}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900"
            >
              {item}
            </span>
          ))}
        </div>
      </Section>

      {/* प्रक्रिया */}
      <Section title="विज्ञापन कैसे शुरू करें">
        <ol className="grid gap-3 sm:grid-cols-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mb-1 text-sm font-bold text-emerald-900">{step.title}</h3>
              <p className="text-xs leading-relaxed text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* विज्ञापन नीति */}
      <Section title="विज्ञापन नीति" subtitle="भरोसेमंद मंच बनाए रखने के लिए हम सामग्री की जाँच करते हैं।">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <h3 className="mb-2 text-sm font-bold text-emerald-900">स्वीकार्य</h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {ACCEPTED.map((item) => (
                <li key={item}>✔ {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
            <h3 className="mb-2 text-sm font-bold text-red-800">अस्वीकार्य</h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {NOT_ACCEPTED.map((item) => (
                <li key={item}>✖ {item}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          राजनीतिक और चुनाव संबंधी विज्ञापन केवल लागू नियमों और राज्य निर्वाचन आयोग के निर्देशों के अनुसार ही स्वीकार
          होते हैं। किसी भी विज्ञापन को अस्वीकार करने का अधिकार JanPoll के पास सुरक्षित है।
        </p>
      </Section>

      {/* सवाल-जवाब */}
      <Section title="अक्सर पूछे जाने वाले सवाल">
        <div className="divide-y divide-emerald-100 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group p-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-emerald-900">
                {q}
                <span className="text-emerald-600 transition group-open:rotate-45 print:hidden">＋</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* संपर्क */}
      <section className="mb-6 break-inside-avoid rounded-3xl bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 text-center text-white shadow-lg sm:p-8">
        <h2 className="mb-2 text-xl font-black sm:text-2xl">ब्रांड प्रमोशन या साझेदारी के लिए संपर्क करें</h2>
        <p className="mx-auto mb-5 max-w-lg text-xs text-emerald-100 sm:text-sm">
          अपना उद्देश्य, क्षेत्र और अवधि हमें ईमेल पर भेजें। हम आपकी ज़रूरत के अनुसार प्रस्ताव साझा करेंगे।
        </p>
        <div className="flex flex-col items-center justify-center gap-3 print:hidden sm:flex-row">
          <a
            href={mailHref}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-emerald-900 shadow transition hover:bg-emerald-50 sm:w-auto"
          >
            📧 {CONTACT_EMAIL} पर ईमेल करें
          </a>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/40 px-6 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
          >
            संपर्क फ़ॉर्म →
          </Link>
        </div>
        <p className="hidden text-sm font-bold print:block">ईमेल: {CONTACT_EMAIL}</p>
      </section>

      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        पोल, वोट और क्षेत्र संबंधी आँकड़े JanPoll के डेटाबेस से लिए गए हैं। चुनाव संबंधी संख्याएँ राज्य निर्वाचन आयोग,
        राजस्थान की अधिसूचना पर आधारित हैं। JanPoll एक स्वतंत्र निजी मंच है और किसी सरकारी संस्था से संबद्ध नहीं है।
      </p>
    </main>
  );
}