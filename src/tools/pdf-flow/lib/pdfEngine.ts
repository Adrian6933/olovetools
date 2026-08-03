// ============================================================================
// PDF engine
// ----------------------------------------------------------------------------
// Every document operation lives here so the React component only deals with
// state and UI. pdf-lib writes, pdf.js rasterises.
// ============================================================================

export type ProgressFn = (done: number, total: number) => void;

export interface PageOp {
  /** Index of the page in the ORIGINAL document. */
  index: number;
  /** Extra rotation to apply, in degrees, on top of whatever the page had. */
  rotation: number;
}

export interface ImageToPdfOptions {
  pageSize: 'fit' | 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  margin: number;
  /** 10–100. Below 100 the image is re-encoded as JPEG at this quality. */
  quality: number;
}

export interface PdfToImageOptions {
  format: 'png' | 'jpeg';
  /** Render scale relative to the PDF's natural 72 dpi. */
  dpi: number;
  quality: number;
}

export interface CompressOptions {
  /** JPEG quality for the rasterised pages. */
  quality: number;
  /** Target resolution. Lower = smaller file. */
  dpi: number;
  grayscale: boolean;
}

// ---------------------------------------------------------------------------
// Shared loaders
// ---------------------------------------------------------------------------

let pdfjsPromise: Promise<any> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(pdfjsLib => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString();
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
}

/**
 * Loads a document with pdf-lib.
 *
 * `ignoreEncryption` matters more than it looks: a large share of real-world
 * PDFs (invoices, bank statements, anything exported from a corporate system)
 * carry permission flags. Without the flag pdf-lib throws and the user just
 * sees "failed to process".
 */
export async function loadDocument(file: File | Blob) {
  const { PDFDocument } = await import('pdf-lib');
  const bytes = await file.arrayBuffer();
  return PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
}

export async function getPageCount(file: File | Blob): Promise<number> {
  try {
    const pdf = await loadDocument(file);
    return pdf.getPageCount();
  } catch {
    return 0;
  }
}

/** Guards a promise that can stall forever (pdf.js render in throttled tabs). */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('PDF operation timed out')), ms);
    promise.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); }
    );
  });
}

/** Renders one pdf.js page onto a fresh canvas at the given scale. */
async function renderPageToCanvas(page: any, scale: number, grayscale = false): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  // PDF pages are white; without this, transparent areas turn black in JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // `intent: 'print'` is not about printing here — it is the only way to stop
  // pdf.js scheduling its render continuations on requestAnimationFrame
  // (`useRequestAnimationFrame: !intentPrint`). With the default 'display'
  // intent, a user who switches tabs mid-operation stalls the render forever,
  // because rAF never fires in a hidden document. 'print' uses
  // Promise.resolve() instead, and is the right intent for rasterising to a
  // file anyway.
  await withTimeout(page.render({ canvasContext: ctx, viewport, intent: 'print' }).promise, 30000);

  if (grayscale) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = y;
    }
    ctx.putImageData(img, 0, 0);
  }
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas encode failed'))), type, quality)
  );
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

export async function mergePdfs(files: File[], onProgress?: ProgressFn): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    const pdf = await loadDocument(files[i]);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(p => merged.addPage(p));
    onProgress?.(i + 1, files.length);
  }
  const bytes = await merged.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

// ---------------------------------------------------------------------------
// Split / extract
// ---------------------------------------------------------------------------

/** One PDF per page, zipped. */
export async function splitToZip(file: File, onProgress?: ProgressFn): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const JSZip = (await import('jszip')).default;
  const source = await loadDocument(file);
  const total = source.getPageCount();
  const zip = new JSZip();
  const base = file.name.replace(/\.pdf$/i, '');

  for (let i = 0; i < total; i++) {
    const single = await PDFDocument.create();
    const [page] = await single.copyPages(source, [i]);
    single.addPage(page);
    zip.file(`${base}_page_${i + 1}.pdf`, await single.save());
    onProgress?.(i + 1, total);
  }
  return zip.generateAsync({ type: 'blob' });
}

/** A single PDF containing only the requested pages, in the requested order. */
export async function extractPages(file: File, indices: number[]): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const source = await loadDocument(file);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(source, indices);
  pages.forEach(p => out.addPage(p));
  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

