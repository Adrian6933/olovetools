import React from 'react';
import type { ExplainNode, ExplainTone } from '../types';

// ============================================================================
// The explanation, as a tree.
// ----------------------------------------------------------------------------
// The old panel was a flat list indented with an inline `marginLeft:
// depth*16px`, which said nothing about what contains what and pushed itself
// off the right edge of a phone at four levels deep. Real nesting with guide
// rails costs the same and survives 375px, because the indent is a padding
// that the flex children can shrink against.
//
// Hovering a line reports its slice of the pattern upwards, which is what
// lights up those exact characters in the pattern field.
// ============================================================================

const TONE_STYLE: Record<ExplainTone, string> = {
  anchor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
  quantifier: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  group: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  class: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/25',
  escape: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
  literal: 'bg-white/5 text-slate-300 border-white/10',
  alternation: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  backref: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
};

interface ExplainTreeProps {
  nodes: ExplainNode[];
  onFocus: (range: { start: number; end: number } | null) => void;
  depth?: number;
}

export const ExplainTree: React.FC<ExplainTreeProps> = ({ nodes, onFocus, depth = 0 }) => (
  <ul className={`space-y-1.5 list-none m-0 p-0 ${depth > 0 ? 'mt-1.5 pl-3 sm:pl-4 border-l border-white/10' : ''}`}>
    {nodes.map(node => (
      <li key={node.id} className="min-w-0">
        <div
          onMouseEnter={() => onFocus({ start: node.start, end: node.end })}
          onMouseLeave={() => onFocus(null)}
          onFocus={() => onFocus({ start: node.start, end: node.end })}
          onBlur={() => onFocus(null)}
          tabIndex={0}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-white/[0.015] px-3 py-2 outline-none transition-colors hover:border-fuchsia-500/25 hover:bg-fuchsia-500/[0.04] focus-visible:border-fuchsia-500/40"
        >
          <code
            className={`shrink-0 max-w-full truncate rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-bold ${TONE_STYLE[node.tone]}`}
          >
            {node.raw || '∅'}
          </code>
          <span className="min-w-0 flex-1 text-[13px] leading-snug text-slate-300">{node.text}</span>
        </div>

        {node.children.length > 0 && <ExplainTree nodes={node.children} onFocus={onFocus} depth={depth + 1} />}
      </li>
    ))}
  </ul>
);

export default ExplainTree;
