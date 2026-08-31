import React, { useMemo, useState } from 'react';
import { ChevronRight, Copy } from 'lucide-react';

// ============================================================================
// A collapsible view of the result.
// ----------------------------------------------------------------------------
// Flattened to a list of visible rows on every render instead of rendered as
// nested components: only what is open costs anything, and the hard cap keeps
// a pathological document from mounting a hundred thousand nodes.
// ============================================================================

const MAX_ROWS = 4000;

export interface TreeRow {
  id: string;
  depth: number;
  label: string;
  /** Short preview of the value, when the node is a leaf. */
  preview: string;
  kind: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  hasChildren: boolean;
  /** Dotted/bracketed access path, for the copy button. */
  path: string;
}

function previewOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === 'object') return `{${Object.keys(value as object).length}}`;
  if (typeof value === 'string') return value.length > 80 ? `"${value.slice(0, 80)}…"` : `"${value}"`;
  return String(value);
}

function kindOf(value: unknown): TreeRow['kind'] {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'object':
      return 'object';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'string';
  }
}

function flatten(value: unknown, open: Set<string>): { rows: TreeRow[]; truncated: boolean } {
  const rows: TreeRow[] = [];
  let truncated = false;

  const walk = (node: unknown, label: string, id: string, path: string, depth: number) => {
    if (rows.length >= MAX_ROWS) {
      truncated = true;
      return;
    }
    const kind = kindOf(node);
    const children = kind === 'array' ? (node as unknown[]).map((v, i) => [String(i), v] as const) : kind === 'object' ? Object.entries(node as object) : [];
    rows.push({
      id,
      depth,
      label,
      preview: previewOf(node),
      kind,
      hasChildren: children.length > 0,
      path,
    });
    if (children.length === 0 || !open.has(id)) return;
    for (const [key, child] of children) {
      const childPath = kind === 'array' ? `${path}[${key}]` : /^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}` : `${path}["${key}"]`;
      walk(child, key, `${id}/${key}`, childPath, depth + 1);
    }
  };

  walk(value, '$', '$', '$', 0);
  return { rows, truncated };
}

const KIND_COLOR: Record<TreeRow['kind'], string> = {
  object: 'text-teal-300',
  array: 'text-cyan-300',
  string: 'text-emerald-300',
  number: 'text-amber-300',
  boolean: 'text-violet-300',
  null: 'text-slate-500',
};

interface TreeViewProps {
  /** Already-parsed value. Passing text would mean parsing on every render. */
  value: unknown;
  emptyLabel: string;
  truncatedLabel: string;
  copyLabel: string;
  onCopyPath: (path: string) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({ value, emptyLabel, truncatedLabel, copyLabel, onCopyPath }) => {
  const [open, setOpen] = useState<Set<string>>(() => new Set(['$', '$/0']));
  const { rows, truncated } = useMemo(() => flatten(value, open), [value, open]);

  if (value === undefined) {
    return <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-600">{emptyLabel}</div>;
  }

  return (
    <div className="h-full overflow-auto p-2 font-mono text-[13px]">
      {rows.map(row => (
        <div
          key={row.id}
          className="group flex items-center gap-1 rounded-md px-1 py-[1px] hover:bg-white/5"
          style={{ paddingLeft: row.depth * 14 + 4 }}
        >
          {row.hasChildren ? (
            <button
              type="button"
              onClick={() =>
                setOpen(current => {
                  const next = new Set(current);
                  if (next.has(row.id)) next.delete(row.id);
                  else next.add(row.id);
                  return next;
                })
              }
              className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center text-slate-500 outline-none hover:text-teal-400"
              aria-label={row.label}
            >
              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open.has(row.id) ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="h-4 w-4 shrink-0" />
          )}

          <span className="shrink-0 text-slate-300">{row.label}</span>
          <span className="text-slate-600">:</span>
          <span className={`truncate ${KIND_COLOR[row.kind]}`}>{row.preview}</span>

          <button
            type="button"
            onClick={() => onCopyPath(row.path)}
            title={copyLabel}
            className="ml-auto shrink-0 cursor-pointer p-1 text-slate-600 opacity-0 outline-none transition-opacity hover:text-teal-400 group-hover:opacity-100"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ))}
      {truncated && <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-400/80">{truncatedLabel}</div>}
    </div>
  );
};

export default TreeView;
