import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';
import {
  ListOrdered,
  Copy,
  Check,
  Download,
  RotateCcw,
  ArrowRight,
  Shuffle,
  SortAsc,
  SortDesc,
  Trash2,
  Type,
  Wand2,
} from 'lucide-react';

interface ListMixerProps {
  lang: string;
  dictionary: any;
}

export default function ListMixer({ lang, dictionary }: ListMixerProps) {
  const t = dictionary || {};
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const countItems = (text: string) => {
    if (!text) return 0;
    return text.split('\n').filter((l) => l.trim() !== '').length;
  };

  const inputCount = countItems(input);
  const outputCount = countItems(output);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setInput(v);
    setOutput(v);
    setCopied(false);
  };

  const applyToOutput = (fn: (lines: string[]) => string[]) => {
    setOutput((prev) => fn(prev.split('\n')).join('\n'));
    setCopied(false);
  };

  const sortAsc = () =>
    applyToOutput((lines) => [...lines].sort((a, b) => a.localeCompare(b)));

  const sortDesc = () =>
    applyToOutput((lines) => [...lines].sort((a, b) => b.localeCompare(a)));

  const reverseLines = () => applyToOutput((lines) => [...lines].reverse());

  const shuffleLines = () =>
    applyToOutput((lines) => {
      const a = [...lines];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    });

  const removeDuplicateLines = () =>
    applyToOutput((lines) => {
      const seen = new Set<string>();
      return lines.filter((l) => {
        if (seen.has(l)) return false;
        seen.add(l);
        return true;
      });
    });

  const removeEmptyLines = () =>
    applyToOutput((lines) => lines.filter((l) => l.trim() !== ''));

  const trimLines = () => applyToOutput((lines) => lines.map((l) => l.trim()));

  const toLower = () => applyToOutput((lines) => lines.map((l) => l.toLowerCase()));

  const toUpper = () => applyToOutput((lines) => lines.map((l) => l.toUpperCase()));

  const removeDuplicateWords = () =>
    applyToOutput((lines) =>
      lines.map((l) => {
        const words = l.split(/\s+/).filter((w) => w.length > 0);
        const seen = new Set<string>();
        const out: string[] = [];
        for (const w of words) {
          if (!seen.has(w)) {
            seen.add(w);
            out.push(w);
          }
        }
        return out.join(' ');
      })
    );

  const resetToInput = () => {
    setOutput(input);
    setCopied(false);
  };

  const resetWorkspace = useCallback(() => {
    setInput('');
    setOutput('');
    setCopied(false);
  }, []);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `list-mixer-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const actions = [
    { id: 'sortAsc', label: t.sortAsc || 'Sort A-Z', icon: SortAsc, run: sortAsc },
    { id: 'sortDesc', label: t.sortDesc || 'Sort Z-A', icon: SortDesc, run: sortDesc },
    { id: 'reverse', label: t.reverse || 'Reverse order', icon: RotateCcw, run: reverseLines },
    { id: 'shuffle', label: t.shuffle || 'Shuffle', icon: Shuffle, run: shuffleLines },
    { id: 'dedupe', label: t.removeDuplicates || 'Remove duplicates', icon: ListOrdered, run: removeDuplicateLines },
    { id: 'removeEmpty', label: t.removeEmptyLines || 'Remove empty lines', icon: Trash2, run: removeEmptyLines },
    { id: 'trim', label: t.trimLines || 'Trim whitespace', icon: Type, run: trimLines },
    { id: 'lower', label: t.lowercase || 'Lowercase', icon: Type, run: toLower },
    { id: 'upper', label: t.uppercase || 'UPPERCASE', icon: Type, run: toUpper },
    { id: 'dedupeWords', label: t.removeDuplicateWords || 'Dedupe words in lines', icon: Wand2, run: removeDuplicateWords },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0502] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/list-mixer`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-list-mixer-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <ListOrdered className="w-8 h-8 text-orange-400" />
            <span>{t.seoHeroTitle || 'List Mixer'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(220px,260px)_minmax(0,1fr)] gap-4 lg:gap-6 items-stretch">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col overflow-hidden hover:border-orange-500/30 transition-colors">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-orange-400" />
                <span>{t.inputLabel || 'Input'}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">{inputCount} {t.itemsLabel || 'items'}</span>
            </div>
            <textarea
              value={input}
              onChange={handleInputChange}
              placeholder={t.inputPlaceholder || 'Paste your list here, one item per line...'}
              spellCheck={false}
              className="w-full h-72 lg:h-80 p-4 bg-transparent border-none outline-none resize-none text-slate-100 placeholder:text-slate-600 text-sm font-mono leading-relaxed"
            />
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col overflow-hidden hover:border-orange-500/30 transition-colors">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-orange-400" />
                <span>{t.actionsLabel || 'Actions'}</span>
              </span>
            </div>
            <div className="p-3 flex flex-col gap-2 flex-grow">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={a.run}
                    disabled={!output}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.02] hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/50 text-slate-300 hover:text-orange-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/[0.02] disabled:hover:border-white/5 disabled:hover:text-slate-300 rounded-xl text-xs font-bold tracking-wide text-left transition-all cursor-pointer"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{a.label}</span>
                  </button>
                );
              })}
              <button
                onClick={resetToInput}
                disabled={!input}
                className="mt-auto flex items-center justify-center gap-2 px-3 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/60 text-orange-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{t.resetToInput || 'Reset to input'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col overflow-hidden hover:border-orange-500/30 transition-colors">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-orange-400" />
                <span>{t.outputLabel || 'Output'}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">{outputCount} {t.itemsLabel || 'items'}</span>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder={t.outputPlaceholder || 'Processed list will appear here...'}
              spellCheck={false}
              className="w-full h-72 lg:h-80 p-4 bg-transparent border-none outline-none resize-none text-orange-200 placeholder:text-slate-600 text-sm font-mono leading-relaxed"
            />
          </div>
        </section>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm font-mono">
            <span className="text-slate-300 font-bold">
              {inputCount} <span className="text-slate-500">{t.itemsLabel || 'items'}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 font-bold">
              {outputCount} <span className="text-slate-500">{t.itemsLabel || 'items'}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!output}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/50 text-slate-300 hover:text-orange-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-orange-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (t.copiedLabel || 'Copied!') : (t.copyLabel || 'Copy')}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!output}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/60 text-orange-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadLabel || 'Download'}</span>
            </button>
          </div>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-list-mixer-bottom" />
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(modal) => setActiveModal(modal)}
      />

      <LegalModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={activeModal === 'cookies'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}
