import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (...args) => {
  const out = execFileSync('C:/Program Files/Obsidian/Obsidian.com', ['vault=@Obsidian-dev', ...args], { encoding: 'utf8', timeout: 30000 });
  if (/^Error:/m.test(out)) throw Error(out);
  return out;
};
const ev = code => {
  const out = run('eval', `code=(async()=>JSON.stringify(await(async()=>{${code}})()))()`);
  return JSON.parse(out.slice(out.indexOf('=> ') + 3));
};
const sm = "app.plugins.plugins['obsidian-style-settings'].settingsManager";
const old = ev(`return {style:${sm}.getSetting('lanternwood','lw-art-style'),forest:${sm}.getSetting('lanternwood','lw-forest'),dark:document.body.classList.contains('theme-dark'),throttle:electronWindow.webContents.getBackgroundThrottling()};`);
const results = [];
try {
  ev(`electronWindow.webContents.setBackgroundThrottling(false);${sm}.setSetting('lanternwood','lw-forest',true);return true;`);
  for (const style of ['classic', 'detailed']) {
    const option = `lw-art-${style}`;
    const selected = ev(`app.setting.open();app.setting.openTabById('obsidian-style-settings');await new Promise(r=>setTimeout(r,300));const doc=app.setting.win.document;doc.querySelector('.style-settings-heading[data-id="lanternwood"].is-collapsed .style-settings-collapse-indicator')?.click();doc.querySelector('.style-settings-heading[data-id="lw-landscape"].is-collapsed .style-settings-collapse-indicator')?.click();const row=[...doc.querySelectorAll('.setting-item')].find(e=>e.querySelector('.setting-item-name')?.textContent==='Landscape style');const select=row?.querySelector('select');if(!select)throw Error('Landscape selector missing');select.value='${option}';select.dispatchEvent(new app.setting.win.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,250));app.setting.close();return document.body.classList.contains('${option}');`);
    assert(selected, 'Actual Style Settings dropdown applies the class');
    for (const dark of [true, false]) {
      const asset = style === 'classic' ? (dark ? 'forest-classic.webp' : 'forest-classic-day.webp') : (dark ? 'forest.webp' : 'forest-day.webp');
      const expected = `url("data:image/webp;base64,${readFileSync(path.join(root, 'assets', asset)).toString('base64')}")`;
      const actual = ev(`if(document.body.classList.contains('theme-dark')!==${dark})app.commands.executeCommandById('theme:toggle-light-dark');await new Promise(r=>setTimeout(r,350));const w=document.querySelector('.workspace');const p=getComputedStyle(w,'::after');const img=new Image();img.src=p.backgroundImage.slice(5,-2);await img.decode();if(img.naturalWidth!==2172||img.naturalHeight!==724)throw Error('Image decode failed');return {length:p.backgroundImage.length,tail:p.backgroundImage.slice(-100),padding:getComputedStyle(w).paddingBottom,z:p.zIndex,opacity:p.opacity,errors:app.plugins.plugins['obsidian-style-settings'].errorList};`);
      assert.equal(actual.length, expected.length);
      assert.equal(actual.tail, expected.slice(-100));
      assert.equal(actual.padding, '0px');
      assert.equal(actual.z, '-1');
      assert.deepEqual(actual.errors, []);
      run('dev:screenshot', `path=${path.join(root, 'screenshots', `${style}-${dark ? 'night' : 'day'}.png`)}`);
      results.push({ style, mode: dark ? 'dark' : 'light', asset, ...actual, tail: undefined });
    }
  }
} finally {
  ev(`${sm}.setSetting('lanternwood','lw-art-style',${JSON.stringify(old.style || 'lw-art-classic')});${sm}.setSetting('lanternwood','lw-forest',${Boolean(old.forest)});if(document.body.classList.contains('theme-dark')!==${old.dark})app.commands.executeCommandById('theme:toggle-light-dark');electronWindow.webContents.setBackgroundThrottling(${old.throttle});return true;`);
}
writeFileSync(path.join(root, 'screenshots', 'art-validation.json'), JSON.stringify(results, null, 2));
console.log('PASS: actual Style Settings dropdown, four correct embedded landscapes, zero reserved editor space, transparency preserved. Previous preferences restored.');
