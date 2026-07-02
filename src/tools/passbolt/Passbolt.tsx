import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { KeyRound, Copy, Check, RotateCcw, RefreshCw, ShieldCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface PassboltProps {
  lang: string;
  dictionary: any;
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~';
const SIMILAR = 'il1Lo0OIB8|';
const GUESSES_PER_SEC = 10_000_000_000;
const COMMON_PASSWORDS = ['password', 'passw0rd', '123456', '12345678', '123456789', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'iloveyou', 'abc123', '111111', '000000'];

interface Options {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
}

const DEFAULT_OPTIONS: Options = {
  length: 16,
  upper: true,
  lower: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false,
};

function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const buf = new Uint8Array(1);
  const limit = 256 - (256 % max);
  let r = 0;
  do {
    crypto.getRandomValues(buf);
    r = buf[0];
  } while (r >= limit);
  return r % max;
}

function buildCharset(opts: Options): string {
  let charset = '';
  if (opts.upper) charset += UPPER;
  if (opts.lower) charset += LOWER;
  if (opts.numbers) charset += DIGITS;
  if (opts.symbols) charset += SYMBOLS;
  if (opts.excludeSimilar) {
    charset = charset.split('').filter((c) => !SIMILAR.includes(c)).join('');
  }
  return charset;
}

function generatePassword(opts: Options): string {
  const charset = buildCharset(opts);
  if (!charset) return '';
  const arr: string[] = [];
  for (let i = 0; i < opts.length; i++) {
    arr.push(charset[secureRandomInt(charset.length)]);
  }
  return arr.join('');
}

function detectCharsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 33;
  return size || 1;
}

function calcEntropy(password: string, charsetSize: number): number {
  if (!password || charsetSize <= 1) return 0;
  return password.length * Math.log2(charsetSize);
}

function formatCrackTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return 'instant';
  if (seconds > 1e18) return 'eternity';
  const units: { name: string; sec: number }[] = [
    { name: 'year', sec: 31536000 },
    { name: 'day', sec: 86400 },
    { name: 'hour', sec: 3600 },
    { name: 'minute', sec: 60 },
    { name: 'second', sec: 1 },
  ];
  for (const u of units) {
    const v = seconds / u.sec;
    if (v >= 1) {
      const n = Math.floor(v);
      if (n >= 1e12) return 'millions of centuries';
      return `${n.toLocaleString()} ${u.name}${n === 1 ? '' : 's'}`;
    }
  }
  return 'instant';
}

function crackTimeFromEntropy(entropy: number): string {
  if (entropy <= 0) return 'instant';
  const seconds = Math.pow(2, entropy) / GUESSES_PER_SEC;
  return formatCrackTime(seconds);
}

interface StrengthLevel {
  level: number;
  label: string;
  barClass: string;
  textClass: string;
  ringClass: string;
}

function getStrengthLevel(entropy: number): StrengthLevel {
  if (entropy < 28) return { level: 0, label: 'Very Weak', barClass: 'bg-red-500', textClass: 'text-red-400', ringClass: 'ring-red-500/30' };
  if (entropy < 36) return { level: 1, label: 'Weak', barClass: 'bg-orange-500', textClass: 'text-orange-400', ringClass: 'ring-orange-500/30' };
  if (entropy < 60) return { level: 2, label: 'Fair', barClass: 'bg-amber-400', textClass: 'text-amber-300', ringClass: 'ring-amber-400/30' };
  if (entropy < 128) return { level: 3, label: 'Strong', barClass: 'bg-emerald-500', textClass: 'text-emerald-300', ringClass: 'ring-emerald-500/30' };
  return { level: 4, label: 'Very Strong', barClass: 'bg-emerald-400', textClass: 'text-emerald-300', ringClass: 'ring-emerald-400/40' };
}

