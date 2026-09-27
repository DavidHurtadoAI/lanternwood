import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const ev = code => {
  const out = execFileSync('C:/Program Files/Obsidian/Obsidian.com', ['vault=@Obsidian-dev', 'eval', `code=(async()=>JSON.stringify(await(async()=>{${code}})()))()`], { encoding: 'utf8', timeout: 30000 });
  if (/^Error:/m.test(out)) throw Error(out);
  return JSON.parse(out.slice(out.indexOf('=> ') + 3));
};
const sm = "app.plugins.plugins['obsidian-style-settings'].settingsManager";
const old = ev(`const active=app.workspace.getMostRecentLeaf();const file=active?.view.file;if(!file)throw Error('Open a Markdown note first');window.__lwSizeQA={active,leaf:null};return {size:app.getBaseFontSize(),file:file.path,settings:['lw-font','lw-pixel-text','lw-system-fonts'].map(k=>({key:k,value:${sm}.getSetting('lanternwood',k)}))};`);
try {
  ev(`window.__lwSizeQA.leaf=app.workspace.getLeaf('split');await window.__lwSizeQA.leaf.openFile(app.vault.getAbstractFileByPath(${JSON.stringify(old.file)}));${sm}.setSetting('lanternwood','lw-pixel-text',true);${sm}.setSetting('lanternwood','lw-system-fonts',false);return true;`);
  for (const [choice, family] of [['pixelify','Lanternwood Pixel'],['silkscreen','Lanternwood Silk']]) {
    ev(`${sm}.setSetting('lanternwood','lw-font','lw-font-${choice}');return true;`);
    for (const [mode, source] of [['preview', false], ['source', false], ['source', true]]) {
      ev(`await window.__lwSizeQA.leaf.setViewState({type:'markdown',state:{file:${JSON.stringify(old.file)},mode:'${mode}',source:${source}}});return true;`);
      for (const size of [16, 22, 28]) {
        const actual = ev(`app.setBaseFontSize(${size});await new Promise(r=>setTimeout(r,150));const el=window.__lwSizeQA.leaf.view.containerEl.querySelector('${mode === 'preview' ? '.markdown-preview-view' : '.cm-content'}');if(!el)throw Error('View missing');const css=getComputedStyle(el);return {size:parseFloat(css.fontSize),family:css.fontFamily};`);
        assert.equal(actual.size, size, `${choice} ${mode} source=${source}`);
        assert(actual.family.includes(family));
      }
      console.log(`PASS: ${choice}, ${mode}, source=${source}, native sizes 16/22/28px`);
    }
  }
} finally {
  ev(`app.setBaseFontSize(${old.size});window.__lwSizeQA.leaf?.detach();app.workspace.setActiveLeaf(window.__lwSizeQA.active,{focus:true});delete window.__lwSizeQA;return true;`);
  for (const item of old.settings) ev(`${item.value === undefined ? `${sm}.clearSetting('lanternwood','${item.key}')` : `${sm}.setSetting('lanternwood','${item.key}',${JSON.stringify(item.value)})`};return true;`);
}
