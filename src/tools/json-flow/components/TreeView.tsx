import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Copy, Crosshair } from 'lucide-react';
import type { JsonNode } from '../types';
import { buildMatchIndex, buildRows, containerSummary, type SearchScope, type TreeRow } from '../lib/tree';

// ============================================================================
// Virtualised tree.
// ----------------------------------------------------------------------------
// Rows are a flat array (see lib/tree.ts) and only the slice under the scroll
// window is mounted, so a 180 000-node document costs the same number of DOM
// nodes as a ten-key one. The previous version mounted a React component per
// node and re-ran a subtree search inside each of them on every keystroke.
// ============================================================================

const ROW_HEIGHT = 26;
const OVERSCAN = 8;
/** Ceiling on flattened rows. Reaching it is reported, never hidden. */
const ROW_LIMIT = 200_000;

interface TreeViewProps {
  root: JsonNode | null;
  query: string;
  scope: SearchScope;
  expanded: Set<string>;
  setExpanded: (next: Set<string>) => void;
  autoDepth: number;
  t: any;
  /** Jumps the editor caret to this source offset. */
  onLocate: (offset: number) => void;
  onCopy: (text: string) => void;
  emptyLabel: string;
}

function valueText(node: JsonNode): string {
  switch (node.kind) {
    case 'string':
      return JSON.stringify(node.value);
    case 'number':
      return node.raw ?? String(node.value);
    case 'boolean':
      return node.value ? 'true' : 'false';
    default:
      return 'null';
  }
}

const VALUE_CLASS: Record<string, string> = {
  string: 'text-emerald-300',
  number: 'text-cyan-300',
  boolean: 'text-violet-300',
  null: 'text-slate-500 italic',
};

