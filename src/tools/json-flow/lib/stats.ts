// ============================================================================
// Document statistics, computed in one iterative walk of the AST.
// ----------------------------------------------------------------------------
// Iterative on purpose: a recursive walk over a 300-level document (GeoJSON
// multipolygons get there) overflows the stack in Safari well before it does
// in Chrome, and a crash in a stats strip is a silly way to lose a session.
// ============================================================================

import type { DocStats, JsonKind, JsonNode } from '../types';

export function computeStats(root: JsonNode | null, text: string): DocStats {
  const base: DocStats = {
    bytes: new Blob([text]).size,
    lines: text ? text.split('\n').length : 0,
    nodes: 0,
    depth: 0,
    keys: 0,
    types: { object: 0, array: 0, string: 0, number: 0, boolean: 0, null: 0 },
    largestArrays: [],
    uniqueKeys: 0,
  };
  if (!root) return base;

  const names = new Set<string>();
  const arrays: { path: string; length: number }[] = [];
  const stack: { node: JsonNode; depth: number; path: string }[] = [{ node: root, depth: 1, path: '$' }];

  while (stack.length) {
    const { node, depth, path } = stack.pop()!;
    base.nodes++;
    base.types[node.kind as JsonKind]++;
    if (depth > base.depth) base.depth = depth;

    if (node.kind === 'array' && node.children) {
      arrays.push({ path, length: node.children.length });
    }

    if (node.children) {
      for (const child of node.children) {
        const childPath =
          node.kind === 'array'
            ? `${path}[${child.key}]`
            : `${path}.${child.key}`;
        if (node.kind === 'object') {
          base.keys++;
          names.add(child.key as string);
        }
        stack.push({ node: child, depth: depth + 1, path: childPath });
      }
    }
  }

  base.uniqueKeys = names.size;
  arrays.sort((a, b) => b.length - a.length);
  base.largestArrays = arrays.slice(0, 3);
  return base;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}
