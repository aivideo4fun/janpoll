export type Place = { id: string; nameHi: string; nameEn: string };
export type District = Place & { stateCode: string | null };
export type Tehsil = Place & { districtId: string };
export type Samiti = Place & { districtId: string; tehsilId: string | null };
export type GP = Place & { districtId: string; samitiId: string };
export type Catalog = { districts: District[]; tehsils: Tehsil[]; samitis: Samiti[]; gps: GP[] };
export type PollLocation = { stateCode: string | null; districtId: string | null; districtName: string | null; samitiId: string | null; samitiName: string | null; gramPanchayatId: string | null; gramPanchayatName: string | null; samitiWardId?: string | null; zilaWardId?: string | null; assemblyId?: string | null };
export function normalized(value: string | null | undefined) {
  return (value || '').normalize('NFC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}
export function named(place: Place, value: string | null | undefined) {
  const text = normalized(value);
  return !!text && [place.nameHi, place.nameEn].some(name => normalized(name) === text);
}
export function catalogState(district: District) { return district.stateCode || 'RJ'; }
function only<T>(rows: T[]) { return rows.length === 1 ? rows[0] : undefined; }
export function resolvePollLocation(poll: PollLocation, catalog: Catalog) {
  let district = poll.districtId ? catalog.districts.find(d => d.id === poll.districtId) : undefined;
  const gp = poll.gramPanchayatId ? catalog.gps.find(g => g.id === poll.gramPanchayatId) : undefined;
  let samiti = poll.samitiId ? catalog.samitis.find(s => s.id === poll.samitiId) : gp ? catalog.samitis.find(s => s.id === gp.samitiId) : undefined;
  if (!district && (gp || samiti)) district = catalog.districts.find(d => d.id === (gp?.districtId || samiti?.districtId));
  if (!district && !poll.districtId) district = only(catalog.districts.filter(d => (!poll.stateCode || catalogState(d) === poll.stateCode) && named(d, poll.districtName)));
  if (!samiti && !poll.samitiId && district) samiti = only(catalog.samitis.filter(s => s.districtId === district!.id && named(s, poll.samitiName)));
  const resolvedGP = gp || (!poll.gramPanchayatId && district && samiti ? only(catalog.gps.filter(g => g.districtId === district!.id && g.samitiId === samiti!.id && named(g, poll.gramPanchayatName))) : undefined);
  if ((poll.districtId && district?.id !== poll.districtId) || (poll.samitiId && samiti?.id !== poll.samitiId) || (poll.gramPanchayatId && resolvedGP?.id !== poll.gramPanchayatId)) return { stateCode: poll.stateCode, conflict: true };
  if (district && ((poll.stateCode && catalogState(district) !== poll.stateCode) || (samiti && samiti.districtId !== district.id) || (resolvedGP && (resolvedGP.districtId !== district.id || resolvedGP.samitiId !== samiti?.id)))) return { stateCode: poll.stateCode, conflict: true };
  return { stateCode: poll.stateCode || (district ? catalogState(district) : null), district, samiti, gp: resolvedGP, tehsil: samiti?.tehsilId ? catalog.tehsils.find(t => t.id === samiti!.tehsilId && t.districtId === district?.id) : undefined, conflict: false };
}
function mentioned(question: string, place: Place) {
  return [place.nameHi, place.nameEn].some(name => {
    const value = normalized(name);
    return value.replace(/\s/g, '').length >= 3 && !['पंचायत','समिति','ग्राम','नगर','ward','village','panchayat'].includes(value) && (` ${question} `).includes(` ${value} `);
  });
}
export type Suggestion = { kind: 'gp' | 'samiti'; id: string; name: string; district: District; samiti: Samiti; gp?: GP };
export function suggestLocations(poll: PollLocation & { question: string }, catalog: Catalog): { status: 'match' | 'ambiguous' | 'none' | 'blocked'; candidates: Suggestion[]; reason: string } {
  if (poll.gramPanchayatId || poll.samitiId || poll.samitiWardId || poll.zilaWardId || poll.assemblyId) return { status: 'blocked', candidates: [], reason: 'इस poll की local ID mapping पहले से है; इसे overwrite नहीं किया जाएगा।' };
  const question = normalized(poll.question);
  const local = resolvePollLocation(poll, catalog);
  if (local.conflict) return { status: 'blocked', candidates: [], reason: 'मौजूदा location data में विरोध है; manual review करें।' };
  const questionDistricts = catalog.districts.filter(d => mentioned(question, d));
  const candidates: Suggestion[] = [];
  const allows = (district: District, samiti: Samiti, gp?: GP) => {
    if (poll.stateCode && catalogState(district) !== poll.stateCode) return false;
    if (poll.districtId && poll.districtId !== district.id) return false;
    if (poll.districtName && !named(district, poll.districtName)) return false;
    if (poll.samitiName && !named(samiti, poll.samitiName)) return false;
    if (poll.gramPanchayatName && (!gp || !named(gp, poll.gramPanchayatName))) return false;
    if (questionDistricts.length && !questionDistricts.some(d => d.id === district.id)) return false;
    return true;
  };
  for (const gp of catalog.gps) {
    if (!mentioned(question, gp)) continue;
    const district = catalog.districts.find(d => d.id === gp.districtId), samiti = catalog.samitis.find(s => s.id === gp.samitiId && s.districtId === gp.districtId);
    if (district && samiti && allows(district, samiti, gp)) candidates.push({ kind: 'gp', id: gp.id, name: gp.nameHi || gp.nameEn, district, samiti, gp });
  }
  const gpContext = /ग्राम पंचायत|ग्रामपंचायत|सरपंच|gram panchayat|sarpanch/.test(question);
  const samitiContext = /पंचायत समिति|पंचायत समि[तिती]+|panchayat samiti/.test(question);
  if (!gpContext || !candidates.length) for (const samiti of catalog.samitis) {
    if (!mentioned(question, samiti)) continue;
    const district = catalog.districts.find(d => d.id === samiti.districtId);
    if (district && allows(district, samiti)) candidates.push({ kind: 'samiti', id: samiti.id, name: samiti.nameHi || samiti.nameEn, district, samiti });
  }
  let found = candidates;
  if (samitiContext && !gpContext) found = candidates.filter(c => c.kind === 'samiti');
  if (gpContext) found = candidates.filter(c => c.kind === 'gp');
  // Keep all duplicate names. Never guess among districts or similarly named places.
  if (!found.length) return { status: 'none', candidates: [], reason: 'सवाल में उपलब्ध catalog का स्पष्ट पूरा नाम नहीं मिला।' };
  return { status: found.length === 1 ? 'match' : 'ambiguous', candidates: found, reason: found.length === 1 ? 'एक स्पष्ट match मिला। Apply करने से पहले hierarchy जाँचें।' : 'एक से अधिक location मिलीं; auto-apply उपलब्ध नहीं है। District/नाम manual रूप से ठीक करें।' };
}
