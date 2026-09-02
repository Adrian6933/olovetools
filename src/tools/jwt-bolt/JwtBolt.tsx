import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Download,
  Eye,
  FolderOpen,
  Loader2,
  PenLine,
  PlayCircle,
  Redo2,
  RotateCcw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Undo2,
  Wand2,
  XCircle,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import { CodeBox, jsonErrorLine } from './components/CodeBox';
import { NextStepBar } from './components/NextStepBar';
import {
  IconAttack,
  IconClaims,
  IconClock,
  IconHandoff,
  IconKeys,
  IconLocal,
  IconSign,
  IconVerify,
  JwtHeroArt,
  STEP_ART,
} from './components/Illustrations';

import type { Algorithm, ClaimExpectations, KeyInput, KeyKind, VerifyResult } from './types';
import { DEFAULT_EXPECTATIONS } from './types';
import { claimsOf, decodeToken, headerOf, KNOWN_ALGS } from './lib/decode';
import { generateKeyPair, randomSecret, signToken, specFor, verifySignature } from './lib/crypto';
import { formatDuration, lifetimeProgress, validateClaims } from './lib/claims';
import { useTextHistory } from './lib/history';
import { DEFAULT_HEADER, defaultPayload, SAMPLES } from './lib/samples';
import { ACCEPT_ATTRIBUTE, classifyDrop, copyText, downloadText, extractToken, MAX_BYTES, readTextFile } from './lib/io';

interface JwtBoltProps {
  lang: string;
  dictionary: any;
}

type Tab = 'inspect' | 'build';
type LegalKey = 'privacy' | 'terms' | 'cookies';

interface ParkedFile {
  name: string;
  text: string;
  as: 'token' | 'key';
  bytes: number;
}

const ISSUE_FALLBACK: Record<string, string> = {
  empty: 'Paste a token to inspect it.',
  'segment-count': 'A JWT has three dot-separated segments.',
  'not-base64url': 'This segment is not valid base64url.',
  'bad-utf8': 'This segment does not decode to valid UTF-8.',
  'not-json': 'This segment is not valid JSON.',
  'not-object': 'This segment decodes to JSON, but not to an object.',
  'alg-none': 'Unsecured token: alg is "none", so there is nothing to verify.',
  'alg-missing': 'The header has no alg.',
  'alg-unknown': 'Unrecognised algorithm.',
  'empty-signature': 'The signature segment is empty.',
  'typ-mismatch': 'typ is not JWT.',
  'crit-unsupported': 'The header marks extensions as critical.',
  'nested-jwt': 'The payload is itself a JWT (cty says so).',
};

const CHECK_FALLBACK: Record<string, string> = {
  exp: 'Not expired (exp)',
  nbf: 'Already active (nbf)',
  iat: 'Not issued in the future (iat)',
  'max-age': 'Within the maximum age',
  iss: 'Issuer matches (iss)',
  aud: 'Audience matches (aud)',
  sub: 'Subject matches (sub)',
  typ: 'Type is JWT (typ)',
  'exp-required': 'exp is required and missing',
  'exp-type': 'exp is not a number',
  'nbf-type': 'nbf is not a number',
  'iat-type': 'iat is not a number',
};

const KEY_KINDS: KeyKind[] = ['secret-utf8', 'secret-base64', 'secret-hex', 'pem', 'jwk', 'jwks'];

