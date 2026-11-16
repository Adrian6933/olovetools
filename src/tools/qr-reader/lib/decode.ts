// ============================================================================
// Decoding: camera frames, images, PDFs and the screen
// ----------------------------------------------------------------------------
// Two engines, both local:
//
// - ZXing (C++ compiled to WebAssembly). Reads QR, Micro QR, Data Matrix,
//   Aztec, PDF417 and every common linear barcode. It finds several codes in one
//   picture, and copes with rotation, inverted colours and small codes. The
//   .wasm is served by us, never by a CDN.
// - The browser's own BarcodeDetector, where it exists (Chrome on Android and
//   macOS). It runs on the system's scanner and is faster for live camera.
//
// Nothing is sent anywhere: the input is an ImageData in memory.
// ============================================================================

import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

export interface Corner {
  x: number;
  y: number;
}

export interface Detection {
  text: string;
  /** ZXing format name: `QRCode`, `EAN13`, `DataMatrix`… */
  format: string;
  /** Four corners in the coordinates of the image that was decoded. */
  corners: Corner[];
}

type ZXing = typeof import('zxing-wasm/reader');
let zxingPromise: Promise<ZXing> | null = null;

function loadZXing(): Promise<ZXing> {
  if (!zxingPromise) {
    zxingPromise = import('zxing-wasm/reader').then(mod => {
      mod.prepareZXingModule({
        overrides: {
          // By default the library fetches the wasm from jsDelivr. Ours comes
          // from the same origin, so the tool keeps working offline and no third
          // party learns that someone is scanning.
          locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
        },
      });
      return mod;
    });
    zxingPromise.catch(() => {
      zxingPromise = null;
    });
  }
  return zxingPromise;
}

