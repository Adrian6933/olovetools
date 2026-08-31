import React from 'react';
import type { MatchHit } from '../types';
import { EmptyMatchArt } from './Illustrations';

// ============================================================================
// Every match, with its offsets and its capture groups.
// ----------------------------------------------------------------------------
// The previous version stored matches as `{ index, text, groups: string[] }`
// and only ever rendered a count. Because the engine now runs with the `d`
// flag, each group carries a real span, so this panel can show where a group
// starts, what it captured, and what its name is — which is the difference
// between "12 matches" and being able to debug the pattern that produced them.
// ============================================================================

interface MatchTableProps {
  matches: MatchHit[];
  total: number;
  truncated: boolean;
  activeIndex: number | null;
  onActivate: (index: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

/** Control characters have to be visible or an empty match looks like a bug. */
function show(value: string): string {
  if (value === '') return '∅';
  return value.replace(/\n/g, '␊').replace(/\t/g, '␉').replace(/\r/g, '␍');
}

export const MatchTable: React.FC<MatchTableProps> = ({
  matches,
  total,
  truncated,
  activeIndex,
  onActivate,
  t,
}) => {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <EmptyMatchArt className="w-28 h-auto text-fuchsia-400/60" />
        <p className="text-sm font-bold text-slate-400">{t('noMatches')}</p>
        <p className="max-w-xs text-xs leading-relaxed text-slate-600">{t('noMatchesHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {truncated && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-300">
          {t('matchesTruncated', { shown: matches.length, total })}
        </p>
      )}

      <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1 list-none m-0 p-0">
        {matches.map(hit => {
          const active = activeIndex === hit.index;
          return (
            <li key={`${hit.index}-${hit.start}`}>
              <button
                type="button"
                onClick={() => onActivate(hit.index)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                  active
                    ? 'border-fuchsia-500/40 bg-fuchsia-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-fuchsia-500/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded-md bg-fuchsia-500/15 px-1.5 py-0.5 font-mono text-[10px] font-black text-fuchsia-300">
                    #{hit.index + 1}
                  </span>
                  <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-slate-200">{show(hit.value)}</code>
                  <span className="shrink-0 font-mono text-[10px] text-slate-500">
                    {hit.start}–{hit.end}
                  </span>
                </div>

                {hit.groups.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
                    {hit.groups.map(group => (
                      <div key={group.number} className="flex items-center gap-2 text-[11px]">
                        <span className="w-14 shrink-0 truncate font-mono text-violet-300/80">
                          {group.name ? `<${group.name}>` : `$${group.number}`}
                        </span>
                        <code className="min-w-0 flex-1 truncate font-mono text-slate-400">
                          {group.value === undefined ? (
                            <span className="italic text-slate-600">{t('groupUnmatched')}</span>
                          ) : (
                            show(group.value)
                          )}
                        </code>
                        {group.start >= 0 && (
                          <span className="shrink-0 font-mono text-[10px] text-slate-600">{group.start}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MatchTable;
