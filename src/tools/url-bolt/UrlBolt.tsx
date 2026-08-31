import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileDown,
  FileText,
  Globe,
  Hammer,
  Hash,
  Info,
  KeyRound,
  Layers,
  Link2,
  ListChecks,
  Play,
  Redo2,
  RotateCcw,
  Route,
  Search,
  Server,
  Shield,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  Zap,
} from 'lucide-react';

import { AdBanner } from '../../components/shared/AdBanner';
import { useHandoffIntake } from '../../lib/useHandoff';
import { legalTranslations } from '../../locales/legal';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { ParamTable } from './components/ParamTable';
import { NextStepBar } from './components/NextStepBar';
import {
  IconBatch,
  IconBroom,
  IconLayers,
  IconLocalOnly,
  IconPercent,
  IconRoundTrip,
  IconShieldScan,
  IconTable,
  StepEdit,
  StepPaste,
  StepShip,
  StepSplit,
  UrlHeroArt,
} from './components/Illustrations';

import { decode, decodeDeep, encode, roundTrips, type EncodeProfile } from './lib/codec';
import {
  analyze,
  byteLength,
  findTrackers,
  parseUrl,
  serialize,
  stripTrackers,
  type ParsedUrl,
  type QueryParam,
} from './lib/parse';
import { TRACKER_COUNT } from './lib/tracking';
import { useHistory } from './lib/useHistory';

interface UrlBoltProps {
  lang: string;
  dictionary: any;
}

type Mode = 'convert' | 'inspect' | 'build' | 'batch';
type Direction = 'encode' | 'decode';

/** Above this, re-encoding on every keystroke stops being free, so we wait for the button. */
const LIVE_LIMIT = 200_000;
/** A pasted list longer than this is rejected outright rather than freezing the tab. */
const MAX_INPUT = 8 * 1024 * 1024;

const PROFILES: EncodeProfile[] = ['component', 'uri', 'strict', 'form', 'path', 'query', 'fragment', 'rfc5987'];

const SAMPLE_URL =
  'https://Xn--Bcher-kva.example:8443/libros/caf%C3%A9%20con%20leche?q=t%C3%A9+verde&utm_source=newsletter&utm_medium=email&fbclid=IwAR2xQ&next=https%253A%252F%252Fdestino.example%252Fa%253Fb%253D1#secci%C3%B3n-2';

const SAMPLE_TEXT = 'café & té: 50% off — "todo" a 1€/día';

const SAMPLE_BATCH = [
  'https://shop.example/p/1?utm_source=ig&utm_medium=social&fbclid=IwAR9',
  'https://blog.example/post?id=42&utm_campaign=spring&gclid=Cj0KCQ',
  'http://192.168.0.10/admin?token=abc',
  'https://user:hunter2@legacy.example/export?ref=friend',
].join('\n');

const FINDING_TONE: Record<string, string> = {
  danger: 'text-rose-300 bg-rose-500/10 border-rose-500/25',
  warn: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  info: 'text-sky-300 bg-sky-500/10 border-sky-500/25',
};

