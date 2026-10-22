import 'server-only';
import { db } from '@/lib/db';
import type { Catalog } from './poll-locations';
export async function loadLocationCatalog(): Promise<Catalog> {
  const [districts, tehsils, samitis, gps] = await Promise.all([
    db.district.findMany({ select: { id: true, nameHi: true, nameEn: true, stateCode: true }, orderBy: { nameHi: 'asc' } }),
    db.tehsil.findMany({ select: { id: true, nameHi: true, nameEn: true, districtId: true }, orderBy: { nameHi: 'asc' } }),
    db.panchayatSamiti.findMany({ select: { id: true, nameHi: true, nameEn: true, districtId: true, tehsilId: true }, orderBy: { nameHi: 'asc' } }),
    db.gramPanchayat.findMany({ select: { id: true, nameHi: true, nameEn: true, districtId: true, samitiId: true }, orderBy: { nameHi: 'asc' } }),
  ]);
  return { districts, tehsils, samitis, gps };
}
