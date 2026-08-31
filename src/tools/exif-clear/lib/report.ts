// ============================================================================
// The report: what is inside a file, and what a given selection would remove
// ----------------------------------------------------------------------------
// One pass produces both the human view (tags grouped by category, GPS resolved
// to coordinates) and the machine view (byte ranges), so the UI can show the
// exact cost of every checkbox and verify the result afterwards.
// ============================================================================

import {
  rebuild,
  scanContainer,
  type Block,
  type BlockKind,
  type Container,
  type ImageFormat,
} from './containers';
import {
  decodeEntry,
  parseTiff,
  serialiseTiff,
  emptyBlock,
  TAG_MAKER_NOTE,
  TAG_ORIENTATION,
  type IfdName,
  type RawEntry,
  type TiffBlock,
} from './tiff';
import { dmsToDecimal, formatDms, formatValue, tagInfo, type TagCategory, type TagRisk } from './tags';

export interface TagRow {
  /** Stable id used by the per-tag checkboxes: "gps:2", "exif:37500". */
  id: string;
  ifd: IfdName;
  tag: number;
  name: string;
  category: TagCategory;
  risk: TagRisk;
  value: string;
  bytes: number;
}

export interface BlockRow {
  id: string;
  kind: BlockKind;
  label: string;
  bytes: number;
  removable: boolean;
  preview?: string;
  tagCount?: number;
}

export interface GpsFix {
  latitude: number;
  longitude: number;
  formatted: string;
  altitude?: number;
  timestamp?: string;
}

export interface Report {
  format: ImageFormat;
  totalBytes: number;
  /** Bytes occupied by everything a person could reasonably call "metadata". */
  metadataBytes: number;
  blocks: BlockRow[];
  tags: TagRow[];
  gps: GpsFix | null;
  /** EXIF orientation, 1 when the file does not say. */
  orientation: number;
  thumbnailBytes: number;
  /** True when the byte scan followed the whole file without losing its footing. */
  ok: boolean;
}

/** Pseudo-id for the embedded preview, which is not a tag but is removable. */
export const THUMBNAIL_ID = 'ifd1:thumbnail';

export interface Selection {
  /** Container block ids to drop entirely. */
  blocks: Set<string>;
  /** Tag ids (and THUMBNAIL_ID) to drop from inside the Exif block. */
  tags: Set<string>;
  /** Re-inject a minimal Exif holding only Orientation when the rest goes. */
  keepOrientation: boolean;
}

export function emptySelection(): Selection {
  return { blocks: new Set(), tags: new Set(), keepOrientation: true };
}

const IFD_ORDER: IfdName[] = ['ifd0', 'exif', 'gps', 'interop', 'ifd1'];

function entriesOf(block: TiffBlock, ifd: IfdName): RawEntry[] {
  return block[ifd];
}

export function tagId(ifd: IfdName, tag: number): string {
  return `${ifd}:${tag}`;
}

function readGps(block: TiffBlock): GpsFix | null {
  const byTag = new Map<number, RawEntry>();
  for (const entry of block.gps) byTag.set(entry.tag, entry);

  const latRef = byTag.get(1);
  const lat = byTag.get(2);
  const lonRef = byTag.get(3);
  const lon = byTag.get(4);
  if (!lat || !lon || !latRef || !lonRef) return null;

  const latParts = decodeEntry(lat, block.littleEndian).numbers;
  const lonParts = decodeEntry(lon, block.littleEndian).numbers;
  const latRefText = decodeEntry(latRef, block.littleEndian).text || 'N';
  const lonRefText = decodeEntry(lonRef, block.littleEndian).text || 'E';

  const latitude = dmsToDecimal(latParts, latRefText);
  const longitude = dmsToDecimal(lonParts, lonRefText);
  if (latitude == null || longitude == null) return null;

  const fix: GpsFix = {
    latitude,
    longitude,
    formatted: `${formatDms(latParts, latRefText)}, ${formatDms(lonParts, lonRefText)}`,
  };

  const alt = byTag.get(6);
  if (alt) {
    const value = decodeEntry(alt, block.littleEndian).numbers[0];
    if (Number.isFinite(value)) fix.altitude = Math.round(value * 10) / 10;
  }
  const stamp = byTag.get(7);
  const date = byTag.get(29);
  if (stamp) {
    const parts = decodeEntry(stamp, block.littleEndian).numbers;
    const time = parts
      .slice(0, 3)
      .map(n => String(Math.floor(n)).padStart(2, '0'))
      .join(':');
    fix.timestamp = date ? `${decodeEntry(date, block.littleEndian).text} ${time} UTC` : `${time} UTC`;
  }

  return fix;
}

