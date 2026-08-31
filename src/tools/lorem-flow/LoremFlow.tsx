import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUp, Check, Copy, Download, Dices, RotateCcw, Wand2 } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import {
  HeroArt,
  IconExact,
  IconFormats,
  IconOffline,
  IconRtl,
  IconScripts,
  IconSeed,
  StepAmount,
  StepFormat,
  StepScript,
  StepSeed,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { countWords, generate, randomSeed } from './lib/generate';
import { metaFor } from './lib/corpora';
import { DEFAULTS, FORMATS, MAX_COUNT, SCRIPTS, UNITS, type Format, type Options, type Script, type Unit } from './types';

interface LoremFlowProps {
  lang: string;
  dictionary: any;
}

const SCRIPT_LABEL: Record<Script, string> = {
  latin: 'Lorem ipsum',
  spanish: 'Español',
  japanese: '日本語',
  chinese: '中文',
  russian: 'Русский',
  hindi: 'हिन्दी',
  greek: 'Ελληνικά',
  arabic: 'العربية',
  emojiless: '',
};

const FORMAT_EXT: Record<Format, string> = { text: 'txt', html: 'html', markdown: 'md' };
const FORMAT_MIME: Record<Format, string> = {
  text: 'text/plain;charset=utf-8',
  html: 'text/html;charset=utf-8',
  markdown: 'text/markdown;charset=utf-8',
};

export default function LoremFlow({ lang, dictionary }: LoremFlowProps) {
  const t = dictionary || {};

  const [opts, setOpts] = useState<Options>(DEFAULTS);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const set = <K extends keyof Options>(key: K, value: Options[K]) =>
    setOpts(prev => ({ ...prev, [key]: value }));

  // Generated after mount, never during render: the text is random, and a
  // server-rendered island would disagree with the browser on hydration.
  useEffect(() => {
    setText(generate(DEFAULTS));
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The old copy handler left a dangling timer behind on unmount.
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  const meta = metaFor(opts.script);

  const stats = useMemo(() => {
    if (!text) return { words: 0, characters: 0, paragraphs: 0 };
    return {
      words: countWords(text, opts.script),
      characters: [...text].length,
      paragraphs: text.split(/\n{2,}/).filter(p => p.trim()).length,
    };
  }, [text, opts.script]);

  const handleGenerate = useCallback(() => {
    setText(generate(opts));
    setCopied(false);
  }, [opts]);

  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
  }, [text]);

  const handleDownload = useCallback(() => {
    if (!text) return;
    const blob = new Blob([text], { type: FORMAT_MIME[opts.format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lorem-${opts.script}.${FORMAT_EXT[opts.format]}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoked on a timer: Safari cancels an in-flight download if the URL goes
    // away in the same tick.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [text, opts.format, opts.script]);

  const handleReset = useCallback(() => {
    setOpts(DEFAULTS);
    setText(generate(DEFAULTS));
    setCopied(false);
  }, []);

  const unitLabel = (u: Unit) =>
    u === 'paragraphs'
      ? t.unit_paragraphs || 'Paragraphs'
      : u === 'sentences'
      ? t.unit_sentences || 'Sentences'
      : u === 'words'
      ? t.unit_words || 'Words'
      : t.unit_characters || 'Characters';

  const formatLabel = (f: Format) =>
    f === 'text' ? t.format_text || 'Plain text' : f === 'html' ? 'HTML' : 'Markdown';

  const steps = [
    { art: StepScript, title: t.step1Title || 'Pick the script', text: t.step1Text || 'Latin, Spanish, Japanese, Chinese, Russian, Hindi, Greek or Arabic — real words, not machine noise.' },
    { art: StepAmount, title: t.step2Title || 'Say how much', text: t.step2Text || 'Paragraphs, sentences, words or an exact character count, which is what a design brief usually gives you.' },
    { art: StepSeed, title: t.step3Title || 'Lock it with a seed', text: t.step3Text || 'Type any seed and the same text comes back every time, so a screenshot can be reproduced.' },
    { art: StepFormat, title: t.step4Title || 'Take it as you need it', text: t.step4Text || 'Plain text, HTML with real tags, or Markdown — copy it or download the file.' },
  ];

  const features = [
    { icon: IconScripts, title: t.feat1Title || 'Eight scripts, not one', text: t.feat1Text || 'A Latin block tells you nothing about how a layout copes with Japanese or Arabic. Here you can test with the real thing.' },
    { icon: IconRtl, title: t.feat2Title || 'Right-to-left included', text: t.feat2Text || 'Arabic output is marked as RTL, in the box and in the exported HTML, so the direction is part of the test.' },
    { icon: IconSeed, title: t.feat3Title || 'Repeatable output', text: t.feat3Text || 'A seed makes the text deterministic: the same seed gives byte-for-byte the same paragraphs.' },
    { icon: IconExact, title: t.feat4Title || 'Exact counts', text: t.feat4Text || 'Ask for 240 characters or 75 words and that is what you get, trimmed cleanly rather than rounded to a sentence.' },
    { icon: IconFormats, title: t.feat5Title || 'Text, HTML, Markdown', text: t.feat5Text || 'With optional headings and lists, so you can mock up a whole article, not just a grey block.' },
    { icon: IconOffline, title: t.feat6Title || 'Never leaves the page', text: t.feat6Text || 'Generated in your browser from a built-in word list. Nothing is fetched and nothing is uploaded.' },
  ];

  const faq: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden pt-36 md:pt-24">
      <Header currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/lorem-flow`)} t={t} />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, so reserving 440px from 1400px up is
          what keeps them visible instead of silently suppressed. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col gap-12 md:gap-20">
        <AdBanner id="adsense-lorem-flow-top" />

        {/* Hero ------------------------------------------------------------ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-violet-300">
              <Wand2 className="w-3.5 h-3.5" />
              {t.heroBadge || 'Runs in your browser'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.seoHeroTitle || 'LoremFlow'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">{t.seoHeroText}</p>
            <a
              href="#how-it-works"
              className="inline-block px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-violet-500/30 font-bold text-sm transition-all"
            >
              {t.heroSecondary || 'See how it works'}
            </a>
          </div>
          <HeroArt className="w-full h-auto max-w-lg mx-auto" />
        </section>

        {/* Generator -------------------------------------------------------- */}
        <section className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 md:p-8 space-y-6">
          {/* script */}
          <div className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-violet-400/80">
              {t.label_script || 'Script'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SCRIPTS.map(s => (
                <button
                  key={s}
                  onClick={() => set('script', s)}
                  lang={s === 'japanese' ? 'ja' : s === 'chinese' ? 'zh' : s === 'arabic' ? 'ar' : undefined}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    opts.script === s
                      ? 'bg-violet-500/20 text-violet-200 border-violet-500/40'
                      : 'bg-slate-950/60 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {SCRIPT_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* amount + format */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-violet-400/80">
                {t.label_unit_type || 'Unit'}
              </span>
              <div className="inline-flex flex-wrap rounded-xl bg-slate-950/60 border border-white/5 p-1">
                {UNITS.map(u => (
                  <button
                    key={u}
                    onClick={() => set('unit', u)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      opts.unit === u ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {unitLabel(u)}
                  </button>
                ))}
              </div>
            </div>

            <label className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-violet-400/80">
                {t.label_count || 'Count'}
              </span>
              <input
                type="number"
                min={1}
                max={MAX_COUNT[opts.unit]}
                value={opts.count}
                onChange={e => set('count', Math.max(1, Math.min(MAX_COUNT[opts.unit], Number(e.target.value) || 1)))}
                className="w-24 px-3 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 focus:border-violet-500/50 font-mono text-sm text-white outline-none transition-colors"
              />
            </label>

            <div className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-violet-400/80">
                {t.label_format || 'Format'}
              </span>
              <div className="inline-flex rounded-xl bg-slate-950/60 border border-white/5 p-1">
                {FORMATS.map(f => (
                  <button
                    key={f}
                    onClick={() => set('format', f)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      opts.format === f ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {formatLabel(f)}
                  </button>
                ))}
              </div>
            </div>

            <label className="space-y-1.5 flex-1 min-w-[10rem]">
              <span className="block text-[10px] font-black uppercase tracking-widest text-violet-400/80">
                {t.label_seed || 'Seed (optional)'}
              </span>
              <span className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={opts.seed}
                  onChange={e => set('seed', e.target.value)}
                  placeholder={t.seedPlaceholder || 'empty = new every time'}
                  spellCheck={false}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 focus:border-violet-500/50 font-mono text-sm text-white outline-none transition-colors placeholder-slate-600"
                />
                <button
                  onClick={() => set('seed', randomSeed())}
                  title={t.newSeed || 'New seed'}
                  aria-label={t.newSeed || 'New seed'}
                  className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-violet-300 hover:border-violet-500/30 transition-all cursor-pointer shrink-0"
                >
                  <Dices className="w-4 h-4" />
                </button>
              </span>
            </label>
          </div>

          {/* toggles + generate */}
          <div className="flex flex-wrap items-center gap-4">
            {opts.script === 'latin' && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opts.startClassic}
                  onChange={e => set('startClassic', e.target.checked)}
                  className="w-4 h-4 accent-violet-500 cursor-pointer"
                />
                {t.label_start_lorem || 'Start with "Lorem ipsum"'}
              </label>
            )}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={opts.richStructure}
                onChange={e => set('richStructure', e.target.checked)}
                className="w-4 h-4 accent-violet-500 cursor-pointer"
              />
              {t.label_rich || 'Add headings and lists'}
            </label>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-violet-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.button_reset || 'Reset'}
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white text-xs font-black hover:bg-violet-400 active:scale-95 transition-all shadow-lg shadow-violet-500/25 cursor-pointer"
              >
                <Wand2 className="w-4 h-4" />
                {t.button_generate || 'Generate'}
              </button>
            </div>
          </div>

          {/* output */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-400/80">
                {t.label_output || 'Generated text'}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {(t.statsLine || '{w} words · {c} characters · {p} paragraphs')
                    .replace('{w}', String(stats.words))
                    .replace('{c}', String(stats.characters))
                    .replace('{p}', String(stats.paragraphs))}
                </span>
                <button
                  onClick={handleCopy}
                  disabled={!text}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    copied
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-violet-500/30'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t.message_copied || 'Copied!' : t.button_copy || 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!text}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-violet-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  .{FORMAT_EXT[opts.format]}
                </button>
              </div>
            </div>

            {/* dir on the box itself: an RTL script laid out left-to-right is
                exactly the bug this tool is meant to expose, not reproduce. */}
            <textarea
              readOnly
              value={text}
              dir={meta.rtl && opts.format === 'text' ? 'rtl' : 'ltr'}
              lang={opts.script === 'japanese' ? 'ja' : opts.script === 'chinese' ? 'zh' : opts.script === 'arabic' ? 'ar' : undefined}
              aria-label={t.label_output || 'Generated text'}
              placeholder={t.message_empty || 'Press Generate to create placeholder text.'}
              className={`w-full h-72 px-4 py-3 rounded-2xl bg-slate-950/50 border border-white/5 focus:border-violet-500/50 text-sm text-slate-200 outline-none transition-colors resize-y leading-relaxed ${
                opts.format === 'text' ? '' : 'font-mono text-xs'
              }`}
            />
          </div>
        </section>

        <AdBanner id="adsense-lorem-flow-mid" />

        {/* How it works ---------------------------------------------------- */}
        <section id="how-it-works" className="space-y-8 scroll-mt-28">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.howTitle || 'How it works'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 space-y-3">
                <s.art />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-violet-500/15 text-violet-300 text-[11px] font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features -------------------------------------------------------- */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.featuresTitle || 'What it actually does'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10">
                  <f.icon />
                </div>
                <h3 className="text-sm font-black text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------- */}
        {faq.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
              {t.faqTitle || 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto w-full">
              {faq.map((item, i) => (
                <details key={i} className="group glass-card rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-violet-300 transition-colors">
                    <span>{item.question}</span>
                    <span className="text-violet-400 text-lg leading-none shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-lorem-flow-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={m => setLegalModal(m)} />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTop || 'Back to top'}
          className="fixed bottom-6 right-6 z-[190] w-11 h-11 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 hover:bg-violet-400 transition-all cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}
