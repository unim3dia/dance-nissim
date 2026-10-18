const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const preferences = source.match(/^function preferences\(\).*$/m)[0];
const toggle = source.split("$('textSize').onclick=()=>{")[1].split('};')[0];
for (const saved of [undefined, false, true]) {
  const classes = new Set(), attributes = {}, storage = { large: saved };
  const context = vm.createContext({
    Date,
    read: (key, fallback) => storage[key] ?? fallback,
    write: (key, value) => storage[key] = value,
    t: (he, en) => en,
    $: id => ({ setAttribute: (key, value) => attributes[id + key] = value, set textContent(value) {} }),
    document: { body: { classList: {
      toggle: (key, value) => value ? classes.add(key) : classes.delete(key),
      contains: key => classes.has(key)
    } } }
  });
  vm.runInContext(preferences + '\npreferences();', context);
  assert.equal(classes.has('large'), saved ?? true);
  assert.equal(attributes['textSizearia-pressed'], saved ?? true);
  vm.runInContext(toggle, context);
  assert.equal(storage.large, !(saved ?? true));
  assert.equal(classes.has('large'), !(saved ?? true));
}
console.log('Verified larger-text default, saved preferences, and first-click toggle.');
