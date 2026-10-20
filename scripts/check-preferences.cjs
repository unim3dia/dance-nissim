const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = source.indexOf('function preferences(){');
const preferences = source.slice(start, source.indexOf("\n$('language').onclick", start));
const toggle = source.split("$('textSize').onclick=()=>{")[1].split('};')[0];
const themeToggle = source.split("$('theme').onclick=()=>{")[1].split('};')[0];
for (const lang of ['en', 'he']) {
for (const saved of [undefined, false, true]) {
for (const theme of ['light', 'dark']) {
  const classes = new Set(), attributes = {}, storage = { large: saved, theme };
  const children = Object.fromEntries(['.text-small', '.text-large', '.sun-icon', '.moon-icon'].map(key => [key, {}]));
  const elements = Object.fromEntries(['textSize', 'theme'].map(id => [id, {
    setAttribute: (key, value) => attributes[id + key] = value,
    querySelector: selector => children[selector]
  }]));
  const context = vm.createContext({
    Date, lang,
    read: (key, fallback) => storage[key] ?? fallback,
    write: (key, value) => storage[key] = value,
    t: (he, en) => lang === 'he' ? he : en,
    $: id => elements[id],
    document: { body: { classList: {
      toggle: (key, value) => value ? classes.add(key) : classes.delete(key),
      contains: key => classes.has(key)
    } } }
  });
  vm.runInContext(preferences + '\npreferences();', context);
  assert.equal(classes.has('large'), saved ?? true);
  assert.equal(attributes['textSizearia-pressed'], saved ?? true);
  assert.equal(children['.text-small'].textContent, lang === 'he' ? 'א' : 'a');
  assert.equal(children['.text-large'].textContent, lang === 'he' ? 'א' : 'A');
  assert.equal(children['.sun-icon'].hidden, theme === 'light');
  assert.equal(children['.moon-icon'].hidden, theme === 'dark');
  assert.equal(attributes['themearia-label'], elements.theme.title);
  vm.runInContext(toggle, context);
  assert.equal(storage.large, !(saved ?? true));
  assert.equal(classes.has('large'), !(saved ?? true));
  vm.runInContext(themeToggle, context);
  assert.equal(storage.theme, theme === 'light' ? 'dark' : 'light');
  assert.equal(children['.sun-icon'].hidden, theme === 'dark');
  assert.equal(children['.moon-icon'].hidden, theme === 'light');
}
}
}
console.log('Verified bilingual header controls, larger-text default, saved preferences, and both toggles.');
