import React, { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, MapPin, ShieldAlert } from 'lucide-react';
import {
  THUMBNAIL_ID,
  formatBytes,
  type BlockRow,
  type Report,
  type Selection,
  type TagRow,
} from '../lib/report';
import type { TagCategory } from '../lib/tags';
import type { BlockKind } from '../lib/containers';

interface InspectorProps {
  report: Report;
  selection: Selection;
  onToggleTags: (ids: string[], remove: boolean) => void;
  onToggleBlocks: (ids: string[], remove: boolean) => void;
  t: any;
}

const CATEGORY_ORDER: TagCategory[] = [
  'location',
  'identity',
  'time',
  'software',
  'device',
  'capture',
  'image',
];

const CATEGORY_KEY: Record<TagCategory, string> = {
  location: 'catLocation',
  identity: 'catIdentity',
  time: 'catTime',
  software: 'catSoftware',
  device: 'catDevice',
  capture: 'catCapture',
  image: 'catImage',
};

const CATEGORY_FALLBACK: Record<TagCategory, string> = {
  location: 'Where it was taken',
  identity: 'Who and which machine',
  time: 'When it was taken',
  software: 'What edited it',
  device: 'The gear',
  capture: 'Exposure settings',
  image: 'The picture itself',
};

const BLOCK_KEY: Record<BlockKind, string> = {
  exif: 'blockExif',
  xmp: 'blockXmp',
  iptc: 'blockIptc',
  icc: 'blockIcc',
  comment: 'blockComment',
  time: 'blockTime',
  other: 'blockOther',
  structural: 'blockOther',
};

const BLOCK_FALLBACK: Record<BlockKind, string> = {
  exif: 'Exif block — everything the camera recorded',
  xmp: 'XMP — editing history and author fields',
  iptc: 'IPTC / Photoshop — captions, credits, keywords',
  icc: 'ICC colour profile — removing it can shift colours',
  comment: 'Text comment embedded in the file',
  time: 'Last-modified timestamp',
  other: 'Non-standard block',
  structural: 'Structural',
};

const RISK_DOT: Record<string, string> = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-500',
};

const CheckBox: React.FC<{ checked: boolean; indeterminate?: boolean }> = ({ checked, indeterminate }) => (
  <span
    className={`w-4 h-4 shrink-0 rounded-[5px] border flex items-center justify-center transition-all ${
      checked
        ? 'bg-emerald-500 border-emerald-400 text-black'
        : indeterminate
          ? 'bg-emerald-500/25 border-emerald-500/60'
          : 'border-white/20 bg-black/40'
    }`}
  >
    {checked && <Check className="w-3 h-3 stroke-[3.5]" />}
    {!checked && indeterminate && <span className="w-2 h-0.5 rounded bg-emerald-300" />}
  </span>
);

