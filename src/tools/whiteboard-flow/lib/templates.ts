import { LANE_X, NOTE_H, NOTE_W, type BoardDoc, type ColumnId, type NoteColor } from '../types';
import { createId, emptyDoc } from './board';

// ============================================================================
// Starter boards
// ----------------------------------------------------------------------------
// The manual route: nothing here runs on its own, a template is only built when
// the user picks one. Note text comes from the dictionary, so a template is as
// translated as the rest of the tool.
// ============================================================================

interface Seed {
  column: ColumnId;
  color: NoteColor;
  /** Dictionary key holding the note text. */
  key: string;
  fallback: string;
}

export interface Template {
  id: string;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
  layout: BoardDoc['layout'];
  seeds: Seed[];
  /** Indexes into `seeds`, joined by a connector. */
  links?: [number, number][];
}

export const TEMPLATES: Template[] = [
  {
    id: 'kanban',
    titleKey: 'tplKanbanTitle',
    titleFallback: 'Kanban',
    descKey: 'tplKanbanDesc',
    descFallback: 'Three lanes and a first task, ready to fill.',
    layout: 'kanban',
    seeds: [
      { column: 'todo', color: 'yellow', key: 'tplKanbanA', fallback: 'Write the first task' },
      { column: 'todo', color: 'blue', key: 'tplKanbanB', fallback: 'Split it into steps' },
      { column: 'inprogress', color: 'orange', key: 'tplKanbanC', fallback: 'Whatever you are on right now' },
      { column: 'done', color: 'green', key: 'tplKanbanD', fallback: 'Something already finished' },
    ],
  },
  {
    id: 'retro',
    titleKey: 'tplRetroTitle',
    titleFallback: 'Retrospective',
    descKey: 'tplRetroDesc',
    descFallback: 'What went well, what to improve, what to do next.',
    layout: 'kanban',
    seeds: [
      { column: 'todo', color: 'green', key: 'tplRetroA', fallback: 'What went well' },
      { column: 'inprogress', color: 'orange', key: 'tplRetroB', fallback: 'What slowed us down' },
      { column: 'done', color: 'blue', key: 'tplRetroC', fallback: 'What we do about it' },
    ],
  },
  {
    id: 'moscow',
    titleKey: 'tplMoscowTitle',
    titleFallback: 'Priorities',
    descKey: 'tplMoscowDesc',
    descFallback: 'Must, should and could, so scope stays honest.',
    layout: 'kanban',
    seeds: [
      { column: 'todo', color: 'pink', key: 'tplMoscowA', fallback: 'Must have' },
      { column: 'inprogress', color: 'yellow', key: 'tplMoscowB', fallback: 'Should have' },
      { column: 'done', color: 'slate', key: 'tplMoscowC', fallback: 'Could wait' },
    ],
  },
  {
    id: 'mindmap',
    titleKey: 'tplMindTitle',
    titleFallback: 'Mind map',
    descKey: 'tplMindDesc',
    descFallback: 'A centre and three branches, joined by connectors.',
    layout: 'free',
    seeds: [
      { column: 'todo', color: 'purple', key: 'tplMindA', fallback: 'Central idea' },
      { column: 'todo', color: 'blue', key: 'tplMindB', fallback: 'Branch one' },
      { column: 'todo', color: 'green', key: 'tplMindC', fallback: 'Branch two' },
      { column: 'todo', color: 'orange', key: 'tplMindD', fallback: 'Branch three' },
    ],
    links: [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  },
];

/** Builds the board for a template, resolving its text through the dictionary. */
export function buildTemplate(tpl: Template, t: any): BoardDoc {
  const doc = emptyDoc();
  doc.layout = tpl.layout;

  const perLane: Record<ColumnId, number> = { todo: 0, inprogress: 0, done: 0 };
  const ids: string[] = [];

  doc.nodes = tpl.seeds.map((seed, i) => {
    const id = createId();
    ids.push(id);
    let x: number;
    let y: number;
    if (tpl.layout === 'kanban') {
      x = LANE_X[seed.column];
      y = perLane[seed.column]++ * (NOTE_H + 16);
    } else {
      // Centre first, branches fanned out around it.
      const angle = ((i - 1) / Math.max(1, tpl.seeds.length - 1)) * Math.PI * 2;
      x = i === 0 ? 0 : Math.round(Math.cos(angle) * 320);
      y = i === 0 ? 0 : Math.round(Math.sin(angle) * 220);
    }
    return {
      id,
      kind: 'note' as const,
      x,
      y,
      w: NOTE_W,
      h: NOTE_H,
      z: i + 1,
      text: (t && t[seed.key]) || seed.fallback,
      color: seed.color,
      column: seed.column,
    };
  });

  doc.edges = (tpl.links || []).map(([a, b]) => ({ id: createId('e'), from: ids[a], to: ids[b] }));
  return doc;
}
