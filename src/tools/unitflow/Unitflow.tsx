import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  Copy,
  Download,
  Loader2,
  Redo2,
  RotateCcw,
  Search,
  Sigma,
  Star,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import { NextStepBar } from './components/NextStepBar';
import { SearchPalette, UnitPicker } from './components/UnitPicker';
import {
  CATEGORY_ICONS,
  FEATURE_ICONS,
  STEP_ART,
  UnitHeroArt,
} from './components/Illustrations';
import {
  DEFAULT_FORMAT,
  exactLabel,
  format,
  isValid,
  type FormatOptions,
  type Rational,
} from './lib/rational';
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  decompose,
  findUnit,
  fromBase,
  isApproximate,
  parseQuantity,
  type Category,
  type Unit,
} from './lib/units';
import { fileName, toBlob, type ExportFormat, type ResultRow } from './lib/export';
import { useConverter } from './lib/useConverter';

interface UnitflowProps {
  lang: string;
  dictionary: any;
}

// Separadores por idioma. Se derivan del `lang` que viene del servidor y NO de
// Intl con el locale del navegador: la isla se hidrata con el mismo HTML que
// generó el build, y un separador distinto en cliente rompería la hidratación.
const SEPARATORS: Record<string, { group: string; decimal: string }> = {
  en: { group: ',', decimal: '.' },
  es: { group: '.', decimal: ',' },
  fr: { group: ' ', decimal: ',' },
  de: { group: '.', decimal: ',' },
  pt: { group: '.', decimal: ',' },
  ru: { group: ' ', decimal: ',' },
  hi: { group: ',', decimal: '.' },
  ja: { group: ',', decimal: '.' },
  zh: { group: ',', decimal: '.' },
};

const NOTATIONS: FormatOptions['notation'][] = [
  'auto',
  'fixed',
  'significant',
  'scientific',
  'engineering',
];

const panelClass =
  'rounded-3xl border border-blue-500/10 bg-slate-900/40 backdrop-blur-2xl shadow-2xl overflow-hidden';

interface BatchRow {
  source: string;
  value: Rational | null;
}

