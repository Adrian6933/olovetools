import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check, Circle, Download, Eraser, Hand, Keyboard, Loader2, Paintbrush,
  RotateCcw, Redo2, Square, Trash2, Undo2, Wand2, X,
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import EditorStage from './components/EditorStage';
import FillPanel from './components/FillPanel';
import NextStepBar from './components/NextStepBar';
import {
  HeroArt, IconHistory, IconLocal, IconMask, IconPatch, IconStructure, IconWorker, STEP_ART,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { useEditor } from './lib/useEditor';
import { DEFAULT_FILL } from './lib/types';
import type { FillSettings, OutputFormat, Tool } from './lib/types';

interface CleansnapProps {
  lang: string;
  dictionary: any;
}

const FEATURE_ICONS = [IconPatch, IconStructure, IconWorker, IconMask, IconLocal, IconHistory];

const FORMATS: { id: OutputFormat; label: string; ext: string }[] = [
  { id: 'image/png', label: 'PNG', ext: 'png' },
  { id: 'image/jpeg', label: 'JPG', ext: 'jpg' },
  { id: 'image/webp', label: 'WEBP', ext: 'webp' },
];

export default function Cleansnap({ lang, dictionary }: CleansnapProps) {
  const t = dictionary || {};
  const ui = t.ui || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const editor = useEditor();
  const {
    work, mask, image, version, load, close, apply, cancel, clearMask, invertMask,
    undo, redo, reset, toBlob, bump, busy, loading, progress, lastMs, error, setError,
    canUndo, canRedo,
  } = editor;

  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(40);
  const [settings, setSettings] = useState<FillSettings>(DEFAULT_FILL);
  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(92);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useHandoffIntake(file => { void load(file); });

  const pick = useCallback((files: FileList | null) => {
    if (files && files[0]) void load(files[0]);
  }, [load]);

  // --- Atajos ---------------------------------------------------------------
  useEffect(() => {
    if (!image) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === 'b') setTool('brush');
      else if (key === 'e') setTool('eraser');
      else if (key === 'r') setTool('rect');
      else if (key === 'c') setTool('circle');
      else if (key === 'h') setTool('pan');
      else if (key === '[') setBrushSize(s => Math.max(4, s - 6));
      else if (key === ']') setBrushSize(s => Math.min(300, s + 6));
      else if (event.key === 'Enter') { event.preventDefault(); void apply(settings); }
      else if (event.key === 'Escape') clearMask();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [image, apply, settings, undo, redo, clearMask]);

  // --- Descarga y encadenado ------------------------------------------------

  const baseName = useCallback(() => {
    if (!image) return 'cleansnap';
    return (image.name.replace(/\.[^.]+$/, '') || 'cleansnap').replace(/[^a-z0-9-_]+/gi, '_');
  }, [image]);

  const download = useCallback(async () => {
    const blob = await toBlob(format, quality);
    if (!blob) return;
    const entry = FORMATS.find(f => f.id === format)!;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName()}_clean.${entry.ext}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [toBlob, format, quality, baseName]);

  const handoffResult = useCallback(async () => {
    const blob = await toBlob(format, quality);
    if (!blob) return null;
    const entry = FORMATS.find(f => f.id === format)!;
    return { blob, name: `${baseName()}_clean.${entry.ext}` };
  }, [toBlob, format, quality, baseName]);

  // --- Datos del diccionario ------------------------------------------------

  const faqs: any[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const steps: any[] = Array.isArray(t.how?.steps) ? t.how.steps : [];
  const features: any[] = Array.isArray(t.features?.items) ? t.features.items : [];

  const toolButton = (id: Tool, icon: React.ReactNode, label: string, shortcut: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTool(id)}
      title={`${label} (${shortcut})`}
      aria-label={label}
      aria-pressed={tool === id}
      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
        tool === id
          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/cleansnap`)}
        onReset={close}
        t={t}
      />

      {/* El max-w vive en el <main> porque AdRail mide ESTE elemento para decidir
          si los raíles fijos caben. Medido: 205 px de hueco por lado a 1440 y
          385 a 1800, por encima de los 168/208 que pide cada raíl. */}
      <main className="flex-grow w-full max-w-5xl mx-auto min-[1400px]:max-w-[min(64rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col gap-8">
        <AdBanner id="adsense-cleansnap-top" />

        {error && (
          <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <span className="flex-1 text-sm font-medium text-amber-200 leading-relaxed">
              {ui.errors?.[error] || error}
            </span>
            <button type="button" onClick={() => setError(null)} aria-label={ui.dismiss} className="text-amber-300/70 hover:text-amber-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <input ref={fileInput} type="file" accept="image/*,.heic,.heif" className="hidden"
          onChange={e => { pick(e.target.files); e.target.value = ''; }} />

        {!image ? (
          /* ------------------------------ Portada ------------------------------ */
          <>
            <section className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-black uppercase tracking-[0.2em]">
                  {t.hero?.badge}
                </span>
                <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.1] break-words">
                  {t.hero?.title}{' '}
                  <span className="text-violet-400">{t.hero?.titleHighlight}</span>
                </h1>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {t.hero?.subtitle}
                </p>
                <ul className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2">
                  {[t.hero?.trust1, t.hero?.trust2, t.hero?.trust3].filter(Boolean).map((line, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {line}
                    </li>
                  ))}
                </ul>
              </div>
              <HeroArt className="w-full max-w-md mx-auto h-auto" />
            </section>

            <div
              onClick={() => fileInput.current?.click()}
              onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setDragging(false); }}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInput.current?.click(); }}
              className={`group rounded-3xl border-2 border-dashed cursor-pointer px-6 py-14 sm:py-20 flex flex-col items-center justify-center text-center gap-4 transition-colors ${
                dragging ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 bg-white/[0.015] hover:border-violet-500/40'
              }`}
            >
              <svg viewBox="0 0 72 56" className="w-16 h-12" fill="none" aria-hidden="true">
                <path d="M6 34v12a4 4 0 0 0 4 4h52a4 4 0 0 0 4-4V34" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 34h16l4 7h20l4-7h16" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                <rect x="26" y="4" width="20" height="22" rx="3" fill="#8b5cf6" fillOpacity="0.14" stroke="#a78bfa" strokeWidth="2" />
                <path d="M36 10v10M31.5 16l4.5 4.5 4.5-4.5" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="space-y-2 max-w-md">
                <p className="text-lg sm:text-xl font-black text-white">{ui.dropTitle}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{ui.dropHint}</p>
                <p className="text-[11px] font-mono text-slate-500">JPG · PNG · WEBP · AVIF · GIF · HEIC</p>
              </div>
              {loading && (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-violet-300">
                  <Loader2 className="w-4 h-4 animate-spin" /> {ui.reading}
                </span>
              )}
            </div>

            {steps.length > 0 && (
              <section className="space-y-7">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t.how?.title}</h2>
                  <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">{t.how?.subtitle}</p>
                </div>
                <ol className="grid sm:grid-cols-3 gap-5">
                  {steps.slice(0, 3).map((step, i) => {
                    const Art = STEP_ART[i];
                    return (
                      <li key={i} className="glass-card rounded-3xl p-6 space-y-4">
                        <Art />
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">{i + 1}</span>
                          <h3 className="text-base font-bold text-white">{step.title}</h3>
                          <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            <AdBanner id="adsense-cleansnap-mid" />

            {features.length > 0 && (
              <section className="space-y-7">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center">{t.features?.title}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {features.slice(0, 6).map((feature, i) => {
                    const Icon = FEATURE_ICONS[i];
                    const tint = ['text-violet-400', 'text-fuchsia-400', 'text-sky-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400'][i];
                    return (
                      <article key={i} className="glass-card rounded-3xl p-6 space-y-3">
                        <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 ${tint}`}>
                          <Icon />
                        </span>
                        <h3 className="text-base font-bold text-white">{feature.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {faqs.length > 0 && (
              <section className="space-y-5">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center">{t.faqTitle}</h2>
                <div className="grid gap-3 max-w-3xl mx-auto w-full">
                  {faqs.map((faq, i) => (
                    <details key={i} className="glass-card rounded-2xl px-5 py-4 group [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-sm sm:text-base font-bold text-white">
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-violet-400 text-xl leading-none transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="text-sm text-slate-400 leading-relaxed pt-3">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {keywords.length > 0 && (
              <section className="space-y-4 opacity-60 text-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">{keyword}</span>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          /* ------------------------------- Editor ------------------------------- */
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={close}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer">
                <RotateCcw className="w-4 h-4" /> {ui.newImage}
              </button>
              <span className="font-mono text-[11px] text-slate-500">
                {image.width}×{image.height}
              </span>
              {image.scaled && (
                <span className="text-[11px] font-bold text-amber-300/90">
                  {(ui.scaledNote || '').replace('{w}', String(image.sourceWidth)).replace('{h}', String(image.sourceHeight))}
                </span>
              )}
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-600 ml-auto">
                <Keyboard className="w-3.5 h-3.5" /> {ui.shortcuts}
              </span>
            </div>

            {/* flex-col en móvil y flex-row en escritorio: el panel lleva
                `lg:w-[340px]`, nunca `flex-1` a secas, que sobre el eje
                vertical pondría flex-basis:0 y aplastaría el lienzo. */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="w-full lg:flex-1 min-w-0 space-y-4">
                <div className="glass-card rounded-2xl p-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {toolButton('brush', <Paintbrush className="w-5 h-5" />, ui.brush, 'B')}
                    {toolButton('rect', <Square className="w-5 h-5" />, ui.rect, 'R')}
                    {toolButton('circle', <Circle className="w-5 h-5" />, ui.circle, 'C')}
                    {toolButton('eraser', <Eraser className="w-5 h-5" />, ui.eraser, 'E')}
                    {toolButton('pan', <Hand className="w-5 h-5" />, ui.pan, 'H')}
                  </div>

                  {(tool === 'brush' || tool === 'eraser') && (
                    <label className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{ui.size}</span>
                      <input type="range" min={4} max={300} value={brushSize}
                        onChange={e => setBrushSize(Number(e.target.value))}
                        className="w-24 sm:w-32 h-1.5 rounded bg-white/10 accent-violet-500 cursor-pointer" />
                      <span className="font-mono text-xs text-slate-300 w-8 tabular-nums">{brushSize}</span>
                    </label>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button type="button" onClick={invertMask} title={ui.invert}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer">
                      {ui.invert}
                    </button>
                    <button type="button" onClick={clearMask} title={ui.clearSel}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">{ui.clearSel}</span>
                    </button>
                  </div>
                </div>

                <EditorStage
                  key={`${image.name}-${image.width}x${image.height}`}
                  work={work}
                  mask={mask}
                  original={editor.original}
                  version={version}
                  tool={tool}
                  brushSize={brushSize}
                  busy={busy}
                  progress={progress}
                  onMaskChanged={bump}
                  t={ui}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => void apply(settings)} disabled={busy}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {busy ? `${Math.round(progress * 100)}%` : ui.apply}
                  </button>
                  {busy && (
                    <button type="button" onClick={cancel}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-sm transition-colors cursor-pointer">
                      <X className="w-4 h-4" /> {ui.cancel}
                    </button>
                  )}
                  <button type="button" onClick={undo} disabled={!canUndo || busy}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-sm transition-colors cursor-pointer disabled:opacity-40">
                    <Undo2 className="w-4 h-4" /> {ui.undo}
                  </button>
                  <button type="button" onClick={redo} disabled={!canRedo || busy}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-sm transition-colors cursor-pointer disabled:opacity-40">
                    <Redo2 className="w-4 h-4" /> {ui.redo}
                  </button>
                  <button type="button" onClick={reset} disabled={busy}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-sm transition-colors cursor-pointer disabled:opacity-40">
                    <RotateCcw className="w-4 h-4" /> {ui.reset}
                  </button>
                  {lastMs !== null && !busy && (
                    <span className="font-mono text-[11px] text-emerald-400">
                      {(ui.tookMs || '{ms} ms').replace('{ms}', String(lastMs))}
                    </span>
                  )}
                </div>

                <NextStepBar lang={lang} t={t.next || {}} getResult={handoffResult} />
              </div>

              <aside className="w-full lg:w-[340px] shrink-0 glass-card rounded-3xl p-6 space-y-6 lg:sticky lg:top-28">
                <FillPanel settings={settings} onChange={setSettings} t={ui.fill || {}} />

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{ui.output}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {FORMATS.map(entry => (
                      <button key={entry.id} type="button" onClick={() => setFormat(entry.id)}
                        className={`py-2 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                          format === entry.id
                            ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200'
                            : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                        }`}>
                        {entry.label}
                      </button>
                    ))}
                  </div>
                  {format !== 'image/png' && (
                    <label className="block space-y-1.5">
                      <span className="flex justify-between text-xs font-bold text-slate-300">
                        {ui.quality} <span className="font-mono text-white">{quality}%</span>
                      </span>
                      <input type="range" min={40} max={100} value={quality}
                        onChange={e => setQuality(Number(e.target.value))}
                        className="w-full h-1.5 rounded bg-white/10 accent-violet-500 cursor-pointer" />
                    </label>
                  )}
                  <button type="button" onClick={() => void download()} disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black hover:bg-violet-500 hover:text-white font-black text-sm transition-colors cursor-pointer disabled:opacity-40">
                    <Download className="w-4 h-4" /> {ui.download}
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}

        <AdBanner id="adsense-cleansnap-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setLegalModal(modal)} />
      <LegalModal isOpen={legalModal === 'privacy'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'} content={legalTranslations[lang]?.privacy.content} t={t} />
      <LegalModal isOpen={legalModal === 'terms'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.terms.title || 'Terms of Service'} content={legalTranslations[lang]?.terms.content} t={t} />
      <LegalModal isOpen={legalModal === 'cookies'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'} content={legalTranslations[lang]?.cookies.content} t={t} />
    </div>
  );
}
