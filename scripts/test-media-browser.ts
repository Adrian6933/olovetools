// Open /review-local.html with `npm run dev` after generating review fixtures.
// This runs production engines in a real browser; no test code ships in pages.
import * as audio from '../src/tools/audiosnap/lib/audio';
import * as crop from '../src/tools/cropsnap/lib/render';
import * as gif from '../src/tools/gif-bolt/lib/gif';
import * as exif from '../src/tools/exif-clear/lib/containers';
import * as mask from '../src/tools/backgroundremover/lib/mask';
import * as inpaint from '../src/tools/cleansnap/lib/inpaint';
import { buildIco } from '../src/tools/favicon-bolt/lib/ico';
import { encodeBitmap, disposeEncoder } from '../src/tools/pastesnap/lib/encode';
import { runOptimize } from '../src/tools/svg-optimizer/lib/engine';
import { DEFAULT_SETTINGS } from '../src/tools/svg-optimizer/lib/catalog';
import { sanitize } from '../src/tools/html-sanitizer/lib/sanitize';
import { PRESETS } from '../src/tools/html-sanitizer/lib/presets';
import { seekExact as seekFrame } from '../src/tools/framesnap/lib/video';
import { seekExact as seekBatch } from '../src/tools/framebolt/lib/video';
import { blankDoc, makeText } from '../src/tools/meme-bolt/lib/doc';
import { renderToCanvas } from '../src/tools/meme-bolt/lib/render';
import { renderComposite } from '../src/tools/watermark-snap/lib/render';
import { createTextLayer } from '../src/tools/watermark-snap/lib/layers';
import { renderDesign } from '../src/tools/css-designer/lib/render';
import { DEFAULT_DESIGN } from '../src/tools/css-designer/lib/defaults';
import { renderCard } from '../src/tools/codecard/lib/export';
import { supportedMime, capSize } from '../src/tools/recordsnap/lib/recorder';
import { codesOf } from '../src/tools/key-doctor/lib/layouts';
import { readSystemInfo } from '../src/tools/device-test/lib/system';

const output = document.querySelector('pre')!;
const results: {tool: string; passed: boolean; detail?: string}[] = [];
function check(condition: unknown, detail: string): asserts condition { if (!condition) throw new Error(detail); }
async function test(tool: string, run: () => Promise<void> | void) {
  try { await run(); results.push({ tool, passed: true }); }
  catch (error) { results.push({ tool, passed: false, detail: String(error) }); }
  output.textContent = JSON.stringify(results, null, 2);
}
async function fixture(name: string) {
  const response = await fetch('/artifacts/review/' + name);
  check(response.ok, 'Fixture unavailable: ' + name);
  return response.blob();
}
const canvas = document.createElement('canvas');
canvas.width = 32; canvas.height = 32;
const ctx = canvas.getContext('2d')!;
ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 16, 32);
ctx.fillStyle = '#0000ff'; ctx.fillRect(16, 0, 16, 32);

