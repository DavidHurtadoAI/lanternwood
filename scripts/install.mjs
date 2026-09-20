import { mkdir, copyFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vault = path.resolve(root, '../..');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json')));
const target = path.join(vault, '.obsidian/themes', manifest.name);
await mkdir(target, { recursive: true });
for (const file of ['manifest.json', 'theme.css']) await copyFile(path.join(root, file), path.join(target, file));
console.log(`Installed in development vault: ${target}`);
console.log('Choose Lanternwood in Appearance, then Style Settings → Lanternwood → Activar el bosque.');
