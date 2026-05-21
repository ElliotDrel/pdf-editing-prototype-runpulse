// scripts/gen-og.mjs
// Run once: node scripts/gen-og.mjs
// Writes public/og-image.png (1200x630)

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'public', 'og-image.png');

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="630" fill="#0F0E0C"/>

  <!-- Left accent bar -->
  <rect x="60" y="160" width="4" height="200" fill="#7BFF8F" rx="2"/>

  <!-- Main headline -->
  <text x="84" y="218" font-family="Georgia, 'Times New Roman', serif" font-size="62" font-weight="400" fill="#EDE7DA">Form Fill shipped</text>
  <text x="84" y="295" font-family="Georgia, 'Times New Roman', serif" font-size="62" font-weight="400" fill="#EDE7DA">the engine.</text>

  <!-- Italic sub-line -->
  <text x="84" y="362" font-family="Georgia, 'Times New Roman', serif" font-size="50" font-style="italic" fill="#7BFF8F">Here's the layer above it.</text>

  <!-- Descriptor row -->
  <text x="84" y="445" font-family="'Courier New', Courier, monospace" font-size="18" letter-spacing="3" fill="#65605A">ONE SCREEN  Â·  REAL PDF IN  Â·  REAL PDF OUT</text>

  <!-- Bottom watermark -->
  <text x="1140" y="598" font-family="'Courier New', Courier, monospace" font-size="15" fill="#3A3632" text-anchor="end">PDF Editing Prototype</text>
</svg>`;

const buf = Buffer.from(svg, 'utf8');

await sharp(buf)
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log('wrote', outPath);

