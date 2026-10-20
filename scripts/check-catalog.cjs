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
for (const id of ['n66kM4Q-Jq4', 'Pyn89hAM37Q', 'LrYhsev7-TY']) {
  const video = catalog.find(v => v.id === id);
  assert.equal(video.choreoEn, 'Eliyahu Gamliel', `Dror Ikra credit regressed: ${id}`);
  assert.equal(video.choreoHe, 'אליהו גמליאל');
}
context.window.testGroups = dances;
vm.runInContext(`
  for (const group of window.testGroups) {
    const featured = featuredRecordings(group);
    if (featured[0].id !== group.main.id) throw new Error('Preferred recording changed');
    const kinds = featured.map(v => v.type === 'teaching' ? 'teaching' : v.type === 'live' ? 'live' : 'dance');
    if (new Set(kinds).size !== kinds.length) throw new Error('Duplicate featured recording kind');
    if (group.records.some(v => v.type === 'teaching') && !featured.some(v => v.type === 'teaching')) throw new Error('Lesson lost');
  }
  const keys = ['first', 'middle', 'last'];
  if (collectionNeighbor('first', keys, -1) !== null || collectionNeighbor('last', keys, 1) !== null) throw new Error('Navigation boundary failed');
  if (collectionNeighbor('middle', keys, -1) !== 'first' || collectionNeighbor('middle', keys, 1) !== 'last') throw new Error('Navigation order changed');
  const demoPool = window.testGroups.filter(g => g.main.type === 'dance');
  const firstHero = chooseHero(window.testGroups, null, () => 0);
  if (firstHero !== demoPool[0]) throw new Error('Hero must prefer a demonstration');
  if (chooseHero(window.testGroups, firstHero.key, () => 0) === firstHero) throw new Error('Hero repeated on reload');
  if (chooseHero(window.testGroups, null, () => .999999) !== demoPool.at(-1)) throw new Error('Hero selection misses the end of the collection');
  if (chooseHero([], null) !== null) throw new Error('Empty hero selection failed');
  if (chooseHero([firstHero], firstHero.key, () => 0) !== firstHero) throw new Error('Single-dance fallback failed');
  const hatzrif = window.testGroups.find(g => g.records.some(v => v.id === '-VT9BJBqX-8'));
  if (hatzrif.main.id !== '-VT9BJBqX-8') throw new Error('Curator-selected Hatzrif demonstration changed');
  const hatzrifVideos = featuredRecordings(hatzrif);
  if (hatzrifVideos.length !== 2 || hatzrifVideos[0].id !== '-VT9BJBqX-8' || !hatzrifVideos.some(v => v.id === 'XWN9v6t3NuI' && v.type === 'teaching')) throw new Error('Hatzrif dance/lesson pairing changed');
  if (!hatzrif.records.some(v => v.id === 'BZh47ddzoZ0')) throw new Error('Alternate Hatzrif archival upload was deleted');
`, context);
const discoverySelection = fs.readFileSync(path.join(root, 'discover.js'), 'utf8').split('\n').find(line => line.startsWith('activeRecording=')).split(';recent=')[0];
vm.runInContext(`
  const preferredGroup = dances.find(g => g.main.id === '-VT9BJBqX-8');
  const g = { ...preferredGroup, records: [...preferredGroup.records].reverse() };
  const roomFilter = '';
  ${discoverySelection};
  if (activeRecording.id !== '-VT9BJBqX-8') throw new Error('Discovery ignored the preferred demonstration');
`, context);
const titleCardCredits = JSON.parse(fs.readFileSync(path.join(__dirname, 'title-card-credits.json'), 'utf8'));
for (const [id, creator] of Object.entries(titleCardCredits)) {
  assert.equal(catalog.find(v => v.id === id)?.choreoKey, creator, `Title-card credit changed for ${id}`);
}
assert.ok(catalog.every(v => /[א-ת]/.test(v.choreoHe)), 'Hebrew creator name missing');
for (const id of ['_Cpue-QZbOY', 'p-2cny8C2IY', 'PKVHKFe5apE']) {
  const video = catalog.find(v => v.id === id);
  assert.equal(video.choreoEn, 'Chaim Ochayon');
  assert.equal(video.choreoHe, 'חיים אוחיון');
}
for (const id of ['rNkFP2DRkdI', 'vFM6L7fRn44', 'I1ozZYKnmcc', 'Xpz7IhfmNc4']) {
  assert.ok(!catalog.some(v => v.id === id), 'Excluded recording returned');
}
const excludedCreator = new RegExp(['avi[\\s_-]+(?:levy|levi|lewy|lewi)\\b', 'אבי[\\s־-]+לוי'].join('|'), 'i');
assert.ok(!excludedCreator.test(JSON.stringify(catalog)), 'Excluded creator remains in catalog');
for (const file of ['catalog.js', 'credits.js', 'research-data.js', 'app.js']) {
  assert.ok(!excludedCreator.test(fs.readFileSync(path.join(root, file), 'utf8')), `Excluded creator remains in ${file}`);
}
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
