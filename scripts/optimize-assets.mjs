import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Preserve the source PNGs and their dimensions. WebP encoding is lossy;
// quality 75 keeps all four scenes within our offline CSS size budget.
for (const name of ['forest', 'forest-day', 'forest-classic', 'forest-classic-day']) {
  const result = await sharp(path.join(root, 'assets', `${name}.png`))
    .webp({ quality: 75, effort: 6, smartSubsample: true })
    .toFile(path.join(root, 'assets', `${name}.webp`));
  console.log(`${name}: ${result.width}×${result.height}, ${result.size} bytes`);
}
