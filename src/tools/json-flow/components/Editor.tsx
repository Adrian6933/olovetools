import React, { useEffect, useMemo, useRef, useState } from 'react';

// ============================================================================
// The raw editor: a textarea with a windowed gutter.
// ----------------------------------------------------------------------------
// The old gutter rendered one <div> per line, so a 40 000-line file created
// 40 000 DOM nodes that scrolled at a crawl. Here only the ~40 line numbers
// actually on screen exist at any moment, and the count of lines is the only
// thing that grows with the document.
//
// `wrap="off"` is load-bearing: a soft-wrapped textarea makes visual lines and
// logical lines disagree, and every gutter number below the wrap is then wrong.
// ============================================================================

export const LINE_HEIGHT = 22;

export interface EditorFocus {
  line: number;
  column: number;
  /** Bumped by the caller to re-trigger a jump to the same position. */
  nonce: number;
}

interface EditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** 1-based line to paint red in the gutter. */
  errorLine?: number | null;
  focus?: EditorFocus | null;
  readOnly?: boolean;
  ariaLabel?: string;
}

/** Offset of the start of a 1-based line. */
function offsetOfLine(text: string, line: number): number {
  let at = 0;
  for (let i = 1; i < line; i++) {
    const next = text.indexOf('\n', at);
    if (next === -1) return at;
    at = next + 1;
  }
  return at;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  placeholder,
  errorLine,
  focus,
  readOnly,
  ariaLabel,
}) => {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewport, setViewport] = useState(420);

  // Counting newlines beats `split('\n').length` on large documents: no array
  // of a hundred thousand strings gets allocated on every keystroke.
  const lineCount = useMemo(() => {
    let count = 1;
    for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) === 10) count++;
    return count;
  }, [value]);

  // ResizeObserver never fires in a background/hidden document, so the height
  // is read directly on mount and on window resize instead.
  useEffect(() => {
    const measure = () => {
      const height = boxRef.current?.clientHeight;
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

  useEffect(() => {
    if (!focus) return;
    const area = areaRef.current;
    if (!area) return;
    const at = offsetOfLine(value, focus.line) + Math.max(0, focus.column - 1);
    area.focus();
    area.setSelectionRange(at, at);
    area.scrollTop = Math.max(0, (focus.line - 1) * LINE_HEIGHT - area.clientHeight / 2);
    setScrollTop(area.scrollTop);
    // `value` is intentionally not a dependency: re-jumping on every keystroke
    // would fight the caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce]);

  const firstVisible = Math.max(1, Math.floor(scrollTop / LINE_HEIGHT) - 2);
  const lastVisible = Math.min(lineCount, Math.ceil((scrollTop + viewport) / LINE_HEIGHT) + 2);
  const numbers: number[] = [];
  for (let n = firstVisible; n <= lastVisible; n++) numbers.push(n);

  return (
    <div ref={boxRef} className="flex-1 flex min-h-0 overflow-hidden relative">
      <div
        aria-hidden="true"
        className="relative w-12 shrink-0 bg-[#040706] border-r border-white/5 overflow-hidden select-none"
      >
        <div style={{ transform: `translateY(${-scrollTop}px)` }} className="absolute inset-x-0 top-0">
          {numbers.map(n => (
            <div
              key={n}
              className={`absolute right-0 w-full pr-2 text-right font-mono text-[11px] ${
                n === errorLine ? 'text-rose-400 font-black bg-rose-500/10' : 'text-slate-600'
              }`}
              style={{ top: (n - 1) * LINE_HEIGHT + 12, height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex-1 min-w-0">
        {errorLine != null && errorLine >= 1 && (
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 bg-rose-500/10 border-y border-rose-500/20 pointer-events-none"
            style={{ top: (errorLine - 1) * LINE_HEIGHT + 12 - scrollTop, height: LINE_HEIGHT }}
          />
        )}
        <textarea
          ref={areaRef}
          value={value}
          readOnly={readOnly}
          aria-label={ariaLabel}
          onChange={e => onChange(e.target.value)}
          onScroll={e => {
            setScrollTop((e.target as HTMLTextAreaElement).scrollTop);
            setScrollLeft((e.target as HTMLTextAreaElement).scrollLeft);
          }}
          wrap="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={placeholder}
          className="absolute inset-0 w-full h-full bg-transparent py-3 px-3 font-mono text-[12.5px] text-slate-200 outline-none resize-none overflow-auto placeholder:text-slate-600"
          style={{ lineHeight: `${LINE_HEIGHT}px`, tabSize: 2 }}
        />
        {/* Horizontal position readout keeps long minified lines navigable. */}
        {scrollLeft > 0 && (
          <span className="absolute bottom-1 right-2 text-[10px] font-mono text-slate-600 bg-[#050807]/80 px-1.5 rounded pointer-events-none">
            +{Math.round(scrollLeft)}px
          </span>
        )}
      </div>
    </div>
  );
};
