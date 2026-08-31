// ============================================================================
// File intake.
//
// A "Lottie file" arrives in four different containers in the wild:
//   .json      — the raw document
//   .lottie    — a ZIP (dotLottie), which is what lottiefiles.com hands you today
//   .tgs       — a gzipped document (Telegram animated sticker)
//   .json.gz   — a gzipped document
// Everything is sniffed by content, not by extension, because plenty of files
// are misnamed.
// ============================================================================

import JSZip from 'jszip';
import type { LottieJson, StagedFile } from '../types';
import { buildDiagnostics } from './validate';

export type LottieSource = StagedFile['source'];

/** Anything past this is going to lock the main thread on parse; we warn first. */
export const LARGE_FILE_BYTES = 12 * 1024 * 1024;

export class LottieParseError extends Error {
  /** i18n key suffix so the UI can translate the failure. */
  readonly key: string;
  constructor(key: string, message: string) {
    super(message);
    this.key = key;
  }
}

/** A document is a Lottie if it declares a version and carries a layer list. */
export function looksLikeLottie(json: any): boolean {
  return (
    !!json &&
    typeof json === 'object' &&
    !Array.isArray(json) &&
    json.v !== undefined &&
    Array.isArray(json.layers)
  );
}

// The header slice below is exactly 4 bytes long, so these guards compare with
// `>=`: a `> 4` test silently rejected every .lottie archive.
function isGzip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

async function gunzip(buffer: ArrayBuffer): Promise<string> {
  // DecompressionStream ships in every browser we target; no library needed.
  if (typeof DecompressionStream === 'undefined') {
    throw new LottieParseError('error_no_gzip', 'This browser cannot decompress gzip files');
  }
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

function parseJson(text: string): LottieJson {
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new LottieParseError('error_invalid_json', 'Invalid JSON');
  }
  if (!looksLikeLottie(json)) {
    throw new LottieParseError('error_no_lottie', 'Not a Lottie animation');
  }
  return json as LottieJson;
}

/**
 * Unpacks a dotLottie archive: pulls the first animation out of the manifest and
 * inlines any bundled images as data URIs, so the result is a self-contained
 * document that renders without touching the network.
 */
async function readDotLottie(buffer: ArrayBuffer): Promise<LottieJson> {
  const zip = await JSZip.loadAsync(buffer);

  let animationPath: string | null = null;
  const manifestFile = zip.file('manifest.json');
  if (manifestFile) {
    try {
      const manifest = JSON.parse(await manifestFile.async('string'));
      const id = manifest?.animations?.[0]?.id;
      if (id) animationPath = `animations/${id}.json`;
    } catch {
      // A broken manifest is not fatal — fall through to the directory scan.
    }
  }

  let entry = animationPath ? zip.file(animationPath) : null;
  if (!entry) {
    const candidates = zip.file(/animations\/.*\.json$/i);
    entry = candidates.length ? candidates[0] : null;
  }
  if (!entry) {
    const anyJson = zip.file(/\.json$/i).filter(f => !/manifest\.json$/i.test(f.name));
    entry = anyJson.length ? anyJson[0] : null;
  }
  if (!entry) {
    throw new LottieParseError('error_no_lottie', 'No animation found inside the .lottie archive');
  }

  const json = parseJson(await entry.async('string'));

  // Inline bundled images. dotLottie references them as `images/img_0.png`.
  if (Array.isArray(json.assets)) {
    for (const asset of json.assets) {
      if (!asset || typeof asset.p !== 'string') continue;
      if (asset.p.startsWith('data:')) continue;
      const name = String(asset.p).replace(/^.*[/\\]/, '');
      const imageFile =
        zip.file(`images/${name}`) || zip.file(new RegExp(`(^|/)${escapeRegExp(name)}$`))?.[0];
      if (!imageFile) continue;
      const base64 = await imageFile.async('base64');
      asset.p = `data:${mimeFor(name)};base64,${base64}`;
      asset.u = '';
      asset.e = 1;
    }
  }

  return json;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mimeFor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'gif') return 'image/gif';
  return 'image/png';
}

/** Reads any supported container and returns a staged file — nothing renders yet. */
export async function readLottieFile(file: File): Promise<StagedFile> {
  const buffer = await file.arrayBuffer();
  const head = new Uint8Array(buffer.slice(0, 4));

  let json: LottieJson;
  let source: LottieSource;

  if (isZip(head)) {
    json = await readDotLottie(buffer);
    source = 'dotlottie';
  } else if (isGzip(head)) {
    json = parseJson(await gunzip(buffer));
    source = /\.tgs$/i.test(file.name) ? 'tgs' : 'gzip';
  } else {
    json = parseJson(new TextDecoder().decode(buffer));
    source = 'json';
  }

  return {
    json,
    name: file.name,
    source,
    diagnostics: buildDiagnostics(json),
  };
}

/** Same thing for text pasted straight into the textarea. */
export function readLottieText(text: string, name = 'pasted.json'): StagedFile {
  const json = parseJson(text);
  return { json, name, source: 'paste', diagnostics: buildDiagnostics(json) };
}

/** Strips every known Lottie extension, not just the first `.json` it finds. */
export function baseName(fileName: string): string {
  return fileName.replace(/\.(json\.gz|json|lottie|tgs|gz)$/i, '') || 'animation';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