function hasSequence(pw: string): boolean {
  const lower = pw.toLowerCase();
  for (let i = 0; i < lower.length - 2; i++) {
    const a = lower.charCodeAt(i);
    const b = lower.charCodeAt(i + 1);
    const c = lower.charCodeAt(i + 2);
    if (b - a === 1 && c - b === 1) return true;
    if (a - b === 1 && b - c === 1) return true;
  }
  return false;
}

function hasRepeat(pw: string): boolean {
  for (let i = 0; i < pw.length - 2; i++) {
    if (pw[i] === pw[i + 1] && pw[i] === pw[i + 2]) return true;
  }
  return false;
}

function isCommon(pw: string): boolean {
  const lower = pw.toLowerCase();
  return COMMON_PASSWORDS.some((c) => lower === c || lower.includes(c));
}

export default function Passbolt({ lang, dictionary }: PassboltProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [mode, setMode] = useState<'generate' | 'test'>('generate');
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const [password, setPassword] = useState<string>('');
  const [testPassword, setTestPassword] = useState<string>('');
  const [showTestPassword, setShowTestPassword] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const noClassSelected = !options.upper && !options.lower && !options.numbers && !options.symbols;

  const regenerate = useCallback(() => {
    if (noClassSelected) {
      setPassword('');
      return;
    }
    setPassword(generatePassword(options));
  }, [options, noClassSelected]);

  useEffect(() => {
    setPassword(generatePassword(options));
  }, [options]);

  const resetWorkspace = useCallback(() => {
    setOptions(DEFAULT_OPTIONS);
    setTestPassword('');
    setShowTestPassword(false);
    setMode('generate');
    setCopied(false);
  }, []);

  const copyPassword = useCallback(() => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [password]);

  const activePassword = mode === 'generate' ? password : testPassword;

  const analysis = useMemo(() => {
    const charsetSize = detectCharsetSize(activePassword);
    let entropy = calcEntropy(activePassword, charsetSize);
    if (mode === 'test' && activePassword) {
      if (isCommon(activePassword)) entropy = Math.min(entropy, 20);
      if (hasSequence(activePassword)) entropy = Math.max(entropy - 12, 0);
      if (hasRepeat(activePassword)) entropy = Math.max(entropy - 10, 0);
      if (activePassword.length < 8) entropy = Math.min(entropy, 24);
    }
    const strength = getStrengthLevel(entropy);
    const crackTime = crackTimeFromEntropy(entropy);
    return { charsetSize, entropy, strength, crackTime };
  }, [activePassword, mode]);

  const tips = useMemo(() => {
    const pw = mode === 'test' ? activePassword : '';
    const checks = [
      { label: t.tipLength || 'Use at least 12 characters', pass: pw.length >= 12 },
      { label: t.tipMix || 'Mix uppercase, lowercase, numbers, and symbols', pass: /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw) },
      { label: t.tipNoCommon || 'Avoid common words and names', pass: pw.length > 0 && !isCommon(pw) },
      { label: t.tipNoSequence || 'Avoid sequences like 123 or abc', pass: pw.length > 0 && !hasSequence(pw) },
      { label: t.tipNoRepeat || 'Avoid repeated characters', pass: pw.length > 0 && !hasRepeat(pw) },
      { label: t.tipNoReuse || 'Don\'t reuse passwords across accounts', pass: false },
      { label: t.tipManager || 'Use a password manager', pass: false },
    ];
    return checks;
  }, [activePassword, mode, t]);

  const meterPct = Math.min(analysis.entropy / 128, 1) * 100;

  const checkboxes: { key: keyof Options; label: string; sample: string }[] = [
    { key: 'upper', label: t.uppercase || 'Uppercase (A-Z)', sample: 'A B C' },
    { key: 'lower', label: t.lowercase || 'Lowercase (a-z)', sample: 'a b c' },
    { key: 'numbers', label: t.numbers || 'Numbers (0-9)', sample: '0 1 2' },
    { key: 'symbols', label: t.symbols || 'Symbols (!@#$)', sample: '! @ #' },
    { key: 'excludeSimilar', label: t.excludeSimilar || 'Exclude similar chars', sample: 'no 1lLo0' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#020a08] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/passbolt`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-passbolt-top" />

        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <KeyRound className="w-8 h-8 text-emerald-400" />
            <span>{t.seoHeroTitle || 'PassBolt'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">{t.seoHeroText}</p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-white/10 bg-white/[0.02] w-full md:w-auto md:self-start">
          <button
            onClick={() => setMode('generate')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer border-none outline-none ${
              mode === 'generate'
                ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-transparent text-slate-400 hover:text-emerald-300'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            {t.generate || 'Generate'}
          </button>
          <button
            onClick={() => setMode('test')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer border-none outline-none ${
              mode === 'test'
                ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-transparent text-slate-400 hover:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t.test || 'Test Password'}
          </button>
        </div>

        {mode === 'generate' ? (
          <>
            <div className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-[#020a08] to-[#020a08] p-6 md:p-10 overflow-hidden">
              <div className="absolute top-4 left-4 text-[10px] tracking-[0.4em] uppercase text-emerald-400/40 font-bold">
                {t.generatedLabel || 'Generated Password'}
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mt-4">
                <div className="flex-grow min-w-0 rounded-2xl bg-black/40 border border-white/10 px-5 py-4 font-mono text-xl md:text-2xl text-emerald-300 break-all min-h-[3.5rem] flex items-center tracking-wider">
                  {noClassSelected ? (
                    <span className="text-slate-500 text-sm font-sans tracking-normal">{t.selectAtLeastOne || 'Select at least one character type'}</span>
                  ) : password ? (
                    password
                  ) : (
                    <span className="text-slate-600 text-sm font-sans tracking-normal">{t.generating || 'Generating...'}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={copyPassword}
                    disabled={!password || noClassSelected}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-emerald-500/15 hover:border-emerald-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-sm font-bold text-slate-200 hover:text-emerald-300 outline-none"
                  >
                    {copied ? <><Check className="w-4 h-4" /> {t.copied || 'Copied'}</> : <><Copy className="w-4 h-4" /> {t.copy || 'Copy'}</>}
                  </button>
                  <button
                    onClick={regenerate}
                    disabled={noClassSelected}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-sm font-bold text-emerald-300 outline-none"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t.regenerate || 'Regenerate'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-[0.3em] uppercase text-emerald-400/70">{t.optionsLabel || 'Options'}</h3>
                <button
                  onClick={() => setOptions(DEFAULT_OPTIONS)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t.reset || 'Reset'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-200">{t.length || 'Length'}</label>
                  <span className="text-2xl font-black text-emerald-300 tabular-nums tracking-tight">{options.length}</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={options.length}
                  onChange={(e) => setOptions((o) => ({ ...o, length: Number(e.target.value) }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-emerald-400 outline-none"
                  style={{ accentColor: '#34d399' }}
                />
                <div className="flex justify-between text-[10px] tracking-widest uppercase text-slate-600 font-bold">
                  <span>8</span>
                  <span>16</span>
                  <span>32</span>
                  <span>48</span>
                  <span>64</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {checkboxes.map((cb) => {
                  const checked = options[cb.key] as boolean;
                  const disabled = cb.key !== 'excludeSimilar' && noClassSelected && false;
                  return (
                    <button
                      key={cb.key}
                      onClick={() => setOptions((o) => ({ ...o, [cb.key]: !o[cb.key] }))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer outline-none ${
                        checked
                          ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          checked ? 'border-emerald-400 bg-emerald-500' : 'border-white/30 bg-transparent'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 text-[#020a08]" strokeWidth={3} />}
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className={`text-sm font-bold ${checked ? 'text-emerald-300' : 'text-slate-300'}`}>{cb.label}</span>
                        <span className="text-[10px] text-slate-600 font-mono tracking-wider uppercase">{cb.sample}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-[#020a08] to-[#020a08] p-6 md:p-10 overflow-hidden">
            <div className="absolute top-4 left-4 text-[10px] tracking-[0.4em] uppercase text-emerald-400/40 font-bold">
              {t.testLabel || 'Test a Password'}
            </div>
            <div className="mt-6">
              <div className="relative">
                <input
                  type={showTestPassword ? 'text' : 'password'}
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder={t.testPlaceholder || 'Type a password to test its strength...'}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-2xl bg-black/40 border border-white/10 px-5 py-4 pr-14 font-mono text-lg md:text-xl text-emerald-200 placeholder:text-slate-600 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all tracking-wider"
                />
                <button
                  onClick={() => setShowTestPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-500/40 hover:text-emerald-300 text-slate-400 transition-all cursor-pointer outline-none"
                  aria-label="Toggle visibility"
                >
                  {showTestPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {testPassword.length === 0 && (
                <p className="mt-3 text-xs text-slate-500 tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-emerald-400/40" />
                  {t.testHint || 'Everything stays local. Nothing is sent or stored.'}
                </p>
              )}
            </div>
          </div>
        )}

        <div className={`rounded-3xl border bg-white/[0.02] p-6 md:p-8 space-y-5 transition-all ${activePassword ? `border-white/10 ring-4 ${analysis.strength.ringClass}` : 'border-white/10'}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-black tracking-[0.3em] uppercase text-emerald-400/70 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {t.strengthLabel || 'Password Strength'}
            </h3>
            {activePassword ? (
              <span className={`text-sm font-black tracking-wider uppercase ${analysis.strength.textClass}`}>
                {analysis.strength.label}
              </span>
            ) : (
              <span className="text-sm font-bold tracking-wider uppercase text-slate-600">{t.noneLabel || 'N/A'}</span>
            )}
          </div>

          <div className="relative h-3 rounded-full bg-black/40 border border-white/5 overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${analysis.strength.barClass}`}
              style={{ width: `${activePassword ? meterPct : 0}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-1">{t.lengthLabel || 'Length'}</div>
              <div className="text-2xl font-black text-white tabular-nums">{activePassword.length || 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-1">{t.entropyLabel || 'Entropy'}</div>
              <div className="text-2xl font-black text-emerald-300 tabular-nums">
                {analysis.entropy > 0 ? analysis.entropy.toFixed(1) : '0.0'}
                <span className="text-sm text-slate-500 font-bold ml-1">bits</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold mb-1">{t.crackTimeLabel || 'Est. Crack Time'}</div>
              <div className="text-lg md:text-xl font-black text-white break-words leading-tight">
                {activePassword ? analysis.crackTime : 'â€”'}
              </div>
              <div className="text-[10px] text-slate-600 font-mono mt-1">@ 10B guesses/sec</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 space-y-4">
          <h3 className="text-sm font-black tracking-[0.3em] uppercase text-emerald-400/70 flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            {t.tipsLabel || 'Password Tips'}
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tips.map((tip, i) => {
              const isCheck = mode === 'test' && activePassword.length > 0 && tip.pass;
              const isWarn = mode === 'test' && activePassword.length > 0 && !tip.pass;
              const isNeutral = mode !== 'test' || activePassword.length === 0;
              return (
                <li
                  key={i}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all ${
                    isCheck
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : isWarn
                      ? 'border-amber-500/20 bg-amber-500/5'
                      : 'border-white/5 bg-black/20'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {isCheck ? (
                      <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <span className="block w-4 h-4 rounded-full border border-emerald-500/30" />
                    )}
                  </span>
                  <span className={`text-sm leading-relaxed ${isNeutral ? 'text-slate-400' : isCheck ? 'text-emerald-200' : 'text-amber-200'}`}>
                    {tip.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-passbolt-bottom" />
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
