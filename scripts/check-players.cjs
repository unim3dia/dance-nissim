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
  current: group, dances: [group], navigationKeys: [], tab: 'all', lang: 'en', autoPlay: true,
  $: id => id === 'danceContent' ? content : dialog,
  element: (tag, cls, text) => new Node(tag, cls, text),
  t: (he, en) => context.lang === 'he' ? he : en,
  title: () => context.lang === 'he' ? 'ריקוד' : 'Dance',
  kind: record => record.type,
  name: () => 'Creator', shape: () => 'Couples',
  favorite: () => new Node('button'),
  image: () => new Node('img'),
  featuredRecordings: () => [demo, lesson],
  collectionNeighbor: () => null,
  createAutoplayControl: onEnable => { const button = new Node('button', 'autoplay-toggle'); button.onEnable = onEnable; return button; },
  encodeURIComponent
});
vm.runInContext(source.slice(source.indexOf('function renderDance(){'), source.indexOf('function updateLanguageControl')), context);
context.renderDance();
assert.equal(content.querySelector('.dance-stage-card').querySelector('.player'), content.querySelector('.player'));
assert.deepEqual(content.querySelector('.dance-navigation').children.map(n => n.className), ['', 'autoplay-toggle', '']);
assert.equal(content.querySelector('.related').parent, content, 'Keep exploring must be outside the floating viewing card');
assert.match(content.querySelector('iframe').src, /dance-id/);
assert.match(content.querySelector('iframe').src, /autoplay=1/);
assert.match(content.querySelector('iframe').src, /playsinline=1/);
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
context.autoPlay = false;
content.querySelector('.recordings').children[1].onclick();
assert.ok(!content.querySelector('iframe').src.includes('autoplay=1'), 'Saved autoplay opt-out was ignored by the player');
context.autoPlay = true;
content.querySelector('.autoplay-toggle').onEnable();
assert.match(content.querySelector('iframe').src, /lesson-id.*autoplay=1/, 'Enabling autoplay must start the selected recording');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /id="dialogLanguage"[^>]*data-language-switch/);
for (const file of ['app.js', 'discover.js']) {
  assert.ok(!/[?&]cc_load_policy=1\b/.test(fs.readFileSync(path.join(root, file), 'utf8')), `${file} forces captions on`);
}
console.log('Verified dance/lesson round trips, bilingual selection, preserved iframe identity, and no forced captions.');
const discovery = fs.readFileSync(path.join(root, 'discover.js'), 'utf8');
const initialization = source.split('\n').find(line => line.startsWith('let autoPlay='));
const autoplayLabel = source.split('\n').find(line => line.startsWith('function updateAutoplayControl'));
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
assert.ok(discovery.includes('navigation.append(previous,auto,next);info.append(actions,navigation,autoplayNote(),external)'), 'Autoplay must sit between previous and next, below video choices');
assert.ok(discovery.includes('createRelatedDances(g,') && discovery.includes('else room.append(related)'), 'Discovery must include Keep exploring outside the viewing card');
assert.ok(discovery.includes('playsinline=1'), 'Discovery must request inline playback on mobile');
console.log('Verified autoplay defaults on, saved opt-out is respected, and both languages show its state.');
const navigation = discovery.split('\n').filter(line => /^function (nextDiscovery|previousDiscovery)\(/.test(line)).join('\n');
const navigationContext = vm.createContext({ deck: ['first', 'middle', 'last'], position: 0, showDiscovery: () => {}, animateDanceCard: () => {}, room: { querySelector: () => null } });
vm.runInContext(navigation, navigationContext);
navigationContext.previousDiscovery();
assert.equal(navigationContext.position, 2, 'Discovery previous must wrap to the last dance');
navigationContext.nextDiscovery();
assert.equal(navigationContext.position, 0, 'Discovery next must wrap to the first dance');
navigationContext.nextDiscovery();
assert.equal(navigationContext.position, 1);
navigationContext.previousDiscovery();
assert.equal(navigationContext.position, 0);
navigationContext.deck = [];
navigationContext.previousDiscovery();
navigationContext.nextDiscovery();
assert.equal(navigationContext.position, 0, 'Empty discovery navigation must be harmless');
console.log('Verified circular discovery navigation in both directions.');
const swipeCard = new Node('section');
swipeCard.style = { removeProperty() {}, setProperty() {} };
swipeCard.classList = { add() {}, remove() {} };
const steps = [];
context.bindDanceSwipe(swipeCard, step => steps.push(step));
const pointer = (x, y = 0, interactive = false) => ({ clientX: x, clientY: y, pointerId: 1, button: 0, target: { closest: () => interactive } });
swipeCard.onpointerdown(pointer(200)); swipeCard.onpointerup(pointer(100));
swipeCard.onpointerdown(pointer(100)); swipeCard.onpointerup(pointer(200));
swipeCard.onpointerdown(pointer(100)); swipeCard.onpointerup(pointer(120));
swipeCard.onpointerdown(pointer(100)); swipeCard.onpointermove(pointer(110, 100)); swipeCard.onpointerup(pointer(200, 110));
swipeCard.onpointerdown(pointer(100, 0, true)); swipeCard.onpointerup(pointer(200));
swipeCard.onpointerdown(pointer(100)); swipeCard.onpointercancel(); swipeCard.onpointerup(pointer(200));
assert.deepEqual(steps, [1, -1], 'Only deliberate horizontal swipes on non-interactive card surfaces should navigate');
console.log('Verified bidirectional card swipes, vertical scrolling, interactive controls, and cancellation.');
const another = { key: 'another-dance', main: { ...demo, id: 'another-id' } };
another.records = [another.main];
let selected;
const related = context.createRelatedDances(group, dance => { selected = dance; }, [group, another]);
assert.equal(related.querySelector('.grid').children.length, 1, 'Related dances must exclude the current dance');
related.querySelector('.grid').children[0].onclick();
assert.equal(selected, another, 'Keep exploring must open the selected dance');
context.autoPlay = true;
assert.equal(context.autoplayNote().hidden, false);
context.autoPlay = false;
assert.equal(context.autoplayNote().hidden, true);
console.log('Verified shared related-dance selection and autoplay guidance visibility.');
context.room = new Node('dialog');
context.deck = [group, another];
context.position = 0;
context.roomFilter = '';
context.recent = [];
context.write = () => {};
context.icon = () => new Node('svg');
context.syncFavorites = () => {};
context.nextDiscovery = () => {};
context.previousDiscovery = () => {};
context.languageControl = () => new Node('button', 'player-language');
context.autoPlay = true;
vm.runInContext(discovery.slice(discovery.indexOf('function showDiscovery('), discovery.indexOf("document.addEventListener('nissim-language-change'")), context);
context.showDiscovery();
assert.equal(context.room.querySelector('.related').parent, context.room);
assert.equal(context.room.querySelector('.related').querySelector('.grid').children.length, 1);
assert.match(context.room.querySelector('iframe').src, /autoplay=1.*playsinline=1/);
const discoveryFrame = context.room.querySelector('iframe');
context.lang = 'en';
context.showDiscovery(true);
assert.equal(context.room.querySelector('iframe'), discoveryFrame, 'Discovery language change must preserve playback');
context.room.querySelector('.related').querySelector('.grid').children[0].onclick();
assert.equal(context.position, 1, 'Discovery recommendations must stay in the current browsing deck');
assert.equal(context.room.scrollTop, 0, 'Choosing a related dance must return to the new card');
context.autoPlay = false;
context.showDiscovery();
assert.equal(context.room.querySelector('iframe'), null, 'Autoplay off must leave a playable cover in discovery');
console.log('Verified discovery recommendations, preserved playback, scroll reset, and autoplay opt-out.');
