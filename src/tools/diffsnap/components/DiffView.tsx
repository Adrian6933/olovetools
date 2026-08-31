import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronsUpDown, Pin } from 'lucide-react';
import { TOKEN_CLASS, tokenizeLine, type LanguageId, type TokenRange } from '../lib/highlight';
import type { Anchor, LineDiff, Row, Segment, UnifiedRow } from '../types';

// ============================================================================
// The result pane.
// ----------------------------------------------------------------------------
// Three things the old view got wrong and this one does not:
//
//  * It rendered every row. Two 10 000-line files made 20 000 DOM nodes and the
//    tab stopped scrolling. Only the rows on screen are mounted here.
//  * The two columns had independent scrollbars, so the "side by side" stopped
//    lining up the moment you moved one of them. Both axes are shared now: one
//    scroll container, two equal columns measured in `ch`.
//  * `border-l-4` was drawn only on changed rows, which pushed their text 4px
//    to the right and broke the alignment it was supposed to help. The marker
//    is inside the gutter here, so every row starts at the same x.
// ============================================================================

export type ViewMode = 'split' | 'unified';

interface DiffViewProps {
  diff: LineDiff;
  mode: ViewMode;
  language: LanguageId;
  /** Prism has finished loading — bumped so rows re-render with colour. */
  grammarReady: number;
  /** Unchanged lines kept around each change; Infinity shows the whole file. */
  context: number;
  wrap: boolean;
  fontSize: number;
  /** Mirrors the comparison without recomputing it (hold Alt, or the button). */
  inverted: boolean;
  anchors: Anchor[];
  onToggleAnchor: (side: 'a' | 'b', line: number) => void;
  /** 0-based line index waiting for its partner, or null. */
  pendingAnchor: { side: 'a' | 'b'; line: number } | null;
  /** Hunk index to scroll to, bumped through `nonce`. */
  scrollTo: { hunk: number; nonce: number } | null;
  labelA: string;
  labelB: string;
  t: any;
}

/** Beyond this many rows, soft wrap is refused: variable heights kill the windowing. */
const WRAP_ROW_LIMIT = 4000;

// ---------------------------------------------------------------------------
// Painting one line: syntax colour and word-level change highlight at once
// ---------------------------------------------------------------------------

interface Piece {
  text: string;
  className: string;
  changed: boolean;
}

/**
 * Slices the line at every boundary of both layers so a changed word inside a
 * string literal keeps the string colour *and* the change background, instead
 * of one overwriting the other.
 */
function paint(text: string, segments: Segment[] | null, tokens: TokenRange[]): Piece[] {
  if (text === '') return [];

  const bounds = new Set<number>([0, text.length]);
  let at = 0;
  if (segments) {
    for (const segment of segments) {
      at += segment.text.length;
      bounds.add(at);
    }
  }
  for (const token of tokens) {
    bounds.add(Math.min(token.start, text.length));
    bounds.add(Math.min(token.end, text.length));
  }

  const stops = [...bounds].sort((x, y) => x - y);
  const pieces: Piece[] = [];
  let segmentIndex = 0;
  let segmentEnd = segments && segments.length > 0 ? segments[0].text.length : Infinity;
  let tokenIndex = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i];
    const end = stops[i + 1];
    if (end <= start) continue;

    while (segments && segmentIndex < segments.length - 1 && start >= segmentEnd) {
      segmentIndex++;
      segmentEnd += segments[segmentIndex].text.length;
    }
    while (tokenIndex < tokens.length && tokens[tokenIndex].end <= start) tokenIndex++;

    const token = tokens[tokenIndex];
    const inToken = token && token.start <= start && token.end >= end;
    const changed = !!segments && segments[segmentIndex]?.kind !== 'equal';

    pieces.push({
      text: text.slice(start, end),
      className: inToken ? TOKEN_CLASS[token.type] || '' : '',
      changed,
    });
  }

  return pieces;
}

const CHANGE_CLASS: Record<'delete' | 'insert', string> = {
  delete: 'bg-rose-500/30 rounded-[2px]',
  insert: 'bg-emerald-500/30 rounded-[2px]',
};

