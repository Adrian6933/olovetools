import React, { useEffect, useMemo, useRef } from 'react';
import type { AstNode, ExplainTone, LintFinding, ParseResult } from '../types';
import { walk } from '../lib/ast';

// ============================================================================
// The pattern field, with the pattern itself syntax-coloured.
// ----------------------------------------------------------------------------
// A mirror div sits behind a transparent input. Only the input scrolls; the
// mirror is `overflow-hidden` and follows it, because a mirror with its own
// scrollbar is a mirror whose text is a few pixels narrower than the input's
// — that mismatch is what makes overlay highlighting drift.
//
// The colours come straight from the AST: every node paints its own span, and
// because `walk` visits parents before children, the children overwrite the
// middle and leave the parent holding its delimiters. That is how `(` and `)`
// stay group-coloured while their body is coloured by whatever it contains.
// ============================================================================

const TONE_CLASS: Record<ExplainTone, string> = {
  anchor: 'text-cyan-300',
  quantifier: 'text-amber-300',
  group: 'text-blue-300',
  class: 'text-fuchsia-300',
  escape: 'text-violet-300',
  literal: 'text-slate-200',
  alternation: 'text-rose-300',
  backref: 'text-emerald-300',
};

const NODE_TONE: Record<AstNode['kind'], ExplainTone> = {
  alternation: 'alternation',
  sequence: 'literal',
  group: 'group',
  quantifier: 'quantifier',
  class: 'class',
  escape: 'escape',
  prop: 'class',
  backref: 'backref',
  anchor: 'anchor',
  dot: 'class',
  literal: 'literal',
};

interface PatternFieldProps {
  value: string;
  onChange: (value: string) => void;
  parsed: ParseResult | null;
  findings: LintFinding[];
  /** Character range to emphasise, from hovering an explanation line. */
  focus: { start: number; end: number } | null;
  placeholder: string;
  invalid: boolean;
  label: string;
}

export const PatternField: React.FC<PatternFieldProps> = ({
  value,
  onChange,
  parsed,
  findings,
  focus,
  placeholder,
  invalid,
  label,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  // One tone per character, then collapsed into runs.
  const runs = useMemo(() => {
    if (!value) return [] as { text: string; tone: ExplainTone; flag: 'none' | 'problem' | 'focus' }[];

    const tones: ExplainTone[] = new Array(value.length).fill('literal');
    if (parsed) {
      walk(parsed.root, node => {
        const tone = NODE_TONE[node.kind];
        for (let index = node.start; index < node.end && index < tones.length; index++) {
          tones[index] = tone;
        }
      });
    }

    const flags: ('none' | 'problem' | 'focus')[] = new Array(value.length).fill('none');
    for (const finding of findings) {
      if (finding.end <= finding.start) continue;
      for (let index = finding.start; index < finding.end && index < flags.length; index++) {
        flags[index] = 'problem';
      }
    }
    if (focus) {
      for (let index = focus.start; index < focus.end && index < flags.length; index++) {
        flags[index] = 'focus';
      }
    }

    const output: { text: string; tone: ExplainTone; flag: 'none' | 'problem' | 'focus' }[] = [];
    for (let index = 0; index < value.length; index++) {
      const last = output[output.length - 1];
      if (last && last.tone === tones[index] && last.flag === flags[index]) {
        last.text += value[index];
      } else {
        output.push({ text: value[index], tone: tones[index], flag: flags[index] });
      }
    }
    return output;
  }, [value, parsed, findings, focus]);

  // Keep the mirror pinned to the input's horizontal scroll.
  const sync = () => {
    if (inputRef.current && mirrorRef.current) {
      mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  // The caret can move the scroll without firing `scroll` in every browser
  // (arrow keys inside an overflowing input), so re-sync after every change.
  useEffect(sync, [value, focus]);

  return (
    <div className="space-y-2">
      <label htmlFor="regexflow-pattern" className="sr-only">
        {label}
      </label>
      <div
        className={`relative flex items-stretch rounded-2xl border bg-black/50 transition-colors ${
          invalid ? 'border-red-500/60' : 'border-white/10 focus-within:border-fuchsia-500/50'
        }`}
      >
        <span className="flex items-center pl-4 pr-1 text-xl font-mono text-slate-600 select-none shrink-0">/</span>

        <div className="relative flex-1 min-w-0">
          {/* mirror */}
          <div
            ref={mirrorRef}
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden whitespace-pre py-4 font-mono text-base leading-6 pointer-events-none select-none flex items-center"
          >
            <span>
              {runs.length === 0 ? (
                <span className="text-slate-600">{placeholder}</span>
              ) : (
                runs.map((run, index) => (
                  <span
                    key={index}
                    className={`${TONE_CLASS[run.tone]} ${
                      run.flag === 'problem'
                        ? 'underline decoration-wavy decoration-red-400/70 underline-offset-4'
                        : run.flag === 'focus'
                          ? 'bg-fuchsia-500/30 rounded-[3px]'
                          : ''
                    }`}
                  >
                    {run.text}
                  </span>
                ))
              )}
            </span>
          </div>

          {/* the real field, transparent so the mirror shows through */}
          <input
            id="regexflow-pattern"
            ref={inputRef}
            type="text"
            value={value}
            onChange={event => onChange(event.target.value)}
            onScroll={sync}
            onKeyUp={sync}
            onClick={sync}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-invalid={invalid}
            className="relative w-full bg-transparent py-4 font-mono text-base leading-6 text-transparent caret-fuchsia-400 outline-none"
          />
        </div>

        <span className="flex items-center pl-1 pr-4 text-xl font-mono text-slate-600 select-none shrink-0">/</span>
      </div>
    </div>
  );
};

export default PatternField;
