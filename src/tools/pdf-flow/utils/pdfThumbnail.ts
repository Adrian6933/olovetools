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
  // PDFs assume white paper; without this, pages with transparency go black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // `intent: 'print'` keeps pdf.js off requestAnimationFrame for its render
  // continuations (`useRequestAnimationFrame: !intentPrint`). Without it, a
  // backgrounded tab stalls every thumbnail until the tab is focused again.
  await withTimeout(page.render({ canvasContext: ctx, viewport, intent: 'print' }).promise, 10000);
  return canvas.toDataURL('image/jpeg', 0.75);
}

// Renders the first page of a PDF file as a thumbnail data URL (used for merge mode file identity)
export async function renderPdfCoverThumbnail(file: File, targetWidth = 160): Promise<string> {
  const pdfjsLib = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  // `destroy()` belongs to the loading task; the document proxy only has
  // `cleanup()`. Calling it on the proxy throws and leaves the worker alive.
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  try {
    const page = await pdf.getPage(1);
    const dataUrl = await renderPage(page, targetWidth);
    page.cleanup();
    return dataUrl;
  } finally {
    await loadingTask.destroy();
  }
}

/**
 * Renders every page of a PDF as a thumbnail.
 *
 * `onPage` fires as each page finishes so the grid fills in progressively
 * instead of showing one long spinner and then everything at once.
 *
 * There is deliberately no page cap. The old 60-page limit desynchronised the
 * visible grid from the page ranges the user was selecting: on a 200-page
 * document you could only see the first 60 but the operation still applied to
 * all 200. Cancellation is the caller's job, via `shouldStop`.
 */
export async function renderAllPageThumbnails(
  file: File,
  targetWidth = 150,
  onPage?: (index: number, dataUrl: string, total: number) => void,
  shouldStop?: () => boolean
): Promise<string[]> {
  const pdfjsLib = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const thumbnails: string[] = [];

  try {
    for (let i = 1; i <= total; i++) {
      if (shouldStop?.()) break;
      try {
        const page = await pdf.getPage(i);
        const dataUrl = await renderPage(page, targetWidth);
        thumbnails.push(dataUrl);
        onPage?.(i - 1, dataUrl, total);
        page.cleanup();
      } catch {
        // One bad or slow page should not cost the user the rest of the document.
        thumbnails.push('');
        onPage?.(i - 1, '', total);
      }
    }
  } finally {
    await loadingTask.destroy();
  }
  return thumbnails;
}
