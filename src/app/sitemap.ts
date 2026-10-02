import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://janpoll.in';

  // डेटाबेस से सभी एक्टिव पोल्स लाएं
  const polls = await db.poll.findMany({
    where: { active: true },
    select: { id: true, slug: true, createdAt: true },
  });

  const pollUrls = polls.map((poll) => ({
    url: `${baseUrl}/poll/${poll.id}${poll.slug ? `/${poll.slug}` : ''}`,
    lastModified: new Date(poll.createdAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...pollUrls,
  ];
}