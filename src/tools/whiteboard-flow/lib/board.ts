import {
  COLUMNS,
  GRID,
  LANE_X,
  NOTE_COLORS,
  NOTE_H,
  NOTE_W,
  type BoardDoc,
  type BoardEdge,
  type BoardLayout,
  type BoardNode,
  type ColumnId,
  type Command,
  type NoteColor,
} from '../types';

export const createId = (p = 'n') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const emptyDoc = (): BoardDoc => ({
  version: 2,
  layout: 'kanban',
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, scale: 1 },
});

export const snap = (v: number) => Math.round(v / GRID) * GRID;

export const topZ = (doc: BoardDoc) => doc.nodes.reduce((m, n) => Math.max(m, n.z), 0);

export const makeNote = (doc: BoardDoc, patch: Partial<BoardNode> = {}): BoardNode => ({
  id: createId(),
  kind: 'note',
  x: 0,
  y: 0,
  w: NOTE_W,
  h: NOTE_H,
  z: topZ(doc) + 1,
  text: '',
  color: NOTE_COLORS[Math.floor(Math.random() * 5)],
  column: 'todo',
  ...patch,
});

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const withNodes = (doc: BoardDoc, nodes: BoardNode[]): BoardDoc => ({ ...doc, nodes });

/** Applies a command. `dir` -1 replays it backwards, which is what undo is. */
export function apply(doc: BoardDoc, cmd: Command, dir: 1 | -1 = 1): BoardDoc {
  switch (cmd.t) {
    case 'add':
    case 'del': {
      const adding = (cmd.t === 'add') === (dir === 1);
      if (adding) {
        const known = new Set(doc.nodes.map(n => n.id));
        const nodes = doc.nodes.concat(cmd.nodes.filter(n => !known.has(n.id)));
        const knownE = new Set(doc.edges.map(e => e.id));
        const edges = doc.edges.concat((cmd.edges || []).filter(e => !knownE.has(e.id)));
        return { ...doc, nodes, edges };
      }
      const gone = new Set(cmd.nodes.map(n => n.id));
      return {
        ...doc,
        nodes: doc.nodes.filter(n => !gone.has(n.id)),
        // An edge cannot outlive its endpoints, so they travel with the delete.
        edges: doc.edges.filter(e => !gone.has(e.from) && !gone.has(e.to)),
      };
    }
    case 'move': {
      const ids = new Set(cmd.ids);
      const dx = cmd.dx * dir;
      const dy = cmd.dy * dir;
      return withNodes(doc, doc.nodes.map(n => (ids.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)));
    }
    case 'set': {
      const patch = dir === 1 ? cmd.after : cmd.before;
      return withNodes(doc, doc.nodes.map(n => (n.id === cmd.id ? { ...n, ...patch } : n)));
    }
    case 'layout': {
      const layout = dir === 1 ? cmd.after : cmd.before;
      const byId = new Map(cmd.moves.map(m => [m.id, dir === 1 ? m.to : m.from]));
      return {
        ...doc,
        layout,
        nodes: doc.nodes.map(n => {
          const p = byId.get(n.id);
          return p ? { ...n, x: p.x, y: p.y } : n;
        }),
      };
    }
    case 'batch': {
      const list = dir === 1 ? cmd.cmds : [...cmd.cmds].reverse();
      return list.reduce((d, c) => apply(d, c, dir), doc);
    }
    default:
      return doc;
  }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Positions every node into its lane, stacked in current visual order. */
export function kanbanPositions(doc: BoardDoc): { id: string; x: number; y: number }[] {
  const perLane: Record<ColumnId, BoardNode[]> = { todo: [], inprogress: [], done: [] };
  // Sorting by y keeps the order the user already sees instead of reshuffling.
  [...doc.nodes]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .forEach(n => perLane[n.column].push(n));

  const out: { id: string; x: number; y: number }[] = [];
  COLUMNS.forEach(col => {
    perLane[col].forEach((n, i) => {
      out.push({ id: n.id, x: LANE_X[col], y: i * (NOTE_H + 16) });
    });
  });
  return out;
}

/** Nearest lane for a free-floating x, used when a drag ends in kanban mode. */
export function laneAt(x: number): ColumnId {
  let best: ColumnId = 'todo';
  let bestD = Infinity;
  COLUMNS.forEach(col => {
    const d = Math.abs(x - LANE_X[col]);
    if (d < bestD) {
      bestD = d;
      best = col;
    }
  });
  return best;
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function contentBounds(nodes: BoardNode[], pad = 48): Bounds {
  if (nodes.length === 0) return { x: 0, y: 0, w: NOTE_W, h: NOTE_H };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  nodes.forEach(n => {
    x0 = Math.min(x0, n.x);
    y0 = Math.min(y0, n.y);
    x1 = Math.max(x1, n.x + n.w);
    y1 = Math.max(y1, n.y + n.h);
  });
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}

/** Viewport that frames every node inside a `vw x vh` surface. */
export function fitViewport(nodes: BoardNode[], vw: number, vh: number) {
  const b = contentBounds(nodes);
  const scale = Math.min(2, Math.max(0.2, Math.min(vw / b.w, vh / b.h)));
  return {
    scale,
    x: vw / 2 - (b.x + b.w / 2) * scale,
    y: vh / 2 - (b.y + b.h / 2) * scale,
  };
}

/** Free spot for a new note near the middle of what the user is looking at. */
export function spawnPoint(doc: BoardDoc, vw: number, vh: number) {
  const { x, y, scale } = doc.viewport;
  let cx = snap((vw / 2 - x) / scale - NOTE_W / 2);
  let cy = snap((vh / 2 - y) / scale - NOTE_H / 2);
  // Walk diagonally until the slot is not already taken, so notes never stack
  // invisibly on top of each other.
  for (let i = 0; i < 40; i++) {
    const taken = doc.nodes.some(n => Math.abs(n.x - cx) < GRID && Math.abs(n.y - cy) < GRID);
    if (!taken) break;
    cx += GRID * 2;
    cy += GRID * 2;
  }
  return { x: cx, y: cy };
}

// ---------------------------------------------------------------------------
// Migration from v1
// ---------------------------------------------------------------------------

const V1_KEY = 'whiteboard-flow-notes-v1';

const V1_COLOR: Record<string, NoteColor> = {
  yellow: 'yellow',
  pink: 'pink',
  green: 'green',
  blue: 'blue',
  purple: 'purple',
};

/**
 * v1 stored a flat `Note[]` with a column and no coordinates. Boards made
 * before this rewrite have to survive, so the lanes are laid out on the canvas
 * in the order they were rendered and the old key is left untouched until the
 * v2 document has actually been written.
 */
export function migrateV1(): BoardDoc | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(V1_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const doc = emptyDoc();
    const seen: Record<ColumnId, number> = { todo: 0, inprogress: 0, done: 0 };
    doc.nodes = parsed
      .filter((n: any) => n && typeof n.id === 'string' && typeof n.text === 'string')
      .map((n: any, i: number) => {
        const column: ColumnId = n.column === 'inprogress' || n.column === 'done' ? n.column : 'todo';
        const row = seen[column]++;
        return {
          id: n.id,
          kind: 'note' as const,
          x: LANE_X[column],
          y: row * (NOTE_H + 16),
          w: NOTE_W,
          h: NOTE_H,
          z: i + 1,
          text: n.text,
          color: V1_COLOR[n.color] || 'yellow',
          column,
        };
      });
    return doc.nodes.length > 0 ? doc : null;
  } catch {
    return null;
  }
}

export function clearV1() {
  try {
    localStorage.removeItem(V1_KEY);
  } catch {
    // Hardened browsers refuse storage entirely; nothing to clean up then.
  }
}

// ---------------------------------------------------------------------------
// Serialisation (JSON import/export). Blobs are dropped: a .json board is a
// text file, and image nodes are re-attached only through the board itself.
// ---------------------------------------------------------------------------

export function toJSON(doc: BoardDoc): string {
  return JSON.stringify(
    {
      version: 2,
      layout: doc.layout,
      nodes: doc.nodes.filter(n => n.kind === 'note').map(({ blob, ...n }) => n),
      edges: doc.edges,
    },
    null,
    2
  );
}

export function fromJSON(text: string): { doc: BoardDoc | null; error: string } {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { doc: null, error: 'parse' };
  }
  if (!parsed || !Array.isArray(parsed.nodes)) return { doc: null, error: 'shape' };
  const doc = emptyDoc();
  doc.layout = parsed.layout === 'free' ? 'free' : 'kanban';
  doc.nodes = parsed.nodes
    .filter((n: any) => n && typeof n.text === 'string')
    .map((n: any, i: number) => ({
      id: typeof n.id === 'string' ? n.id : createId(),
      kind: 'note' as const,
      x: Number(n.x) || 0,
      y: Number(n.y) || 0,
      w: Number(n.w) || NOTE_W,
      h: Number(n.h) || NOTE_H,
      z: Number(n.z) || i + 1,
      text: String(n.text),
      color: (NOTE_COLORS as string[]).includes(n.color) ? (n.color as NoteColor) : 'yellow',
      column: n.column === 'inprogress' || n.column === 'done' ? n.column : ('todo' as ColumnId),
    }));
  const ids = new Set(doc.nodes.map(n => n.id));
  doc.edges = (Array.isArray(parsed.edges) ? parsed.edges : [])
    .filter((e: any) => e && ids.has(e.from) && ids.has(e.to))
    .map((e: any) => ({ id: typeof e.id === 'string' ? e.id : createId('e'), from: e.from, to: e.to }));
  if (doc.nodes.length === 0) return { doc: null, error: 'empty' };
  return { doc, error: '' };
}

export function toMarkdown(doc: BoardDoc, labels: Record<ColumnId, string>): string {
  const lines: string[] = [];
  COLUMNS.forEach(col => {
    const items = doc.nodes
      .filter(n => n.column === col && n.kind === 'note' && n.text.trim())
      .sort((a, b) => a.y - b.y);
    if (items.length === 0) return;
    lines.push(`## ${labels[col]}`, '');
    items.forEach(n => {
      const parts = n.text.split('\n');
      lines.push(`- [${col === 'done' ? 'x' : ' '}] ${parts[0]}`);
      parts.slice(1).filter(r => r.trim()).forEach(r => lines.push(`      ${r}`));
    });
    lines.push('');
  });
  return lines.join('\n').trim() + '\n';
}

export type { BoardDoc, BoardEdge, BoardNode, BoardLayout, Command };
