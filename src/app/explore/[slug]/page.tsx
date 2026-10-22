import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getRegionBySlug, createHref } from '@/lib/regions';
import { isPollOpen } from '@/lib/poll-utils';
import StateArt from '@/components/home/StateArt';
import '../../janpoll-home.css';
export const dynamic = 'force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const region=getRegionBySlug(slug);
  return {title:region ? `${region.name} के पोल | JanPoll` : 'राज्य नहीं मिला',alternates:{canonical:`/explore/${slug}`}};
}
export default async function ExploreState({params,searchParams}:{params:Promise<{slug:string}>;searchParams?:Promise<{page?:string}>}) {
  const {slug}=await params;const region=getRegionBySlug(slug);if(!region)notFound();
  const requested=Number((await searchParams)?.page || 1);const page=Number.isFinite(requested)?Math.min(1000,Math.max(1,Math.floor(requested))):1;
  const polls=await db.poll.findMany({where:{active:true,stateCode:region.code},orderBy:[{createdAt:'desc'},{id:'desc'}],skip:(page-1)*24,take:25,select:{id:true,slug:true,question:true,active:true,createdAt:true,deadlineDays:true}});
  const hasNext=polls.length>24;
  return <main className="jh-home" lang="hi"><div className="jh-shell"><section className="jh-panel"><Link href="/" className="jh-text-link">← होम</Link><div className="jh-rajasthan-content"><div style={{maxWidth:180}}><StateArt code={region.code} variant="explore" /></div><div><h1>{region.name} के पोल</h1><div className="jh-actions"><Link className="jh-button jh-primary" href={createHref(region)}>अपना पोल बनाएं</Link></div></div></div></section><section className="jh-panel"><div className="jh-poll-grid">{polls.slice(0,24).map(poll=><article className="jp-poll-card" key={poll.id}><h2 style={{fontSize:18}}><Link href={`/poll/${poll.id}${poll.slug?`/${encodeURIComponent(poll.slug)}`:''}`}>{poll.question}</Link></h2><div className="jp-card-bottom"><span>{region.name}</span><Link className="jp-card-action" href={`/poll/${poll.id}`}>{isPollOpen(poll)?'राय दें':'परिणाम देखें'} →</Link></div></article>)}</div>{!polls.length&&<p className="jh-empty">यहाँ अभी कोई पोल नहीं है। पहला सवाल आप जोड़ें।</p>}<nav aria-label="अगला पृष्ठ" className="jh-actions" style={{marginTop:20}}>{page>1&&<Link className="jh-button jh-secondary" href={`/explore/${slug}?page=${page-1}`}>← पिछला पृष्ठ</Link>}{hasNext&&<Link className="jh-button jh-secondary" href={`/explore/${slug}?page=${page+1}`}>अगला पृष्ठ →</Link>}</nav></section></div></main>;
}
