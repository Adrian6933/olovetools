import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp, Check, Download, FileArchive, Home, Keyboard, Layers, Loader2, Mail, Play, X,
} from 'lucide-react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import ControlPanel from './components/ControlPanel';
import PreviewStage from './components/PreviewStage';
import NextStepBar from './components/NextStepBar';
import {
  HeroArt, IconBatch, IconBudget, IconCores, IconLocal, IconProbe, IconQuality, STEP_ART,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { ssimBand } from '../../lib/imageMetrics';
import { probeFormats } from './lib/formats';
import { MAX_FILES, useQueue } from './lib/useQueue';
import type { FormatInfo } from './lib/types';
import type { Language } from '../../locales/meta';

interface FormatflowProps {
  lang: Language;
  dictionary?: any;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1))} ${units[index]}`;
}

function baseName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

const FEATURE_ICONS = [IconCores, IconProbe, IconQuality, IconBudget, IconLocal, IconBatch];

const Formatflow: React.FC<FormatflowProps> = ({ lang, dictionary: propDictionary }) => {
  const dictionary = propDictionary || {};
  const language = (lang || 'en') as Language;
  const t = dictionary.app || {};
  const tHero = dictionary.hero || {};
  const tDrop = dictionary.dropzone || {};
  const tStage = dictionary.stage || {};
  const tControls = dictionary.controls || {};
  const tEditor = dictionary.editor || {};
  const tNext = dictionary.next || {};
  const tHow = dictionary.how || {};
  const tFeatures = dictionary.features || {};
  const tFormats = dictionary.formats || {};

  const queue = useQueue();
  const {
    items, selected, setSelected, active, settings, effectiveSettings,
    setSettings, setItemSettings, undo, redo, canUndo, canRedo,
    addFiles, removeItem, clearAll, convertSelected, convertAll,
    busy, progress, livePreview, setLivePreview, notice, setNotice, poolSize,
  } = queue;

  const [formats, setFormats] = useState<FormatInfo[]>([]);
  const [showTop, setShowTop] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [zipping, setZipping] = useState(false);
  const addMoreRef = useRef<HTMLInputElement>(null);

  // El catálogo se contrasta con el navegador una sola vez, antes de enseñar
  // ningún botón de formato.
  useEffect(() => {
    let alive = true;
    probeFormats().then(result => { if (alive) setFormats(result); });
    return () => { alive = false; };
  }, []);

  // Recoge un archivo que venga de otra herramienta de la suite.
  useHandoffIntake(file => { addFiles([file]); });

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Pegar una imagen. Sin `items` en las dependencias: el listener no depende
  // de la cola, y volver a registrarlo en cada cambio era gratuito sólo en
  // apariencia — se perdían los pegados hechos durante el re-registro.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files: File[] = [];
      const list = event.clipboardData && event.clipboardData.items;
      if (!list) return;
      for (const entry of Array.from(list)) {
        if (entry.type.indexOf('image') === -1) continue;
        const blob = entry.getAsFile();
        if (blob) {
          const ext = (blob.type.split('/')[1] || 'png').replace('+xml', '');
          files.push(new File([blob], `pasted-${Date.now()}.${ext}`, { type: blob.type }));
        }
      }
      if (files.length > 0) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  // --- Atajos ---------------------------------------------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (items.length === 0) return;

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

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSelected(Math.min(items.length - 1, selected + 1));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSelected(Math.max(0, selected - 1));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        convertSelected();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (active) { event.preventDefault(); removeItem(active.id); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, selected, active, setSelected, convertSelected, removeItem, undo, redo]);

  // --- Descargas ------------------------------------------------------------

  const downloadOne = useCallback(() => {
    if (!active || !active.result) return;
    const link = document.createElement('a');
    link.href = active.result.url;
    link.download = `${baseName(active.file.name)}.${active.result.ext}`;
    // Append the anchor for Firefox/Safari, which can ignore clicks on a
    // detached element when the URL points at a Blob.
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [active]);

  const downloadZip = useCallback(async () => {
    const ready = items.filter(item => item.result);
    if (ready.length === 0) return;
    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const used = new Map<string, number>();
      ready.forEach(item => {
        // El motor viejo prefijaba todo con "1_", "2_"... aunque no hiciera
        // falta. Aquí sólo se numera cuando el nombre se repite de verdad.
        const stem = `${baseName(item.file.name)}.${item.result!.ext}`;
        const seen = used.get(stem) || 0;
        used.set(stem, seen + 1);
        zip.file(seen === 0 ? stem : `${baseName(item.file.name)}-${seen + 1}.${item.result!.ext}`, item.result!.blob);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `formatflow-${ready.length}.zip`;
      link.click();
      // Keep the generated archive available while the browser starts the
      // download, especially for large batches.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setZipping(false);
    }
  }, [items]);

  const handoffResult = useCallback(async () => {
    if (!active || !active.result) return null;
    return { blob: active.result.blob, name: `${baseName(active.file.name)}.${active.result.ext}` };
  }, [active]);

  const copyEmail = () => {
    navigator.clipboard.writeText('adrian.contact.me.69@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const readyCount = useMemo(() => items.filter(item => item.result).length, [items]);
  const overrideOn = !!(active && active.settings);

  const faqs: any[] = Array.isArray(dictionary.faq) ? dictionary.faq : [];
  const keywords: string[] = Array.isArray(dictionary.seoKeywords) ? dictionary.seoKeywords : [];
  const steps: any[] = Array.isArray(tHow.steps) ? tHow.steps : [];
  const featureItems: any[] = Array.isArray(tFeatures.items) ? tFeatures.items : [];
  const formatRows: any[] = Array.isArray(tFormats.rows) ? tFormats.rows : [];

  return (
    <div className="min-h-screen bg-dark text-slate-200 font-sans flex flex-col relative z-0">
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[25%] h-[25%] bg-secondary/20 blur-[120px] rounded-full" />
      </div>

      <Header language={language} dictionary={dictionary} onLanguageChange={next => { window.location.href = `/${next.toLowerCase()}/formatflow`; }} onHomeClick={clearAll} />

      {/* El max-w va en el <main> a propósito: AdRail mide ESTE elemento para
          decidir si los raíles fijos caben. Con el `container mx-auto` que
          había antes el hueco era de 57px a 1400px y de 132px a 1800px, por
          debajo de los 168/208px que pide el raíl, así que no salían nunca en
          ningún ancho de pantalla. La fórmula reserva 120/160px de raíl más
          24px de aire a cada lado. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-10">
        <AdBanner id="adsense-formatflow-top" />

        {notice && (
          <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <span className="flex-1 text-sm font-medium text-amber-200 leading-relaxed">{tDrop[notice] || notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label={tEditor.dismiss} className="text-amber-300/70 hover:text-amber-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {items.length === 0 ? (
          /* ------------------------------- Portada ------------------------------- */
          <>
            <section className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-4">
              <div className="space-y-6 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                  {tHero.badge}
                </span>
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-display font-black text-white tracking-tight leading-[1.05] break-words">
                  {tHero.title}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-love to-secondary">{tHero.titleHighlight}</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">{tHero.subtitle}</p>
                <ul className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2">
                  {[tHero.trust1, tHero.trust2, tHero.trust3].filter(Boolean).map((line, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {line}
                    </li>
                  ))}
                </ul>
              </div>
              <HeroArt className="w-full max-w-md mx-auto h-auto" />
            </section>

            <DropZone onFiles={addFiles} t={tDrop} />

            {busy && progress && (
              <p className="text-center text-xs font-bold text-slate-400">
                {tEditor.reading} {progress.current}/{progress.total}
              </p>
            )}

            {/* Cómo funciona */}
            {steps.length > 0 && (
              <section className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{tHow.title}</h2>
                  <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">{tHow.subtitle}</p>
                </div>
                <ol className="grid sm:grid-cols-3 gap-5">
                  {steps.slice(0, 3).map((step, index) => {
                    const Art = STEP_ART[index];
                    return (
                      <li key={index} className="glass-card rounded-3xl p-6 space-y-4">
                        <Art />
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{index + 1}</span>
                          <h3 className="text-base font-bold text-white">{step.title}</h3>
                          <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            <AdBanner id="adsense-formatflow-mid" />

            {/* Features */}
            {featureItems.length > 0 && (
              <section className="space-y-8">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center">{tFeatures.title}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featureItems.slice(0, 6).map((feature, index) => {
                    const Icon = FEATURE_ICONS[index];
                    const tint = ['text-primary', 'text-secondary', 'text-emerald-400', 'text-amber-400', 'text-love', 'text-sky-400'][index];
                    return (
                      <article key={index} className="glass-card rounded-3xl p-6 space-y-3">
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

            {/* Formatos, con lo que hace cada uno de verdad */}
            {formatRows.length > 0 && (
              <section className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{tFormats.title}</h2>
                  <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">{tFormats.subtitle}</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formatRows.map((row, index) => (
                    <div key={index} className="glass-card rounded-2xl p-5 space-y-2">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-black tracking-widest">{row.label}</span>
                      <p className="text-sm text-slate-400 leading-relaxed">{row.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
              <section className="space-y-5">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center">{dictionary.faqTitle}</h2>
                <div className="grid gap-3 max-w-3xl mx-auto w-full">
                  {faqs.map((faq, index) => (
                    <details key={index} className="glass-card rounded-2xl px-5 py-4 group [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-sm sm:text-base font-bold text-white">
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-primary text-xl leading-none transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="text-sm text-slate-400 leading-relaxed pt-3">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {keywords.length > 0 && (
              <section className="space-y-4 opacity-60 text-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{dictionary.seoKeywordsTitle}</h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">{keyword}</span>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          /* -------------------------------- Editor -------------------------------- */
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer">
                <Home className="w-4 h-4" /> {tEditor.startOver}
              </button>
              <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
                <Layers className="w-3.5 h-3.5" /> {items.length} / {MAX_FILES}
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                <Keyboard className="w-3.5 h-3.5" /> {tEditor.shortcuts}
              </span>
            </div>

            {/* flex-col en móvil, flex-row en escritorio. El panel lleva
                `lg:flex-1` y no `flex-1`: en la columna, flex-1 pone
                flex-basis:0 sobre el eje vertical y aplasta el panel. */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="w-full lg:flex-1 min-w-0 space-y-5">
                {active && (
                  <PreviewStage
                    originalUrl={active.thumbUrl}
                    resultUrl={active.result ? active.result.url : null}
                    stale={active.stale}
                    busy={busy}
                    t={tStage}
                  />
                )}

                {/* Resultado medido */}
                {active && (
                  <div className="glass-card rounded-2xl p-5">
                    {active.result ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Stat label={tEditor.dimensions} value={`${active.result.width}×${active.result.height}`} />
                        <Stat
                          label={tEditor.size}
                          value={formatBytes(active.result.size)}
                          tone={active.result.size < active.originalSize ? 'good' : 'warn'}
                          note={`${active.result.size < active.originalSize ? '−' : '+'}${Math.abs(Math.round((1 - active.result.size / active.originalSize) * 100))}% ${tEditor.vsOriginal}`}
                        />
                        <Stat label={tEditor.quality} value={`${active.result.quality}%`}
                          note={active.result.attempts > 1 ? `${active.result.attempts} ${tEditor.attempts}` : undefined} />
                        <Stat
                          label="SSIM"
                          value={active.result.ssim === null ? '—' : active.result.ssim.toFixed(3)}
                          tone={active.result.ssim === null ? undefined : active.result.ssim >= 0.95 ? 'good' : 'warn'}
                          note={active.result.ssim === null ? undefined : tEditor.ssimBands[ssimBand(active.result.ssim)]}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">{tEditor.notConverted}</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{tEditor.notConvertedHint}</p>
                      </div>
                    )}
                    {active.result && active.result.detail === 'ico-multisize' && (
                      <p className="mt-3 text-xs text-slate-400 leading-relaxed">{tEditor.icoMultisize}</p>
                    )}
                    {active.result && active.result.missedTarget && (
                      <p className="mt-3 text-xs font-bold text-amber-300">{tEditor.missedTarget}</p>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={convertSelected} disabled={busy}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-black hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {tEditor.convert}
                  </button>
                  {items.length > 1 && (
                    <button type="button" onClick={convertAll} disabled={busy}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-black hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                      <Layers className="w-4 h-4" /> {tEditor.convertAll}
                    </button>
                  )}
                  <button type="button" onClick={downloadOne} disabled={!active || !active.result}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/70 border border-slate-700 text-sm font-bold text-slate-200 hover:border-slate-500 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                    <Download className="w-4 h-4" /> {tEditor.download}
                  </button>
                  {items.length > 1 && (
                    <button type="button" onClick={downloadZip} disabled={readyCount === 0 || zipping}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/70 border border-slate-700 text-sm font-bold text-slate-200 hover:border-slate-500 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                      {zipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
                      {tEditor.downloadZip} ({readyCount})
                    </button>
                  )}
                </div>

                {progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <span>{tEditor.converting}</span>
                      <span className="font-mono">{progress.current}/{progress.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-300"
                        style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }} />
                    </div>
                  </div>
                )}

                {active && active.result && (
                  <NextStepBar lang={language} t={tNext} getResult={handoffResult} />
                )}

                {/* Cola */}
                <div className="glass-card rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{tEditor.queue}</h2>
                    <button type="button" onClick={() => addMoreRef.current && addMoreRef.current.click()}
                      disabled={items.length >= MAX_FILES}
                      className="text-[11px] font-bold text-primary hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                      + {tEditor.addMore}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[280px] overflow-y-auto">
                    {items.map((item, index) => (
                      <div key={item.id} className="relative group">
                        <button type="button" onClick={() => setSelected(index)}
                          className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-colors cursor-pointer ${
                            index === selected ? 'border-primary' : item.settings ? 'border-secondary/50' : 'border-slate-800 hover:border-slate-600'
                          }`}>
                          {item.thumbUrl
                            ? <img src={item.thumbUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="flex w-full h-full items-center justify-center text-[10px] text-slate-600">…</span>}
                        </button>
                        {item.result && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500/90 text-[9px] font-black text-white uppercase">
                            {item.result.ext}
                          </span>
                        )}
                        <button type="button" onClick={() => removeItem(item.id)} aria-label={tEditor.remove}
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input ref={addMoreRef} type="file" className="hidden" accept="image/*,.heic,.heif,.tif,.tiff" multiple
                    onChange={e => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
                </div>
              </div>

              {/* Panel de mandos */}
              <aside className="w-full lg:w-[360px] xl:w-[380px] shrink-0 glass-card rounded-3xl p-6 lg:sticky lg:top-24">
                {items.length > 1 && active && (
                  <label className="flex items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-800 cursor-pointer">
                    <span className="text-xs font-bold text-slate-300 leading-snug">
                      {tEditor.perImage}
                      <span className="block font-medium text-slate-500 mt-0.5">
                        {overrideOn ? tEditor.perImageOn : tEditor.perImageOff}
                      </span>
                    </span>
                    <input type="checkbox" checked={overrideOn}
                      onChange={e => setItemSettings(active.id, e.target.checked ? { ...settings } : null)}
                      className="w-4 h-4 accent-purple-500 cursor-pointer shrink-0" />
                  </label>
                )}
                <ControlPanel
                  formats={formats}
                  settings={effectiveSettings}
                  onChange={next => (overrideOn && active ? setItemSettings(active.id, next) : setSettings(next))}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  livePreview={livePreview}
                  onLivePreview={setLivePreview}
                  sourceWidth={active ? active.width : 0}
                  sourceHeight={active ? active.height : 0}
                  t={tControls}
                />
                <p className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-600 leading-relaxed">
                  {(tEditor.engineNote || '').replace('{n}', String(poolSize))}
                </p>
              </aside>
            </div>
          </>
        )}

        <AdBanner id="adsense-formatflow-bottom" />
      </main>

      <footer className="border-t border-slate-900 bg-slate-900/20 mt-auto py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase text-center md:text-left">{t.contactFeedback}</span>
            <button type="button" onClick={copyEmail} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <Mail className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs sm:text-sm break-all">{copiedEmail ? t.copiedEmail : 'adrian.contact.me.69@gmail.com'}</span>
            </button>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {(['privacy', 'terms', 'cookies', 'about'] as const).map(page => (
              <a key={page} href={`/${language}/${page}`} className="py-2 text-[13px] font-bold text-slate-400 hover:text-white transition-colors">
                {(legalTranslations[language] && legalTranslations[language].nav[page]) || page}
              </a>
            ))}
          </nav>
        </div>
        <p className="mt-8 pt-6 border-t border-slate-800/50 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} <span className="text-white font-black">FORMATFLOW</span>. {t.footer}
        </p>
      </footer>

      {showTop && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={tEditor.backToTop}
          className="fixed bottom-6 right-6 z-[200] w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl hover:bg-indigo-500 transition-colors cursor-pointer">
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; note?: string; tone?: 'good' | 'warn' }> = ({ label, value, note, tone }) => (
  <div className="space-y-1 min-w-0">
    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</span>
    <span className={`block font-mono text-sm font-black truncate ${tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : 'text-white'}`}>
      {value}
    </span>
    {note && <span className="block text-[10px] font-medium text-slate-500 truncate">{note}</span>}
  </div>
);

export default Formatflow;
