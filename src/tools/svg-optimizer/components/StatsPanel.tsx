import React from 'react';
import { AlertTriangle, Package, Wrench } from 'lucide-react';
import type { OptimizeOk } from '../lib/types';

// ============================================================================
// What actually changed.
// ----------------------------------------------------------------------------
// Two numbers matter and most tools only show one. The raw byte count is what
// lands on disk; the gzip count is what crosses the network, and it is
// routinely a very different percentage — minifying whitespace looks
// spectacular raw and barely registers after compression, because gzip was
// already handling it. Showing both is the honest version.
//
// The element/id/colour deltas come from svgo's AST, not from parsing the
// output string again, so they describe what the optimizer did rather than
// what we can guess afterwards.
// ============================================================================

interface StatsPanelProps {
  result: OptimizeOk;
  t: any;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const pct = (from: number, to: number) => (from === 0 ? 0 : Math.round(((from - to) / from) * 100));

const SizeRow: React.FC<{ label: string; from: number; to: number; accent?: boolean }> = ({
  label,
  from,
  to,
  accent,
}) => {
  const reduction = pct(from, to);
  const grew = reduction < 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
        <span className="text-xs font-mono text-gray-400 tabular-nums">
          {formatBytes(from)} <span className="text-gray-600">→</span>{' '}
          <span className={accent ? 'text-cyan-300 font-bold' : 'text-gray-200 font-bold'}>
            {formatBytes(to)}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{
              width: `${Math.max(0, Math.min(100, reduction))}%`,
              background: grew
                ? '#ef4444'
                : reduction > 50
                ? 'linear-gradient(90deg,#10b981,#06b6d4)'
                : 'linear-gradient(90deg,#06b6d4,#3b82f6)',
            }}
          />
        </div>
        {/* A file that got bigger says so in words. Printing "-8%" for an 8%
            increase, which is what the old build did, reads as a win. */}
        <span
          className={`text-sm font-black tabular-nums shrink-0 ${
            grew ? 'text-red-400' : reduction > 0 ? 'text-emerald-400' : 'text-gray-400'
          }`}
        >
          {grew ? `+${Math.abs(reduction)}%` : `−${reduction}%`}
        </span>
      </div>
    </div>
  );
};

const Delta: React.FC<{ label: string; from: number; to: number }> = ({ label, from, to }) => (
  <div className="rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2.5">
    <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1 truncate">
      {label}
    </div>
    <div className="text-sm font-bold text-gray-200 tabular-nums">
      {from === to ? (
        <span>{to}</span>
      ) : (
        <>
          <span className="text-gray-500 line-through decoration-gray-700">{from}</span>{' '}
          <span className="text-cyan-300">{to}</span>
        </>
      )}
    </div>
  </div>
);

export const StatsPanel: React.FC<StatsPanelProps> = ({ result, t }) => {
  const { before, after, repairs } = result;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-5">
        <SizeRow label={t.stat_raw || 'Raw size'} from={result.inputBytes} to={result.outputBytes} accent />
        {result.outputGzip > 0 && (
          <SizeRow label={t.stat_gzip || 'Gzipped (what ships)'} from={result.inputGzip} to={result.outputGzip} />
        )}
        <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-gray-600">
          <Package className="w-3 h-3" />
          {(t.stat_took || 'Optimized in {ms} ms').replace('{ms}', String(result.ms))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Delta label={t.stat_elements || 'Elements'} from={before.elements} to={after.elements} />
        <Delta label={t.stat_paths || 'Paths'} from={before.paths} to={after.paths} />
        <Delta label={t.stat_groups || 'Groups'} from={before.groups} to={after.groups} />
        <Delta label={t.stat_ids || 'IDs'} from={before.ids} to={after.ids} />
        <Delta label={t.stat_colors || 'Colours'} from={before.colors} to={after.colors} />
        <Delta label={t.stat_path_chars || 'Path chars'} from={before.pathChars} to={after.pathChars} />
      </div>

      {repairs.length > 0 && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4 space-y-2">
          <div className="flex items-center gap-2 text-cyan-300">
            <Wrench className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold">{t.repair_title || 'Your file needed repairs'}</span>
          </div>
          <ul className="space-y-1 list-none p-0 m-0">
            {repairs.map((repair, i) => (
              <li key={i} className="text-[11px] text-cyan-100/70 leading-relaxed">
                {t[`repair_${repair.kind}`] || repair.kind}
                {repair.detail && <code className="ml-1.5 text-cyan-300/80 font-mono">{repair.detail}</code>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Warnings before={before} after={after} t={t} />
    </div>
  );
};

const Warnings: React.FC<{ before: OptimizeOk['before']; after: OptimizeOk['after']; t: any }> = ({
  before,
  after,
  t,
}) => {
  const items: string[] = [];

  if (before.hasViewBox && !after.hasViewBox) items.push(t.warn_viewbox || '');
  if (before.hasScript || before.hasEventHandlers) items.push(t.warn_script || '');
  if (after.hasExternalRef) items.push(t.warn_external || '');
  if (after.hasRaster) items.push(t.warn_raster || '');
  if (after.hasText) items.push(t.warn_text || '');

  const shown = items.filter(Boolean);
  if (shown.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 space-y-2">
      <div className="flex items-center gap-2 text-amber-300">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="text-xs font-bold">{t.warn_title || 'Worth knowing'}</span>
      </div>
      <ul className="space-y-1.5 list-none p-0 m-0">
        {shown.map((text, i) => (
          <li key={i} className="text-[11px] text-amber-100/75 leading-relaxed">
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StatsPanel;
