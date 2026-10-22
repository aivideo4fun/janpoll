import { db } from '@/lib/db';
export default async function HomeAnnouncements() {
  const updates = await db.announcement.findMany({where:{active:true,ticker:false},orderBy:{createdAt:'desc'},take:3}).catch(()=>[]);
  if (!updates.length) return null;
  return <section className="jh-panel" aria-label="मंच की नई जानकारी"><h2>मंच की नई जानकारी</h2><div className="jh-news-grid" style={{marginTop:16}}>{updates.map(item=><article key={item.id} className="jh-empty"><h3>{item.title}</h3><p style={{whiteSpace:'pre-line',marginTop:8}}>{item.body}</p>{item.href&&<a href={item.href} className="jh-text-link">और जानें →</a>}</article>)}</div></section>;
}
