// ============================================================================
// WhiteboardFlow - board document
// ----------------------------------------------------------------------------
// The board is a plain serialisable document. Everything the tool can do
// (render, export to PNG/SVG/JSON/Markdown, undo, hand the result to another
// tool) is derived from this one value, so nothing is ever "baked in".
// ============================================================================

export type ColumnId = 'todo' | 'inprogress' | 'done';

export type NoteColor = 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'slate';

export const NOTE_COLORS: NoteColor[] = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'slate'];

/** Fill / ink triples shared by the DOM notes and by the PNG/SVG renderers, so
 *  an exported board matches the board on screen instead of drifting from it. */
export const COLOR_INK: Record<NoteColor, { fill: string; edge: string; ink: string }> = {
  yellow: { fill: '#fef08a', edge: '#fde047', ink: '#422006' },
  pink: { fill: '#fbcfe8', edge: '#f9a8d4', ink: '#500724' },
  green: { fill: '#a7f3d0', edge: '#6ee7b7', ink: '#022c22' },
  blue: { fill: '#bae6fd', edge: '#7dd3fc', ink: '#082f49' },
  purple: { fill: '#ddd6fe', edge: '#c4b5fd', ink: '#2e1065' },
  orange: { fill: '#fed7aa', edge: '#fdba74', ink: '#431407' },
  slate: { fill: '#e2e8f0', edge: '#cbd5e1', ink: '#0f172a' },
};

export interface BoardNode {
  id: string;
  kind: 'note' | 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  /** Paint order. Bringing a note to the front is a `set` command, so it undoes. */
  z: number;
  text: string;
  color: NoteColor;
  /** Which kanban lane this node snaps to while the layout is `kanban`. */
  column: ColumnId;
  /** Image payload. Blobs survive IndexedDB, which is why the board is not kept
   *  in localStorage - one pasted screenshot blows past its 5 MB quota. */
  blob?: Blob;
}

export interface BoardEdge {
  id: string;
  from: string;
  to: string;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export type BoardLayout = 'free' | 'kanban';

export interface BoardDoc {
  version: 2;
  layout: BoardLayout;
  nodes: BoardNode[];
  edges: BoardEdge[];
  viewport: Viewport;
}

// ---------------------------------------------------------------------------
// Undo/redo commands
// ---------------------------------------------------------------------------
// Deliberately NOT snapshots of the document: dragging twenty notes stores two
// numbers, and an image node is never copied - the Blob stays shared.

export type Command =
  | { t: 'add'; nodes: BoardNode[]; edges?: BoardEdge[] }
  | { t: 'del'; nodes: BoardNode[]; edges?: BoardEdge[] }
  | { t: 'move'; ids: string[]; dx: number; dy: number }
  | { t: 'set'; id: string; before: Partial<BoardNode>; after: Partial<BoardNode> }
  | {
      t: 'layout';
      before: BoardLayout;
      after: BoardLayout;
      moves: { id: string; from: { x: number; y: number }; to: { x: number; y: number } }[];
    }
  | { t: 'batch'; cmds: Command[] };

/** Geometry shared by the canvas, the auto-layout and both renderers. */
export const NOTE_W = 208;
export const NOTE_H = 132;
export const GRID = 16;
export const LANE_GAP = 264;
export const LANE_X: Record<ColumnId, number> = { todo: 0, inprogress: LANE_GAP, done: LANE_GAP * 2 };
export const COLUMNS: ColumnId[] = ['todo', 'inprogress', 'done'];