// ---------------------------------------------------------------------------
// Organise: reorder + rotate + delete, in one pass
// ---------------------------------------------------------------------------

/**
 * Rebuilds the document from `ops`: the order of the array is the output order,
 * pages left out are dropped, and each carries its own extra rotation.
 */
export async function organizePages(file: File, ops: PageOp[]): Promise<Blob> {
  const { PDFDocument, degrees } = await import('pdf-lib');
  const source = await loadDocument(file);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(source, ops.map(o => o.index));

  copied.forEach((page, i) => {
    const extra = ops[i].rotation % 360;
    if (extra) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + extra + 360) % 360));
    }
    out.addPage(page);
  });

  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

// ---------------------------------------------------------------------------
// Images → PDF
// ---------------------------------------------------------------------------

/** Decodes any browser-readable image and re-encodes it as JPEG at `quality`. */
async function toJpegBytes(file: File, quality: number): Promise<ArrayBuffer> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  // Flatten transparency onto white, or JPEG turns it black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  const blob = await canvasToBlob(canvas, 'image/jpeg', quality / 100);
  return blob.arrayBuffer();
}

export async function imagesToPdf(
  files: File[],
  opts: ImageToPdfOptions,
  onProgress?: ProgressFn
): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let embedded;

    // At 100 the original bytes go in untouched (lossless, and PNG stays PNG).
    // Below 100 EVERY format is re-encoded — previously the quality slider was
    // silently ignored for JPEG and PNG, which is most of what people upload.
    if (opts.quality >= 100) {
      const bytes = await file.arrayBuffer();
      if (file.type === 'image/png') embedded = await doc.embedPng(bytes);
      else if (file.type === 'image/jpeg' || file.type === 'image/jpg') embedded = await doc.embedJpg(bytes);
      else embedded = await doc.embedJpg(await toJpegBytes(file, 100));
    } else {
      embedded = await doc.embedJpg(await toJpegBytes(file, opts.quality));
    }

    const iw = embedded.width;
    const ih = embedded.height;
    let pageWidth: number;
    let pageHeight: number;

    if (opts.pageSize === 'a4') {
      pageWidth = opts.orientation === 'portrait' ? 595.28 : 841.89;
      pageHeight = opts.orientation === 'portrait' ? 841.89 : 595.28;
    } else if (opts.pageSize === 'letter') {
      pageWidth = opts.orientation === 'portrait' ? 612 : 792;
      pageHeight = opts.orientation === 'portrait' ? 792 : 612;
    } else {
      pageWidth = iw + opts.margin * 2;
      pageHeight = ih + opts.margin * 2;
    }

    const page = doc.addPage([pageWidth, pageHeight]);
    const availW = pageWidth - opts.margin * 2;
    const availH = pageHeight - opts.margin * 2;
    const scale = opts.pageSize === 'fit' ? 1 : Math.min(availW / iw, availH / ih, 1);
    const drawW = iw * scale;
    const drawH = ih * scale;

    page.drawImage(embedded, {
      x: opts.margin + (availW - drawW) / 2,
      y: opts.margin + (availH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
    onProgress?.(i + 1, files.length);
  }

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

// ---------------------------------------------------------------------------
// PDF → images
// ---------------------------------------------------------------------------

export interface RenderedPage {
  blob: Blob;
  name: string;
  width: number;
  height: number;
}

export async function pdfToImages(
  file: File,
  opts: PdfToImageOptions,
  onProgress?: ProgressFn
): Promise<RenderedPage[]> {
  const pdfjsLib = await getPdfjs();
  const data = await file.arrayBuffer();
  // `destroy()` lives on the loading task, not on the document proxy (which
  // only exposes `cleanup()`). Calling it on the proxy throws and leaks the
  // worker.
  const loadingTask = pdfjsLib.getDocument({ data });
  const doc = await loadingTask.promise;
  const base = file.name.replace(/\.pdf$/i, '');
  const scale = opts.dpi / 72;
  const type = opts.format === 'png' ? 'image/png' : 'image/jpeg';
  const out: RenderedPage[] = [];

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const canvas = await renderPageToCanvas(page, scale);
      out.push({
        blob: await canvasToBlob(canvas, type, opts.quality / 100),
        name: `${base}_page_${String(i).padStart(3, '0')}.${opts.format === 'png' ? 'png' : 'jpg'}`,
        width: canvas.width,
        height: canvas.height,
      });
      page.cleanup();
      onProgress?.(i, doc.numPages);
    }
  } finally {
    await loadingTask.destroy();
  }
  return out;
}