/** Fills `{0}` in a dictionary string. */
function fill(template: string, value?: string): string {
  return value === undefined ? template : template.replace('{0}', value);
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  // The object URL pins the blob in memory until it is revoked; a task is
  // enough for the click to have been handed to the browser.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function UrlBolt({ lang, dictionary }: UrlBoltProps) {
  const t = dictionary || {};

  const [mode, setMode] = useState<Mode>('convert');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [toast, setToast] = useState<string>('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Motion preference is read once on mount: reading it during render would
  // differ between the server pass and the client one and break hydration.
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);
    const onChange = () => setPrefersReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const copy = useCallback(
    async (text: string) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        notify(t.copied || 'Copied!');
      } catch {
        // Insecure context or a denied permission: never a thrown promise.
        notify(t.copyFailed || 'Your browser blocked clipboard access');
      }
    },
    [notify, t]
  );

  // ==========================================================================
  // Convert (encode / decode)
  // ==========================================================================
  const convert = useHistory('');
  const [direction, setDirection] = useState<Direction>('encode');
  const [profile, setProfile] = useState<EncodeProfile>('component');
  const [plusForSpace, setPlusForSpace] = useState(false);
  const [lowercaseHex, setLowercaseHex] = useState(false);
  const [deepDecode, setDeepDecode] = useState(true);
  const [plusAsSpace, setPlusAsSpace] = useState(true);
  const [altHeld, setAltHeld] = useState(false);
  /** Bumped by the Run button when the input is too big to process live. */
  const [manualRun, setManualRun] = useState(0);
  const [manualSnapshot, setManualSnapshot] = useState('');

  const convertText = convert.state;
  const isBig = convertText.length > LIVE_LIMIT;
  const effectiveText = isBig ? manualSnapshot : convertText;
  // Alt inverts the direction for as long as it is held — a peek at the other
  // side without losing the settings you just dialled in.
  const effectiveDirection: Direction =
    altHeld ? (direction === 'encode' ? 'decode' : 'encode') : direction;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltHeld(false);
    };
    // Alt+Tab leaves the keyup unheard, so a blur has to clear it too.
    const clear = () => setAltHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);

  const convertResult = useMemo(() => {
    void manualRun; // re-run when the user presses the button on a big input
    if (!effectiveText) {
      return { value: '', escaped: 0, issues: [] as ReturnType<typeof decode>['issues'], rounds: 0, lostSurrogate: false };
    }
    if (effectiveDirection === 'encode') {
      const result = encode(effectiveText, { profile, plusForSpace, lowercaseHex });
      return { value: result.value, escaped: result.escaped, issues: [], rounds: 0, lostSurrogate: result.lostSurrogate };
    }
    const result = deepDecode
      ? decodeDeep(effectiveText, { plusAsSpace })
      : { ...decode(effectiveText, { plusAsSpace }), rounds: 1 };
    return { value: result.value, escaped: result.decoded, issues: result.issues, rounds: result.rounds, lostSurrogate: false };
  }, [effectiveText, effectiveDirection, profile, plusForSpace, lowercaseHex, deepDecode, plusAsSpace, manualRun]);

  const convertStats = useMemo(() => {
    const inBytes = byteLength(effectiveText);
    const outBytes = byteLength(convertResult.value);
    return {
      inChars: effectiveText.length,
      outChars: convertResult.value.length,
      inBytes,
      outBytes,
      overhead: inBytes ? Math.round(((outBytes - inBytes) / inBytes) * 100) : 0,
      reversible:
        effectiveDirection === 'encode' && effectiveText
          ? roundTrips(effectiveText, { profile, plusForSpace })
          : null,
    };
  }, [effectiveText, convertResult.value, effectiveDirection, profile, plusForSpace]);

  const swapConvert = useCallback(() => {
    if (!convertResult.value) return;
    setDirection(d => (d === 'encode' ? 'decode' : 'encode'));
    convert.set(convertResult.value, true);
    if (isBig) setManualSnapshot(convertResult.value);
  }, [convertResult.value, convert, isBig]);

  // ==========================================================================
  // Inspect / Build — one URL string is the single source of truth, and the
  // structured model is derived from it. Editing a field re-serializes and
  // pushes the new string, so undo/redo comes for free and there is no second
  // copy of the URL to keep in sync.
  // ==========================================================================
  const urlHistory = useHistory('');
  const url = urlHistory.state;
  const [aggressive, setAggressive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [original, setOriginal] = useState('');

  const model = useMemo(() => parseUrl(url, { plusAsSpace }), [url, plusAsSpace]);
  const findings = useMemo(() => analyze(model), [model]);
  const trackers = useMemo(() => findTrackers(model), [model]);
  const removableTrackers = useMemo(
    () => trackers.filter(hit => aggressive || !hit.aggressive),
    [trackers, aggressive]
  );

  const cleaned = useMemo(() => {
    if (!model.valid) return null;
    const { model: stripped, removed } = stripTrackers(model, aggressive);
    if (!removed.length) return null;
    const text = serialize(stripped, { profile, plusForSpace });
    return { text, removed: removed.length, saved: byteLength(url) - byteLength(text) };
  }, [model, aggressive, profile, plusForSpace, url]);

  /** Writes a change made through the structured editors back into the URL. */
  const patchModel = useCallback(
    (patch: Partial<ParsedUrl>, commit = false) => {
      const next = { ...model, ...patch, valid: true };
      urlHistory.set(serialize(next, { profile, plusForSpace }), commit);
    },
    [model, urlHistory, profile, plusForSpace]
  );

  const setParams = useCallback((params: QueryParam[]) => patchModel({ params }), [patchModel]);

  const applyClean = useCallback(() => {
    if (!cleaned) return;
    setOriginal(url);
    urlHistory.set(cleaned.text, true);
    notify(fill(t.cleanApplied || '{0} parameters removed', String(cleaned.removed)));
  }, [cleaned, url, urlHistory, notify, t]);

  const startBuilder = useCallback(() => {
    setMode('build');
    if (!parseUrl(url).valid) urlHistory.reset('https://example.com/path');
  }, [url, urlHistory]);

  // ==========================================================================
  // Batch — a staged list that does nothing until the button is pressed
  // ==========================================================================
  const [batchText, setBatchText] = useState('');
  const [staged, setStaged] = useState<{ name: string; lines: number; from?: string } | null>(null);
  const [batchRows, setBatchRows] = useState<
    { input: string; valid: boolean; host: string; cleaned: string; removed: number; saved: number; risks: number }[]
  >([]);
  const [batchError, setBatchError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const batchLines = useMemo(
    () => batchText.split(/\r?\n/).map(line => line.trim()).filter(Boolean),
    [batchText]
  );

  const stageText = useCallback(
    (text: string, name: string, from?: string) => {
      if (text.length > MAX_INPUT) {
        setBatchError(t.errTooLarge || 'That file is too large (8 MB maximum).');
        return;
      }
      setBatchError('');
      setBatchText(text);
      setBatchRows([]);
      setStaged({ name, lines: text.split(/\r?\n/).filter(l => l.trim()).length, from });
      setMode('batch');
    },
    [t]
  );

  const stageFile = useCallback(
    async (file: File, from?: string) => {
      try {
        const text = await file.text();
        stageText(text, file.name, from);
      } catch {
        setBatchError(t.errRead || 'That file could not be read.');
      }
    },
    [stageText, t]
  );

  // One line, right next to the normal intake: this is what makes the tool a
  // stop on a chain instead of an island.
  useHandoffIntake((file, from) => {
    void stageFile(file, from);
  });

  const runBatch = useCallback(() => {
    const rows = batchLines.map(line => {
      const parsed = parseUrl(line, { plusAsSpace });
      if (!parsed.valid) {
        return { input: line, valid: false, host: '', cleaned: '', removed: 0, saved: 0, risks: 0 };
      }
      const { model: stripped, removed } = stripTrackers(parsed, aggressive);
      const text = serialize(stripped, { profile, plusForSpace });
      return {
        input: line,
        valid: true,
        host: parsed.unicodeHost || parsed.host || parsed.scheme,
        cleaned: text,
        removed: removed.length,
        saved: byteLength(line) - byteLength(text),
        risks: analyze(parsed).filter(f => f.level !== 'info').length,
      };
    });
    setBatchRows(rows);
    setStaged(null);
  }, [batchLines, plusAsSpace, aggressive, profile, plusForSpace]);

  const batchTotals = useMemo(
    () => ({
      urls: batchRows.length,
      invalid: batchRows.filter(r => !r.valid).length,
      removed: batchRows.reduce((sum, r) => sum + r.removed, 0),
      saved: batchRows.reduce((sum, r) => sum + r.saved, 0),
      risky: batchRows.filter(r => r.risks > 0).length,
    }),
    [batchRows]
  );

  // ==========================================================================
  // Export + handoff
  // ==========================================================================
  const currentResultText = useCallback((): string => {
    if (mode === 'batch' && batchRows.length) return batchRows.map(r => (r.valid ? r.cleaned : r.input)).join('\n');
    if (mode === 'convert') return convertResult.value;
    return url;
  }, [mode, batchRows, convertResult.value, url]);

  const buildJson = useCallback(() => {
    if (mode === 'batch' && batchRows.length) {
      return JSON.stringify({ tool: 'url-bolt', urls: batchRows }, null, 2);
    }
    return JSON.stringify(
      {
        tool: 'url-bolt',
        url,
        parts: {
          scheme: model.scheme,
          username: model.username,
          host: model.host,
          unicodeHost: model.unicodeHost,
          port: model.port,
          path: model.path,
          segments: model.segments,
          fragment: model.fragment,
        },
        params: model.params.map(p => ({ key: p.key, value: p.value, raw: p.rawValue })),
        findings: findings.map(f => ({ level: f.level, key: f.key, detail: f.detail })),
      },
      null,
      2
    );
  }, [mode, batchRows, url, model, findings]);

  const getHandoffResult = useCallback(async () => {
    const text = currentResultText();
    if (!text) return null;
    return { blob: new Blob([text], { type: 'text/plain' }), name: 'urlbolt.txt' };
  }, [currentResultText]);

  const exportCsv = useCallback(() => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = ['url', 'host', 'cleaned', 'removed', 'bytes_saved', 'risks'].join(',');
    const body = batchRows
      .map(r => [r.input, r.host, r.cleaned, String(r.removed), String(r.saved), String(r.risks)].map(escape).join(','))
      .join('\n');
    downloadBlob(new Blob([`${header}\n${body}`], { type: 'text/csv' }), 'urlbolt-batch.csv');
  }, [batchRows]);

  // ==========================================================================
  // Shortcuts
  // ==========================================================================
  const history = mode === 'convert' ? convert : urlHistory;
  const historyRef = useRef(history);
  historyRef.current = history;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        historyRef.current.undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        historyRef.current.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const resetWorkspace = useCallback(() => {
    convert.reset('');
    urlHistory.reset('');
    setBatchText('');
    setBatchRows([]);
    setStaged(null);
    setBatchError('');
    setOriginal('');
    setMode('convert');
  }, [convert, urlHistory]);

  // ==========================================================================
  // Static content
  // ==========================================================================
  const steps = [
    { art: StepPaste, title: t.step1Title, text: t.step1Text },
    { art: StepSplit, title: t.step2Title, text: t.step2Text },
    { art: StepEdit, title: t.step3Title, text: t.step3Text },
    { art: StepShip, title: t.step4Title, text: t.step4Text },
  ];
  const featureIcons = [IconPercent, IconTable, IconBroom, IconShieldScan, IconLayers, IconBatch];
  const features = Array.isArray(t.features) ? t.features : [];
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const tabs: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'convert', label: t.tab_convert || 'Encode / Decode', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'inspect', label: t.tab_inspect || 'Inspect', icon: <Eye className="w-4 h-4" /> },
    { id: 'build', label: t.tab_build || 'Build', icon: <Hammer className="w-4 h-4" /> },
    { id: 'batch', label: t.tab_batch || 'Batch', icon: <ListChecks className="w-4 h-4" /> },
  ];

  const displayedUrl = showOriginal && original ? original : url;

  return (
    <div className="min-h-screen flex flex-col bg-[#020a08] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/url-bolt`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. Without the 1400px clamp
          the rails never have room and silently never render. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-url-bolt-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                <Link2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.seoHeroTitle || 'URL Encoder, Decoder & Inspector'}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.heroPoints || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full" />
              <UrlHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="space-y-5">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1 p-1.5 rounded-2xl bg-[#04130e]/80 border border-white/5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={`flex-1 min-w-[9rem] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none ${
                    mode === tab.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Shared toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => history.undo()}
                disabled={!history.canUndo}
                title="Ctrl+Z"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-3.5 h-3.5" />
                {t.undo || 'Undo'}
              </button>
              <button
                onClick={() => history.redo()}
                disabled={!history.canRedo}
                title="Ctrl+Shift+Z"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Redo2 className="w-3.5 h-3.5" />
                {t.redo || 'Redo'}
              </button>

              <span className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

              <button
                onClick={() => {
                  if (mode === 'convert') convert.set(SAMPLE_TEXT, true);
                  else if (mode === 'batch') stageText(SAMPLE_BATCH, 'sample.txt');
                  else urlHistory.set(SAMPLE_URL, true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/10 border border-emerald-600/25 text-emerald-300 text-xs font-bold hover:bg-emerald-600/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t.loadSample || 'Load an example'}
              </button>

              <button
                onClick={resetWorkspace}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.button_clear || 'Clear all'}
              </button>

              {toast && (
                <span className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                  {toast}
                </span>
              )}
            </div>

            {/* ============================================================== */}
            {/* Convert                                                        */}
            {/* ============================================================== */}
            {mode === 'convert' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex p-1 rounded-xl bg-[#04130e] border border-white/5">
                    {(['encode', 'decode'] as Direction[]).map(dir => (
                      <button
                        key={dir}
                        onClick={() => setDirection(dir)}
                        className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          direction === dir ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {dir === 'encode' ? t.dirEncode || 'Encode' : t.dirDecode || 'Decode'}
                      </button>
                    ))}
                  </div>

                  {effectiveDirection === 'encode' ? (
                    <select
                      value={profile}
                      onChange={e => setProfile(e.target.value as EncodeProfile)}
                      className="bg-[#04130e] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500 cursor-pointer max-w-[15rem]"
                    >
                      {PROFILES.map(p => (
                        <option key={p} value={p}>
                          {t[`profile_${p}`] || p}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#04130e] border border-white/10 text-xs font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deepDecode}
                        onChange={e => setDeepDecode(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      {t.optDeep || 'Decode until stable'}
                    </label>
                  )}

                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#04130e] border border-white/10 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={effectiveDirection === 'encode' ? plusForSpace : plusAsSpace}
                      onChange={e =>
                        effectiveDirection === 'encode'
                          ? setPlusForSpace(e.target.checked)
                          : setPlusAsSpace(e.target.checked)
                      }
                      className="accent-emerald-500"
                    />
                    {t.optPlus || 'Space as +'}
                  </label>

                  {effectiveDirection === 'encode' && (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#04130e] border border-white/10 text-xs font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lowercaseHex}
                        onChange={e => setLowercaseHex(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      {t.optLowerHex || 'Lowercase hex'}
                    </label>
                  )}

                  <span className="text-[10px] text-slate-500 font-bold px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                    {t.altHint || 'Hold Alt to preview the reverse'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t[`profileHint_${profile}`] || ''}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex flex-col glass-card rounded-3xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#04130e]/50">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        {t.label_input || 'Input'}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {convertStats.inChars} · {convertStats.inBytes} B
                      </span>
                    </div>
                    <textarea
                      value={convertText}
                      onChange={e => convert.set(e.target.value)}
                      placeholder={
                        effectiveDirection === 'encode'
                          ? t.placeholder_encode || 'Type or paste text to URL-encode…'
                          : t.placeholder_decode || 'Paste an encoded URL or value to decode…'
                      }
                      className="w-full h-64 p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-sm focus:outline-none resize-none scrollbar-thin"
                      spellCheck={false}
                    />
                  </div>

                  <div className="flex flex-col glass-card rounded-3xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#04130e]/50 gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider truncate">
                        {effectiveDirection === 'encode' ? t.label_output || 'Encoded' : t.label_decoded_output || 'Decoded'}
                        {altHeld && <span className="ml-2 text-emerald-400">· Alt</span>}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-600 font-mono">
                          {convertStats.outChars} · {convertStats.outBytes} B
                        </span>
                        <button
                          onClick={() => copy(convertResult.value)}
                          disabled={!convertResult.value}
                          title={t.tooltip_copy || 'Copy'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-64 p-5 overflow-auto font-mono text-sm break-all text-slate-200 scrollbar-thin">
                      {convertResult.value || (
                        <span className="text-slate-600">{t.placeholder_output || 'The result appears here…'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {isBig && (
                  <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-200 font-medium flex-1 min-w-[12rem]">
                      {t.bigInputHint || 'This input is large, so it is not processed on every keystroke. Press Run when you are ready.'}
                    </span>
                    <button
                      onClick={() => {
                        setManualSnapshot(convertText);
                        setManualRun(n => n + 1);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-black hover:bg-amber-500/30 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {t.runBtn || 'Run'}
                    </button>
                  </div>
                )}

                {/* Measurable output */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={swapConvert}
                    disabled={!convertResult.value}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/10 border border-emerald-600/25 text-emerald-300 text-xs font-black hover:bg-emerald-600/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    {t.button_swap || 'Send result back to the input'}
                  </button>

                  {!!convertResult.escaped && (
                    <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono text-slate-400">
                      {fill(t.statEscaped || '{0} escaped', String(convertResult.escaped))}
                    </span>
                  )}
                  {!!effectiveText && (
                    <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono text-slate-400">
                      {fill(t.statOverhead || '{0}% size', String(convertStats.overhead > 0 ? `+${convertStats.overhead}` : convertStats.overhead))}
                    </span>
                  )}
                  {convertResult.rounds > 1 && (
                    <span className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] font-bold text-amber-300">
                      {fill(t.statRounds || 'Double-encoded: {0} passes', String(convertResult.rounds))}
                    </span>
                  )}
                  {convertStats.reversible !== null && (
                    <span
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border ${
                        convertStats.reversible
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                      }`}
                      title={t.roundTripHint || 'Decoding the result reproduces the input exactly'}
                    >
                      <IconRoundTrip className="w-3.5 h-3.5" />
                      {convertStats.reversible ? t.roundTripOk || 'Reversible' : t.roundTripFail || 'Not reversible'}
                    </span>
                  )}
                  {convertResult.lostSurrogate && (
                    <span className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] font-bold text-amber-300">
                      {t.lostSurrogate || 'The input had a lone surrogate; it was replaced'}
                    </span>
                  )}
                </div>

                {convertResult.issues.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-rose-300 uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" />
                      {t.issuesTitle || 'Problems found while decoding'}
                    </div>
                    <ul className="space-y-1">
                      {convertResult.issues.slice(0, 6).map((issue, i) => (
                        <li key={i} className="text-[11px] font-mono text-rose-200/80">
                          <span className="text-rose-400">@{issue.index}</span>{' '}
                          {fill(t[`issue_${issue.kind}`] || issue.kind, issue.snippet)}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-slate-400">{t.issuesHint || 'The rest of the text was decoded anyway.'}</p>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* Inspect                                                        */}
            {/* ============================================================== */}
            {mode === 'inspect' && (
              <div className="space-y-4">
                <div className="glass-card rounded-3xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#04130e]/50 gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      {t.label_url_input || 'URL to inspect'}
                    </span>
                    <div className="flex items-center gap-2">
                      {original && (
                        <button
                          onMouseDown={() => setShowOriginal(true)}
                          onMouseUp={() => setShowOriginal(false)}
                          onMouseLeave={() => setShowOriginal(false)}
                          onTouchStart={() => setShowOriginal(true)}
                          onTouchEnd={() => setShowOriginal(false)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer select-none"
                        >
                          {t.holdCompare || 'Hold to see the original'}
                        </button>
                      )}
                      <button
                        onClick={() => copy(url)}
                        disabled={!url}
                        title={t.tooltip_copy || 'Copy'}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={displayedUrl}
                    onChange={e => urlHistory.set(e.target.value)}
                    readOnly={showOriginal}
                    placeholder={t.placeholder_parse || 'Paste any URL — https, ftp, mailto, magnet…'}
                    className={`w-full h-24 p-5 bg-transparent placeholder-slate-600 font-mono text-sm focus:outline-none resize-none scrollbar-thin ${
                      showOriginal ? 'text-amber-200' : 'text-slate-200'
                    }`}
                    spellCheck={false}
                  />
                </div>

                {url.trim() && !model.valid && (
                  <div className="bg-rose-500/10 border border-rose-500/20 px-5 py-4 rounded-2xl flex items-center gap-3 text-rose-300 text-sm font-semibold">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{t.parse_error || 'That is not a URL we can parse. Check the scheme and the host.'}</span>
                  </div>
                )}

                {model.valid && (
                  <>
                    {model.assumedScheme && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        {t.assumedScheme || 'No scheme was given, so https:// was assumed for the analysis.'}
                      </p>
                    )}

                    {/* Findings */}
                    {findings.length > 0 && (
                      <div className="space-y-2">
                        {findings.map((finding, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border text-xs font-medium ${
                              FINDING_TONE[finding.level]
                            }`}
                          >
                            {finding.level === 'danger' ? (
                              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                            ) : finding.level === 'warn' ? (
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-relaxed">
                              {fill(t[finding.key] || finding.key, finding.detail)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tracker cleanup — the measurable postprocess */}
                    <div className="glass-card rounded-3xl p-5 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-2 text-sm font-black text-white">
                          <IconBroom className="w-5 h-5 text-emerald-400" />
                          {t.cleanTitle || 'Clean up tracking'}
                        </span>
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={aggressive}
                            onChange={e => setAggressive(e.target.checked)}
                            className="accent-emerald-500"
                          />
                          {t.cleanAggressive || 'Also drop ref, source, s'}
                        </label>
                        <span className="ml-auto text-[10px] text-slate-600 font-mono">
                          {fill(t.trackerCatalog || '{0} known trackers', String(TRACKER_COUNT))}
                        </span>
                      </div>

                      {cleaned ? (
                        <>
                          <div className="font-mono text-xs break-all text-emerald-200 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4">
                            {cleaned.text}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={applyClean}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {fill(t.cleanBtn || 'Remove {0} parameters', String(cleaned.removed))}
                            </button>
                            <button
                              onClick={() => copy(cleaned.text)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              {t.copyBtn || 'Copy'}
                            </button>
                            <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono text-slate-400">
                              {fill(t.cleanSaved || '{0} bytes shorter', String(cleaned.saved))}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium">
                          {removableTrackers.length === 0
                            ? t.cleanNone || 'No tracking parameters in this URL.'
                            : ''}
                        </p>
                      )}
                    </div>

                    {/* Anatomy */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        {t.label_anatomy || 'Anatomy'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { show: !!model.scheme, label: t.label_protocol || 'Scheme', value: model.scheme, icon: <Zap className="w-4 h-4" />, tone: 'text-amber-400 border-amber-500/25 bg-amber-500/5' },
                          { show: !!model.username, label: t.label_user || 'Credentials', value: `${model.username}${model.password ? ':•••' : ''}`, icon: <KeyRound className="w-4 h-4" />, tone: 'text-rose-400 border-rose-500/25 bg-rose-500/5' },
                          { show: !!model.host, label: t.label_host || 'Host', value: model.host, extra: model.unicodeHost !== model.host ? model.unicodeHost : undefined, icon: <Server className="w-4 h-4" />, tone: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5' },
                          { show: !!model.port, label: t.label_port || 'Port', value: model.port, icon: <Layers className="w-4 h-4" />, tone: 'text-cyan-400 border-cyan-500/25 bg-cyan-500/5' },
                          { show: !!model.path && model.path !== '/', label: t.label_path || 'Path', value: model.path, extra: decode(model.path).value !== model.path ? decode(model.path).value : undefined, icon: <Route className="w-4 h-4" />, tone: 'text-violet-400 border-violet-500/25 bg-violet-500/5' },
                          { show: model.params.length > 0, label: t.label_query || 'Query', value: `${model.params.length} ${t.label_params || 'params'}`, icon: <Search className="w-4 h-4" />, tone: 'text-sky-400 border-sky-500/25 bg-sky-500/5' },
                          { show: !!model.fragment, label: t.label_hash || 'Fragment', value: model.fragment, extra: decode(model.fragment).value !== model.fragment ? decode(model.fragment).value : undefined, icon: <Hash className="w-4 h-4" />, tone: 'text-pink-400 border-pink-500/25 bg-pink-500/5' },
                          { show: model.opaque && !!model.body, label: t.opaqueBody || 'Payload', value: model.body.slice(0, 120), icon: <FileText className="w-4 h-4" />, tone: 'text-slate-300 border-white/10 bg-white/5' },
                        ]
                          .filter(part => part.show)
                          .map((part, i) => (
                            <div key={i} className={`p-4 rounded-2xl border ${part.tone} space-y-2`}>
                              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider opacity-80">
                                {part.icon}
                                <span>{part.label}</span>
                              </div>
                              <div className="font-mono text-sm text-white break-all">{part.value}</div>
                              {part.extra && (
                                <div className="text-[11px] text-slate-400 font-mono break-all border-t border-white/5 pt-2">
                                  <span className="text-slate-500">{t.label_decoded || 'Decoded'}: </span>
                                  {part.extra}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Path segments */}
                    {model.segments.length > 0 && (
                      <div className="glass-card rounded-3xl p-5 space-y-3">
                        <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                          <Route className="w-4 h-4 text-violet-400" />
                          {t.label_path_segments || 'Path segments'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {model.segments.map((segment, i) => (
                            <React.Fragment key={i}>
                              <span className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-200 font-mono text-xs font-bold break-all">
                                {segment}
                              </span>
                              {i < model.segments.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Editable parameters */}
                    <div className="glass-card rounded-3xl p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                          <IconTable className="w-4 h-4 text-sky-400" />
                          {t.label_query_params || 'Query parameters'}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {model.params.length} {t.label_params || 'params'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {t.paramsHint || 'Edit, reorder or delete freely: parameters you do not touch keep their original bytes.'}
                      </p>
                      <ParamTable params={model.params} onChange={setParams} t={t} onCopy={copy} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* Build                                                          */}
            {/* ============================================================== */}
            {mode === 'build' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.buildHint || 'Compose a URL field by field. Nothing is parsed or guessed: what you type is what gets assembled.'}
                </p>

                {!model.valid ? (
                  <button
                    onClick={startBuilder}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer"
                  >
                    <Hammer className="w-4 h-4" />
                    {t.buildStart || 'Start from a blank URL'}
                  </button>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: t.fieldScheme || 'Scheme', value: model.scheme, set: (v: string) => patchModel({ scheme: v.replace(/[^a-zA-Z0-9+.-]/g, '') }), placeholder: 'https' },
                        { label: t.fieldHost || 'Host', value: model.host, set: (v: string) => patchModel({ host: v.trim(), unicodeHost: v.trim() }), placeholder: 'example.com' },
                        { label: t.fieldPort || 'Port', value: model.port, set: (v: string) => patchModel({ port: v.replace(/\D/g, '') }), placeholder: '443' },
                        { label: t.fieldPath || 'Path', value: model.path, set: (v: string) => patchModel({ path: v.startsWith('/') ? v : `/${v}` }), placeholder: '/docs/page' },
                      ].map(field => (
                        <label key={field.label} className="glass-card rounded-2xl p-4 space-y-2 block">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{field.label}</span>
                          <input
                            value={field.value}
                            onChange={e => field.set(e.target.value)}
                            placeholder={field.placeholder}
                            spellCheck={false}
                            className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 pb-1 font-mono text-sm text-white placeholder-slate-600 outline-none"
                          />
                        </label>
                      ))}
                    </div>

                    <label className="glass-card rounded-2xl p-4 space-y-2 block">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {t.fieldFragment || 'Fragment'}
                      </span>
                      <input
                        value={model.fragment}
                        onChange={e => patchModel({ fragment: e.target.value })}
                        placeholder="section-2"
                        spellCheck={false}
                        className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500/50 pb-1 font-mono text-sm text-white placeholder-slate-600 outline-none"
                      />
                    </label>

                    <div className="glass-card rounded-3xl p-5 space-y-3">
                      <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                        <IconTable className="w-4 h-4 text-sky-400" />
                        {t.label_query_params || 'Query parameters'}
                      </h4>
                      <ParamTable params={model.params} onChange={setParams} t={t} onCopy={copy} />
                    </div>

                    <div className="glass-card rounded-3xl p-5 space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {t.rebuiltTitle || 'Assembled URL'}
                      </span>
                      <div className="font-mono text-sm break-all text-emerald-200">{url}</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => copy(url)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {t.copyBtn || 'Copy'}
                        </button>
                        <button
                          onClick={() => setMode('inspect')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t.buildInspect || 'Inspect it'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* Batch                                                          */}
            {/* ============================================================== */}
            {mode === 'batch' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {t.batchOpen || 'Open a .txt or .csv'}
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept=".txt,.csv,.log,text/plain,text/csv"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) void stageFile(file);
                      e.target.value = '';
                    }}
                  />
                  <span className="text-[11px] text-slate-500 font-medium">
                    {t.batchHint || 'One URL per line. Nothing runs until you press the button.'}
                  </span>
                </div>

                <div className="glass-card rounded-3xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#04130e]/50">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      {t.batchTitle || 'URL list'}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {fill(t.batchCount || '{0} URLs', String(batchLines.length))}
                    </span>
                  </div>
                  <textarea
                    value={batchText}
                    onChange={e => {
                      setBatchText(e.target.value);
                      setStaged(null);
                    }}
                    placeholder={t.batchPlaceholder || 'https://example.com/a?utm_source=x\nhttps://example.com/b?fbclid=y'}
                    className="w-full h-48 p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none resize-none scrollbar-thin"
                    spellCheck={false}
                  />
                </div>

                {batchError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 px-5 py-4 rounded-2xl flex items-center gap-3 text-rose-300 text-sm font-semibold">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{batchError}</span>
                  </div>
                )}

                {staged && (
                  <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-100 font-medium flex-1 min-w-[12rem]">
                      {staged.from
                        ? fill(t.handoffReceived || 'Received from {0} — ready when you are', staged.from)
                        : fill(t.batchStaged || '{0} is staged and waiting', staged.name)}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={runBatch}
                    disabled={batchLines.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    {fill(t.batchRun || 'Analyse {0} URLs', String(batchLines.length))}
                  </button>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#04130e] border border-white/10 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aggressive}
                      onChange={e => setAggressive(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    {t.cleanAggressive || 'Also drop ref, source, s'}
                  </label>
                </div>

                {batchRows.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: t.batchStatUrls || 'URLs', value: String(batchTotals.urls) },
                        { label: t.batchStatRemoved || 'Parameters removed', value: String(batchTotals.removed) },
                        { label: t.batchStatSaved || 'Bytes saved', value: String(batchTotals.saved) },
                        { label: t.batchStatRisky || 'With warnings', value: String(batchTotals.risky) },
                      ].map(stat => (
                        <div key={stat.label} className="glass-card rounded-2xl p-4 space-y-1">
                          <div className="text-2xl font-black text-emerald-400 font-mono">{stat.value}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="glass-card rounded-3xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[40rem]">
                          <thead>
                            <tr className="bg-[#04130e]/60">
                              {[t.batchColUrl || 'Cleaned URL', t.batchColHost || 'Host', t.batchColRemoved || 'Removed', t.batchColSaved || 'Bytes'].map(head => (
                                <th key={head} className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                  {head}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {batchRows.map((row, i) => (
                              <tr key={i} className="border-t border-white/5">
                                <td className="px-4 py-3 font-mono text-[11px] break-all max-w-[24rem]">
                                  {row.valid ? (
                                    <span className="text-slate-200">{row.cleaned}</span>
                                  ) : (
                                    <span className="text-rose-300">{row.input}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-[11px] text-emerald-300 break-all">{row.host || '—'}</td>
                                <td className="px-4 py-3 font-mono text-[11px] text-amber-300">{row.removed || '—'}</td>
                                <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{row.saved || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copy(batchRows.map(r => (r.valid ? r.cleaned : r.input)).join('\n'))}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {t.batchCopyAll || 'Copy every URL'}
                      </button>
                      <button
                        onClick={exportCsv}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        {t.batchExportCsv || 'Export CSV'}
                      </button>
                      <button
                        onClick={() => downloadBlob(new Blob([buildJson()], { type: 'application/json' }), 'urlbolt.json')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {t.batchExportJson || 'Export JSON'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Handoff out */}
            <NextStepBar lang={lang} t={t} getResult={getHandoffResult} disabled={!currentResultText()} />
          </section>

          <AdBanner id="adsense-url-bolt-mid" />

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-emerald-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-emerald-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-emerald-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-emerald-400" />
                    <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Features                                                         */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconPercent;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 group-hover:border-emerald-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </section>

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                  {keywords[0]}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoSecondaryTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl" />
                <IconLocalOnly className="w-20 h-20 text-emerald-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#04130e] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoUseCaseTitle}</h2>
                <div className="h-1.5 w-20 bg-emerald-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {keywords[1]}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
                </div>
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoPrivacyTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoPrivacyText}</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-emerald-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-emerald-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-emerald-400 transition-transform group-open:rotate-45 text-xl leading-none">
                          +
                        </span>
                      </summary>
                      <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {keywords.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.seoKeywordsTitle}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-url-bolt-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setLegalModal(modal)} />

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
