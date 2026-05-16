import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public', 'logo.svg'));

const sizes = [
  ['public/pwa-192x192.png', 192],
  ['public/pwa-512x512.png', 512],
  ['public/apple-touch-icon.png', 180],
];

for (const [file, size] of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(root, file));
  console.log('Wrote', file);
}
