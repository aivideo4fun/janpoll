import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { getRegionByCode, regionHref } from '@/lib/regions';

export const getTrendingStates = unstable_cache(async () => {
  // Counter totals are platform activity, not unique people or ad impressions.
  // Known legacy Rajasthan location records remain visible without rewriting data.
  const rows = await db.$queryRaw<Array<{ stateCode: string | null; votes: bigint; activePolls: bigint }>>`
    SELECT CASE
      WHEN NULLIF(p."stateCode", '') IS NOT NULL THEN p."stateCode"
      WHEN p."districtId" IS NOT NULL OR NULLIF(p."districtName", '') IS NOT NULL
        OR p."samitiId" IS NOT NULL OR p."gramPanchayatId" IS NOT NULL THEN 'RJ'
      ELSE NULL END AS "stateCode",
      COALESCE(SUM(o."voteCount"), 0)::bigint AS votes,
      COUNT(DISTINCT CASE WHEN p.active THEN p.id END)::bigint AS "activePolls"
    FROM "Poll" p LEFT JOIN "PollOption" o ON o."pollId" = p.id
    GROUP BY 1
    HAVING COALESCE(SUM(o."voteCount"), 0) > 0
    ORDER BY votes DESC, "stateCode" ASC
  `;
  return rows.flatMap(row => {
    const region = getRegionByCode(row.stateCode);
    return region ? [{ code: region.code, name: region.name, en: region.en, href: regionHref(region), votes: Number(row.votes), activePolls: Number(row.activePolls) }] : [];
  });
}, ['janpoll-trending-states-v1'], { revalidate: 60, tags: ['trending-states'] });