const formatBytes = (bytes: number): string =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(2)} MB`;

export default function JwtBolt({ lang, dictionary }: JwtBoltProps) {
  const t = dictionary || {};

  // ---------------------------------------------------------------- state --
  const [tab, setTab] = useState<Tab>('inspect');
  const [raw, setRaw] = useState('');
  const [keyKind, setKeyKind] = useState<KeyKind>('secret-utf8');
  const [keyText, setKeyText] = useState('');
  const [verify, setVerify] = useState<VerifyResult>({ state: 'idle', reason: null, ms: 0 });
  const [expect, setExpect] = useState<ClaimExpectations>(DEFAULT_EXPECTATIONS);
  const [showExpectations, setShowExpectations] = useState(false);
  const [peekRaw, setPeekRaw] = useState(false);
  const [parked, setParked] = useState<ParkedFile | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [legalModal, setLegalModal] = useState<LegalKey | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // builder
  const [buildHeader, setBuildHeader] = useState(DEFAULT_HEADER);
  const [buildPayload, setBuildPayload] = useState(() => defaultPayload());
  const [buildAlg, setBuildAlg] = useState<Algorithm>('HS256');
  const [buildKey, setBuildKey] = useState('');
  const [buildKeyKind, setBuildKeyKind] = useState<KeyKind>('secret-utf8');
  const [signed, setSigned] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [publicPem, setPublicPem] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const payloadHistory = useTextHistory(defaultPayload());

  const decoded = useMemo(() => decodeToken(raw), [raw]);
  const claims = useMemo(() => claimsOf(decoded), [decoded]);
  const header = useMemo(() => headerOf(decoded), [decoded]);
  const hasToken = raw.trim().length > 0;

  // Reading matchMedia during render would desync the SSR markup.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
    const listen = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    query.addEventListener('change', listen);
    return () => query.removeEventListener('change', listen);
  }, []);

  // The old version ticked every second forever, re-rendering the whole tree
  // with nothing to count. It only runs when there is a deadline to show.
  const needsClock = typeof claims.exp === 'number' || typeof claims.nbf === 'number';
  useEffect(() => {
    if (!needsClock) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [needsClock]);

  useEffect(
    () => () => {
      clearTimeout(copyTimer.current);
      clearTimeout(toastTimer.current);
    },
    []
  );

  const flash = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const doCopy = useCallback(
    async (text: string, id: string) => {
      if (!text) return;
      const ok = await copyText(text);
      if (!ok) {
        // The old code swallowed this and still flashed "Copied".
        flash(t.errorClipboard || 'The clipboard is not available on this page.');
        return;
      }
      clearTimeout(copyTimer.current);
      setCopied(id);
      copyTimer.current = setTimeout(() => setCopied(null), 1800);
    },
    [flash, t.errorClipboard]
  );

  // -------------------------------------------------------------- intake ---
  const takeFile = useCallback(
    (name: string, text: string, bytes: number) => {
      setParked({ name, text, as: classifyDrop(name, text), bytes });
    },
    []
  );

  const openFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (file.size > MAX_BYTES) {
        flash((t.errorTooLarge || 'That file is over {max}.').replace('{max}', formatBytes(MAX_BYTES)));
        return;
      }
      readTextFile(file)
        .then(text => takeFile(file.name, text, file.size))
        .catch(() => flash(t.errorRead || 'That file could not be read.'));
    },
    [flash, t.errorTooLarge, t.errorRead, takeFile]
  );

  useHandoffIntake((file, from) => {
    readTextFile(file)
      .then(text => {
        takeFile(file.name, text, file.size);
        flash((t.handoffReceived || 'Received from {tool}.').replace('{tool}', from));
      })
      .catch(() => flash(t.errorRead || 'That file could not be read.'));
  });

  const loadParked = useCallback(() => {
    if (!parked) return;
    if (parked.as === 'key') {
      setKeyText(parked.text.trim());
      setKeyKind(/-----BEGIN /.test(parked.text) ? 'pem' : /"keys"/.test(parked.text) ? 'jwks' : 'jwk');
    } else {
      setRaw(extractToken(parked.text));
      setVerify({ state: 'idle', reason: null, ms: 0 });
    }
    setParked(null);
    setTab('inspect');
  }, [parked]);

  // ------------------------------------------------------------- verifying --
  const runVerify = useCallback(async () => {
    setVerify({ state: 'running', reason: null, ms: 0 });
    const input: KeyInput = { kind: keyKind, text: keyText };
    const kid = typeof header.kid === 'string' ? header.kid : undefined;
    const result = await verifySignature(decoded.signingInput, decoded.signature, decoded.alg, input, kid);
    setVerify(result);
  }, [keyKind, keyText, decoded, header.kid]);

  // Any edit invalidates the verdict: a stale green tick is worse than none.
  useEffect(() => {
    setVerify(current => (current.state === 'idle' ? current : { state: 'idle', reason: null, ms: 0 }));
  }, [raw, keyText, keyKind]);

  const report = useMemo(() => validateClaims(claims, expect, now), [claims, expect, now]);
  const progress = useMemo(() => lifetimeProgress(claims, now), [claims, now]);

  // -------------------------------------------------------------- building --
  const headerError = useMemo(() => jsonErrorLine(buildHeader), [buildHeader]);
  const payloadError = useMemo(() => jsonErrorLine(buildPayload), [buildPayload]);

  const runSign = useCallback(async () => {
    setSigning(true);
    setSignError(null);
    const result = await signToken(buildHeader, buildPayload, buildAlg, { kind: buildKeyKind, text: buildKey });
    setSigning(false);
    if (result.error) {
      setSignError(result.error);
      setSigned('');
      return;
    }
    setSigned(result.token || '');
  }, [buildHeader, buildPayload, buildAlg, buildKeyKind, buildKey]);

  const makeKeys = useCallback(async () => {
    const spec = specFor(buildAlg);
    if (!spec) return;
    if (spec.secretBased) {
      const secret = randomSecret();
      setBuildKeyKind('secret-base64');
      setBuildKey(secret);
      setPublicPem('');
      flash(t.toastSecret || 'Random 256-bit secret generated.');
      return;
    }
    try {
      const pair = await generateKeyPair(buildAlg);
      if (!pair) {
        flash(t.errorKeygen || 'This browser cannot generate keys for that algorithm.');
        return;
      }
      setBuildKeyKind('pem');
      setBuildKey(pair.privatePem);
      setPublicPem(pair.publicPem);
      flash(t.toastKeypair || 'Key pair generated. The public key is below, for verifying.');
    } catch {
      flash(t.errorKeygen || 'This browser cannot generate keys for that algorithm.');
    }
  }, [buildAlg, flash, t.toastSecret, t.toastKeypair, t.errorKeygen]);

  const resetWorkspace = useCallback(() => {
    setRaw('');
    setKeyText('');
    setVerify({ state: 'idle', reason: null, ms: 0 });
    setExpect(DEFAULT_EXPECTATIONS);
    setParked(null);
    setSigned('');
    setSignError(null);
    setPublicPem('');
    setBuildHeader(DEFAULT_HEADER);
    const payload = defaultPayload();
    setBuildPayload(payload);
    payloadHistory.reset(payload);
  }, [payloadHistory]);

  // ------------------------------------------------------------ shortcuts --
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key === 'Enter') {
        event.preventDefault();
        if (tab === 'inspect') void runVerify();
        else void runSign();
      }
    };
    const down = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setPeekRaw(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setPeekRaw(false);
    };
    // The blur handler is a named reference on purpose: an inline arrow here
    // could never be removed, so every re-run of this effect leaked one.
    const blur = () => setPeekRaw(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [tab, runVerify, runSign]);

  // -------------------------------------------------------------- derived --
  const errors = decoded.issues.filter(i => i.level === 'error');
  const warnings = decoded.issues.filter(i => i.level === 'warning');

  const getResultFile = useCallback(async () => {
    const text = tab === 'build' && signed ? signed : JSON.stringify({ header, payload: claims }, null, 2);
    if (!text) return null;
    return {
      blob: new Blob([text], { type: tab === 'build' && signed ? 'text/plain' : 'application/json' }),
      name: tab === 'build' && signed ? 'token.jwt' : 'claims.json',
    };
  }, [tab, signed, header, claims]);

  const steps = [
    { title: t.step1Title || 'Paste the token', text: t.step1Text || '' },
    { title: t.step2Title || 'Add the key', text: t.step2Text || '' },
    { title: t.step3Title || 'Verify', text: t.step3Text || '' },
    { title: t.step4Title || 'Take it further', text: t.step4Text || '' },
  ];
  const featureIcons = [IconVerify, IconClaims, IconClock, IconSign, IconKeys, IconAttack, IconLocal, IconHandoff];
  const features: { title: string; text: string }[] = Array.isArray(t.features) ? t.features : [];
  const faqs: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const iconButton =
    'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 outline-none transition-all hover:border-violet-500/30 hover:bg-violet-500/15 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-30';
  const field =
    'w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-slate-200 outline-none transition-colors focus:border-violet-500/50';
  const microLabel = 'text-[10px] font-black uppercase tracking-[0.14em] text-slate-500';

  const SEGMENTS = [
    { id: 'header', raw: decoded.header.raw, cls: 'border-rose-500/40 bg-rose-500/10 text-rose-300', label: t.segHeader || 'header' },
    { id: 'payload', raw: decoded.payload.raw, cls: 'border-violet-500/40 bg-violet-500/10 text-violet-300', label: t.segPayload || 'payload' },
    { id: 'signature', raw: decoded.signature, cls: 'border-slate-500/40 bg-slate-500/10 text-slate-300', label: t.segSignature || 'signature' },
  ];

  const verdict = () => {
    switch (verify.state) {
      case 'valid':
        return { cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200', Icon: ShieldCheck, text: t.verifyValid || 'Signature is valid' };
      case 'invalid':
        return { cls: 'border-rose-500/40 bg-rose-500/10 text-rose-200', Icon: ShieldAlert, text: t.verifyInvalid || 'Signature does not match' };
      case 'error':
        return { cls: 'border-amber-500/40 bg-amber-500/10 text-amber-200', Icon: AlertTriangle, text: t.verifyError || 'The key could not be used' };
      case 'running':
        return { cls: 'border-violet-500/40 bg-violet-500/10 text-violet-200', Icon: Loader2, text: t.verifyRunning || 'Verifying…' };
      default:
        return { cls: 'border-white/10 bg-white/5 text-slate-400', Icon: ShieldQuestion, text: t.verifyIdle || 'Not verified yet' };
    }
  };
  const v = verdict();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0408] font-sans text-slate-200 selection:bg-violet-500/25 selection:text-violet-50">
      <Header
        onReset={resetWorkspace} currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/jwt-bolt`)} t={t} />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          against the viewport edge to decide whether the fixed side rails fit.
          The previous max-w-5xl left the gap short of the 168px a rail needs. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-28 min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] md:px-8 md:pt-36">
        <AdBanner id="adsense-jwt-bolt-top" />

        {/* ================================================================ */}
        {/* Hero                                                             */}
        {/* ================================================================ */}
        <section className="mb-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="min-w-0 space-y-5">
            <span className="inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-violet-300">
              {t.heroBadge || 'Decoder + verifier'}
            </span>
            <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t.seoHeroTitle}
            </h1>
            <p className="text-base font-medium leading-relaxed text-slate-400 md:text-lg">{t.heroText || t.seoHeroText}</p>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((point: string, i: number) => (
                <span
                  key={i}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-[12px] font-bold text-slate-300"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3] text-violet-400" />
                  {point}
                </span>
              ))}
            </div>
          </div>
          <JwtHeroArt className="mx-auto h-auto w-full max-w-lg" animated={!reduceMotion} />
        </section>

        {/* ================================================================ */}
        {/* Workspace                                                        */}
        {/* ================================================================ */}
        <section className="glass-card overflow-hidden rounded-3xl border border-white/5">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-3 py-3 md:px-4">
            <div className="flex rounded-xl bg-black/30 p-1">
              {([['inspect', ScanSearch, t.tabInspect || 'Inspect'], ['build', PenLine, t.tabBuild || 'Build & sign']] as const).map(
                ([key, Icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key as Tab)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-black outline-none transition-all md:text-sm ${
                      tab === key ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                )
              )}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <button type="button" onClick={() => fileInputRef.current?.click()} className={iconButton} title={t.actionOpen || 'Open a file'}>
                <FolderOpen className="h-4 w-4" />
              </button>
              <button type="button" onClick={resetWorkspace} className={iconButton} title={t.actionClear || 'Clear'}>
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={event => {
              openFiles(event.target.files);
              event.target.value = '';
            }}
          />

          {/* A dropped file waits; it never starts anything on its own. */}
          {parked && (
            <div className="flex flex-wrap items-center gap-3 border-b border-white/5 bg-violet-500/[0.06] px-3 py-3 md:px-4">
              <FolderOpen className="h-5 w-5 shrink-0 text-violet-300" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{parked.name}</div>
                <div className="text-[11px] text-slate-400">
                  {formatBytes(parked.bytes)} · {parked.as === 'key' ? t.parkedAsKey || 'looks like a key' : t.parkedAsToken || 'looks like a token'} ·{' '}
                  {t.parkedHint || 'waiting — nothing has been verified yet'}
                </div>
              </div>
              <button
                type="button"
                onClick={loadParked}
                className="cursor-pointer rounded-xl border border-violet-500/40 bg-violet-500/20 px-3 py-2 text-[11px] font-black text-violet-100 outline-none transition-all hover:bg-violet-500/30"
              >
                {t.parkedLoad || 'Load it'}
              </button>
              <button type="button" onClick={() => setParked(null)} className={iconButton} title={t.actionClear || 'Clear'}>
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {tab === 'inspect' ? (
            <div className="grid grid-cols-1 gap-px bg-white/5 lg:grid-cols-2">
              {/* ---------------------------- token ---------------------- */}
              <div className="flex flex-col gap-3 bg-[#0a0408] p-3 md:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={microLabel}>{t.labelInput || 'JWT token'}</span>
                  <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    <select
                      value=""
                      onChange={event => {
                        const sample = SAMPLES.find(s => s.id === event.target.value);
                        if (!sample) return;
                        setRaw(sample.token);
                        if (sample.secret) {
                          setKeyKind('secret-utf8');
                          setKeyText(sample.secret);
                        }
                      }}
                      className="h-8 cursor-pointer rounded-lg border border-white/5 bg-white/5 px-2 text-[11px] font-bold text-slate-300 outline-none"
                      aria-label={t.actionSample || 'Samples'}
                    >
                      <option value="">{t.actionSample || 'Samples'}</option>
                      {SAMPLES.map(sample => (
                        <option key={sample.id} value={sample.id}>
                          {t[sample.key] || sample.id}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => void doCopy(raw.trim(), 'token')} disabled={!hasToken} className={iconButton} title={t.actionCopyToken || 'Copy token'}>
                      {copied === 'token' ? <Check className="h-4 w-4 text-emerald-400" /> : <ClipboardCopy className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => setRaw('')} className={iconButton} title={t.actionClear || 'Clear'}>
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={raw}
                  onChange={event => setRaw(event.target.value)}
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    event.preventDefault();
                    if (event.dataTransfer.files?.length) openFiles(event.dataTransfer.files);
                  }}
                  placeholder={t.placeholderInput || 'Paste a JWT here (header.payload.signature)…'}
                  spellCheck={false}
                  aria-label={t.labelInput || 'JWT token'}
                  className="min-h-[110px] w-full resize-y break-all rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500/40"
                />

                {hasToken && (
                  <div className="flex flex-col gap-1.5">
                    <span className={microLabel}>{t.labelSegments || 'Token segments'}</span>
                    {SEGMENTS.map(segment => (
                      <button
                        key={segment.id}
                        type="button"
                        onClick={() => void doCopy(segment.raw, segment.id)}
                        className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition hover:brightness-125 ${segment.cls}`}
                        title={t.actionCopySegment || 'Copy this segment'}
                      >
                        <span className="w-16 shrink-0 text-[10px] font-black uppercase tracking-widest">{segment.label}</span>
                        <span className="flex-1 truncate font-mono text-[11px] text-slate-300">{segment.raw || '—'}</span>
                        {copied === segment.id ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <ClipboardCopy className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-slate-200" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Decode issues */}
                {hasToken && decoded.issues.length > 0 && (
                  <div className="space-y-1.5">
                    {decoded.issues.map((issue, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                          issue.level === 'error'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                        }`}
                      >
                        {issue.level === 'error' ? (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="min-w-0">
                          <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">{issue.where}</span>{' '}
                          {t[`issue_${issue.code}`] || ISSUE_FALLBACK[issue.code] || issue.code}
                          {issue.detail && <span className="ml-1 font-mono opacity-70">{issue.detail}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Decoded segments */}
                {decoded.ok && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={microLabel}>{t.segHeader || 'header'}</span>
                        <button
                          type="button"
                          onPointerDown={() => setPeekRaw(true)}
                          onPointerUp={() => setPeekRaw(false)}
                          onPointerLeave={() => setPeekRaw(false)}
                          className={`${iconButton} ml-auto h-6 w-6 ${peekRaw ? 'border-violet-500/40 bg-violet-500/20 text-violet-200' : ''}`}
                          title={t.actionPeek || 'Hold to see the raw base64url (or hold Alt)'}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <pre className="max-h-40 overflow-auto rounded-xl border border-rose-500/20 bg-black/40 p-2.5 font-mono text-[11px] text-slate-200">
                        {peekRaw ? decoded.header.raw : decoded.header.text}
                      </pre>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={microLabel}>{t.segPayload || 'payload'}</span>
                        <button
                          type="button"
                          onClick={() => void doCopy(decoded.payload.text, 'payloadJson')}
                          className={`${iconButton} ml-auto h-6 w-6`}
                          title={t.actionCopyJson || 'Copy JSON'}
                        >
                          {copied === 'payloadJson' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <pre className="max-h-64 overflow-auto rounded-xl border border-violet-500/20 bg-black/40 p-2.5 font-mono text-[11px] text-slate-200">
                        {peekRaw ? decoded.payload.raw : decoded.payload.text}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* ---------------------------- verify --------------------- */}
              <div className="flex flex-col gap-3 bg-[#0a0408] p-3 md:p-4">
                <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${v.cls}`}>
                  <v.Icon className={`h-5 w-5 shrink-0 ${verify.state === 'running' ? 'animate-spin' : ''}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-black">{v.text}</div>
                    {verify.reason && (
                      <div className="text-[11px] opacity-80">
                        {t[`reason_${verify.reason}`] || verify.reason}
                        {verify.usedKid && <span className="ml-1.5 font-mono">kid: {verify.usedKid}</span>}
                      </div>
                    )}
                  </div>
                  {verify.ms > 0 && <span className="ml-auto shrink-0 font-mono text-[10px] opacity-70">{verify.ms} ms</span>}
                </div>

                <div className="space-y-2 rounded-2xl border border-white/5 bg-black/25 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={microLabel}>{t.labelKey || 'Key or secret'}</span>
                    <span className="ml-auto rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                      alg: {decoded.alg || '—'}
                    </span>
                  </div>
                  <select value={keyKind} onChange={event => setKeyKind(event.target.value as KeyKind)} className={`${field} cursor-pointer`}>
                    {KEY_KINDS.map(kind => (
                      <option key={kind} value={kind}>
                        {t[`keyKind_${kind}`] || kind}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={keyText}
                    onChange={event => setKeyText(event.target.value)}
                    placeholder={t.placeholderKey || 'Secret, PEM public key, JWK or JWKS…'}
                    spellCheck={false}
                    aria-label={t.labelKey || 'Key or secret'}
                    className="min-h-[84px] w-full resize-y break-all rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => void runVerify()}
                    disabled={!decoded.signingInput || verify.state === 'running'}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/20 px-4 py-2.5 text-sm font-black text-violet-100 outline-none transition-all hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {verify.state === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {t.actionVerify || 'Verify signature'}
                    <span className="hidden text-[10px] font-bold opacity-60 sm:inline">Ctrl+↵</span>
                  </button>
                  <p className="text-[10px] leading-relaxed text-slate-500">{t.keyNote || ''}</p>
                </div>

                {/* Claims */}
                {decoded.ok && (
                  <div className="space-y-2 rounded-2xl border border-white/5 bg-black/25 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={microLabel}>{t.labelClaims || 'Claim checks'}</span>
                      <button
                        type="button"
                        onClick={() => setShowExpectations(value => !value)}
                        className="ml-auto cursor-pointer rounded-md border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-400 outline-none hover:text-violet-200"
                      >
                        {t.actionExpectations || 'Expectations'}
                      </button>
                    </div>

                    {showExpectations && (
                      <div className="grid grid-cols-2 gap-2 border-b border-white/5 pb-3">
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.expectIssuer || 'Issuer (iss)'}</span>
                          <input className={field} value={expect.issuer} onChange={e => setExpect(x => ({ ...x, issuer: e.target.value }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.expectAudience || 'Audience (aud)'}</span>
                          <input className={field} value={expect.audience} onChange={e => setExpect(x => ({ ...x, audience: e.target.value }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.expectSubject || 'Subject (sub)'}</span>
                          <input className={field} value={expect.subject} onChange={e => setExpect(x => ({ ...x, subject: e.target.value }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.expectLeeway || 'Clock skew (s)'}</span>
                          <input
                            type="number"
                            min={0}
                            className={field}
                            value={expect.leeway}
                            onChange={e => setExpect(x => ({ ...x, leeway: Number(e.target.value) || 0 }))}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.expectMaxAge || 'Max age (s)'}</span>
                          <input
                            type="number"
                            min={0}
                            className={field}
                            value={expect.maxAge}
                            onChange={e => setExpect(x => ({ ...x, maxAge: Number(e.target.value) || 0 }))}
                          />
                        </label>
                        <label className="flex cursor-pointer items-end gap-2 pb-1.5 text-[11px] font-bold text-slate-400">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-violet-500"
                            checked={expect.requireExp}
                            onChange={e => setExpect(x => ({ ...x, requireExp: e.target.checked }))}
                          />
                          {t.expectRequireExp || 'exp required'}
                        </label>
                      </div>
                    )}

                    <div className="space-y-1">
                      {report.checks.map(check => (
                        <div key={check.code} className="flex items-center gap-2 text-[11px]">
                          {check.status === 'pass' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          ) : check.status === 'fail' ? (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                          ) : (
                            <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/15" />
                          )}
                          <span className={check.status === 'fail' ? 'text-rose-200' : check.status === 'pass' ? 'text-slate-300' : 'text-slate-600'}>
                            {t[`check_${check.code}`] || CHECK_FALLBACK[check.code] || check.code}
                          </span>
                          {check.detail && <span className="ml-auto truncate font-mono text-[10px] text-slate-500">{check.detail}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Lifetime */}
                    {(report.expiresIn !== null || report.activeIn !== null) && (
                      <div className="space-y-1.5 border-t border-white/5 pt-2.5">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={microLabel}>{t.labelLifetime || 'Lifetime'}</span>
                          <span
                            className={`ml-auto font-mono font-black ${
                              report.activeIn !== null ? 'text-amber-300' : (report.expiresIn ?? 0) > 0 ? 'text-emerald-300' : 'text-rose-300'
                            }`}
                          >
                            {report.activeIn !== null
                              ? `${t.labelActiveIn || 'Active in'} ${formatDuration(report.activeIn)}`
                              : (report.expiresIn ?? 0) > 0
                                ? `${t.labelExpiresIn || 'Expires in'} ${formatDuration(report.expiresIn ?? 0)}`
                                : `${t.labelExpiredAgo || 'Expired'} ${formatDuration(report.expiresIn ?? 0)}`}
                          </span>
                        </div>
                        {progress !== null && (
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full ${progress >= 1 ? 'bg-rose-500' : progress > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-600">
                  {errors.length > 0 && <span className="text-rose-400">{errors.length} × error</span>}
                  {warnings.length > 0 && <span className="text-amber-400">{warnings.length} × warning</span>}
                  {report.failures > 0 && <span className="text-rose-400">{report.failures} × claim</span>}
                  <span className="ml-auto">Ctrl+↵ · Alt</span>
                </div>
              </div>
            </div>
          ) : (
            /* ------------------------------ builder ---------------------- */
            <div className="grid grid-cols-1 gap-px bg-white/5 lg:grid-cols-2">
              <div className="flex flex-col gap-3 bg-[#0a0408] p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <span className={microLabel}>{t.segHeader || 'header'}</span>
                  <span className="ml-auto font-mono text-[10px] text-slate-600">{t.builderHeaderHint || 'alg is set below'}</span>
                </div>
                <CodeBox value={buildHeader} onChange={setBuildHeader} errorLine={headerError} label={t.segHeader || 'header'} accent="rose" rows={5} />

                <div className="flex items-center gap-2">
                  <span className={microLabel}>{t.segPayload || 'payload'}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const previous = payloadHistory.undo();
                        if (previous !== null) setBuildPayload(previous);
                      }}
                      disabled={!payloadHistory.canUndo}
                      className={`${iconButton} h-6 w-6`}
                      title={t.actionUndo || 'Undo'}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = payloadHistory.redo();
                        if (next !== null) setBuildPayload(next);
                      }}
                      disabled={!payloadHistory.canRedo}
                      className={`${iconButton} h-6 w-6`}
                      title={t.actionRedo || 'Redo'}
                    >
                      <Redo2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <CodeBox
                  value={buildPayload}
                  onChange={value => {
                    setBuildPayload(value);
                    payloadHistory.push(value);
                  }}
                  errorLine={payloadError}
                  label={t.segPayload || 'payload'}
                  accent="violet"
                  rows={10}
                />
              </div>

              <div className="flex flex-col gap-3 bg-[#0a0408] p-3 md:p-4">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className={microLabel}>{t.labelAlgorithm || 'Algorithm'}</span>
                    <select
                      className={`${field} cursor-pointer`}
                      value={buildAlg}
                      onChange={event => {
                        const alg = event.target.value as Algorithm;
                        setBuildAlg(alg);
                        setBuildHeader(current => {
                          try {
                            return JSON.stringify({ ...JSON.parse(current), alg }, null, 2);
                          } catch {
                            return current;
                          }
                        });
                      }}
                    >
                      {[...KNOWN_ALGS, 'none' as Algorithm].map(alg => (
                        <option key={alg} value={alg}>
                          {alg}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={microLabel}>{t.labelKeyFormat || 'Key format'}</span>
                    <select className={`${field} cursor-pointer`} value={buildKeyKind} onChange={e => setBuildKeyKind(e.target.value as KeyKind)}>
                      {KEY_KINDS.filter(k => k !== 'jwks').map(kind => (
                        <option key={kind} value={kind}>
                          {t[`keyKind_${kind}`] || kind}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <textarea
                  value={buildKey}
                  onChange={event => setBuildKey(event.target.value)}
                  placeholder={t.placeholderSignKey || 'Secret, or a PEM private key…'}
                  spellCheck={false}
                  aria-label={t.labelKey || 'Key or secret'}
                  className="min-h-[92px] w-full resize-y break-all rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-500/40"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void makeKeys()}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 outline-none transition-all hover:border-violet-500/30 hover:text-violet-200"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    {t.actionGenerateKey || 'Generate a key'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runSign()}
                    disabled={signing || headerError !== null || payloadError !== null}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/20 px-4 py-2.5 text-sm font-black text-violet-100 outline-none transition-all hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                    {t.actionSign || 'Sign token'}
                  </button>
                </div>

                {signError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {t[`signError_${signError}`] || signError}
                  </div>
                )}

                {publicPem && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={microLabel}>{t.labelPublicKey || 'Public key (to verify)'}</span>
                      <button type="button" onClick={() => void doCopy(publicPem, 'pub')} className={`${iconButton} ml-auto h-6 w-6`}>
                        {copied === 'pub' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <pre className="max-h-28 overflow-auto rounded-xl border border-white/10 bg-black/40 p-2.5 font-mono text-[10px] text-slate-400">
                      {publicPem}
                    </pre>
                  </div>
                )}

                {signed && (
                  <div className="space-y-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
                    <div className="flex items-center gap-2">
                      <span className={microLabel}>{t.labelSigned || 'Signed token'}</span>
                      <div className="ml-auto flex gap-1.5">
                        <button type="button" onClick={() => void doCopy(signed, 'signed')} className={`${iconButton} h-6 w-6`} title={t.actionCopyToken || 'Copy token'}>
                          {copied === 'signed' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                        </button>
                        <button type="button" onClick={() => downloadText(signed, 'token.jwt')} className={`${iconButton} h-6 w-6`} title={t.actionDownload || 'Download'}>
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="max-h-28 overflow-auto break-all rounded-xl bg-black/40 p-2.5 font-mono text-[11px] text-emerald-100">{signed}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setRaw(signed);
                        if (buildKey) {
                          setKeyKind(buildKeyKind === 'pem' ? 'pem' : buildKeyKind);
                          setKeyText(publicPem || buildKey);
                        }
                        setTab('inspect');
                      }}
                      className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 outline-none transition-all hover:border-violet-500/30 hover:text-violet-200"
                    >
                      {t.actionInspectSigned || 'Open it in the inspector'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-white/5 p-3 md:p-4">
            <NextStepBar lang={lang} t={t} getResult={getResultFile} disabled={!decoded.ok && !signed} />
          </div>
        </section>

        {toast && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200">
            <Sparkles className="h-4 w-4 shrink-0" />
            {toast}
          </div>
        )}

        <div className="mt-10">
          <AdBanner id="adsense-jwt-bolt-mid" />
        </div>

        {/* ================================================================ */}
        {/* How it works                                                     */}
        {/* ================================================================ */}
        <section className="mt-20 space-y-10">
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t.howItWorksTitle || 'How it works'}</h2>
            <div className="mx-auto h-1 w-16 rounded-full bg-violet-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Art = STEP_ART[i];
              return (
                <div key={i} className="glass-card group relative space-y-4 rounded-3xl border border-white/5 p-6 transition-all hover:border-violet-500/20">
                  <span className="absolute right-6 top-5 text-5xl font-black text-white/5 transition-colors group-hover:text-violet-500/10">{i + 1}</span>
                  <Art className="h-auto w-24 text-violet-400" />
                  <h3 className="text-base font-bold leading-snug text-white">{step.title}</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================ */}
        {/* Features                                                         */}
        {/* ================================================================ */}
        {features.length > 0 && (
          <section className="mt-20 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, i) => {
              const Icon = featureIcons[i % featureIcons.length];
              return (
                <div key={i} className="glass-card group rounded-3xl border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300 transition-all group-hover:border-violet-500/40">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mb-2 text-base font-bold text-white transition-colors group-hover:text-violet-300">{feature.title}</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">{feature.text}</p>
                </div>
              );
            })}
          </section>
        )}

        {/* ================================================================ */}
        {/* SEO content                                                      */}
        {/* ================================================================ */}
        <section className="mt-24 space-y-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="min-w-0 space-y-6">
              {keywords[0] && (
                <span className="inline-block rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-violet-300">
                  {keywords[0]}
                </span>
              )}
              <h2 className="text-2xl font-black leading-[1.1] tracking-tight text-white md:text-4xl">{t.seoSecondaryTitle || t.seoUseCaseTitle}</h2>
              <p className="text-base font-medium leading-relaxed text-slate-400 md:text-lg">{t.seoHeroText}</p>
            </div>
            <div className="glass-card relative flex min-h-[320px] flex-col items-center justify-center gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 p-8 text-center md:p-10">
              <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
              <IconLocal className="relative h-16 w-16 text-violet-300" />
              <div className="relative max-w-sm space-y-3">
                <h3 className="text-xl font-black leading-tight tracking-tight text-white md:text-2xl">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-400">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 rounded-3xl border border-white/5 bg-[#150a24] p-7 md:p-12">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-xl font-black leading-tight text-white md:text-3xl">{t.seoUseCaseTitle}</h2>
              <div className="h-1.5 w-20 rounded-full bg-violet-500" />
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-slate-400">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t.seoPrivacyTitle}
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-slate-400">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-8">
              <div className="space-y-3 text-center">
                <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t.faqTitle || 'FAQ'}</h2>
                <div className="mx-auto h-1 w-16 rounded-full bg-violet-500" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="glass-card group rounded-2xl border border-white/5 px-5 py-5 text-left transition-colors hover:border-violet-500/20 sm:px-6 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 text-[15px] font-bold text-white transition-colors group-hover:text-violet-300">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-[11px] font-black text-violet-300">
                        Q
                      </span>
                      <span className="min-w-0 flex-1">{faq.question}</span>
                      <span className="shrink-0 text-xl leading-none text-violet-300 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="pl-9 pt-3 text-sm leading-relaxed text-slate-400">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-5 text-center opacity-55">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle || 'Related searches'}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-slate-400">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-16">
          <AdBanner id="adsense-jwt-bolt-bottom" />
        </div>
      </main>

      <Footer lang={lang} t={t} onOpenModal={setLegalModal} />

      {(['privacy', 'terms', 'cookies'] as LegalKey[]).map(key => (
        <LegalModal
          key={key}
          isOpen={legalModal === key}
          onClose={() => setLegalModal(null)}
          title={legalTranslations[lang]?.[key].title || key}
          content={legalTranslations[lang]?.[key].content}
          t={t}
        />
      ))}
    </div>
  );
}
