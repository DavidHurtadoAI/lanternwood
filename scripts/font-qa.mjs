import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const ev = code => {
  const out = execFileSync('C:/Program Files/Obsidian/Obsidian.com', ['vault=@Obsidian-dev', 'eval', `code=(async()=>JSON.stringify(await(async()=>{${code}})()))()`], { encoding: 'utf8', timeout: 30000 });
  if (/^Error:/m.test(out)) throw Error(out);
  return JSON.parse(out.slice(out.indexOf('=> ') + 3));
};
const sm = "app.plugins.plugins['obsidian-style-settings'].settingsManager";
const keys = ['lw-font', 'lw-plain-headings', 'lw-plain-navigation', 'lw-pixel-text', 'lw-system-fonts'];
const old = ev(`return ${JSON.stringify(keys)}.map(k=>({key:k,value:${sm}.getSetting('lanternwood',k)}));`);
try {
  ev(`${sm}.setSetting('lanternwood','lw-system-fonts',false);app.setting.open();app.setting.openTabById('obsidian-style-settings');return true;`);
  for (const [choice, family] of [['departure','Departure Mono'],['pixelify','Lanternwood Pixel'],['silkscreen','Lanternwood Silk']]) {
    const result = ev(`await new Promise(r=>setTimeout(r,200));const d=app.setting.win.document;for(const id of ['lanternwood','lw-type'])d.querySelector('.style-settings-heading[data-id="'+id+'"].is-collapsed .style-settings-collapse-indicator')?.click();const row=[...d.querySelectorAll('.setting-item')].find(e=>e.querySelector('.setting-item-name')?.textContent==='Pixel font');const select=row?.querySelector('select');if(!select)throw Error('Font selector missing');select.value='lw-font-${choice}';select.dispatchEvent(new app.setting.win.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,200));const faces=await document.fonts.load('19px "${family}"','Áéíóúñ¿¡Il1O0');return {selected:document.body.classList.contains('lw-font-${choice}'),family:getComputedStyle(document.body).getPropertyValue('--lw-pixel-font'),loaded:faces.length,errors:app.plugins.plugins['obsidian-style-settings'].errorList};`);
    assert(result.selected);
    assert(result.family.includes(family));
    assert(result.loaded > 0);
    assert.deepEqual(result.errors, []);
    console.log(`PASS: actual selector and embedded font loaded: ${family}`);
  }
  const scopes = ev(`${sm}.setSetting('lanternwood','lw-plain-headings',false);${sm}.setSetting('lanternwood','lw-plain-navigation',false);${sm}.setSetting('lanternwood','lw-pixel-text',true);await new Promise(r=>setTimeout(r,150));const probe=document.createElement('div');probe.className='markdown-preview-view';probe.innerHTML='<h1>Heading</h1><p>Text</p><div class="metadata-container"><input class="metadata-property-key-input"></div>';document.body.append(probe);try{const pixel=[...probe.querySelectorAll('h1,p,input')].map(e=>getComputedStyle(e).fontFamily);${sm}.setSetting('lanternwood','lw-plain-headings',true);${sm}.setSetting('lanternwood','lw-plain-navigation',true);${sm}.setSetting('lanternwood','lw-pixel-text',false);await new Promise(r=>setTimeout(r,150));return {pixel,plain:[...probe.querySelectorAll('h1,p,input')].map(e=>getComputedStyle(e).fontFamily)};}finally{probe.remove();}`);
  assert(scopes.pixel.every(f => f.includes('Lanternwood Silk')));
  assert(!scopes.plain[0].includes('Lanternwood Silk'));
  assert(!scopes.plain[1].includes('Lanternwood Silk'));
  assert(scopes.plain[2].includes('Lanternwood Silk'));
  console.log('PASS: selected font reaches headings, paragraphs and properties; reading-font overrides still work.');
  const native = ev(`const props=['--font-text','--font-interface','--font-monospace'];const saved=props.map(k=>[k,document.body.style.getPropertyValue(k),document.body.style.getPropertyPriority(k)]);const probe=document.createElement('div');probe.className='markdown-preview-view markdown-rendered';probe.innerHTML='<h1>Heading</h1><p>Text</p><div class="metadata-container"><input></div><span class="workspace-tab-header-inner-title">Tab</span><span class="modal-title">Modal</span><span class="status-bar-item">Status</span><code>Code</code>';document.body.append(probe);try{document.body.style.setProperty('--font-text','Georgia');document.body.style.setProperty('--font-interface','Arial');document.body.style.setProperty('--font-monospace','monospace');${sm}.setSetting('lanternwood','lw-plain-headings',false);${sm}.setSetting('lanternwood','lw-plain-navigation',false);${sm}.setSetting('lanternwood','lw-pixel-text',true);const d=app.setting.win.document;const row=[...d.querySelectorAll('.setting-item')].find(e=>e.querySelector('.setting-item-name')?.textContent==='Use Obsidian fonts everywhere');row.querySelector('.checkbox-container').click();await new Promise(r=>setTimeout(r,150));return {enabled:document.body.classList.contains('lw-system-fonts'),fonts:[...probe.querySelectorAll('h1,p,input,span,code')].map(e=>getComputedStyle(e).fontFamily),textSize:getComputedStyle(probe).fontSize};}finally{probe.remove();for(const [k,v,p]of saved){if(v)document.body.style.setProperty(k,v,p);else document.body.style.removeProperty(k);}}`);
  assert(native.enabled);
  assert.deepEqual(native.fonts, ['Georgia','Georgia','Arial','Arial','Arial','Arial','monospace']);
  console.log('PASS: global switch overrides pixel note text and uses native text/interface/code fonts, including tabs, properties, modal titles and status.');

} finally {
  for (const item of old) ev(`${item.value === undefined ? `${sm}.clearSetting('lanternwood','${item.key}')` : `${sm}.setSetting('lanternwood','${item.key}',${JSON.stringify(item.value)})`};return true;`);
  ev('app.setting.close();return true;');
}
