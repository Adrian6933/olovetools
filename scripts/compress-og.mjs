#!/usr/bin/env node
// Comprime las imágenes OG pesadas de public/ (PNG con paleta + 1200px máx).
// Uso: node scripts/compress-og.mjs [--threshold=200]  (KB; por defecto 200)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// En Windows, la caché de sharp mantiene abierto el archivo de entrada y
// bloquea la reescritura — desactivarla antes de procesar.
sharp.cache(false);

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const thresholdArg = process.argv.find((a) => a.startsWith('--threshold='));
const THRESHOLD_KB = thresholdArg ? parseInt(thresholdArg.split('=')[1], 10) : 200;

const files = fs.readdirSync(PUBLIC_DIR).filter((f) => f.startsWith('og-') && f.endsWith('.png'));

for (const file of files) {
  const full = path.join(PUBLIC_DIR, file);
  const sizeKB = fs.statSync(full).size / 1024;
  if (sizeKB <= THRESHOLD_KB) continue;

  const buf = await sharp(full)
    .resize({ width: 1200, height: 630, fit: 'inside', withoutEnlargement: true })
    .png({ palette: true, quality: 80, compressionLevel: 9 })
    .toBuffer();

  if (buf.length < fs.statSync(full).size) {
    fs.writeFileSync(full, buf);
    console.log(`${file}: ${Math.round(sizeKB)} KB -> ${Math.round(buf.length / 1024)} KB`);
  } else {
    console.log(`${file}: sin mejora, se mantiene`);
  }
}
console.log('Hecho.');