const MAX_BATCH_LINES = 2000;
/** Un CSV de números no llega ni de lejos a esto; por encima es otra cosa. */
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export default function Unitflow({ lang, dictionary }: UnitflowProps) {
  const t = dictionary || {};
  const separators = SEPARATORS[lang] || SEPARATORS.en;

  const { converter, fmt, setFmt } = useConverter({
    ...DEFAULT_FORMAT,
    decimal: separators.decimal,
  });
  const { snapshot } = converter;

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showExact, setShowExact] = useState(false);
  const [compoundId, setCompoundId] = useState<string | null>(null);
  // Se consulta tras montar y no durante el render: matchMedia no existe en el
  // servidor, y leerlo en el estado inicial rompería la hidratación de la isla.
  const [reducedMotion, setReducedMotion] = useState(false);

  const [batchText, setBatchText] = useState('');
  const [batchManual, setBatchManual] = useState(false);
  const [batchRun, setBatchRun] = useState<{ rows: BatchRow[]; errors: number } | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File; from?: string } | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Derivados
  // -------------------------------------------------------------------------

  const category: Category = CATEGORY_BY_ID[snapshot.category] || CATEGORIES[0];
  const fromUnit = findUnit(category, snapshot.from) || category.units[0];
  const toUnit = findUnit(category, snapshot.to) || category.units[1] || category.units[0];

  const unitName = useCallback((unit: Unit): string => (unit ? t[`u_${unit.id}`] || unit.name : ''), [t]);
  const categoryName = useCallback(
    (c: Category): string => t[`cat_${c.id}`] || c.label,
    [t]
  );

  /** El dato intermedio: la cantidad en la unidad base, como fracción exacta. */
  const parsed = useMemo(
    () => parseQuantity(category, snapshot.input, fromUnit),
    [category, snapshot.input, fromUnit]
  );

  // Cuando el intercambio dejó una fracción exacta guardada, ESA es la verdad:
  // el texto del campo ya está redondeado para poder mostrarse.
  const baseValue: Rational | null = snapshot.exact ?? (parsed ? parsed.base : null);
  const inputBlank = snapshot.input.trim() === '';
  const inputInvalid = !parsed && !snapshot.exact && !inputBlank;

  const outputValue = useMemo(
    () => (baseValue ? fromBase(toUnit, baseValue) : null),
    [baseValue, toUnit]
  );

  const approximate = isApproximate(fromUnit, toUnit);

  const activeCompound = useMemo(
    () => (category.compounds || []).find(c => c.id === compoundId) || null,
    [category, compoundId]
  );

  const compoundParts = useMemo(
    () => (activeCompound && baseValue ? decompose(category, activeCompound, baseValue) : []),
    [activeCompound, baseValue, category]
  );

  const tableRows = useMemo(() => {
    if (!baseValue) return [] as { unit: Unit; value: Rational }[];
    const rows = category.units.map(unit => ({ unit, value: fromBase(unit, baseValue) }));
    const pinned = rows.filter(r => converter.isFavorite(category.id, r.unit.id));
    const rest = rows.filter(r => !converter.isFavorite(category.id, r.unit.id));
    return [...pinned, ...rest];
  }, [baseValue, category, converter]);

  const displayFmt: FormatOptions = useMemo(
    () => ({ ...fmt, decimal: separators.decimal }),
    [fmt, separators.decimal]
  );

  const show = useCallback(
    (value: Rational | null): string => {
      if (!value || !isValid(value)) return '—';
      return showExact ? exactLabel(value) : format(value, displayFmt);
    },
    [displayFmt, showExact]
  );

  // -------------------------------------------------------------------------
  // Acciones
  // -------------------------------------------------------------------------

  const flash = useCallback((key: string) => {
    setCopiedKey(key);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedKey(null), 1800);
  }, []);

  // El temporizador del "copiado" se limpia al desmontar: sin esto, cambiar de
  // página dentro de los dos segundos deja un setState sobre un componente ya
  // desmontado.
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  const copyText = useCallback(
    async (key: string, text: string) => {
      if (!text || text === '—') return;
      try {
        await navigator.clipboard.writeText(text);
        flash(key);
      } catch {
        // Sin contexto seguro o sin permiso: se avisa en vez de fallar mudo,
        // que era lo que hacía la versión anterior.
        setError(t.error_clipboard || 'Your browser blocked the clipboard. Select the value and copy it by hand.');
      }
    },
    [flash, t.error_clipboard]
  );

  const changeCategory = useCallback(
    (id: string) => {
      const next = CATEGORY_BY_ID[id];
      if (!next) return;
      converter.commit({
        category: next.id,
        from: next.defaults[0],
        to: next.defaults[1],
      });
      setCompoundId(null);
      setBatchRun(null);
    },
    [converter]
  );

  /**
   * Intercambia unidades SIN pasar por el texto formateado. La versión anterior
   * escribía el resultado redondeado en el campo de entrada, así que ir y
   * volver diez veces degradaba el número; aquí se recalcula desde la fracción
   * exacta, y sólo se escribe cuando hace falta un texto nuevo.
   */
  const swap = useCallback(() => {
    if (!baseValue) {
      converter.commit({ from: snapshot.to, to: snapshot.from });
      return;
    }
    // La cantidad física no cambia al intercambiar: sólo cambia la unidad en la
    // que se escribe. El texto nuevo se redondea para que quepa, pero la
    // fracción exacta viaja aparte, así que volver a intercambiar devuelve el
    // número de partida en lugar de erosionarlo un dígito cada vez.
    const swapped = fromBase(toUnit, baseValue);
    converter.commit({
      from: snapshot.to,
      to: snapshot.from,
      input: isValid(swapped) ? format(swapped, { ...displayFmt, group: '', decimal: '.' }) : snapshot.input,
      exact: baseValue,
    });
  }, [baseValue, converter, displayFmt, snapshot.from, snapshot.to, toUnit]);

  const pickFromPalette = useCallback(
    (c: Category, unit: Unit) => {
      const other =
        c.id === category.id && snapshot.to !== unit.id
          ? snapshot.to
          : c.defaults[0] === unit.id
            ? c.defaults[1]
            : c.defaults[0];
      converter.commit({ category: c.id, from: unit.id, to: other });
      if (c.id !== category.id) setCompoundId(null);
      setPaletteOpen(false);
    },
    [category.id, converter, snapshot.to]
  );

  // -------------------------------------------------------------------------
  // Atajos de teclado
  // -------------------------------------------------------------------------

  useEffect(() => {
    const typing = (el: EventTarget | null): boolean => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || node.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Alt mantenido: enseña el valor EXACTO en vez del redondeado, en todas
      // las cifras a la vez. Es el "antes y después" de un conversor.
      if (e.key === 'Alt') setShowExact(true);

      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) converter.redo();
        else converter.undo();
        return;
      }
      if (meta) return;
      if (typing(e.target)) return;

      if (e.key === '/') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        swap();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setShowExact(false);
    };
    // Cambiar de ventana con Alt pulsado (Alt+Tab) no dispara keyup: sin esto
    // la herramienta se quedaría enseñando fracciones para siempre.
    const onBlur = () => setShowExact(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [converter, swap]);

  // -------------------------------------------------------------------------
  // Lote y archivos: subir NO convierte nada
  // -------------------------------------------------------------------------

  const acceptFile = useCallback(
    (file: File, from?: string) => {
      setError(null);
      if (file.size > MAX_FILE_BYTES) {
        setError(
          (t.error_too_big || 'That file is larger than {n} MB.').replace('{n}', String(MAX_FILE_BYTES / 1024 / 1024))
        );
        return;
      }
      // El archivo queda EN ESPERA. Nada se lee hasta que el usuario lo pide.
      setPendingFile({ file, from });
    },
    [t.error_too_big]
  );

  useHandoffIntake((file, from) => acceptFile(file, from));

  const readPending = useCallback(async () => {
    if (!pendingFile || reading) return;
    setReading(true);
    setError(null);
    try {
      const text = await pendingFile.file.text();
      const lines = text
        .split(/\r?\n/)
        .flatMap(line => line.split(/[;\t,](?=\s*[^\s])/))
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, MAX_BATCH_LINES);
      setBatchText(lines.join('\n'));
      setPendingFile(null);
    } catch {
      setError(t.error_read || 'That file could not be read as text.');
    } finally {
      setReading(false);
    }
  }, [pendingFile, reading, t.error_read]);

  const runBatch = useCallback(() => {
    const lines = batchText
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, MAX_BATCH_LINES);
    let errors = 0;
    const rows: BatchRow[] = lines.map(source => {
      // En modo manual se ignora cualquier unidad escrita en la línea y todo se
      // interpreta en la unidad del selector: es la vía para quien no quiere
      // que la herramienta adivine nada.
      const cleaned = batchManual ? source.replace(/[^\d+\-.,/\s]/g, '').trim() : source;
      const hit = parseQuantity(category, cleaned, fromUnit);
      if (!hit) {
        errors++;
        return { source, value: null };
      }
      return { source, value: fromBase(toUnit, hit.base) };
    });
    setBatchRun({ rows, errors });
  }, [batchManual, batchText, category, fromUnit, toUnit]);

  const exportRows: ResultRow[] = useMemo(() => {
    if (batchRun && batchRun.rows.length > 0) {
      return batchRun.rows
        .filter(row => row.value && isValid(row.value))
        .map(row => ({ source: row.source, unit: toUnit, value: row.value as Rational }));
    }
    if (!baseValue) return [];
    return category.units.map(unit => ({ unit, value: fromBase(unit, baseValue) }));
  }, [batchRun, baseValue, category, toUnit]);

  const buildResult = useCallback(
    async (kind: ExportFormat) => {
      if (exportRows.length === 0) return null;
      const blob = toBlob(exportRows, kind, {
        category,
        unitName,
        fmt: { ...displayFmt, group: '' },
      });
      return { blob, name: fileName(category, kind) };
    },
    [category, displayFmt, exportRows, unitName]
  );

  const download = useCallback(
    (kind: ExportFormat) => {
      if (exportRows.length === 0) return;
      const blob = toBlob(exportRows, kind, { category, unitName, fmt: { ...displayFmt, group: '' } });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName(category, kind);
      a.click();
      // Revocar en el mismo tick cancelaría la descarga en Safari; un respiro
      // corto basta y evita dejar el blob colgado en memoria.
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    },
    [category, displayFmt, exportRows, unitName]
  );

  const resetWorkspace = useCallback(() => {
    converter.reset();
    setCompoundId(null);
    setBatchText('');
    setBatchRun(null);
    setPendingFile(null);
    setError(null);
  }, [converter]);

  // -------------------------------------------------------------------------
  // Contenido editorial
  // -------------------------------------------------------------------------

  const steps = useMemo(() => {
    const fallback = [
      { title: 'Pick the magnitude', text: 'Eighteen families of units, from length to fuel economy.' },
      { title: 'Type the quantity', text: "Plain numbers, fractions, or compound values like 5'11\"." },
      { title: 'Tune the output', text: 'Significant digits, scientific notation, thousands separators.' },
      { title: 'Take it further', text: 'Send the whole table to another tool without downloading it.' },
    ];
    const source = Array.isArray(t.steps) && t.steps.length === 4 ? t.steps : fallback;
    return source.map((step: any, i: number) => ({ ...step, art: STEP_ART[i] }));
  }, [t.steps]);

  const features: { title: string; text: string }[] = Array.isArray(t.features) ? t.features : [];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const copyButton = (key: string, text: string, label?: string) => (
    <button
      onClick={() => copyText(key, text)}
      title={label || t.tooltip_copy || 'Copy'}
      aria-label={label || t.tooltip_copy || 'Copy'}
      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none shrink-0 ${
        copiedKey === key
          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
          : 'bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/40 text-slate-400 hover:text-blue-300'
      }`}
    >
      {copiedKey === key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  const panelHead = (icon: React.ReactNode, title: string, right?: React.ReactNode) => (
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-blue-500/10 bg-blue-500/[0.04]">
      <span className="text-blue-400">{icon}</span>
      <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300/90 flex-1 min-w-0 truncate">
        {title}
      </h2>
      {right}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#020610] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/unitflow`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* El max-w vive en el propio <main>: AdRail mide ESTE elemento para decidir
          si caben los raíles laterales, y un <main> a ancho completo deja hueco
          cero y los apaga en silencio en todas las resoluciones. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 pt-40 md:pt-32 pb-16 relative z-10 flex flex-col gap-8">
        <AdBanner id="adsense-unitflow-top" />

        {/* ---------------------------------------------------------------- */}
        {/* Héroe                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-4 min-w-0">
            <span className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-blue-950/40 border border-blue-800/40 text-blue-300 text-[10px] sm:text-[11px] font-black tracking-[0.18em] uppercase">
              <Sigma className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.badge || 'Exact unit converter'}</span>
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.seoHeroTitle || 'UnitFlow'}
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              {t.description || t.seoHeroText || 'Convert units without the rounding errors.'}
            </p>
            {Array.isArray(t.seoHeroList) && (
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                {t.seoHeroList.map((item: string) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-300/80 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1.5"
                  >
                    <Check className="w-3 h-3 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <UnitHeroArt
            className="w-full max-w-md mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
            animated={!reducedMotion}
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Categorías                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.label_categories || 'Categories'}>
          {CATEGORIES.map(c => {
            const Icon = CATEGORY_ICONS[c.id];
            const active = c.id === category.id;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                onClick={() => changeCategory(c.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold tracking-wide transition-all cursor-pointer outline-none ${
                  active
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-200 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-300'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span>{categoryName(c)}</span>
              </button>
            );
          })}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-white/10 text-xs font-bold text-slate-500 hover:text-blue-300 hover:border-blue-500/30 transition-all cursor-pointer outline-none"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>{t.search_title || 'Find a unit'}</span>
            <kbd className="hidden sm:inline text-[9px] font-mono border border-white/10 rounded px-1 py-0.5">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Conversor                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className={panelClass}>
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-3">
              {/* Entrada */}
              <div className="lg:flex-1 min-w-0 bg-slate-950/50 border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                    {t.label_input || 'Input'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 truncate">{fromUnit?.symbol}</span>
                </div>
                <input
                  type="text"
                  value={snapshot.input}
                  onChange={e => converter.draft({ input: e.target.value })}
                  onBlur={converter.seal}
                  onKeyDown={e => {
                    if (e.key === 'Enter') converter.seal();
                  }}
                  inputMode="decimal"
                  spellCheck={false}
                  placeholder={t.placeholder_input || "1  ·  3/4  ·  5'11\"  ·  2 ft 3 in"}
                  aria-label={t.label_input || 'Input'}
                  aria-invalid={inputInvalid}
                  className={`w-full bg-transparent border-none outline-none font-mono text-2xl md:text-3xl font-bold tracking-tight placeholder-slate-700 placeholder:text-base ${
                    inputInvalid ? 'text-red-400' : 'text-white'
                  }`}
                />
                <UnitPicker
                  category={category}
                  value={fromUnit?.id}
                  onChange={id => converter.commit({ from: id })}
                  label={t.label_input || 'Input'}
                  unitName={unitName}
                  isFavorite={id => converter.isFavorite(category.id, id)}
                  onToggleFavorite={id => converter.toggleFavorite(category.id, id)}
                  t={t}
                />
                {inputInvalid && (
                  <p className="text-[11px] font-bold text-red-300">
                    {t.error_invalid || 'That is not a quantity this category understands.'}
                  </p>
                )}
                {!inputInvalid && parsed?.detected && parsed.detected.id !== fromUnit?.id && (
                  <p className="text-[11px] text-blue-300/80">
                    {(t.detected_unit || 'Read as {unit} from what you typed.').replace(
                      '{unit}',
                      `${unitName(parsed.detected)} (${parsed.detected.symbol})`
                    )}
                  </p>
                )}
              </div>

              {/* Intercambio */}
              <div className="flex items-center justify-center">
                <button
                  onClick={swap}
                  title={`${t.tooltip_swap || 'Swap units'} · S`}
                  aria-label={t.tooltip_swap || 'Swap units'}
                  className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/60 hover:scale-105 active:scale-95 transition-all cursor-pointer outline-none flex items-center justify-center"
                >
                  <ArrowLeftRight className="w-4 h-4 rotate-90 lg:rotate-0" />
                </button>
              </div>

              {/* Salida */}
              <div className="lg:flex-1 min-w-0 bg-slate-950/50 border border-blue-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                    {t.label_output || 'Output'}
                  </span>
                  {copyButton('output', show(outputValue))}
                </div>
                <output
                  className={`block font-mono text-2xl md:text-3xl font-bold tracking-tight break-all min-h-[2.25rem] ${
                    showExact ? 'text-amber-200' : 'text-blue-300'
                  }`}
                >
                  {outputValue && isValid(outputValue) ? show(outputValue) : <span className="text-slate-700">—</span>}
                </output>
                <UnitPicker
                  category={category}
                  value={toUnit?.id}
                  onChange={id => converter.commit({ to: id })}
                  label={t.label_output || 'Output'}
                  unitName={unitName}
                  isFavorite={id => converter.isFavorite(category.id, id)}
                  onToggleFavorite={id => converter.toggleFavorite(category.id, id)}
                  t={t}
                />
                {compoundParts.length > 0 && (
                  <p className="text-sm font-mono text-blue-100/90 break-words">
                    {compoundParts
                      .map(part =>
                        `${format(part.value, { ...displayFmt, notation: part.last ? displayFmt.notation : 'auto' })} ${part.unit.symbol}`
                      )
                      .join(' ')}
                  </p>
                )}
              </div>
            </div>

            {approximate && (
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-200/80 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2.5">
                <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {t.approx_note ||
                    'One of these units is not exact by definition (π, an average year, air conditions), so this result is the closest value, not an identity.'}
                </span>
              </p>
            )}

            {error && (
              <p className="flex items-start gap-2 text-[11px] font-bold text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} aria-label={t.close || 'Close'} className="cursor-pointer outline-none">
                  <X className="w-3.5 h-3.5" />
                </button>
              </p>
            )}

            {/* Precisión */}
            <div className="flex flex-wrap items-end gap-3 md:gap-4 border-t border-white/5 pt-5">
              <label className="flex flex-col gap-1.5 min-w-[9rem]">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/70">
                  {t.label_notation || 'Notation'}
                </span>
                <select
                  value={fmt.notation}
                  onChange={e => setFmt({ ...fmt, notation: e.target.value as FormatOptions['notation'] })}
                  className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 cursor-pointer outline-none focus:border-blue-500/50"
                >
                  {NOTATIONS.map(n => (
                    <option key={n} value={n} className="bg-slate-950">
                      {t[`notation_${n}`] || n}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 flex-1 min-w-[11rem]">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/70">
                  {(fmt.notation === 'fixed' ? t.label_decimals || 'Decimals' : t.label_digits || 'Significant digits')}
                  <span className="ml-2 font-mono text-blue-300">{fmt.digits}</span>
                </span>
                <input
                  type="range"
                  min={fmt.notation === 'fixed' ? 0 : 1}
                  max={20}
                  step={1}
                  value={fmt.digits}
                  onChange={e => setFmt({ ...fmt, digits: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fmt.group !== ''}
                  onChange={e => setFmt({ ...fmt, group: e.target.checked ? separators.group : '' })}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
                {t.label_grouping || 'Thousands separator'}
              </label>

              {(category.compounds || []).length > 0 && (
                <label className="flex flex-col gap-1.5 min-w-[11rem]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/70">
                    {t.label_compound || 'Break it down'}
                  </span>
                  <select
                    value={compoundId ?? ''}
                    onChange={e => setCompoundId(e.target.value || null)}
                    className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 cursor-pointer outline-none focus:border-blue-500/50"
                  >
                    <option value="" className="bg-slate-950">
                      {t.compound_none || 'No'}
                    </option>
                    {(category.compounds || []).map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-950">
                        {t[`compound_${c.id}`] || c.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-between">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                {t.exact_hint || 'Hold Alt to swap every rounded figure for its exact value.'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={converter.undo}
                  disabled={!converter.canUndo}
                  title={`${t.tooltip_undo || 'Undo'} · Ctrl+Z`}
                  aria-label={t.tooltip_undo || 'Undo'}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-blue-300 hover:border-blue-500/30 transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={converter.redo}
                  disabled={!converter.canRedo}
                  title={`${t.tooltip_redo || 'Redo'} · Ctrl+Shift+Z`}
                  aria-label={t.tooltip_redo || 'Redo'}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-blue-300 hover:border-blue-500/30 transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={resetWorkspace}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-300 hover:text-blue-300 text-xs font-bold transition-all cursor-pointer outline-none"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t.button_reset || 'Reset'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Tabla                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className={panelClass}>
          {panelHead(
            <Sigma className="w-3.5 h-3.5" />,
            t.label_conversion_table || 'Every unit at once',
            <span className="text-[10px] font-mono text-slate-500 shrink-0">
              {baseValue ? `${show(baseValue)} ${category.baseSymbol}` : '—'}
            </span>
          )}
          <div className="p-5">
            {tableRows.length === 0 ? (
              <p className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 text-center text-xs text-slate-500">
                {t.message_invalid_number || 'Type a quantity to see every unit in this family.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tableRows.map(({ unit, value }) => {
                  const pinned = converter.isFavorite(category.id, unit.id);
                  const current = unit.id === fromUnit?.id;
                  const text = show(value);
                  return (
                    <div
                      key={unit.id}
                      className={`group rounded-2xl p-4 border transition-all ${
                        current ? 'bg-blue-500/10 border-blue-500/40' : 'bg-slate-950/40 border-white/5 hover:border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <button
                          onClick={() => converter.commit({ to: unit.id })}
                          className="min-w-0 text-left text-[10px] font-black uppercase tracking-widest text-blue-400/80 hover:text-blue-200 truncate cursor-pointer outline-none"
                          title={t.tooltip_use_unit || 'Use this unit as the output'}
                        >
                          {unitName(unit)}
                          {unit.approx && <span className="ml-1 text-amber-300/70">≈</span>}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-mono text-slate-500">{unit.symbol}</span>
                          <button
                            onClick={() => converter.toggleFavorite(category.id, unit.id)}
                            aria-label={t.tooltip_favorite || 'Pin this unit'}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-amber-300 transition-colors cursor-pointer outline-none"
                          >
                            <Star className={`w-3 h-3 ${pinned ? 'fill-amber-300 text-amber-300' : ''}`} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-mono text-sm font-bold break-all ${showExact ? 'text-amber-200' : 'text-white'}`}>
                          {text}
                        </span>
                        {copyButton(`row-${unit.id}`, text)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Lote                                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className={panelClass}>
          {panelHead(<Upload className="w-3.5 h-3.5" />, t.batch_title || 'A whole column at once')}
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              {t.batch_intro ||
                'Paste a column of values — or open a text file — and convert every line in one go. Nothing is read until you press the button.'}
            </p>

            {/* Archivo: queda en espera, no se lee solo */}
            {pendingFile ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-950/50 border border-blue-500/20 rounded-2xl p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-100 truncate">{pendingFile.file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {pendingFile.file.size < 1024
                      ? `${pendingFile.file.size} B`
                      : `${(pendingFile.file.size / 1024).toFixed(0)} KB`}{' '}
                    ·{' '}
                    {t.waiting || 'waiting — nothing has been read yet'}
                    {pendingFile.from ? ` · ${(t.fromTool || 'from {tool}').replace('{tool}', pendingFile.from)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={readPending}
                    disabled={reading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-blue-950 text-xs font-black hover:bg-blue-400 transition-all cursor-pointer outline-none disabled:opacity-50"
                  >
                    {reading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {t.readNumbers || 'Read its numbers'}
                  </button>
                  <button
                    onClick={() => setPendingFile(null)}
                    aria-label={t.removeFile || 'Remove the file'}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all cursor-pointer outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-black hover:bg-blue-500/25 transition-all cursor-pointer outline-none"
              >
                <Upload className="w-4 h-4" />
                {t.chooseFile || 'Open a .txt or .csv'}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.tsv,.log,.json,text/plain,text/csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) acceptFile(file);
                e.target.value = '';
              }}
            />

            <textarea
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              rows={6}
              spellCheck={false}
              placeholder={t.batch_placeholder || '1\n2.5\n3/4\n12 km'}
              aria-label={t.batch_title || 'Batch input'}
              className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-700 outline-none focus:border-blue-500/40 resize-y"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={runBatch}
                disabled={batchText.trim() === ''}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-blue-950 text-xs font-black hover:bg-blue-400 transition-all cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sigma className="w-4 h-4" />
                {t.batch_convert || 'Convert every line'}
              </button>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchManual}
                  onChange={e => setBatchManual(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
                {t.batch_manual || 'Ignore any unit written in the line'}
              </label>
              {batchRun && (
                <button
                  onClick={() => setBatchRun(null)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:text-red-300 transition-all cursor-pointer outline-none"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.batch_clear || 'Clear the results'}
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {t.batch_manual_hint ||
                'With that box ticked the tool reads only the numbers and applies the input unit you picked — no guessing.'}
            </p>

            {batchRun && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/70">
                    {((batchRun.rows.length - batchRun.errors === 1 && t.batch_results_one) || t.batch_results || '{n} lines converted').replace('{n}', String(batchRun.rows.length - batchRun.errors)
                    )}
                  </span>
                  {batchRun.errors > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/80">
                      {((batchRun.errors === 1 && t.batch_errors_one) || t.batch_errors || '{n} unreadable').replace('{n}', String(batchRun.errors))}
                    </span>
                  )}
                  <span className="h-px flex-1 min-w-[2rem] bg-white/5" />
                  {copyButton(
                    'batch',
                    batchRun.rows
                      .map(row => (row.value ? format(row.value, { ...displayFmt, group: '' }) : ''))
                      .join('\n')
                  )}
                  <button
                    onClick={() => download('csv')}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 text-[11px] font-bold hover:text-blue-300 hover:border-blue-500/30 transition-all cursor-pointer outline-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/5 bg-slate-950/40">
                  <table className="w-full text-sm">
                    <tbody>
                      {batchRun.rows.map((row, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-2 font-mono text-xs text-slate-500 w-1/2 break-all">{row.source}</td>
                          <td
                            className={`px-4 py-2 font-mono text-xs font-bold break-all ${
                              row.value ? 'text-blue-200' : 'text-red-400/80'
                            }`}
                          >
                            {row.value ? `${show(row.value)} ${toUnit?.symbol}` : t.batch_unreadable || 'unreadable'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <NextStepBar lang={lang} t={t} disabled={exportRows.length === 0} getResult={buildResult} />
          </div>
        </section>

        <AdBanner id="adsense-unitflow-mid" />

        {/* ---------------------------------------------------------------- */}
        {/* Cómo funciona                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white tracking-tight">{t.howItWorksTitle || 'How it works'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step: any, i: number) => {
              const Art = step.art;
              return (
                <div key={i} className="bg-blue-950/20 border border-blue-500/10 rounded-3xl p-5 space-y-3">
                  {Art && <Art className="w-full h-20" animated={!reducedMotion} />}
                  <div className="text-[10px] font-black text-blue-400/50 uppercase tracking-[0.2em]">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Características                                                    */}
        {/* ---------------------------------------------------------------- */}
        {features.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <div key={i} className="bg-blue-950/20 border border-blue-500/10 rounded-3xl p-5 space-y-3">
                  <span className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.text}</p>
                </div>
              );
            })}
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* FAQ                                                               */}
        {/* ---------------------------------------------------------------- */}
        {Array.isArray(t.faq) && t.faq.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {t.faqTitle || 'Frequently asked questions'}
            </h2>
            <div className="space-y-2">
              {t.faq.map((item: any, i: number) => (
                <details
                  key={i}
                  className="group bg-blue-950/20 border border-blue-500/10 rounded-2xl overflow-hidden open:border-blue-500/25"
                >
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-blue-300 transition-colors">
                    <span className="min-w-0">{item.question}</span>
                    <span className="shrink-0 text-blue-400/70 transition-transform group-open:rotate-45 text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-unitflow-bottom" />
      </main>

      <SearchPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onPick={pickFromPalette}
        unitName={unitName}
        categoryName={categoryName}
        t={t}
      />

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
