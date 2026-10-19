import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { REGIONS } from '@/lib/regions';
import { formatIndiaDate } from '@/lib/format-india';
import PollsList from '../components/PollsList';
import { editPoll,deletePoll,addPollOption } from '../actions/adminActions';
export const dynamic='force-dynamic';
export const metadata={title:'State Poll Manager | JanPoll Admin',robots:{index:false,follow:false}};
export default async function StatePollManager({searchParams={}}:{searchParams?:{state?:string;search?:string;status?:string;page?:string}}){
  if(!(await isAdmin()))redirect('/admin');
  const state=REGIONS.find(r=>r.code===searchParams.state)?.code||'';
  const search=(searchParams.search||'').trim().slice(0,100); const parsed=Number(searchParams.page||1);const page=Number.isSafeInteger(parsed)&&parsed>0?Math.min(parsed,10000):1;
  const where:Prisma.PollWhereInput={AND:[...(state?[state==='RJ'?{OR:[{stateCode:'RJ'},{stateCode:null,OR:[{districtId:{not:null}},{districtName:{not:null}}]}]}:{stateCode:state}]:[]),...(search?[{OR:[{question:{contains:search,mode:'insensitive' as const}},{creatorReference:search},{id:search}]}]:[]),...(searchParams.status==='active'?[{active:true}]:searchParams.status==='inactive'?[{active:false}]:searchParams.status==='deletion'?[{deletionStatus:'REQUESTED'}]:[])]};
  const [polls,count]=await Promise.all([db.poll.findMany({where,include:{options:{orderBy:{order:'asc'}}},orderBy:[{createdAt:'desc'},{id:'asc'}],skip:(page-1)*20,take:20}),db.poll.count({where})]);
  const query=new URLSearchParams({state,search,status:searchParams.status||''});
  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-6xl"><Link href="/admin" className="text-emerald-800">← Dashboard</Link><h1 className="mt-5 text-3xl font-semibold text-emerald-950">State Poll Manager</h1><p className="mt-3 text-sm leading-7 text-slate-500">राज्य चुनें, poll खोजें और उसके content/status को manage करें। Vote count बदलने का कोई input नहीं है।</p><form className="my-6 grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-4"><select name="state" defaultValue={state} aria-label="State" className="min-h-12 rounded-xl border px-3"><option value="">सभी राज्य</option>{REGIONS.map(r=><option key={r.code} value={r.code}>{r.name}</option>)}</select><select name="status" defaultValue={searchParams.status||''} aria-label="Status" className="min-h-12 rounded-xl border px-3"><option value="">सभी status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="deletion">Deletion requested</option></select><input name="search" defaultValue={search} placeholder="Question / Reference ID" aria-label="Search polls" className="min-h-12 rounded-xl border px-3"/><button className="min-h-12 rounded-xl bg-emerald-800 px-5 text-white">खोजें</button></form><PollsList polls={polls} totalPolls={count} searchQuery={search} currentPage={page} totalPages={1} deletePoll={deletePoll} editPoll={editPoll} addPollOption={addPollOption} formatIndiaDate={formatIndiaDate}/><nav className="mt-6 flex justify-between text-sm text-emerald-800">{page>1?<Link href={`/admin/polls?${query}&page=${page-1}`}>← पिछला</Link>:<span/>}<span>{page} / {Math.max(1,Math.ceil(count/20))}</span>{page*20<count?<Link href={`/admin/polls?${query}&page=${page+1}`}>अगला →</Link>:<span/>}</nav></div></main>;
}
