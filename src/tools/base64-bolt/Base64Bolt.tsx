import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  Binary,
  Check,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileText,
  Fingerprint,
  Gauge,
  Hash,
  Info,
  Loader2,
  Play,
  Redo2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
  Zap,
} from 'lucide-react';

import { AdBanner } from '../../components/shared/AdBanner';
import { useHandoffIntake } from '../../lib/useHandoff';
import { legalTranslations } from '../../locales/legal';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { HexView } from './components/HexView';
import { NextStepBar } from './components/NextStepBar';
import {
  Base64HeroArt,
  IconDiagnose,
  IconHex,
  IconLocalOnly,
  IconMeasure,
  IconRatio,
  IconRoundTrip,
  IconSniff,
  IconUrlSafe,
  IconWorker,
  StepArrive,
  StepChoose,
  StepInspect,
  StepShip,
} from './components/Illustrations';

import {
  bytesToText,
  decodeBase64,
  encodeBytes,
  encodedLength,
  HAS_NATIVE_BASE64,
  textToBytes,
  type Alphabet,
  type EncodeOptions,
  type Issue,
  type SourceCharset,
} from './lib/base64';
import { extFromMime, isPreviewableMime, sniff, type Format } from './lib/sniff';
import { measure, NO_EXTRAS, type Extras } from './lib/measure';
import { availableSnippets, renderSnippet, type SnippetId } from './lib/snippets';
import { fill, formatBytes, formatCount, PREVIEW_CHARS } from './lib/format';
import { useCodecEngine } from './lib/useCodecEngine';
import { useHistory } from './lib/useHistory';

interface Base64BoltProps {
  lang: string;
  dictionary: any;
}

type Mode = 'text' | 'file' | 'decode';
type Direction = 'encode' | 'decode';

/**
 * Above this many characters the text panes stop recomputing on every keystroke
 * and wait for the Run button. Below it, a full encode + round-trip check is
 * well under a frame.
 */
const LIVE_LIMIT = 120_000;
/** A file bigger than this is refused up front rather than eating the tab. */
const MAX_FILE = 250 * 1024 * 1024;
/** Extras (gzip + SHA-256) are skipped inline above this, to keep typing smooth. */
const INLINE_EXTRAS_LIMIT = 2 * 1024 * 1024;

const WRAP_CHOICES = [0, 64, 76, 100];

const SAMPLE_TEXT = 'Los ñus del Ártico beben café — 100% local. ✅';
const SAMPLE_BASE64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMyNTYzZWIiLz48cGF0aCBkPSJNMTggNDBWMjRoMTBhNCA0IDAgMCAxIDAgOEgxOG0wIDBoMTJhNCA0IDAgMCAxIDAgOEgxOCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMuNSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==';

function newId(): string {
  return Math.random().toString(36).slice(2);
}

/** Downloads a Blob and releases the object URL once the click has been handed off. */
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

interface FileResult {
  base64: string;
  rawBytes: number;
  encodedChars: number;
  format: Format;
  head: Uint8Array;
  extras: Extras;
  ms: number;
  name: string;
}

interface DecodedResult {
  bytes: Uint8Array;
  format: Format;
  declaredMime: string;
  alphabet: Alphabet;
  issues: Issue[];
  extras: Extras;
}

