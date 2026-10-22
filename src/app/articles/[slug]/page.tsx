import ArticleCover from '@/components/ArticleCover';
import ArticleBody from '@/components/home/ArticleBody';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const { slug } = await params;
  const article=await db.article.findFirst({where:{slug:slug,published:true},select:{title:true,summary:true,coverImage:true,coverAlt:true,slug:true}});
  return article?{title:`${article.title} | JanPoll India`,description:article.summary,keywords:[article.title,'JanPoll India','articles'],openGraph:{images:article.coverImage?[article.coverImage]:[]},alternates:{canonical:`/articles/${article.slug}`}}:{title:'Article not found',robots:{index:false}};
}
export default async function ArticlePage({params}:{params:Promise<{slug:string}>}){
  const { slug } = await params;
  const article=await db.article.findFirst({where:{slug:slug,published:true}});if(!article)notFound();
  const articleLanguage=/[\u0900-\u097f]/.test(article.content)?'hi':undefined;
  const sources=article.sources.split(/\r?\n/).filter(url=>/^https?:\/\//.test(url));
  const structured = { '@context': 'https://schema.org', '@type': 'Article', headline: article.title, image: article.coverImage || undefined, author: { '@type': 'Organization', name: article.author }, datePublished: article.publishedAt?.toISOString(), dateModified: article.updatedAt.toISOString(), mainEntityOfPage: 'https://janpoll.in/articles/' + article.slug };
  return <main lang="en" className="bg-slate-50 px-4 py-10"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }}/><article className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-5 sm:p-10"><Link href="/articles">← All articles</Link><h1 className="mt-6 text-3xl font-semibold leading-relaxed text-emerald-950">{article.title}</h1><p className="mt-4 text-sm leading-7 text-slate-500">Author: {article.author} · {article.publishedAt?.toLocaleDateString('en-IN', {timeZone:'Asia/Kolkata'})}</p><figure className="mt-7"><ArticleCover src={article.coverImage} alt={article.coverAlt||article.title}/></figure><p className="mt-6 text-lg leading-9 text-slate-700">{article.summary}</p><div lang={articleLanguage} className="mt-7"><ArticleBody content={article.content} /></div><section className="mt-9 border-t pt-6"><h2 className="font-semibold text-emerald-900">Sources & references</h2>{sources.map(url=><a key={url} href={url} target="_blank" rel="noopener noreferrer" className="mt-3 block break-all text-sm leading-7 text-emerald-800 underline">{url}</a>)}<Link href="/contact" className="mt-5 inline-block text-sm text-emerald-800">Send a correction or feedback →</Link></section></article></main>;
}
