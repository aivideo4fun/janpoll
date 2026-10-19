import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ownerWhere } from '@/lib/polls/owner';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'पोल की रसीद | JanPoll India', robots: { index: false, follow: false } };
export default async function Receipt({ params }: { params: { id: string } }) {
  const owner = await ownerWhere();
  if (!owner) redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/poll-created/${params.id}`)}`);
  const poll = await db.poll.findFirst({ where: { id: params.id, ...owner }, select: { id: true, question: true, creatorReference: true } });
  if (!poll) notFound();
  return <main lang="hi" className="min-h-[70vh] bg-slate-50 px-4 py-12"><section className="mx-auto max-w-xl rounded-3xl border border-emerald-100 bg-white p-6 sm:p-9"><h1 className="text-2xl font-semibold leading-relaxed text-emerald-950">आपका पोल प्रकाशित हो गया</h1><p className="mt-4 text-sm leading-8">{poll.question}</p><p className="mt-6 text-sm text-slate-500">आपकी निजी Creator Reference ID</p><p className="mt-2 break-all rounded-xl bg-emerald-50 p-4 font-mono text-lg text-emerald-900">{poll.creatorReference || 'इस पुराने पोल की reference उपलब्ध नहीं है।'}</p><p className="mt-4 text-sm leading-8 text-slate-600">इस ID को सुरक्षित रखें। Admin को deletion या सहायता के लिए यही ID दें। केवल ID जानने से किसी को edit/delete का अधिकार नहीं मिलता; ownership की जाँच होगी। Guest creator के लिए यही browser और उसकी cookie सुरक्षित रखें। यह public share link से अलग है।</p><div className="mt-6 flex flex-wrap gap-3"><Link href={`/poll/${poll.id}`} className="rounded-xl bg-emerald-800 px-5 py-3 text-white">पोल देखें और share करें</Link><Link href="/my-polls" className="rounded-xl border px-5 py-3 text-emerald-800">मेरे पोल</Link></div></section></main>;
}
