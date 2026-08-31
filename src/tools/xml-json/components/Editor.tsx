import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ParseIssue } from '../types';

// ============================================================================
// The source editor.
// ----------------------------------------------------------------------------
// A textarea with a line gutter and an error underlay, not a mirrored
// syntax-highlight layer: soft wrapping is turned off (`wrap="off"`), so every
// visual row is exactly one logical line and a marker can be placed with
// `lineHeight * (line - 1)` instead of by measuring a duplicate copy of the
// text. That keeps the cost of a marker independent of document size.
// ============================================================================

const LINE_HEIGHT = 1.55;

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  issues: ParseIssue[];
  fontSize: number;
  /** Line to reveal and put the caret on; changes trigger the jump. */
  gotoLine: { line: number; col: number; nonce: number } | null;
  onDropFiles: (files: FileList) => void;
  label: string;
  disabled?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  placeholder,
  issues,
  fontSize,
  gotoLine,
  onDropFiles,
  label,
  disabled,
  onUndo,
  onRedo,
}) => {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [dragging, setDragging] = useState(false);

  const lineCount = useMemo(() => {
    let count = 1;
    for (let i = 0; i < value.length; i += 1) {
      if (value.charCodeAt(i) === 10) count += 1;
    }
    return count;
  }, [value]);

  // Only the lines actually on screen get a number rendered. A 200k-line
  // document would otherwise mount 200k spans for a 40-row viewport.
  const rowHeight = fontSize * LINE_HEIGHT;
  const [viewportRows, setViewportRows] = useState(40);
  const firstVisible = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const lastVisible = Math.min(lineCount, firstVisible + viewportRows + 4);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const update = () => setViewportRows(Math.ceil(area.clientHeight / rowHeight));
    update();
    // ResizeObserver never fires while the tab is hidden, so the initial
    // synchronous read above is what actually sets this most of the time.
    const observer = new ResizeObserver(update);
    observer.observe(area);
    return () => observer.disconnect();
  }, [rowHeight]);

  const errorLines = useMemo(() => {
    const map = new Map<number, 'error' | 'warning'>();
    for (const issue of issues) {
      const existing = map.get(issue.pos.line);
      if (existing === 'error') continue;
      map.set(issue.pos.line, issue.level);
    }
    return map;
  }, [issues]);

  useEffect(() => {
    if (!gotoLine || !areaRef.current) return;
    const area = areaRef.current;
    // Offset of the start of the target line, then the column within it.
    let offset = 0;
    let line = 1;
    while (line < gotoLine.line && offset < value.length) {
      const next = value.indexOf('\n', offset);
      if (next === -1) break;
      offset = next + 1;
      line += 1;
    }
    const caret = Math.min(value.length, offset + Math.max(0, gotoLine.col - 1));
    area.focus();
    area.setSelectionRange(caret, caret);
    area.scrollTop = Math.max(0, (gotoLine.line - 4) * rowHeight);
    setScrollTop(area.scrollTop);
  }, [gotoLine, value, rowHeight]);

  const handleScroll = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    setScrollTop(area.scrollTop);
    if (gutterRef.current) gutterRef.current.scrollTop = area.scrollTop;
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // The browser's own undo stack does not know about the buttons, the
    // samples or the formatter, so it has to be taken over completely.
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) onRedo?.();
      else onUndo?.();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      onRedo?.();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const area = event.currentTarget;
      const { selectionStart, selectionEnd } = area;
      onChange(`${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`);
      requestAnimationFrame(() => area.setSelectionRange(selectionStart + 2, selectionStart + 2));
    }
  };

  return (
    <div
      className={`relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border bg-[#01100d] transition-colors ${
        dragging ? 'border-teal-400/60 ring-2 ring-teal-500/20' : 'border-white/5'
      }`}
      onDragOver={event => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files?.length) onDropFiles(event.dataTransfer.files);
      }}
    >
      {/* Gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="relative w-12 shrink-0 select-none overflow-hidden border-r border-white/5 bg-black/30 text-right font-mono text-slate-600"
        style={{ fontSize: `${fontSize}px`, lineHeight: LINE_HEIGHT }}
      >
        <div style={{ height: lineCount * rowHeight, paddingTop: firstVisible * rowHeight }}>
          {Array.from({ length: Math.max(0, lastVisible - firstVisible) }, (_, i) => {
            const number = firstVisible + i + 1;
            const level = errorLines.get(number);
            return (
              <div
                key={number}
                className={
                  level === 'error'
                    ? 'bg-red-500/15 pr-2 font-bold text-red-400'
                    : level === 'warning'
                      ? 'bg-amber-500/10 pr-2 font-bold text-amber-400'
                      : 'pr-2'
                }
                style={{ height: rowHeight }}
              >
                {number}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error underlay, positioned arithmetically rather than measured */}
      <div className="pointer-events-none absolute inset-y-0 left-12 right-0 overflow-hidden">
        {Array.from(errorLines.entries())
          .filter(([line]) => line >= firstVisible && line <= lastVisible + 4)
          .map(([line, level]) => (
            <div
              key={line}
              className={level === 'error' ? 'absolute left-0 right-0 bg-red-500/10' : 'absolute left-0 right-0 bg-amber-500/[0.07]'}
              style={{ top: (line - 1) * rowHeight - scrollTop, height: rowHeight }}
            />
          ))}
      </div>

      <textarea
        ref={areaRef}
        value={value}
        onChange={event => onChange(event.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        wrap="off"
        disabled={disabled}
        aria-label={label}
        placeholder={placeholder}
        className="relative z-10 min-h-0 w-full flex-1 resize-none bg-transparent px-3 py-0 font-mono text-white caret-teal-400 outline-none placeholder:text-slate-700 disabled:opacity-50"
        style={{ fontSize: `${fontSize}px`, lineHeight: LINE_HEIGHT, tabSize: 2 }}
      />
    </div>
  );
};

export default Editor;
