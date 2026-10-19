const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(file, resolver) {
  const source = fs.readFileSync(file, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, require: resolver || require });
  return exports;
}
const location = load('src/lib/location.ts');
const { matchesGramPanchayat: matches } = load('src/lib/polls/location-match.ts', name => {
  if (name === '@/lib/location') return location;
  throw new Error('Unexpected dependency');
});
const gp = { id: 'cuid-gp', nameHi: 'रामपुर', nameEn: 'Rampur' };
const samiti = { id: 'cuid-s', nameHi: 'समिति', nameEn: 'Samiti' };
const district = { id: 'cuid-d', nameHi: 'जोधपुर', nameEn: 'Jodhpur' };
assert.equal(matches({ gramPanchayatId: 'cuid-gp' }, gp, samiti, district), true);
assert.equal(matches({ gramPanchayatId: 'another-cuid' }, gp, samiti, district), false);
const legacy = { gramPanchayatName: 'Rampur', districtName: 'Jodhpur', samitiName: 'Samiti' };
assert.equal(matches(legacy, gp, samiti, district), true);
assert.equal(matches({ ...legacy, districtName: 'Other district' }, gp, samiti, district), false);
assert.equal(matches({ ...legacy, samitiName: 'Other samiti' }, gp, samiti, district), false);
assert.equal(matches({ ...legacy, gramPanchayatName: 'Rampur Kalan' }, gp, samiti, district), false);
assert.equal(matches({ ...legacy, stateCode: 'UP' }, gp, samiti, district), false);
console.log('7 location matching regression cases passed.');
