import 'server-only';
import { db } from '@/lib/db';
export type HomeVideo = { id: string; title: string; videoId: string; description: string; sortOrder: number; published: boolean; createdAt: Date; updatedAt: Date };
// Parameterized SQL keeps this additive module independent of the generated Prisma client.
export async function publishedVideos(limit = 4): Promise<HomeVideo[]> {
  return db.$queryRaw<HomeVideo[]>`SELECT * FROM "HomeVideo" WHERE "published" = true ORDER BY "sortOrder" ASC, "createdAt" DESC LIMIT ${Math.min(24, Math.max(1, limit))}`;
}
export async function adminVideos(): Promise<HomeVideo[]> {
  return db.$queryRaw<HomeVideo[]>`SELECT * FROM "HomeVideo" ORDER BY "sortOrder" ASC, "createdAt" DESC LIMIT 200`;
}
