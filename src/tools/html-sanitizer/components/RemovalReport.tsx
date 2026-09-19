// ============================================================================
// The removal report
// ----------------------------------------------------------------------------
// This is the reason the tool uses DOMPurify's hooks instead of its string
// output: every decision is a row here, with the reason it was taken, and a
// switch to overrule it.
//
// Overruling does not edit the output text. It adds the row's id to the
// override set and re-runs the sanitiser, so "put the iframes back" costs one
// click and stays a real sanitise pass rather than a find-and-replace.
// ============================================================================

import React from 'react';
import { AlertTriangle, Eye, EyeOff, Info } from 'lucide-react';
import type { Removal, RemovalReason } from '../types';

interface RemovalReportProps {
  removals: Removal[];
  overrides: Set<string>;
  onToggle: (id: string) => void;
  t: any;
}

const REASON_FALLBACK: Record<RemovalReason, string> = {
  'tag-not-allowed': 'Tag not on the allow list',
  'tag-stripped': 'Tag deleted with its contents',
  'event-handler': 'Inline event handler',
  'attr-not-allowed': 'Attribute not on the allow list',
  'bad-scheme': 'URL scheme not allowed',
  comment: 'HTML comment',
  'inline-style': 'Inline style attribute',
  'class-attr': 'class attribute',
  'id-attr': 'id / name attribute',
};

export const RemovalReport: React.FC<RemovalReportProps> = ({ removals, overrides, onToggle, t }) => {
  if (removals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
        <Info className="w-5 h-5 text-slate-600" />
        <span className="text-xs text-slate-500 max-w-xs leading-relaxed">
          {t.report_empty || 'Nothing was removed — the input already matched the policy.'}
        </span>
      </div>
    );
  }

  const dangerous = removals.filter(r => r.dangerous).reduce((n, r) => n + r.count, 0);

  return (
    <div className="flex flex-col min-h-0">
      {dangerous > 0 && (
        <div className="flex items-start gap-2.5 px-4 py-3 border-b border-white/5 bg-rose-500/[0.07]">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="text-[11.5px] text-rose-200/90 leading-relaxed font-medium">
            {((dangerous === 1 && t.report_dangerous_one) || t.report_dangerous || '{0} removals could have executed code.').replace('{0}', String(dangerous))}
          </span>
        </div>
      )}

      <div className="divide-y divide-white/5 overflow-y-auto scrollbar-thin">
        {removals.map(removal => {
          const restored = overrides.has(removal.id);
          const label = t[`reason_${removal.reason}`] || REASON_FALLBACK[removal.reason];
          const target =
            removal.kind === 'comment'
              ? '<!-- … -->'
              : removal.attr
                ? `${removal.attr}=`
                : `<${removal.tag}>`;

          return (
            <div
              key={removal.id}
              className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                restored ? 'bg-amber-500/[0.06]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <span
                className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                  restored ? 'bg-amber-400' : removal.dangerous ? 'bg-rose-400' : 'bg-cyan-500/60'
                }`}
              />

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <code
                    className={`text-[12px] font-mono font-bold break-all ${
                      restored ? 'text-amber-200' : removal.dangerous ? 'text-rose-200' : 'text-cyan-200'
                    }`}
                  >
                    {target}
                  </code>
                  {removal.attr && (
                    <span className="text-[10px] font-mono text-slate-600">
                      {t.report_on || 'on'} &lt;{removal.tag}&gt;
                    </span>
                  )}
                  {removal.count > 1 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[9.5px] font-black text-slate-400">
                      ×{removal.count}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 leading-snug">{label}</div>

                {removal.sample && (
                  <div className="text-[10.5px] font-mono text-slate-600 break-all line-clamp-2 leading-snug">
                    {removal.sample}
                  </div>
                )}
              </div>

              <button
                onClick={() => onToggle(removal.id)}
                title={
                  restored
                    ? t.report_remove_again || 'Remove it again'
                    : t.report_keep_it || 'Keep this in the output'
                }
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer outline-none ${
                  restored
                    ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30'
                }`}
              >
                {restored ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span className="hidden sm:inline">
                  {restored ? t.report_kept || 'Kept' : t.report_keep || 'Keep'}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RemovalReport;
