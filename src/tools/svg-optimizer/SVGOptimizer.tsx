import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, ChevronDown, Code2, Copy, Download, Eye, FileCode2, Loader2, Redo2,
  RotateCcw, Settings2, Sparkles, Undo2, Upload, X, Zap,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import { PreviewStage, type Backdrop } from './components/PreviewStage';
import { PluginEditor } from './components/PluginEditor';
import { StatsPanel, formatBytes } from './components/StatsPanel';
import { NextStepBar } from './components/NextStepBar';
import { Faq, Features, HowItWorks } from './components/ToolStory';
import { OptimizerHeroArt } from './components/Illustrations';

import { DEFAULT_SETTINGS, detectProfile, settingsForProfile } from './lib/catalog';
import { readSvgFile } from './lib/repair';
import { useOptimizer, useSettingsHistory } from './lib/useOptimizer';
import { componentNameFrom, downloadText, toDataUri, toReactComponent } from './lib/export';
import { PRESET_SVGS, type PresetSvg } from './utils/presetSvgs';
import { isFailure, isSuccess, type ProfileId } from './lib/types';

interface SVGOptimizerProps {
  lang: string;
  dictionary: any;
}

/** Past this the tool stops re-running on every settings nudge. */
const LIVE_LIMIT = 400_000;

const PROFILES: ProfileId[] = ['safe', 'balanced', 'max', 'manual'];

