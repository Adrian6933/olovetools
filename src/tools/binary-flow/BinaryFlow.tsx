import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { Binary, Copy, Check, RotateCcw, Type, Hash, ArrowRight } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface BinaryFlowProps {
  lang: string;
  dictionary: any;
}

type BaseId = 2 | 8 | 10 | 16;
type Mode = 'number' | 'text';

const BASES: { id: BaseId; label: string; short: string }[] = [
  { id: 2, label: 'Binary', short: 'BIN' },
  { id: 8, label: 'Octal', short: 'OCT' },
  { id: 10, label: 'Decimal', short: 'DEC' },
  { id: 16, label: 'Hexadecimal', short: 'HEX' },
];

const DEFAULT_INPUT = '72';
const DEFAULT_BASE: BaseId = 10;
const DEFAULT_TEXT = 'Hi';

const isValidForBase = (value: string, base: BaseId): boolean => {
  const v = value.trim().toLowerCase();
  if (!v) return true;
  const pattern =
    base === 2 ? /^[01]+$/ : base === 8 ? /^[0-7]+$/ : base === 10 ? /^[0-9]+$/ : /^[0-9a-f]+$/;
  return pattern.test(v);
};

const parseInBase = (value: string, base: BaseId): bigint | null => {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (!isValidForBase(v, base)) return null;
  let result = 0n;
  const bigBase = BigInt(base);
  for (const char of v) {
    result = result * bigBase + BigInt(parseInt(char, base));
  }
  return result;
};

const toBaseString = (value: bigint, base: BaseId): string => {
  if (value === 0n) return '0';
  let result = '';
  let v = value;
  const bigBase = BigInt(base);
  const digits = '0123456789abcdef';
  while (v > 0n) {
    result = digits[Number(v % bigBase)] + result;
    v = v / bigBase;
  }
  return result;
};

const binaryToAscii = (value: bigint): string => {
  if (value <= 0n) return '';
  let bin = toBaseString(value, 2);
  const pad = bin.length % 8 === 0 ? 0 : 8 - (bin.length % 8);
  bin = '0'.repeat(pad) + bin;
  if (bin.length > 8 * 4096) return '';
  let result = '';
  for (let i = 0; i < bin.length; i += 8) {
    const byte = parseInt(bin.slice(i, i + 8), 2);
    if (byte >= 32 && byte <= 126) {
      result += String.fromCharCode(byte);
    } else if (byte === 10) {
      result += '\n';
    } else if (byte === 9) {
      result += '\t';
    } else {
      result += '\u00B7';
    }
  }
  return result;
};

const textToUtf8Bytes = (text: string): number[] => {
  return Array.from(new TextEncoder().encode(text));
};

const bytesToBinary = (bytes: number[]): string =>
  bytes.map((b) => b.toString(2).padStart(8, '0')).join(' ');

const bytesToOctal = (bytes: number[]): string => bytes.map((b) => b.toString(8)).join(' ');

const bytesToDecimal = (bytes: number[]): string => bytes.map((b) => b.toString(10)).join(' ');

const bytesToHex = (bytes: number[]): string =>
  bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');

const CopyCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
}> = ({ label, value, icon, copied, onCopy, copyLabel, copiedLabel }) => (
  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-blue-500/20 transition-colors group">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <button
        onClick={onCopy}
        disabled={!value}
        title={copied ? copiedLabel : copyLabel}
        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
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
  const [mode, setMode] = useState<Mode>('number');
  const [inputBase, setInputBase] = useState<BaseId>(DEFAULT_BASE);
  const [inputValue, setInputValue] = useState<string>(DEFAULT_INPUT);
  const [textInput, setTextInput] = useState<string>(DEFAULT_TEXT);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const parsedValue = useMemo<bigint | null>(
    () => (mode === 'number' ? parseInBase(inputValue, inputBase) : null),
    [mode, inputValue, inputBase]
  );

  const inputValid = useMemo(() => {
    if (mode === 'text') return textInput.length > 0;
    return isValidForBase(inputValue, inputBase);
  }, [mode, inputValue, inputBase, textInput]);

  const utf8Bytes = useMemo(() => (mode === 'text' ? textToUtf8Bytes(textInput) : []), [mode, textInput]);

  const outputs = useMemo(() => {
    if (mode === 'number') {
      if (parsedValue === null) {
        return { bin: '', oct: '', dec: '', hex: '' };
      }
      return {
        bin: toBaseString(parsedValue, 2),
        oct: toBaseString(parsedValue, 8),
        dec: toBaseString(parsedValue, 10),
        hex: toBaseString(parsedValue, 16).toUpperCase(),
      };
    }
    return {
      bin: bytesToBinary(utf8Bytes),
      oct: bytesToOctal(utf8Bytes),
      dec: bytesToDecimal(utf8Bytes),
      hex: bytesToHex(utf8Bytes).toUpperCase(),
    };
  }, [mode, parsedValue, utf8Bytes]);

  const asciiText = useMemo(() => {
    if (mode === 'number') {
      if (parsedValue === null || parsedValue <= 0n) return '';
      return binaryToAscii(parsedValue);
    }
    return textInput;
  }, [mode, parsedValue, textInput]);

  const copyToClipboard = (field: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetWorkspace = useCallback(() => {
    setMode('number');
    setInputBase(DEFAULT_BASE);
    setInputValue(DEFAULT_INPUT);
    setTextInput(DEFAULT_TEXT);
    setCopiedField(null);
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setCopiedField(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020610] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/binary-flow`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-binary-flow-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Binary className="w-8 h-8 text-blue-400" />
            <span>{t.seoHeroTitle || 'BinaryFlow'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="inline-flex rounded-2xl bg-slate-950/60 border border-white/5 p-1">
              <button
                onClick={() => switchMode('number')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border-none ${
                  mode === 'number'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
              >
                <Hash className="w-4 h-4" />
                {t.label_number_mode || 'Number'}
              </button>
              <button
                onClick={() => switchMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border-none ${
                  mode === 'text'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
              >
                <Type className="w-4 h-4" />
                {t.label_text_mode || 'Text to Binary'}
              </button>
            </div>
            {mode === 'number' && (
              <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-950/60 border border-white/5 p-1">
                {BASES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setInputBase(b.id)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer outline-none border-none ${
                      inputBase === b.id
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'text-slate-400 hover:text-white bg-transparent'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-black text-blue-400 uppercase tracking-widest text-left">
              {mode === 'number'
                ? t.label_input_value || 'Input Value'
                : t.label_input_text || 'Input Text'}
            </label>
            {mode === 'number' ? (
              <div className="relative flex items-center">
                <Hash className="absolute left-4 w-5 h-5 text-blue-400 pointer-events-none" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={BASES.find((b) => b.id === inputBase)?.label}
                  spellCheck={false}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/50 border font-mono text-sm tracking-wider text-white placeholder-slate-600 focus:ring-0 transition-colors outline-none ${
                    inputValid
                      ? 'border-white/5 focus:border-blue-500/50'
                      : 'border-red-500/40 focus:border-red-500/60'
                  }`}
                />
                {!inputValid && inputValue.length > 0 && (
                  <span className="absolute right-4 text-[10px] font-bold text-red-400">
                    {t.error_invalid_value || 'Invalid'}
                  </span>
                )}
              </div>
            ) : (
              <div className="relative flex items-start">
                <Type className="absolute left-4 top-4 w-5 h-5 text-blue-400 pointer-events-none" />
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Hello"
                  spellCheck={false}
                  rows={4}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/50 border border-white/5 focus:border-blue-500/50 font-mono text-sm text-white placeholder-slate-600 focus:ring-0 transition-colors outline-none resize-y"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CopyCard
              label={t.label_binary || 'Binary'}
              value={outputs.bin}
              icon={<Binary className="w-3 h-3" />}
              copied={copiedField === 'bin'}
              onCopy={() => copyToClipboard('bin', outputs.bin)}
              copyLabel={t.tooltip_copy || 'Copy'}
              copiedLabel={t.emailCopied || 'Copied!'}
            />
            <CopyCard
              label={t.label_octal || 'Octal'}
              value={outputs.oct}
              icon={<Hash className="w-3 h-3" />}
              copied={copiedField === 'oct'}
              onCopy={() => copyToClipboard('oct', outputs.oct)}
              copyLabel={t.tooltip_copy || 'Copy'}
              copiedLabel={t.emailCopied || 'Copied!'}
            />
            <CopyCard
              label={t.label_decimal || 'Decimal'}
              value={outputs.dec}
              icon={<Hash className="w-3 h-3" />}
              copied={copiedField === 'dec'}
              onCopy={() => copyToClipboard('dec', outputs.dec)}
              copyLabel={t.tooltip_copy || 'Copy'}
              copiedLabel={t.emailCopied || 'Copied!'}
            />
            <CopyCard
              label={t.label_hexadecimal || 'Hexadecimal'}
              value={outputs.hex}
              icon={<Hash className="w-3 h-3" />}
              copied={copiedField === 'hex'}
              onCopy={() => copyToClipboard('hex', outputs.hex)}
              copyLabel={t.tooltip_copy || 'Copy'}
              copiedLabel={t.emailCopied || 'Copied!'}
            />
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
              <label className="text-xs font-black text-blue-400 uppercase tracking-widest text-left">
                {mode === 'number'
                  ? t.label_ascii_output || 'ASCII Representation'
                  : t.label_text_output || 'Text Representation'}
              </label>
            </div>
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 min-h-[80px] font-mono text-sm text-white break-all whitespace-pre-wrap max-h-60 overflow-y-auto">
              {asciiText ? (
                asciiText
              ) : (
                <span className="text-slate-600">
                  {t.message_empty_ascii ||
                    (mode === 'number'
                      ? 'Enter a value to see its ASCII representation.'
                      : 'Type text to see its representation.')}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex justify-end">
            <button
              onClick={resetWorkspace}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-300 hover:text-blue-400 text-xs font-bold transition-all cursor-pointer outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              {t.button_reset || 'Reset'}
            </button>
          </div>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-binary-flow-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />

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
