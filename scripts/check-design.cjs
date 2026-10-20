const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'design.css'), 'utf8');
function tokens(selector) {
  const block = css.slice(css.indexOf(selector));
  return Object.fromEntries([...block.slice(0, block.indexOf('}')).matchAll(/--([\w-]+):\s*(#[0-9a-f]+);/gi)].map(m => [m[1], m[2]]));
}
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
const dark = tokens(':root');
for (const [theme, palette] of [['dark', dark], ['light', { ...dark, ...tokens('body.light {') }]]) {
  for (const [foreground, background, minimum] of [['text', 'panel', 4.5], ['text', 'bg', 4.5], ['muted', 'panel', 4.5], ['muted', 'bg', 4.5], ['muted', 'input', 4.5], ['accent', 'panel', 4.5], ['gold', 'bg', 4.5], ['action-ink', 'accent', 4.5], ['control-border', 'input', 3]]) {
    const ratio = contrast(palette[foreground], palette[background]);
    assert.ok(ratio >= minimum, `${theme}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1`);
  }
}
assert.ok(css.includes('prefers-reduced-motion: reduce'));
assert.ok(css.includes('forced-colors: active'));
console.log('Design checks passed: dark/light text, action and control contrast; motion and forced-color fallbacks.');