const SVGOptimizer: React.FC<SVGOptimizerProps> = ({ lang, dictionary }) => {
  const t = dictionary;

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // -- Input ---------------------------------------------------------------
  // `source` is the SVG in hand. `staged` means it has not been optimized yet:
  // picking a file never starts a run, the button does.
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('icon.svg');
  const [staged, setStaged] = useState(false);
  const [intakeError, setIntakeError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showSource, setShowSource] = useState(false);

  // -- Controls ------------------------------------------------------------
  const history = useSettingsHistory(DEFAULT_SETTINGS);
  const { settings } = history;
  const [showEditor, setShowEditor] = useState(false);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [backdrop, setBackdrop] = useState<Backdrop>('checkered');
  const [uriMode, setUriMode] = useState<'url' | 'base64'>('url');
  const [copied, setCopied] = useState<string | null>(null);

  const optimizer = useOptimizer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const profile = useMemo(() => detectProfile(settings), [settings]);
  const result = optimizer.result;
  const succeeded = isSuccess(result) ? result : null;
  const failed = isFailure(result) ? result : null;
  const output = succeeded ? succeeded.output : '';

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // -- Intake --------------------------------------------------------------

  const resetRun = optimizer.reset;

  const acceptSource = useCallback(
    (text: string, name: string) => {
      setSource(text);
      setFileName(name);
      setStaged(true);
      setIntakeError('');
      resetRun();
    },
    [resetRun]
  );

  const handleFile = useCallback(
    async (file: File) => {
      const looksSvg =
        /\.svgz?$/i.test(file.name) || file.type === 'image/svg+xml' || file.type === '';
      if (!looksSvg) {
        setIntakeError(t.error_not_svg || 'That is not an SVG file.');
        return;
      }
      try {
        const text = await readSvgFile(file);
        acceptSource(text, file.name.replace(/\.svgz$/i, '.svg'));
      } catch (error) {
        setIntakeError(
          error instanceof Error && error.message === 'svgz-unsupported'
            ? t.error_svgz || 'This browser cannot unpack .svgz files.'
            : t.error_read || 'That file could not be read.'
        );
      }
    },
    [acceptSource, t]
  );

  // Picks up an SVG handed over by another tool (e.g. a frame exported from the
  // Lottie Viewer). No-ops on a normal visit.
  useHandoffIntake(handleFile);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const loadPreset = useCallback(
    (preset: PresetSvg) => acceptSource(preset.code, preset.fileName),
    [acceptSource]
  );

  // -- Running -------------------------------------------------------------

  const runNow = optimizer.run;
  const runLater = optimizer.runDebounced;

  const optimize = useCallback(() => {
    if (!source.trim()) return;
    setStaged(false);
    runNow(source, settings);
  }, [source, settings, runNow]);

  const live = source.length <= LIVE_LIMIT;

  // Re-run when the knobs move — but only once the user has opted in by
  // pressing the button. Before that, changing settings starts nothing.
  useEffect(() => {
    if (staged || !source.trim() || !live) return;
    runLater(source, settings);
  }, [settings, source, staged, live, runLater]);

  // -- Actions -------------------------------------------------------------

  const flashCopied = useCallback((label: string) => {
    setCopied(label);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 1800);
  }, []);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        flashCopied(label);
      } catch {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand('copy');
          flashCopied(label);
        } finally {
          area.remove();
        }
      }
    },
    [flashCopied]
  );

  const baseName = fileName.replace(/\.svgz?$/i, '');

  const download = useCallback(() => {
    if (!output) return;
    downloadText(output, `${baseName}.min.svg`);
  }, [output, baseName]);

  const handoffResult = useCallback(async () => {
    if (!output) return null;
    return { blob: new Blob([output], { type: 'image/svg+xml' }), name: `${baseName}.min.svg` };
  }, [output, baseName]);

  const setSettings = history.set;

  const reset = useCallback(() => {
    setSource('');
    setFileName('icon.svg');
    setStaged(false);
    setIntakeError('');
    setShowSource(false);
    setShowEditor(false);
    resetRun();
    setSettings(DEFAULT_SETTINGS);
  }, [resetRun, setSettings]);

  const handleLanguageChange = useCallback((next: string) => {
    const path = window.location.pathname.replace(/^\/[a-z]{2}\//, `/${next.toLowerCase()}/`);
    window.location.href = path;
  }, []);

  const legalContent = useMemo(() => {
    const legal = legalTranslations[lang];
    if (!legal) {
      return { privacy: '', terms: '', cookies: '', titles: { privacy: '', terms: '', cookies: '' } };
    }
    return { privacy: legal.privacy, terms: legal.terms, cookies: legal.cookies, titles: legal.nav };
  }, [lang]);

  const hasSource = !!source.trim();

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={reset} t={t} />

      {/* The max-w formula reserves the fixed ad rails' gutters: they are 120px
          wide from 1400px and 160px from 1650px, plus 24px of air on each side.
          Without it AdRail measures a zero gap and silently renders nothing. */}
      <main className="flex-1 pt-40 md:pt-32 pb-8 px-4 md:px-8 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-svg-optimizer-top" />

        <div className="space-y-8">
          {/* -- Hero: only before a file is in hand ------------------------ */}
          {!hasSource && (
            <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
              <div className="space-y-3 text-center lg:text-left">
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  {t.seoHeroTitle}
                </h1>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {t.seoHeroText}
                </p>
              </div>
              <OptimizerHeroArt
                className="w-full max-w-sm mx-auto lg:w-[380px] h-auto"
                animated={!prefersReducedMotion}
              />
            </section>
          )}

          {/* -- Intake ---------------------------------------------------- */}
          <section className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              className={`glass-card rounded-2xl p-6 md:p-8 cursor-pointer text-center transition-all duration-300 group border-2 border-dashed outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                isDragging
                  ? 'border-cyan-400/60 bg-cyan-500/5'
                  : 'border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,.svgz,image/svg+xml"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <span
                  className={`w-14 h-14 rounded-2xl grid place-items-center transition-all duration-300 ${
                    isDragging ? 'bg-cyan-500/20 scale-110' : 'bg-white/5 group-hover:bg-cyan-500/10'
                  }`}
                >
                  <Upload className={`w-6 h-6 ${isDragging ? 'text-cyan-300' : 'text-cyan-500'}`} />
                </span>
                <span className="block">
                  <span className="block text-base md:text-lg font-bold text-white">
                    {isDragging ? t.drop_active : t.label_svg_file}
                  </span>
                  <span className="block text-xs md:text-sm text-gray-500 mt-1">{t.drop_inactive}</span>
                </span>
              </div>
            </div>

            {intakeError && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 font-medium m-0">
                {intakeError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSource(v => !v)}
                aria-expanded={showSource}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-400 hover:text-cyan-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all cursor-pointer"
              >
                <Code2 className="w-4 h-4" />
                {showSource ? t.btn_hide_source : t.btn_paste_source}
                <ChevronDown className={`w-3 h-3 transition-transform ${showSource ? 'rotate-180' : ''}`} />
              </button>

              <span className="hidden sm:block h-5 w-px bg-white/10 mx-1" />

              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                {t.label_presets}
              </span>
              {Object.entries(PRESET_SVGS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => loadPreset(preset)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white"
                >
                  <Sparkles className="w-3 h-3" />
                  {t[preset.nameKey] || preset.nameKey}
                </button>
              ))}
            </div>

            {showSource && (
              <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">
                    {t.label_source_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSource('');
                      setStaged(false);
                      resetRun();
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none p-1"
                    title={t.btn_clear}
                    aria-label={t.btn_clear}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={source}
                  onChange={e => {
                    setSource(e.target.value);
                    setStaged(true);
                  }}
                  spellCheck={false}
                  className="w-full h-48 bg-transparent text-cyan-200/80 text-xs font-mono p-4 resize-y outline-none border-none placeholder-gray-700"
                  placeholder={'<svg xmlns="http://www.w3.org/2000/svg" …'}
                />
              </div>
            )}
          </section>

          {/* -- Staged: the file is here, nothing has run ------------------ */}
          {hasSource && staged && (
            <section className="glass-card rounded-2xl p-5 md:p-6 space-y-4 border border-cyan-500/20">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-10 h-10 shrink-0 grid place-items-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <FileCode2 className="w-5 h-5 text-cyan-400" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white truncate">{fileName}</span>
                  <span className="block text-xs text-gray-500 font-mono">
                    {formatBytes(new Blob([source]).size)}
                  </span>
                </span>
              </div>

              <p className="text-[12px] text-gray-500 leading-relaxed m-0">{t.staged_hint}</p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={optimize}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  {t.btn_optimize}
                </button>
                {/* The manual route: open every switch first, run nothing until
                    it is set up the way this particular file needs. */}
                <button
                  type="button"
                  onClick={() => setShowEditor(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  <Settings2 className="w-4 h-4" />
                  {t.btn_configure_first}
                </button>
              </div>
            </section>
          )}

          {/* -- Failure --------------------------------------------------- */}
          {failed && (
            <section className="rounded-2xl border border-red-500/30 bg-red-500/[0.07] p-5 space-y-2">
              <h2 className="text-sm font-bold text-red-300 m-0">
                {failed.reason === 'not-svg' ? t.error_not_svg : t.error_invalid_svg}
              </h2>
              {failed.detail && (
                <p className="text-xs text-red-200/70 font-mono leading-relaxed m-0 break-words">
                  {failed.detail}
                  {failed.line !== undefined && ` (${failed.line}:${failed.column ?? 0})`}
                </p>
              )}
              <p className="text-xs text-red-200/60 leading-relaxed m-0">{t.error_hint}</p>
            </section>
          )}

          {/* -- Workbench ------------------------------------------------- */}
          {succeeded && !staged && (
            <>
              <section className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 mr-1">
                  {t.label_profile}
                </span>
                {PROFILES.map(id => {
                  const isManual = id === 'manual';
                  const active = profile === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={isManual}
                      onClick={() =>
                        !isManual && setSettings(settingsForProfile(id as 'safe' | 'balanced' | 'max'))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        active
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                      } ${isManual ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                      title={t[`profile_${id}_desc`]}
                    >
                      {t[`profile_${id}`] || id}
                    </button>
                  );
                })}

                <span className="flex-1 min-w-0" />

                <button
                  type="button"
                  onClick={history.undo}
                  disabled={!history.canUndo}
                  className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  title={t.btn_undo}
                  aria-label={t.btn_undo}
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={history.redo}
                  disabled={!history.canRedo}
                  className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  title={t.btn_redo}
                  aria-label={t.btn_redo}
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.btn_start_over}
                </button>
              </section>

              {/* lg:flex-1, never a bare flex-1: inside a flex-col container
                  flex-1 sets flex-basis:0 on the vertical axis and collapses
                  the panel to a couple of pixels. */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                <div className="glass-card rounded-2xl overflow-hidden flex flex-col min-h-[420px]">
                  <div className="px-3 py-2 border-b border-white/5 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setView('preview')}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                          view === 'preview'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t.view_visual}
                      </button>
                      <button
                        type="button"
                        onClick={() => setView('code')}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                          view === 'code'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        {t.view_code}
                      </button>
                    </div>

                    <span className="flex-1 min-w-0" />

                    {view === 'preview' &&
                      (['checkered', 'dark', 'light', 'cyan'] as const).map(theme => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => setBackdrop(theme)}
                          aria-label={theme}
                          title={theme}
                          className={`w-6 h-6 rounded-lg border-2 transition-all cursor-pointer ${
                            backdrop === theme
                              ? 'border-cyan-400 scale-110'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                          style={{
                            backgroundColor:
                              theme === 'checkered'
                                ? '#12212b'
                                : theme === 'dark'
                                ? '#000000'
                                : theme === 'light'
                                ? '#ffffff'
                                : '#042f2e',
                          }}
                        />
                      ))}
                  </div>

                  <div className="lg:flex-1 flex flex-col min-h-0">
                    {view === 'preview' ? (
                      <PreviewStage original={source} optimized={output} backdrop={backdrop} t={t} />
                    ) : (
                      <div className="flex-1 min-h-[320px] overflow-auto p-4 bg-[#04080a]">
                        <pre className="text-[11px] leading-5 text-cyan-200/70 font-mono whitespace-pre-wrap break-all select-all m-0">
                          {output}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <StatsPanel result={succeeded} t={t} />

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={download}
                      className="col-span-2 inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      {t.btn_download}
                    </button>

                    <ActionButton
                      onClick={() => copy(output, 'svg')}
                      done={copied === 'svg'}
                      label={copied === 'svg' ? t.copied : t.btn_copy_svg}
                    />
                    <ActionButton
                      onClick={() => copy(toReactComponent(output, fileName), 'react')}
                      done={copied === 'react'}
                      label={copied === 'react' ? t.copied : t.btn_copy_react}
                    />
                    <div className="col-span-2 flex gap-2">
                      <ActionButton
                        className="flex-1 min-w-0"
                        onClick={() => copy(toDataUri(output, uriMode), 'uri')}
                        done={copied === 'uri'}
                        label={copied === 'uri' ? t.copied : t.btn_copy_data_uri}
                      />
                      <button
                        type="button"
                        onClick={() => setUriMode(m => (m === 'url' ? 'base64' : 'url'))}
                        className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer shrink-0"
                        title={t.uri_mode_hint}
                      >
                        {uriMode === 'url' ? 'URL' : 'B64'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 font-mono text-center m-0 truncate">
                    {baseName}.min.svg · &lt;{componentNameFrom(fileName)} /&gt;
                  </p>

                  <NextStepBar lang={lang} t={t} getResult={handoffResult} />
                </div>
              </section>
            </>
          )}

          {/* -- Controls: available whenever a file is in hand ------------- */}
          {hasSource && (
            <section className="glass-card rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowEditor(v => !v)}
                aria-expanded={showEditor}
                className="w-full px-5 py-4 flex items-center gap-3 bg-transparent border-none text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <Settings2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-white tracking-tight">
                    {t.label_options}
                  </span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">
                    {(t.options_summary || '').replace('{profile}', t[`profile_${profile}`] || profile)}
                  </span>
                </span>
                {optimizer.busy && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${showEditor ? 'rotate-180' : ''}`}
                />
              </button>

              {showEditor && (
                <div className="px-4 md:px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                  <PrecisionControls settings={settings} onChange={setSettings} t={t} />
                  <PluginEditor settings={settings} onChange={setSettings} t={t} />

                  {!live && (
                    <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 m-0">
                      {t.hint_large_file}
                    </p>
                  )}
                  {!optimizer.sandboxed && (
                    <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 m-0">
                      {t.hint_no_worker}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={optimize}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {staged ? t.btn_optimize : t.btn_rerun}
                    </button>
                    {optimizer.busy && (
                      <button
                        type="button"
                        onClick={optimizer.cancel}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        {t.btn_cancel}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          <AdBanner id="adsense-svg-optimizer-mid" />

          <HowItWorks t={t} animated={!prefersReducedMotion} />
          <Features t={t} />
          <Faq t={t} />
        </div>

        <AdBanner id="adsense-svg-optimizer-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      {activeModal && (
        <LegalModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={legalContent.titles[activeModal] || activeModal}
          content={legalContent[activeModal] || ''}
          t={t}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const ActionButton: React.FC<{
  onClick: () => void;
  done: boolean;
  label: string;
  className?: string;
}> = ({ onClick, done, label, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 px-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer active:scale-95 ${className}`}
  >
    {done ? (
      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
    ) : (
      <Copy className="w-4 h-4 shrink-0" />
    )}
    <span className="truncate">{label}</span>
  </button>
);

const PrecisionControls: React.FC<{
  settings: ReturnType<typeof useSettingsHistory>['settings'];
  onChange: (next: ReturnType<typeof useSettingsHistory>['settings']) => void;
  t: any;
}> = ({ settings, onChange, t }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <Slider
      label={t.opt_precision}
      hint={t.opt_precision_desc}
      value={settings.floatPrecision}
      onChange={value => onChange({ ...settings, floatPrecision: value })}
    />
    <Slider
      label={t.opt_transform_precision}
      hint={t.opt_transform_precision_desc}
      value={settings.transformPrecision}
      onChange={value => onChange({ ...settings, transformPrecision: value })}
    />

    <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer">
      <input
        type="checkbox"
        checked={settings.multipass}
        onChange={e => onChange({ ...settings, multipass: e.target.checked })}
        className="w-4 h-4 accent-cyan-500 cursor-pointer shrink-0"
      />
      <span className="min-w-0">
        <span className="block text-xs font-bold text-gray-200">{t.opt_multipass}</span>
        <span className="block text-[11px] text-gray-500 leading-snug">{t.opt_multipass_desc}</span>
      </span>
    </label>

    <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer">
      <input
        type="checkbox"
        checked={settings.prettify}
        onChange={e => onChange({ ...settings, prettify: e.target.checked })}
        className="w-4 h-4 accent-cyan-500 cursor-pointer shrink-0"
      />
      <span className="min-w-0">
        <span className="block text-xs font-bold text-gray-200">{t.opt_prettify}</span>
        <span className="block text-[11px] text-gray-500 leading-snug">{t.opt_prettify_desc}</span>
      </span>
    </label>
  </div>
);

const Slider: React.FC<{
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, hint, value, onChange }) => (
  <div className="rounded-xl p-3 space-y-2 bg-white/[0.02] border border-white/5">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold text-gray-300 min-w-0 truncate">{label}</span>
      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md shrink-0">
        {value}
      </span>
    </div>
    <p className="text-[11px] text-gray-500 leading-snug m-0">{hint}</p>
    {/* flex-wrap: at 375px a fixed row of quick-picks runs off the screen, and
        the body's overflow-x:hidden makes the cut-off buttons unreachable
        rather than merely ugly. */}
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="range"
        min={0}
        max={8}
        step={1}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        aria-label={label}
        className="flex-1 min-w-[7rem] h-1.5 appearance-none bg-white/10 rounded-full cursor-pointer accent-cyan-500"
        style={{
          background: `linear-gradient(90deg,#06b6d4 0%,#06b6d4 ${(value / 8) * 100}%,rgba(255,255,255,0.1) ${(value / 8) * 100}%)`,
        }}
      />
      <span className="flex flex-wrap gap-1">
        {[0, 1, 2, 3, 4].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
              value === n
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
            }`}
          >
            {n}
          </button>
        ))}
      </span>
    </div>
  </div>
);

export default SVGOptimizer;
