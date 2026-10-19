import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Private Group Polls | JanPoll',
  robots: { index: false, follow: false },
};

export default function PrivateCreatePage() {
  return <main lang="hi" className="min-h-[70vh] bg-[#f5f8f6] px-4 py-12 text-slate-800"><section className="mx-auto max-w-xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9"><p className="font-sans text-[10px] font-semibold tracking-[0.18em] text-emerald-700">JANPOLL / PRIVATE GROUPS</p><h1 className="mt-4 text-3xl font-semibold leading-[1.8] text-emerald-950">अपने group की राय जानें।</h1><p className="mt-4 text-sm leading-8 text-slate-500">आमंत्रित सदस्यों के लिए private polls की सुविधा अभी उपलब्ध नहीं है। यहाँ फिलहाल कोई poll प्रकाशित नहीं किया जा सकता।</p><p className="mt-3 text-xs leading-7 text-slate-500">केवल सार्वजनिक सवाल के लिए Public Opinion चुनें। निजी group की जानकारी public poll में न डालें।</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/create" className="rounded-full border border-emerald-100 px-5 py-3 text-sm leading-7 text-emerald-800">← वापस जाएँ</Link><Link href="/create/public" className="rounded-full bg-emerald-800 px-5 py-3 text-sm leading-7 text-white">Public Opinion →</Link></div></section></main>;
}
