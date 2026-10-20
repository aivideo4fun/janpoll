import { db } from '@/lib/db';
import RajasthanForm from './RajasthanForm';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'राजस्थान में पोल बनाएँ | JanPoll India' };
export default async function Page({ searchParams: queryPromise = Promise.resolve({}) }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await queryPromise;
  const read = (key: string) => {
    const value = searchParams[key];
    return (Array.isArray(value) ? value[0] : value) || '';
  };
  let districtId = read('districtId');
  let samitiId = read('samitiId');
  const gpId = read('gramPanchayatId') || read('gpId');
  const zilaWardId = read('zilaWardId');
  const samitiWardId = read('samitiWardId');
  const category = read('category');
  const type = zilaWardId || category === 'zila-parishad' ? 'zila'
    : category === 'mandal' || samitiWardId ? 'samiti'
    : ['sarpanch', 'samiti', 'zila'].includes(read('electionType')) ? read('electionType') : 'sarpanch';
  if (gpId) {
    const gp = await db.gramPanchayat.findUnique({ where: { id: gpId }, select: { districtId: true, samitiId: true } });
    if (gp) { districtId = gp.districtId; samitiId = gp.samitiId; }
  } else if (zilaWardId) {
    const ward = await db.zilaParishadWard.findUnique({ where: { id: zilaWardId }, select: { districtId: true } });
    if (ward) districtId = ward.districtId;
  } else if (samitiId) {
    const samiti = await db.panchayatSamiti.findUnique({ where: { id: samitiId }, select: { districtId: true } });
    if (samiti) districtId = samiti.districtId;
  } else if (!districtId && read('district')) {
    const district = await db.district.findFirst({ where: {
      OR: [{ stateCode: 'RJ' }, { stateCode: null }],
      AND: [{ OR: [{ nameHi: read('district') }, { nameEn: { equals: read('district'), mode: 'insensitive' } }] }],
    }, select: { id: true } });
    if (district) districtId = district.id;
  }
  return <RajasthanForm initial={{ districtId, samitiId, gpId, zilaWardId, samitiWardId, type }} />;
}
