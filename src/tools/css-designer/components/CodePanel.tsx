import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, ClipboardPaste, Code, Copy, Link2 } from 'lucide-react';
import type { CodeFormat, ColorSpace, Design, TabId } from '../types';
import { requiredFeatures } from '../lib/serialize';
import { copyText } from '../lib/clipboard';

interface CodePanelProps {
  tab: TabId;
  design: Design;
  /** Rendered by the parent so the keyboard shortcut copies the same string. */
  code: string;
  format: CodeFormat;
  setFormat: (format: CodeFormat) => void;
  space: ColorSpace;
  setSpace: (space: ColorSpace) => void;
  t: any;
  /** Returns a status message to show under the textarea. */
  onImport: (text: string) => string;
  onShare: () => void;
  shared: boolean;
}

// ---------------------------------------------------------------------------
// Minimal CSS highlighter. A full syntax library would be several kilobytes
// and a theme file for one small <pre>; this covers exactly the token kinds
// the generator can emit.
// ---------------------------------------------------------------------------

const TOKENS: { type: string; re: RegExp }[] = [
  { type: 'comment', re: /\/\*[\s\S]*?\*\// },
  { type: 'selector', re: /^[.:#][\w-]+(?=\s*\{)/m },
  { type: 'color', re: /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\([^)]*\)/ },
  { type: 'func', re: /\b(?:linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient|blur|brightness|contrast|saturate|hue-rotate|grayscale|sepia|invert|opacity|drop-shadow|var)\b/ },
  { type: 'prop', re: /(?:^|[{;\n])\s*-?-?[a-z][\w-]*(?=\s*:)/ },
  { type: 'number', re: /-?\d*\.?\d+(?:px|%|deg|rem|em|s|ms)?\b/ },
  { type: 'keyword', re: /\b(?:inset|none|circle|ellipse|solid|from|at|in|oklab|oklch|srgb|hsl|closest-side|closest-corner|farthest-side|farthest-corner)\b/ },
];

const CLASS: Record<string, string> = {
  comment: 'text-slate-600 italic',
  selector: 'text-amber-300',
  color: 'text-emerald-300',
  func: 'text-sky-300',
  prop: 'text-violet-300',
  number: 'text-orange-300',
  keyword: 'text-pink-300',
  plain: 'text-slate-400',
};

function highlight(code: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let rest = code;
  let key = 0;

  while (rest.length) {
    let best: { index: number; length: number; type: string } | null = null;
    for (const token of TOKENS) {
      const match = rest.match(token.re);
      if (!match || match.index === undefined) continue;
      // The `prop` pattern swallows the preceding separator; keep it plain.
      const offset = token.type === 'prop' ? match[0].length - match[0].trimStart().length : 0;
      const index = match.index + offset;
      const length = match[0].length - offset;
      if (!best || index < best.index) best = { index, length, type: token.type };
    }
    if (!best) {
      out.push(<span key={key++} className={CLASS.plain}>{rest}</span>);
      break;
    }
    if (best.index > 0) out.push(<span key={key++} className={CLASS.plain}>{rest.slice(0, best.index)}</span>);
    out.push(
      <span key={key++} className={CLASS[best.type]}>
        {rest.slice(best.index, best.index + best.length)}
      </span>
    );
    rest = rest.slice(best.index + best.length);
  }
  return out;
}

// ---------------------------------------------------------------------------

export const CodePanel: React.FC<CodePanelProps> = ({
  tab,
  design,
  code,
  format,
  setFormat,
  space,
  setSpace,
  t,
  onImport,
  onShare,
  shared,
}) => {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // CSS.supports is the honest way to warn: it asks the browser the user is
  // actually holding instead of guessing from a user-agent string.
  const warnings = useMemo(() => {
    if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return [];
    return requiredFeatures(tab, design)
      .filter(feature => !CSS.supports(feature.property, feature.value))
      .map(feature => feature.value.startsWith('conic') ? 'conic-gradient' : feature.property === 'backdrop-filter' ? 'backdrop-filter' : `gradient interpolation`);
  }, [tab, design]);

  // Cleared on unmount so the "Copied!" timer never fires into a dead tree.
  const copyTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  const copy = async () => {
    if (!(await copyText(code))) return;
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const formats: { id: CodeFormat; label: string }[] = [
    { id: 'css', label: 'CSS' },
    { id: 'tailwind', label: 'Tailwind' },
    { id: 'variables', label: t.format_variables || 'Variables' },
    { id: 'scss', label: 'SCSS' },
  ];

  const spaces: { id: ColorSpace; label: string }[] = [
    { id: 'hex', label: 'HEX' },
    { id: 'rgb', label: 'RGB' },
    { id: 'hsl', label: 'HSL' },
    { id: 'oklch', label: 'OKLCH' },
  ];

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
          <Code className="w-4 h-4 text-violet-400" />
          {t.code_output || 'Generated code'}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label={t.code_output || 'Generated code'} className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
            {formats.map(item => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={format === item.id}
                onClick={() => setFormat(item.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
                  format === item.id ? 'bg-violet-600 text-white' : 'bg-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label={t.color_space || 'Colour notation'} className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
            {spaces.map(item => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={space === item.id}
                onClick={() => setSpace(item.id)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none ${
                  space === item.id ? 'bg-violet-600/40 text-white' : 'bg-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <pre className="bg-[#040306] border border-white/10 rounded-2xl p-5 pt-14 sm:pt-5 sm:pr-32 font-mono text-xs leading-relaxed overflow-x-auto min-h-[132px] whitespace-pre-wrap break-words">
          <code>{highlight(code)}</code>
        </pre>

        <div className="absolute top-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={onShare}
            title={t.share_link || 'Copy a link to this design'}
            aria-label={t.share_link || 'Copy a link to this design'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all border cursor-pointer ${
              shared ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{shared ? t.copied || 'Copied!' : t.share || 'Link'}</span>
          </button>
          <button
            type="button"
            onClick={copy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all border cursor-pointer ${
              copied ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.copied || 'Copied!' : t.copy || 'Copy'}</span>
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <p className="flex items-start gap-2 text-[11px] text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {(t.support_warning || 'This browser does not support {0}, so the preview above is not showing it.').replace(
              '{0}',
              warnings.join(', ')
            )}
          </span>
        </p>
      )}

      {/* The manual route: skip every slider and start from a rule you own. */}
      <details className="group rounded-2xl border border-white/5 bg-slate-900/20 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex items-center gap-2 cursor-pointer list-none px-4 py-3 text-xs font-bold text-slate-300 hover:text-violet-300 transition-colors">
          <ClipboardPaste className="w-4 h-4 text-violet-400" />
          <span className="flex-1">{t.import_title || 'Paste existing CSS'}</span>
          <span className="text-violet-400 text-lg leading-none transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t.import_hint ||
              'Drop in a box-shadow, gradient, border-radius or filter — even a whole rule — and the controls jump to it.'}
          </p>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            spellCheck={false}
            rows={4}
            aria-label={t.import_title || 'Paste existing CSS'}
            placeholder=".card { box-shadow: 0 8px 16px -4px rgba(0,0,0,.35); }"
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-violet-500 resize-y"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setImportStatus(onImport(importText))}
              disabled={!importText.trim()}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-none"
            >
              {t.import_apply || 'Apply to controls'}
            </button>
            {importStatus && <span className="text-[11px] text-slate-400">{importStatus}</span>}
          </div>
        </div>
      </details>
    </div>
  );
};

export default CodePanel;
