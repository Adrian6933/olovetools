// ============================================================================
// The manual route
// ----------------------------------------------------------------------------
// Presets are a starting point, not a cage. This panel is the "I know exactly
// what I want" path: edit the tag list, the attribute list and the URL schemes
// by hand, with no preset selected at all if that is what you need.
//
// Nothing here runs the sanitiser. Changing the policy only marks the result
// stale; the user still presses the button.
// ============================================================================

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Policy, UriScheme } from '../types';

interface PolicyEditorProps {
  policy: Policy;
  onChange: (next: Policy) => void;
  t: any;
}

const SCHEMES: { id: UriScheme; label: string; hintKey: string }[] = [
  { id: 'https', label: 'https:', hintKey: 'scheme_https_hint' },
  { id: 'http', label: 'http:', hintKey: 'scheme_http_hint' },
  { id: 'relative', label: '/relative', hintKey: 'scheme_relative_hint' },
  { id: 'mailto', label: 'mailto:', hintKey: 'scheme_mailto_hint' },
  { id: 'tel', label: 'tel:', hintKey: 'scheme_tel_hint' },
  { id: 'ftp', label: 'ftp:', hintKey: 'scheme_ftp_hint' },
  { id: 'data-image', label: 'data:image', hintKey: 'scheme_data_hint' },
];

const TOGGLES: { key: keyof Policy; labelKey: string; fallback: string }[] = [
  { key: 'keepInlineStyle', labelKey: 'policy_keep_style', fallback: 'Keep style="…"' },
  { key: 'keepClasses', labelKey: 'policy_keep_class', fallback: 'Keep class="…"' },
  { key: 'keepIds', labelKey: 'policy_keep_id', fallback: 'Keep id / name' },
  { key: 'keepComments', labelKey: 'policy_keep_comments', fallback: 'Keep comments' },
  { key: 'allowDataAttrs', labelKey: 'policy_data_attrs', fallback: 'Keep data-* attributes' },
  { key: 'allowAriaAttrs', labelKey: 'policy_aria_attrs', fallback: 'Keep aria-* and role' },
  { key: 'allowSvgMath', labelKey: 'policy_svg_math', fallback: 'Allow <svg> and <math>' },
  { key: 'hardenLinks', labelKey: 'policy_harden_links', fallback: 'Add rel="noopener noreferrer"' },
  { key: 'stripTargets', labelKey: 'policy_strip_target', fallback: 'Remove target="_blank"' },
];

/** Chip list with an inline "add" field. Used for tags and for attributes. */
const TokenList: React.FC<{
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  accent: 'cyan' | 'rose';
  emptyLabel: string;
}> = ({ values, onChange, placeholder, accent, emptyLabel }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    // One paste can carry a whole list: "img, picture, source".
    const parts = draft
      .split(/[\s,]+/)
      .map(p => p.trim().toLowerCase().replace(/^<|>$/g, ''))
      .filter(Boolean);
    if (!parts.length) return;
    onChange([...new Set([...values, ...parts])].sort());
    setDraft('');
  };

  const chip =
    accent === 'cyan'
      ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-200 hover:bg-cyan-500/20'
      : 'bg-rose-500/10 border-rose-500/25 text-rose-200 hover:bg-rose-500/20';

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
        {values.length === 0 && <span className="text-[11px] text-slate-600 italic py-1">{emptyLabel}</span>}
        {values.map(value => (
          <button
            key={value}
            onClick={() => onChange(values.filter(v => v !== value))}
            className={`group inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer outline-none ${chip}`}
          >
            {value}
            <X className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          spellCheck={false}
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
        />
        <button
          onClick={add}
          disabled={!draft.trim()}
          className="shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const PolicyEditor: React.FC<PolicyEditorProps> = ({ policy, onChange, t }) => {
  const patch = (part: Partial<Policy>) => onChange({ ...policy, ...part });

  const toggleScheme = (id: UriScheme) =>
    patch({
      allowedSchemes: policy.allowedSchemes.includes(id)
        ? policy.allowedSchemes.filter(s => s !== id)
        : [...policy.allowedSchemes, id],
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {t.policy_allowed_tags || 'Allowed tags'}
            </span>
            <span className="text-[10px] font-mono text-slate-600">{policy.allowedTags.length}</span>
          </div>
          <TokenList
            values={policy.allowedTags}
            onChange={allowedTags => patch({ allowedTags })}
            placeholder={t.policy_add_tag || 'add tag…'}
            accent="cyan"
            emptyLabel={t.policy_no_tags || 'No tags allowed — output will be plain text'}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {t.policy_allowed_attrs || 'Allowed attributes'}
            </span>
            <span className="text-[10px] font-mono text-slate-600">{policy.allowedAttrs.length}</span>
          </div>
          <TokenList
            values={policy.allowedAttrs}
            onChange={allowedAttrs => patch({ allowedAttrs })}
            placeholder={t.policy_add_attr || 'add attribute…'}
            accent="cyan"
            emptyLabel={t.policy_no_attrs || 'No attributes kept'}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t.policy_strip_tags || 'Delete with contents'}
          </span>
          <span className="text-[10px] text-slate-600">{t.policy_strip_hint || 'never unwrapped — the inside goes too'}</span>
        </div>
        <TokenList
          values={policy.stripWithContents}
          onChange={stripWithContents => patch({ stripWithContents })}
          placeholder={t.policy_add_tag || 'add tag…'}
          accent="rose"
          emptyLabel={t.policy_no_strip || 'Nothing deleted with its contents'}
        />
      </div>

      <div className="space-y-2.5">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {t.policy_unknown || 'Tags that are not allowed'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(['unwrap', 'drop'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => patch({ unknownTags: mode })}
              className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer outline-none ${
                policy.unknownTags === mode
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'unwrap'
                ? t.policy_unwrap || 'Unwrap — keep the text inside'
                : t.policy_drop || 'Drop — remove the whole subtree'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t.policy_schemes || 'URL schemes accepted'}
          </span>
          <span className="text-[10px] text-slate-600">
            {t.policy_schemes_hint || 'anything else in href/src is dropped'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SCHEMES.map(scheme => {
            const on = policy.allowedSchemes.includes(scheme.id);
            return (
              <button
                key={scheme.id}
                onClick={() => toggleScheme(scheme.id)}
                title={t[scheme.hintKey] || undefined}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer outline-none ${
                  on
                    ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-200'
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300'
                }`}
              >
                {scheme.label}
              </button>
            );
          })}
        </div>
        <p className="text-[10.5px] text-slate-500 leading-relaxed">
          {t.policy_data_note ||
            'data:image accepts raster formats only. SVG data URLs are never allowed: an inline SVG runs its own <script> when opened directly.'}
        </p>
      </div>

      <div className="space-y-2.5">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {t.policy_other || 'Attributes and extras'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {TOGGLES.map(toggle => {
            const on = policy[toggle.key] as boolean;
            return (
              <button
                key={toggle.key}
                onClick={() => patch({ [toggle.key]: !on } as Partial<Policy>)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left text-[11.5px] font-semibold transition-all cursor-pointer outline-none ${
                  on
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-[4px] border shrink-0 transition-all ${
                    on ? 'bg-cyan-500 border-cyan-400' : 'border-white/20'
                  }`}
                />
                <span className="leading-snug">{t[toggle.labelKey] || toggle.fallback}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PolicyEditor;
