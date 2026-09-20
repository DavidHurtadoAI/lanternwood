import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(path.join(root, p));
const manifest = JSON.parse(await read('manifest.json'));
const font = (await read('assets/PixelifySans.ttf')).toString('base64');
const forest = (await read('assets/forest.png')).toString('base64');
const forestDay = (await read('assets/forest-day.png')).toString('base64');
const classic = (await read('assets/forest-classic.png')).toString('base64');
const classicDay = (await read('assets/forest-classic-day.png')).toString('base64');
const license = (await read('assets/OFL-PixelifySans.txt')).toString();
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
let iconCss = '';
for (const [name, rows] of Object.entries(icons)) {
  const rects = rows.flatMap((row, y) => [...row].flatMap((cell, x) => cell === '#' ? [`<rect x="${x}" y="${y + 1}" width="1" height="1"/>`] : [])).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>`;
  const names = [name, ...Object.keys(aliases).filter(a => aliases[a] === name)];
  const selectors = names.map(n => `body:not(.lw-native-icons) svg.lucide-${n}`);
  iconCss += `${selectors.join(',\n')} {\n  background-color: currentColor;\n  mask-image: url("data:image/svg+xml,${encodeURIComponent(svg)}");\n  mask-size: 100% 100%;\n  mask-repeat: no-repeat;\n  image-rendering: pixelated;\n}\n`;
  iconCss += `${selectors.map(s => `${s} > *`).join(',\n')} {\n  visibility: hidden;\n}\n`;
}
const output = `/* Lanternwood ${manifest.version} | David Hurtado | MIT\n * Generated from src/theme.css — npm run build. No network dependencies.\n */\n/*\n${license}\n*/\n@font-face {\n  font-family: "Lanternwood Pixel";\n  src: url("data:font/ttf;base64,${font}") format("truetype");\n  font-weight: 400 700;\n  font-style: normal;\n  font-display: swap;\n}\nbody { --lw-forest-art: url("data:image/png;base64,${forest}"); }\n\n${source}\n/* Original pixel glyphs */\n${iconCss}`;
// Chromium limits custom-property token streams to 2 MiB. Large image data
// URLs must be direct background-image values, never CSS custom properties.
const finalCss = output.replace(`body { --lw-forest-art: url("data:image/png;base64,${forest}"); }`, '')
  + `\nbody.theme-dark.lw-forest .workspace::after { background-image: url("data:image/png;base64,${classic}"); }\n`
  + `\nbody.theme-light.lw-forest .workspace::after { background-image: url("data:image/png;base64,${classicDay}"); }\n`
  + `\nbody.theme-dark.lw-forest.lw-art-detailed .workspace::after { background-image: url("data:image/png;base64,${forest}"); }\n`
  + `\nbody.theme-light.lw-forest.lw-art-detailed .workspace::after { background-image: url("data:image/png;base64,${forestDay}"); }\n`;
const formatted = finalCss
  .replaceAll('background-color: currentColor', 'background-color: currentcolor')
  .replace(/}\n(?=\S)/g, '}\n\n')
  .replace(/\*\/\n(?=\/\*)/g, '*/\n\n');
await writeFile(path.join(root, 'theme.css'), formatted);
console.log(`Built Lanternwood ${manifest.version}: ${(Buffer.byteLength(finalCss) / 1024).toFixed(0)} KB, ${Object.keys(icons).length} original glyphs, embedded font and day/night forests.`);