interface CellProps {
  text: string | null;
  segments: Segment[] | null;
  tone: 'delete' | 'insert' | null;
  language: LanguageId;
  wrap: boolean;
}

const Cell: React.FC<CellProps> = ({ text, segments, tone, language, wrap }) => {
  const pieces = useMemo(
    () => (text === null ? [] : paint(text, segments, tokenizeLine(text, language))),
    [text, segments, language]
  );

  if (text === null) return <span className="opacity-0 select-none">·</span>;
  if (pieces.length === 0) return <span className="select-text">{text || ' '}</span>;

  return (
    <span className={wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}>
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={`${piece.className} ${piece.changed && tone ? CHANGE_CLASS[tone] : ''}`}
        >
          {piece.text}
        </span>
      ))}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Row folding: only the lines near a change are worth rendering
// ---------------------------------------------------------------------------

type Entry =
  | { kind: 'row'; index: number }
  /** A run of untouched rows, collapsed behind one clickable band. */
  | { kind: 'fold'; from: number; to: number; id: number };

function foldRows(
  isEqual: (index: number) => boolean,
  total: number,
  context: number,
  opened: Set<number>
): Entry[] {
  if (!Number.isFinite(context)) {
    const all: Entry[] = [];
    for (let i = 0; i < total; i++) all.push({ kind: 'row', index: i });
    return all;
  }

  const keep = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    if (isEqual(i)) continue;
    for (let k = Math.max(0, i - context); k <= Math.min(total - 1, i + context); k++) keep[k] = 1;
  }

  const entries: Entry[] = [];
  let i = 0;
  while (i < total) {
    if (keep[i]) {
      entries.push({ kind: 'row', index: i });
      i++;
      continue;
    }
    const from = i;
    while (i < total && !keep[i]) i++;
    // A one or two line gap costs more as a band than as the lines themselves.
    if (i - from <= 2 || opened.has(from)) {
      for (let k = from; k < i; k++) entries.push({ kind: 'row', index: k });
    } else {
      entries.push({ kind: 'fold', from, to: i, id: from });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------

/** Unified rows rebuilt from the aligned rows, so inversion is free. */
function buildUnified(rows: Row[], inverted: boolean): UnifiedRow[] {
  const out: UnifiedRow[] = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    if (row.type === 'equal') {
      out.push({
        type: 'equal',
        aNum: inverted ? row.bNum : row.aNum,
        bNum: inverted ? row.aNum : row.bNum,
        text: (inverted ? row.bText ?? row.aText : row.aText ?? row.bText) ?? '',
        segs: null,
        hunk: -1,
      });
      i++;
      continue;
    }

    const start = i;
    while (i < rows.length && rows[i].type !== 'equal') i++;
    const block = rows.slice(start, i);

    const removals: UnifiedRow[] = [];
    const additions: UnifiedRow[] = [];
    for (const item of block) {
      const leftText = inverted ? item.bText : item.aText;
      const rightText = inverted ? item.aText : item.bText;
      const leftSegs = inverted ? item.bSegs : item.aSegs;
      const rightSegs = inverted ? item.aSegs : item.bSegs;
      const leftNum = inverted ? item.bNum : item.aNum;
      const rightNum = inverted ? item.aNum : item.bNum;

      if (leftText !== null) {
        removals.push({ type: 'delete', aNum: leftNum, bNum: null, text: leftText, segs: leftSegs, hunk: item.hunk });
      }
      if (rightText !== null) {
        additions.push({ type: 'insert', aNum: null, bNum: rightNum, text: rightText, segs: rightSegs, hunk: item.hunk });
      }
    }
    out.push(...removals, ...additions);
  }
  return out;
}

export const DiffView: React.FC<DiffViewProps> = ({
  diff,
  mode,
  language,
  grammarReady,
  context,
  wrap,
  fontSize,
  inverted,
  anchors,
  onToggleAnchor,
  pendingAnchor,
  scrollTo,
  labelA,
  labelB,
  t,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(560);
  const [opened, setOpened] = useState<Set<number>>(new Set());

  const rowHeight = Math.round(fontSize * 1.68);
  const rows = diff.rows;
  const unified = useMemo(() => buildUnified(rows, inverted), [rows, inverted]);
  const items: (Row | UnifiedRow)[] = mode === 'split' ? rows : unified;

  // Folds are recomputed when the mode changes, so a fold opened in one view
  // does not leave a stale index behind in the other.
  useEffect(() => setOpened(new Set()), [mode, context, inverted]);

  const entries = useMemo(
    () =>
      foldRows(
        index =>
          mode === 'split'
            ? (items[index] as Row).type === 'equal'
            : (items[index] as UnifiedRow).type === 'equal',
        items.length,
        context,
        opened
      ),
    [items, mode, context, opened]
  );

  const wrapAllowed = wrap && entries.length <= WRAP_ROW_LIMIT;
  const virtual = !wrapAllowed;

  useEffect(() => {
    const measure = () => {
      const height = scrollRef.current?.clientHeight;
      if (height && height > 0) setViewport(height);
    };
    measure();
    const id = window.setTimeout(measure, 60);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Jump to a hunk. Rows are fixed height in the virtual path, so the offset is
  // arithmetic rather than a DOM query.
  useEffect(() => {
    if (!scrollTo) return;
    const target = entries.findIndex(entry => {
      if (entry.kind !== 'row') return false;
      const row = items[entry.index] as Row | UnifiedRow;
      return row.hunk === scrollTo.hunk;
    });
    if (target < 0) return;
    scrollRef.current?.scrollTo({ top: Math.max(0, target * rowHeight - 80), behavior: 'auto' });
    setScrollTop(Math.max(0, target * rowHeight - 80));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTo?.nonce]);

  const first = virtual ? Math.max(0, Math.floor(scrollTop / rowHeight) - 6) : 0;
  const last = virtual
    ? Math.min(entries.length, Math.ceil((scrollTop + viewport) / rowHeight) + 6)
    : entries.length;
  const visible = entries.slice(first, last);

  // The columns are sized in `ch`, which on a monospace font is exactly one
  // glyph — so both halves stay identical and long lines scroll the whole pane
  // instead of each row scrolling on its own.
  const widestChars = useMemo(() => {
    let widest = 40;
    // Sampling is enough: this only decides how far the pane can scroll right.
    const step = Math.max(1, Math.floor(rows.length / 4000));
    for (let i = 0; i < rows.length; i += step) {
      const row = rows[i];
      widest = Math.max(widest, row.aText?.length ?? 0, row.bText?.length ?? 0);
    }
    return Math.min(widest, 2000);
  }, [rows]);

  const anchorSet = useMemo(
    () => new Set(anchors.map(anchor => `${anchor.a}:${anchor.b}`)),
    [anchors]
  );
  const anchoredA = useMemo(() => new Set(anchors.map(anchor => anchor.a)), [anchors]);
  const anchoredB = useMemo(() => new Set(anchors.map(anchor => anchor.b)), [anchors]);
  void anchorSet;

  const toggleFold = useCallback((id: number) => {
    setOpened(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const gutter = 52;
  const columnCh = wrapAllowed ? 0 : widestChars + 2;
  const contentStyle: React.CSSProperties = wrapAllowed
    ? { minWidth: '100%' }
    : { width: `calc(${(mode === 'split' ? 2 : 1) * columnCh}ch + ${gutter * (mode === 'split' ? 2 : 1) + 24}px)`, minWidth: '100%' };

  const monoStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    lineHeight: `${rowHeight}px`,
    tabSize: 2,
  };

  const leftLabel = inverted ? labelB : labelA;
  const rightLabel = inverted ? labelA : labelB;

  // -- one row of the split view --------------------------------------------
  const renderSplitRow = (index: number) => {
    const row = rows[index];
    const leftText = inverted ? row.bText : row.aText;
    const rightText = inverted ? row.aText : row.bText;
    const leftSegs = inverted ? row.bSegs : row.aSegs;
    const rightSegs = inverted ? row.aSegs : row.bSegs;
    const leftNum = inverted ? row.bNum : row.aNum;
    const rightNum = inverted ? row.aNum : row.bNum;

    const leftChanged = row.type !== 'equal' && leftText !== null;
    const rightChanged = row.type !== 'equal' && rightText !== null;
    const leftSide: 'a' | 'b' = inverted ? 'b' : 'a';
    const rightSide: 'a' | 'b' = inverted ? 'a' : 'b';
    const leftAnchored = leftNum !== null && (leftSide === 'a' ? anchoredA : anchoredB).has(leftNum - 1);
    const rightAnchored = rightNum !== null && (rightSide === 'a' ? anchoredA : anchoredB).has(rightNum - 1);

    const half = (
      side: 'a' | 'b',
      text: string | null,
      segments: Segment[] | null,
      num: number | null,
      changed: boolean,
      tone: 'delete' | 'insert',
      anchored: boolean
    ) => (
      <div
        className={`flex shrink-0 ${
          text === null
            ? 'bg-black/20'
            : changed
              ? tone === 'delete'
                ? 'bg-rose-500/[0.13]'
                : 'bg-emerald-500/[0.13]'
              : ''
        }`}
        style={wrapAllowed ? { width: '50%' } : { width: `calc(${columnCh}ch + ${gutter}px)` }}
      >
        <button
          type="button"
          onClick={() => num !== null && onToggleAnchor(side, num - 1)}
          disabled={num === null}
          title={t.anchor_hint || 'Click a line number on each side to force them to line up'}
          className={`w-[52px] shrink-0 text-right pr-2 select-none font-mono border-r border-white/5 tabular-nums bg-black/25 ${
            anchored
              ? 'text-cyan-300 font-black bg-cyan-500/15'
              : pendingAnchor?.side === side && pendingAnchor.line === (num ?? -2) - 1
                ? 'text-cyan-200 bg-cyan-500/25'
                : 'text-slate-600 hover:text-cyan-300 hover:bg-white/5'
          } ${num === null ? 'cursor-default' : 'cursor-pointer'}`}
          style={{ ...monoStyle, border: 'none', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          {changed ? (tone === 'delete' ? '−' : '+') : ''}
          {num ?? ''}
        </button>
        <div
          className={`flex-1 min-w-0 px-2 font-mono ${
            changed ? (tone === 'delete' ? 'text-rose-100' : 'text-emerald-100') : 'text-slate-300'
          } ${wrapAllowed ? '' : 'whitespace-pre overflow-hidden'}`}
          style={monoStyle}
        >
          <Cell text={text} segments={segments} tone={changed ? tone : null} language={language} wrap={wrapAllowed} />
        </div>
      </div>
    );

    return (
      <div key={index} className="flex" style={wrapAllowed ? undefined : { height: rowHeight }}>
        {half(leftSide, leftText, leftSegs, leftNum, leftChanged, 'delete', leftAnchored)}
        <div className="w-px shrink-0 bg-white/10" />
        {half(rightSide, rightText, rightSegs, rightNum, rightChanged, 'insert', rightAnchored)}
      </div>
    );
  };

  // -- one row of the unified view ------------------------------------------
  const renderUnifiedRow = (index: number) => {
    const row = unified[index];
    const tone = row.type === 'delete' ? 'delete' : row.type === 'insert' ? 'insert' : null;

    return (
      <div
        key={index}
        className={`flex ${
          tone === 'delete' ? 'bg-rose-500/[0.13]' : tone === 'insert' ? 'bg-emerald-500/[0.13]' : ''
        }`}
        style={wrapAllowed ? undefined : { height: rowHeight }}
      >
        <span
          className="w-[46px] shrink-0 text-right pr-2 select-none font-mono text-slate-600 bg-black/25 tabular-nums"
          style={monoStyle}
        >
          {row.aNum ?? ''}
        </span>
        <span
          className="w-[46px] shrink-0 text-right pr-2 select-none font-mono text-slate-600 bg-black/20 border-r border-white/5 tabular-nums"
          style={monoStyle}
        >
          {row.bNum ?? ''}
        </span>
        <span
          className={`w-5 shrink-0 text-center select-none font-mono ${
            tone === 'delete' ? 'text-rose-400' : tone === 'insert' ? 'text-emerald-400' : 'text-slate-700'
          }`}
          style={monoStyle}
        >
          {tone === 'delete' ? '−' : tone === 'insert' ? '+' : ' '}
        </span>
        <div
          className={`flex-1 min-w-0 pr-3 font-mono ${
            tone === 'delete' ? 'text-rose-100' : tone === 'insert' ? 'text-emerald-100' : 'text-slate-300'
          } ${wrapAllowed ? '' : 'whitespace-pre overflow-hidden'}`}
          style={monoStyle}
        >
          <Cell text={row.text} segments={row.segs} tone={tone} language={language} wrap={wrapAllowed} />
        </div>
      </div>
    );
  };

  const renderFold = (entry: Extract<Entry, { kind: 'fold' }>) => (
    <button
      key={`fold-${entry.from}`}
      type="button"
      onClick={() => toggleFold(entry.id)}
      className="w-full flex items-center gap-2 px-4 bg-cyan-500/[0.06] hover:bg-cyan-500/[0.12] border-y border-white/5 text-[11px] font-bold text-cyan-300/80 cursor-pointer"
      style={{ height: rowHeight, border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <ChevronsUpDown className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">
        {(t.fold_expand || '{0} unchanged lines').replace('{0}', String(entry.to - entry.from))}
      </span>
    </button>
  );

  // `grammarReady` is read so the rows re-paint once Prism finishes loading.
  void grammarReady;

  return (
    <div className="flex flex-col min-h-0">
      {/* Column headers */}
      <div className="flex items-stretch border-b border-white/10 bg-black/40 shrink-0">
        {mode === 'split' ? (
          <>
            <div className="flex-1 min-w-0 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate">{leftLabel}</span>
            </div>
            <div className="w-px bg-white/10" />
            <div className="flex-1 min-w-0 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{rightLabel}</span>
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-0 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">{leftLabel}</span>
            <span className="opacity-40">→</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{rightLabel}</span>
          </div>
        )}
      </div>

      {pendingAnchor && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border-b border-cyan-500/20 text-[11px] font-bold text-cyan-200 shrink-0">
          <Pin className="w-3.5 h-3.5 shrink-0" />
          <span className="min-w-0">
            {(t.anchor_pending || 'Line {0} of {1} selected — now click the line it should line up with.')
              .replace('{0}', String(pendingAnchor.line + 1))
              .replace('{1}', pendingAnchor.side === 'a' ? labelA : labelB)}
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={event => setScrollTop((event.target as HTMLDivElement).scrollTop)}
        className="overflow-auto min-h-0"
        style={{ height: 'clamp(320px, 58vh, 720px)' }}
      >
        <div style={contentStyle}>
          {virtual ? (
            <div style={{ height: entries.length * rowHeight, position: 'relative' }}>
              <div style={{ position: 'absolute', top: first * rowHeight, left: 0, right: 0 }}>
                {visible.map(entry =>
                  entry.kind === 'fold'
                    ? renderFold(entry)
                    : mode === 'split'
                      ? renderSplitRow(entry.index)
                      : renderUnifiedRow(entry.index)
                )}
              </div>
            </div>
          ) : (
            visible.map(entry =>
              entry.kind === 'fold'
                ? renderFold(entry)
                : mode === 'split'
                  ? renderSplitRow(entry.index)
                  : renderUnifiedRow(entry.index)
            )
          )}
        </div>
      </div>

      {wrap && !wrapAllowed && (
        <p className="px-4 py-2 text-[11px] text-amber-200/80 bg-amber-500/[0.06] border-t border-white/5 shrink-0">
          {(t.wrap_too_big || 'Soft wrap is off above {0} rows: variable row heights would stop the view from windowing, and this comparison would render every line at once.').replace(
            '{0}',
            String(WRAP_ROW_LIMIT)
          )}
        </p>
      )}
    </div>
  );
};

export default DiffView;
