import Link from 'next/link';
import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';
import { pageMetadata } from '@/lib/seo';
import PrintButton from '@/components/PrintButton';
export const dynamic = 'force-dynamic';
export const metadata = pageMetadata('Media Kit | JanPoll — Voice of People','JanPoll के विज्ञापन स्थान, वास्तविक platform आँकड़े और partnership की जानकारी।','/media-kit',['JanPoll media kit','JanPoll advertising','जनमत मंच']);
async function loadStats(){
 try{
  const [polls,totals,records,states]=await Promise.all([
   db.poll.findMany({select:{active:true,createdAt:true,deadlineDays:true}}),
   db.pollOption.aggregate({_sum:{voteCount:true}}),db.vote.count(),
   db.poll.groupBy({by:['stateCode'],where:{scope:'STATE',stateCode:{not:null}},_count:{_all:true}}),
  ]);
  return {polls:polls.length,open:polls.filter(isPollOpen).length,votes:totals._sum.voteCount??0,records,states:states.length};
 }catch(error){console.error('Media kit statistics unavailable',error);return null;}
}
const placements=[
 {title:'Public page native placement',detail:'सार्वजनिक pages के footer क्षेत्र में responsive native advertising। Private और poll creation pages पर विज्ञापन नहीं दिखते।'},
 {title:'Poll page placement',detail:'Poll page पर social links के बाद विज्ञापन स्थान। विज्ञापन और मतदान controls अलग रखे जाते हैं।'},
 {title:'Direct brand partnership',detail:'Creative, placement, अवधि और reporting पर लिखित सहमति के बाद अभियान तय होगा। उपलब्धता और दर के लिए संपर्क करें।'},
];
export default async function MediaKit(){
 const stats=await loadStats();const date=new Date().toLocaleString('hi-IN',{timeZone:'Asia/Kolkata'});
 return <main lang="hi" className="min-h-screen bg-[#f5f8f6] px-4 py-10 sm:py-16"><div className="mx-auto max-w-6xl">
 <div className="flex flex-wrap justify-between gap-3"><Link href="/" className="text-sm text-emerald-800">← होम</Link><PrintButton/></div>
 <header className="mt-7 rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-800 p-7 text-white sm:p-12"><p className="text-xs tracking-[.2em] text-emerald-200">JANPOLL / MEDIA KIT</p><h1 className="mt-4 text-3xl font-semibold leading-relaxed sm:text-5xl">Voice of People</h1><p className="mt-5 max-w-2xl text-sm leading-8 text-emerald-50">भारत के राज्यों और स्थानीय समुदायों के मुद्दों पर राय रखने, जनमत बनाने और संवाद करने का स्वतंत्र डिजिटल मंच। Rajasthan की स्थानीय hierarchy और अन्य राज्यों के सरल polls एक ही platform पर उपलब्ध हैं।</p><Link href="/advertise" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-white px-5 text-sm font-semibold text-emerald-950">विज्ञापन की जानकारी →</Link></header>
 <section className="mt-10"><h2 className="text-2xl font-semibold text-emerald-950">Platform snapshot</h2><p className="mt-3 text-sm leading-7 text-slate-500">डेटाबेस से प्राप्त platform activity · {date} IST</p>{stats?<><div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">{[[stats.polls,'कुल पोल'],[stats.open,'खुले पोल'],[stats.votes,'दर्ज विकल्प वोटों का कुल'],[stats.states,'राज्य कोड वाले क्षेत्र']].map(([value,label])=><article key={String(label)} className="rounded-2xl border border-emerald-100 bg-white p-5"><p className="text-2xl font-semibold text-emerald-900">{Number(value).toLocaleString('en-IN')}</p><h3 className="mt-2 text-xs leading-7 text-slate-600">{label}</h3></article>)}</div><p className="mt-4 text-xs leading-7 text-slate-500">Stored vote records: {stats.records.toLocaleString('en-IN')}। Historical counters और individual vote records का कुल अलग हो सकता है; यह अपने आप में fraud का प्रमाण नहीं है। ये आँकड़े unique people, ad impressions या reach नहीं हैं।</p></>:<p className="mt-5 rounded-2xl border bg-white p-5 text-sm leading-7">आँकड़े अभी उपलब्ध नहीं हैं। Campaign planning के लिए verified report माँगें।</p>}</section>
 <section className="mt-10"><h2 className="text-2xl font-semibold text-emerald-950">Advertising & partnerships</h2><div className="mt-5 grid gap-5 md:grid-cols-3">{placements.map(item=><article key={item.title} className="rounded-2xl border border-emerald-100 bg-white p-6"><h3 className="text-lg font-semibold leading-8 text-emerald-950">{item.title}</h3><p className="mt-3 text-sm leading-8 text-slate-600">{item.detail}</p></article>)}</div></section>
 <section className="mt-10 grid gap-5 md:grid-cols-2"><article className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold text-emerald-950">Transparent reporting</h2><p className="mt-4 text-sm leading-8 text-slate-600">Traffic, device और referral reports केवल उपलब्ध measurement और consent के आधार पर तैयार होंगी। Page views, sessions और ad-network impressions अलग metrics हैं। Ad impressions, fill और revenue की पुष्टि संबंधित provider की report से होगी। हम guaranteed clicks, votes, reach या returns का दावा नहीं करते।</p></article><article className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold text-emerald-950">Brand & audience trust</h2><p className="mt-4 text-sm leading-8 text-slate-600">विज्ञापन स्पष्ट रूप से चिह्नित होंगे। किसी विज्ञापनदाता को व्यक्तिगत voting choices या creator की निजी जानकारी नहीं दी जाएगी। Sponsored content के लिए editorial review और स्पष्ट disclosure आवश्यक है। JanPoll स्वतंत्र जनमत दिखाता है; यह सरकारी मतदान प्रणाली नहीं है।</p></article></section>
 <section className="mt-10 rounded-3xl border border-emerald-200 bg-emerald-50 p-7"><h2 className="text-2xl font-semibold text-emerald-950">आइए, अभियान पर बात करें</h2><p className="mt-3 text-sm leading-8 text-slate-600">अपना brand, उद्देश्य, target region, अवधि और अनुमानित budget भेजें। उपलब्ध placement, creative और reporting की पुष्टि campaign शुरू होने से पहले की जाएगी।</p><div className="mt-5 flex flex-wrap gap-3"><a href="mailto:support@janpoll.in" className="rounded-xl bg-emerald-800 px-5 py-3 text-sm text-white">support@janpoll.in</a><Link href="/contact" className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm text-emerald-900">संपर्क करें</Link><a href="https://t.me/janpollindia" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm text-emerald-900">Telegram →</a></div></section>
 </div></main>;
}
