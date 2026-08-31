import React, { useEffect, useMemo, useRef, useState } from 'react';

// ============================================================================
// The raw editor: a textarea with a windowed gutter.
// ----------------------------------------------------------------------------
// One <div> per line means a 40 000-line file creates 40 000 DOM nodes that
// scroll at a crawl, so only the ~40 numbers actually on screen exist at any
// moment. `wrap="off"` is load-bearing: a soft-wrapped textarea makes visual
// lines and logical lines disagree, and every gutter number below the first
// wrap is then wrong.
// ============================================================================

export const LINE_HEIGHT = 21;

interface EditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** 1-based line to scroll to and highlight, bumped via `nonce` to re-trigger. */
  focusLine?: { line: number; nonce: number } | null;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  focusLine,
}) => {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(420);

  // Counting newlines beats split('\n').length on large documents: no array of
  // a hundred thousand strings gets allocated on every keystroke.
  const lineCount = useMemo(() => {
    let count = 1;
    for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) === 10) count++;
    return count;
  }, [value]);

  // ResizeObserver never fires in a hidden document, so the height is read
  // directly on mount and on window resize instead.
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
    if (!focusLine) return;
    const area = areaRef.current;
    if (!area) return;
    let at = 0;
    for (let i = 1; i < focusLine.line; i++) {
      const next = value.indexOf('\n', at);
      if (next === -1) break;
      at = next + 1;
    }
    area.focus();
    area.setSelectionRange(at, at);
    area.scrollTop = Math.max(0, (focusLine.line - 1) * LINE_HEIGHT - area.clientHeight / 2);
    setScrollTop(area.scrollTop);
    // `value` is deliberately not a dependency: re-jumping on every keystroke
    // would fight the caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusLine?.nonce]);

  const first = Math.max(1, Math.floor(scrollTop / LINE_HEIGHT) - 2);
  const last = Math.min(lineCount, Math.ceil((scrollTop + viewport) / LINE_HEIGHT) + 2);
  const numbers: number[] = [];
  for (let n = first; n <= last; n++) numbers.push(n);

  return (
    <div ref={boxRef} className="flex-1 flex min-h-0 overflow-hidden relative">
      <div
        aria-hidden="true"
        className="relative w-11 shrink-0 bg-[#03080a] border-r border-white/5 overflow-hidden select-none"
      >
        <div style={{ transform: `translateY(${-scrollTop}px)` }} className="absolute inset-x-0 top-0">
          {numbers.map(n => (
            <div
              key={n}
              className="absolute right-0 w-full pr-2 text-right font-mono text-[11px] text-slate-600"
              style={{ top: (n - 1) * LINE_HEIGHT + 12, height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      <textarea
        ref={areaRef}
        value={value}
        aria-label={ariaLabel}
        onChange={e => onChange(e.target.value)}
        onScroll={e => setScrollTop((e.target as HTMLTextAreaElement).scrollTop)}
        wrap="off"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent py-3 px-3 font-mono text-[12.5px] text-slate-200 outline-none resize-none overflow-auto placeholder:text-slate-600"
        style={{ lineHeight: `${LINE_HEIGHT}px`, tabSize: 2 }}
      />
    </div>
  );
};
