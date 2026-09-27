import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Preserve the source PNGs and their dimensions. WebP encoding is lossy;
// quality 75 keeps all four scenes within our offline CSS size budget.
for (const name of ['forest', 'forest-day', 'forest-classic', 'forest-classic-day']) {
  const { data, info } = await sharp(path.join(root, 'assets', `${name}.png`))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Bake the former top-to-bottom CSS fade into the source alpha channel.
  // Always start from the original PNG so repeated builds never accumulate fades.
  for (let y = 0; y < info.height; y++) {
    const fade = Math.min(1, y / ((info.height - 1) * 0.45));
    for (let x = 0; x < info.width; x++) {
      const index = (y * info.width + x) * 4 + 3;
      data[index] = Math.round(data[index] * fade);
    }
  }
  const result = await sharp(data, { raw: info })
    .webp({ quality: 75, effort: 6, smartSubsample: true })
    .toFile(path.join(root, 'assets', `${name}.webp`));
  console.log(`${name}: ${result.width}×${result.height}, ${result.size} bytes`);
}
