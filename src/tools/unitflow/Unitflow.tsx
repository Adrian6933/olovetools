import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import {
  Ruler,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  Weight,
  Thermometer,
  Gauge,
  Clock,
  Database,
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface UnitflowProps {
  lang: string;
  dictionary: any;
}

type CategoryId =
  | 'length'
  | 'weight'
  | 'temperature'
  | 'speed'
  | 'volume'
  | 'area'
  | 'time'
  | 'data';

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  factor?: number;
  toBase?: (v: number) => number;
  fromBase?: (v: number) => number;
}

interface CategoryDef {
  id: CategoryId;
  label: string;
  icon: React.ReactNode;
  units: UnitDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'length',
    label: 'Length',
    icon: <Ruler className="w-4 h-4" />,
    units: [
      { id: 'meter', name: 'Meter', symbol: 'm', factor: 1 },
      { id: 'kilometer', name: 'Kilometer', symbol: 'km', factor: 1000 },
      { id: 'centimeter', name: 'Centimeter', symbol: 'cm', factor: 0.01 },
      { id: 'millimeter', name: 'Millimeter', symbol: 'mm', factor: 0.001 },
      { id: 'micrometer', name: 'Micrometer', symbol: 'Âµm', factor: 1e-6 },
      { id: 'nanometer', name: 'Nanometer', symbol: 'nm', factor: 1e-9 },
      { id: 'mile', name: 'Mile', symbol: 'mi', factor: 1609.344 },
      { id: 'yard', name: 'Yard', symbol: 'yd', factor: 0.9144 },
      { id: 'foot', name: 'Foot', symbol: 'ft', factor: 0.3048 },
      { id: 'inch', name: 'Inch', symbol: 'in', factor: 0.0254 },
      { id: 'nautical_mile', name: 'Nautical Mile', symbol: 'nmi', factor: 1852 },
      { id: 'light_year', name: 'Light Year', symbol: 'ly', factor: 9.4607304725808e15 },
    ],
  },
  {
    id: 'weight',
    label: 'Weight',
    icon: <Weight className="w-4 h-4" />,
    units: [
      { id: 'kilogram', name: 'Kilogram', symbol: 'kg', factor: 1 },
      { id: 'gram', name: 'Gram', symbol: 'g', factor: 0.001 },
      { id: 'milligram', name: 'Milligram', symbol: 'mg', factor: 1e-6 },
      { id: 'microgram', name: 'Microgram', symbol: 'Âµg', factor: 1e-9 },
      { id: 'metric_ton', name: 'Metric Ton', symbol: 't', factor: 1000 },
      { id: 'pound', name: 'Pound', symbol: 'lb', factor: 0.45359237 },
      { id: 'ounce', name: 'Ounce', symbol: 'oz', factor: 0.028349523125 },
      { id: 'stone', name: 'Stone', symbol: 'st', factor: 6.35029318 },
      { id: 'us_ton', name: 'US Ton', symbol: 'ton', factor: 907.18474 },
      { id: 'carat', name: 'Carat', symbol: 'ct', factor: 0.0002 },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    icon: <Thermometer className="w-4 h-4" />,
    units: [
      {
        id: 'celsius',
        name: 'Celsius',
        symbol: 'Â°C',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: 'fahrenheit',
        name: 'Fahrenheit',
        symbol: 'Â°F',
        toBase: (v) => (v - 32) * (5 / 9),
        fromBase: (v) => v * (9 / 5) + 32,
      },
      {
        id: 'kelvin',
        name: 'Kelvin',
        symbol: 'K',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
      {
        id: 'rankine',
        name: 'Rankine',
        symbol: 'Â°R',
        toBase: (v) => (v - 491.67) * (5 / 9),
        fromBase: (v) => v * (9 / 5) + 491.67,
      },
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    icon: <Gauge className="w-4 h-4" />,
    units: [
      { id: 'mps', name: 'Meter / second', symbol: 'm/s', factor: 1 },
      { id: 'kmh', name: 'Kilometer / hour', symbol: 'km/h', factor: 1 / 3.6 },
      { id: 'mph', name: 'Mile / hour', symbol: 'mph', factor: 0.44704 },
      { id: 'fts', name: 'Foot / second', symbol: 'ft/s', factor: 0.3048 },
      { id: 'knot', name: 'Knot', symbol: 'kn', factor: 0.514444444444 },
      { id: 'mach', name: 'Mach (sea level)', symbol: 'Ma', factor: 343 },
      { id: 'lightspeed', name: 'Speed of light', symbol: 'c', factor: 299792458 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    icon: <Ruler className="w-4 h-4" />,
    units: [
      { id: 'liter', name: 'Liter', symbol: 'L', factor: 1 },
      { id: 'milliliter', name: 'Milliliter', symbol: 'mL', factor: 0.001 },
      { id: 'cubic_meter', name: 'Cubic meter', symbol: 'mÂ³', factor: 1000 },
      { id: 'cubic_centimeter', name: 'Cubic centimeter', symbol: 'cmÂ³', factor: 0.001 },
      { id: 'cubic_inch', name: 'Cubic inch', symbol: 'inÂ³', factor: 0.016387064 },
      { id: 'cubic_foot', name: 'Cubic foot', symbol: 'ftÂ³', factor: 28.316846592 },
      { id: 'us_gallon', name: 'US Gallon', symbol: 'gal', factor: 3.785411784 },
      { id: 'us_quart', name: 'US Quart', symbol: 'qt', factor: 0.946352946 },
      { id: 'us_pint', name: 'US Pint', symbol: 'pt', factor: 0.473176473 },
      { id: 'us_cup', name: 'US Cup', symbol: 'cup', factor: 0.2365882365 },
      { id: 'us_fluid_ounce', name: 'US Fluid Ounce', symbol: 'fl oz', factor: 0.0295735295625 },
      { id: 'imperial_gallon', name: 'Imperial Gallon', symbol: 'imp gal', factor: 4.54609 },
      { id: 'tablespoon', name: 'Tablespoon', symbol: 'tbsp', factor: 0.01478676478125 },
      { id: 'teaspoon', name: 'Teaspoon', symbol: 'tsp', factor: 0.00492892159375 },
    ],
  },
  {
    id: 'area',
    label: 'Area',
    icon: <Ruler className="w-4 h-4" />,
    units: [
      { id: 'square_meter', name: 'Square meter', symbol: 'mÂ²', factor: 1 },
      { id: 'square_kilometer', name: 'Square kilometer', symbol: 'kmÂ²', factor: 1e6 },
      { id: 'square_centimeter', name: 'Square centimeter', symbol: 'cmÂ²', factor: 1e-4 },
      { id: 'square_millimeter', name: 'Square millimeter', symbol: 'mmÂ²', factor: 1e-6 },
      { id: 'hectare', name: 'Hectare', symbol: 'ha', factor: 1e4 },
      { id: 'acre', name: 'Acre', symbol: 'ac', factor: 4046.8564224 },
      { id: 'square_mile', name: 'Square mile', symbol: 'miÂ²', factor: 2589988.110336 },
      { id: 'square_yard', name: 'Square yard', symbol: 'ydÂ²', factor: 0.83612736 },
      { id: 'square_foot', name: 'Square foot', symbol: 'ftÂ²', factor: 0.09290304 },
      { id: 'square_inch', name: 'Square inch', symbol: 'inÂ²', factor: 0.00064516 },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    icon: <Clock className="w-4 h-4" />,
    units: [
      { id: 'second', name: 'Second', symbol: 's', factor: 1 },
      { id: 'millisecond', name: 'Millisecond', symbol: 'ms', factor: 0.001 },
      { id: 'microsecond', name: 'Microsecond', symbol: 'Âµs', factor: 1e-6 },
      { id: 'nanosecond', name: 'Nanosecond', symbol: 'ns', factor: 1e-9 },
      { id: 'minute', name: 'Minute', symbol: 'min', factor: 60 },
      { id: 'hour', name: 'Hour', symbol: 'h', factor: 3600 },
      { id: 'day', name: 'Day', symbol: 'd', factor: 86400 },
      { id: 'week', name: 'Week', symbol: 'wk', factor: 604800 },
      { id: 'month', name: 'Month (avg)', symbol: 'mo', factor: 2629746 },
      { id: 'year', name: 'Year (avg)', symbol: 'yr', factor: 31556952 },
      { id: 'decade', name: 'Decade', symbol: 'dec', factor: 315569520 },
      { id: 'century', name: 'Century', symbol: 'c', factor: 3155695200 },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: <Database className="w-4 h-4" />,
    units: [
      { id: 'bit', name: 'Bit', symbol: 'b', factor: 0.125 },
      { id: 'byte', name: 'Byte', symbol: 'B', factor: 1 },
      { id: 'kilobit', name: 'Kilobit', symbol: 'kb', factor: 125 },
      { id: 'kilobyte', name: 'Kilobyte (KB)', symbol: 'KB', factor: 1000 },
      { id: 'megabyte', name: 'Megabyte (MB)', symbol: 'MB', factor: 1e6 },
      { id: 'gigabyte', name: 'Gigabyte (GB)', symbol: 'GB', factor: 1e9 },
      { id: 'terabyte', name: 'Terabyte (TB)', symbol: 'TB', factor: 1e12 },
      { id: 'petabyte', name: 'Petabyte (PB)', symbol: 'PB', factor: 1e15 },
      { id: 'kibibyte', name: 'Kibibyte (KiB)', symbol: 'KiB', factor: 1024 },
      { id: 'mebibyte', name: 'Mebibyte (MiB)', symbol: 'MiB', factor: 1048576 },
      { id: 'gibibyte', name: 'Gibibyte (GiB)', symbol: 'GiB', factor: 1073741824 },
      { id: 'tebibyte', name: 'Tebibyte (TiB)', symbol: 'TiB', factor: 1099511627776 },
    ],
  },
];

const toBaseValue = (unit: UnitDef, v: number): number => {
  if (unit.toBase) return unit.toBase(v);
  return v * (unit.factor ?? 1);
};

const fromBaseValue = (unit: UnitDef, v: number): number => {
  if (unit.fromBase) return unit.fromBase(v);
  return v / (unit.factor ?? 1);
};

const formatNumber = (n: number): string => {
  if (!isFinite(n)) return 'â€”';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-7) {
    const exp = n.toExponential(6);
    return exp.replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e');
  }
  return parseFloat(n.toPrecision(10)).toString();
};

const DEFAULT_CATEGORY: CategoryId = 'length';
const DEFAULT_INPUT_UNIT = 'meter';
const DEFAULT_OUTPUT_UNIT = 'kilometer';
const DEFAULT_INPUT_VALUE = '1';

export default function Unitflow({ lang, dictionary }: UnitflowProps) {
  const t = dictionary || {};
  const [category, setCategory] = useState<CategoryId>(DEFAULT_CATEGORY);
  const [inputValue, setInputValue] = useState<string>(DEFAULT_INPUT_VALUE);
  const [inputUnit, setInputUnit] = useState<string>(DEFAULT_INPUT_UNIT);
  const [outputUnit, setOutputUnit] = useState<string>(DEFAULT_OUTPUT_UNIT);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === category) as CategoryDef,
    [category],
  );

  const findUnit = (id: string): UnitDef | undefined =>
    activeCategory.units.find((u) => u.id === id);

  const numericInput = useMemo(() => {
    const parsed = parseFloat(inputValue);
    return isFinite(parsed) ? parsed : NaN;
  }, [inputValue]);

  const outputValue = useMemo(() => {
    if (!isFinite(numericInput)) return NaN;
    const inUnit = findUnit(inputUnit);
    const outUnit = findUnit(outputUnit);
    if (!inUnit || !outUnit) return NaN;
    const base = toBaseValue(inUnit, numericInput);
    return fromBaseValue(outUnit, base);
  }, [numericInput, inputUnit, outputUnit, activeCategory]);

  const tableRows = useMemo(() => {
    if (!isFinite(numericInput)) return [] as { unit: UnitDef; value: number }[];
    const inUnit = findUnit(inputUnit);
    if (!inUnit) return [] as { unit: UnitDef; value: number }[];
    const base = toBaseValue(inUnit, numericInput);
    return activeCategory.units.map((u) => ({
      unit: u,
      value: fromBaseValue(u, base),
    }));
  }, [numericInput, inputUnit, activeCategory]);

  const handleCategoryChange = useCallback((id: CategoryId) => {
    const cat = CATEGORIES.find((c) => c.id === id) as CategoryDef;
    setCategory(id);
    setInputUnit(cat.units[0].id);
    setOutputUnit(cat.units[1 < cat.units.length ? 1 : 0].id);
    setCopiedKey(null);
  }, []);

  const handleSwap = useCallback(() => {
    setInputUnit(outputUnit);
    setOutputUnit(inputUnit);
    if (isFinite(outputValue)) {
      setInputValue(formatNumber(outputValue));
    }
  }, [outputUnit, inputUnit, outputValue]);

  const copyValue = useCallback((key: string, value: number) => {
    if (!isFinite(value)) return;
    navigator.clipboard.writeText(formatNumber(value));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const resetWorkspace = useCallback(() => {
    setCategory(DEFAULT_CATEGORY);
    setInputValue(DEFAULT_INPUT_VALUE);
    setInputUnit(DEFAULT_INPUT_UNIT);
    setOutputUnit(DEFAULT_OUTPUT_UNIT);
    setCopiedKey(null);
  }, []);

  const tabLabel = (id: CategoryId, fallback: string): string => {
    const key = `cat_${id}`;
    return (t as any)[key] || fallback;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020610] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/unitflow`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-unitflow-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Ruler className="w-8 h-8 text-blue-400" />
            <span>{t.seoHeroTitle || 'UnitFlow'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText ||
              'Convert units of measurement: length, weight, temperature, speed, volume and more 100% locally.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3">
          {CATEGORIES.map((cat) => {
            const active = cat.id === category;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl border text-xs md:text-sm font-bold tracking-wide transition-all cursor-pointer outline-none ${
                  active
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400'
                }`}
              >
                {cat.icon}
                <span>{tabLabel(cat.id, cat.label)}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-3">
            <div className="flex-1 bg-slate-950/50 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                  {t.label_input || 'Input'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {findUnit(inputUnit)?.symbol}
                </span>
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                inputMode="decimal"
                spellCheck={false}
                placeholder="0"
                className={`w-full bg-transparent border-none outline-none font-mono text-3xl md:text-4xl font-bold tracking-tight text-white placeholder-slate-700 text-left ${
                  !isFinite(numericInput) && inputValue.trim() !== '' ? 'text-red-400' : ''
                }`}
              />
              <div className="relative">
                <select
                  value={inputUnit}
                  onChange={(e) => setInputUnit(e.target.value)}
                  className="w-full appearance-none bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-slate-200 cursor-pointer outline-none focus:border-blue-500/50 hover:border-blue-500/30 transition-colors"
                >
                  {activeCategory.units.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-950 text-slate-200">
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={handleSwap}
                title={t.tooltip_swap || 'Swap units'}
                className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/60 hover:scale-105 active:scale-95 transition-all cursor-pointer outline-none flex items-center justify-center"
              >
                <div className="flex flex-col md:flex-row items-center md:-space-x-2">
                  <ArrowRight className="w-4 h-4 md:rotate-0 rotate-90" />
                  <ArrowLeft className="w-4 h-4 md:rotate-0 rotate-90 -mt-2 md:mt-0" />
                </div>
              </button>
            </div>

            <div className="flex-1 bg-slate-950/50 border border-blue-500/20 rounded-2xl p-5 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                  {t.label_output || 'Output'}
                </span>
                <button
                  onClick={() => copyValue('output', outputValue)}
                  disabled={!isFinite(outputValue)}
                  title={t.tooltip_copy || 'Copy'}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
                    copiedKey === 'output'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/40 text-slate-400 hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {copiedKey === 'output' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="font-mono text-3xl md:text-4xl font-bold tracking-tight text-blue-300 text-left min-h-[2.5rem] break-all">
                {isFinite(outputValue) ? formatNumber(outputValue) : <span className="text-slate-700">â€”</span>}
              </div>
              <div className="relative">
                <select
                  value={outputUnit}
                  onChange={(e) => setOutputUnit(e.target.value)}
                  className="w-full appearance-none bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-slate-200 cursor-pointer outline-none focus:border-blue-500/50 hover:border-blue-500/30 transition-colors"
                >
                  {activeCategory.units.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-950 text-slate-200">
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-5 flex justify-end">
            <button
              onClick={resetWorkspace}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-300 hover:text-blue-400 text-xs font-bold transition-all cursor-pointer outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              {t.button_reset || 'Reset'}
            </button>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">
                {t.label_conversion_table || 'Conversion Table'}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {isFinite(numericInput) ? `${formatNumber(numericInput)} ${findUnit(inputUnit)?.symbol || ''}` : 'â€”'}
            </span>
          </div>

          {tableRows.length === 0 ? (
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 text-center text-xs text-slate-500">
              {t.message_invalid_number || 'Enter a valid number to see all conversions.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tableRows.map(({ unit, value }) => {
                const isInput = unit.id === inputUnit;
                const copied = copiedKey === unit.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => copyValue(unit.id, value)}
                    className={`group text-left rounded-2xl p-4 border transition-all cursor-pointer outline-none ${
                      isInput
                        ? 'bg-blue-500/10 border-blue-500/40'
                        : 'bg-slate-950/40 border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                        {unit.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{unit.symbol}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm md:text-base font-bold text-white break-all">
                        {formatNumber(value)}
                      </span>
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-unitflow-bottom" />
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