export const Inspector: React.FC<InspectorProps> = ({
  report,
  selection,
  onToggleTags,
  onToggleBlocks,
  t,
}) => {
  const [copied, setCopied] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<TagCategory, TagRow[]>();
    for (const row of report.tags) {
      const list = map.get(row.category) || [];
      list.push(row);
      map.set(row.category, list);
    }
    return CATEGORY_ORDER.filter(c => map.has(c)).map(c => ({ category: c, rows: map.get(c)! }));
  }, [report]);

  const removableBlocks = report.blocks.filter((b: BlockRow) => b.removable);
  const exifBlock = report.blocks.find(b => b.kind === 'exif');
  const exifBlockRemoved = !!exifBlock && selection.blocks.has(exifBlock.id);

  const copyCoords = async () => {
    if (!report.gps) return;
    try {
      await navigator.clipboard.writeText(`${report.gps.latitude}, ${report.gps.longitude}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked; the value is on screen anyway */
    }
  };

  if (report.tags.length === 0 && report.blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-start gap-3">
        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">{t.alreadyCleanTitle || 'Nothing to remove'}</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.alreadyCleanText ||
              'This file carries no Exif, no XMP, no IPTC and no embedded comments. It is already as anonymous as the format allows.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GPS is the one field worth shouting about */}
      {report.gps && (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-bold text-white">{t.gpsFoundTitle || 'This photo knows where you were'}</p>
              <p className="text-xs font-mono text-rose-300 break-all">
                {report.gps.latitude.toFixed(6)}, {report.gps.longitude.toFixed(6)}
              </p>
              <p className="text-[11px] text-slate-500 break-all">{report.gps.formatted}</p>
              {report.gps.altitude != null && (
                <p className="text-[11px] text-slate-500">
                  {t.gpsAltitude || 'Altitude'}: {report.gps.altitude} m
                </p>
              )}
              {report.gps.timestamp && (
                <p className="text-[11px] text-slate-500">
                  {t.gpsTime || 'GPS clock'}: {report.gps.timestamp}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyCoords}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t.copiedLabel || 'Copied' : t.copyCoords || 'Copy coordinates'}
            </button>
            <a
              href={`https://www.openstreetmap.org/?mlat=${report.gps.latitude}&mlon=${report.gps.longitude}#map=16/${report.gps.latitude}/${report.gps.longitude}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t.openMap || 'Open in OpenStreetMap'}
            </a>
          </div>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            {t.mapWarning ||
              'That link opens a third-party site and hands it these coordinates. Nothing is sent unless you click it.'}
          </p>
        </div>
      )}

      {/* Container blocks */}
      {removableBlocks.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-black/25 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {t.blocksTitle || 'Metadata blocks in the file'}
            </span>
            <button
              onClick={() =>
                onToggleBlocks(
                  removableBlocks.map(b => b.id),
                  !removableBlocks.every(b => selection.blocks.has(b.id))
                )
              }
              className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              {removableBlocks.every(b => selection.blocks.has(b.id))
                ? t.selectNone || 'None'
                : t.selectAll || 'All'}
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {removableBlocks.map(block => {
              const checked = selection.blocks.has(block.id);
              return (
                <button
                  key={block.id}
                  onClick={() => onToggleBlocks([block.id], !checked)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <span className="mt-0.5">
                    <CheckBox checked={checked} />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{block.label}</span>
                      <span className="text-[10px] font-mono text-slate-500">{formatBytes(block.bytes)}</span>
                      {block.kind === 'icc' && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {t.iccWarnBadge || 'affects colour'}
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-slate-500 leading-relaxed">
                      {t[BLOCK_KEY[block.kind]] || BLOCK_FALLBACK[block.kind]}
                    </span>
                    {block.preview && (
                      <span className="block text-[10px] font-mono text-slate-600 truncate">{block.preview}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Embedded preview */}
      {report.thumbnailBytes > 0 && (
        <button
          onClick={() => onToggleTags([THUMBNAIL_ID], !selection.tags.has(THUMBNAIL_ID))}
          disabled={exifBlockRemoved}
          className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl border border-white/5 bg-black/25 text-left hover:bg-white/[0.03] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="mt-0.5">
            <CheckBox checked={exifBlockRemoved || selection.tags.has(THUMBNAIL_ID)} />
          </span>
          <span className="min-w-0 flex-1 space-y-1">
            <span className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">{t.thumbnailTitle || 'Embedded preview image'}</span>
              <span className="text-[10px] font-mono text-slate-500">{formatBytes(report.thumbnailBytes)}</span>
            </span>
            <span className="block text-[11px] text-slate-500 leading-relaxed">
              {t.thumbnailText ||
                'A second copy of the picture stored inside the Exif block. It is frequently the version from before you cropped or retouched anything.'}
            </span>
          </span>
        </button>
      )}

      {/* Tags, grouped */}
      {grouped.length > 0 && (
        <div className="space-y-2">
          {exifBlockRemoved && (
            <p className="flex items-start gap-2 text-[11px] text-amber-400/90 leading-relaxed px-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {t.wholeBlockNotice ||
                'The whole Exif block is selected for removal, so every tag below goes with it. Untick the block to pick tags one by one.'}
            </p>
          )}
          {grouped.map(({ category, rows }) => {
            const ids = rows.map(r => r.id);
            const selected = ids.filter(id => selection.tags.has(id)).length;
            const all = selected === ids.length;
            const some = selected > 0 && !all;
            return (
              <details
                key={category}
                open={category === 'location' || category === 'identity'}
                className="rounded-2xl border border-white/5 bg-black/25 overflow-hidden group"
              >
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.03] transition-colors">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleTags(ids, !all);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleTags(ids, !all);
                      }
                    }}
                  >
                    <CheckBox checked={all || exifBlockRemoved} indeterminate={some} />
                  </span>
                  <span className="text-xs font-bold text-white flex-1 min-w-0 truncate">
                    {t[CATEGORY_KEY[category]] || CATEGORY_FALLBACK[category]}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {selected > 0 ? `${selected}/${rows.length}` : rows.length}
                  </span>
                  <span className="text-emerald-400 text-lg leading-none transition-transform group-open:rotate-45 shrink-0">
                    +
                  </span>
                </summary>
                <div className="divide-y divide-white/5 border-t border-white/5">
                  {rows.map(row => {
                    const checked = exifBlockRemoved || selection.tags.has(row.id);
                    return (
                      <button
                        key={row.id}
                        onClick={() => onToggleTags([row.id], !selection.tags.has(row.id))}
                        disabled={exifBlockRemoved}
                        className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <span className="mt-1">
                          <CheckBox checked={checked} />
                        </span>
                        <span className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-x-3 gap-y-0.5 items-baseline">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${RISK_DOT[row.risk]}`} />
                            <span className="text-[11px] font-bold text-slate-300 truncate">{row.name}</span>
                          </span>
                          <span className="text-[11px] font-mono text-white/85 break-all">{row.value}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inspector;
