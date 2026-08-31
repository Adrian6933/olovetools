import React from 'react';
import type { ProseDiff } from '../types';

// ============================================================================
// The prose view: one flowing text with the removals struck through and the
// additions underlined, the way an editor marks up a draft.
// ----------------------------------------------------------------------------
// A line diff is the wrong tool for prose. Reflow a paragraph and every line
// changes, so the old tool reported "everything is different" on a document
// where three words moved. Here the comparison runs over words (or characters)
// and the line boundaries stop mattering.
// ============================================================================

interface ProseViewProps {
  diff: ProseDiff;
  /** Mirrors the comparison without recomputing it. */
  inverted: boolean;
  fontSize: number;
  /** Hides everything that did not change, leaving only the edits in context. */
  onlyChanges: boolean;
  t: any;
}

export const ProseView: React.FC<ProseViewProps> = ({
  diff,
  inverted,
  fontSize,
  onlyChanges,
  t,
}) => {
  const segments = diff.segments;

  return (
    <div
      className="overflow-auto min-h-0 px-4 sm:px-6 py-5"
      style={{ height: 'clamp(320px, 58vh, 720px)' }}
    >
      <p
        className="whitespace-pre-wrap break-words font-mono text-slate-300 m-0"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
      >
        {segments.map((segment, i) => {
          // Inverting swaps which side counts as "before": the edit script of
          // B against A is the exact mirror of A against B.
          const kind =
            !inverted || segment.kind === 'equal'
              ? segment.kind
              : segment.kind === 'delete'
                ? 'insert'
                : 'delete';

          if (kind === 'equal') {
            if (onlyChanges) {
              // Keep a little context so the edits do not run into each other.
              const trimmed =
                segment.text.length > 90
                  ? `${segment.text.slice(0, 45)} […] ${segment.text.slice(-45)}`
                  : segment.text;
              return (
                <span key={i} className="text-slate-600">
                  {trimmed}
                </span>
              );
            }
            return <span key={i}>{segment.text}</span>;
          }

          return kind === 'delete' ? (
            <del
              key={i}
              className="bg-rose-500/20 text-rose-200 rounded-[3px] decoration-rose-400/70 decoration-2"
            >
              {segment.text}
            </del>
          ) : (
            <ins
              key={i}
              className="bg-emerald-500/20 text-emerald-100 rounded-[3px] no-underline decoration-emerald-400/70"
            >
              {segment.text}
            </ins>
          );
        })}
      </p>

      {segments.length === 0 && (
        <p className="text-sm text-slate-500 m-0">{t.no_diff || 'No differences detected.'}</p>
      )}
    </div>
  );
};

export default ProseView;
