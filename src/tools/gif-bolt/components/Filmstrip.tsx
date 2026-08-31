import React, { useEffect, useMemo, useRef } from 'react';
import type { Frame } from '../types';

interface FilmstripProps {
  frames: Frame[];
  index: number;
  selected: Set<string>;
  onIndexChange: (index: number) => void;
  onSelectionChange: (next: Set<string>) => void;
  /** ms this frame is held for, so an overridden one can be labelled. */
  delayFor: (frame: Frame) => number;
  t: any;
}

const THUMB_WIDTH = 76;
const GAP = 6;

/**
 * The editable timeline.
 *
 * Selection is a paint gesture rather than a checkbox per frame: press and drag
 * across the run you want gone. Holding Alt — or dragging with the right button
 * — inverts the same gesture into "put these back", which is how the drawing
 * tools in the suite behave and saves a mode switch.
 */
export const Filmstrip: React.FC<FilmstripProps> = ({
  frames,
  index,
  selected,
  onIndexChange,
  onSelectionChange,
  delayFor,
  t,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const paintRef = useRef<'add' | 'remove' | null>(null);
  // Mutated during a drag and handed to React as a fresh Set on each change,
  // so the paint stays smooth without a re-render per pointer move.
  const draftRef = useRef<Set<string>>(selected);
  draftRef.current = selected;

  useEffect(() => {
    const stop = () => {
      paintRef.current = null;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  // Follow the playhead without dragging the page around with it.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const left = index * (THUMB_WIDTH + GAP);
    const right = left + THUMB_WIDTH;
    if (left < scroller.scrollLeft || right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollTo({ left: Math.max(0, left - scroller.clientWidth / 2), behavior: 'smooth' });
    }
  }, [index]);

  const paint = (id: string, mode: 'add' | 'remove') => {
    const next = new Set(draftRef.current);
    if (mode === 'add') next.add(id);
    else next.delete(id);
    if (next.size === draftRef.current.size) return;
    draftRef.current = next;
    onSelectionChange(next);
  };

  /**
   * Hit-tests the pointer instead of relying on `onPointerEnter` firing as the
   * cursor crosses each thumbnail. Enter/leave is unreliable mid-drag — a touch
   * pointer is implicitly captured by the element it started on, so the
   * siblings never hear about it — and this works the same for both.
   */
  const onPointerMove = (event: React.PointerEvent) => {
    const mode = paintRef.current;
    if (!mode) return;
    const under = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    const id = under?.closest<HTMLElement>('[data-frame-id]')?.dataset.frameId;
    if (id) paint(id, mode);
  };

  const globalDelay = useMemo(() => (frames.length ? delayFor(frames[0]) : 0), [frames, delayFor]);

  return (
    <div className="space-y-2">
      <div
        ref={scrollerRef}
        onContextMenu={event => event.preventDefault()}
        onPointerMove={onPointerMove}
        className="flex gap-1.5 overflow-x-auto pb-2 pt-1 px-1 -mx-1 select-none [touch-action:pan-x]"
        style={{ scrollbarWidth: 'thin' }}
      >
        {frames.map((frame, i) => {
          const isSelected = selected.has(frame.id);
          const isCurrent = i === index;
          const delay = delayFor(frame);
          return (
            <div
              key={frame.id}
              data-frame-id={frame.id}
              onPointerDown={event => {
                const mode: 'add' | 'remove' = event.altKey || event.button === 2 ? 'remove' : 'add';
                paintRef.current = mode;
                onIndexChange(i);
                paint(frame.id, mode);
              }}
              className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                isSelected
                  ? 'border-fuchsia-400'
                  : isCurrent
                  ? 'border-white/60'
                  : 'border-white/10 hover:border-white/30'
              }`}
              style={{ width: THUMB_WIDTH }}
              title={frame.label}
            >
              <Thumb frame={frame} />
              <span className="absolute top-0.5 left-0.5 px-1 rounded bg-black/70 text-[9px] font-black text-slate-300 tabular-nums">
                {i + 1}
              </span>
              {frame.delayMs !== null && frame.delayMs !== globalDelay && (
                <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-fuchsia-500 text-[9px] font-black text-black tabular-nums">
                  {delay}
                </span>
              )}
              {isSelected && <span className="absolute inset-0 bg-fuchsia-500/25 pointer-events-none" />}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-600 font-medium">
        {t.stripHint || 'Drag across the strip to select frames. Hold Alt or use the right button to deselect.'}
      </p>
    </div>
  );
};

/** Drawn once per bitmap; the frame list is reordered by identity, never redrawn. */
const Thumb = React.memo(
  ({ frame }: { frame: Frame }) => {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = ref.current;
      if (!canvas) return;
      const height = Math.max(1, Math.round((THUMB_WIDTH * frame.bitmap.height) / frame.bitmap.width));
      canvas.width = THUMB_WIDTH;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.imageSmoothingQuality = 'high';
      context.drawImage(frame.bitmap, 0, 0, THUMB_WIDTH, height);
    }, [frame.bitmap]);

    return <canvas ref={ref} className="block w-full h-auto bg-black/40" />;
  },
  (a, b) => a.frame.bitmap === b.frame.bitmap
);
Thumb.displayName = 'Thumb';

export default Filmstrip;