function readOrientation(block: TiffBlock): number {
  const entry = block.ifd0.find(e => e.tag === TAG_ORIENTATION);
  if (!entry) return 1;
  const value = decodeEntry(entry, block.littleEndian).numbers[0];
  return value >= 1 && value <= 8 ? value : 1;
}

/** Metadata block kinds. Structural blocks are the file itself, not metadata. */
const META_KINDS: BlockKind[] = ['exif', 'xmp', 'iptc', 'icc', 'comment', 'time', 'other'];

function buildReport(container: Container, tiff: TiffBlock | null): Report {
  const blocks: BlockRow[] = [];
  const tags: TagRow[] = [];
  let metadataBytes = 0;

  if (tiff) {
    for (const ifd of IFD_ORDER) {
      for (const entry of entriesOf(tiff, ifd)) {
        const info = tagInfo(ifd, entry.tag);
        const decoded = decodeEntry(entry, tiff.littleEndian);
        const value =
          entry.tag === TAG_MAKER_NOTE
            ? `${entry.data.byteLength} bytes of proprietary data`
            : formatValue(ifd, entry.tag, decoded.text, decoded.numbers);
        tags.push({
          id: tagId(ifd, entry.tag),
          ifd,
          tag: entry.tag,
          name: info.name,
          category: info.category,
          risk: info.risk,
          value: value || '—',
          bytes: entry.data.byteLength + 12,
        });
      }
    }
  }

  for (const block of container.blocks) {
    if (!META_KINDS.includes(block.kind)) continue;
    metadataBytes += block.size;
    blocks.push({
      id: block.id,
      kind: block.kind,
      label: block.label,
      bytes: block.size,
      removable: block.removable,
      preview: block.preview,
      tagCount: block.kind === 'exif' && tiff ? tags.length : undefined,
    });
  }

  const thumbnailBytes = tiff?.thumbnail?.byteLength ?? 0;

  return {
    format: container.format,
    totalBytes: container.bytes.byteLength,
    metadataBytes,
    blocks,
    tags,
    gps: tiff ? readGps(tiff) : null,
    orientation: tiff ? readOrientation(tiff) : 1,
    thumbnailBytes,
    ok: container.ok,
  };
}

export interface Inspection {
  report: Report;
  container: Container;
  tiff: TiffBlock | null;
  exifBlock: Block | null;
}

