import { resolvePollLocation, catalogState, type Catalog, type PollLocation } from './poll-locations';
const OFFSET = 330 * 60 * 1000;
export function indiaDate(now = new Date()) { return new Date(now.getTime() + OFFSET).toISOString().slice(0, 10); }
export function reportRange(from?: string, to?: string, now = new Date()) {
  const valid = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
  const startDay = valid(from) ? from! : indiaDate(now), endDay = valid(to) ? to! : startDay;
  const start = new Date(startDay + 'T00:00:00+05:30'), end = new Date(new Date(endDay + 'T00:00:00+05:30').getTime() + 86400000);
  if (end <= start || end.getTime() - start.getTime() > 31 * 86400000) throw new Error('तारीख सही चुनें; एक report में अधिकतम 31 दिन रखें।');
  return { startDay, endDay, start, end };
}
export type ActivityPoll = PollLocation & { id: string; question: string; createdAt: Date; active: boolean };
export function activityReport(polls: ActivityPoll[], catalog: Catalog, state: string, level: string, districtId = '', tehsilId = '', samitiId = '') {
  const resolved = polls.map(poll => ({ poll, location: resolvePollLocation(poll, catalog) }));
  const states = new Map<string, number>();
  for (const { location } of resolved) { const code = location.stateCode || 'UNASSIGNED'; states.set(code, (states.get(code) || 0) + 1); }
  const selected = resolved.filter(({ location }) => location.stateCode === state && (!districtId || location.district?.id === districtId) && (!tehsilId || location.tehsil?.id === tehsilId) && (!samitiId || location.samiti?.id === samitiId));
  const districtIDs = new Set(catalog.districts.filter(d => catalogState(d) === state && (!districtId || d.id === districtId) && (!tehsilId || catalog.tehsils.some(t => t.id === tehsilId && t.districtId === d.id)) && (!samitiId || catalog.samitis.some(s => s.id === samitiId && s.districtId === d.id))).map(d => d.id));
  const samitiIDs = new Set(catalog.samitis.filter(s => districtIDs.has(s.districtId) && (!tehsilId || s.tehsilId === tehsilId) && (!samitiId || s.id === samitiId)).map(s => s.id));
  const places = level === 'gp' ? catalog.gps.filter(g => districtIDs.has(g.districtId) && samitiIDs.has(g.samitiId)) : level === 'samiti' ? catalog.samitis.filter(s => samitiIDs.has(s.id)) : level === 'tehsil' ? catalog.tehsils.filter(t => districtIDs.has(t.districtId) && (!tehsilId || t.id === tehsilId)) : catalog.districts.filter(d => districtIDs.has(d.id));
  const buckets = new Map<string, { id: string; name: string; parent: string; count: number; first: Date | null; last: Date | null }>(places.map(p => [p.id, { id: p.id, name: p.nameHi || p.nameEn, parent: 'districtId' in p ? catalog.districts.find(d => d.id === p.districtId)?.nameHi || '' : state, count: 0, first: null, last: null }]));
  let unmapped = 0;
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  const daily = new Map<string, number>();
  for (const { poll, location } of selected) {
    const time = new Date(poll.createdAt.getTime() + OFFSET);
    hours[time.getUTCHours()].count++;
    const day = time.toISOString().slice(0, 10); daily.set(day, (daily.get(day) || 0) + 1);
    const id = level === 'gp' ? location.gp?.id : level === 'samiti' ? location.samiti?.id : level === 'tehsil' ? location.tehsil?.id : location.district?.id;
    const bucket = id ? buckets.get(id) : undefined;
    if (!bucket) { unmapped++; continue; }
    bucket.count++; if (!bucket.first || poll.createdAt < bucket.first) bucket.first = poll.createdAt; if (!bucket.last || poll.createdAt > bucket.last) bucket.last = poll.createdAt;
  }
  return { states, selected, rows: Array.from(buckets.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'hi')), unmapped, hours, daily: Array.from(daily.entries()).sort(([a], [b]) => a.localeCompare(b)) };
}