export async function zipFiles(entries: { name: string; blob: Blob }[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const e of entries) zip.file(e.name, e.blob);
  return zip.generateAsync({ type: 'blob' });
}

// ---------------------------------------------------------------------------
// Watermark
// ---------------------------------------------------------------------------

export type Anchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'tile';

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  /** 0–1. */
  opacity: number;
  /** Degrees, counter-clockwise. */
  rotation: number;
  color: { r: number; g: number; b: number };
  position: Anchor;
  bold: boolean;
}

/**
 * The 14 PDF standard fonts are WinAnsi-encoded, so anything outside Latin-1
 * (Cyrillic, Greek, CJK, most emoji) makes pdf-lib throw. Embedding a Unicode
 * font would mean shipping a megabyte of TTF, so instead we drop what cannot be
 * drawn and let the caller warn.
 */
export function sanitiseForStandardFont(text: string): { text: string; dropped: number } {
  let dropped = 0;
  const out = Array.from(text)
    .filter(ch => {
      const code = ch.codePointAt(0)!;
      const ok = code === 10 || code === 13 || (code >= 32 && code <= 255);
      if (!ok) dropped++;
      return ok;
    })
    .join('');
  return { text: out, dropped };
}

function anchorPoint(
  anchor: Exclude<Anchor, 'tile'>,
  pageW: number,
  pageH: number,
  textW: number,
  textH: number,
  margin: number
): { x: number; y: number } {
  const [vertical, horizontal] = anchor.split('-');
  const x =
    horizontal === 'left' ? margin
      : horizontal === 'right' ? pageW - textW - margin
      : (pageW - textW) / 2;
  const y =
    vertical === 'bottom' ? margin
      : vertical === 'top' ? pageH - textH - margin
      : (pageH - textH) / 2;
  return { x, y };
}

export async function addWatermark(
  file: File,
  opts: WatermarkOptions,
  onProgress?: ProgressFn
): Promise<Blob> {
  const { StandardFonts, rgb, degrees } = await import('pdf-lib');
  const doc = await loadDocument(file);
  const font = await doc.embedFont(opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
  const { text } = sanitiseForStandardFont(opts.text);
  if (!text.trim()) throw new Error('Watermark text is empty.');

  const pages = doc.getPages();
  const textWidth = font.widthOfTextAtSize(text, opts.fontSize);
  const textHeight = font.heightAtSize(opts.fontSize);
  const color = rgb(opts.color.r / 255, opts.color.g / 255, opts.color.b / 255);

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const common = {
      font,
      size: opts.fontSize,
      color,
      opacity: opts.opacity,
      rotate: degrees(opts.rotation),
    };

    if (opts.position === 'tile') {
      // Diagonal grid, generous spacing so the page stays readable underneath.
      const stepX = textWidth + opts.fontSize * 3;
      const stepY = textHeight + opts.fontSize * 4;
      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          page.drawText(text, { ...common, x, y });
        }
      }
    } else {
      const { x, y } = anchorPoint(opts.position, width, height, textWidth, textHeight, 32);
      page.drawText(text, { ...common, x, y });
    }
    onProgress?.(i + 1, pages.length);
  });

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

// ---------------------------------------------------------------------------
// Page numbers
// ---------------------------------------------------------------------------

export interface PageNumberOptions {
  position: Exclude<Anchor, 'tile' | 'middle-left' | 'center' | 'middle-right'>;
  /** `n` → "7" · `n_of_N` → "7 / 20" · `page_n` → "Page 7" */
  format: 'n' | 'n_of_N' | 'page_n';
  fontSize: number;
  /** Number printed on the first numbered page. */
  startAt: number;
  /** 1-based index of the first page that gets a number. */
  fromPage: number;
  margin: number;
  /** Localised word for the `page_n` format. */
  pageWord: string;
}

