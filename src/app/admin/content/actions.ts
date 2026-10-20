'use server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { articleImage } from '@/lib/article-image';
import { articles } from '@/lib/articles';
const text = (form: FormData, name: string) => String(form.get(name) || '').trim();
const articleSchema = z.object({ title: z.string().min(5).max(250), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160), author: z.string().min(2).max(120), summary: z.string().min(10).max(600), content: z.string().min(100).max(100000), sources: z.string().max(10000), coverAlt: z.string().max(250) });
function safeUrl(value: string) { if (!value) return; const url = new URL(value, 'https://janpoll.in'); if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid URL'); }
function refresh() { revalidatePath('/', 'layout'); }
export async function saveArticle(form: FormData) {
  if (!(await isAdmin())) throw new Error('Unauthorized');
  let message = 'Article saved.';
  try {
    const input = articleSchema.parse(Object.fromEntries(['title','slug','author','summary','content','sources','coverAlt'].map(key => [key, text(form,key)])));
    input.sources.split(/\r?\n/).filter(Boolean).forEach(value => { if (!/^https?:\/\//.test(value)) throw new Error('Absolute source URL required'); safeUrl(value); });
    const coverImage = await articleImage(form);
    const id = text(form,'id'); const published = form.get('published') === 'on';
    if (id) {
      const old = await db.article.findUniqueOrThrow({ where: { id }, select: { publishedAt: true } });
      await db.article.update({ where: { id }, data: { ...input, coverImage, published, publishedAt: published ? old.publishedAt || new Date() : old.publishedAt } });
    } else await db.article.create({ data: { ...input, coverImage, published, publishedAt: published ? new Date() : null } });
    refresh();
  } catch { message = 'Save failed. Check required fields, source URLs, image (JPEG/PNG/WebP, max 750 KB) and unique slug.'; }
  redirect('/admin/content?msg='+encodeURIComponent(message));
}
export async function deleteArticle(form: FormData) {
  if (!(await isAdmin()) || form.get('confirm') !== 'on') throw new Error('Confirmation required');
  await db.article.delete({ where: { id: text(form,'id') } }); refresh(); redirect('/admin/content?msg=Article+deleted');
}
export async function importStarterArticles() {
  if (!(await isAdmin())) throw new Error('Unauthorized');
  for (const article of articles) await db.article.upsert({ where: { slug: article.slug }, update: {}, create: { slug: article.slug, title: article.title, summary: article.summary, author: article.author, content: article.sections.map(s => '## '+s.title+'\n'+s.text).join('\n\n'), sources: article.sources.map(s=>s.url).join('\n'), published: false } });
  redirect('/admin/content?msg=Starter+articles+imported+as+drafts');
}
export async function saveAnnouncement(form: FormData) {
  if (!(await isAdmin())) throw new Error('Unauthorized');
  let message = 'Update saved.';
  try {
    const input = z.object({ title: z.string().min(3).max(200), body: z.string().min(3).max(1000), href: z.string().max(500) }).parse({title:text(form,'title'), body:text(form,'body'), href:text(form,'href')});
    safeUrl(input.href); const id=text(form,'id'); const data={...input,href:input.href||null,active:form.get('active')==='on',ticker:form.get('ticker')==='on',tickerOrder:z.coerce.number().int().min(0).max(999).parse(text(form,'tickerOrder')||'0'),tickerSpeed:z.coerce.number().int().min(15).max(120).parse(text(form,'tickerSpeed')||'45')};
    if (id) await db.announcement.update({where:{id},data}); else await db.announcement.create({data}); refresh();
  } catch { message='Update failed. Check fields and URL.'; }
  redirect('/admin/content?msg='+encodeURIComponent(message));
}
export async function deleteAnnouncement(form: FormData) {
  if (!(await isAdmin()) || form.get('confirm') !== 'on') throw new Error('Confirmation required');
  await db.announcement.delete({where:{id:text(form,'id')}});refresh();redirect('/admin/content');
}
