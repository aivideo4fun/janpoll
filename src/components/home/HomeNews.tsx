import Link from 'next/link';
import { db } from '@/lib/db';
import ArticleCover from '@/components/ArticleCover';
export default async function HomeNews() {
  const articles = await db.article.findMany({ where: { published: true }, orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], take: 4, select: { id:true, title:true, slug:true, summary:true, coverImage:true, coverAlt:true, publishedAt:true } }).catch(error => { console.error('Homepage news unavailable', error.code || error.message); return []; });
  return <section className="jh-panel" aria-labelledby="jh-news-title"><div className="jh-section-head"><div><span className="jh-kicker">पढ़ें और समझें</span><h2 id="jh-news-title">JanPoll समाचार और लेख</h2></div><Link href="/articles" className="jh-text-link">सभी समाचार →</Link></div>
    {articles.length ? <div className="jh-news-grid">{articles.map(item => <article className="jh-news-card" key={item.id}><Link href={`/articles/${item.slug}`} className="jh-news-image" tabIndex={-1} aria-hidden="true"><ArticleCover src={item.coverImage} alt={item.coverAlt || item.title} /></Link><div><p className="jh-meta">{item.publishedAt?.toLocaleDateString('hi-IN', { timeZone:'Asia/Kolkata' })}</p><h3><Link href={`/articles/${item.slug}`}>{item.title}</Link></h3><p className="jh-news-summary">{item.summary}</p><Link href={`/articles/${item.slug}`} className="jh-text-link">पढ़ें →</Link></div></article>)}</div> : <p className="jh-empty">प्रकाशित समाचार और लेख यहाँ दिखाई देंगे।</p>}
  </section>;
}
