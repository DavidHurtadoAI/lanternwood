import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(path.join(root, p));
const manifest = JSON.parse(await read('manifest.json'));
const fonts = JSON.parse(await read('assets/fonts/fonts.json'));
let fontCss = '';
const licenses = new Set();
let sharedTerms;
for (const face of fonts) {
  const font = (await read('assets/fonts/' + face.file)).toString('base64');
  if (!licenses.has(face.license)) {
    const license = (await read('assets/fonts/' + face.license)).toString().replace(/[ \t]+$/gm, '');
    const split = license.indexOf('PREAMBLE');
    if (split < 0) throw Error('Unexpected font license format');
    const terms = license.slice(split).replace(/\s+/g, ' ').trim();
    if (sharedTerms !== undefined && terms !== sharedTerms) throw Error('Font license terms differ');
    // Keep every copyright notice; include identical OFL terms once for all fonts.
    fontCss += '/*\n' + (sharedTerms === undefined ? license : license.slice(0, split) + 'Full SIL OFL 1.1 terms above apply to this font.\n') + '\n*/\n';
    sharedTerms = terms;
    licenses.add(face.license);
  }
  fontCss += '@font-face {\n  font-family: "' + face.family + '";\n  src: url("data:font/woff2;base64,' + font + '") format("woff2");\n  font-weight: ' + face.weight + ';\n  font-style: normal;\n  font-display: swap;\n}\n';
}
const forest = (await read('assets/forest.webp')).toString('base64');
const forestDay = (await read('assets/forest-day.webp')).toString('base64');
const classic = (await read('assets/forest-classic.webp')).toString('base64');
const classicDay = (await read('assets/forest-classic-day.webp')).toString('base64');
const source = await read('src/theme.css');