export default function Base64Bolt({ lang, dictionary }: Base64BoltProps) {
  const t = dictionary || {};

  const [mode, setMode] = useState<Mode>('text');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Motion preference is read on mount, not during render: reading it during
  // render differs between the server pass and the client one and breaks
  // hydration.
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);
    const onChange = () => setPrefersReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Which engine is in use is decided on mount for the same reason. Node has
  // no Uint8Array.toBase64 yet while current Chrome does, so reading it during
  // render made the server say "compatibility" and the client say "native" —
  // a hydration mismatch that threw away the whole island.
  const [engineKind, setEngineKind] = useState<'' | 'native' | 'fallback'>('');
  useEffect(() => setEngineKind(HAS_NATIVE_BASE64 ? 'native' : 'fallback'), []);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /** Clipboard writes can be refused (insecure context, denied permission). Say so. */
  const copy = useCallback(
    (text: string) => {
      if (!text) return;
      const done = () => notify(t.copied || 'Copied!');
      const failed = () => notify(t.copyFailed || 'Your browser blocked clipboard access');
      try {
        navigator.clipboard.writeText(text).then(done, failed);
      } catch {
        failed();
      }
    },
    [notify, t]
  );

  // -------------------------------------------------------------------------
  // Shared encoding options
  // -------------------------------------------------------------------------
  const [options, setOptions] = useState<EncodeOptions>({
    alphabet: 'base64',
    padding: true,
    wrap: 0,
    crlf: false,
  });
  const [charset, setCharset] = useState<SourceCharset>('utf-8');

  const patch = useCallback((next: Partial<EncodeOptions>) => {
    setOptions(current => ({ ...current, ...next }));
  }, []);

  // -------------------------------------------------------------------------
  // Text mode
  // -------------------------------------------------------------------------
  const [direction, setDirection] = useState<Direction>('encode');
  const source = useHistory<string>('');
  /** Held Alt previews the opposite direction without committing to it. */
  const [altHeld, setAltHeld] = useState(false);
  /** Pointer held on the output pane shows the input underneath instead. */
  const [comparing, setComparing] = useState(false);
  /** For inputs past LIVE_LIMIT: the last text the user actually asked to run. */
  const [ranText, setRanText] = useState('');
  const [textExtras, setTextExtras] = useState<Extras>(NO_EXTRAS);

  const effectiveDirection: Direction = altHeld ? (direction === 'encode' ? 'decode' : 'encode') : direction;
  const isLive = source.state.length <= LIVE_LIMIT;
  const textToProcess = isLive ? source.state : ranText;
  const stale = !isLive && ranText !== source.state;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setAltHeld(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setAltHeld(false);
    };
    // Alt+Tab away leaves keyup unheard, which would strand the preview on.
    const onBlur = () => setAltHeld(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  /**
   * The whole text result, derived rather than stored. Storing it would mean a
   * second copy of every payload in React state and a stale-output bug on every
   * option change; deriving it costs a memo that runs only when something it
   * reads actually changed.
   */
  const textResult = useMemo(() => {
    const input = textToProcess;
    if (!input) {
      return { output: '', bytes: new Uint8Array(0), issues: [] as Issue[], error: '', format: null as Format | null, lostChars: 0, roundTrip: true };
    }

    if (effectiveDirection === 'encode') {
      const { bytes, lostChars } = textToBytes(input, charset);
      const output = encodeBytes(bytes, options);
      // Round-trip: decode what we produced and compare byte for byte. This is
      // the check that catches an alphabet/padding combination the consumer will
      // not accept, and it is cheap because both sides are already in memory.
      const back = decodeBase64(output);
      let roundTrip = !back.error && back.value.bytes.length === bytes.length;
      if (roundTrip) {
        for (let i = 0; i < bytes.length; i++) {
          if (bytes[i] !== back.value.bytes[i]) {
            roundTrip = false;
            break;
          }
        }
      }
      return { output, bytes, issues: [] as Issue[], error: '', format: sniff(bytes), lostChars, roundTrip };
    }

    const { value, error } = decodeBase64(input);
    if (error) {
      return { output: '', bytes: new Uint8Array(0), issues: value.issues, error, format: null as Format | null, lostChars: 0, roundTrip: false };
    }
    const text = bytesToText(value.bytes, charset);
    return {
      output: text.value,
      bytes: value.bytes,
      issues: value.issues,
      error: text.error,
      format: sniff(value.bytes),
      lostChars: 0,
      roundTrip: true,
    };
  }, [textToProcess, effectiveDirection, charset, options]);

  // The measurements are async, so they cannot live in the memo. They are also
  // the only part that is skipped for large inputs.
  useEffect(() => {
    let cancelled = false;
    const bytes = textResult.bytes;
    if (!bytes.length || bytes.length > INLINE_EXTRAS_LIMIT) {
      setTextExtras(NO_EXTRAS);
      return;
    }
    measure(bytes, true).then(extras => {
      if (!cancelled) setTextExtras(extras);
    });
    return () => {
      cancelled = true;
    };
  }, [textResult.bytes]);

  const swapTextSides = useCallback(() => {
    if (!textResult.output) return;
    source.reset(textResult.output);
    setRanText(textResult.output);
    setDirection(current => (current === 'encode' ? 'decode' : 'encode'));
  }, [source, textResult.output]);

  // -------------------------------------------------------------------------
  // File mode — nothing here runs on upload
  // -------------------------------------------------------------------------
  const engine = useCodecEngine();
  const [staged, setStaged] = useState<File | null>(null);
  const [stagedError, setStagedError] = useState('');
  const [encoding, setEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileResult, setFileResult] = useState<FileResult | null>(null);
  const [snippet, setSnippet] = useState<SnippetId>('dataurl');
  const runIdRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /**
   * Staging only. Reading, encoding and measuring all wait for the button: a
   * 200 MB file dropped by accident should cost nothing, and the user has not
   * chosen an alphabet yet.
   */
  const stageFile = useCallback(
    (file: File) => {
      if (file.size > MAX_FILE) {
        setStaged(null);
        setStagedError(fill(t.errorTooBig || 'That file is {0}; the limit is {1}.', formatBytes(file.size), formatBytes(MAX_FILE)));
        return;
      }
      setStagedError('');
      setStaged(file);
      setFileResult(null);
      setProgress(0);
      setMode('file');
    },
    [t]
  );

  // A file handed over by another tool arrives exactly like a dropped one:
  // staged, not encoded.
  useHandoffIntake(file => stageFile(file));

  const runEncode = useCallback(async () => {
    if (!staged || encoding) return;
    const id = newId();
    runIdRef.current = id;
    setEncoding(true);
    setProgress(0);
    try {
      const done = await engine.encodeFile(id, staged, options, true, loaded => {
        setProgress(staged.size ? loaded / staged.size : 0);
      });
      if (!done || done.type !== 'encoded') {
        setEncoding(false);
        return;
      }
      setFileResult({
        base64: done.base64,
        rawBytes: done.rawBytes,
        encodedChars: done.encodedChars,
        format: done.format,
        head: done.head,
        extras: done.extras,
        ms: done.ms,
        name: staged.name,
      });
      setProgress(1);
      setSnippet(done.format.previewable ? 'dataurl' : 'raw');
    } catch (error) {
      const code = error instanceof Error ? error.message : 'crashed';
      setStagedError(t[`error_${code}`] || t.error_crashed || 'The encoder failed on this file.');
    } finally {
      setEncoding(false);
    }
  }, [staged, encoding, engine, options, t]);

  const cancelEncode = useCallback(() => {
    if (runIdRef.current) engine.cancel(runIdRef.current);
    setEncoding(false);
  }, [engine]);

  /** Options changed after a run: the shown output no longer matches them. */
  const fileStale = useMemo(() => {
    if (!fileResult) return false;
    const expected = encodedLength(fileResult.rawBytes, options.padding);
    return expected !== fileResult.encodedChars;
  }, [fileResult, options.padding]);

  const snippetText = useMemo(() => {
    if (!fileResult) return '';
    return renderSnippet(snippet, {
      base64: fileResult.base64,
      mime: fileResult.format.mime,
      name: fileResult.name,
      previewable: fileResult.format.previewable,
    });
  }, [fileResult, snippet]);

  // -------------------------------------------------------------------------
  // Decode mode
  // -------------------------------------------------------------------------
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeRan, setDecodeRan] = useState('');
  const [decoded, setDecoded] = useState<DecodedResult | null>(null);
  const [decodeError, setDecodeError] = useState('');
  const [decoding, setDecoding] = useState(false);
  const [mimeOverride, setMimeOverride] = useState('');
  const decodeFileRef = useRef<HTMLInputElement>(null);

  const decodeIsLive = decodeInput.length <= LIVE_LIMIT;
  const decodeStale = !decodeIsLive && decodeRan !== decodeInput;

  const runDecode = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setDecoded(null);
        setDecodeError('');
        return;
      }
      const id = newId();
      setDecoding(true);
      try {
        const done = await engine.decodeText(id, text, true);
        if (!done || done.type !== 'decoded') return;
        setDecoded({
          bytes: done.bytes,
          format: done.format,
          declaredMime: done.declaredMime,
          alphabet: done.alphabet,
          issues: done.issues as Issue[],
          extras: done.extras,
        });
        setDecodeError('');
        setMimeOverride('');
        setDecodeRan(text);
      } catch (error) {
        const code = error instanceof Error ? error.message : 'undecodable';
        setDecoded(null);
        setDecodeError(code);
      } finally {
        setDecoding(false);
      }
    },
    [engine]
  );

  // Under the live limit the decode happens as you paste; past it, on demand.
  // The debounce is what keeps a 100 000-character paste from decoding once per
  // keystroke while someone edits the tail of it.
  useEffect(() => {
    if (mode !== 'decode' || !decodeIsLive) return;
    const timer = setTimeout(() => runDecode(decodeInput), 160);
    return () => clearTimeout(timer);
  }, [decodeInput, decodeIsLive, mode, runDecode]);

  const effectiveMime = mimeOverride || (decoded ? decoded.format.mime : '');
  const canPreview = !!effectiveMime && isPreviewableMime(effectiveMime);

  // The preview needs an object URL, and an object URL needs revoking: a data
  // URL here would mean a second 33%-larger copy of every payload in the DOM.
  const [previewUrl, setPreviewUrl] = useState('');
  useEffect(() => {
    if (!decoded || !canPreview || !decoded.bytes.length) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(new Blob([decoded.bytes as BlobPart], { type: effectiveMime }));
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [decoded, canPreview, effectiveMime]);

  const decodedText = useMemo(() => {
    if (!decoded || canPreview) return { value: '', error: '' };
    if (decoded.bytes.length > INLINE_EXTRAS_LIMIT) return { value: '', error: 'too-large-to-show' };
    return bytesToText(decoded.bytes, 'utf-8');
  }, [decoded, canPreview]);

  const decodedName = useMemo(() => {
    if (!decoded) return '';
    const ext = mimeOverride ? extFromMime(mimeOverride) : decoded.format.ext;
    return `base64bolt-${Date.now().toString(36)}.${ext}`;
  }, [decoded, mimeOverride]);

  // -------------------------------------------------------------------------
  // Handoff out
  // -------------------------------------------------------------------------
  const getTextHandoff = useCallback(async () => {
    if (!textResult.output) return null;
    return {
      blob: new Blob([textResult.output], { type: 'text/plain;charset=utf-8' }),
      name: `base64bolt-${Date.now().toString(36)}.txt`,
    };
  }, [textResult.output]);

  const getFileHandoff = useCallback(async () => {
    if (!fileResult) return null;
    return {
      blob: new Blob([snippetText || fileResult.base64], { type: 'text/plain;charset=utf-8' }),
      name: `${fileResult.name.replace(/\.[^.]+$/, '')}.base64.txt`,
    };
  }, [fileResult, snippetText]);

  const getDecodedHandoff = useCallback(async () => {
    if (!decoded || !decoded.bytes.length) return null;
    return {
      blob: new Blob([decoded.bytes as BlobPart], { type: effectiveMime || 'application/octet-stream' }),
      name: decodedName,
    };
  }, [decoded, effectiveMime, decodedName]);

  // -------------------------------------------------------------------------
  // Reset + shortcuts
  // -------------------------------------------------------------------------
  const resetWorkspace = useCallback(() => {
    source.reset('');
    setRanText('');
    setStaged(null);
    setStagedError('');
    setFileResult(null);
    setProgress(0);
    setDecodeInput('');
    setDecodeRan('');
    setDecoded(null);
    setDecodeError('');
    setMimeOverride('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (decodeFileRef.current) decodeFileRef.current.value = '';
  }, [source]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) source.redo();
        else source.undo();
      } else if (key === 'y') {
        event.preventDefault();
        source.redo();
      } else if (key === 'enter') {
        event.preventDefault();
        if (mode === 'file') runEncode();
        else if (mode === 'decode') runDecode(decodeInput);
        else setRanText(source.state);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [source, mode, runEncode, runDecode, decodeInput]);

  // -------------------------------------------------------------------------
  // Static content
  // -------------------------------------------------------------------------
  const steps = useMemo(
    () => [
      { art: StepArrive, title: t.step1Title, text: t.step1Text },
      { art: StepChoose, title: t.step2Title, text: t.step2Text },
      { art: StepInspect, title: t.step3Title, text: t.step3Text },
      { art: StepShip, title: t.step4Title, text: t.step4Text },
    ],
    [t]
  );

  const featureIcons = [IconRatio, IconUrlSafe, IconHex, IconDiagnose, IconSniff, IconWorker, IconMeasure, IconRoundTrip];
  const features: any[] = Array.isArray(t.features) ? t.features : [];
  const faqs: any[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const tabs: { id: Mode; icon: React.ReactNode; label: string }[] = [
    { id: 'text', icon: <FileText className="w-4 h-4" />, label: t.tab_text || 'Text' },
    { id: 'file', icon: <Upload className="w-4 h-4" />, label: t.tab_file || 'File → Base64' },
    { id: 'decode', icon: <Download className="w-4 h-4" />, label: t.tab_decode || 'Base64 → file' },
  ];

  const issueLabel = (issue: Issue): string => {
    const template = t[`issue_${issue.kind}`] || issue.kind;
    return fill(template, issue.detail || '', issue.at === undefined ? '' : issue.at);
  };

  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex flex-col bg-[#020610] text-slate-200 font-sans relative">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/base64-bolt`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. With a plain max-w-6xl the
          gap at 1400px is 124px against the 168px the rails need, so they never
          rendered and never said so. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-base64-bolt-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-blue-950/40 border border-blue-800/30 text-blue-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(59,130,246,0.15)]">
                <Binary className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.seoHeroTitle || 'Base64 Encoder, Decoder & Inspector'}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.heroPoints || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full" />
              <Base64HeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="space-y-5">
            <div className="flex flex-wrap gap-1 p-1.5 rounded-2xl bg-[#0a1a3a]/80 border border-white/5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={`flex-1 min-w-[9rem] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none ${
                    mode === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Shared options                                                   */}
            {/* ---------------------------------------------------------------- */}
            <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mr-1">
                {t.optionsTitle || 'Output'}
              </span>

              <div className="flex rounded-xl bg-black/30 border border-white/5 p-1">
                {(['base64', 'base64url'] as Alphabet[]).map(alphabet => (
                  <button
                    key={alphabet}
                    onClick={() => patch({ alphabet })}
                    title={alphabet === 'base64url' ? t.alphabetUrlHint : t.alphabetStandardHint}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer outline-none ${
                      options.alphabet === alphabet ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {alphabet === 'base64' ? t.alphabetStandard || 'A-Z a-z 0-9 + /' : t.alphabetUrl || 'URL-safe - _'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => patch({ padding: !options.padding })}
                title={t.paddingHint}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer outline-none ${
                  options.padding
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {t.padding || 'Padding ='}
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {t.wrap || 'Wrap'}
                </span>
                <div className="flex rounded-xl bg-black/30 border border-white/5 p-1">
                  {WRAP_CHOICES.map(width => (
                    <button
                      key={width}
                      onClick={() => patch({ wrap: width })}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer outline-none ${
                        options.wrap === width ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {width === 0 ? t.wrapNone || 'off' : width}
                    </button>
                  ))}
                </div>
              </div>

              {options.wrap > 0 && (
                <button
                  onClick={() => patch({ crlf: !options.crlf })}
                  title={t.crlfHint}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer outline-none ${
                    options.crlf
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  CRLF
                </button>
              )}

              {mode === 'text' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {t.charset || 'Charset'}
                  </span>
                  <div className="flex rounded-xl bg-black/30 border border-white/5 p-1">
                    {(['utf-8', 'latin1'] as SourceCharset[]).map(cs => (
                      <button
                        key={cs}
                        onClick={() => setCharset(cs)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer outline-none ${
                          charset === cs ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cs === 'utf-8' ? 'UTF-8' : 'Latin-1'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {engineKind && (
                <span
                  className="ml-auto hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600"
                  title={engineKind === 'native' ? t.engineNativeHint : t.engineFallbackHint}
                >
                  <Zap className={`w-3 h-3 ${engineKind === 'native' ? 'text-blue-400' : 'text-slate-600'}`} />
                  {engineKind === 'native'
                    ? t.engineNative || 'Native engine'
                    : t.engineFallback || 'Compatibility engine'}
                </span>
              )}
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* TEXT MODE                                                        */}
            {/* ---------------------------------------------------------------- */}
            {mode === 'text' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-xl bg-black/30 border border-white/5 p-1">
                    {(['encode', 'decode'] as Direction[]).map(dir => (
                      <button
                        key={dir}
                        onClick={() => setDirection(dir)}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer outline-none ${
                          effectiveDirection === dir ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {dir === 'encode' ? t.mode_encode || 'Encode' : t.mode_decode || 'Decode'}
                      </button>
                    ))}
                  </div>

                  <span className="hidden sm:inline text-[10px] font-medium text-slate-600">
                    {t.altHint || 'Hold Alt to preview the reverse'}
                  </span>

                  <span className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

                  <button
                    onClick={() => source.undo()}
                    disabled={!source.canUndo}
                    title="Ctrl+Z"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    {t.undo || 'Undo'}
                  </button>
                  <button
                    onClick={() => source.redo()}
                    disabled={!source.canRedo}
                    title="Ctrl+Shift+Z"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    {t.redo || 'Redo'}
                  </button>

                  <button
                    onClick={() => source.reset(direction === 'encode' ? SAMPLE_TEXT : SAMPLE_BASE64)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-600/25 text-blue-300 text-xs font-bold hover:bg-blue-600/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.loadSample || 'Load an example'}
                  </button>

                  <button
                    onClick={resetWorkspace}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.button_clear || 'Clear all'}
                  </button>

                  {toast && (
                    <span className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      {toast}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Input */}
                  <div className="flex flex-col glass-card rounded-3xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50 gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider truncate">
                        {effectiveDirection === 'encode'
                          ? t.label_input || 'Plain text'
                          : t.label_base64_input || 'Base64 string'}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono shrink-0">
                        {formatCount(source.state.length)} {t.chars || 'chars'}
                      </span>
                    </div>
                    <textarea
                      value={source.state}
                      onChange={e => source.set(e.target.value)}
                      placeholder={
                        effectiveDirection === 'encode'
                          ? t.placeholder_encode || 'Type or paste text to encode…'
                          : t.placeholder_decode || 'Paste a Base64 string or a data: URL…'
                      }
                      className="w-full h-64 md:h-72 p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-sm focus:outline-none resize-none scrollbar-thin"
                      spellCheck={false}
                    />
                  </div>

                  {/* Output */}
                  <div className="flex flex-col glass-card rounded-3xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50 gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider truncate">
                        {comparing
                          ? t.label_showing_input || 'Your input'
                          : effectiveDirection === 'encode'
                            ? t.label_base64_output || 'Base64'
                            : t.label_decoded_output || 'Decoded text'}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-600 font-mono">
                          {formatCount(textResult.output.length)}
                        </span>
                        <button
                          onMouseDown={() => setComparing(true)}
                          onMouseUp={() => setComparing(false)}
                          onMouseLeave={() => setComparing(false)}
                          onTouchStart={() => setComparing(true)}
                          onTouchEnd={() => setComparing(false)}
                          disabled={!textResult.output}
                          title={t.holdCompare || 'Hold to see your input'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copy(textResult.output)}
                          disabled={!textResult.output}
                          title={t.tooltip_copy || 'Copy to clipboard'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-64 md:h-72 p-5 overflow-auto font-mono text-sm break-all whitespace-pre-wrap text-slate-200 scrollbar-thin">
                      {stale ? (
                        <span className="text-amber-300/80 text-xs">{t.bigInputHint}</span>
                      ) : comparing ? (
                        <span className="text-slate-500">{source.state}</span>
                      ) : textResult.error ? (
                        <div className="flex items-start gap-2 text-rose-300 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{t[`error_${textResult.error}`] || textResult.error}</span>
                        </div>
                      ) : (
                        textResult.output.slice(0, PREVIEW_CHARS) || (
                          <span className="text-slate-600">{t.placeholder_output || 'The result appears here…'}</span>
                        )
                      )}
                      {!comparing && textResult.output.length > PREVIEW_CHARS && (
                        <p className="mt-4 text-[10px] text-slate-600 font-sans">
                          {fill(t.previewTruncated || 'Showing the first {0} characters. Copy and download use the whole result.', formatCount(PREVIEW_CHARS))}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Run button for inputs past the live limit */}
                {!isLive && (
                  <button
                    onClick={() => setRanText(source.state)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    {t.runBtn || 'Run'}
                  </button>
                )}

                {/* Stats */}
                {textResult.output && !textResult.error && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <Stat
                      icon={<Hash className="w-3.5 h-3.5" />}
                      label={t.statBytes || 'Payload'}
                      value={formatBytes(textResult.bytes.length)}
                    />
                    <Stat
                      icon={<IconRatio className="w-3.5 h-3.5" />}
                      label={t.statOverhead || 'Size vs source'}
                      value={
                        textResult.bytes.length
                          ? `${Math.round((textResult.output.length / textResult.bytes.length) * 100)}%`
                          : '—'
                      }
                    />
                    <Stat
                      icon={<Gauge className="w-3.5 h-3.5" />}
                      label={t.statGzip || 'Gzipped'}
                      value={textExtras.gzipBytes >= 0 ? formatBytes(textExtras.gzipBytes) : '—'}
                    />
                    <Stat
                      icon={<IconSniff className="w-3.5 h-3.5" />}
                      label={t.statFormat || 'Detected'}
                      value={textResult.format ? textResult.format.label : '—'}
                    />
                    <Stat
                      icon={<IconRoundTrip className="w-3.5 h-3.5" />}
                      label={t.statRoundTrip || 'Round trip'}
                      value={textResult.roundTrip ? t.roundTripOk || 'Reversible' : t.roundTripFail || 'Not reversible'}
                      tone={textResult.roundTrip ? 'ok' : 'warn'}
                    />
                  </div>
                )}

                {/* Diagnostics */}
                {(textResult.issues.length > 0 || textResult.lostChars > 0) && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t.issuesTitle || 'What we noticed'}
                    </p>
                    <ul className="space-y-1.5">
                      {textResult.lostChars > 0 && (
                        <li className="text-xs text-amber-200/90 flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          {fill(t.issue_lost_surrogate || '{0} unpaired surrogate(s) were replaced.', textResult.lostChars)}
                        </li>
                      )}
                      {textResult.issues.map((issue, i) => (
                        <li key={i} className="text-xs text-amber-200/90 flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          {issueLabel(issue)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={swapTextSides}
                    disabled={!textResult.output}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/10 border border-blue-600/30 text-blue-300 text-xs font-black hover:bg-blue-600/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    {t.button_swap || 'Send the result back to the input'}
                  </button>
                  <button
                    onClick={() =>
                      downloadBlob(
                        new Blob([textResult.output], { type: 'text/plain;charset=utf-8' }),
                        `base64bolt-${Date.now().toString(36)}.txt`
                      )
                    }
                    disabled={!textResult.output}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-xs font-black hover:bg-white/10 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {t.downloadTxt || 'Download as .txt'}
                  </button>
                </div>

                <NextStepBar lang={lang} t={t} getResult={getTextHandoff} disabled={!textResult.output} />
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* FILE MODE                                                        */}
            {/* ---------------------------------------------------------------- */}
            {mode === 'file' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Intake */}
                  <div className="flex flex-col glass-card rounded-3xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        {t.label_stage_file || 'Choose a file'}
                      </span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div
                        onDragOver={e => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={e => {
                          e.preventDefault();
                          setDragOver(false);
                        }}
                        onDrop={e => {
                          e.preventDefault();
                          setDragOver(false);
                          const file = e.dataTransfer.files && e.dataTransfer.files[0];
                          if (file) stageFile(file);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 md:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 group ${
                          dragOver ? 'border-blue-500/60 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/40 hover:bg-slate-950/40'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={e => {
                            const file = e.target.files && e.target.files[0];
                            if (file) stageFile(file);
                          }}
                          className="hidden"
                        />
                        <div className="w-14 h-14 bg-white/5 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all">
                          <FileCode2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                            {t.file_drag || 'Drop any file here, or click to browse'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {fill(t.file_formats || 'Any file type — images, fonts, PDFs, WASM. Up to {0}.', formatBytes(MAX_FILE))}
                          </p>
                        </div>
                      </div>

                      {stagedError && (
                        <div className="flex items-start gap-2 text-rose-300 text-xs rounded-xl border border-rose-500/25 bg-rose-500/10 p-3">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{stagedError}</span>
                        </div>
                      )}

                      {staged && (
                        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{staged.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {formatBytes(staged.size)} ·{' '}
                                {fill(
                                  t.willProduce || 'will produce ~{0} characters',
                                  formatCount(encodedLength(staged.size, options.padding))
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setStaged(null);
                                setFileResult(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="w-8 h-8 shrink-0 rounded-lg bg-white/5 border border-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-[10px] text-slate-500 flex items-start gap-1.5">
                            <Info className="w-3 h-3 shrink-0 mt-0.5 text-blue-400" />
                            {t.nothingAutomatic || 'Nothing has been read yet. Pick your options, then press Encode.'}
                          </p>

                          {encoding ? (
                            <div className="space-y-2">
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-[width] duration-150"
                                  style={{ width: `${Math.round(progress * 100)}%` }}
                                />
                              </div>
                              <button
                                onClick={cancelEncode}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-black hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                                {t.cancel || 'Stop'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={runEncode}
                              title="Ctrl+Enter"
                              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-500 transition-all cursor-pointer"
                            >
                              <Play className="w-4 h-4" />
                              {t.encodeBtn || 'Encode to Base64'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Output */}
                  <div className="flex flex-col glass-card rounded-3xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50 gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider truncate">
                        {t.label_snippet || 'Ready to paste'}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copy(snippetText)}
                          disabled={!snippetText}
                          title={t.tooltip_copy || 'Copy to clipboard'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            fileResult &&
                            downloadBlob(
                              new Blob([snippetText], { type: 'text/plain;charset=utf-8' }),
                              `${fileResult.name.replace(/\.[^.]+$/, '')}.base64.txt`
                            )
                          }
                          disabled={!snippetText}
                          title={t.downloadTxt || 'Download as .txt'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {fileResult && (
                      <div className="flex flex-wrap gap-1 px-4 py-3 border-b border-white/5">
                        {availableSnippets(true).map(item => (
                          <button
                            key={item.id}
                            onClick={() => setSnippet(item.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer outline-none ${
                              snippet === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="w-full h-64 p-5 overflow-auto font-mono text-xs break-all whitespace-pre-wrap text-slate-200 scrollbar-thin">
                      {snippetText ? (
                        <>
                          {snippetText.slice(0, PREVIEW_CHARS)}
                          {snippetText.length > PREVIEW_CHARS && (
                            <p className="mt-4 text-[10px] text-slate-600 font-sans">
                              {fill(
                                t.previewTruncated ||
                                  'Showing the first {0} characters. Copy and download use the whole result.',
                                formatCount(PREVIEW_CHARS)
                              )}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-600">
                          {t.placeholder_file_output || 'Stage a file and press Encode to get the snippet.'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {fileStale && (
                  <p className="text-xs text-amber-300/90 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t.optionsChanged || 'The options changed since this ran. Press Encode again.'}
                  </p>
                )}

                {fileResult && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <Stat icon={<Hash className="w-3.5 h-3.5" />} label={t.statBytes || 'Payload'} value={formatBytes(fileResult.rawBytes)} />
                      <Stat icon={<FileText className="w-3.5 h-3.5" />} label={t.statChars || 'Base64'} value={formatCount(fileResult.encodedChars)} />
                      <Stat
                        icon={<IconRatio className="w-3.5 h-3.5" />}
                        label={t.statOverhead || 'Size vs source'}
                        value={fileResult.rawBytes ? `${Math.round((fileResult.encodedChars / fileResult.rawBytes) * 100)}%` : '—'}
                      />
                      <Stat
                        icon={<Gauge className="w-3.5 h-3.5" />}
                        label={t.statGzip || 'Gzipped'}
                        value={fileResult.extras.gzipBytes >= 0 ? formatBytes(fileResult.extras.gzipBytes) : '—'}
                      />
                      <Stat icon={<IconSniff className="w-3.5 h-3.5" />} label={t.statFormat || 'Detected'} value={fileResult.format.label} />
                      <Stat icon={<Zap className="w-3.5 h-3.5" />} label={t.statTime || 'Took'} value={`${Math.round(fileResult.ms)} ms`} />
                    </div>

                    {fileResult.extras.sha256 && (
                      <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                          <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
                          {t.sha256Title || 'SHA-256 of the original bytes'}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 break-all">{fileResult.extras.sha256}</p>
                        <p className="text-[10px] text-slate-600">{t.sha256Hint}</p>
                      </div>
                    )}

                    <div className="glass-card rounded-3xl overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
                        <IconHex className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          {t.hexTitle || 'First bytes'}
                        </span>
                      </div>
                      <HexView bytes={fileResult.head} totalBytes={fileResult.rawBytes} signatureLength={4} t={t} />
                    </div>

                    <NextStepBar lang={lang} t={t} getResult={getFileHandoff} disabled={!fileResult} />
                  </>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* DECODE MODE                                                      */}
            {/* ---------------------------------------------------------------- */}
            {mode === 'decode' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => decodeFileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {t.openTextFile || 'Open a .txt / .b64 file'}
                  </button>
                  <input
                    type="file"
                    ref={decodeFileRef}
                    accept=".txt,.b64,.base64,.pem,text/plain"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      const text = await file.text();
                      setDecodeInput(text);
                      if (text.length > LIVE_LIMIT) runDecode(text);
                    }}
                  />
                  <button
                    onClick={() => setDecodeInput(SAMPLE_BASE64)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-600/25 text-blue-300 text-xs font-bold hover:bg-blue-600/20 transition-all cursor-pointer"
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
                    <span className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      {toast}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Input */}
                  <div className="flex flex-col glass-card rounded-3xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50 gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider truncate">
                        {t.label_base64_input || 'Base64 string'}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono shrink-0">
                        {formatCount(decodeInput.length)}
                      </span>
                    </div>
                    <textarea
                      value={decodeInput}
                      onChange={e => setDecodeInput(e.target.value)}
                      placeholder={t.placeholder_decode_file || 'Paste a Base64 payload or a whole data: URL…'}
                      className="w-full h-64 md:h-72 p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none resize-none scrollbar-thin"
                      spellCheck={false}
                    />
                    {(decodeStale || decoding) && (
                      <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
                        <button
                          onClick={() => runDecode(decodeInput)}
                          disabled={decoding}
                          title="Ctrl+Enter"
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-500 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {decoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          {t.decodeBtn || 'Decode'}
                        </button>
                        {decodeStale && <span className="text-[10px] text-amber-300/80">{t.bigInputHint}</span>}
                      </div>
                    )}
                  </div>

                  {/* Result */}
                  <div className="flex flex-col glass-card rounded-3xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50 gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider truncate">
                        {t.label_decoded || 'What came out'}
                      </span>
                      {decoded && decoded.bytes.length > 0 && (
                        <button
                          onClick={() =>
                            downloadBlob(
                              new Blob([decoded.bytes as BlobPart], { type: effectiveMime || 'application/octet-stream' }),
                              decodedName
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-300 text-[11px] font-bold hover:bg-blue-600/30 transition-all cursor-pointer shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          .{mimeOverride ? extFromMime(mimeOverride) : decoded.format.ext}
                        </button>
                      )}
                    </div>

                    <div className="w-full h-64 md:h-72 p-5 overflow-auto flex items-center justify-center scrollbar-thin">
                      {decodeError ? (
                        <div className="flex items-start gap-2 text-rose-300 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{t[`error_${decodeError}`] || t.error_undecodable}</span>
                        </div>
                      ) : previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={t.label_decoded || 'Decoded'}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      ) : decoded && decodedText.value ? (
                        <pre className="w-full h-full font-mono text-xs whitespace-pre-wrap break-all text-slate-300 self-start">
                          {decodedText.value.slice(0, PREVIEW_CHARS)}
                        </pre>
                      ) : decoded && decoded.bytes.length ? (
                        <div className="text-center space-y-2">
                          <IconSniff className="w-10 h-10 text-blue-400 mx-auto" />
                          <p className="text-sm font-bold text-white">{decoded.format.label}</p>
                          <p className="text-xs text-slate-500">{formatBytes(decoded.bytes.length)}</p>
                          <p className="text-[10px] text-slate-600 max-w-xs">
                            {t.noPreview || 'This format has no browser preview. Download it or send it to another tool.'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">
                          {t.placeholder_decoded || 'Paste a payload to see what it really is.'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {decoded && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Stat icon={<Hash className="w-3.5 h-3.5" />} label={t.statBytes || 'Payload'} value={formatBytes(decoded.bytes.length)} />
                      <Stat icon={<IconSniff className="w-3.5 h-3.5" />} label={t.statFormat || 'Detected'} value={decoded.format.label} />
                      <Stat
                        icon={<IconUrlSafe className="w-3.5 h-3.5" />}
                        label={t.statAlphabet || 'Alphabet'}
                        value={decoded.alphabet === 'base64url' ? t.alphabetUrl || 'URL-safe - _' : t.alphabetStandard || 'A-Z a-z 0-9 + /'}
                      />
                      <Stat
                        icon={<Gauge className="w-3.5 h-3.5" />}
                        label={t.statGzip || 'Gzipped'}
                        value={decoded.extras.gzipBytes >= 0 ? formatBytes(decoded.extras.gzipBytes) : '—'}
                      />
                    </div>

                    {/* Manual override: the sniff is right almost always, and the
                        user owns the exception. */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {t.mimeOverrideTitle || 'Treat it as'}
                      </span>
                      <select
                        value={mimeOverride || decoded.format.mime}
                        onChange={e => setMimeOverride(e.target.value === decoded.format.mime ? '' : e.target.value)}
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                      >
                        {[
                          decoded.format.mime,
                          'image/png',
                          'image/jpeg',
                          'image/gif',
                          'image/webp',
                          'image/svg+xml',
                          'application/pdf',
                          'application/json',
                          'text/plain',
                          'font/woff2',
                          'application/octet-stream',
                        ]
                          .filter((mime, i, all) => all.indexOf(mime) === i)
                          .map(mime => (
                            <option key={mime} value={mime}>
                              {mime}
                            </option>
                          ))}
                      </select>
                      {decoded.declaredMime && decoded.declaredMime !== decoded.format.mime && (
                        <span className="text-[10px] text-amber-300/90 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          {fill(t.mimeMismatch || 'The data URL claims {0}, the bytes say {1}.', decoded.declaredMime, decoded.format.mime)}
                        </span>
                      )}
                    </div>

                    {decoded.issues.length > 0 && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t.issuesTitle || 'What we noticed'}
                        </p>
                        <ul className="space-y-1.5">
                          {decoded.issues.map((issue, i) => (
                            <li key={i} className="text-xs text-amber-200/90 flex items-start gap-2">
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              {issueLabel(issue)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {decoded.extras.sha256 && (
                      <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                          <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
                          {t.sha256TitleDecoded || 'SHA-256 of the decoded bytes'}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 break-all">{decoded.extras.sha256}</p>
                      </div>
                    )}

                    <div className="glass-card rounded-3xl overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
                        <IconHex className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          {t.hexTitle || 'First bytes'}
                        </span>
                      </div>
                      <HexView bytes={decoded.bytes} totalBytes={decoded.bytes.length} signatureLength={4} t={t} />
                    </div>

                    <NextStepBar
                      lang={lang}
                      t={t}
                      getResult={getDecodedHandoff}
                      disabled={!decoded.bytes.length}
                      isImage={canPreview}
                    />
                  </>
                )}
              </div>
            )}
          </section>

          <AdBanner id="adsense-base64-bolt-mid" />

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-blue-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-blue-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-blue-400" />
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
          {features.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => {
                const Icon = featureIcons[idx] || IconRatio;
                return (
                  <div
                    key={idx}
                    className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 group-hover:border-blue-500/40 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                  </div>
                );
              })}
            </section>
          )}

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                {keywords.length > 0 && (
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                    {keywords[0]}
                  </div>
                )}
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
                      <span className="w-7 h-7 shrink-0 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />
                <IconLocalOnly className="w-20 h-20 text-blue-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#04102a] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoUseCaseTitle}</h2>
                <div className="h-1.5 w-20 bg-blue-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {keywords[1] || t.seoUseCaseTitle}
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
                  <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq, idx) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-blue-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-blue-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
                  {keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-base64-bolt-bottom" />
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

// ---------------------------------------------------------------------------

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'ok' | 'warn';
}> = ({ icon, label, value, tone }) => (
  <div className="rounded-2xl border border-white/5 bg-black/30 px-4 py-3 space-y-1 min-w-0">
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 flex items-center gap-1.5 truncate">
      <span className="text-blue-400 shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </p>
    <p
      className={`text-sm font-bold truncate ${
        tone === 'warn' ? 'text-amber-300' : tone === 'ok' ? 'text-blue-300' : 'text-white'
      }`}
      title={value}
    >
      {value}
    </p>
  </div>
);
