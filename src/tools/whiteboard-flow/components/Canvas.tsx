import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COLOR_INK, COLUMNS, GRID, LANE_X, type BoardDoc, type BoardNode, type ColumnId, type Command } from '../types';
import { createId, laneAt, snap } from '../lib/board';

interface CanvasProps {
  doc: BoardDoc;
  selection: string[];
  editingId: string | null;
  /** True while the user holds H: chrome hidden, board shown as it exports. */
  cleanView: boolean;
  /** Node id whose connector is being dragged, if any. */
  linkFrom: string | null;
  /** Object URLs for image nodes. Owned by the parent, which also revokes them. */
  imageUrls: Record<string, string>;
  t: any;
  onSelect: (ids: string[]) => void;
  onEdit: (id: string | null) => void;
  onCommit: (cmd: Command) => void;
  onViewport: (v: BoardDoc['viewport']) => void;
  onMenu: (e: { x: number; y: number; id: string }) => void;
  onLinkFrom: (id: string | null) => void;
  columnLabel: (c: ColumnId) => string;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;

type Drag =
  | { mode: 'none' }
  | { mode: 'pan'; px: number; py: number; ox: number; oy: number }
  | { mode: 'move'; px: number; py: number; ids: string[]; dx: number; dy: number; moved: boolean }
  | { mode: 'marquee'; x0: number; y0: number; x1: number; y1: number }
  | { mode: 'link'; from: string; x: number; y: number };

export const Canvas: React.FC<CanvasProps> = ({
  doc,
  selection,
  editingId,
  cleanView,
  linkFrom,
  imageUrls,
  t,
  onSelect,
  onEdit,
  onCommit,
  onViewport,
  onMenu,
  onLinkFrom,
  columnLabel,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<Drag>({ mode: 'none' });
  const [, force] = useState(0);
  const rerender = () => force(n => n + 1);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [draft, setDraft] = useState('');
  const pinchRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null);

  const vp = doc.viewport;

  /** Screen point -> board coordinates. */
  const toBoard = useCallback(
    (clientX: number, clientY: number) => {
      const rect = hostRef.current?.getBoundingClientRect();
      const left = rect ? rect.left : 0;
      const top = rect ? rect.top : 0;
      return { x: (clientX - left - vp.x) / vp.scale, y: (clientY - top - vp.y) / vp.scale };
    },
    [vp.x, vp.y, vp.scale]
  );

  // --- zoom -----------------------------------------------------------------
  // React's onWheel is registered passive, so preventDefault there is a no-op
  // and the page would zoom underneath us. The listener has to be native.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onWheel = (e: WheelEvent) => {
      // Plain wheel is left alone on purpose: the board lives inside a long
      // page and swallowing scroll there is hostile. Ctrl/meta+wheel is what
      // a trackpad pinch sends, so pinch-to-zoom still works.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = host.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, vp.scale * factor));
      if (next === vp.scale) return;
      // Keep the board point under the cursor pinned to the cursor.
      onViewport({
        scale: next,
        x: mx - ((mx - vp.x) / vp.scale) * next,
        y: my - ((my - vp.y) / vp.scale) * next,
      });
    };
    host.addEventListener('wheel', onWheel, { passive: false });
    return () => host.removeEventListener('wheel', onWheel);
  }, [vp.x, vp.y, vp.scale, onViewport]);

  // --- space to pan ---------------------------------------------------------
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const el = document.activeElement;
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) return;
      if (!hostRef.current?.matches(':hover')) return;
      e.preventDefault();
      setSpaceHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // --- pointer --------------------------------------------------------------

  const endDrag = useCallback(() => {
    const d = dragRef.current;
    if (d.mode === 'move' && d.moved && (d.dx !== 0 || d.dy !== 0)) {
      onCommit({ t: 'move', ids: d.ids, dx: d.dx, dy: d.dy });
      // In kanban layout a note that lands over another lane belongs to it.
      if (doc.layout === 'kanban') {
        d.ids.forEach(id => {
          const n = doc.nodes.find(node => node.id === id);
          if (!n) return;
          const lane = laneAt(n.x + d.dx);
          if (lane !== n.column) onCommit({ t: 'set', id, before: { column: n.column }, after: { column: lane } });
        });
      }
    }
    if (d.mode === 'marquee') {
      const x0 = Math.min(d.x0, d.x1);
      const x1 = Math.max(d.x0, d.x1);
      const y0 = Math.min(d.y0, d.y1);
      const y1 = Math.max(d.y0, d.y1);
      const hit = doc.nodes.filter(n => n.x < x1 && n.x + n.w > x0 && n.y < y1 && n.y + n.h > y0).map(n => n.id);
      onSelect(hit);
    }
    dragRef.current = { mode: 'none' };
    rerender();
  }, [doc.layout, doc.nodes, onCommit, onSelect]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (d.mode === 'none') return;
      if (d.mode === 'pan') {
        onViewport({ scale: vp.scale, x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) });
        return;
      }
      if (d.mode === 'move') {
        d.dx = snap((e.clientX - d.px) / vp.scale);
        d.dy = snap((e.clientY - d.py) / vp.scale);
        if (Math.abs(d.dx) > 0 || Math.abs(d.dy) > 0) d.moved = true;
        rerender();
        return;
      }
      if (d.mode === 'marquee') {
        const p = toBoard(e.clientX, e.clientY);
        d.x1 = p.x;
        d.y1 = p.y;
        rerender();
        return;
      }
      if (d.mode === 'link') {
        const p = toBoard(e.clientX, e.clientY);
        d.x = p.x;
        d.y = p.y;
        rerender();
      }
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      if (d.mode === 'link') {
        const p = toBoard(e.clientX, e.clientY);
        const target = [...doc.nodes]
          .sort((a, b) => b.z - a.z)
          .find(n => p.x >= n.x && p.x <= n.x + n.w && p.y >= n.y && p.y <= n.y + n.h);
        if (target && target.id !== d.from) {
          const exists = doc.edges.some(
            edge =>
              (edge.from === d.from && edge.to === target.id) || (edge.from === target.id && edge.to === d.from)
          );
          if (!exists) {
            onCommit({ t: 'add', nodes: [], edges: [{ id: createId('e'), from: d.from, to: target.id }] });
          }
        }
        dragRef.current = { mode: 'none' };
        onLinkFrom(null);
        rerender();
        return;
      }
      endDrag();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [doc.nodes, doc.edges, endDrag, onCommit, onLinkFrom, onViewport, toBoard, vp.scale]);

  const onHostPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.surface) return;
    // Two fingers: start a pinch instead of a pan.
    if (pinchRef.current.size >= 1 && e.pointerType === 'touch') return;
    const panning = spaceHeld || e.button === 1 || e.button === 0;
    onEdit(null);
    if (panning && (spaceHeld || e.button === 1)) {
      dragRef.current = { mode: 'pan', px: e.clientX, py: e.clientY, ox: vp.x, oy: vp.y };
    } else {
      const p = toBoard(e.clientX, e.clientY);
      dragRef.current = { mode: 'marquee', x0: p.x, y0: p.y, x1: p.x, y1: p.y };
      if (!e.shiftKey) onSelect([]);
    }
    rerender();
  };

  const onNotePointerDown = (e: React.PointerEvent, node: BoardNode) => {
    if (editingId === node.id) return;
    e.stopPropagation();
    if (e.button === 2) return;
    let ids = selection.includes(node.id) ? selection : [node.id];
    if (e.shiftKey) {
      ids = selection.includes(node.id) ? selection.filter(i => i !== node.id) : selection.concat(node.id);
      onSelect(ids);
      return;
    }
    // Alt inverts the gesture: drag a copy instead of the note itself.
    if (e.altKey) {
      const clones = doc.nodes
        .filter(n => ids.includes(n.id))
        .map(n => ({ ...n, id: createId(), z: n.z + 1 }));
      onCommit({ t: 'add', nodes: clones });
      ids = clones.map(c => c.id);
    }
    onSelect(ids);
    onEdit(null);
    dragRef.current = { mode: 'move', px: e.clientX, py: e.clientY, ids, dx: 0, dy: 0, moved: false };
    rerender();
  };

  // --- pinch zoom (touch) ---------------------------------------------------
  const trackPinch = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    pinchRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchRef.current.size === 2) {
      const [a, b] = [...pinchRef.current.values()];
      pinchStart.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: vp.scale,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
      dragRef.current = { mode: 'none' };
    }
  };
  const movePinch = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || !pinchRef.current.has(e.pointerId)) return;
    pinchRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchRef.current.size !== 2 || !pinchStart.current) return;
    const [a, b] = [...pinchRef.current.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const start = pinchStart.current;
    if (start.dist < 8) return;
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (start.scale * dist) / start.dist));
    const rect = hostRef.current?.getBoundingClientRect();
    const mx = start.cx - (rect ? rect.left : 0);
    const my = start.cy - (rect ? rect.top : 0);
    onViewport({ scale: next, x: mx - ((mx - vp.x) / vp.scale) * next, y: my - ((my - vp.y) / vp.scale) * next });
  };
  const dropPinch = (e: React.PointerEvent) => {
    pinchRef.current.delete(e.pointerId);
    if (pinchRef.current.size < 2) pinchStart.current = null;
  };

  // --- editing --------------------------------------------------------------

  const editing = doc.nodes.find(n => n.id === editingId);

  useLayoutEffect(() => {
    if (editing) setDraft(editing.text);
    // Only when the edited node changes: re-syncing on every keystroke would
    // fight the textarea.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const commitDraft = useCallback(() => {
    if (!editing) return;
    if (draft !== editing.text) {
      onCommit({ t: 'set', id: editing.id, before: { text: editing.text }, after: { text: draft } });
    }
    onEdit(null);
  }, [draft, editing, onCommit, onEdit]);

  const drag = dragRef.current;
  const moveIds = drag.mode === 'move' ? new Set(drag.ids) : null;
  const offset = (n: BoardNode) =>
    moveIds && moveIds.has(n.id) && drag.mode === 'move' ? { x: n.x + drag.dx, y: n.y + drag.dy } : { x: n.x, y: n.y };

  const byId = new Map(doc.nodes.map(n => [n.id, n]));
  const gridSize = GRID * 2 * vp.scale;

  return (
    <div
      ref={hostRef}
      data-surface="1"
      onPointerDown={e => {
        trackPinch(e);
        onHostPointerDown(e);
      }}
      onPointerMove={movePinch}
      onPointerUp={dropPinch}
      onPointerCancel={dropPinch}
      onContextMenu={e => e.preventDefault()}
      className="relative w-full h-[62vh] min-h-[380px] max-h-[780px] overflow-hidden rounded-2xl border border-white/10 bg-[#050f14] touch-none select-none"
      style={{
        cursor: spaceHeld ? 'grab' : drag.mode === 'pan' ? 'grabbing' : 'default',
        backgroundImage: cleanView
          ? undefined
          : 'radial-gradient(circle, rgba(103,232,249,0.16) 1px, transparent 1px)',
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${vp.x}px ${vp.y}px`,
      }}
    >
      {/* Lane guides: only meaningful while the board is in kanban layout. */}
      {doc.layout === 'kanban' && !cleanView && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.scale})`, transformOrigin: '0 0' }}
        >
          {COLUMNS.map(col => (
            <div
              key={col}
              className="absolute top-[-56px] w-[208px] text-[13px] font-black uppercase tracking-widest text-cyan-300/50"
              style={{ left: LANE_X[col] }}
            >
              {columnLabel(col)}
              <div className="mt-2 h-px w-full bg-cyan-400/15" />
            </div>
          ))}
        </div>
      )}

      {/* pointer-events-none on the layer, auto on each note: the layer covers
          the whole host, so without this it swallows every click on empty
          canvas and panning/marquee never start. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.scale})`, transformOrigin: '0 0' }}
      >
        {/* Connectors sit behind every note. */}
        <svg className="absolute overflow-visible pointer-events-none" width="1" height="1">
          {doc.edges.map(e => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            const pa = offset(a);
            const pb = offset(b);
            const x1 = pa.x + a.w / 2;
            const y1 = pa.y + a.h / 2;
            const x2 = pb.x + b.w / 2;
            const y2 = pb.y + b.h / 2;
            const mx = (x1 + x2) / 2;
            return (
              <path
                key={e.id}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="rgba(103,232,249,0.55)"
                strokeWidth={2}
              />
            );
          })}
          {drag.mode === 'link' &&
            (() => {
              const a = byId.get(drag.from);
              if (!a) return null;
              return (
                <line
                  x1={a.x + a.w / 2}
                  y1={a.y + a.h / 2}
                  x2={drag.x}
                  y2={drag.y}
                  stroke="rgba(103,232,249,0.8)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              );
            })()}
        </svg>

        {[...doc.nodes]
          .sort((a, b) => a.z - b.z)
          .map(n => {
            const p = offset(n);
            const c = COLOR_INK[n.color] || COLOR_INK.yellow;
            const isSel = selection.includes(n.id);
            const isEditing = editingId === n.id;
            return (
              <div
                key={n.id}
                data-node={n.id}
                onPointerDown={e => onNotePointerDown(e, n)}
                onDoubleClick={e => {
                  e.stopPropagation();
                  if (n.kind === 'note') onEdit(n.id);
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect([n.id]);
                  onMenu({ x: e.clientX, y: e.clientY, id: n.id });
                }}
                className={`absolute rounded-[10px] shadow-lg shadow-black/40 pointer-events-auto ${
                  isSel && !cleanView ? 'ring-2 ring-cyan-400' : ''
                } ${isEditing ? '' : 'cursor-grab active:cursor-grabbing'}`}
                style={{
                  left: p.x,
                  top: p.y,
                  width: n.w,
                  height: n.h,
                  zIndex: n.z,
                  background: n.kind === 'image' ? 'transparent' : c.fill,
                  border: n.kind === 'image' ? '1px solid rgba(255,255,255,0.15)' : `1px solid ${c.edge}`,
                  color: c.ink,
                  overflow: 'hidden',
                }}
              >
                {n.kind === 'image' ? (
                  <img
                    src={imageUrls[n.id]}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : isEditing ? (
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={commitDraft}
                    onPointerDown={e => e.stopPropagation()}
                    onFocus={e => {
                      const el = e.currentTarget;
                      el.setSelectionRange(el.value.length, el.value.length);
                    }}
                    onKeyDown={e => {
                      e.stopPropagation();
                      if (e.key === 'Escape') {
                        setDraft(n.text);
                        onEdit(null);
                      }
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commitDraft();
                    }}
                    className="w-full h-full resize-none bg-transparent p-3 text-[14px] font-medium leading-[20px] outline-none"
                    placeholder={t.notePlaceholder || 'Write your note...'}
                    style={{ color: c.ink }}
                  />
                ) : (
                  <p className="w-full h-full p-3 text-[14px] font-medium leading-[20px] whitespace-pre-wrap break-words overflow-hidden">
                    {n.text || <span className="opacity-40 italic">{t.notePlaceholder || 'Double-click to write'}</span>}
                  </p>
                )}

                {/* Connector handle: only on the selected note, and never in the
                    clean view (which is a preview of the exported board). */}
                {isSel && !cleanView && !isEditing && n.kind === 'note' && (
                  <button
                    aria-label={t.linkNote || 'Connect to another note'}
                    onPointerDown={e => {
                      e.stopPropagation();
                      const p2 = toBoard(e.clientX, e.clientY);
                      dragRef.current = { mode: 'link', from: n.id, x: p2.x, y: p2.y };
                      onLinkFrom(n.id);
                      rerender();
                    }}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-[#050f14] cursor-crosshair"
                  />
                )}
              </div>
            );
          })}
      </div>

      {drag.mode === 'marquee' && (
        <div
          className="absolute border border-cyan-400/70 bg-cyan-400/10 pointer-events-none"
          style={{
            left: Math.min(drag.x0, drag.x1) * vp.scale + vp.x,
            top: Math.min(drag.y0, drag.y1) * vp.scale + vp.y,
            width: Math.abs(drag.x1 - drag.x0) * vp.scale,
            height: Math.abs(drag.y1 - drag.y0) * vp.scale,
          }}
        />
      )}

      {linkFrom && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 px-3 py-1.5 rounded-lg bg-[#04080a]/90 border border-cyan-500/40 text-[11px] font-bold text-cyan-200 pointer-events-none">
          {t.linkHint || 'Drop on another note to connect them'}
        </div>
      )}
    </div>
  );
};

export default Canvas;
