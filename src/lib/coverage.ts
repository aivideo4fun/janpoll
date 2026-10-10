import 'server-only';
import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';

export type DistrictCoverage = {
  id: string;
  nameHi: string;
  nameEn: string;
  totalGp: number;
  gpWithRunning: number;
  gpWithAny: number;
  runningPolls: number;
  totalPolls: number;
  samitis: number;
  wards: number;
};

export type CoverageData = {
  totals: {
    totalGp: number;
    gpWithRunning: number;
    gpWithAny: number;
    runningPolls: number;
    totalPolls: number;
    samitis: number;
    wards: number;
  };
  rows: DistrictCoverage[];
  unmappedIds: string[];
};

export type GpPollStat = { any: number; running: number };

const pollSelect = {
  id: true,
  active: true,
  createdAt: true,
  deadlineDays: true,
  gramPanchayatId: true,
  districtName: true,
} as const;

export async function getCoverage(): Promise<CoverageData> {
  const [districts, gps, polls, samitiGroups, wardGroups] = await Promise.all([
    db.district.findMany({
      select: { id: true, nameHi: true, nameEn: true },
      orderBy: { nameEn: 'asc' },
    }),
    db.gramPanchayat.findMany({ select: { id: true, districtId: true } }),
    db.poll.findMany({ select: pollSelect, orderBy: { createdAt: 'desc' } }),
    db.panchayatSamiti.groupBy({ by: ['districtId'], _count: { _all: true } }),
    db.zilaParishadWard.groupBy({ by: ['districtId'], _count: { _all: true } }),
  ]);

  const gpDistrict = new Map<string, string>();
  for (const g of gps) gpDistrict.set(g.id, g.districtId);

  const nameToDistrict = new Map<string, string>();
  for (const d of districts) {
    nameToDistrict.set(d.nameHi.trim().toLowerCase(), d.id);
    nameToDistrict.set(d.nameEn.trim().toLowerCase(), d.id);
  }

  const rowMap = new Map<string, DistrictCoverage>();
  for (const d of districts) {
    rowMap.set(d.id, {
      id: d.id,
      nameHi: d.nameHi,
      nameEn: d.nameEn,
      totalGp: 0,
      gpWithRunning: 0,
      gpWithAny: 0,
      runningPolls: 0,
      totalPolls: 0,
      samitis: 0,
      wards: 0,
    });
  }

  for (const s of samitiGroups) {
    const row = rowMap.get(s.districtId);
    if (row) row.samitis = s._count._all;
  }
  for (const w of wardGroups) {
    const row = rowMap.get(w.districtId);
    if (row) row.wards = w._count._all;
  }

  const gpStats = new Map<string, GpPollStat>();
  const unmappedIds: string[] = [];
  let runningPolls = 0;

  for (const p of polls) {
    const open = isPollOpen(p);
    if (open) runningPolls++;

    let districtId: string | null = null;

    if (p.gramPanchayatId && gpDistrict.has(p.gramPanchayatId)) {
      districtId = gpDistrict.get(p.gramPanchayatId) ?? null;
      const stat = gpStats.get(p.gramPanchayatId) ?? { any: 0, running: 0 };
      stat.any++;
      if (open) stat.running++;
      gpStats.set(p.gramPanchayatId, stat);
    } else {
      unmappedIds.push(p.id);
      if (p.districtName) {
        districtId = nameToDistrict.get(p.districtName.trim().toLowerCase()) ?? null;
      }
    }

    if (districtId) {
      const row = rowMap.get(districtId);
      if (row) {
        row.totalPolls++;
        if (open) row.runningPolls++;
      }
    }
  }

  let gpWithRunning = 0;
  let gpWithAny = 0;

  for (const g of gps) {
    const row = rowMap.get(g.districtId);
    if (!row) continue;
    row.totalGp++;
    const stat = gpStats.get(g.id);
    if (stat) {
      row.gpWithAny++;
      gpWithAny++;
      if (stat.running > 0) {
        row.gpWithRunning++;
        gpWithRunning++;
      }
    }
  }

  const rows = Array.from(rowMap.values());

  return {
    totals: {
      totalGp: gps.length,
      gpWithRunning,
      gpWithAny,
      runningPolls,
      totalPolls: polls.length,
      samitis: rows.reduce((sum, r) => sum + r.samitis, 0),
      wards: rows.reduce((sum, r) => sum + r.wards, 0),
    },
    rows,
    unmappedIds,
  };
}

/** जिन पोल्स का पंचायत से मेल नहीं (सबसे नए पहले) */
export async function getUnmappedPolls(ids: string[], limit = 100) {
  if (ids.length === 0) return [];

  return db.poll.findMany({
    where: { id: { in: ids.slice(0, limit) } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      question: true,
      districtName: true,
      samitiName: true,
      gramPanchayatName: true,
      createdAt: true,
      active: true,
      options: { select: { voteCount: true } },
    },
  });
}

/** एक्सपोर्ट के लिए: हर पंचायत के कुल/चालू पोल */
export async function getGpStatsMap(): Promise<Map<string, GpPollStat>> {
  const [gps, polls] = await Promise.all([
    db.gramPanchayat.findMany({ select: { id: true } }),
    db.poll.findMany({ select: pollSelect }),
  ]);

  const known = new Set(gps.map((g) => g.id));
  const map = new Map<string, GpPollStat>();

  for (const p of polls) {
    if (!p.gramPanchayatId || !known.has(p.gramPanchayatId)) continue;
    const stat = map.get(p.gramPanchayatId) ?? { any: 0, running: 0 };
    stat.any++;
    if (isPollOpen(p)) stat.running++;
    map.set(p.gramPanchayatId, stat);
  }

  return map;
}
