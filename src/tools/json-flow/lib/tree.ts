// ============================================================================
// Turning the AST into a flat, windowable list of rows.
// ----------------------------------------------------------------------------
// The old tree rendered one React component per node and asked each of them
// "does my subtree contain the search term?" — a subtree walk per node, so
// O(n²), which is why typing in the search box froze the tab.
//
// Here the answer is computed once for the whole document in a single walk,
// and the rows are a plain array the view can slice to whatever is on screen.
// ============================================================================

import type { JsonNode } from '../types';

export type SearchScope = 'both' | 'keys' | 'values';

export interface TreeRow {
  node: JsonNode;
  depth: number;
  path: string;
  /** Container rows can be folded. */
  foldable: boolean;
  expanded: boolean;
  /** The row itself matches the query (as opposed to just containing a match). */
  hit: boolean;
  /** Index inside the parent array, used for the `[0]` label. */
  index: number | null;
}

export const rowKey = (row: TreeRow): string => row.path;

function primitiveText(node: JsonNode): string {
  if (node.kind === 'string') return node.value as string;
  if (node.kind === 'number') return node.raw ?? String(node.value);
  if (node.kind === 'boolean') return node.value ? 'true' : 'false';
  if (node.kind === 'null') return 'null';
  return '';
}

export interface MatchIndex {
  /** Nodes that match the query themselves. */
  hits: Set<JsonNode>;
  /** Nodes that match or have a descendant that does. */
  keep: Set<JsonNode>;
  total: number;
}

/** One post-order walk marks every node. O(n), not O(n²). */
export function buildMatchIndex(root: JsonNode, query: string, scope: SearchScope = 'both'): MatchIndex | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;

  const hits = new Set<JsonNode>();
  const keep = new Set<JsonNode>();

  const visit = (node: JsonNode): boolean => {
    let self = false;
    if (scope !== 'values' && node.key !== null && String(node.key).toLowerCase().includes(needle)) self = true;
    if (!self && scope !== 'keys' && node.kind !== 'object' && node.kind !== 'array') {
      if (primitiveText(node).toLowerCase().includes(needle)) self = true;
    }
    if (self) hits.add(node);

    let any = self;
    if (node.children) {
      for (const child of node.children) {
        if (visit(child)) any = true;
      }
    }
    if (any) keep.add(node);
    return any;
  };

  visit(root);
  return { hits, keep, total: hits.size };
}

export interface RowOptions {
  expanded: Set<string>;
  match: MatchIndex | null;
  /** Levels expanded when a path has no explicit entry in `expanded`. */
  autoDepth: number;
  /** Hard cap so a pathological document cannot lock the renderer. */
  limit?: number;
}

/** Flattens the visible part of the tree, skipping collapsed subtrees. */
export function buildRows(root: JsonNode | null, options: RowOptions): TreeRow[] {
  if (!root) return [];
  const rows: TreeRow[] = [];
  const limit = options.limit ?? 200_000;
  const { expanded, match, autoDepth } = options;

  const walk = (node: JsonNode, depth: number, path: string, index: number | null) => {
    if (rows.length >= limit) return;
    if (match && !match.keep.has(node)) return;

    const foldable = !!node.children && node.children.length > 0;
    const explicit = expanded.has(path);
    // A filtered tree opens itself along the matching branches; otherwise the
    // user would have to unfold the path to every hit by hand.
    const isOpen = foldable && (explicit || (!expanded.has(`!${path}`) && (match ? true : depth < autoDepth)));

    rows.push({
      node,
      depth,
      path,
      foldable,
      expanded: isOpen,
      hit: match ? match.hits.has(node) : false,
      index,
    });

    if (!isOpen || !node.children) return;
    node.children.forEach((child, i) => {
      const childPath =
        node.kind === 'array'
          ? `${path}[${i}]`
          : /^[A-Za-z_$][\w$]*$/.test(child.key || '')
            ? `${path}.${child.key}`
            : `${path}[${JSON.stringify(child.key)}]`;
      walk(child, depth + 1, childPath, node.kind === 'array' ? i : null);
    });
  };

  walk(root, 0, '$', null);
  return rows;
}

/** Label shown to the right of a container: `{4 keys}` / `[128 items]`. */
export function containerSummary(node: JsonNode): string {
  const size = node.children?.length ?? 0;
  return node.kind === 'array' ? `[${size}]` : `{${size}}`;
}
