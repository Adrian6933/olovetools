import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Issue, IssueKind } from '../types';
import type { Range } from '../lib/transforms';

// ============================================================================
// The writing surface.
// ----------------------------------------------------------------------------
// A textarea cannot colour parts of its own text, so the marks are painted by
// two mirror layers sitting behind it: one for whole sentences, one for single
// words. Both hold the same string with `color: transparent` and identical
// metrics, so a background painted at character 412 lands exactly under
// character 412 of the real text.
//
// Two details are load-bearing and easy to get wrong:
//
//  * The textarea always shows its scrollbar (`overflow-y: scroll`). If it
//    appeared only once the text got long, the wrap width would change at that
//    moment and every mark below the fold would slide sideways.
//  * The mirrors are padded by the measured scrollbar width instead of a
//    guessed number, because it is 6 px here (the page styles it) and 15 px on
//    a stock Windows build.
// ============================================================================

export interface Mark extends Range {
  kind: IssueKind | 'find' | 'findActive' | 'selectionEcho';
}

const MARK_CLASS: Record<Mark['kind'], string> = {
  veryLongSentence: 'bg-amber-500/25 rounded-[3px] shadow-[inset_0_-2px_0_rgba(245,158,11,0.55)]',
  longSentence: 'bg-amber-400/10 rounded-[3px]',
  passive: 'bg-violet-500/25 rounded-[3px]',
  adverb: 'bg-sky-500/25 rounded-[3px]',
  filler: 'bg-rose-500/20 rounded-[3px]',
  complexWord: 'bg-fuchsia-500/25 rounded-[3px] shadow-[inset_0_-2px_0_rgba(217,70,239,0.6)]',
  repeatedWord: 'bg-orange-500/20 rounded-[3px]',
  whitespace: 'bg-red-500/30 rounded-[2px]',
  find: 'bg-teal-500/35 rounded-[3px]',
  findActive: 'bg-teal-300/70 rounded-[3px]',
  selectionEcho: 'bg-white/10 rounded-[3px]',
};

/** Sentence marks live on their own layer so a word mark inside one does not
 *  have to win a fight with it. */
const SENTENCE_KINDS = new Set<Mark['kind']>(['veryLongSentence', 'longSentence']);

export const ISSUE_TONE: Record<IssueKind, string> = {
  veryLongSentence: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  longSentence: 'text-amber-200/80 bg-amber-400/5 border-amber-400/20',
  passive: 'text-violet-300 bg-violet-500/10 border-violet-500/30',
  adverb: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
  filler: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
  complexWord: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30',
  repeatedWord: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  whitespace: 'text-red-300 bg-red-500/10 border-red-500/30',
};

/** Drops overlaps inside one layer, keeping whichever range started first. */
function flatten(marks: Mark[]): Mark[] {
  const sorted = [...marks].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Mark[] = [];
  let reach = -1;
  for (const mark of sorted) {
    if (mark.end <= mark.start) continue;
    if (mark.start < reach) continue;
    out.push(mark);
    reach = mark.end;
  }
  return out;
}

interface LayerProps {
  text: string;
  marks: Mark[];
  style: React.CSSProperties;
  className: string;
  innerRef: React.RefObject<HTMLDivElement | null>;
}

const HighlightLayer: React.FC<LayerProps> = ({ text, marks, style, className, innerRef }) => {
  const nodes = useMemo(() => {
    if (marks.length === 0) return [text];
    const out: React.ReactNode[] = [];
    let cursor = 0;
    marks.forEach((mark, index) => {
      if (mark.start > cursor) out.push(text.slice(cursor, mark.start));
      out.push(
        <span key={index} className={MARK_CLASS[mark.kind]}>
          {text.slice(mark.start, mark.end)}
        </span>
      );
      cursor = mark.end;
    });
    if (cursor < text.length) out.push(text.slice(cursor));
    return out;
  }, [text, marks]);

  return (
    <div ref={innerRef} aria-hidden="true" className={className} style={style}>
      {nodes}
      {/* A trailing newline is not rendered by the browser; without this the
          last line of the mirror sits one row above the real one. */}
      {'\n'}
    </div>
  );
};

export interface EditorHandle {
  focus: () => void;
  select: (range: Range) => void;
}