export async function addPageNumbers(
  file: File,
  opts: PageNumberOptions,
  onProgress?: ProgressFn
): Promise<Blob> {
  const { StandardFonts, rgb } = await import('pdf-lib');
  const doc = await loadDocument(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const numbered = pages.length - (opts.fromPage - 1);

  pages.forEach((page, i) => {
    if (i < opts.fromPage - 1) return;
    const n = opts.startAt + (i - (opts.fromPage - 1));
    const raw =
      opts.format === 'n' ? String(n)
        : opts.format === 'n_of_N' ? `${n} / ${opts.startAt + numbered - 1}`
        : `${opts.pageWord} ${n}`;
    const { text } = sanitiseForStandardFont(raw);

    const { width, height } = page.getSize();
    const w = font.widthOfTextAtSize(text, opts.fontSize);
    const h = font.heightAtSize(opts.fontSize);
    const { x, y } = anchorPoint(opts.position, width, height, w, h, opts.margin);

    page.drawText(text, { font, size: opts.fontSize, color: rgb(0.15, 0.15, 0.15), x, y });
    onProgress?.(i + 1, pages.length);
  });

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

export interface ExtractedPage {
  page: number;
  text: string;
}

/**
 * Pulls the text layer out with pdf.js. Scanned documents have no text layer,
 * so an empty result means "this is images", not "it failed" — the caller says
 * so rather than handing back a blank file.
 */
export async function extractText(file: File, onProgress?: ProgressFn): Promise<ExtractedPage[]> {
  const pdfjsLib = await getPdfjs();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const doc = await loadingTask.promise;
  const out: ExtractedPage[] = [];

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let text = '';
      let lastY: number | null = null;
      for (const item of content.items as any[]) {
        if (typeof item.str !== 'string') continue;
        const y = item.transform?.[5];
        // A vertical jump means a new line; pdf.js gives no line breaks itself.
        if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) text += '\n';
        else if (text && !text.endsWith(' ') && !text.endsWith('\n')) text += item.hasEOL ? '\n' : ' ';
        text += item.str;
        if (y !== undefined) lastY = y;
      }
      out.push({ page: i, text: text.trim() });
      page.cleanup();
      onProgress?.(i, doc.numPages);
    }
  } finally {
    await loadingTask.destroy();
  }
  return out;
}

export function pagesToPlainText(pages: ExtractedPage[]): string {
  return pages.map(p => p.text).join('\n\n');
}

export function pagesToMarkdown(pages: ExtractedPage[], pageWord: string): string {
  return pages.map(p => `## ${pageWord} ${p.page}\n\n${p.text}`).join('\n\n---\n\n');
}

// ---------------------------------------------------------------------------
// Compress
// ---------------------------------------------------------------------------

/**
 * Rasterises every page and rebuilds the document from JPEGs.
 *
 * This is how every free web compressor works, and it has a real cost the UI
 * must state plainly: the output is images, so text stops being selectable and
 * searchable. In exchange it shrinks scan-heavy and image-heavy PDFs hard.
 */
export async function compressPdf(
  file: File,
  opts: CompressOptions,
  onProgress?: ProgressFn
): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const pdfjsLib = await getPdfjs();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const doc = await loadingTask.promise;
  const out = await PDFDocument.create();
  const scale = opts.dpi / 72;

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      // The page keeps its original point size; only the pixel density drops.
      const naturalViewport = page.getViewport({ scale: 1 });
      const canvas = await renderPageToCanvas(page, scale, opts.grayscale);
      const jpeg = await canvasToBlob(canvas, 'image/jpeg', opts.quality / 100);
      const embedded = await out.embedJpg(await jpeg.arrayBuffer());
      const p = out.addPage([naturalViewport.width, naturalViewport.height]);
      p.drawImage(embedded, { x: 0, y: 0, width: naturalViewport.width, height: naturalViewport.height });
      page.cleanup();
      onProgress?.(i, doc.numPages);
    }
  } finally {
    await loadingTask.destroy();
  }

  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
