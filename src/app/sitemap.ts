import { MetadataRoute } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import { db } from '@/lib/db';

import { REGIONS, regionHref } from '@/lib/regions';

export const dynamic = 'force-dynamic';

const baseUrl = 'https://janpoll.in';

// Hindi जैसे अक्षरों वाले slug को URL-सुरक्षित बनाना (पहले से encoded हो तो वैसे ही रखना)
function safeSegment(value: string) {
  return /%[0-9a-f]{2}/i.test(value) ? value : encodeURIComponent(value);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // हर बार ताज़ा डेटा (build के समय सूची जमी न रहे)
  noStore();

  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/rajasthan`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/closed-polls`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.4,
    },

  ];

  let districtUrls: MetadataRoute.Sitemap = [];
  let pollUrls: MetadataRoute.Sitemap = [];

  // जिलों के पेज
  try {
    const districts = await db.district.findMany({ where: { OR: [{ stateCode: 'RJ' }, { stateCode: null }] }, select: { nameEn: true } });
    districtUrls = districts.map((district) => ({
      url: `${baseUrl}/rajasthan/${encodeURIComponent(district.nameEn.toLowerCase())}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('sitemap: जिले लोड करने में त्रुटि:', error);
  }

  // सभी एक्टिव पोल्स (एक sitemap में अधिकतम 50,000 URL की सीमा है)
  try {
    const polls = await db.poll.findMany({
      where: { active: true },
      select: { id: true, slug: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 45000,
    });

    pollUrls = polls.map((poll) => ({
      url: `${baseUrl}/poll/${poll.id}`,
      lastModified: new Date(poll.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('sitemap: पोल लोड करने में त्रुटि:', error);
  }

  const articles = await db.article.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }).catch(() => []);
  const urls = [...staticUrls, ...REGIONS.map(region => ({ url: baseUrl + regionHref(region) })), ...['/articles','/advertise','/editorial-policy','/about','/contact','/privacy-policy','/terms','/disclaimer','/faq','/how-it-works'].map(path=>({url:baseUrl+path})), ...articles.map(article => ({ url: baseUrl + '/articles/' + article.slug, lastModified: article.updatedAt })), ...districtUrls, ...pollUrls];
  return Array.from(new Map(urls.map(item=>[item.url,item])).values());
}