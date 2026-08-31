import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { MatchHit } from '../types';

// ============================================================================
// The test text, with the matches painted behind a transparent textarea.
// ----------------------------------------------------------------------------
// Three details decide whether an overlay like this lines up or drifts:
//
//  * Only the textarea scrolls. The mirror is `overflow-hidden` and is driven
//    by assigning `scrollTop`/`scrollLeft`; give it its own scrollbar and its
//    text is a scrollbar narrower than the textarea's, so every wrapped line
//    lands one word off.
//  * The scrollbar the textarea does have eats into its content box. The
//    mirror gets that width back as right padding, measured at runtime rather
//    than assumed — it is 0 on overlay-scrollbar platforms and ~15px on
//    Windows.
//  * A trailing newline has no glyph. Without a sentinel character after the
//    text, the mirror is one line shorter than the textarea and everything
//    below the fold sits one line high.
// ============================================================================

/** Painting every span of a 250k-match run would cost more than the run. */
const MAX_PAINTED = 800;

interface TestPadProps {
  value: string;
  onChange: (value: string) => void;
  matches: MatchHit[];
  activeIndex: number | null;
  onActivate: (index: number) => void;
  placeholder: string;
  disabled?: boolean;
  label: string;
  /** Rendering is skipped while true, so a stale paint never looks current. */
  dimmed?: boolean;
}

export const TestPad: React.FC<TestPadProps> = ({
  value,
  onChange,
  matches,
  activeIndex,
  onActivate,
  placeholder,
  label,
  dimmed,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [scrollbar, setScrollbar] = useState(0);

  const sync = useCallback(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;
    mirror.scrollTop = textarea.scrollTop;
    mirror.scrollLeft = textarea.scrollLeft;
  }, []);

  // Measure the gutter the textarea's own scrollbar takes away. Layout effect
  // rather than an effect: the mirror must never paint one frame misaligned.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const gutter = textarea.offsetWidth - textarea.clientWidth - 2; // minus the 1px borders
    setScrollbar(previous => (Math.abs(previous - gutter) > 0.5 ? Math.max(0, gutter) : previous));
  }, [value, matches.length]);

  useEffect(sync, [value, matches, activeIndex, sync]);

  const painted = useMemo(() => {
    const slice = matches.slice(0, MAX_PAINTED);
    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    slice.forEach(hit => {
      // Lookahead-only patterns can report matches out of order after a
      // zero-width advance; anything that would go backwards is skipped rather
      // than allowed to duplicate text.
      if (hit.start < cursor) return;
      if (hit.start > cursor) nodes.push(value.slice(cursor, hit.start));

      const active = activeIndex === hit.index;
      const inner: React.ReactNode[] = [];

      if (active && hit.groups.length > 0) {
        // Only top-level, non-overlapping groups get their own span; nesting
        // them would need real span trees for very little extra clarity.
        const spans = hit.groups
          .filter(group => group.start >= hit.start && group.end <= hit.end && group.end > group.start)
          .sort((a, b) => a.start - b.start);

        let inside = hit.start;
        spans.forEach(group => {
          if (group.start < inside) return;
          if (group.start > inside) inner.push(value.slice(inside, group.start));
          inner.push(
            <span
              key={`g${group.number}-${group.start}`}
              className="rounded-[3px] bg-violet-500/35 ring-1 ring-violet-300/40"
            >
              {value.slice(group.start, group.end)}
            </span>
          );
          inside = group.end;
        });
        if (inside < hit.end) inner.push(value.slice(inside, hit.end));
      } else {
        inner.push(value.slice(hit.start, hit.end));
      }

      nodes.push(
        <mark
          key={`m${hit.index}-${hit.start}`}
          data-match={hit.index}
          className={`rounded-[3px] text-transparent ${
            active
              ? 'bg-fuchsia-500/45 ring-1 ring-fuchsia-300/70'
              : 'bg-fuchsia-500/20 ring-1 ring-fuchsia-400/25'
          }`}
        >
          {hit.end === hit.start ? '​' : inner}
        </mark>
      );

      cursor = Math.max(cursor, hit.end);
    });

    if (cursor < value.length) nodes.push(value.slice(cursor));
    // The sentinel that keeps a trailing newline visible to the layout.
    nodes.push('​');
    return nodes;
  }, [value, matches, activeIndex]);

  /** Clicking a highlight in the mirror selects that match in the list. */
  const handleClick = (event: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea || matches.length === 0) return;
    const caret = textarea.selectionStart;
    const hit = matches.find(item => caret >= item.start && caret <= item.end);
    if (hit) onActivate(hit.index);
    void event;
  };

  const shared = 'p-4 font-mono text-[13px] leading-6 whitespace-pre-wrap break-words';

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-2xl bg-black/50 border border-white/10 overflow-hidden focus-within:border-fuchsia-500/50 transition-colors">
      <label htmlFor="regexflow-text" className="sr-only">
        {label}
      </label>

      <div
        ref={mirrorRef}
        aria-hidden="true"
        style={{ paddingRight: `calc(1rem + ${scrollbar}px)` }}
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none text-slate-300 ${shared} ${
          dimmed ? 'opacity-40' : ''
        }`}
      >
        {value ? painted : <span className="text-slate-600">{placeholder}</span>}
      </div>

      <textarea
        id="regexflow-text"
        ref={textareaRef}
        value={value}
        onChange={event => onChange(event.target.value)}
        onScroll={sync}
        onClick={handleClick}
        spellCheck={false}
        className={`absolute inset-0 w-full h-full bg-transparent border-none outline-none resize-none overflow-auto text-transparent caret-fuchsia-400 ${shared}`}
      />
    </div>
  );
};

export default TestPad;
