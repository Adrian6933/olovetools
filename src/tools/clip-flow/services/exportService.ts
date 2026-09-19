import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const CORE_VERSION = '0.12.10';
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;
const CORE_BASE_MIRROR = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export const isFFmpegReady = (): boolean => !!ffmpeg?.loaded;

const loadFromBase = async (instance: FFmpeg, base: string, onProgress?: (pct: number) => void) => {
  let coreLoaded = 0, wasmLoaded = 0, coreTotal = 0, wasmTotal = 0;
  const report = () => {
    if (!onProgress) return;
    const total = coreTotal + wasmTotal;
    const loaded = coreLoaded + wasmLoaded;
    if (total > 0) onProgress(Math.min(99, Math.round((loaded / total) * 100)));
  };
  const coreURL = await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript', true, (e) => {
    coreTotal = e.total; coreLoaded = e.received; report();
  });
  const wasmURL = await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm', true, (e) => {
    wasmTotal = e.total; wasmLoaded = e.received; report();
  });
  await instance.load({ coreURL, wasmURL });
};

export const loadFFmpeg = async (onProgress?: (pct: number) => void): Promise<FFmpeg> => {
  if (ffmpeg?.loaded) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const instance = new FFmpeg();
    try {
      await loadFromBase(instance, CORE_BASE, onProgress);
    } catch (e) {
      // Primary CDN failed (blocked/offline) - retry once via jsdelivr mirror
      await loadFromBase(instance, CORE_BASE_MIRROR, onProgress);
    }
    ffmpeg = instance;
    onProgress?.(100);
    return instance;
  })();

  try {
    return await loadPromise;
  } catch (e) {
    loadPromise = null;
    throw e;
  }
};

interface RemuxOptions {
  tsBlob: Blob;
  trimOffset: number;
  duration: number;
  onProgress?: (pct: number) => void;
}

const withProgressListener = (instance: FFmpeg, onProgress?: (pct: number) => void, cb?: () => void) => {
  if (!onProgress) return () => {};
  const listener = ({ progress }: { progress: number }) => {
    onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
  };
  instance.on('progress', listener);
  return () => instance.off('progress', listener);
};

/** Trims a raw MPEG-TS segment window to an exact-duration, faststart MP4 without re-encoding. */
export const remuxCutToMp4 = async (opts: RemuxOptions, outName: string): Promise<Blob> => {
  const instance = ffmpeg;
  if (!instance) throw new Error('FFmpeg is not loaded.');

  const inName = `in_${outName.replace(/[^a-zA-Z0-9]/g, '')}.ts`;
  const data = new Uint8Array(await opts.tsBlob.arrayBuffer());
  await instance.writeFile(inName, data);

  const unlisten = withProgressListener(instance, opts.onProgress);
  try {
    await instance.exec([
      '-ss', opts.trimOffset.toFixed(3),
      '-i', inName,
      '-t', opts.duration.toFixed(3),
      '-c', 'copy',
      '-bsf:a', 'aac_adtstoasc',
      '-avoid_negative_ts', 'make_zero',
      '-movflags', '+faststart',
      outName,
    ]);
  } finally {
    unlisten();
    await instance.deleteFile(inName).catch(() => {});
  }

  const out = await instance.readFile(outName);
  return new Blob([out as Uint8Array], { type: 'video/mp4' });
};

export const deleteFfmpegFile = async (name: string): Promise<void> => {
  await ffmpeg?.deleteFile(name).catch(() => {});
};

/** Joins already-remuxed MP4 cuts (kept in the ffmpeg virtual FS) into a single MP4, in list order. */
export const concatMp4s = async (fileNames: string[], onProgress?: (pct: number) => void): Promise<Blob> => {
  const instance = ffmpeg;
  if (!instance) throw new Error('FFmpeg is not loaded.');

  const listContent = fileNames.map(name => `file '${name}'`).join('\n');
  await instance.writeFile('list.txt', listContent);

  const unlisten = withProgressListener(instance, onProgress);
  try {
    await instance.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'joined.mp4']);
  } finally {
    unlisten();
    await instance.deleteFile('list.txt').catch(() => {});
  }

  const out = await instance.readFile('joined.mp4');
  const blob = new Blob([out as Uint8Array], { type: 'video/mp4' });

  for (const name of fileNames) await instance.deleteFile(name).catch(() => {});
  await instance.deleteFile('joined.mp4').catch(() => {});

  return blob;
};

export const cancelExport = (): void => {
  ffmpeg?.terminate();
  ffmpeg = null;
  loadPromise = null;
};

export const saveBlob = (blob: Blob, filename: string): void => {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};
