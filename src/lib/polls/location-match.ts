import { normalizeName } from '@/lib/location';
type Names = { id: string; nameHi: string; nameEn: string };
type LocationPoll = { stateCode?: string | null; gramPanchayatId?: string | null; gramPanchayatName?: string | null; districtId?: string | null; districtName?: string | null; samitiId?: string | null; samitiName?: string | null };
export function matchesGramPanchayat(poll: LocationPoll, gp: Names, samiti: Names, district: Names) {
  if (poll.stateCode && poll.stateCode !== 'RJ') return false;
  if (poll.gramPanchayatId) return poll.gramPanchayatId === gp.id;
  if (!poll.gramPanchayatName) return false;
  const named = (names: Names, value?: string | null) => Boolean(value) && [names.nameHi, names.nameEn].some(name => normalizeName(name) === normalizeName(value));
  const inDistrict = poll.districtId ? poll.districtId === district.id : named(district, poll.districtName);
  const inSamiti = poll.samitiId ? poll.samitiId === samiti.id : named(samiti, poll.samitiName);
  return inDistrict && inSamiti && named(gp, poll.gramPanchayatName);
}
