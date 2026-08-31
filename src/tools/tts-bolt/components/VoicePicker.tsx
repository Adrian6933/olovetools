import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Globe2, Loader2, Play, Search, Sparkles, X } from 'lucide-react';
import type { NeuralVoice } from '../types';

interface VoicePickerProps {
  voices: NeuralVoice[];
  value: string;
  onChange: (shortName: string) => void;
  /** Speaks a one-line sample. Resolves when the sample finishes. */
  onPreview?: (shortName: string) => Promise<void>;
  onClose: () => void;
  /** UI language, used to sort the user's own language to the top. */
  uiLang: string;
  t: any;
}

/**
 * 322 voices across 142 locales is unusable as a <select>. This is a filtered
 * catalogue: type to search, narrow by language and gender, and hear a voice
 * before committing the whole script to it.
 */
export const VoicePicker: React.FC<VoicePickerProps> = ({ voices, value, onChange, onPreview, onClose, uiLang, t }) => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<string>('all');
  const [gender, setGender] = useState<'all' | 'Female' | 'Male'>('all');
  const [previewing, setPreviewing] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /** Intl gives us endonyms for free, so the list reads in each own language. */
  const languageName = useMemo(() => {
    let display: Intl.DisplayNames | null = null;
    try {
      display = new Intl.DisplayNames([uiLang], { type: 'language' });
    } catch {
      display = null;
    }
    return (code: string) => {
      try {
        return display?.of(code) || code.toUpperCase();
      } catch {
        return code.toUpperCase();
      }
    };
  }, [uiLang]);

  const languages = useMemo(() => {
    const seen = new Map<string, number>();
    for (const voice of voices) seen.set(voice.language, (seen.get(voice.language) || 0) + 1);
    return [...seen.entries()]
      .map(([code, count]) => ({ code, count, label: languageName(code) }))
      .sort((a, b) => {
        if (a.code === uiLang) return -1;
        if (b.code === uiLang) return 1;
        return a.label.localeCompare(b.label);
      });
  }, [voices, languageName, uiLang]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return voices
      .filter(voice => {
        if (language !== 'all' && voice.language !== language) return false;
        if (gender !== 'all' && voice.gender !== gender) return false;
        if (!needle) return true;
        return (
          voice.displayName.toLowerCase().includes(needle) ||
          voice.locale.toLowerCase().includes(needle) ||
          voice.friendlyName.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        // The user's own language first, then multilingual voices, then A–Z.
        const langScore = (v: NeuralVoice) => (v.language === uiLang ? 0 : 1);
        if (langScore(a) !== langScore(b)) return langScore(a) - langScore(b);
        if (a.multilingual !== b.multilingual) return a.multilingual ? -1 : 1;
        if (a.locale !== b.locale) return a.locale.localeCompare(b.locale);
        return a.displayName.localeCompare(b.displayName);
      });
  }, [voices, query, language, gender, uiLang]);

  const preview = async (shortName: string) => {
    if (!onPreview || previewing) return;
    setPreviewing(shortName);
    try {
      await onPreview(shortName);
    } finally {
      setPreviewing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl max-h-[88vh] sm:max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#100a05] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <Globe2 className="w-4 h-4 text-amber-500 shrink-0" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-300 flex-1 truncate">
            {t.voicePickerTitle || 'Choose a voice'}
          </h2>
          <span className="text-[11px] font-bold text-slate-500 tabular-nums">{filtered.length}</span>
          <button
            onClick={onClose}
            aria-label={t.closeLabel || 'Close'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 space-y-3 border-b border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.voiceSearchPlaceholder || 'Search by name, language or locale…'}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500/60 cursor-pointer max-w-[60%]"
            >
              <option value="all" className="bg-[#100a05]">
                {t.voiceAllLanguages || 'All languages'}
              </option>
              {languages.map(item => (
                <option key={item.code} value={item.code} className="bg-[#100a05]">
                  {item.label} ({item.count})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-black/50 border border-white/10">
              {(['all', 'Female', 'Male'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setGender(option)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border-none ${
                    gender === option ? 'bg-amber-500/20 text-amber-300' : 'bg-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {option === 'all'
                    ? t.voiceAnyGender || 'Any'
                    : option === 'Female'
                      ? t.voiceFemale || 'Female'
                      : t.voiceMale || 'Male'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-10">{t.voiceNoResults || 'No voice matches that search.'}</p>
          )}

          {filtered.map(voice => {
            const selected = voice.shortName === value;
            return (
              <div
                key={voice.shortName}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  selected ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 bg-white/[0.015] hover:border-white/15'
                }`}
              >
                <button
                  onClick={() => {
                    onChange(voice.shortName);
                    onClose();
                  }}
                  className="flex-1 min-w-0 text-left border-none bg-transparent cursor-pointer p-0"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold ${selected ? 'text-amber-300' : 'text-slate-200'}`}>
                      {voice.displayName}
                    </span>
                    {voice.multilingual && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400">
                        <Sparkles className="w-2.5 h-2.5" />
                        {t.voiceMultilingual || 'Multilingual'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {languageName(voice.language)} · {voice.locale} ·{' '}
                    {voice.gender === 'Female' ? t.voiceFemale || 'Female' : t.voiceMale || 'Male'}
                  </div>
                </button>

                {onPreview && (
                  <button
                    onClick={() => preview(voice.shortName)}
                    disabled={previewing !== null}
                    aria-label={t.voicePreview || 'Preview'}
                    title={t.voicePreview || 'Preview'}
                    className="shrink-0 p-2 rounded-lg border border-white/10 bg-black/40 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-wait"
                  >
                    {previewing === voice.shortName ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {selected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VoicePicker;
