const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Node {
  constructor(tag, cls = '') { Object.assign(this, { tag, className: cls, children: [], dataset: {}, attributes: {} }); }
  append(...children) { children.forEach(node => { node.parent = this; this.children.push(node); }); }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  replaceWith(node) { const index = this.parent.children.indexOf(this); this.parent.children[index] = node; node.parent = this.parent; }
  setAttribute(key, value) { this.attributes[key] = value; }
  querySelector(selector) {
    for (const child of this.children) {
      if (selector.startsWith('.') ? child.className === selector.slice(1) : child.tag === selector) return child;
      const nested = child.querySelector(selector); if (nested) return nested;
    }
    return null;
  }
}

const instances = [];
class Player {
  constructor(mount, options) {
    this.options = options; this.id = options.videoId; this.calls = [];
    this.frame = new Node('iframe'); mount.replaceWith(this.frame); instances.push(this);
  }
  getIframe() { return this.frame; }
  getVideoData() { return { video_id: this.id }; }
  loadVideoById(id) { this.id = id; this.calls.push(['load', id]); }
  cueVideoById(id) { this.id = id; this.calls.push(['cue', id]); }
  playVideo() { this.calls.push(['play']); }
  pauseVideo() { this.calls.push(['pause']); }
  destroy() { this.calls.push(['destroy']); }
  emit(event, data) { this.options.events[event]({ target: this, data }); }
}
const context = vm.createContext({
  window: { YT: { Player }, location: { origin: 'https://example.com' } },
  element: (tag, cls) => new Node(tag, cls),
  icon: () => new Node('svg'), image: () => new Node('img'),
  t: (he, en) => context.lang === 'he' ? he : en,
  title: group => context.lang === 'he' ? group.he : group.en,
  kind: record => record.type, lang: 'en', Promise, WeakMap, setTimeout, clearTimeout
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'video-player.js'), 'utf8'), context);
const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const host = new Node('div');
  const group = { en: 'Dance', he: 'ריקוד' }, demo = { id: 'demo', type: 'dance' }, lesson = { id: 'lesson', type: 'teaching' };
  const video = context.danceVideo(host);
  video.setRecording(group, demo, false);
  assert.equal(host.querySelector('iframe'), null, 'Manual mode should start with a clean poster, not an iframe');
  assert.equal(host.querySelector('.video-poster').hidden, false);
  host.querySelector('.video-poster').onclick();
  await flush();
  const api = instances[0]; api.emit('onReady');
  assert.deepEqual(api.calls.at(-1), ['load', 'demo']);
  assert.equal(api.options.host, 'https://www.youtube-nocookie.com');
  assert.equal(api.options.playerVars.playsinline, 1);
  assert.equal(api.options.playerVars.origin, 'https://example.com');
  assert.match(api.frame.allow, /autoplay/);
  const frame = api.frame;
  api.emit('onAutoplayBlocked');
  assert.equal(host.dataset.playback, 'blocked');
  assert.equal(host.querySelector('.video-poster').hidden, false);
  assert.match(host.querySelector('.video-poster-message').textContent, /Tap/);
  host.querySelector('.video-poster').onclick();
  assert.deepEqual(api.calls.at(-1), ['play'], 'A direct tap must command the ready player synchronously');
  assert.equal(host.querySelector('iframe'), frame, 'Retry must not reload the iframe');
  api.emit('onStateChange', 1);
  assert.equal(host.dataset.playback, 'playing');
  assert.equal(host.querySelector('.video-poster').hidden, true, 'Never overlay an active YouTube player');
  video.setRecording(group, lesson, true);
  assert.equal(instances.length, 1);
  assert.deepEqual(api.calls.at(-1), ['load', 'lesson']);
  context.lang = 'he'; video.localize();
  assert.match(api.frame.title, /ריקוד/);
  assert.deepEqual(api.calls.at(-1), ['load', 'lesson'], 'Language switch must not restart playback');
  api.emit('onError', 100);
  assert.equal(host.dataset.playback, 'error');
  assert.match(host.querySelector('.video-poster-message').textContent, /אינו זמין/);
  video.setRecording(group, demo, false);
  assert.deepEqual(api.calls.slice(-2), [['pause'], ['cue', 'demo']]);
  assert.equal(host.dataset.playback, 'poster');
  assert.equal(host.querySelector('.video-surface').hidden, true);
  video.destroy();
  assert.deepEqual(api.calls.at(-1), ['destroy']);
  const calls = api.calls.length; video.play();
  assert.equal(api.calls.length, calls, 'A disposed player must not restart');

  const pendingHost = new Node('div'), pending = context.danceVideo(pendingHost);
  pending.setRecording(group, demo, true);
  pending.setRecording(group, lesson, false);
  await flush();
  const late = instances[1]; late.emit('onReady');
  assert.deepEqual(late.calls.at(-1), ['cue', 'lesson'], 'Late readiness must respect the latest recording and autoplay choice');
  pending.destroy();

  const closed = context.danceVideo(new Node('div'));
  closed.setRecording(group, demo, true); closed.destroy();
  await flush();
  assert.equal(instances.length, 2, 'Closing before the API resolves must not create an orphan player');
  console.log('Verified clean posters, direct API play/retry, blocked autoplay, errors, inline playback, persistent iframe, and teardown races.');
})().catch(error => { console.error(error); process.exitCode = 1; });
