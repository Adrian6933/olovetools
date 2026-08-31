// ============================================================================
// Pack builder — turns one master render into the whole set of deployable files
// ============================================================================

import JSZip from 'jszip';
import type { AssetId, IconSettings, SourceImage } from '../types';
import {
  canvasToBlob,
  canvasToImageData,
  frameAt,
  MASTER,
  renderMaster,
  shapePathData,
  firstGrapheme,
  type AnyCanvas,
} from './engine';
import { buildIco } from './ico';

export const ASSET_FILES: Record<AssetId, string> = {
  ico: 'favicon.ico',
  png16: 'favicon-16x16.png',
  png32: 'favicon-32x32.png',
  png48: 'favicon-48x48.png',
  svg: 'favicon.svg',
  apple: 'apple-touch-icon.png',
  android192: 'android-chrome-192x192.png',
  android512: 'android-chrome-512x512.png',
  maskable: 'maskable-icon-512x512.png',
  mstile: 'mstile-150x150.png',
  manifest: 'site.webmanifest',
  browserconfig: 'browserconfig.xml',
  snippet: 'head-snippet.html',
};

export const ALL_ASSETS: AssetId[] = [
  'ico',
  'png16',
  'png32',
  'png48',
  'svg',
  'apple',
  'android192',
  'android512',
  'maskable',
  'mstile',
  'manifest',
  'browserconfig',
  'snippet',
];

export const DEFAULT_ASSETS: AssetId[] = [
  'ico',
  'png16',
  'png32',
  'svg',
  'apple',
  'android192',
  'android512',
  'maskable',
  'manifest',
  'snippet',
];

// ---------------------------------------------------------------------------
// Text files
// ---------------------------------------------------------------------------

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildManifest(s: IconSettings, assets: Set<AssetId>): string {
  const icons: Record<string, string>[] = [];
  if (assets.has('android192')) {
    icons.push({ src: `/${ASSET_FILES.android192}`, sizes: '192x192', type: 'image/png', purpose: 'any' });
  }
  if (assets.has('android512')) {
    icons.push({ src: `/${ASSET_FILES.android512}`, sizes: '512x512', type: 'image/png', purpose: 'any' });
  }
  if (assets.has('maskable')) {
    icons.push({ src: `/${ASSET_FILES.maskable}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' });
  }

  return JSON.stringify(
    {
      // `id` + `scope` + `start_url` are what turn this from a decorative file
      // into an installable PWA descriptor. The old build shipped none of them
      // and named every site "FaviconBolt".
      id: '/',
      name: s.appName,
      short_name: s.appShortName || s.appName,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: s.themeColor,
      background_color: s.appleBg,
      icons,
    },
    null,
    2
  );
}

export function buildBrowserConfig(s: IconSettings): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/${ASSET_FILES.mstile}"/>
      <TileColor>${esc(s.themeColor)}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;
}

/** The `<head>` block. This is the part people actually come looking for. */
export function buildSnippet(s: IconSettings, assets: Set<AssetId>): string {
  const lines: string[] = [];
  if (assets.has('ico')) lines.push(`<link rel="icon" href="/${ASSET_FILES.ico}" sizes="32x32">`);
  if (assets.has('svg')) lines.push(`<link rel="icon" href="/${ASSET_FILES.svg}" type="image/svg+xml">`);
  if (assets.has('png32')) {
    lines.push(`<link rel="icon" type="image/png" sizes="32x32" href="/${ASSET_FILES.png32}">`);
  }
  if (assets.has('png16')) {
    lines.push(`<link rel="icon" type="image/png" sizes="16x16" href="/${ASSET_FILES.png16}">`);
  }
  if (assets.has('apple')) {
    lines.push(`<link rel="apple-touch-icon" sizes="180x180" href="/${ASSET_FILES.apple}">`);
  }
  if (assets.has('manifest')) lines.push(`<link rel="manifest" href="/${ASSET_FILES.manifest}">`);
  if (assets.has('browserconfig')) {
    lines.push(`<meta name="msapplication-config" content="/${ASSET_FILES.browserconfig}">`);
  }
  lines.push(`<meta name="theme-color" content="${esc(s.themeColor)}">`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// SVG favicon
// ---------------------------------------------------------------------------

function plateSvg(s: IconSettings, size: number): { defs: string; body: string } {
  if (s.shape === 'none') return { defs: '', body: '' };

  const strokeW = (s.borderWidth / 100) * size;
  const d = shapePathData(size, s.shape, strokeW / 2);

  let fill = esc(s.bgColor);
  let defs = '';
  if (s.fill === 'gradient') {
    const a = (s.gradientAngle * Math.PI) / 180;
    const x1 = (0.5 - Math.cos(a) / 2).toFixed(4);
    const y1 = (0.5 - Math.sin(a) / 2).toFixed(4);
    const x2 = (0.5 + Math.cos(a) / 2).toFixed(4);
    const y2 = (0.5 + Math.sin(a) / 2).toFixed(4);
    defs = `<linearGradient id="fbBg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${esc(
      s.bgColor
    )}"/><stop offset="1" stop-color="${esc(s.bgColor2)}"/></linearGradient>`;
    fill = 'url(#fbBg)';
  }

  const stroke =
    strokeW > 0 ? ` stroke="${esc(s.borderColor)}" stroke-width="${strokeW.toFixed(2)}"` : '';
  return { defs, body: `<path d="${d}" fill="${fill}"${stroke}/>` };
}

/**
 * A genuinely vector favicon.svg for the emoji and text modes. For an uploaded
 * raster we embed the 512px PNG instead and the UI says so — pretending a
 * traced JPEG is vector would be the kind of claim this tool should not make.
 */
