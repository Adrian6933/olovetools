let pdfjsPromise: Promise<any> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString();
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
}

// Some browser contexts (throttled/hidden tabs) can stall the canvas render step indefinitely;
// bound it so the UI can fall back to a placeholder instead of spinning forever.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('PDF page render timed out')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

async function renderPage(page: any, targetWidth: number): Promise<string> {
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  await withTimeout(page.render({ canvasContext: ctx, viewport }).promise, 10000);
  return canvas.toDataURL('image/jpeg', 0.75);
}

// Renders the first page of a PDF file as a thumbnail data URL (used for merge mode file identity)
export async function renderPdfCoverThumbnail(file: File, targetWidth = 160): Promise<string> {
  const pdfjsLib = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const dataUrl = await renderPage(page, targetWidth);
  page.cleanup();
  await pdf.destroy();
  return dataUrl;
}

// Renders every page of a PDF (capped at maxPages) as thumbnails, in order (used for split/rotate grids)
export async function renderAllPageThumbnails(
  file: File,
  targetWidth = 150,
  maxPages = 60
): Promise<string[]> {
  const pdfjsLib = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const total = Math.min(pdf.numPages, maxPages);
  const thumbnails: string[] = [];
  for (let i = 1; i <= total; i++) {
    try {
      const page = await pdf.getPage(i);
      thumbnails.push(await renderPage(page, targetWidth));
      page.cleanup();
    } catch {
      break; // stop on first failure/timeout; caller keeps whatever rendered so far
    }
  }
  await pdf.destroy();
  return thumbnails;
}
