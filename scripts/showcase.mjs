// Capture the actual Obsidian window at a presentation-friendly zoom.
// Restore the original zoom, view mode, scroll position and preferences.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = 'C:/Program Files/Obsidian/Obsidian.com';
const run = (...args) => {
  const out=execFileSync(cli,['vault=@Obsidian-dev',...args],{encoding:'utf8',timeout:30000});
  if (/^Error:/m.test(out)) throw Error(out);
  return out;
};
const ev = code => {
  const out=run('eval',`code=(async()=>JSON.stringify(await(async()=>{${code}})()))()`);
  return JSON.parse(out.slice(out.indexOf('=> ')+3));
};
const sm="app.plugins.plugins['obsidian-style-settings'].settingsManager";
const old=ev(`const leaf=app.workspace.getMostRecentLeaf();return {zoom:electronWindow.webContents.getZoomFactor(),dark:document.body.classList.contains('theme-dark'),forest:${sm}.getSetting('lanternwood','lw-forest'),height:${sm}.getSetting('lanternwood','lw-forest-height'),state:leaf.getViewState(),scroll:leaf.view.previewMode?.containerEl.scrollTop||0,throttled:electronWindow.webContents.getBackgroundThrottling()};`);
try {
  ev(`app.setting.close();electronWindow.show();electronWindow.focus();electronWindow.webContents.setBackgroundThrottling(false);electronWindow.webContents.setZoomFactor(0.8);${sm}.setSetting('lanternwood','lw-forest',true);${sm}.setSetting('lanternwood','lw-forest-height',220);const leaf=app.workspace.getMostRecentLeaf();await leaf.setViewState({...leaf.getViewState(),state:{...leaf.view.getState(),mode:'preview'}});return true;`);
  for (const [dark,name] of [[true,'dark-forest'],[false,'light-forest']]) {
    ev(`if(document.body.classList.contains('theme-dark')!==${dark})app.commands.executeCommandById('theme:toggle-light-dark');await new Promise(r=>setTimeout(r,250));document.querySelector('.markdown-preview-view').scrollTop=0;await new Promise(r=>setTimeout(r,300));return true;`);
    run('dev:screenshot',`path=${path.join(root,'screenshots',`${name}.png`)}`);
  }
} finally {
  ev(`electronWindow.webContents.setZoomFactor(${old.zoom});${sm}.setSetting('lanternwood','lw-forest',${Boolean(old.forest)});${old.height===undefined?`${sm}.clearSetting('lanternwood','lw-forest-height');`:`${sm}.setSetting('lanternwood','lw-forest-height',${JSON.stringify(old.height)});`}if(document.body.classList.contains('theme-dark')!==${old.dark})app.commands.executeCommandById('theme:toggle-light-dark');await app.workspace.getMostRecentLeaf().setViewState(${JSON.stringify(old.state)});if(app.workspace.getMostRecentLeaf().view.previewMode?.containerEl)app.workspace.getMostRecentLeaf().view.previewMode.containerEl.scrollTop=${old.scroll};electronWindow.webContents.setBackgroundThrottling(${old.throttled});return true;`);
}
console.log('Captured matching real day/night views. User preferences restored.');
