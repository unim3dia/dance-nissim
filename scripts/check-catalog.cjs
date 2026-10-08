const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({
  window: {},
  localStorage: { getItem: () => null, setItem: () => {} }
});
for (const file of ['catalog.js', 'credits.js', 'research-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
vm.runInContext(app.slice(0, app.indexOf('const t=')) + '\nwindow.auditDances=dances;', context);

const catalog = context.window.CATALOG;
const dances = context.window.auditDances;
const invalid = /ללא כותרת|\bLl Kvtrt\b|^Israeli(?: Folk)? Danc|^Dance with Nissim|^Untitled$|^Tgdy$|Tgydy Gyl|^עם$/i;
const badTitles = catalog.filter(v => !v.he?.trim() || !v.en?.trim() || invalid.test(v.he) || invalid.test(v.en));
assert.equal(badTitles.length, 0, `Invalid dance titles: ${badTitles.map(v => v.id).join(', ')}`);
assert.equal(new Set(catalog.map(v => v.id)).size, catalog.length, 'Duplicate video IDs');
const garbled = catalog.filter(v => v.en.split(/[^a-z]+/i).some(word => word.length >= 4 && !/[aeiou]/i.test(word)));
assert.equal(garbled.length, 0, `Broken transliterations: ${garbled.map(v => v.id).join(', ')}`);
const missingCredits = catalog.filter(v => !v.choreoEn?.trim() || !v.choreoHe?.trim());
assert.equal(missingCredits.length, 0, `Missing bilingual credits: ${missingCredits.map(v => v.id).join(', ')}`);
assert.equal(dances.flatMap(g => g.records).length, catalog.length, 'Grouping lost recordings');
for (const group of dances) {
  assert.equal(new Set(group.records.map(v => v.choreoKey)).size, 1, `Mixed choreographers: ${group.key}`);
}
const couplesTagidi = dances.find(g => g.records.some(v => v.id === '0W1Wp5VGThI'));
const circleTagidi = dances.find(g => g.records.some(v => v.id === 'Ayg3kfn42pM'));
assert.notEqual(couplesTagidi.key, circleTagidi.key, 'Distinct Tagidi choreographies were merged');
assert.equal(couplesTagidi.main.he, 'תגידי');
assert.equal(couplesTagidi.main.en, 'Tagidi');
assert.equal(couplesTagidi.main.choreoEn, 'Gil & Michelle');
assert.equal(couplesTagidi.main.year, 2012);
assert.equal(circleTagidi.main.choreoKey, 'Moshe Eskayo');
assert.equal(catalog.find(v => v.id === 'tqJZdF15Uzo').choreoKey, 'Boaz Cohen');
assert.equal(dances.find(g => g.records.some(v => v.id === '3sNhV4J9Awo')).main.id, '3sNhV4J9Awo', 'Preferred working demonstration changed');
console.log(`Verified ${catalog.length} recordings in ${dances.length} dance groups: no missing titles, broken transliterations, missing bilingual credits, or mixed choreographers.`);
