import Link from 'next/link';
import { db } from '@/lib/db';
export const dynamic='force-dynamic';
export const metadata={title:'लेख और विश्लेषण | JanPoll India',alternates:{canonical:'/articles'}};
export default async function ArticlesPage(){
  const articles=await db.article.findMany({where:{published:true},orderBy:{publishedAt:'desc'},take:100,select:{id:true,slug:true,title:true,author:true,publishedAt:true,summary:true}});
  return <main lang="hi" className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-4xl"><Link href="/">← होम</Link><h1 className="mt-6 text-3xl font-semibold leading-relaxed text-emerald-950">लेख और विश्लेषण</h1><div className="mt-7 grid gap-5 sm:grid-cols-2">{!articles.length&&<p>अभी कोई लेख प्रकाशित नहीं है।</p>}{articles.map(article=><article key={article.id} className="rounded-2xl border border-emerald-100 bg-white p-6"><p className="text-xs leading-7 text-slate-500">{article.author} · {article.publishedAt?.toLocaleDateString('hi-IN')}</p><h2 className="mt-3 text-xl font-semibold leading-9 text-emerald-950"><Link href={`/articles/${article.slug}`}>{article.title}</Link></h2><p className="mt-3 text-sm leading-8 text-slate-600">{article.summary}</p><Link href={`/articles/${article.slug}`} className="mt-4 inline-flex min-h-11 items-center text-emerald-800">लेख पढ़ें →</Link></article>)}</div></div></main>;
}
