import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Binary, Check, Copy, FileDigit, Hash, Type, X } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { BitGrid } from './components/BitGrid';
import {
  HeroArt,
  IconBase,
  IconBits,
  IconBytes,
  IconFloat,
  IconOffline,
  IconSigned,
  StepFlip,
  StepRead,
  StepType,
  StepWidth,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import {
  applyOp,
  clampBase,
  fit,
  group,
  groupSizeFor,
  OP_SYMBOL,
  parseInBase,
  toBaseString,
  toBits,
  toggleBit,
} from './lib/convert';
import { bitsToFloat, decompose, exactDecimal, floatToBits, ulp, type Precision } from './lib/floats';
import {
  bytesToBinary,
  bytesToDecimal,
  bytesToHex,
  bytesToOctal,
  decodeBytes,
  encodeText,
  ENCODING_LABEL,
  hexDump,
  valueToBytes,
} from './lib/encodings';
import {
  BIT_OPS,
  COMMON_BASES,
  ENCODINGS,
  MAX_DUMP_BYTES,
  WIDTHS,
  type BitOp,
  type Encoding,
  type Mode,
  type Signedness,
  type Width,
} from './types';

interface BinaryFlowProps {
  lang: string;
  dictionary: any;
}

const CopyCard: React.FC<{
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
  tone?: 'plain' | 'accent';
}> = ({ label, value, copied, onCopy, copyLabel, copiedLabel, tone = 'plain' }) => (
  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-blue-500/20 transition-colors">
    <div className="flex items-center justify-between gap-2">
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${
          tone === 'accent' ? 'text-rose-300/80' : 'text-blue-400/80'
        }`}
      >
        {label}
      </span>
      <button
        onClick={onCopy}
        disabled={!value}
        title={copied ? copiedLabel : copyLabel}
        aria-label={copied ? copiedLabel : `${copyLabel}: ${label}`}
        className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
          copied
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
            : 'bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
    <div className="font-mono text-sm text-white break-all min-h-[1.25rem] select-all max-h-40 overflow-y-auto">
      {value || <span className="text-slate-600">&mdash;</span>}
    </div>
  </div>
);

export default function BinaryFlow({ lang, dictionary }: BinaryFlowProps) {
  const t = dictionary || {};

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [mode, setMode] = useState<Mode>('number');
  const [inputBase, setInputBase] = useState<number>(10);
  const [inputValue, setInputValue] = useState('72');
  const [signedness, setSignedness] = useState<Signedness>('unsigned');
  const [width, setWidth] = useState<Width>(0);
  const [outBase, setOutBase] = useState<number>(36);
  const [littleEndian, setLittleEndian] = useState(false);
  const [floatInput, setFloatInput] = useState('0.1');
  const [opB, setOpB] = useState('255');
  const [op, setOp] = useState<BitOp>('and');
  const [textInput, setTextInput] = useState('Hi');
  const [encoding, setEncoding] = useState<Encoding>('utf-8');
  const [pending, setPending] = useState<{ file: File; from: string } | null>(null);
  const [fileBytes, setFileBytes] = useState<{ name: string; bytes: Uint8Array; truncated: boolean } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The old copy handler left a dangling timer on unmount.
  useEffect(() => {
    if (!copiedField) return;
    const id = setTimeout(() => setCopiedField(null), 1800);
    return () => clearTimeout(id);
  }, [copiedField]);

  const copy = useCallback((field: string, value: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
  }, []);

  // --- number pipeline ------------------------------------------------------

  const parsed = useMemo(() => parseInBase(inputValue, inputBase), [inputValue, inputBase]);
  const precision: Precision = width === 32 ? 32 : 64;
  const effectiveWidth: Width = signedness === 'float' ? (precision as Width) : width;
  const fitted = useMemo(() => fit(parsed.value, effectiveWidth), [parsed.value, effectiveWidth]);
  const bits = useMemo(() => toBits(fitted.raw, effectiveWidth), [fitted.raw, effectiveWidth]);
  const floatParts = useMemo(
    () => (signedness === 'float' ? decompose(fitted.raw, precision) : null),
    [signedness, fitted.raw, precision]
  );

  /** Writes a value back into the input field, in the current input base. The
   *  field stays the single source of truth, so flipping a bit and typing are
   *  the same edit as far as the rest of the pipeline is concerned. */
  const setRaw = useCallback(
    (next: bigint) => {
      const text = toBaseString(next, inputBase);
      setInputValue(inputBase > 10 ? text.toUpperCase() : text);
    },
    [inputBase]
  );

  const onToggleBit = useCallback(
    (indexFromMsb: number) => {
      const next = toggleBit(fitted.raw, effectiveWidth, indexFromMsb, bits.length);
      setRaw(next);
    },
    [bits.length, effectiveWidth, fitted.raw, setRaw]
  );

  // Choosing float forces a real IEEE width: there is no 8-bit float here.
  const pickSignedness = (s: Signedness) => {
    setSignedness(s);
    if (s === 'float' && width !== 32 && width !== 64) setWidth(64);
    if (s !== 'float' && width === 0) setWidth(0);
  };

  const applyFloatInput = (text: string) => {
    setFloatInput(text);
    const n = Number(text);
    if (text.trim() === '' || Number.isNaN(n)) return;
    setRaw(floatToBits(n, precision));
  };

  // Keep the decimal field in step when the bits change from anywhere else.
  useEffect(() => {
    if (signedness !== 'float') return;
    const v = bitsToFloat(fitted.raw, precision);
    const shown = Number(floatInput);
    if (!Object.is(v, shown)) setFloatInput(String(v));
    // floatInput is intentionally not a dependency: this syncs *into* it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitted.raw, precision, signedness]);

  const parsedB = useMemo(() => parseInBase(opB, inputBase), [opB, inputBase]);
  const opResult = useMemo(
    () => applyOp(fitted.raw, parsedB.error ? 0n : parsedB.value, op, effectiveWidth),
    [fitted.raw, parsedB, op, effectiveWidth]
  );

  const numberOutputs = useMemo(() => {
    const shown = signedness === 'signed' && effectiveWidth !== 0 ? fitted.signed : fitted.raw;
    return {
      bin: group(toBits(fitted.raw, effectiveWidth), 8),
      oct: toBaseString(fitted.raw, 8),
      dec: toBaseString(shown, 10),
      hex: group(toBaseString(fitted.raw, 16).toUpperCase(), groupSizeFor(16)),
      custom: toBaseString(fitted.raw, outBase).toUpperCase(),
    };
  }, [fitted, effectiveWidth, signedness, outBase]);

  const valueBytes = useMemo(
    () => valueToBytes(fitted.raw, effectiveWidth === 0 ? bits.length : effectiveWidth, littleEndian),
    [fitted.raw, effectiveWidth, bits.length, littleEndian]
  );

  // --- text pipeline --------------------------------------------------------

  const textBytes = useMemo(() => encodeText(textInput, encoding), [textInput, encoding]);
  const textRoundTrip = useMemo(() => decodeBytes(textBytes, encoding), [textBytes, encoding]);

  // --- bytes pipeline (files) ----------------------------------------------
  // Dropping or receiving a file never reads it by itself: it waits until the
  // user asks, the same rule the rest of the suite follows.

  const queueFile = useCallback((file: File, from = '') => {
    setPending({ file, from });
    setMode('bytes');
  }, []);

  useHandoffIntake((file, from) => queueFile(file, from));

  const readPending = useCallback(async () => {
    if (!pending) return;
    const buf = await pending.file.slice(0, MAX_DUMP_BYTES).arrayBuffer();
    setFileBytes({
      name: pending.file.name,
      bytes: new Uint8Array(buf),
      truncated: pending.file.size > MAX_DUMP_BYTES,
    });
    setPending(null);
  }, [pending]);

  useEffect(() => {
    const onDrop = (e: DragEvent) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      e.preventDefault();
      queueFile(file);
    };
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
    };
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragover', onDragOver);
    return () => {
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragover', onDragOver);
    };
  }, [queueFile]);

  const dump = useMemo(() => (fileBytes ? hexDump(fileBytes.bytes) : []), [fileBytes]);

  // --- copy ----------------------------------------------------------------

  const errorText = parsed.error
    ? parsed.error === 'digit'
      ? (t.errorDigit || '"{c}" is not a digit in base {b}').replace('{c}', parsed.at).replace('{b}', String(inputBase))
      : ''
    : '';

  const widthLabel = (w: Width) => (w === 0 ? t.widthAuto || 'Auto' : `${w}`);

  const steps = [
    { art: StepType, title: t.step1Title || 'Type it in any base', text: t.step1Text || 'Base 2 to 36, with a minus sign, 0x prefixes and grouping spaces all accepted.' },
    { art: StepWidth, title: t.step2Title || 'Say how wide it is', text: t.step2Text || '8, 16, 32, 64 bits or unlimited. Signed values wrap into two’s complement, so −42 becomes 0xD6.' },
    { art: StepFlip, title: t.step3Title || 'Flip bits by hand', text: t.step3Text || 'Click any bit in the grid, or run AND, OR, XOR, NOT and shifts at that width.' },
    { art: StepRead, title: t.step4Title || 'Read every form at once', text: t.step4Text || 'Binary, octal, decimal, hex, a custom base and the raw bytes in either byte order.' },
  ];

  const features = [
    { icon: IconBits, title: t.feat1Title || 'No size limit', text: t.feat1Text || 'BigInt end to end, so a 300-digit number converts exactly instead of collapsing past 2^53.' },
    { icon: IconSigned, title: t.feat2Title || 'Signed and two’s complement', text: t.feat2Text || 'Negative numbers at a chosen width, showing the stored bits and the signed value side by side.' },
    { icon: IconFloat, title: t.feat3Title || 'IEEE-754 laid open', text: t.feat3Text || 'Sign, exponent and mantissa colour-coded, plus the exact decimal a float really holds.' },
    { icon: IconBase, title: t.feat4Title || 'Any base from 2 to 36', text: t.feat4Text || 'Not just the usual four. Base 36 for short ids, base 3 for the curious.' },
    { icon: IconBytes, title: t.feat5Title || 'Bytes of anything', text: t.feat5Text || 'Four text encodings, and a hex dump of any file you drop — read only when you ask.' },
    { icon: IconOffline, title: t.feat6Title || 'Never leaves the page', text: t.feat6Text || 'Every conversion runs in your browser. Nothing is uploaded and nothing is stored.' },
  ];

  const faq: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];

  const tabs: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'number', label: t.label_number_mode || 'Number', icon: <Hash className="w-4 h-4" /> },
    { id: 'text', label: t.label_text_mode || 'Text', icon: <Type className="w-4 h-4" /> },
    { id: 'bytes', label: t.label_bytes_mode || 'File bytes', icon: <FileDigit className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#020610] text-slate-200 font-sans relative overflow-x-hidden pt-36 md:pt-24">
      <Header currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/binary-flow`)} t={t} />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, so reserving 440px from 1400px up is
          what keeps them visible instead of silently suppressed. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col gap-12 md:gap-20">
        <AdBanner id="adsense-binary-flow-top" />

        {/* Hero ------------------------------------------------------------ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">
              <Binary className="w-3.5 h-3.5" />
              {t.heroBadge || 'Runs in your browser'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.seoHeroTitle || 'BinaryFlow'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">{t.seoHeroText}</p>
            <a
              href="#how-it-works"
              className="inline-block px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-blue-500/30 font-bold text-sm transition-all"
            >
              {t.heroSecondary || 'See how it works'}
            </a>
          </div>
          <HeroArt className="w-full h-auto max-w-lg mx-auto" />
        </section>

        {/* Converter -------------------------------------------------------- */}
        <section className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 md:p-8 space-y-6">
          <div className="inline-flex flex-wrap rounded-2xl bg-slate-950/60 border border-white/5 p-1 self-start">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none ${
                  mode === tab.id ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {mode === 'number' && (
            <>
              {/* base + interpretation */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-950/60 border border-white/5 p-1">
                  {COMMON_BASES.map(b => (
                    <button
                      key={b}
                      onClick={() => setInputBase(b)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        inputBase === b ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {b === 2 ? 'BIN' : b === 8 ? 'OCT' : b === 10 ? 'DEC' : 'HEX'}
                    </button>
                  ))}
                  <label className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {t.baseLabel || 'Base'}
                    </span>
                    <input
                      type="number"
                      min={2}
                      max={36}
                      value={inputBase}
                      onChange={e => setInputBase(clampBase(Number(e.target.value)))}
                      className="w-12 bg-slate-950/70 border border-white/10 rounded-md px-1.5 py-1 text-xs font-mono text-white outline-none focus:border-blue-500/50"
                    />
                  </label>
                </div>

                <div className="inline-flex rounded-2xl bg-slate-950/60 border border-white/5 p-1">
                  {(['unsigned', 'signed', 'float'] as Signedness[]).map(s => (
                    <button
                      key={s}
                      onClick={() => pickSignedness(s)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        signedness === s ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s === 'unsigned' ? t.unsigned || 'Unsigned' : s === 'signed' ? t.signed || 'Signed' : t.floatLabel || 'Float'}
                    </button>
                  ))}
                </div>

                <div className="inline-flex rounded-2xl bg-slate-950/60 border border-white/5 p-1">
                  {WIDTHS.filter(w => signedness !== 'float' || w === 32 || w === 64).map(w => (
                    <button
                      key={w}
                      onClick={() => setWidth(w)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        effectiveWidth === w ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {widthLabel(w)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-blue-400 uppercase tracking-widest" htmlFor="bf-input">
                  {t.label_input_value || 'Input Value'}
                </label>
                <input
                  id="bf-input"
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  spellCheck={false}
                  aria-invalid={!!parsed.error && parsed.error !== 'empty'}
                  className={`w-full px-4 py-4 rounded-2xl bg-slate-950/50 border font-mono text-sm tracking-wider text-white placeholder-slate-600 outline-none transition-colors ${
                    parsed.error && parsed.error !== 'empty' ? 'border-red-500/50' : 'border-white/5 focus:border-blue-500/50'
                  }`}
                />
                {errorText && <p className="text-xs font-bold text-red-400">{errorText}</p>}
                {fitted.overflow && !parsed.error && (
                  <p className="text-xs font-bold text-amber-400">
                    {(t.overflowWarning || 'Does not fit in {w} bits — the extra bits were dropped.').replace(
                      '{w}',
                      String(effectiveWidth)
                    )}
                  </p>
                )}

                {signedness === 'float' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-blue-400 uppercase tracking-widest" htmlFor="bf-float">
                      {t.floatValueLabel || 'Decimal value'}
                    </label>
                    <input
                      id="bf-float"
                      type="text"
                      value={floatInput}
                      onChange={e => applyFloatInput(e.target.value)}
                      spellCheck={false}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950/50 border border-white/5 focus:border-blue-500/50 font-mono text-sm text-white outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* bit grid */}
              {!parsed.error && (
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 overflow-x-auto">
                  <BitGrid
                    bits={bits}
                    signedness={signedness}
                    precision={precision}
                    fixedWidth={effectiveWidth !== 0}
                    onToggle={onToggleBit}
                    t={t}
                  />
                </div>
              )}

              {/* float breakdown */}
              {floatParts && !parsed.error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <CopyCard
                    label={t.fieldSign || 'Sign'}
                    value={`${floatParts.sign} (${floatParts.sign ? '−' : '+'})`}
                    copied={copiedField === 'fsign'}
                    onCopy={() => copy('fsign', String(floatParts.sign))}
                    copyLabel={t.tooltip_copy || 'Copy'}
                    copiedLabel={t.emailCopied || 'Copied!'}
                    tone="accent"
                  />
                  <CopyCard
                    label={t.fieldExponent || 'Exponent'}
                    value={`${floatParts.rawExponent} → 2^${floatParts.exponent}`}
                    copied={copiedField === 'fexp'}
                    onCopy={() => copy('fexp', String(floatParts.exponent))}
                    copyLabel={t.tooltip_copy || 'Copy'}
                    copiedLabel={t.emailCopied || 'Copied!'}
                  />
                  <CopyCard
                    label={t.fieldMantissa || 'Mantissa'}
                    value={floatParts.rawMantissa.toString()}
                    copied={copiedField === 'fman'}
                    onCopy={() => copy('fman', floatParts.rawMantissa.toString())}
                    copyLabel={t.tooltip_copy || 'Copy'}
                    copiedLabel={t.emailCopied || 'Copied!'}
                  />
                  <CopyCard
                    label={t.floatKind || 'Kind'}
                    value={`${floatParts.kind} · ulp ${ulp(floatParts.value, precision).toExponential(3)}`}
                    copied={copiedField === 'fkind'}
                    onCopy={() => copy('fkind', floatParts.kind)}
                    copyLabel={t.tooltip_copy || 'Copy'}
                    copiedLabel={t.emailCopied || 'Copied!'}
                  />
                  <div className="sm:col-span-2 lg:col-span-4">
                    <CopyCard
                      label={t.exactValue || 'Exact stored value'}
                      value={exactDecimal(floatParts.value)}
                      copied={copiedField === 'fexact'}
                      onCopy={() => copy('fexact', exactDecimal(floatParts.value))}
                      copyLabel={t.tooltip_copy || 'Copy'}
                      copiedLabel={t.emailCopied || 'Copied!'}
                    />
                  </div>
                </div>
              )}

              {/* outputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CopyCard label={t.label_binary || 'Binary'} value={numberOutputs.bin} copied={copiedField === 'bin'} onCopy={() => copy('bin', numberOutputs.bin)} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
                <CopyCard label={t.label_hexadecimal || 'Hexadecimal'} value={numberOutputs.hex} copied={copiedField === 'hex'} onCopy={() => copy('hex', numberOutputs.hex)} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
                <CopyCard label={t.label_decimal || 'Decimal'} value={numberOutputs.dec} copied={copiedField === 'dec'} onCopy={() => copy('dec', numberOutputs.dec)} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
                <CopyCard label={t.label_octal || 'Octal'} value={numberOutputs.oct} copied={copiedField === 'oct'} onCopy={() => copy('oct', numberOutputs.oct)} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
              </div>

              {/* signed / unsigned pair + custom base + bytes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CopyCard
                  label={t.asUnsigned || 'As unsigned'}
                  value={fitted.raw.toString()}
                  copied={copiedField === 'uns'}
                  onCopy={() => copy('uns', fitted.raw.toString())}
                  copyLabel={t.tooltip_copy || 'Copy'}
                  copiedLabel={t.emailCopied || 'Copied!'}
                />
                <CopyCard
                  label={t.asSigned || 'As signed'}
                  value={effectiveWidth === 0 ? parsed.value.toString() : fitted.signed.toString()}
                  copied={copiedField === 'sig'}
                  onCopy={() => copy('sig', fitted.signed.toString())}
                  copyLabel={t.tooltip_copy || 'Copy'}
                  copiedLabel={t.emailCopied || 'Copied!'}
                  tone="accent"
                />
                <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                      {t.customBase || 'Custom base'}
                    </span>
                    <input
                      type="number"
                      min={2}
                      max={36}
                      value={outBase}
                      onChange={e => setOutBase(clampBase(Number(e.target.value)))}
                      className="w-14 bg-slate-950/70 border border-white/10 rounded-md px-1.5 py-1 text-xs font-mono text-white outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="font-mono text-sm text-white break-all select-all">{numberOutputs.custom}</div>
                </div>
              </div>

              {/* bytes + endianness */}
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                    {t.rawBytes || 'Raw bytes'}
                  </span>
                  <div className="inline-flex rounded-lg bg-slate-950/70 border border-white/10 overflow-hidden">
                    {[false, true].map(le => (
                      <button
                        key={String(le)}
                        onClick={() => setLittleEndian(le)}
                        className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                          littleEndian === le ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {le ? t.littleEndian || 'Little' : t.bigEndian || 'Big'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="font-mono text-sm text-white break-all select-all">{bytesToHex(valueBytes)}</div>
              </div>

              {/* bitwise */}
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                  {t.bitwiseTitle || 'Bitwise'}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex flex-wrap rounded-lg bg-slate-950/70 border border-white/10 overflow-hidden">
                    {BIT_OPS.map(o => (
                      <button
                        key={o}
                        onClick={() => setOp(o)}
                        className={`px-2.5 py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer ${
                          op === o ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {OP_SYMBOL[o]}
                      </button>
                    ))}
                  </div>
                  {op !== 'not' && (
                    <input
                      type="text"
                      value={opB}
                      onChange={e => setOpB(e.target.value)}
                      spellCheck={false}
                      aria-label={t.operandB || 'Second operand'}
                      className="flex-1 min-w-[8rem] px-3 py-2 rounded-lg bg-slate-950/70 border border-white/10 font-mono text-sm text-white outline-none focus:border-blue-500/50"
                    />
                  )}
                  <button
                    onClick={() => setRaw(opResult)}
                    className="px-3 py-2 rounded-lg bg-blue-500 text-[#020610] text-xs font-black hover:bg-blue-400 transition-colors cursor-pointer"
                  >
                    {t.applyOp || 'Apply'}
                  </button>
                </div>
                <div className="font-mono text-sm text-white break-all select-all">
                  {group(toBits(fit(opResult, effectiveWidth).raw, effectiveWidth), 8)}
                </div>
                <p className="text-[11px] text-slate-500">
                  {t.bitwiseNote ||
                    'Everything stays in BigInt at the width you picked, so nothing is silently truncated to 32 bits the way JavaScript operators do.'}
                </p>
              </div>
            </>
          )}

          {mode === 'text' && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex flex-wrap rounded-2xl bg-slate-950/60 border border-white/5 p-1">
                  {ENCODINGS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEncoding(e)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        encoding === e ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {ENCODING_LABEL[e]}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {(t.byteCount || '{n} bytes').replace('{n}', String(textBytes.length))}
                </span>
              </div>

              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                rows={3}
                spellCheck={false}
                aria-label={t.label_input_text || 'Input Text'}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/50 border border-white/5 focus:border-blue-500/50 font-mono text-sm text-white outline-none transition-colors resize-y"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CopyCard label={t.label_binary || 'Binary'} value={bytesToBinary(textBytes)} copied={copiedField === 'tbin'} onCopy={() => copy('tbin', bytesToBinary(textBytes))} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
                <CopyCard label={t.label_hexadecimal || 'Hexadecimal'} value={bytesToHex(textBytes)} copied={copiedField === 'thex'} onCopy={() => copy('thex', bytesToHex(textBytes))} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
                <CopyCard label={t.label_decimal || 'Decimal'} value={bytesToDecimal(textBytes)} copied={copiedField === 'tdec'} onCopy={() => copy('tdec', bytesToDecimal(textBytes))} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
                <CopyCard label={t.label_octal || 'Octal'} value={bytesToOctal(textBytes)} copied={copiedField === 'toct'} onCopy={() => copy('toct', bytesToOctal(textBytes))} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
              </div>

              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                  {t.roundTrip || 'Decoded back'}
                </span>
                <p className="font-mono text-sm text-white break-all whitespace-pre-wrap">{textRoundTrip || '—'}</p>
                {textRoundTrip !== textInput && (
                  <p className="text-xs font-bold text-amber-400">
                    {t.lossyEncoding || 'This encoding cannot represent every character you typed.'}
                  </p>
                )}
              </div>
            </>
          )}

          {mode === 'bytes' && (
            <>
              {/* Waiting room: a dropped or handed-over file is not read until
                  the user presses the button. */}
              {pending && (
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.07] p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{pending.file.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {pending.from
                          ? (t.pendingFrom || 'Handed over by {tool}').replace('{tool}', pending.from)
                          : t.pendingWaiting || 'Waiting — nothing has been read yet.'}
                        {' · '}
                        {(t.fileSize || '{n} bytes').replace('{n}', String(pending.file.size))}
                      </p>
                    </div>
                    <button
                      onClick={() => setPending(null)}
                      aria-label={t.discard || 'Discard'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={readPending}
                    className="w-full py-2.5 rounded-xl bg-blue-500 text-[#020610] text-xs font-black hover:bg-blue-400 transition-colors cursor-pointer"
                  >
                    {(t.readBytes || 'Read the first {n} bytes').replace('{n}', String(MAX_DUMP_BYTES))}
                  </button>
                </div>
              )}

              {!pending && !fileBytes && (
                <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center space-y-3">
                  <p className="text-sm text-slate-400">{t.dropHint || 'Drop a file anywhere, or pick one.'}</p>
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    {t.chooseFile || 'Choose a file'}
                  </button>
                </div>
              )}

              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={e => {
                  const f = e.target.files && e.target.files[0];
                  if (f) queueFile(f);
                  e.target.value = '';
                }}
              />

              {fileBytes && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">{fileBytes.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        {(t.byteCount || '{n} bytes').replace('{n}', String(fileBytes.bytes.length))}
                        {fileBytes.truncated ? ` · ${t.truncated || 'truncated'}` : ''}
                      </span>
                      <button
                        onClick={() => setFileBytes(null)}
                        className="px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {t.clear || 'Clear'}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 overflow-x-auto max-h-96 overflow-y-auto">
                    <pre className="p-4 font-mono text-[11px] leading-relaxed text-slate-300 w-max">
                      {dump.map(row => (
                        <div key={row.offset}>
                          <span className="text-blue-400/70">{row.offset}</span>{'  '}
                          <span className="text-white">{row.hex}</span>{'  '}
                          <span className="text-slate-500">{row.text}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <AdBanner id="adsense-binary-flow-mid" />

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
                    <span className="w-5 h-5 rounded-md bg-blue-500/15 text-blue-300 text-[11px] font-black flex items-center justify-center shrink-0">
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
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-blue-300 transition-colors">
                    <span>{item.question}</span>
                    <span className="text-blue-400 text-lg leading-none shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-binary-flow-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={m => setLegalModal(m)} />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTop || 'Back to top'}
          className="fixed bottom-6 right-6 z-[190] w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-all cursor-pointer"
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
