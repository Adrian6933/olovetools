import React, { useMemo, useRef, useState } from 'react';

// ============================================================================
// A small JSON editor: textarea, line gutter, and the offending line marked.
// ----------------------------------------------------------------------------
// Soft wrapping is off, so a visual row is a logical line and the error bar can
// be placed with `lineHeight * (line - 1)` instead of by measuring a mirrored
// copy of the text.
// ============================================================================

const LINE_HEIGHT = 1.55;
const FONT_SIZE = 12;

interface CodeBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** 1-based; null when the content parses. */
  errorLine: number | null;
  label: string;
  accent: 'rose' | 'violet';
  rows?: number;
  readOnly?: boolean;
}

export const CodeBox: React.FC<CodeBoxProps> = ({ value, onChange, errorLine, label, accent, rows = 10, readOnly }) => {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const lines = useMemo(() => {
    let count = 1;
    for (let i = 0; i < value.length; i += 1) if (value.charCodeAt(i) === 10) count += 1;
    return count;
  }, [value]);

  const rowHeight = FONT_SIZE * LINE_HEIGHT;
  const height = rows * rowHeight + 16;
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const last = Math.min(lines, first + rows + 6);
  const border = accent === 'rose' ? 'border-rose-500/20' : 'border-violet-500/20';
  const caret = accent === 'rose' ? 'caret-rose-300' : 'caret-violet-300';

  return (
    <div className={`relative flex overflow-hidden rounded-xl border ${border} bg-black/40`} style={{ height }}>
      <div
        aria-hidden="true"
        className="w-9 shrink-0 select-none overflow-hidden border-r border-white/5 bg-black/30 text-right font-mono text-slate-600"
        style={{ fontSize: `${FONT_SIZE}px`, lineHeight: LINE_HEIGHT }}
      >
        <div style={{ paddingTop: first * rowHeight - scrollTop }}>
          {Array.from({ length: Math.max(0, last - first) }, (_, i) => {
            const number = first + i + 1;
            return (
              <div
                key={number}
                className={number === errorLine ? 'bg-rose-500/20 pr-1.5 font-bold text-rose-300' : 'pr-1.5'}
                style={{ height: rowHeight }}
              >
                {number}
              </div>
            );
          })}
        </div>
      </div>

      {errorLine !== null && (
        <div
          className="pointer-events-none absolute left-9 right-0 bg-rose-500/10"
          style={{ top: (errorLine - 1) * rowHeight + 8 - scrollTop, height: rowHeight }}
        />
      )}

      <textarea
        ref={areaRef}
        value={value}
        readOnly={readOnly}
        onChange={event => onChange(event.target.value)}
        onScroll={() => setScrollTop(areaRef.current?.scrollTop ?? 0)}
        spellCheck={false}
        wrap="off"
        aria-label={label}
        className={`relative z-10 w-full flex-1 resize-none bg-transparent px-2.5 py-2 font-mono text-slate-100 outline-none ${caret} read-only:text-slate-400`}
        style={{ fontSize: `${FONT_SIZE}px`, lineHeight: LINE_HEIGHT, tabSize: 2 }}
      />
    </div>
  );
};

/** Line number of a JSON syntax error, from the engine's own message. */
export function jsonErrorLine(text: string): number | null {
  try {
    JSON.parse(text);
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const lineCol = /line (\d+)/.exec(message);
    if (lineCol) return Number(lineCol[1]);
    const position = /at position (\d+)/.exec(message);
    if (position) {
      const upTo = text.slice(0, Number(position[1]));
      return upTo.split('\n').length;
    }
    return 1;
  }
}

export default CodeBox;
