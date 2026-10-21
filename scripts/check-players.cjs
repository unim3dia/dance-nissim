const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

class Node {
  constructor(tag, className = '', textContent = '') {
    Object.assign(this, { tag, className, textContent, children: [], dataset: {}, attributes: {} });
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  append(...nodes) { for (const node of nodes) { node.parent = this; this.children.push(node); } }
  prepend(node) { node.parent = this; this.children.unshift(node); }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  replaceWith(node) {
    const index = this.parent.children.indexOf(this);
    this.parent.children[index] = node;
    node.parent = this.parent;
  }
  querySelector(selector) {
    for (const child of this.children) {
      const matches = selector.startsWith('.') ? child.className.split(' ').includes(selector.slice(1)) : child.tag === selector;
      if (matches) return child;
      const nested = child.querySelector(selector);
      if (nested) return nested;
    }
    return null;
  }
}

const demo = { id: 'dance-id', type: 'dance', year: 1985 };
const lesson = { id: 'lesson-id', type: 'teaching', year: 1985 };
const group = { key: 'test-dance', main: demo, records: [demo, lesson] };
const content = new Node('div'), dialog = new Node('dialog');
const context = vm.createContext({
  current: group, dances: [group], navigationKeys: [], tab: 'all', lang: 'en',
  $: id => id === 'danceContent' ? content : dialog,
  element: (tag, cls, text) => new Node(tag, cls, text),
  t: (he, en) => context.lang === 'he' ? he : en,
  title: () => context.lang === 'he' ? 'ריקוד' : 'Dance',
  kind: record => record.type,
  name: () => 'Creator', shape: () => 'Couples',
  favorite: () => new Node('button'),
  featuredRecordings: () => [demo, lesson],
  collectionNeighbor: () => null,
  encodeURIComponent
});
vm.runInContext(source.slice(source.indexOf('function renderDance(){'), source.indexOf('function updateLanguageControl')), context);
context.renderDance();
assert.match(content.querySelector('iframe').src, /dance-id/);
content.querySelector('.recordings').children[1].onclick();
const lessonFrame = content.querySelector('iframe');
assert.match(lessonFrame.src, /lesson-id/);
context.lang = 'he';
context.renderDance();
assert.equal(content.querySelector('iframe'), lessonFrame, 'Language change replaced the active video');
assert.equal(content.querySelector('.recordings').children[1].attributes['aria-pressed'], 'true');
assert.equal(content.querySelector('.recordings').children[1].textContent, 'ללמוד את הצעדים');
content.querySelector('.recordings').children[0].onclick();
assert.match(content.querySelector('iframe').src, /dance-id/);
assert.equal(content.querySelector('.recordings').children[0].attributes['aria-pressed'], 'true');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /id="dialogLanguage"[^>]*data-language-switch/);
for (const file of ['app.js', 'discover.js']) {
  assert.ok(!/[?&]cc_load_policy=1\b/.test(fs.readFileSync(path.join(root, file), 'utf8')), `${file} forces captions on`);
}
console.log('Verified dance/lesson round trips, bilingual selection, preserved iframe identity, and no forced captions.');
const discovery = fs.readFileSync(path.join(root, 'discover.js'), 'utf8');
const initialization = discovery.split('\n').find(line => line.startsWith('let deck='));
const autoplayLabel = discovery.split('\n').find(line => line.startsWith('function updateAutoplayControl'));
for (const lang of ['he', 'en']) {
  for (const saved of [undefined, true, false]) {
    const button = new Node('button');
    const autoplayContext = vm.createContext({
      button, read: (_, fallback) => saved ?? fallback,
      t: (he, en) => lang === 'he' ? he : en
    });
    vm.runInContext(initialization + '\n' + autoplayLabel + '\nupdateAutoplayControl(button);', autoplayContext);
    assert.equal(button.attributes['aria-pressed'], String(saved ?? true));
    assert.equal(button.textContent, lang === 'en' ? `Autoplay: ${(saved ?? true) ? 'On' : 'Off'}` : `ניגון אוטומטי: ${(saved ?? true) ? 'פועל' : 'כבוי'}`);
  }
}
assert.ok(!/מפגש עם האוסף|FROM THE COLLECTION/.test(discovery), 'Discovery counter text returned');
assert.ok(discovery.includes('info.append(actions,auto,external)'), 'Autoplay must remain beside the video choices');
console.log('Verified autoplay defaults on, saved opt-out is respected, and both languages show its state.');
