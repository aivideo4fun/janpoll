import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Poll location audit | JanPoll Admin', robots: { index: false, follow: false } };
export default async function LocationAudit() {
  if (!(await isAdmin())) redirect('/admin');
  const polls = await db.poll.findMany({ where: { OR: [{ stateCode: 'RJ' }, { stateCode: null, OR: [{ districtId: { not: null } }, { districtName: { not: null } }] }] },
    select: { id: true, question: true, creatorReference: true, districtName: true, samitiName: true, gramPanchayatName: true, districtId: true, samitiId: true, gramPanchayatId: true, active: true, electionType: true,
      district: { select: { nameHi: true } }, samiti: { select: { nameHi: true, tehsil: { select: { nameHi: true } } } },
    }, orderBy: { createdAt: 'desc' } });
  const groups = new Map<string, number>();
  for (const poll of polls) {
    const label = [poll.district?.nameHi || poll.districtName || 'जिला उपलब्ध नहीं', poll.samiti?.tehsil?.nameHi || 'तहसील mapping नहीं', poll.samiti?.nameHi || poll.samitiName || 'समिति उपलब्ध नहीं'].join(' · ');
    groups.set(label, (groups.get(label) || 0) + 1);
  }
  return <main lang="hi" className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-6xl"><Link href="/admin" className="text-emerald-800">← Admin</Link><h1 className="mt-5 text-2xl font-semibold">राजस्थान: Poll location audit</h1><p className="mt-3 text-sm leading-7">{polls.length} polls · सक्रिय और निष्क्रिय दोनों। पुराने records में ID mapping न होने पर उपलब्ध नाम दिखाए गए हैं। तहसील समिति की relation से प्राप्त होती है; खाली mapping का अनुमान नहीं लगाया गया है।</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{Array.from(groups.entries()).map(([label,count]) => <p key={label} className="rounded-xl border bg-white p-4 text-sm leading-7">{label} <strong>· {count} polls</strong></p>)}</div><div className="mt-7 space-y-3">{polls.map(poll => <article key={poll.id} className="rounded-xl border bg-white p-4"><Link href={`/poll/${poll.id}`} className="font-semibold text-emerald-800">{poll.question}</Link><p className="mt-2 text-sm leading-7">{poll.district?.nameHi || poll.districtName || 'जिला नहीं'} · {poll.samiti?.nameHi || poll.samitiName || 'समिति नहीं'} · {poll.gramPanchayatName || 'पंचायत नहीं'} · {poll.active ? 'Active' : 'Inactive'}</p><p className="mt-2 break-all text-xs">Reference: {poll.creatorReference || 'पुराना record'} · Type: {poll.electionType || 'Public'} · District ID: {poll.districtId || 'Missing'} · Samiti ID: {poll.samitiId || 'Missing'} · GP ID: {poll.gramPanchayatId || 'Missing'}</p></article>)}</div></div></main>;
}
