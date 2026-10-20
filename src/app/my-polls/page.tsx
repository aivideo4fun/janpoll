import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ownerWhere } from '@/lib/polls/owner';
import { requestDeletion, requestDeactivation } from './actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'मेरे पोल | JanPoll India', robots: { index: false, follow: false } };
const pendingStatuses = ['REQUESTED', 'DEACTIVATION_REQUESTED'];
function requestLabel(status: string) {
  if (status === 'REQUESTED') return 'Delete request admin के निर्णय के लिए लंबित है।';
  if (status === 'DEACTIVATION_REQUESTED') return 'Deactivate request admin के निर्णय के लिए लंबित है।';
  if (status === 'REJECTED') return 'Admin ने पिछली request अस्वीकार की है।';
  if (status === 'APPROVED') return 'Admin ने deactivate request स्वीकार की है।';
  return 'कोई request लंबित नहीं है।';
}
export default async function MyPolls({ searchParams: queryPromise = Promise.resolve({}) }: { searchParams?: Promise<{ page?: string }> }) {
  const searchParams = await queryPromise;
  const owner = await ownerWhere();
  if (!owner) redirect('/api/auth/signin?callbackUrl=%2Fmy-polls');
  const parsed = Number(searchParams.page || 1);
  const page = Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 10000) : 1;
  const polls = await db.poll.findMany({ where: { ...owner }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page-1)*20, take: 20, select: { id: true, question: true, creatorReference: true, deletionStatus: true, active: true } });
  return <main lang="hi" className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-3xl"><Link href="/profile" className="text-emerald-800">← प्रोफाइल</Link><h1 className="mt-5 text-3xl font-semibold text-emerald-950">मेरे पोल</h1><p className="mt-3 text-sm leading-8 text-slate-600">आप केवल deactivate या delete की request भेज सकते हैं। अंतिम निर्णय और कार्रवाई admin करेगा; request भेजने से पोल बंद या delete नहीं होगा। Reference ID केवल आपको और admin को दिखाई जाती है। सामान्य deletion request: ₹199 + लागू GST। यहाँ payment नहीं लिया जाता; टीम ownership और शुल्क की पुष्टि के बाद निर्देश देगी। Privacy या गैरकानूनी सामग्री की शिकायत के लिए payment आवश्यक नहीं है।</p><div className="mt-6 space-y-4">{polls.length === 0 && <p>इस पेज पर कोई पोल नहीं है।</p>}{polls.map(poll => <article key={poll.id} className="rounded-2xl border border-emerald-100 bg-white p-5"><Link href={`/poll/${poll.id}`} className="text-lg font-semibold leading-9 text-emerald-900">{poll.question}</Link><p className="mt-3 break-all font-mono text-sm">{poll.creatorReference || 'पुराना पोल: reference उपलब्ध नहीं'}</p><p className="mt-2 text-sm text-slate-500">{poll.active ? 'सक्रिय' : 'निष्क्रिय'} · {requestLabel(poll.deletionStatus)}</p>{poll.creatorReference && <div className="mt-4 flex flex-wrap gap-3">{poll.active && !pendingStatuses.includes(poll.deletionStatus) && <form action={requestDeactivation}><input type="hidden" name="reference" value={poll.creatorReference}/><button className="min-h-11 rounded-xl border px-4 text-sm">Deactivate request भेजें</button></form>}{!pendingStatuses.includes(poll.deletionStatus) && <form action={requestDeletion}><input type="hidden" name="reference" value={poll.creatorReference}/><button className="min-h-11 rounded-xl bg-emerald-800 px-4 text-sm text-white">Deletion request भेजें</button></form>}</div>}</article>)}</div><nav className="mt-6 flex gap-5">{page>1 && <Link href={`/my-polls?page=${page-1}`}>← पिछला</Link>}{polls.length===20 && <Link href={`/my-polls?page=${page+1}`}>अगला →</Link>}</nav></div></main>;
}
