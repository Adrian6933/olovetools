import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { spawnSync } from 'node:child_process';

const directory = process.argv[2] || path.join(os.tmpdir(), 'olovetools-review-20261021');
await fs.mkdir(directory, { recursive: true });
const save = (name, data) => fs.writeFile(path.join(directory, name), data);
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="#fff"/><rect x="80" y="60" width="320" height="200" rx="40" fill="#e63946"/><circle cx="240" cy="160" r="55" fill="#457b9d"/></svg>';
await save('sample.svg', svg);
await sharp(Buffer.from(svg)).png().toFile(path.join(directory, 'sample.png'));
await sharp(Buffer.from(svg)).jpeg({ quality: 94 }).toFile(path.join(directory, 'sample.jpg'));
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 1; i <= 3; i++) { const page = pdf.addPage([320, 240]); page.drawText(`Review page ${i}`, { x: 40, y: 160, font, size: 24 }); }
await save('three-pages.pdf', await pdf.save());
const rate = 44100, samples = rate * 2, wav = Buffer.alloc(44 + samples * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
for (let i = 0; i < rate; i++) wav.writeInt16LE(Math.round(Math.sin(i / rate * Math.PI * 880) * 12000), 44 + i * 2);
await save('tone-and-silence.wav', wav);
await save('subtitles.srt', '1\n00:00:00,500 --> 00:00:01,800\nHola, <i>mundo</i>.\n\n2\n00:00:02,000 --> 00:00:03,000\nSegunda línea.\n');
await save('chart.csv', 'Mes;Ventas;Objetivo\nEnero;1.234,5;1.100\nFebrero;2.000,75;3.500\nMarzo;1.250,25;1.200\n');
await save('sample.json', '{"name":"España","count":3,"items":[1,2,3]}\n');
await save('animation.json', JSON.stringify({ v:'5.7.0', fr:30, ip:0, op:60, w:200, h:200, nm:'Review', layers:[{ty:1,ind:1,nm:'Square',sw:100,sh:100,sc:'#e63946',ip:0,op:60,ks:{o:{a:0,k:100},r:{a:0,k:0},p:{a:0,k:[100,100,0]},a:{a:0,k:[50,50,0]},s:{a:0,k:[100,100,100]}}}] }));
const zip = new JSZip(); zip.file('hello.txt', 'Hola, España.'); zip.file('folder/data.json', '{"ok":true}');
await save('sample.zip', await zip.generateAsync({type:'nodebuffer'}));
console.log(directory);
if (process.argv.includes('--browser')) {
  const video = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=15', '-t', '2', '-c:v', 'libvpx', '-an', '-y', path.join(directory, 'sample.webm')], { encoding: 'utf8', windowsHide: true });
  if (video.error || video.status !== 0) throw new Error('The browser review needs ffmpeg on PATH to create sample.webm. ' + (video.error?.message || video.stderr));
  await fs.writeFile('public/review-local.html', '<!doctype html><html lang="en"><meta charset="utf-8"><title>Media engine review</title><body><h1>Media engine review</h1><pre>Running…</pre><script type="module" src="/scripts/test-media-browser.ts"></script></body></html>');
  console.log('Open http://localhost:4321/review-local.html with the dev server. Remove public/review-local.html before building.');
}