export function inspect(bytes: Uint8Array): Inspection | null {
  const container = scanContainer(bytes);
  if (!container) return null;

  const exifBlock = container.blocks.find(b => b.kind === 'exif') || null;
  let tiff: TiffBlock | null = null;
  if (exifBlock && exifBlock.payloadSize > 8) {
    tiff = parseTiff(
      container.bytes.subarray(exifBlock.payloadOffset, exifBlock.payloadOffset + exifBlock.payloadSize)
    );
  }

  return { report: buildReport(container, tiff), container, tiff, exifBlock };
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export type PresetId = 'full' | 'gps' | 'identity' | 'custom';

/** Tags that name a person, a machine or a place — never photographic data. */
function isIdentityTag(row: TagRow): boolean {
  return row.risk === 'high' || row.category === 'location' || row.category === 'identity';
}

export function buildSelection(
  report: Report,
  preset: PresetId,
  options: { keepOrientation: boolean; removeIcc: boolean }
): Selection {
  const selection: Selection = {
    blocks: new Set(),
    tags: new Set(),
    keepOrientation: options.keepOrientation,
  };

  const addBlocks = (kinds: BlockKind[]) => {
    for (const block of report.blocks) {
      if (!block.removable) continue;
      if (block.kind === 'icc' && !options.removeIcc) continue;
      if (kinds.includes(block.kind)) selection.blocks.add(block.id);
    }
  };

  if (preset === 'full') {
    addBlocks(['exif', 'xmp', 'iptc', 'icc', 'comment', 'time', 'other']);
    selection.tags.add(THUMBNAIL_ID);
    return selection;
  }

  if (preset === 'gps') {
    for (const row of report.tags) {
      if (row.ifd === 'gps') selection.tags.add(row.id);
    }
    if (options.removeIcc) addBlocks(['icc']);
    return selection;
  }

  if (preset === 'identity') {
    for (const row of report.tags) {
      if (isIdentityTag(row)) selection.tags.add(row.id);
      if (row.ifd === 'ifd0' && row.tag === 0x0131) selection.tags.add(row.id); // Software
    }
    selection.tags.add(THUMBNAIL_ID);
    addBlocks(['xmp', 'iptc', 'comment', 'time', 'other', 'icc']);
    return selection;
  }

  return selection;
}

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------

function minimalOrientation(orientation: number, littleEndian: boolean): Uint8Array {
  const block = emptyBlock(littleEndian);
  const data = new Uint8Array(2);
  new DataView(data.buffer).setUint16(0, orientation, littleEndian);
  block.ifd0.push({ tag: TAG_ORIENTATION, type: 3, count: 1, data });
  return serialiseTiff(block);
}

export interface CleanResult {
  bytes: Uint8Array;
  /** Re-read of the output: this is what actually survived, not what we intended. */
  verification: Report | null;
  removedBytes: number;
}

/**
 * Applies a selection and re-inspects the result. Nothing is trusted: the
 * verification report comes from parsing the bytes we are about to hand over.
 */
export function clean(source: Inspection, selection: Selection): CleanResult {
  const { container, tiff, exifBlock, report } = source;

  let exifPayload: Uint8Array | null | undefined;

  if (exifBlock && tiff) {
    const dropWholeBlock = selection.blocks.has(exifBlock.id);
    const droppedTags = [...selection.tags].filter(id => id !== THUMBNAIL_ID);

    if (dropWholeBlock) {
      const wantsOrientation =
        selection.keepOrientation && report.orientation !== 1 && container.format !== 'png';
      exifPayload = wantsOrientation
        ? minimalOrientation(report.orientation, tiff.littleEndian)
        : null;
    } else if (droppedTags.length > 0 || selection.tags.has(THUMBNAIL_ID)) {
      const next: TiffBlock = {
        littleEndian: tiff.littleEndian,
        ifd0: tiff.ifd0.filter(e => !selection.tags.has(tagId('ifd0', e.tag))),
        exif: tiff.exif.filter(e => !selection.tags.has(tagId('exif', e.tag))),
        gps: tiff.gps.filter(e => !selection.tags.has(tagId('gps', e.tag))),
        interop: tiff.interop.filter(e => !selection.tags.has(tagId('interop', e.tag))),
        ifd1: selection.tags.has(THUMBNAIL_ID)
          ? []
          : tiff.ifd1.filter(e => !selection.tags.has(tagId('ifd1', e.tag))),
        thumbnail: selection.tags.has(THUMBNAIL_ID) ? null : tiff.thumbnail,
      };
      const serialised = serialiseTiff(next);
      exifPayload = serialised.byteLength ? serialised : null;
    }
  }

  const plan = {
    remove: new Set(
      [...selection.blocks].filter(id => !(exifBlock && id === exifBlock.id && exifPayload))
    ),
    exifPayload,
  };

  const bytes = rebuild(container, plan);
  const verification = inspect(bytes)?.report ?? null;

  return {
    bytes,
    verification,
    removedBytes: Math.max(0, container.bytes.byteLength - bytes.byteLength),
  };
}

// ---------------------------------------------------------------------------
// Small helpers shared with the UI
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Number of removable things the report found, used for the summary badges. */
export function countRemovable(report: Report): { tags: number; blocks: number } {
  return {
    tags: report.tags.length,
    blocks: report.blocks.filter(b => b.removable).length,
  };
}
