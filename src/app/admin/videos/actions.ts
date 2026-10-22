'use server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { youtubeId } from '@/lib/home/youtube';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
const value = (form: FormData, name: string) => String(form.get(name) || '').trim();
function refresh() { revalidatePath('/'); revalidatePath('/videos'); revalidatePath('/admin/videos'); }
export async function saveVideo(form: FormData) {
  if (!(await isAdmin())) throw new Error('Unauthorized');
  let message = 'वीडियो सेव हो गया।';
  try {
    const title = z.string().min(3).max(180).parse(value(form, 'title'));
    const description = z.string().max(600).parse(value(form, 'description'));
    const id = z.string().max(100).parse(value(form, 'id'));
    const videoId = youtubeId(value(form, 'url'));
    if (!videoId) throw new Error('Invalid YouTube URL');
    const order = z.coerce.number().int().min(0).max(999).parse(value(form, 'sortOrder') || '0');
    const published = form.get('published') === 'on';
    if (id) {
      const count = await db.$executeRaw`UPDATE "HomeVideo" SET "title"=${title}, "videoId"=${videoId}, "description"=${description}, "sortOrder"=${order}, "published"=${published}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id}`;
      if (count !== 1) throw new Error('Video not found');
    } else {
      await db.$executeRaw`INSERT INTO "HomeVideo" ("id","title","videoId","description","sortOrder","published") VALUES (${randomUUID()},${title},${videoId},${description},${order},${published})`;
    }
    refresh();
  } catch { message = 'वीडियो सेव नहीं हुआ। YouTube link, title और database setup जांचें।'; }
  redirect('/admin/videos?msg=' + encodeURIComponent(message));
}
export async function deleteVideo(form: FormData) {
  if (!(await isAdmin())) throw new Error('Unauthorized');
  if (form.get('confirm') !== 'on') throw new Error('Confirmation required');
  const id = z.string().min(1).max(100).parse(value(form, 'id'));
  await db.$executeRaw`DELETE FROM "HomeVideo" WHERE "id"=${id}`;
  refresh(); redirect('/admin/videos?msg=' + encodeURIComponent('वीडियो हटाया गया।'));
}