export async function buildSvg(
  s: IconSettings,
  source: SourceImage | null,
  master: AnyCanvas
): Promise<string> {
  const size = 512;
  const plate = plateSvg(s, size);
  const strokeW = (s.borderWidth / 100) * size;
  const pad = (s.padding / 100) * size + strokeW;
  const box = Math.max(1, size - pad * 2);

  const cx = size / 2 + (s.offsetX / 100) * size;
  const cy = size / 2 + (s.offsetY / 100) * size;
  const rotate = s.rotation ? ` transform="rotate(${s.rotation} ${cx} ${cy})"` : '';

  let art = '';
  if (s.mode === 'image' && source) {
    let href: string;
    if (source.svgText) {
      // Keeps the upload vector: an <image> with an SVG data URI is rendered
      // as vector, and never injects the untrusted markup into our own DOM.
      href = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(source.svgText)))}`;
    } else {
      const blob = await canvasToBlob(master, 'image/png');
      href = await blobToDataUrl(blob);
    }
    const side = box * (s.scale || 1);
    art = `<image href="${href}" x="${(cx - side / 2).toFixed(2)}" y="${(cy - side / 2).toFixed(
      2
    )}" width="${side.toFixed(2)}" height="${side.toFixed(2)}" preserveAspectRatio="xMidYMid meet"${rotate}/>`;
  } else {
    const glyph = s.mode === 'emoji' ? firstGrapheme(s.emoji) || '⚡' : (s.text || 'A').slice(0, 3);
    const fontSize = box * (s.fontScale / 100) * (s.scale || 1) * 1.16;
    const family =
      s.mode === 'emoji'
        ? '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'
        : `${s.fontFamily},sans-serif`;
    art =
      `<text x="${cx}" y="${cy}" font-family='${family}' font-size="${fontSize.toFixed(2)}"` +
      ` font-weight="${s.fontWeight}" fill="${esc(s.textColor)}" text-anchor="middle"` +
      ` dominant-baseline="central"${rotate}>${esc(glyph)}</text>`;
  }

  const defs = plate.defs ? `<defs>${plate.defs}</defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${defs}${plate.body}${art}</svg>`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------
// Pack
// ---------------------------------------------------------------------------

export interface PackResult {
  zip: Blob;
  /** Kept so the "send to another tool" bar has something to hand over. */
  preview512: Blob;
  ico: Blob;
  svg: string;
  snippet: string;
  bytes: number;
}

export async function buildPack(
  settings: IconSettings,
  source: SourceImage | null,
  selected: AssetId[],
  onProgress?: (done: number, total: number) => void
): Promise<PackResult> {
  const assets = new Set(selected);
  const zip = new JSZip();

  const master = renderMaster({ settings, source });
  const steps = selected.length + 2;
  let done = 0;
  const tick = () => onProgress?.(++done, steps);

  const png = async (size: number) => canvasToBlob(frameAt(master, size, settings.sharpenSmall));

  // --- ICO ----------------------------------------------------------------
  let icoBlob = new Blob();
  if (assets.has('ico')) {
    const frames = [16, 32, 48].map(size => ({
      size,
      pixels: canvasToImageData(frameAt(master, size, settings.sharpenSmall)),
    }));
    icoBlob = buildIco(frames);
    zip.file(ASSET_FILES.ico, icoBlob);
    tick();
  }

  // --- Plain PNGs ---------------------------------------------------------
  for (const [id, size] of [
    ['png16', 16],
    ['png32', 32],
    ['png48', 48],
    ['android192', 192],
    ['android512', 512],
  ] as [AssetId, number][]) {
    if (!assets.has(id)) continue;
    zip.file(ASSET_FILES[id], await png(size));
    tick();
  }

  // --- Flattened variants -------------------------------------------------
  if (assets.has('apple')) {
    // iOS composites the home-screen icon on black when alpha is present, so
    // the touch icon ships opaque. Shipping it transparent is the single most
    // common favicon bug on the web.
    const appleMaster = renderMaster({ settings, source, flattenTo: settings.appleBg });
    zip.file(ASSET_FILES.apple, await canvasToBlob(frameAt(appleMaster, 180, false)));
    tick();
  }

  if (assets.has('maskable')) {
    const maskMaster = renderMaster({ settings, source, maskable: true, flattenTo: settings.appleBg });
    zip.file(ASSET_FILES.maskable, await canvasToBlob(frameAt(maskMaster, 512, false)));
    tick();
  }

  if (assets.has('mstile')) {
    const tileMaster = renderMaster({ settings, source, flattenTo: settings.themeColor });
    zip.file(ASSET_FILES.mstile, await canvasToBlob(frameAt(tileMaster, 150, false)));
    tick();
  }

  // --- Text files ---------------------------------------------------------
  const svg = await buildSvg(settings, source, master);
  if (assets.has('svg')) {
    zip.file(ASSET_FILES.svg, svg);
    tick();
  }
  if (assets.has('manifest')) {
    zip.file(ASSET_FILES.manifest, buildManifest(settings, assets));
    tick();
  }
  if (assets.has('browserconfig')) {
    zip.file(ASSET_FILES.browserconfig, buildBrowserConfig(settings));
    tick();
  }

  const snippet = buildSnippet(settings, assets);
  if (assets.has('snippet')) {
    zip.file(ASSET_FILES.snippet, `<!-- Paste inside <head> -->\n${snippet}\n`);
    tick();
  }

  const preview512 = await canvasToBlob(downscaleTo512(master));
  tick();
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  tick();

  return { zip: zipBlob, preview512, ico: icoBlob, svg, snippet, bytes: zipBlob.size };
}

function downscaleTo512(master: AnyCanvas): AnyCanvas {
  return master.width === 512 ? master : frameAt(master, Math.min(512, MASTER), false);
}
