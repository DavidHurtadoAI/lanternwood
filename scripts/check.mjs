import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import * as yaml from 'js-yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(path.join(root, p));
const manifest = JSON.parse(await read('manifest.json'));
const pkg = JSON.parse(await read('package.json'));
const versions = JSON.parse(await read('versions.json'));
assert.equal(manifest.version, pkg.version);
assert.equal(versions[manifest.version], manifest.minAppVersion);
const css = (await read('theme.css')).toString();
const tree = postcss.parse(css);
const settingsComments = [];
tree.walkComments(c => { if (c.text.trimStart().startsWith('@settings')) settingsComments.push(c.text); });
assert.equal(settingsComments.length, 1);
const settings = yaml.load(settingsComments[0].replace(/^\s*@settings/, ''));
assert.equal(settings.id, 'lanternwood');
assert.equal(new Set(settings.settings.map(s => s.id)).size, settings.settings.length);
assert.equal(settings.settings.find(s => s.id === 'lw-forest').type, 'class-toggle');
assert.equal(settings.settings.find(s => s.id === 'lw-forest').addCommand, true);
const font = await read('assets/PixelifySans.ttf');
assert.equal(font.readUInt32BE(0), 0x00010000, 'Valid TrueType font');
assert(css.includes(font.toString('base64')), 'Font is embedded');
let dimensions;
for (const file of ['forest.png', 'forest-day.png', 'forest-classic.png', 'forest-classic-day.png']) {
  const image = await read(`assets/${file}`);
  assert.equal(image.subarray(1, 4).toString(), 'PNG');
  const size = [image.readUInt32BE(16), image.readUInt32BE(20)];
  if (dimensions) assert.deepEqual(size, dimensions, 'Day/night dimensions match');
  dimensions = size;
  assert(css.includes(image.toString('base64')), `${file} is embedded`);
}
tree.walkDecls(d => {
  assert(!(/url\(\s*['"]?https?:/i.test(d.value)), 'No remote dependencies');
  if (d.prop.startsWith('--')) assert(Buffer.byteLength(d.value) < 2 * 1024 * 1024, 'Chromium custom-property size limit');
});
const art = settings.settings.find(s => s.id === 'lw-art-style');
assert.equal(art.type, 'class-select');
assert.equal(art.default, 'lw-art-classic');
assert.deepEqual(art.options.map(o => o.value), ['lw-art-classic', 'lw-art-detailed']);
console.log(`PASS: CSS parsed; ${settings.settings.length} valid settings; synchronized ${manifest.version}; font and four ${dimensions.join('×')} landscapes embedded; no remote assets or oversized variables.`);
