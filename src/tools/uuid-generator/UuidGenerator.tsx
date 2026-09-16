import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Eraser,
  Fingerprint,
  Play,
  Redo2,
  RotateCcw,
  Shuffle,
  Undo2,
  Upload,
  Wand2,
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import {
  IconFlavours,
  IconFormat,
  IconInspect,
  IconLocal,
  IconSortable,
  IconWorker,
  StepChoose,
  StepGenerate,
  StepTake,
  StepTune,
  UuidHeroArt,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { useUuidEngine } from './lib/useUuidEngine';
import {
  CONSTANT_KINDS,
  DEFAULT_FORMAT,
  EXPORT_EXTENSION,
  EXPORT_MIME,
  MAX_COUNT,
  NAMED_KINDS,
  PRESET_NAMESPACES,
  bytesToHex,
  extractIdentifiers,
  formatOne,
  hexToBytes,
  inspect,
  parseUuidBytes,
  randomBytes,
  serialize,
  setRfcVariant,
  setV7Timestamp,
  setVersion,
  type BatchResult,
  type ExportFormat,
  type FormatOptions,
  type Kind,
  type Wrap,
} from './lib/engine';

interface UuidGeneratorProps {
  lang: string;
  dictionary: any;
}

/** Rows actually painted. A 100 000-row list is 100 000 DOM nodes and a frozen tab. */
const VISIBLE_ROWS = 300;
/** Undo depth. Each entry holds bytes (16 B/id), not strings (~100 B/id). */
const HISTORY_LIMIT = 10;

const KIND_GROUPS: { labelKey: string; fallback: string; kinds: Kind[] }[] = [
  { labelKey: 'groupUuid', fallback: 'RFC 9562 UUIDs', kinds: ['v4', 'v7', 'v1', 'v6', 'v3', 'v5', 'nil', 'max'] },
  { labelKey: 'groupOther', fallback: 'Other identifiers', kinds: ['ulid', 'nanoid', 'objectid'] },
];

const KIND_LABELS: Record<Kind, string> = {
  v4: 'v4',
  v7: 'v7',
  v1: 'v1',
  v6: 'v6',
  v3: 'v3',
  v5: 'v5',
  nil: 'nil',
  max: 'max',
  ulid: 'ULID',
  nanoid: 'NanoID',
  objectid: 'ObjectId',
};

const WRAPS: { id: Wrap; label: string }[] = [
  { id: 'none', label: 'plain' },
  { id: 'braces', label: '{ }' },
  { id: 'urn', label: 'urn:' },
  { id: 'single', label: "' '" },
  { id: 'double', label: '" "' },
];

const EXPORTS: ExportFormat[] = ['txt', 'csv', 'json', 'sql'];

/**
 * Clipboard with a real fallback. `navigator.clipboard` is undefined on
 * insecure origins and rejects when the document is not focused, and the old
 * code reported "Copied!" in both cases.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Falls through to the textarea path.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Reads the version nibble so each row is labelled by what it actually is. */
function rowLabel(kind: Kind, bytes: Uint8Array | null, index: number): string {
  if (kind === 'ulid' || kind === 'nanoid' || kind === 'objectid') return KIND_LABELS[kind];
  if (!bytes) return KIND_LABELS[kind];
  const offset = index * 16;
  let allZero = true;
  let allOnes = true;
  for (let i = 0; i < 16; i++) {
    if (bytes[offset + i] !== 0x00) allZero = false;
    if (bytes[offset + i] !== 0xff) allOnes = false;
  }
  if (allZero) return 'nil';
  if (allOnes) return 'max';
  return `v${(bytes[offset + 6] & 0xf0) >> 4}`;
}

export default function UuidGenerator({ lang, dictionary }: UuidGeneratorProps) {
  const t = dictionary || {};
  const { run } = useUuidEngine();

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);

  // --- generation inputs ----------------------------------------------------
  const [kind, setKind] = useState<Kind>('v4');
  const [count, setCount] = useState(10);
  const [namespace, setNamespace] = useState<string>(PRESET_NAMESPACES.dns);
  const [namesText, setNamesText] = useState('example.com');

  // --- output ---------------------------------------------------------------
  // The batch is NOT stored twice. `result` is derived from the history cursor,
  // so there is no second copy of the same array to keep in sync — the mirrored
  // state that used to make "regenerate" and "reset" disagree.
  const [history, setHistory] = useState<{ entries: BatchResult[]; cursor: number }>({ entries: [], cursor: -1 });
  const result = history.cursor >= 0 ? history.entries[history.cursor] : null;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<FormatOptions>(DEFAULT_FORMAT);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [copiedRow, setCopiedRow] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // --- inspector / manual craft --------------------------------------------
  const [inspectText, setInspectText] = useState('');
  const [crafted, setCrafted] = useState<Uint8Array | null>(null);
  const [craftDirty, setCraftDirty] = useState(false);
  const [imported, setImported] = useState<{ ids: string[]; from: string } | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(media.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // Every pending "Copied!" reset is cancelled on unmount; the old code left
  // them running and wrote state into a component that no longer existed.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const names = useMemo(
    () =>
      namesText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean),
    [namesText]
  );

  const isNamed = NAMED_KINDS.includes(kind);
  const isConstant = CONSTANT_KINDS.includes(kind);
  const namespaceValid = !isNamed || parseUuidBytes(namespace) !== null;
  const effectiveCount = isConstant ? 1 : isNamed ? Math.max(1, names.length) : count;
  const canGenerate = namespaceValid && !busy;

  // --------------------------------------------------------------------------
  // Generation — only ever from an explicit user action.
  // --------------------------------------------------------------------------
  const pushBatch = useCallback((batch: BatchResult) => {
    setHistory(previous => {
      const trimmed = previous.entries.slice(0, previous.cursor + 1);
      trimmed.push(batch);
      // Drop the oldest entries instead of growing without bound: ten batches
      // of 100 000 v4 ids is 16 MB of bytes, which is the ceiling worth paying.
      const entries = trimmed.slice(Math.max(0, trimmed.length - HISTORY_LIMIT));
      return { entries, cursor: entries.length - 1 };
    });
  }, []);

  const generate = useCallback(async () => {
    if (busy) return;
    if (isNamed && !parseUuidBytes(namespace)) {
      setError('INVALID_NAMESPACE');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const batch = await run({ kind, count: effectiveCount, namespace, names });
      pushBatch(batch);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'UNKNOWN');
    } finally {
      setBusy(false);
    }
  }, [busy, isNamed, namespace, run, kind, effectiveCount, names, pushBatch]);

  const undo = useCallback(() => {
    setHistory(previous =>
      previous.cursor <= 0 ? previous : { entries: previous.entries, cursor: previous.cursor - 1 }
    );
  }, []);

  const redo = useCallback(() => {
    setHistory(previous =>
      previous.cursor >= previous.entries.length - 1
        ? previous
        : { entries: previous.entries, cursor: previous.cursor + 1 }
    );
  }, []);

  const clearAll = useCallback(() => {
    setHistory({ entries: [], cursor: -1 });
    setError(null);
    setImported(null);
  }, []);

  const resetWorkspace = useCallback(() => {
    setKind('v4');
    setCount(10);
    setNamespace(PRESET_NAMESPACES.dns);
    setNamesText('example.com');
    setFormat(DEFAULT_FORMAT);
    setExportFormat('txt');
    setInspectText('');
    setCrafted(null);
    setCraftDirty(false);
    clearAll();
  }, [clearAll]);

  // --------------------------------------------------------------------------
  // Output helpers
  // --------------------------------------------------------------------------
  const rows = useMemo(() => {
    if (!result) return [];
    const total = Math.min(result.count, VISIBLE_ROWS);
    const out: { text: string; label: string }[] = new Array(total);
    for (let i = 0; i < total; i++) {
      out[i] = {
        text: formatOne(result.kind, result.bytes, result.strings, i, format),
        label: rowLabel(result.kind, result.bytes, i),
      };
    }
    return out;
  }, [result, format]);

  const previewSample = useMemo(() => {
    if (rows.length) return rows[0].text;
    const sample = parseUuidBytes('0189d6a3-4f2b-7c31-b8e5-6d1f9a2c4e70')!;
    return formatOne('v7', sample, null, 0, format);
  }, [rows, format]);

  const handleCopyRow = useCallback(
    async (index: number) => {
      const ok = await copyText(rows[index].text);
      if (!ok) {
        setError('CLIPBOARD');
        return;
      }
      setCopiedRow(index);
      later(() => setCopiedRow(null), 1500);
    },
    [rows, later]
  );

  const handleCopyAll = useCallback(async () => {
    if (!result) return;
    const ok = await copyText(serialize(result, format, exportFormat));
    if (!ok) {
      setError('CLIPBOARD');
      return;
    }
    setCopiedAll(true);
    later(() => setCopiedAll(false), 2000);
  }, [result, format, exportFormat, later]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const content = serialize(result, format, exportFormat);
    const blob = new Blob([content], { type: EXPORT_MIME[exportFormat] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.kind}-${result.count}.${EXPORT_EXTENSION[exportFormat]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Keep large CSV/JSON exports alive while the browser starts the download
    // (one second was too short on slower devices and Safari).
    later(() => URL.revokeObjectURL(url), 60_000);
  }, [result, format, exportFormat, later]);

  const getHandoffBlob = useCallback(
    async (target: ExportFormat) => {
      if (!result) return null;
      const content = serialize(result, format, target);
      return {
        blob: new Blob([content], { type: EXPORT_MIME[target] }),
        name: `${result.kind}-${result.count}.${EXPORT_EXTENSION[target]}`,
      };
    },
    [result, format]
  );

  // --------------------------------------------------------------------------
  // Intake: a list handed over by another tool, or picked from disk.
  // --------------------------------------------------------------------------
  const ingestFile = useCallback((file: File, from: string) => {
    file
      .text()
      .then(text => {
        const ids = extractIdentifiers(text);
        setImported({ ids, from });
        if (ids.length) setInspectText(ids[0]);
      })
      .catch(() => setImported({ ids: [], from }));
  }, []);

  useHandoffIntake(ingestFile);

  // --------------------------------------------------------------------------
  // Inspector + manual craft
  // --------------------------------------------------------------------------
  const inspection = useMemo(() => inspect(inspectText), [inspectText]);

  useEffect(() => {
    // The craft buffer follows the inspected value until the user edits it;
    // after that their edits win until they revert.
    if (craftDirty) return;
    setCrafted(inspection.bytes && inspection.bytes.length === 16 ? inspection.bytes.slice() : null);
  }, [inspection, craftDirty]);

  const craftHex = crafted ? bytesToHex(crafted) : '';
  const craftedText = crafted ? formatOne('v4', crafted, null, 0, format) : '';

  const editByte = useCallback((index: number, value: string) => {
    setCrafted(current => {
      if (!current) return current;
      const parsed = hexToBytes(value.padStart(2, '0').slice(-2));
      if (!parsed || parsed.length !== 1) return current;
      const next = current.slice();
      next[index] = parsed[0];
      return next;
    });
    setCraftDirty(true);
  }, []);

  const craftAction = useCallback((mutate: (bytes: Uint8Array) => Uint8Array) => {
    setCrafted(current => (current ? mutate(current) : current));
    setCraftDirty(true);
  }, []);

  const startBlank = useCallback(() => {
    // The fully manual path: no generator involved, 16 zero bytes to shape.
    setInspectText('');
    setCrafted(new Uint8Array(16));
    setCraftDirty(true);
  }, []);

  const craftedToBatch = useCallback(() => {
    if (!crafted) return;
    const batch: BatchResult = {
      kind: 'v4',
      bytes: crafted.slice(),
      strings: null,
      count: 1,
      ms: 0,
      duplicates: 0,
    };
    pushBatch(batch);
  }, [crafted, pushBatch]);

  // --------------------------------------------------------------------------
  // Keyboard
  // --------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === 'enter') {
        event.preventDefault();
        generate();
        return;
      }
      const target = event.target as HTMLElement | null;
      const typing = !!target && /^(INPUT|TEXTAREA)$/.test(target.tagName);
      if (key === 'z' && !event.shiftKey && !typing) {
        event.preventDefault();
        undo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        if (typing && key === 'z') return;
        event.preventDefault();
        redo();
      } else if (key === 'c' && event.shiftKey) {
        event.preventDefault();
        handleCopyAll();
      } else if (key === 's' && event.shiftKey) {
        event.preventDefault();
        handleDownload();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [generate, undo, redo, handleCopyAll, handleDownload]);

  // --------------------------------------------------------------------------
  // Static content
  // --------------------------------------------------------------------------
  const steps = [
    { art: StepChoose, title: t.step1Title || 'Pick a flavour', text: t.step1Text || 'Eleven of them, from plain v4 to time-ordered v7, ULID or a Mongo ObjectId.' },
    { art: StepTune, title: t.step2Title || 'Set the batch', text: t.step2Text || 'How many, in what shape: case, hyphens, wrapping, prefix, export format.' },
    { art: StepGenerate, title: t.step3Title || 'Press generate', text: t.step3Text || 'Nothing runs until you do. The batch is built in a worker and timed.' },
    { art: StepTake, title: t.step4Title || 'Take it with you', text: t.step4Text || 'Copy, download as txt/csv/json/sql, or send the list straight to another tool.' },
  ];

  const featureIcons = [IconFlavours, IconSortable, IconInspect, IconWorker, IconFormat, IconLocal];
  const features: { title: string; text: string }[] =
    Array.isArray(t.features) && t.features.length
      ? t.features
      : [
          { title: 'Eleven identifier types', text: 'UUID v1, v3, v4, v5, v6, v7, nil and max, plus ULID, NanoID and MongoDB ObjectId.' },
          { title: 'Time-ordered and monotonic', text: 'v7, v6 and ULID keep a counter, so ids minted in the same millisecond still sort in order.' },
          { title: 'Reads them back', text: 'Paste any identifier to see its version, variant, timestamp, node and raw bytes.' },
          { title: 'Off the main thread', text: 'Batches run in a Web Worker with the exact generation time and a duplicate sweep.' },
          { title: 'Output the way you need it', text: 'Case, hyphens, braces, urn:uuid:, quotes, prefix and suffix — exported as txt, csv, json or SQL.' },
          { title: 'Nothing leaves the tab', text: 'Web Crypto entropy, no network call of any kind, and nothing is stored between visits.' },
        ];

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const errorText =
    error === 'INVALID_NAMESPACE'
      ? t.error_invalid_namespace || 'That namespace is not a valid UUID.'
      : error === 'CLIPBOARD'
        ? t.error_clipboard || 'The browser refused clipboard access. Use the download button instead.'
        : error
          ? t.error_generic || 'Something went wrong while generating. Try a smaller batch.'
          : null;

  const rate = result && result.ms > 0 ? Math.round(result.count / (result.ms / 1000)) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/uuid-generator`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. w-full alone left a 0px
          gap and the rails never rendered at any window size. */}
      <main className="flex-1 flex flex-col items-center pt-40 md:pt-36 pb-24 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-uuid-generator-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-violet-950/40 border border-violet-800/30 text-violet-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(139,92,246,0.15)]">
                <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-violet-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/10 blur-[80px] rounded-full" />
              <UuidHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ---------------- Generator ---------------- */}
            <div className="lg:col-span-7 space-y-5 min-w-0">
              <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5">
                {KIND_GROUPS.map(group => (
                  <div key={group.labelKey} className="space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {t[group.labelKey] || group.fallback}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {group.kinds.map(id => (
                        <button
                          key={id}
                          onClick={() => setKind(id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer outline-none border ${
                            kind === id
                              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30'
                              : 'bg-[#160a14] border-white/5 text-slate-400 hover:text-white hover:border-violet-500/30'
                          }`}
                        >
                          {KIND_LABELS[id]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <p className="text-[11px] leading-relaxed text-slate-500 border-l-2 border-violet-500/40 pl-3">
                  {t[`kindHelp_${kind}`] || ''}
                </p>

                {/* Count — meaningless for the constants and driven by the name
                    list for v3/v5, so it is hidden rather than lying. */}
                {!isConstant && !isNamed && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        {t.label_count || 'How many'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={MAX_COUNT}
                        value={count}
                        onChange={e => {
                          const value = Number(e.target.value);
                          setCount(Number.isFinite(value) ? Math.max(1, Math.min(MAX_COUNT, Math.floor(value))) : 1);
                        }}
                        className="w-28 px-3 py-1.5 rounded-lg bg-[#160a14] border border-white/10 focus:border-violet-500/50 text-right font-mono text-xs text-violet-300 outline-none"
                      />
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10000}
                      value={Math.min(count, 10000)}
                      onChange={e => setCount(Number(e.target.value))}
                      className="w-full h-2 bg-[#160a14] rounded-full appearance-none cursor-pointer accent-violet-500 outline-none"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                      <span>1</span>
                      <span>5 000</span>
                      <span>10 000</span>
                    </div>
                    {count > 10000 && (
                      <p className="text-[10px] text-amber-400/80 font-medium">
                        {t.hint_big_batch || 'Above 10 000 the slider stops; type the exact number. The list preview stays at 300 rows — copy and download always cover the whole batch.'}
                      </p>
                    )}
                  </div>
                )}

                {/* v3/v5: the honest deterministic path — one name per line. */}
                {isNamed && (
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        {t.label_namespace || 'Namespace'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(PRESET_NAMESPACES) as (keyof typeof PRESET_NAMESPACES)[]).map(preset => (
                          <button
                            key={preset}
                            onClick={() => setNamespace(PRESET_NAMESPACES[preset])}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer border ${
                              namespace === PRESET_NAMESPACES[preset]
                                ? 'bg-violet-600/20 border-violet-500/40 text-violet-200'
                                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={namespace}
                        onChange={e => setNamespace(e.target.value)}
                        spellCheck={false}
                        className={`w-full px-4 py-2.5 rounded-xl bg-[#160a14] font-mono text-xs text-slate-200 outline-none border transition-all ${
                          namespaceValid ? 'border-white/10 focus:border-violet-500/50' : 'border-red-500/50'
                        }`}
                      />
                      {!namespaceValid && (
                        <span className="text-[10px] text-red-400 font-medium">
                          {t.error_invalid_namespace || 'That namespace is not a valid UUID.'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          {t.label_names || 'Names — one per line'}
                        </span>
                        <span className="text-[10px] font-mono text-violet-400">{names.length}</span>
                      </div>
                      <textarea
                        value={namesText}
                        onChange={e => setNamesText(e.target.value)}
                        rows={4}
                        spellCheck={false}
                        className="w-full px-4 py-3 rounded-xl bg-[#160a14] border border-white/10 focus:border-violet-500/50 font-mono text-xs text-slate-200 outline-none resize-y"
                      />
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {t.hint_deterministic ||
                          'The same namespace and name always produce the same identifier — that is the entire point of v3 and v5. To get a batch, give it a batch of names.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Run */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={generate}
                    disabled={!canGenerate}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer outline-none shadow-lg shadow-violet-600/25"
                  >
                    <Play className="w-4 h-4" />
                    {busy ? t.button_working || 'Working…' : t.button_generate || 'Generate'}
                    <span className="hidden sm:inline text-[10px] font-mono opacity-60">Ctrl+↵</span>
                  </button>

                  <button
                    onClick={undo}
                    disabled={history.cursor <= 0}
                    title={t.tooltip_undo || 'Previous batch (Ctrl+Z)'}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer outline-none"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={history.cursor >= history.entries.length - 1}
                    title={t.tooltip_redo || 'Next batch (Ctrl+Shift+Z)'}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer outline-none"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearAll}
                    disabled={!result}
                    title={t.button_clear || 'Clear'}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer outline-none"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>

                  {history.entries.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-600">
                      {history.cursor + 1}/{history.entries.length}
                    </span>
                  )}
                </div>

                {errorText && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorText}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              {result && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: t.stat_count || 'generated', value: result.count.toLocaleString('en-US') },
                    // A ten-item batch really does finish in under 0.05 ms; printing
                    // "0.0" reads like a broken timer, so say what it means.
                    { label: t.stat_time || 'milliseconds', value: result.ms < 0.05 ? '<0.1' : result.ms.toFixed(1) },
                    { label: t.stat_rate || 'per second', value: rate ? rate.toLocaleString('en-US') : '—' },
                    { label: t.stat_duplicates || 'duplicates', value: String(result.duplicates) },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-2xl bg-white/[0.03] border border-white/5 px-3 py-2.5">
                      <div className="text-base font-black text-violet-300 font-mono truncate">{stat.value}</div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Output */}
              <div className="glass-card rounded-3xl p-4 md:p-5 space-y-3">
                {!result ? (
                  <div className="py-14 text-center space-y-3">
                    <Fingerprint className="w-10 h-10 text-violet-500/40 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
                      {t.empty_state || 'Nothing has been generated yet. Choose a type, set the amount and press Generate.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {result.count > VISIBLE_ROWS
                          ? (t.label_showing || 'Showing {shown} of {total}')
                              .replace('{shown}', String(VISIBLE_ROWS))
                              .replace('{total}', result.count.toLocaleString('en-US'))
                          : `${result.count} ${t.label_uuids_generated || 'identifiers'}`}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {EXPORTS.map(id => (
                          <button
                            key={id}
                            onClick={() => setExportFormat(id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border ${
                              exportFormat === id
                                ? 'bg-violet-600/20 border-violet-500/40 text-violet-200'
                                : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                            }`}
                          >
                            {id}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="max-h-[26rem] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/5 divide-y divide-white/5">
                      {rows.map((row, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 hover:bg-violet-500/5 group">
                          <span className="w-10 shrink-0 text-[9px] font-mono text-slate-600 tabular-nums">
                            {index + 1}
                          </span>
                          <code className="flex-1 min-w-0 text-[11px] md:text-xs font-mono text-slate-200 break-all leading-relaxed">
                            {row.text}
                          </code>
                          <span className="shrink-0 text-[9px] font-mono font-bold text-violet-400/60 uppercase">
                            {row.label}
                          </span>
                          <button
                            onClick={() => handleCopyRow(index)}
                            title={t.tooltip_copy || 'Copy'}
                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:border-violet-500/30 transition-all cursor-pointer outline-none"
                          >
                            {copiedRow === index ? <Check className="w-3.5 h-3.5 text-violet-300" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleCopyAll}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none border ${
                          copiedAll
                            ? 'bg-violet-500/20 border-violet-500/50 text-violet-200'
                            : 'bg-violet-600/15 border-violet-600/30 text-violet-300 hover:bg-violet-600/25'
                        }`}
                      >
                        {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedAll ? t.button_copied_all || 'Copied' : t.button_copy_all || 'Copy all'}
                        <span className="hidden sm:inline text-[10px] font-mono opacity-60">Ctrl+⇧+C</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-xs font-black hover:bg-white/10 hover:text-white transition-all cursor-pointer outline-none"
                      >
                        <Download className="w-4 h-4" />
                        .{EXPORT_EXTENSION[exportFormat]}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <NextStepBar lang={lang} t={t} disabled={!result} getResult={getHandoffBlob} />
            </div>

            {/* ---------------- Format + inspector ---------------- */}
            <div className="lg:col-span-5 space-y-5 min-w-0">
              <div className="glass-card rounded-3xl p-5 space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {t.label_format || 'Output shape'}
                </span>

                <div className="rounded-xl bg-[#160a14] border border-white/5 px-3 py-2.5 font-mono text-[11px] text-violet-200 break-all">
                  {previewSample}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFormat(f => ({ ...f, uppercase: !f.uppercase }))}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer border ${
                      format.uppercase
                        ? 'bg-violet-600/20 border-violet-500/40 text-violet-200'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    ABC
                  </button>
                  <button
                    onClick={() => setFormat(f => ({ ...f, hyphens: !f.hyphens }))}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer border ${
                      format.hyphens
                        ? 'bg-violet-600/20 border-violet-500/40 text-violet-200'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    a-b-c
                  </button>
                  {WRAPS.map(wrap => (
                    <button
                      key={wrap.id}
                      onClick={() => setFormat(f => ({ ...f, wrap: wrap.id }))}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer border ${
                        format.wrap === wrap.id
                          ? 'bg-violet-600/20 border-violet-500/40 text-violet-200'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {wrap.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={format.prefix}
                    onChange={e => setFormat(f => ({ ...f, prefix: e.target.value }))}
                    placeholder={t.placeholder_prefix || 'prefix'}
                    className="px-3 py-2 rounded-xl bg-[#160a14] border border-white/10 focus:border-violet-500/50 font-mono text-xs text-slate-200 placeholder-slate-600 outline-none min-w-0"
                  />
                  <input
                    type="text"
                    value={format.suffix}
                    onChange={e => setFormat(f => ({ ...f, suffix: e.target.value }))}
                    placeholder={t.placeholder_suffix || 'suffix'}
                    className="px-3 py-2 rounded-xl bg-[#160a14] border border-white/10 focus:border-violet-500/50 font-mono text-xs text-slate-200 placeholder-slate-600 outline-none min-w-0"
                  />
                </div>
              </div>

              {/* Inspector + manual craft */}
              <div className="glass-card rounded-3xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {t.label_inspect || 'Inspect & craft'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => fileInput.current?.click()}
                      title={t.button_load_list || 'Load a list'}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer outline-none"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={startBlank}
                      title={t.button_blank || 'Start from 16 empty bytes'}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer outline-none"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".txt,.csv,.json,.log,text/plain"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) ingestFile(file, 'file');
                    e.target.value = '';
                  }}
                />

                <input
                  type="text"
                  value={inspectText}
                  onChange={e => {
                    setInspectText(e.target.value);
                    setCraftDirty(false);
                  }}
                  placeholder={t.placeholder_inspect || 'Paste any UUID, ULID or ObjectId'}
                  spellCheck={false}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#160a14] border border-white/10 focus:border-violet-500/50 font-mono text-xs text-slate-200 placeholder-slate-600 outline-none"
                />

                {inspection.error && (
                  <p className="text-[11px] text-amber-400/80 font-medium">
                    {t.error_unrecognised || 'That does not look like an identifier this tool knows.'}
                  </p>
                )}

                {inspection.ok && (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                      <span className="font-bold text-violet-200 truncate">{inspection.versionLabel}</span>
                      <span className="font-mono text-violet-400/70 shrink-0">{inspection.variantLabel}</span>
                    </div>
                    {inspection.timestampMs !== null && Number.isFinite(inspection.timestampMs) && (
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                          {t.field_timestamp || 'timestamp'}
                        </span>
                        <span className="font-mono text-slate-300 truncate">
                          {new Date(inspection.timestampMs).toISOString().replace('T', ' ').slice(0, 23)}Z
                        </span>
                      </div>
                    )}
                    {inspection.fields.map(field => (
                      <div key={field.label} className="flex items-center justify-between gap-2 px-3 py-1.5">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">{field.label}</span>
                        <span className="font-mono text-slate-300 truncate">{field.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Byte editor: non-destructive, the source value is never lost. */}
                {crafted && (
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div className="grid grid-cols-8 gap-1">
                      {Array.from({ length: 16 }).map((_, index) => (
                        <input
                          key={index}
                          value={craftHex.slice(index * 2, index * 2 + 2)}
                          onChange={e => editByte(index, e.target.value.replace(/[^0-9a-fA-F]/g, ''))}
                          maxLength={2}
                          spellCheck={false}
                          className={`w-full px-0 py-1.5 rounded-md text-center font-mono text-[11px] outline-none border transition-colors ${
                            index === 6
                              ? 'bg-violet-600/20 border-violet-500/40 text-violet-200'
                              : index === 8
                                ? 'bg-fuchsia-600/15 border-fuchsia-500/30 text-fuchsia-200'
                                : 'bg-[#160a14] border-white/5 text-slate-300 focus:border-violet-500/40'
                          }`}
                          title={index === 6 ? t.byte_version || 'byte 6 — version nibble' : index === 8 ? t.byte_variant || 'byte 8 — variant bits' : `byte ${index}`}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[1, 3, 4, 5, 6, 7, 8].map(version => (
                        <button
                          key={version}
                          onClick={() => craftAction(bytes => setVersion(bytes, version))}
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 hover:text-white hover:border-violet-500/30 transition-all cursor-pointer outline-none"
                        >
                          v{version}
                        </button>
                      ))}
                      <button
                        onClick={() => craftAction(setRfcVariant)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 hover:text-white hover:border-violet-500/30 transition-all cursor-pointer outline-none"
                      >
                        RFC
                      </button>
                      <button
                        onClick={() => craftAction(bytes => setV7Timestamp(bytes, Date.now()))}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 hover:text-white hover:border-violet-500/30 transition-all cursor-pointer outline-none"
                      >
                        {t.button_now || 'now'}
                      </button>
                      <button
                        onClick={() =>
                          craftAction(bytes => {
                            const next = bytes.slice();
                            next.set(randomBytes(8), 8);
                            return next;
                          })
                        }
                        title={t.button_reroll || 'Re-roll the trailing 8 bytes'}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 hover:text-white hover:border-violet-500/30 transition-all cursor-pointer outline-none"
                      >
                        <Shuffle className="w-3 h-3" />
                      </button>
                      {craftDirty && (
                        <button
                          onClick={() => {
                            setCraftDirty(false);
                            setCrafted(inspection.bytes ? inspection.bytes.slice() : null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-amber-400/80 hover:text-amber-300 transition-all cursor-pointer outline-none flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {t.button_revert || 'revert'}
                        </button>
                      )}
                    </div>

                    <div className="rounded-xl bg-[#160a14] border border-white/5 px-3 py-2.5 font-mono text-[11px] text-violet-200 break-all">
                      {craftedText}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyText(craftedText)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-all cursor-pointer outline-none"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {t.button_copy || 'Copy'}
                      </button>
                      <button
                        onClick={craftedToBatch}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/15 border border-violet-600/30 text-violet-300 text-[11px] font-bold hover:bg-violet-600/25 transition-all cursor-pointer outline-none"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {t.button_use_crafted || 'Use as output'}
                      </button>
                    </div>
                  </div>
                )}

                {imported && (
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <p className="text-[11px] text-slate-400 font-medium">
                      {(t.imported_summary || '{count} identifiers found in the list from {from}.')
                        .replace('{count}', String(imported.ids.length))
                        .replace('{from}', imported.from)}
                    </p>
                    {imported.ids.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-400">
                          {(t.imported_unique || '{n} unique').replace('{n}', String(new Set(imported.ids).size))}
                        </span>
                        <button
                          onClick={() => setInspectText(imported.ids[0])}
                          className="px-2 py-1 rounded-lg bg-violet-600/15 border border-violet-600/30 text-violet-300 font-bold cursor-pointer outline-none"
                        >
                          {t.imported_inspect || 'Inspect the first one'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-violet-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-violet-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-violet-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-violet-400" />
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
            {features.map((feature, idx) => {
              const Icon = featureIcons[idx] || IconFlavours;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 group-hover:border-violet-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-violet-400 transition-colors">
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
                <div className="inline-block px-4 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-[11px] font-black uppercase tracking-[0.2em] border border-violet-500/20">
                  {keywords[0]}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl" />
                <IconSortable className="w-20 h-20 text-violet-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#120a1c] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-violet-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoUseCaseTitle}
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

            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-violet-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-violet-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-violet-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-violet-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
                  {t.seoKeywordsTitle || 'Keywords'}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-violet-500/10 hover:border-violet-500/20 hover:text-violet-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-uuid-generator-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setActiveModal(modal)} />

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
