// Run against the development vault only. No note content is modified.
// All temporary Style Settings and color-mode changes are restored in finally.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vault = '@Obsidian-dev';
const cli = process.env.OBSIDIAN_CLI || 'C:/Program Files/Obsidian/Obsidian.com';
const run = (...args) => {
  const output = execFileSync(cli, [`vault=${vault}`, ...args], { encoding: 'utf8', timeout: 30000 });
  if (/^Error:/m.test(output)) throw new Error(output);
  return output.trim();
};
// JSON.stringify must await the promise, inside the async expression.
const ev = code => {
  const raw = run('eval', `code=(async()=>JSON.stringify(await(async()=>{${code}})()))()`);
  return JSON.parse(raw.slice(raw.indexOf('=> ') + 3));
};
const delay = 'await new Promise(r=>setTimeout(r,250));';
const manager = "app.plugins.plugins['obsidian-style-settings'].settingsManager";
const snapshot = () => ev(`const w=document.querySelector('.workspace');const s=getComputedStyle(w);const p=getComputedStyle(w,'::after');const leaf=app.workspace.getMostRecentLeaf();const box=leaf?.containerEl.getBoundingClientRect();return {theme:app.customCss.theme,dark:document.body.classList.contains('theme-dark'),forest:document.body.classList.contains('lw-forest'),padding:parseFloat(s.paddingBottom),sceneHeight:parseFloat(p.height)||0,sceneContent:p.content,imageLength:p.backgroundImage.length,scenePointerEvents:p.pointerEvents,imageRendering:p.imageRendering,workspaceBottom:w.getBoundingClientRect().bottom,leafBottom:box?.bottom,overflow:document.documentElement.scrollWidth>innerWidth+1,font:document.fonts.check('16px "Lanternwood Pixel"'),width:innerWidth,height:innerHeight};`);
const capture = name => run('dev:screenshot', `path=${path.join(root, 'screenshots', name + '.png')}`);
const cdp = (method, params = {}) => run('dev:cdp', `method=${method}`, `params=${JSON.stringify(params)}`);
mkdirSync(path.join(root, 'screenshots'), { recursive: true });
const original = ev(`return {dark:document.body.classList.contains('theme-dark'),forest:${manager}.getSetting('lanternwood','lw-forest'),pixelText:${manager}.getSetting('lanternwood','lw-pixel-text'),mode:app.workspace.getMostRecentLeaf()?.view.getState().mode,throttled:electronWindow.webContents.getBackgroundThrottling()};`);
const report = { date: new Date().toISOString(), app: run('version'), scenarios: [] };
try {
  ev(`electronWindow.webContents.setBackgroundThrottling(false);electronWindow.show();electronWindow.focus();return true;`);
  // Exercise the actual Style Settings toggle, not merely a body class.
  const toggle = ev(`app.setting.open();app.setting.openTabById('obsidian-style-settings');${delay}const doc=app.setting.win.document;doc.querySelector('.style-settings-heading[data-id="lanternwood"].is-collapsed .style-settings-collapse-indicator')?.click();${delay}doc.querySelector('.style-settings-heading[data-id="lw-landscape"].is-collapsed .style-settings-collapse-indicator')?.click();${delay}const row=[...doc.querySelectorAll('.setting-item')].find(e=>e.querySelector('.setting-item-name')?.textContent==='Enable forest');if(!row)throw Error('Forest toggle missing');row.querySelector('.checkbox-container').click();${delay}return document.body.classList.contains('lw-forest');`);
  assert.equal(toggle, !Boolean(original.forest));
  ev(`const row=[...app.setting.win.document.querySelectorAll('.setting-item')].find(e=>e.querySelector('.setting-item-name')?.textContent==='Enable forest');row.querySelector('.checkbox-container').click();${delay}return true;`);
  report.settingsToggle = 'PASS: real UI toggle changes the forest class and restores it';
  ev(`const win=app.setting.win.electronWindow;win.show();win.focus();win.webContents.setBackgroundThrottling(false);${delay}const image=await win.webContents.capturePage();await app.vault.adapter.writeBinary('Development/lanternwood/screenshots/style-settings.png',image.toPNG());win.webContents.setBackgroundThrottling(true);return true;`);
  ev(`app.setting.close();${manager}.setSetting('lanternwood','lw-forest',true);if(!document.body.classList.contains('theme-dark'))app.commands.executeCommandById('theme:toggle-light-dark');${delay}return true;`);
  let state = snapshot();
  assert(state.font && state.padding === 0 && state.sceneHeight > 0 && state.imageLength > 100000);
  assert.equal(state.scenePointerEvents, 'none');
  assert(Math.abs(state.leafBottom - state.workspaceBottom) < 2, 'Forest does not consume editor space');
  assert(ev("const p=getComputedStyle(document.querySelector('.workspace'),'::after');return p.zIndex==='-1' && Number(p.opacity)>0 && Number(p.opacity)<=0.8;"), 'Translucent landscape stays behind content');
  assert(ev("let e=document.querySelector('.markdown-preview-view');while(e&&!e.classList.contains('workspace')){if(getComputedStyle(e).backgroundColor!=='rgba(0, 0, 0, 0)')return false;e=e.parentElement;}return Boolean(e);"), 'No opaque ancestor blocks the landscape behind the reading pane');
  report.scenarios.push({ name: 'dark forest / reading', ...state });
  capture('dark-forest');
  const darkImage = ev("return getComputedStyle(document.querySelector('.workspace'),'::after').backgroundImage.slice(-150);");
  ev(`app.commands.executeCommandById('theme:toggle-light-dark');${delay}return true;`);
  state = snapshot();
  assert(!state.dark && state.imageLength > 100000);
  const dayImage = ev("return getComputedStyle(document.querySelector('.workspace'),'::after').backgroundImage.slice(-150);");
  assert.notEqual(darkImage, dayImage, 'Light mode uses a different landscape');
  report.scenarios.push({ name: 'light forest / reading', ...state });
  capture('light-forest');
  ev(`${manager}.setSetting('lanternwood','lw-forest',false);${delay}return true;`);
  state = snapshot();
  assert.equal(state.padding, 0);
  assert.equal(state.sceneContent, 'none');
  report.scenarios.push({ name: 'light / forest off', ...state });
  capture('light-pixel');
  ev(`app.commands.executeCommandById('theme:toggle-light-dark');${delay}return true;`);
  state = snapshot();
  assert(state.dark && !state.forest && state.padding === 0);
  report.scenarios.push({ name: 'dark / forest off', ...state });
  capture('dark-pixel');
  ev(`${manager}.setSetting('lanternwood','lw-forest',true);const leaf=app.workspace.getMostRecentLeaf();await leaf.setViewState({...leaf.getViewState(),state:{...leaf.view.getState(),mode:'source',source:false}});${delay}return true;`);
  state = snapshot();
  assert(ev("return Boolean(document.querySelector('.markdown-source-view .cm-editor'));"));
  assert(state.leafBottom <= state.workspaceBottom - state.padding + 2);
  report.scenarios.push({ name: 'dark forest / live preview', ...state });
  capture('live-preview');
  cdp('Emulation.setDeviceMetricsOverride', { width: 600, height: 800, deviceScaleFactor: 1, mobile: false });
  ev(delay + 'return true;');
  state = snapshot();
  assert(state.padding === 0 && state.sceneHeight <= 520 && !state.overflow);
  assert(ev("return document.querySelector('.workspace-split.mod-root').getBoundingClientRect().width >= 240;"), 'Both sidebars leave a usable editor at 600px');
  report.scenarios.push({ name: '600px desktop viewport', ...state });
  capture('narrow');
  cdp('Emulation.clearDeviceMetricsOverride');
  ev(`${manager}.setSetting('lanternwood','lw-pixel-text',true);${delay}return true;`);
  assert(ev("return getComputedStyle(document.querySelector('.markdown-source-view')).fontFamily.includes('Lanternwood Pixel');"));
  report.pixelText = 'PASS';
  report.settingsErrors = ev("return app.plugins.plugins['obsidian-style-settings'].errorList;");
  assert.deepEqual(report.settingsErrors, []);
} finally {
  cdp('Emulation.clearDeviceMetricsOverride');
  ev(`${manager}.setSetting('lanternwood','lw-forest',${Boolean(original.forest)});${manager}.setSetting('lanternwood','lw-pixel-text',${Boolean(original.pixelText)});if(document.body.classList.contains('theme-dark')!==${original.dark})app.commands.executeCommandById('theme:toggle-light-dark');const leaf=app.workspace.getMostRecentLeaf();if(leaf?.view?.getViewType()==='markdown')await leaf.setViewState({...leaf.getViewState(),state:{...leaf.view.getState(),mode:${JSON.stringify(original.mode || 'preview')}}});electronWindow.webContents.setBackgroundThrottling(${Boolean(original.throttled)});return true;`);
  writeFileSync(path.join(root, 'screenshots', 'validation.json'), JSON.stringify(report, null, 2));
}
console.log(`PASS: ${report.scenarios.length} real Obsidian scenarios, UI toggle, day/night assets, pixel text, translucent backdrop with no reserved space. Original preferences restored.`);