/** Starts downloading the engine while the person is still choosing a source. */
export function warmUpDecoder(): void {
  void loadZXing().catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Native detector
// ---------------------------------------------------------------------------

const NATIVE_TO_ZXING: Record<string, string> = {
  qr_code: 'QRCode',
  data_matrix: 'DataMatrix',
  aztec: 'Aztec',
  pdf417: 'PDF417',
  ean_13: 'EAN13',
  ean_8: 'EAN8',
  upc_a: 'UPCA',
  upc_e: 'UPCE',
  code_128: 'Code128',
  code_39: 'Code39',
  code_93: 'Code93',
  codabar: 'Codabar',
  itf: 'ITF',
};

let nativePromise: Promise<any | null> | null = null;

/**
 * BarcodeDetector exists in desktop Chrome on Windows too, but there it throws
 * or finds nothing because the OS has no scanner behind it. So it is only used
 * when it says it supports QR.
 */
function loadNative(): Promise<any | null> {
  if (!nativePromise) {
    nativePromise = (async () => {
      const Ctor = (globalThis as any).BarcodeDetector;
      if (!Ctor?.getSupportedFormats) return null;
      try {
        const formats: string[] = await Ctor.getSupportedFormats();
        if (!formats.includes('qr_code')) return null;
        return new Ctor({ formats: formats.filter(f => f in NATIVE_TO_ZXING) });
      } catch {
        return null;
      }
    })();
  }
  return nativePromise;
}

async function detectNative(source: ImageData | CanvasImageSource): Promise<Detection[] | null> {
  const detector = await loadNative();
  if (!detector) return null;
  try {
    const found: any[] = await detector.detect(source);
    return found
      .filter(f => f.rawValue)
      .map(f => ({
        text: f.rawValue,
        format: NATIVE_TO_ZXING[f.format] || f.format,
        corners: (f.cornerPoints || []).map((p: any) => ({ x: p.x, y: p.y })),
      }));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ZXing
// ---------------------------------------------------------------------------

async function detectZXing(image: ImageData, thorough: boolean): Promise<Detection[]> {
  const zx = await loadZXing();
  const results = await zx.readBarcodes(image, {
    formats: [],
    tryHarder: thorough,
    tryRotate: true,
    tryInvert: true,
    tryDownscale: true,
    tryDenoise: thorough,
    maxNumberOfSymbols: thorough ? 32 : 4,
  });
  return results
    .filter(r => r.isValid && r.text)
    .map(r => ({
      text: r.text,
      format: r.format,
      corners: [r.position.topLeft, r.position.topRight, r.position.bottomRight, r.position.bottomLeft].map(p => ({
        x: p.x,
        y: p.y,
      })),
    }));
}

/** Same code seen twice (native and ZXing, or two crops) counts once. */
function dedupe(list: Detection[]): Detection[] {
  const seen = new Set<string>();
  return list.filter(d => {
    const key = `${d.format}|${d.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * One live camera or screen frame. Speed matters more than catching every
 * code, so the first engine that finds something wins.
 */
export async function decodeFrame(image: ImageData): Promise<Detection[]> {
  const native = await detectNative(image);
  if (native && native.length) return native;
  return detectZXing(image, false);
}

// ---------------------------------------------------------------------------
// Still images
// ---------------------------------------------------------------------------

const MAX_SIDE = 2400;

function canvasFor(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas');
  return { canvas, ctx };
}

export interface ImageScan {
  detections: Detection[];
  /** The picture that was searched, for drawing boxes over the codes. */
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * A photo or screenshot. Searched at full size for every code it holds; when
 * nothing turns up, the centre is retried upscaled, which is what rescues a
 * small code in a large photo.
 */
export async function decodeBitmap(bitmap: ImageBitmap | HTMLCanvasElement): Promise<ImageScan> {
  const ratio = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const { canvas, ctx } = canvasFor(bitmap.width * ratio, bitmap.height * ratio);
  // Transparent PNGs of a QR are black modules on nothing: give them a background.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const full = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let detections = await detectZXing(full, true);
  if (!detections.length) detections = (await detectNative(full)) || [];

  if (!detections.length) {
    for (const crop of [0.6, 0.35]) {
      const sw = canvas.width * crop;
      const sh = canvas.height * crop;
      const sx = (canvas.width - sw) / 2;
      const sy = (canvas.height - sh) / 2;
      const scale = Math.min(3, MAX_SIDE / Math.max(sw, sh));
      const zoom = canvasFor(sw * scale, sh * scale);
      zoom.ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, zoom.canvas.width, zoom.canvas.height);
      const found = await detectZXing(zoom.ctx.getImageData(0, 0, zoom.canvas.width, zoom.canvas.height), true);
      if (found.length) {
        // Back to the coordinates of the full picture, so the boxes line up.
        detections = found.map(d => ({
          ...d,
          corners: d.corners.map(p => ({ x: sx + p.x / scale, y: sy + p.y / scale })),
        }));
        break;
      }
    }
  }

  return {
    detections: dedupe(detections),
    previewUrl: canvas.toDataURL('image/jpeg', 0.85),
    width: canvas.width,
    height: canvas.height,
  };
}

export async function decodeImageFile(file: Blob): Promise<ImageScan> {
  const bitmap = await createImageBitmap(file);
  try {
    return await decodeBitmap(bitmap);
  } finally {
    bitmap.close?.();
  }
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export interface PdfPageScan extends ImageScan {
  page: number;
}

/** Tickets, invoices and boarding passes rarely run past a few pages. */
const MAX_PDF_PAGES = 20;

export async function decodePdfFile(
  file: Blob,
  onProgress?: (page: number, total: number) => void
): Promise<{ pages: PdfPageScan[]; total: number; truncated: boolean }> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const total = doc.numPages;
  const last = Math.min(total, MAX_PDF_PAGES);
  const pages: PdfPageScan[] = [];
  try {
    for (let n = 1; n <= last; n += 1) {
      onProgress?.(n, last);
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      // ~2000px on the long side: enough for a small QR on an A4 invoice.
      const viewport = page.getViewport({ scale: Math.min(4, 2000 / Math.max(base.width, base.height)) });
      const { canvas, ctx } = canvasFor(viewport.width, viewport.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport } as any).promise;
      const scan = await decodeBitmap(canvas);
      if (scan.detections.length) pages.push({ ...scan, page: n });
      page.cleanup();
    }
  } finally {
    void task.destroy();
  }
  return { pages, total, truncated: total > last };
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export const canUseCamera = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

/** Screen capture exists on desktop browsers only; phones do not offer it. */
export const canCaptureScreen = () =>
  typeof navigator !== 'undefined' &&
  !!(navigator.mediaDevices as any)?.getDisplayMedia &&
  !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** True on phones and tablets, where the camera is the natural first choice. */
export const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

/** Whether the person already allowed the camera on a previous visit. */
export async function cameraAlreadyAllowed(): Promise<boolean> {
  try {
    const status = await (navigator as any).permissions?.query({ name: 'camera' });
    return status?.state === 'granted';
  } catch {
    return false;
  }
}