interface EditorProps {
  value: string;
  onChange: (next: string) => void;
  onSelectionChange: (range: Range) => void;
  placeholder: string;
  ariaLabel: string;
  fontSize: number;
  issues: Issue[];
  findMarks: Mark[];
  highlightEnabled: boolean;
  /** Shown instead of `value` while the "before" button is held down. */
  ghost: string | null;
  areaRef: React.RefObject<HTMLTextAreaElement | null>;
  onDropFiles: (files: FileList) => void;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  onSelectionChange,
  placeholder,
  ariaLabel,
  fontSize,
  issues,
  findMarks,
  highlightEnabled,
  ghost,
  areaRef,
  onDropFiles,
}) => {
  const sentenceLayer = useRef<HTMLDivElement | null>(null);
  const wordLayer = useRef<HTMLDivElement | null>(null);
  const [scrollbar, setScrollbar] = useState(6);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const shown = ghost ?? value;

  // ResizeObserver never fires while the document is hidden, so the width is
  // read directly on mount and on window resize instead.
  useLayoutEffect(() => {
    const measure = () => {
      const area = areaRef.current;
      if (!area) return;
      const width = area.offsetWidth - area.clientWidth;
      if (width >= 0 && width < 40) setScrollbar(width);
    };
    measure();
    const timer = window.setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [areaRef, fontSize]);

  const syncScroll = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    for (const layer of [sentenceLayer.current, wordLayer.current]) {
      if (!layer) continue;
      layer.scrollTop = area.scrollTop;
      layer.scrollLeft = area.scrollLeft;
    }
  }, [areaRef]);

  useEffect(() => {
    syncScroll();
  }, [shown, syncScroll]);

  const report = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    onSelectionChange({ start: area.selectionStart, end: area.selectionEnd });
  }, [areaRef, onSelectionChange]);

  // React derives `onSelect` from keyup and mouseup, so a selection made any
  // other way (Ctrl+A from a menu, a drag that ends outside the box, an IME)
  // can leave the stored range stale — and a stale range sends a tool at the
  // whole document instead of the paragraph the user highlighted.
  // `selectionchange` is the API that always fires.
  useEffect(() => {
    const onSelectionChanged = () => {
      const area = areaRef.current;
      if (!area || document.activeElement !== area) return;
      report();
    };
    document.addEventListener('selectionchange', onSelectionChanged);
    return () => document.removeEventListener('selectionchange', onSelectionChanged);
  }, [areaRef, report]);

  const { sentenceMarks, wordMarks } = useMemo(() => {
    if (!highlightEnabled || ghost !== null) return { sentenceMarks: [] as Mark[], wordMarks: [] as Mark[] };
    const sentences: Mark[] = [];
    const words: Mark[] = [];
    for (const issue of issues) {
      const mark: Mark = { start: issue.start, end: issue.end, kind: issue.kind };
      if (SENTENCE_KINDS.has(mark.kind)) sentences.push(mark);
      else words.push(mark);
    }
    // A find hit must beat whatever prose mark shares its characters.
    return { sentenceMarks: flatten(sentences), wordMarks: flatten([...findMarks, ...words]) };
  }, [issues, findMarks, highlightEnabled, ghost]);

  // Identical to the byte on both mirrors and the textarea. Any drift here and
  // the marks stop lining up.
  const metrics: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    lineHeight: 1.75,
    fontFamily: 'ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    letterSpacing: '0',
    tabSize: 4,
    padding: '20px',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    margin: 0,
    border: 0,
  };

  // The textarea loses `scrollbar` pixels of content width to its own
  // scrollbar; the mirrors have none, so they must give the same pixels back as
  // padding. Applying it to both — the obvious mistake — makes the mirror wrap
  // one word later than the real text, and every mark below the first wrapped
  // line slides out of place.
  const layerMetrics: React.CSSProperties = {
    ...metrics,
    padding: `20px ${20 + scrollbar}px 20px 20px`,
  };

  const layerClass =
    'absolute inset-0 overflow-hidden pointer-events-none select-none text-transparent';

  return (
    <div
      className={`relative h-full w-full rounded-2xl overflow-hidden transition-colors ${
        dragging ? 'ring-2 ring-teal-400/60 bg-teal-500/5' : ''
      }`}
      onDragEnter={event => {
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={event => event.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={event => {
        dragDepth.current = 0;
        setDragging(false);
        if (event.dataTransfer?.files?.length) {
          event.preventDefault();
          onDropFiles(event.dataTransfer.files);
        }
      }}
    >
      <HighlightLayer
        text={shown}
        marks={sentenceMarks}
        style={layerMetrics}
        className={layerClass}
        innerRef={sentenceLayer}
      />
      <HighlightLayer
        text={shown}
        marks={wordMarks}
        style={layerMetrics}
        className={layerClass}
        innerRef={wordLayer}
      />

      <textarea
        ref={areaRef}
        value={shown}
        readOnly={ghost !== null}
        onChange={event => onChange(event.target.value)}
        onScroll={syncScroll}
        onSelect={report}
        onKeyUp={report}
        onClick={report}
        onFocus={report}
        placeholder={placeholder}
        aria-label={ariaLabel}
        spellCheck
        className="relative z-10 w-full h-full bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-600 caret-teal-300 selection:bg-teal-500/30"
        style={{ ...metrics, overflowY: 'scroll', height: '100%' }}
      />
    </div>
  );
};

export default Editor;