await test('audiosnap: decode, silence trim, speed, WAV 16/24/32', async () => {
  const source = await audio.decodeAudioFile(new File([await fixture('tone-and-silence.wav')], 'tone.wav'));
  check(source.info.sampleRate === 44100 && source.buffer.duration === 2, 'Native rate/duration changed');
  const bounds = audio.findSpeechBounds(audio.buildPeakMip(source.buffer), -45, 0);
  check(bounds && bounds.outSec > .99 && bounds.outSec < 1.02, 'Silence detection failed');
  const edited = await audio.renderEdit(source.buffer, { inSec: 0, outSec: 1, gainDb: 0, normalize: false, normalizeTargetDb: -1, fadeInSec: .02, fadeOutSec: .02, speed: 2, channelMode: 'mono', sampleRate: 44100, removeDc: false });
  check(edited.duration === .5, 'Speed output duration');
  for (const bits of [16, 24, 32] as const) {
    const wav = audio.encodeWav(edited, bits);
    const decoded = await audio.decodeAudioFile(new File([wav], 'edited.wav'));
    check(Math.abs(decoded.buffer.duration - .5) < .001, 'WAV round trip ' + bits);
  }
});
await test('cropsnap: rotation, mirror, PNG/WebP encoding', async () => {
  const rendered = crop.renderCrop({ source: canvas, sourceWidth: 32, sourceHeight: 32, rotation: 0, flipX: true, flipY: false, crop: {x: 0, y: 0, width: 1, height: 1}, outWidth: 32, outHeight: 32, fit: 'cover' });
  check(rendered.getContext('2d')!.getImageData(4, 4, 1, 1).data[2] === 255, 'Mirrored pixels');
  for (const format of ['image/png', 'image/webp'] as const) {
    const blob = await crop.encode(rendered, format, .8);
    const decoded = await createImageBitmap(blob);
    check(decoded.width === 32 && decoded.height === 32 && blob.type === format, 'Encoded image dimensions/type');
    decoded.close();
  }
  const bounds = crop.rotatedBounds(480, 320, 90);
  check(Math.round(bounds.width) === 320 && Math.round(bounds.height) === 480, 'Rotation bounds');
});
await test('pastesnap: worker resize and JPEG', async () => {
  const result = await encodeBitmap(await createImageBitmap(canvas), {format: 'jpeg', quality: .8, maxDimension: 16, background: '#ffffff'});
  check(result.width === 16 && result.height === 16 && result.blob.type === 'image/jpeg', 'Worker encode');
  const decoded = await createImageBitmap(result.blob); check(decoded.width === 16, 'JPEG decode'); decoded.close(); disposeEncoder();
});
await test('pastesnap: worker startup failure recovers on main thread', async () => {
  const NativeWorker = window.Worker;
  class BrokenWorker extends EventTarget {
    onerror: (() => void) | null = null;
    postMessage() { queueMicrotask(() => { this.onerror?.(); this.dispatchEvent(new Event('error')); }); }
    terminate() {}
  }
  try {
    window.Worker = BrokenWorker as unknown as typeof Worker;
    const result = await encodeBitmap(await createImageBitmap(canvas), {format: 'png', quality: 1, maxDimension: 16, background: '#ffffff'});
    check(result.width === 16 && result.blob.type === 'image/png', 'No fallback result');
  } finally { disposeEncoder(); window.Worker = NativeWorker; }
});
await test('favicon-bolt: ICO directory and embedded PNG', async () => {
  const png = new Uint8Array(await (await crop.encode(canvas, 'image/png', 1)).arrayBuffer());
  const ico = new DataView(await buildIco([{size: 32, pixels: ctx.getImageData(0, 0, 32, 32), png}]).arrayBuffer());
  check(ico.getUint16(2, true) === 1 && ico.getUint16(4, true) === 1, 'ICO header');
  const offset = ico.getUint32(18, true); check(ico.getUint32(offset) === 0x89504e47, 'PNG frame offset');
});
await test('gif-bolt: palette, LZW, animation container and browser decoding', async () => {
  const frame = new Uint8Array(ctx.getImageData(0, 0, 32, 32).data);
  const hist = gif.createHistogram(); gif.addFrameToHistogram(hist, frame, 1, 128);
  const palette = gif.buildPalette(hist, 16);
  const chunks = gif.encodeChunk([frame, frame], null, palette, {width: 32, height: 32, diff: true, dither: false, ditherStrength: 1, tolerance: 0, alphaThreshold: 128, transparentIndex: palette.count});
  const bytes = gif.assembleGif(32, 32, palette, chunks.map(c => ({...c, delayCs: 10, transparentIndex: palette.count, disposal: 1 as const})), 0, palette.count);
  check(new TextDecoder().decode(bytes.slice(0, 6)) === 'GIF89a' && bytes.at(-1) === 0x3b, 'GIF container');
  const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/gif'}));
  check(bitmap.width === 32 && bitmap.height === 32, 'GIF decode'); bitmap.close();
});
await test('exif-clear: remove JPEG comment without changing pixels', async () => {
  const original = new Uint8Array(await (await fixture('sample.jpg')).arrayBuffer());
  const comment = new TextEncoder().encode('Private review comment');
  const tagged = new Uint8Array(original.length + comment.length + 4);
  tagged.set(original.slice(0, 2)); tagged.set([255, 254, 0, comment.length + 2], 2); tagged.set(comment, 6); tagged.set(original.slice(2), comment.length + 6);
  const scan = exif.scanJpeg(tagged); check(scan.ok, 'JPEG scan');
  const comments = scan.blocks.filter(b => b.kind === 'comment'); check(comments.length === 1, 'Comment detection');
  const clean = exif.rebuild(scan, {remove: new Set(comments.map(b => b.id))});
  check(clean.length === original.length && clean.every((b, i) => b === original[i]), 'Lossless removal');
  const decoded = await createImageBitmap(new Blob([clean], {type: 'image/jpeg'})); check(decoded.width === 480, 'Clean JPEG decode'); decoded.close();
});
await test('backgroundremover: manual erasure, alpha and undo mask', () => {
  const alpha = new Uint8ClampedArray(1024).fill(255);
  mask.paintDisc(alpha, {width: 32, height: 32}, 8, 8, 4, 0, 1);
  check(alpha[8 * 32 + 8] === 0 && alpha[0] === 255, 'Brush mask');
  const pixels = new Uint8ClampedArray(4096); mask.composite(ctx.getImageData(0, 0, 32, 32).data, alpha, pixels);
  check(pixels[(8 * 32 + 8) * 4 + 3] === 0 && pixels[3] === 255, 'Composite transparency');
  mask.invertMask(alpha); check(Number(alpha[8 * 32 + 8]) === 255 && Number(alpha[0]) === 0, 'Invert mask');
});
await test('cleansnap: fill selected pixels, preserve surrounding image', () => {
  const data = new Uint8ClampedArray(16 * 16 * 4);
  for (let i = 0; i < 256; i++) data.set([50, 100, 150, 255], i * 4);
  const selected = new Uint8Array(256); selected[8 * 16 + 8] = 1; data.set([255, 0, 0, 255], (8 * 16 + 8) * 4);
  inpaint.smoothFill({data, width: 16, height: 16}, selected);
  check(Math.abs(data[(8 * 16 + 8) * 4] - 50) <= 1, 'Smooth fill');
  check(data[0] === 50 && data[1] === 100 && data[2] === 150, 'Outside mask changed');
});
await test('svg-optimizer: optimize valid SVG and remove scripts', async () => {
  const result = await runOptimize({id: 1, source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><script>alert(1)</script><!-- comment --><rect width="32" height="32" fill="#ff0000"/></svg>', settings: DEFAULT_SETTINGS});
  check(result.ok === true, 'SVG optimization failed');
  if (result.ok === true) check(!result.output.includes('<script') && result.after.hasViewBox, 'Script removal or viewBox preservation');
});
await test('html-sanitizer: scripts, events and obfuscated dangerous URLs', () => {
  const result = sanitize({html: '<p onclick="alert(1)">Hola <strong>España</strong></p><script>alert(1)</script><a href="java&#x09;script:alert(1)">x</a><img src=x onerror=alert(1)>', policy: PRESETS.strict, format: 'minified'});
  check(!/onclick|onerror|javascript:|<script/i.test(result.html), 'Active markup retained');
  check(result.html.includes('<strong>España</strong>'), 'Safe content removed');
});
await test('framesnap + framebolt: real video decode and exact seeking', async () => {
  const video = document.createElement('video'); video.muted = true; video.preload = 'auto';
  const url = URL.createObjectURL(await fixture('sample.webm'));
  try {
    await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error('Video decode')); video.src = url; });
    check(video.videoWidth === 320 && video.videoHeight === 240, 'Video dimensions');
    await seekFrame(video, .5); check(Math.abs(video.currentTime - .5) < .08, 'FrameSnap seek');
    await seekBatch(video, 1); check(Math.abs(video.currentTime - 1) < .08, 'FrameBolt seek');
    const shot = document.createElement('canvas'); shot.width = 320; shot.height = 240; shot.getContext('2d')!.drawImage(video, 0, 0);
    const blob = await crop.encode(shot, 'image/png', 1); check(blob.size > 500, 'Frame capture empty');
  } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
});
await test('meme-bolt: captions render into export canvas', async () => {
  const doc = blankDoc(320, 240, '#ffffff'); doc.layers.push(makeText('Hola España', 50, 50));
  const rendered = document.createElement('canvas');
  renderToCanvas(rendered, doc, {image: null, width: 1, height: 1}, 1);
  check(rendered.width === 320 && rendered.height === 240, 'Meme output dimensions');
  const blob = await crop.encode(rendered, 'image/png', 1); check(blob.size > 500, 'Caption output empty');
});
await test('watermark-snap: text layer compositing and export', async () => {
  const target = document.createElement('canvas'); target.width = 320; target.height = 240;
  const stats = renderComposite(target.getContext('2d')!, canvas, 320, 240, [createTextLayer('España', {opacity: 1, scale: 12})], new Map());
  check(stats.drawCalls > 1, 'Watermark layer not drawn');
  const blob = await crop.encode(target, 'image/png', 1); check(blob.size > 500, 'Watermark export empty');
});
await test('css-designer: all five canvas exports', async () => {
  for (const tab of ['glass', 'shadow', 'gradient', 'radius', 'filter'] as const) {
    const rendered = renderDesign(tab, DEFAULT_DESIGN, {width: 320, height: 240, backdrop: 'darkGrid'});
    const blob = await crop.encode(rendered, 'image/png', 1); check(blob.size > 500, 'Empty CSS export ' + tab);
  }
});
await test('codecard: actual PNG and SVG export', async () => {
  const node = document.createElement('pre'); node.textContent = 'const saludo = "España 😀";';
  node.style.cssText = 'background:#151526;color:white;padding:20px;width:max-content;font:16px monospace'; document.body.append(node);
  try {
    const svg = await renderCard(node, {format:'svg', scale:1, quality:1});
    check((await svg.blob.text()).includes('España'), 'SVG content missing');
    const png = await renderCard(node, {format:'png', scale:2, quality:1});
    const bitmap = await createImageBitmap(png.blob); check(bitmap.width === png.width && png.width > svg.width, 'PNG scaling'); bitmap.close();
  } finally { node.remove(); }
});
await test('recordsnap: codec selection and synthetic canvas recording', async () => {
  const mime = supportedMime('webm'); check(mime, 'No recording codec');
  const stream = canvas.captureStream(10);
  try {
    const recorder = new MediaRecorder(stream, {mimeType: mime});
    const blob = await new Promise<Blob>((resolve, reject) => {
      const parts: BlobPart[] = []; recorder.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
      recorder.onerror = () => reject(new Error('Recording failed'));
      recorder.onstop = () => resolve(new Blob(parts, {type: mime}));
      recorder.start(); setTimeout(() => { ctx.fillRect(0, 0, 2, 2); recorder.stop(); }, 350);
    });
    check(blob.size > 100, 'Recording empty');
    const capped = capSize(3840, 2160, '1080p'); check(capped.w === 1920 && capped.h === 1080, 'Resolution cap');
  } finally { stream.getTracks().forEach(track => track.stop()); }
});
await test('key-doctor: physical keyboard layouts', () => {
  for (const layout of ['iso', 'ansi', 'jis'] as const) {
    const codes = codesOf(layout);
    check(codes.length > 80 && codes.includes('KeyA') && new Set(codes).size === codes.length, 'Keyboard layout ' + layout);
  }
});
await test('device-test: browser system diagnostics', () => {
  const result = readSystemInfo('unknown', 'yes', 'no');
  check(Object.keys(result).length > 4, 'System information missing');
});
document.documentElement.dataset.done = 'true';
document.title = results.every(r => r.passed) ? 'PASS media engines' : 'FAIL media engines';
