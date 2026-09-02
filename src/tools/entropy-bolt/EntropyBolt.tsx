import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Type,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import {
  HeroArt,
  IconDice,
  IconGauge,
  IconInspect,
  IconOffline,
  IconPhrase,
  IconStack,
  StepChoose,
  StepMeasure,
  StepStore,
  StepTune,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';

import {
  DEFAULT_OPTIONS,
  MAX_LENGTH,
  MIN_LENGTH,
  charsetFor,
  generate,
  generateMany,
  type ClassId,
  type Options,
} from './lib/charsets';
import {
  DEFAULT_PHRASE,
  MAX_WORDS,
  MIN_WORDS,
  SEPARATORS,
  generatePhrase,
  type Capitalisation,
  type PhraseOptions,
} from './lib/passphrase';
import {
  SCENARIOS,
  describeDuration,
  estimateBits,
  generatorBits,
  secondsToCrack,
  strengthOf,
  type Duration,
} from './lib/entropy';

interface EntropyBoltProps {
  lang: string;
  dictionary: any;
}

type Mode = 'chars' | 'phrase' | 'test';

/**
 * Sustituye {marcadores} en una plantilla del diccionario.
 *
 * Hace falta porque las cifras van dentro de la frase y su posición cambia con
 * el idioma ("3 days" / "hace 3 días" / "3日"): concatenar trozos no vale.
 */
function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export default function EntropyBolt({ lang, dictionary }: EntropyBoltProps) {
  const t = dictionary || {};

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [mode, setMode] = useState<Mode>('chars');

  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const [phraseOpts, setPhraseOpts] = useState<PhraseOptions>(DEFAULT_PHRASE);

  const [password, setPassword] = useState('');
  const [phrase, setPhrase] = useState('');
  const [phraseBits, setPhraseBits] = useState(0);
  const [batch, setBatch] = useState<string[]>([]);
  const [batchCount, setBatchCount] = useState(10);

  const [testPassword, setTestPassword] = useState('');
  const [showTest, setShowTest] = useState(false);

  const [copied, setCopied] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // --- listas cargadas bajo demanda ----------------------------------------
  // Ni la lista de palabras (2.307 entradas) ni la de contraseñas filtradas
  // entran en el chunk inicial: quien sólo genera una contraseña de caracteres
  // no descarga ninguna de las dos.
  const [words, setWords] = useState<string[]>([]);
  const [commonSet, setCommonSet] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (mode !== 'phrase' || words.length) return;
    let alive = true;
    import('./lib/wordlist').then(m => {
      if (alive) setWords(m.WORDS);
    });
    return () => {
      alive = false;
    };
  }, [mode, words.length]);

  useEffect(() => {
    if (mode !== 'test' || commonSet) return;
    let alive = true;
    import('./lib/common').then(m => {
      if (alive) setCommonSet(m.commonPasswords());
    });
    return () => {
      alive = false;
    };
  }, [mode, commonSet]);

  // --- generación -----------------------------------------------------------

  const charset = useMemo(() => charsetFor(options), [options]);
  const noCharset = charset.length === 0;

  const regenerate = useCallback(() => {
    const r = generate(options);
    setPassword(r.password);
    setBatch([]);
  }, [options]);

  const regeneratePhrase = useCallback(() => {
    if (!words.length) return;
    const r = generatePhrase(words, phraseOpts);
    setPhrase(r.phrase);
    setPhraseBits(r.bits);
  }, [phraseOpts, words]);

  // Una primera contraseña al entrar, para que la herramienta no reciba al
  // usuario con un hueco vacío. NO se regenera con cada cambio de ajuste: la
  // versión anterior tenía un efecto atado a `options` entero, así que arrastrar
  // el deslizador de longitud de 16 a 64 generaba ~48 contraseñas seguidas y el
  // texto bailaba bajo el dedo.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || noCharset) return;
    seeded.current = true;
    setPassword(generate(options).password);
    // Sólo en el primer render con un alfabeto válido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noCharset]);

  useEffect(() => {
    if (mode === 'phrase' && words.length && !phrase) regeneratePhrase();
  }, [mode, words.length, phrase, regeneratePhrase]);

  /**
   * Cambia un ajuste y regenera. Se usa en todo salvo en la longitud, que
   * actualiza en vivo mientras se arrastra y sólo regenera al soltar.
   */
  const setOption = useCallback(<K extends keyof Options>(key: K, value: Options[K]) => {
    setOptions(prev => {
      const next = { ...prev, [key]: value };
      const r = generate(next);
      setPassword(r.password);
      setBatch([]);
      return next;
    });
  }, []);

  const setPhraseOption = useCallback(<K extends keyof PhraseOptions>(key: K, value: PhraseOptions[K]) => {
    setPhraseOpts(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (mode === 'phrase' && words.length) regeneratePhrase();
    // Regenera al cambiar cualquier ajuste de la frase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phraseOpts, words.length]);

  const makeBatch = useCallback(() => {
    setBatch(generateMany(options, batchCount).map(r => r.password));
  }, [options, batchCount]);

  const resetOptions = useCallback(() => {
    setOptions(DEFAULT_OPTIONS);
    setPassword(generate(DEFAULT_OPTIONS).password);
    setBatch([]);
  }, []);

  // --- copiado --------------------------------------------------------------

  /**
   * Copia de verdad: espera a la promesa y distingue el fallo.
   *
   * La versión anterior llamaba a `navigator.clipboard.writeText` sin await ni
   * catch y ponía "Copiado" al instante, así que en un contexto no seguro o con
   * el permiso denegado mentía y además dejaba una promesa rechazada suelta.
   */
  const copy = useCallback(async (text: string, id: string) => {
    if (!text) return;
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setCopyFailed(false);
    } catch {
      setCopied('');
      setCopyFailed(true);
    }
    copyTimer.current = setTimeout(() => {
      setCopied('');
      setCopyFailed(false);
    }, 1800);
  }, []);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const downloadBatch = useCallback(() => {
    const blob = new Blob([batch.join('\n') + '\n'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passwords.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revocada con retraso: Safari cancela la descarga en curso si la URL
    // desaparece en el mismo tick.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [batch]);

  // --- análisis -------------------------------------------------------------

  const analysis = useMemo(() => {
    if (mode === 'chars') {
      // Entropía EXACTA a partir de los ajustes. No se inspecciona la salida.
      const bits = generatorBits(options);
      return { bits, weaknesses: [], exact: true, value: password };
    }
    if (mode === 'phrase') {
      return { bits: phraseBits, weaknesses: [], exact: true, value: phrase };
    }
    const est = estimateBits(testPassword, commonSet || undefined);
    return { bits: est.bits, weaknesses: est.weaknesses, exact: false, value: testPassword };
  }, [mode, options, password, phrase, phraseBits, testPassword, commonSet]);

  const strength = strengthOf(analysis.bits);
  const meterPct = Math.min(analysis.bits / 128, 1) * 100;
  const hasValue = analysis.value.length > 0;

  const strengthLabel =
    t[`strength_${strength.id}`] ||
    { veryWeak: 'Very weak', weak: 'Weak', fair: 'Fair', strong: 'Strong', veryStrong: 'Very strong' }[strength.id];

  /** Convierte una duración en texto traducido, con el número dentro de la frase. */
  const durationText = useCallback(
    (d: Duration): string => {
      if (d.unit === 'instant') return t.durationInstant || 'instantly';
      if (d.unit === 'forever') return t.durationForever || 'longer than the universe has existed';
      const tpl =
        t[`duration_${d.unit}`] ||
        { seconds: '{n} seconds', minutes: '{n} minutes', hours: '{n} hours', days: '{n} days', months: '{n} months', years: '{n} years' }[
          d.unit
        ];
      // Intl.NumberFormat con locale explícito: `toLocaleString()` a secas usa
      // el locale del entorno, que en el render de servidor y en el navegador
      // del usuario no tienen por qué coincidir.
      const n = new Intl.NumberFormat(lang || 'en').format(d.value || 0);
      return fill(tpl, { n });
    },
    [t, lang]
  );

  const scenarioRows = useMemo(
    () =>
      SCENARIOS.map(s => ({
        id: s.id,
        label: t[s.key] || s.id,
        text: hasValue ? durationText(describeDuration(secondsToCrack(analysis.bits, s.guessesPerSecond))) : '—',
      })),
    [analysis.bits, hasValue, t, durationText]
  );

  const classToggles: { key: ClassId; label: string; sample: string }[] = [
    { key: 'upper', label: t.uppercase || 'Uppercase (A-Z)', sample: 'A B C' },
    { key: 'lower', label: t.lowercase || 'Lowercase (a-z)', sample: 'a b c' },
    { key: 'digits', label: t.numbers || 'Numbers (0-9)', sample: '0 1 2' },
    { key: 'symbols', label: t.symbols || 'Symbols (!@#)', sample: '! @ #' },
  ];

  const faq: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];

  const steps = [
    { art: <StepChoose />, title: t.step1Title || 'Pick characters or words', text: t.step1Text || 'A random string, or a passphrase built from a 2,307-word list.' },
    { art: <StepTune />, title: t.step2Title || 'Set the length and the alphabet', text: t.step2Text || 'Every change updates the exact entropy before you commit to it.' },
    { art: <StepMeasure />, title: t.step3Title || 'Read the real numbers', text: t.step3Text || 'Bits computed from your settings, and crack times for four attack scenarios.' },
    { art: <StepStore />, title: t.step4Title || 'Copy it into a password manager', text: t.step4Text || 'Generate one, or a batch of up to 50 as a text file.' },
  ];

  const features = [
    { icon: <IconDice className="w-6 h-6" />, title: t.feat1Title || 'Cryptographic randomness', text: t.feat1Text || 'Every character comes from crypto.getRandomValues with rejection sampling, so no character is likelier than another.' },
    { icon: <IconGauge className="w-6 h-6" />, title: t.feat2Title || 'Entropy that is actually exact', text: t.feat2Text || 'Bits are derived from your settings, not guessed from the output, so the same settings always report the same strength.' },
    { icon: <IconPhrase className="w-6 h-6" />, title: t.feat3Title || 'Passphrases you can type', text: t.feat3Text || 'Six words from a 2,307-word list is 67 bits — strong and still memorable.' },
    { icon: <IconInspect className="w-6 h-6" />, title: t.feat4Title || 'Tells you what is weak', text: t.feat4Text || 'Test a password and see which patterns cost it bits: sequences, repeats, a trailing year, a leaked entry.' },
    { icon: <IconStack className="w-6 h-6" />, title: t.feat5Title || 'Batches of up to 50', text: t.feat5Text || 'Generate a list at once and download it as a plain text file.' },
    { icon: <IconOffline className="w-6 h-6" />, title: t.feat6Title || 'Never leaves the tab', text: t.feat6Text || 'No network requests, no storage, no analytics on what you type. Works with the connection off.' },
  ];

  /**
   * Reinicio desde el nombre de la herramienta en la cabecera.
   * Borra lo generado y lo que se estuviera comprobando: no conviene que una contrasena siga en pantalla despues de reiniciar.
   * El scroll arriba lo pone withScrollToTop en el propio Header.
   */
  const handleSoftReset = () => {
    setMode('chars');
    setOptions(DEFAULT_OPTIONS);
    setPhraseOpts(DEFAULT_PHRASE);
    setPassword('');
    setPhrase('');
    setPhraseBits(0);
    setBatch([]);
    setBatchCount(10);
    setTestPassword('');
  };

  return (
    // pt-36 en móvil: el header se apila en dos filas por debajo de `md` y mide
    // 133px, no los 96px de la barra de escritorio. Con pt-24 tapaba 37px.
    <div className="min-h-screen flex flex-col bg-[#020a08] text-slate-200 font-sans relative overflow-x-hidden pt-36 md:pt-28">
      <Header
        onReset={handleSoftReset} currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/entropy-bolt`)} t={t} />

      {/* El ancho máximo vive en <main>: AdRail mide ESTE elemento para decidir
          si los raíles laterales caben. Un <main> a w-full deja hueco cero y los
          raíles no se muestran nunca, en ninguna resolución. */}
      <main className="flex-grow w-full max-w-5xl mx-auto min-[1400px]:max-w-[min(64rem,calc(100vw-440px))] px-4 sm:px-6 py-8 relative z-10 flex flex-col gap-12 md:gap-16">
        <AdBanner id="adsense-entropy-bolt-top" />

        {/* --- héroe --- */}
        <section className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.heroBadge || 'Nothing leaves this tab'}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {t.seoHeroTitle || 'EntropyBolt'}
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">{t.seoHeroText}</p>
          </div>
          <HeroArt className="w-full h-auto max-w-md mx-auto" />
        </section>

        {/* --- selector de modo --- */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border border-white/10 bg-white/[0.02] self-start max-w-full">
          {([
            { id: 'chars', icon: <RefreshCw className="w-4 h-4" />, label: t.modeChars || 'Password' },
            { id: 'phrase', icon: <Type className="w-4 h-4" />, label: t.modePhrase || 'Passphrase' },
            { id: 'test', icon: <ShieldCheck className="w-4 h-4" />, label: t.modeTest || 'Test one' },
          ] as { id: Mode; icon: React.ReactNode; label: string }[]).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer border-none outline-none ${
                mode === m.id
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-transparent text-slate-400 hover:text-emerald-300'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* --- panel del resultado --- */}
        {mode !== 'test' && (
          <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-[#020a08] to-[#020a08] p-5 sm:p-8 space-y-5">
            <div className="text-[10px] tracking-[0.35em] uppercase text-emerald-400/50 font-bold">
              {mode === 'chars' ? t.generatedLabel || 'Generated password' : t.generatedPhraseLabel || 'Generated passphrase'}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <output className="flex-grow min-w-0 rounded-2xl bg-black/40 border border-white/10 px-4 sm:px-5 py-4 font-mono text-lg sm:text-xl md:text-2xl text-emerald-300 break-all min-h-[3.5rem] flex items-center tracking-wider">
                {noCharset && mode === 'chars' ? (
                  <span className="text-amber-300/80 text-sm font-sans tracking-normal">
                    {t.selectAtLeastOne || 'Select at least one character type'}
                  </span>
                ) : (
                  (mode === 'chars' ? password : phrase) || (
                    <span className="text-slate-600 text-sm font-sans tracking-normal">{t.generating || 'Generating…'}</span>
                  )
                )}
              </output>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copy(mode === 'chars' ? password : phrase, 'main')}
                  disabled={!hasValue}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-emerald-500/15 hover:border-emerald-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-sm font-bold text-slate-200 hover:text-emerald-300 outline-none"
                >
                  {copyFailed ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> {t.copyFailed || 'Copy failed'}
                    </>
                  ) : copied === 'main' ? (
                    <>
                      <Check className="w-4 h-4" /> {t.copied || 'Copied'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> {t.copy || 'Copy'}
                    </>
                  )}
                </button>
                <button
                  onClick={mode === 'chars' ? regenerate : regeneratePhrase}
                  disabled={mode === 'chars' ? noCharset : !words.length}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-sm font-bold text-emerald-300 outline-none"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t.regenerate || 'Regenerate'}
                </button>
              </div>
            </div>

            {copyFailed && (
              <p className="text-xs text-amber-300/80 leading-relaxed">
                {t.copyFailedHint || 'The browser refused clipboard access. Select the text and copy it manually.'}
              </p>
            )}
          </section>
        )}

        {/* --- ajustes de contraseña --- */}
        {mode === 'chars' && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-black tracking-[0.3em] uppercase text-emerald-400/70">{t.optionsLabel || 'Options'}</h3>
              <button
                onClick={resetOptions}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t.reset || 'Reset'}
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="pb-length" className="text-sm font-bold text-slate-200">
                  {t.length || 'Length'}
                </label>
                <span className="text-2xl font-black text-emerald-300 tabular-nums tracking-tight">{options.length}</span>
              </div>
              <input
                id="pb-length"
                type="range"
                min={MIN_LENGTH}
                max={MAX_LENGTH}
                value={options.length}
                // El valor se actualiza en vivo (la cifra de bits sube mientras
                // arrastras) pero la contraseña sólo se rehace al soltar, para
                // no generar decenas de contraseñas durante el gesto.
                onChange={e => setOptions(o => ({ ...o, length: Number(e.target.value) }))}
                onPointerUp={regenerate}
                onKeyUp={regenerate}
                onBlur={regenerate}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 outline-none"
                style={{ accentColor: '#34d399' }}
              />
              <div className="flex justify-between text-[10px] tracking-widest uppercase text-slate-600 font-bold">
                <span>{MIN_LENGTH}</span>
                <span>32</span>
                <span>64</span>
                <span>96</span>
                <span>{MAX_LENGTH}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classToggles.map(cb => {
                const checked = options[cb.key];
                // Si sólo queda una clase activa, no se puede apagar: dejaría
                // el alfabeto vacío y la herramienta sin nada que generar.
                const lastOne = checked && classToggles.filter(c => options[c.key]).length === 1;
                return (
                  <button
                    key={cb.key}
                    onClick={() => !lastOne && setOption(cb.key, !checked)}
                    disabled={lastOne}
                    aria-pressed={checked}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all outline-none ${
                      lastOne ? 'cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      checked
                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                    title={lastOne ? t.lastClassHint || 'At least one character type has to stay on' : undefined}
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

            <details
              open={showAdvanced}
              onToggle={e => setShowAdvanced((e.currentTarget as HTMLDetailsElement).open)}
              className="rounded-2xl border border-white/10 bg-black/20"
            >
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-bold text-slate-300 hover:text-emerald-300 select-none">
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                {t.advancedLabel || 'Advanced'}
              </summary>
              <div className="px-4 pb-4 space-y-3">
                {([
                  { key: 'requireEach' as const, label: t.requireEach || 'At least one of every selected type', hint: t.requireEachHint || 'Many sign-up forms demand it' },
                  { key: 'excludeSimilar' as const, label: t.excludeSimilar || 'Exclude look-alike characters', hint: 'i l 1 L o O 0 I B 8 |' },
                  { key: 'excludeAmbiguous' as const, label: t.excludeAmbiguous || 'Exclude shell-unsafe characters', hint: '{ } [ ] ( ) / \\ \' " ` ~ , ; : . < > |' },
                ]).map(row => (
                  <button
                    key={row.key}
                    onClick={() => setOption(row.key, !options[row.key])}
                    aria-pressed={options[row.key]}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.02] text-left transition-all cursor-pointer outline-none"
                  >
                    <span
                      className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        options[row.key] ? 'border-emerald-400 bg-emerald-500' : 'border-white/30'
                      }`}
                    >
                      {options[row.key] && <Check className="w-3.5 h-3.5 text-[#020a08]" strokeWidth={3} />}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-200">{row.label}</span>
                      <span className="text-[11px] text-slate-500 font-mono break-all">{row.hint}</span>
                    </span>
                  </button>
                ))}

                <div className="space-y-1.5">
                  <label htmlFor="pb-exclude" className="text-sm font-bold text-slate-200">
                    {t.excludeChars || 'Never use these characters'}
                  </label>
                  <input
                    id="pb-exclude"
                    type="text"
                    value={options.exclude}
                    onChange={e => setOption('exclude', e.target.value)}
                    placeholder={t.excludeCharsPlaceholder || 'e.g. $&<>'}
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 font-mono text-sm text-emerald-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <p className="text-[11px] text-slate-500">
                    {fill(t.charsetSize || 'Alphabet in use: {n} characters', { n: charset.length })}
                  </p>
                </div>
              </div>
            </details>

            {/* --- lote --- */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="text-xs font-black tracking-[0.2em] uppercase text-slate-400">{t.batchTitle || 'Generate a batch'}</h4>
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={batchCount}
                    onChange={e => setBatchCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                    aria-label={t.batchCount || 'How many'}
                    className="w-20 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-emerald-200 tabular-nums focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    onClick={makeBatch}
                    disabled={noCharset}
                    className="px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-sm font-bold text-emerald-300 transition-all cursor-pointer disabled:opacity-30 outline-none"
                  >
                    {t.batchGenerate || 'Generate'}
                  </button>
                </div>
              </div>

              {batch.length > 0 && (
                <>
                  <ul className="max-h-56 overflow-y-auto rounded-xl bg-black/40 border border-white/5 divide-y divide-white/5">
                    {batch.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 px-3 py-2">
                        <span className="font-mono text-sm text-emerald-200 break-all flex-grow min-w-0">{p}</span>
                        <button
                          onClick={() => copy(p, `b${i}`)}
                          aria-label={t.copy || 'Copy'}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-emerald-500/15 text-slate-400 hover:text-emerald-300 transition-all cursor-pointer outline-none"
                        >
                          {copied === `b${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copy(batch.join('\n'), 'all')}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-500/40 text-xs font-bold text-slate-300 hover:text-emerald-300 transition-all cursor-pointer outline-none"
                    >
                      {copied === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {t.batchCopyAll || 'Copy all'}
                    </button>
                    <button
                      onClick={downloadBatch}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-500/40 text-xs font-bold text-slate-300 hover:text-emerald-300 transition-all cursor-pointer outline-none"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.batchDownload || 'Download .txt'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* --- ajustes de frase --- */}
        {mode === 'phrase' && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-8 space-y-6">
            <h3 className="text-sm font-black tracking-[0.3em] uppercase text-emerald-400/70">{t.optionsLabel || 'Options'}</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="pb-words" className="text-sm font-bold text-slate-200">
                  {t.wordCount || 'Words'}
                </label>
                <span className="text-2xl font-black text-emerald-300 tabular-nums">{phraseOpts.words}</span>
              </div>
              <input
                id="pb-words"
                type="range"
                min={MIN_WORDS}
                max={MAX_WORDS}
                value={phraseOpts.words}
                onChange={e => setPhraseOption('words', Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 outline-none"
                style={{ accentColor: '#34d399' }}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-200">{t.separator || 'Separator'}</span>
              <div className="flex flex-wrap gap-2">
                {SEPARATORS.map(sep => (
                  <button
                    key={sep || 'none'}
                    onClick={() => setPhraseOption('separator', sep)}
                    aria-pressed={phraseOpts.separator === sep}
                    className={`px-4 py-2 rounded-xl border font-mono text-sm transition-all cursor-pointer outline-none ${
                      phraseOpts.separator === sep
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {sep === ' ' ? t.sepSpace || 'space' : sep === '' ? t.sepNone || 'none' : sep}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-200">{t.capitalisation || 'Capitalisation'}</span>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: 'lower' as Capitalisation, label: t.capLower || 'lower' },
                  { id: 'title' as Capitalisation, label: t.capTitle || 'Title' },
                  { id: 'upper' as Capitalisation, label: t.capUpper || 'UPPER' },
                ]).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setPhraseOption('capitalisation', c.id)}
                    aria-pressed={phraseOpts.capitalisation === c.id}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer outline-none ${
                      phraseOpts.capitalisation === c.id
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.capitalisationNote || 'Capitalisation is a fixed rule applied to every word, so it adds no entropy and is not counted.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: 'addNumber' as const, label: t.addNumber || 'Add a digit' },
                { key: 'addSymbol' as const, label: t.addSymbol || 'Add a symbol' },
              ]).map(row => (
                <button
                  key={row.key}
                  onClick={() => setPhraseOption(row.key, !phraseOpts[row.key])}
                  aria-pressed={phraseOpts[row.key]}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer outline-none ${
                    phraseOpts[row.key]
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      phraseOpts[row.key] ? 'border-emerald-400 bg-emerald-500' : 'border-white/30'
                    }`}
                  >
                    {phraseOpts[row.key] && <Check className="w-3.5 h-3.5 text-[#020a08]" strokeWidth={3} />}
                  </span>
                  <span className={`text-sm font-bold ${phraseOpts[row.key] ? 'text-emerald-300' : 'text-slate-300'}`}>{row.label}</span>
                </button>
              ))}
            </div>

            {words.length > 0 && (
              <p className="text-[11px] text-slate-500">
                {fill(t.wordlistNote || 'List of {n} words · {bits} bits per word', {
                  n: new Intl.NumberFormat(lang || 'en').format(words.length),
                  bits: Math.log2(words.length).toFixed(2),
                })}
              </p>
            )}
          </section>
        )}

        {/* --- probar una contraseña --- */}
        {mode === 'test' && (
          <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-[#020a08] to-[#020a08] p-5 sm:p-8 space-y-4">
            <div className="text-[10px] tracking-[0.35em] uppercase text-emerald-400/50 font-bold">
              {t.testLabel || 'Test a password'}
            </div>
            <div className="relative">
              <input
                type={showTest ? 'text' : 'password'}
                value={testPassword}
                onChange={e => setTestPassword(e.target.value)}
                placeholder={t.testPlaceholder || 'Type a password to measure it…'}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-5 py-4 pr-14 font-mono text-base sm:text-xl text-emerald-200 placeholder:text-slate-600 placeholder:font-sans placeholder:text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all tracking-wider"
              />
              <button
                onClick={() => setShowTest(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-500/40 hover:text-emerald-300 text-slate-400 transition-all cursor-pointer outline-none"
                aria-label={showTest ? t.hidePassword || 'Hide' : t.showPassword || 'Show'}
              >
                {showTest ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/50 shrink-0 mt-0.5" />
              {t.testHint || 'Typed here it stays here: no request is made, nothing is stored, and the field is never autofilled or saved.'}
            </p>

            {analysis.weaknesses.length > 0 && (
              <ul className="space-y-2 pt-1">
                {analysis.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-amber-100/90 leading-relaxed">
                      {t[w.key] ||
                        {
                          weakCommon: 'This appears in public breach lists',
                          weakSequence: 'It contains a run like abc or 1234',
                          weakRepeat: 'It repeats the same character in a row',
                          weakYear: 'It ends in a year',
                          weakCapitalised: 'Only the first letter is capitalised',
                        }[w.key]}
                      <span className="text-amber-400/70 font-mono text-xs ml-1.5">−{w.cost} {t.bitsShort || 'bits'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* --- medidor --- */}
        <section
          className={`rounded-3xl border bg-white/[0.02] p-5 sm:p-8 space-y-5 transition-all ${
            hasValue ? `border-white/10 ring-4 ${strength.ring}` : 'border-white/10'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-black tracking-[0.3em] uppercase text-emerald-400/70 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {t.strengthLabel || 'Strength'}
            </h3>
            <span className={`text-sm font-black tracking-wider uppercase ${hasValue ? strength.text : 'text-slate-600'}`}>
              {hasValue ? strengthLabel : t.noneLabel || '—'}
            </span>
          </div>

          <div className="relative h-3 rounded-full bg-black/40 border border-white/5 overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${strength.bar}`}
              style={{ width: `${hasValue ? meterPct : 0}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 font-bold mb-1">{t.lengthLabel || 'Length'}</div>
              <div className="text-2xl font-black text-white tabular-nums">{analysis.value.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 font-bold mb-1">{t.entropyLabel || 'Entropy'}</div>
              <div className="text-2xl font-black text-emerald-300 tabular-nums">
                {analysis.bits.toFixed(1)}
                <span className="text-sm text-slate-500 font-bold ml-1">{t.bitsShort || 'bits'}</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-1">
                {analysis.exact ? t.entropyExact || 'exact, from your settings' : t.entropyEstimated || 'estimated, patterns detected'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 font-bold mb-1">
                {t.charsetLabel || 'Alphabet'}
              </div>
              <div className="text-2xl font-black text-white tabular-nums">
                {mode === 'chars' ? charset.length : mode === 'phrase' ? words.length || '—' : '—'}
              </div>
              <div className="text-[10px] text-slate-600 mt-1">
                {mode === 'phrase' ? t.charsetWords || 'words in the list' : t.charsetChars || 'characters to choose from'}
              </div>
            </div>
          </div>

          {/* Cuatro escenarios en vez de una sola cifra: "10.000 millones por
              segundo" sólo describe un volcado con hash rápido, y presentarlo
              como EL tiempo de descifrado es engañoso en ambas direcciones. */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2.5">
            <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 font-bold">
              {t.crackTimeLabel || 'Time to crack'}
            </div>
            {scenarioRows.map(row => (
              <div key={row.id} className="flex items-baseline justify-between gap-4 flex-wrap">
                <span className="text-xs text-slate-400 leading-snug">{row.label}</span>
                <span className={`text-sm font-bold tabular-nums ${hasValue ? 'text-white' : 'text-slate-600'}`}>{row.text}</span>
              </div>
            ))}
          </div>
        </section>

        <AdBanner id="adsense-entropy-bolt-mid" />

        {/* --- cómo funciona --- */}
        <section className="space-y-6">
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">{t.howTitle || 'How it works'}</h3>
          <ol className="grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="shrink-0">{s.art}</div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-black text-emerald-400/60 tabular-nums">{i + 1}</span>
                    <h4 className="text-sm font-bold text-white">{s.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* --- características --- */}
        <section className="space-y-6">
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">{t.featuresTitle || 'What it actually does'}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2.5">
                <div className="w-11 h-11 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
                  {f.icon}
                </div>
                <h4 className="text-sm font-bold text-white">{f.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- FAQ --- */}
        {faq.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">{t.faqTitle || 'Frequently asked questions'}</h3>
            <div className="space-y-2.5">
              {faq.map((item, i) => (
                <details key={i} className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none text-sm font-bold text-slate-200 hover:text-emerald-300 transition-colors">
                    <ChevronDown className="w-4 h-4 shrink-0 text-emerald-400/60 transition-transform group-open:rotate-180" />
                    {item.question}
                  </summary>
                  <p className="px-5 pb-4 pl-12 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-entropy-bolt-bottom" />
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