// Original 16×16 pixel glyphs, represented as occupied cells. Preserve the
// native SVG element (and its accessibility semantics); replace only its art.
const icons = {
  'file-text': ['..########......','..#......##.....','..#......#.#....','..#......####...','..#.........#...','..#.........#...','..#..#####..#...','..#.........#...','..#..#####..#...','..#.........#...','..#..###....#...','..#.........#...','..###########...'],
  'folder': ['................','.#####..........','.#...#..........','.#############..','.#...........#..','.#...........#..','.#...........#..','.#...........#..','.#...........#..','.#...........#..','.#############..'],
  'search': ['....#####.......','...#.....#......','..#.......#.....','..#.......#.....','..#.......#.....','..#.......#.....','...#.....#......','....#####.......','.........##.....','..........##....','...........##...','............##..'],
  'settings': ['......####......','..##..#..#..##..','..#.###..###.#..','..#..........#..','...#........#...','####..####..####','#.....#..#.....#','#.....#..#.....#','####..####..####','...#........#...','..#..........#..','..#.###..###.#..','..##..#..#..##..','......####......'],
  'calendar': ['....#.....#.....','....#.....#.....','.#############..','.#..#.....#..#..','.#...........#..','.#############..','.#...........#..','.#..##..##...#..','.#...........#..','.#..##..##...#..','.#...........#..','.#############..'],
  'book-open': ['.#####...#####..','.#....#.#....#..','.#.....#.....#..','.#.....#.....#..','.#.....#.....#..','.#.....#.....#..','.#.....#.....#..','.#.....#.....#..','.#....###....#..','.#####...#####..'],
  'lamp': ['.....#####......','.......#........','....#######.....','...#.......#....','..###########...','....#.....#.....','....#..#..#.....','....#..#..#.....','....#..#..#.....','....#.....#.....','....#######.....','...#########....'],
  'trees': ['....#......#....','...###....###...','..#####..#####..','...###....###...','..#####..#####..','.##############.','...###....###...','..#####..#####..','.#######.######.','....#......#....','....#......#....'],
  'chevron-right': ['................','.....##.........','......##........','.......##.......','........##......','.........##.....','........##......','.......##.......','......##........','.....##.........'],
  'chevron-down': ['................','................','..##........##..','...##......##...','....##....##....','.....##..##.....','......####......','.......##.......'],
  'git-fork': ['.####.....####..','.#..#.....#..#..','.####.....####..','...#........#...','...#........#...','...##########...','.......#........','.......#........','.....#####......','.....#...#......','.....#...#......','.....#####......'],
  'bookmark': ['...#########....','...#.......#....','...#.......#....','...#.......#....','...#.......#....','...#.......#....','...#.......#....','...#...#...#....','...#..#.#..#....','...#.#...#.#....','...##.....##....'],
  'plus': ['................','.......##.......','.......##.......','.......##.......','.......##.......','...##########...','...##########...','.......##.......','.......##.......','.......##.......','.......##.......'],
  'pencil': ['...........###..','..........#..#..','.........#..#...','........#..#....','.......#..#.....','......#..#......','.....#..#.......','....#..#........','...#..#.........','..#..#..........','..###...........','..#.............'],
  'layout-dashboard': ['..#####.#####...','..#...#.#...#...','..#...#.#####...','..#...#.........','..#####.#####...','........#...#...','..#####.#...#...','..#...#.#...#...','..#####.#####...'],
  'square-pen': ['..#######.......','..#........###..','..#.......#..#..','..#......#..#...','..#.....#..#....','..#....#..#.....','..#...#..#......','..#...###.......','..#...#.....#...','..#.........#...','..###########...'],
};
const aliases = { 'folder-closed': 'folder', 'file': 'file-text', 'file-search': 'search', 'calendar-days': 'calendar', 'book-open-text': 'book-open', 'settings-2': 'settings', 'lamp-desk': 'lamp' };
// Each occupied horizontal run becomes a solid, current-color background layer.
// Background positions are relative to the remaining space, not the full icon.
const pct = n => Number(n.toFixed(4)) + '%';
const pixelBackground = rows => {
  const runs = rows.flatMap((row, y) => [...row.matchAll(/#+/g)].map(m => ({ x: m.index, y: y + 1, w: m[0].length })));
  return 'background-image: ' + runs.map(() => 'linear-gradient(currentcolor, currentcolor)').join(', ') + ';\n  background-position: ' + runs.map(r => pct(r.w === 16 ? 0 : r.x / (16 - r.w) * 100) + ' ' + pct(r.y / 15 * 100)).join(', ') + ';\n  background-size: ' + runs.map(r => pct(r.w / 16 * 100) + ' 6.25%').join(', ') + ';\n  background-repeat: no-repeat;';
};
let iconCss = '';
for (const [name, rows] of Object.entries(icons)) {
  const names = [name, ...Object.keys(aliases).filter(a => aliases[a] === name)];
  const selectors = names.map(n => `body:not(.lw-native-icons) svg.lucide-${n}`);
  iconCss += `${selectors.join(',\n')} {\n  ${pixelBackground(rows)}\n}\n`;
  iconCss += `${selectors.map(s => `${s} > *`).join(',\n')} {\n  visibility: hidden;\n}\n`;
}
const output = `/* Lanternwood ${manifest.version} | David Hurtado | MIT\n * Generated from src/theme.css — npm run build. No network dependencies.\n */\n${fontCss}\nbody { --lw-forest-art: url("data:image/webp;base64,${forest}"); }\n\n${source}\n/* Original pixel glyphs drawn with current-color gradient cells. */\n${iconCss}`;
// Chromium limits custom-property token streams to 2 MiB. Large image data
// URLs must be direct background-image values, never CSS custom properties.
const finalCss = output.replace(`body { --lw-forest-art: url("data:image/webp;base64,${forest}"); }`, '')
  + `\nbody.theme-dark.lw-forest .workspace::after { background-image: url("data:image/webp;base64,${classic}"); }\n`
  + `\nbody.theme-light.lw-forest .workspace::after { background-image: url("data:image/webp;base64,${classicDay}"); }\n`
  + `\nbody.theme-dark.lw-forest.lw-art-detailed .workspace::after { background-image: url("data:image/webp;base64,${forest}"); }\n`
  + `\nbody.theme-light.lw-forest.lw-art-detailed .workspace::after { background-image: url("data:image/webp;base64,${forestDay}"); }\n`;
const formatted = finalCss
  .replaceAll('background-color: currentColor', 'background-color: currentcolor')
  .replace(/}\n(?=\S)/g, '}\n\n')
  .replace(/\*\/\n(?=\/\*)/g, '*/\n\n');
await writeFile(path.join(root, 'theme.css'), formatted);
console.log(`Built Lanternwood ${manifest.version}: ${(Buffer.byteLength(finalCss) / 1024).toFixed(0)} KB, ${Object.keys(icons).length} original glyphs, embedded font and day/night forests.`);
