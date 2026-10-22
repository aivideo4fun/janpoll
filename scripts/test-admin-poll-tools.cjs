const fs = require('fs'), vm = require('vm'), ts = require('typescript'), assert = require('node:assert/strict');
function load(file, mocks = {}) { const exports = {}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, { exports, require: n => n in mocks ? mocks[n] : require(n), process, console, Date, Set, Map, URLSearchParams }); return exports; }
const places = load('src/lib/admin/poll-locations.ts');
const report = load('src/lib/admin/poll-activity.ts', { './poll-locations': places });
const catalog = {
 districts: [{ id: 'd1', nameHi: 'जोधपुर', nameEn: 'Jodhpur', stateCode: null }, { id: 'd2', nameHi: 'जयपुर', nameEn: 'Jaipur', stateCode: 'RJ' }, { id: 'd3', nameHi: 'भोपाल', nameEn: 'Bhopal', stateCode: 'MP' }],
 tehsils: [{ id: 't1', nameHi: 'ओसियां', nameEn: 'Osian', districtId: 'd1' }, { id: 't2', nameHi: 'खाली तहसील', nameEn: 'Empty tehsil', districtId: 'd1' }],
 samitis: [{ id: 's1', nameHi: 'ओसियां', nameEn: 'Osian', districtId: 'd1', tehsilId: 't1' }, { id: 's2', nameHi: 'आमेर', nameEn: 'Amer', districtId: 'd2', tehsilId: null }],
 gps: [{ id: 'g1', nameHi: 'बाजवास', nameEn: 'Bajwas', districtId: 'd1', samitiId: 's1' }, { id: 'g2', nameHi: 'रामपुर', nameEn: 'Rampur', districtId: 'd1', samitiId: 's1' }, { id: 'g3', nameHi: 'रामपुर', nameEn: 'Rampur', districtId: 'd2', samitiId: 's2' }, { id: 'g4', nameHi: 'खाली पंचायत', nameEn: 'Empty village', districtId: 'd1', samitiId: 's1' }]
};
const base = { id: 'p', question: 'बाजवास ग्राम पंचायत में आपकी राय?', stateCode: null, districtId: null, districtName: null, samitiId: null, samitiName: null, gramPanchayatId: null, gramPanchayatName: null, samitiWardId: null, zilaWardId: null, assemblyId: null, active: true, createdAt: new Date('2026-10-22T18:30:00Z'), updatedAt: new Date('2026-10-23T00:00:00Z') };
assert.equal(places.suggestLocations(base, catalog).status, 'match');
assert.equal(places.suggestLocations({ ...base, question: 'BAJWAS gram panchayat: public opinion?' }, catalog).candidates[0].id, 'g1');
assert.equal(places.suggestLocations({ ...base, question: 'बाजवासपुर ग्राम पंचायत' }, catalog).status, 'none');
assert.equal(places.suggestLocations({ ...base, question: 'रामपुर सरपंच पर राय?' }, catalog).status, 'ambiguous');
assert.equal(places.suggestLocations({ ...base, question: 'जयपुर रामपुर सरपंच पर राय?' }, catalog).candidates[0].id, 'g3');
assert.equal(places.suggestLocations({ ...base, question: 'पंचायत समिति ओसियां पर राय?' }, catalog).candidates[0].kind, 'samiti');
assert.equal(places.suggestLocations({ ...base, stateCode: 'MP' }, catalog).status, 'none');
assert.equal(places.suggestLocations({ ...base, districtId: 'd2', districtName: 'जयपुर' }, catalog).status, 'none');
assert.equal(places.suggestLocations({ ...base, gramPanchayatId: 'g1' }, catalog).status, 'blocked');
assert.equal(places.suggestLocations({ ...base, samitiWardId: 'w1' }, catalog).status, 'blocked');
assert.equal(places.suggestLocations({ ...base, gramPanchayatName: 'गलत पंचायत' }, catalog).status, 'none');
assert.equal(places.suggestLocations({ ...base, districtId: 'missing' }, catalog).status, 'blocked');
const range = report.reportRange(undefined, undefined, new Date('2026-10-22T18:30:00Z'));
assert.equal(range.startDay, '2026-10-23'); assert.equal(range.start.toISOString(), '2026-10-22T18:30:00.000Z'); assert.equal(range.end.toISOString(), '2026-10-23T18:30:00.000Z');
assert.throws(() => report.reportRange('2026-10-01', '2026-11-01')); assert.throws(() => report.reportRange('2026-10-23', '2026-10-22'));
const rows = [{ ...base, gramPanchayatId: 'g1' }, { ...base, id: 'p2', districtName: 'जोधपुर', samitiName: 'ओसियां', gramPanchayatName: 'बाजवास', active: false }, { ...base, id: 'p3', stateCode: 'RJ' }];
let data = report.activityReport(rows, catalog, 'RJ', 'gp'); assert.equal(data.rows.find(r => r.id === 'g1').count, 2); assert.equal(data.rows.find(r => r.id === 'g4').count, 0); assert.equal(data.unmapped, 1); assert.equal(data.states.get('RJ'), 3); assert.equal(data.hours[0].count, 3); assert.equal(data.daily[0][0], '2026-10-23');
data = report.activityReport(rows, catalog, 'RJ', 'tehsil'); assert.equal(data.rows.find(r => r.id === 't1').count, 2); assert.equal(data.rows.find(r => r.id === 't2').count, 0);
(async () => {
 let admin = false, updates = [], current = base, writeCount = 1, catalogCalls = 0;
 const db = { poll: { findMany: async () => [current] }, $transaction: async fn => fn({ poll: { updateMany: async input => { updates.push(input); return { count: writeCount }; } } }) };
 const action = load('src/app/admin/location-suggestions/actions.ts', { 'next/cache': { revalidatePath: () => {} }, 'next/navigation': { redirect: url => { throw Object.assign(new Error('Redirect'), { url }); } }, '@/lib/db': { db }, '@/lib/admin-auth': { isAdmin: async () => admin }, '@/lib/admin/location-catalog': { loadLocationCatalog: async () => { catalogCalls++; return catalog; } }, '@/lib/admin/poll-locations': places }).applyLocationSuggestions;
 const form = new FormData(); form.set('confirmed', 'yes'); form.set('selection', JSON.stringify({ id: 'p', key: 'gp:g1', updatedAt: base.updatedAt.toISOString() }));
 await assert.rejects(() => action(form)); assert.equal(catalogCalls, 0); admin = true;
 async function apply() { try { await action(form); assert.fail('redirect required'); } catch (e) { if (!e.url) throw e; return e.url; } }
 assert((await apply()).includes('applied=1')); assert.equal(updates[0].data.gramPanchayatId, 'g1'); assert.equal(updates[0].data.stateCode, 'RJ'); assert.equal(updates[0].data.scope, 'STATE'); assert.equal(updates[0].where.updatedAt, base.updatedAt); assert.equal(updates[0].where.gramPanchayatId, null);
 for (const field of ['active', 'question', 'creatorEmail', 'requiresLogin', 'options', 'votes']) assert(!(field in updates[0].data));
 updates = []; current = { ...base, updatedAt: new Date('2026-10-23T00:01:00Z') }; assert((await apply()).includes('applied=0')); assert.equal(updates.length, 0);
 current = { ...base, question: 'रामपुर सरपंच पर राय?' }; assert((await apply()).includes('applied=0')); assert.equal(updates.length, 0);
 current = base; writeCount = 0; assert((await apply()).includes('skipped=1'));
 form.set('selection', JSON.stringify({ id: 'p', key: 'gp:forged', updatedAt: base.updatedAt.toISOString() })); updates = []; assert((await apply()).includes('applied=0')); assert.equal(updates.length, 0);
 form.delete('confirmed'); await assert.rejects(() => action(form));
 const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
 const regions = load('src/lib/regions.ts');
 const readMocks = { 'next/link': props => React.createElement('a', props, props.children), 'next/navigation': { redirect: url => { throw Object.assign(new Error('Redirect'), { url }); } }, '@/lib/db': { db: { poll: { findMany: async () => rows, count: async () => rows.length } } }, '@/lib/admin-auth': { isAdmin: async () => admin }, '@/lib/regions': regions, '@/lib/admin/location-catalog': { loadLocationCatalog: async () => catalog }, '@/lib/admin/poll-locations': places, '@/lib/admin/poll-activity': report, './actions': { applyLocationSuggestions: '/fixture-action' } };
 const activityPage = load('src/app/admin/poll-activity/page.tsx', readMocks).default;
 const scanPage = load('src/app/admin/location-suggestions/page.tsx', readMocks).default;
 admin = false; await assert.rejects(() => activityPage({})); await assert.rejects(() => scanPage({})); admin = true;
 const html = renderToStaticMarkup(await activityPage({ searchParams: Promise.resolve({ from: '2026-10-23', state: 'RJ', level: 'gp' }) })); assert(html.includes('खाली पंचायत')); assert(html.includes('Mapped polls')); assert(html.includes('IST'));
 const scanHtml = renderToStaticMarkup(await scanPage({ searchParams: Promise.resolve({}) })); assert(scanHtml.includes('Scan / Preview')); assert(scanHtml.includes('selection')); assert(scanHtml.includes('confirmed'));
 console.log('Admin page SSR passed: protected reports, zero-area rows, scan proposals and explicit confirmation form.');
 console.log('Admin poll tools passed: IST/date ranges, creation counts/zero locations, legacy hierarchy, duplicate/partial/conflicting names, admin-only writes, server recomputation, stale/racing/forged proposals and vote/status preservation (mock database).');
})().catch(e => { console.error(e); process.exitCode = 1; });