/** Splits a label so the matched part can be marked without dangerouslySetInnerHTML. */
function highlight(text: string, needle: string): React.ReactNode {
  if (!needle) return text;
  const at = text.toLowerCase().indexOf(needle.toLowerCase());
  if (at === -1) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-emerald-500/30 text-emerald-100 rounded px-0.5">{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}

export const TreeView: React.FC<TreeViewProps> = ({
  root,
  query,
  scope,
  expanded,
  setExpanded,
  autoDepth,
  t,
  onLocate,
  onCopy,
  emptyLabel,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(420);
  const [copied, setCopied] = useState<string | null>(null);

  const match = useMemo(() => (root ? buildMatchIndex(root, query, scope) : null), [root, query, scope]);
  const rows = useMemo(
    () => buildRows(root, { expanded, match, autoDepth, limit: ROW_LIMIT }),
    [root, expanded, match, autoDepth]
  );
  const capped = rows.length >= ROW_LIMIT;

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

  // A new filter can leave the view scrolled past the (now much shorter) list.
  useEffect(() => {
    if (boxRef.current && boxRef.current.scrollTop > rows.length * ROW_HEIGHT) {
      boxRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [rows.length]);

  const toggle = (row: TreeRow) => {
    const next = new Set(expanded);
    if (row.expanded) {
      next.delete(row.path);
      next.add(`!${row.path}`);
    } else {
      next.delete(`!${row.path}`);
      next.add(row.path);
    }
    setExpanded(next);
  };

  const flash = (id: string, text: string) => {
    onCopy(text);
    setCopied(id);
    window.setTimeout(() => setCopied(current => (current === id ? null : current)), 1400);
  };

  if (!root) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
        <p className="text-sm font-medium max-w-xs">{emptyLabel}</p>
      </div>
    );
  }

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(rows.length, Math.ceil((scrollTop + viewport) / ROW_HEIGHT) + OVERSCAN);
  const slice = rows.slice(first, last);
  const needle = query.trim();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        ref={boxRef}
        onScroll={e => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        className="flex-1 min-h-0 overflow-auto bg-[#050807] border border-white/5 rounded-2xl"
        role="tree"
        aria-label={t.tab_tree_viewer || 'Tree'}
      >
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">{t.no_matches || 'Nothing matches that search.'}</div>
        ) : (
          <div style={{ height: rows.length * ROW_HEIGHT }} className="relative">
            {slice.map((row, i) => {
              const index = first + i;
              const node = row.node;
              const isContainer = node.kind === 'object' || node.kind === 'array';
              const label =
                row.index !== null ? `${row.index}` : node.key === null ? '$' : String(node.key);

              return (
                <div
                  // The path alone is not unique: a document with a duplicate
                  // key has two nodes at `$.a`. The source offset always is.
                  key={`${row.path}@${node.start}`}
                  role="treeitem"
                  aria-expanded={row.foldable ? row.expanded : undefined}
                  className={`group absolute left-0 right-0 flex items-center gap-1.5 pr-2 hover:bg-white/[0.04] ${
                    row.hit ? 'bg-emerald-500/[0.06]' : ''
                  }`}
                  style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT, paddingLeft: 8 + row.depth * 14 }}
                >
                  {row.foldable ? (
                    <button
                      type="button"
                      onClick={() => toggle(row)}
                      aria-label={row.expanded ? t.collapse_all || 'Collapse' : t.expand_all || 'Expand'}
                      className="w-4 h-4 shrink-0 flex items-center justify-center text-emerald-500/80 hover:text-emerald-300 bg-transparent border-none cursor-pointer p-0"
                    >
                      {row.expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}

                  <span
                    className={`font-mono text-[12.5px] shrink-0 ${
                      row.index !== null ? 'text-slate-500' : 'text-slate-300'
                    }`}
                  >
                    {highlight(label, scope === 'values' ? '' : needle)}
                  </span>

                  {isContainer ? (
                    <span className="font-mono text-[11.5px] text-slate-600 shrink-0">
                      {containerSummary(node)}
                    </span>
                  ) : (
                    <>
                      <span className="text-slate-600 shrink-0">:</span>
                      <span
                        className={`font-mono text-[12.5px] truncate ${VALUE_CLASS[node.kind] || 'text-slate-300'}`}
                        title={valueText(node)}
                      >
                        {highlight(valueText(node), scope === 'keys' ? '' : needle)}
                      </span>
                    </>
                  )}

                  <span className="ml-auto shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      title={t.copy_path || 'Copy path'}
                      onClick={() => flash(`p${row.path}`, row.path)}
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-300 cursor-pointer"
                    >
                      {copied === `p${row.path}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <span className="text-[9px] font-black">$</span>
                      )}
                    </button>
                    <button
                      type="button"
                      title={t.copy_value || 'Copy value'}
                      onClick={() => flash(`v${row.path}`, node.raw ?? JSON.stringify(nodeValue(node), null, 2))}
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-300 cursor-pointer"
                    >
                      {copied === `v${row.path}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      title={t.locate || 'Show in the editor'}
                      onClick={() => onLocate(node.keyStart ?? node.start)}
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-300 cursor-pointer"
                    >
                      <Crosshair className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 text-[10.5px] font-mono text-slate-600">
        <span className={capped ? 'text-amber-300/80' : undefined}>
          {((rows.length === 1 && t.tree_rows_one) || t.tree_rows || '{0} rows').replace('{0}', String(rows.length))}
          {capped ? ` · ${t.tree_capped || 'ceiling reached — collapse a level to see the rest'}` : ''}
          {match ? ` · ${((match.total === 1 && t.tree_hits_one) || t.tree_hits || '{0} hits').replace('{0}', String(match.total))}` : ''}
        </span>
        <span>{(t.tree_mounted || '{0} in the DOM').replace('{0}', String(slice.length))}</span>
      </div>
    </div>
  );
};

/** Local materialiser: only ever called for one node the user clicked. */
function nodeValue(node: JsonNode): unknown {
  if (node.kind === 'object') {
    const out: Record<string, unknown> = {};
    for (const child of node.children!) out[child.key as string] = nodeValue(child);
    return out;
  }
  if (node.kind === 'array') return node.children!.map(nodeValue);
  return node.value as unknown;
}
