// ============================================================================
// Background removal engine
// ----------------------------------------------------------------------------
// Wrapper around @imgly/background-removal that:
//   1. runs inference on WebGPU when available (the library defaults to CPU),
//   2. proxies the work to a Web Worker so the UI never freezes,
//   3. returns the raw ALPHA MASK instead of a composited PNG, so the editor
//      can stay non-destructive (see lib/mask.ts).
// ============================================================================

export type Quality = 'fast' | 'balanced' | 'max';

// isnet_quint8 ~20MB · isnet_fp16 ~44MB · isnet ~88MB
const MODEL_BY_QUALITY: Record<Quality, 'isnet_quint8' | 'isnet_fp16' | 'isnet'> = {
  fast: 'isnet_quint8',
  balanced: 'isnet_fp16',
  max: 'isnet',
};

export const MODEL_SIZE_MB: Record<Quality, number> = {
  fast: 20,
  balanced: 44,
  max: 88,
};

export type ProgressStep = 'downloading' | 'processing' | 'refining';
export type ProgressFn = (step: ProgressStep, percent: number) => void;

export interface MaskResult {
  /** One byte per pixel: 0 = background, 255 = subject. */
  mask: Uint8ClampedArray;
  width: number;
  height: number;
  /** Device that actually ran the inference. */
  device: 'gpu' | 'cpu';
}

let cachedDevice: 'gpu' | 'cpu' | null = null;

/**
 * WebGPU is opt-in in the library and silently unavailable in Safari < 18 and
 * on most Linux/Android builds, so we probe for a real adapter once.
 */
export async function detectDevice(): Promise<'gpu' | 'cpu'> {
  if (cachedDevice) return cachedDevice;
  try {
    const gpu = (navigator as any).gpu;
    if (gpu?.requestAdapter) {
      const adapter = await gpu.requestAdapter();
      cachedDevice = adapter ? 'gpu' : 'cpu';
      return cachedDevice;
    }
  } catch {
    /* probing must never break the tool */
  }
  cachedDevice = 'cpu';
  return cachedDevice;
}

function buildConfig(quality: Quality, device: 'gpu' | 'cpu', onProgress?: ProgressFn) {
  return {
    model: MODEL_BY_QUALITY[quality],
    device,
    // Only meaningful with WebGPU, but harmless otherwise: keeps the main
    // thread free while ONNX runs.
    proxyToWorker: true,
    output: { format: 'image/png' as const, quality: 1 },
    progress: (key: string, current: number, total: number) => {
      if (!onProgress) return;
      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      onProgress(key.includes('fetch') ? 'downloading' : 'processing', percent);
    },
  };
}

/** Warms up the model download so the first cutout feels instant. */
export async function preloadModel(quality: Quality, onProgress?: ProgressFn): Promise<void> {
  const { preload } = await import('@imgly/background-removal');
  const device = await detectDevice();
  try {
    await preload(buildConfig(quality, device, onProgress) as any);
  } catch {
    /* preloading is best-effort */
  }
}

/**
 * Decodes the white-on-alpha PNG returned by `segmentForeground` into a flat
 * one-byte-per-pixel mask.
 */
async function blobToMask(blob: Blob): Promise<{ mask: Uint8ClampedArray; width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height });
  const ctx = (canvas as any).getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  ctx.drawImage(bitmap as any, 0, 0);
  bitmap.close?.();
  const { data } = ctx.getImageData(0, 0, width, height);
  const mask = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 3; i < mask.length; i++, p += 4) mask[i] = data[p];
  return { mask, width, height };
}

/** Decodes an image blob to full-resolution RGBA. */
async function decodePixels(blob: Blob, width: number, height: number): Promise<Uint8ClampedArray> {
  const bitmap = await createImageBitmap(blob);
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height });
  const ctx = (canvas as any).getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  ctx.drawImage(bitmap as any, 0, 0, width, height);
  bitmap.close?.();
  return ctx.getImageData(0, 0, width, height).data;
}

/**
 * Runs segmentation and returns the alpha mask at the original resolution.
 *
 * Falls back from GPU to CPU when the WebGPU session cannot be created, and —
 * unless disabled — snaps the mask onto the photo's real edges with a guided
 * filter, which is what makes hair and fine detail survive.
 */
export async function computeMask(
  source: Blob,
  quality: Quality,
  onProgress?: ProgressFn,
  refine = true
): Promise<MaskResult> {
  const { segmentForeground } = await import('@imgly/background-removal');
  let device = await detectDevice();

  let blob: Blob;
  try {
    blob = await segmentForeground(source, buildConfig(quality, device, onProgress) as any);
  } catch (err) {
    if (device === 'cpu') throw err;
    // WebGPU session creation fails on some drivers — retry on CPU once.
    cachedDevice = device = 'cpu';
    blob = await segmentForeground(source, buildConfig(quality, device, onProgress) as any);
  }

  const { mask, width, height } = await blobToMask(blob);

  if (refine) {
    onProgress?.('refining', 0);
    try {
      const { refineAIMask } = await import('./mask');
      const pixels = await decodePixels(source, width, height);
      refineAIMask(mask, pixels, { width, height });
    } catch {
      // Refinement is an enhancement, never a hard requirement.
    }
    onProgress?.('refining', 100);
  }

  return { mask, width, height, device };
}
