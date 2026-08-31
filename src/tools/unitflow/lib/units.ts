// ============================================================================
// Catálogo de unidades.
// ----------------------------------------------------------------------------
// Cada unidad guarda su factor hacia la unidad base de la categoría como una
// FRACCIÓN EXACTA, no como un `Number`. Un pie no es 0.3048 flotante: es
// 3048/10000. Así `toBase`/`fromBase` no introducen error y el redondeo sólo
// ocurre al escribir en pantalla (ver ./rational.ts).
//
// Tres formas de relación con la base:
//   · lineal   → base = v · num/den                (la mayoría)
//   · afín     → base = v · num/den + off          (temperaturas)
//   · inversa  → base = (num/den) / v              (consumo de combustible:
//                                                   más mpg es MENOS l/100 km)
//
// `approx: true` marca las unidades cuya definición no es exacta ni siquiera
// sobre el papel (radianes dependen de π, Mach de la temperatura del aire). Se
// señalan en la interfaz en vez de fingir que el resultado es exacto.
// ============================================================================

import { type Rational, rat, parseDecimal, mul, div, add, sub, INVALID, isValid } from './rational';

export type CategoryId =
  | 'length'
  | 'mass'
  | 'temperature'
  | 'speed'
  | 'volume'
  | 'area'
  | 'time'
  | 'angle'
  | 'data'
  | 'datarate'
  | 'pressure'
  | 'energy'
  | 'power'
  | 'force'
  | 'frequency'
  | 'fuel'
  | 'density'
  | 'typography';

export interface Unit {
  id: string;
  /** Símbolo internacional; no se traduce. */
  symbol: string;
  /** Nombre en inglés. La interfaz usa `t.u_<id>` y cae aquí si falta. */
  name: string;
  /** base = v · factor (+ offset), o base = factor / v cuando `inverse`. */
  factor: Rational;
  offset?: Rational;
  inverse?: boolean;
  /** La definición misma es aproximada (π, condiciones del aire…). */
  approx?: boolean;
  /** Términos extra para el buscador, además de nombre y símbolo. */
  aliases?: string[];
}

export interface Category {
  id: CategoryId;
  /** Nombre en inglés; la interfaz usa `t.cat_<id>`. */
  label: string;
  /** Unidad base de la categoría (para la cabecera de la tabla). */
  baseSymbol: string;
  units: Unit[];
  /** Pares por defecto al abrir la categoría. */
  defaults: [string, string];
  /** Descomposiciones legibles (5 ft 11 in, 1 h 30 min). */
  compounds?: Compound[];
}

export interface Compound {
  id: string;
  label: string;
  /** De mayor a menor. El último recibe el resto con decimales. */
  units: string[];
}

// ---------------------------------------------------------------------------
// Azúcar para declarar el catálogo sin que sea ilegible
// ---------------------------------------------------------------------------

/** Fracción exacta a partir de un decimal escrito ("0.3048") o de n/d. */
const F = (value: string | [bigint, bigint]): Rational =>
  typeof value === 'string' ? (parseDecimal(value) as Rational) : rat(value[0], value[1]);

const U = (
  id: string,
  symbol: string,
  name: string,
  factor: string | [bigint, bigint],
  extra: Partial<Omit<Unit, 'id' | 'symbol' | 'name' | 'factor'>> = {}
): Unit => ({ id, symbol, name, factor: F(factor), ...extra });

/**
 * π con 40 decimales. Es irracional, así que grados↔radianes NUNCA es exacto;
 * 40 dígitos dejan el error muy por debajo de cualquier precisión que la
 * interfaz pueda mostrar, y las unidades que lo usan van marcadas `approx`.
 */
const PI = F('3.1415926535897932384626433832795028841972');
const DEG_PER_RAD = div(F('180'), PI);

// Definiciones derivadas. Escribir su decimal a mano las convertiría en
// aproximaciones sin necesidad: una psi es exactamente una libra-fuerza por
// pulgada cuadrada, y ambas son fracciones exactas, así que la división también
// lo es. Sólo el caballo de vapor mecánico queda marcado como aproximado,
// porque su propia definición depende de la gravedad estándar.
const FOOT = F('0.3048');
const POUND = F('0.45359237');
const POUND_FORCE = F('4.4482216152605');
const SQUARE_INCH = F('0.00064516');
const BTU = F('1055.05585262');
const PSI = div(POUND_FORCE, SQUARE_INCH);
const HORSEPOWER = mul(F('550'), mul(FOOT, POUND_FORCE));
const BTU_PER_HOUR = div(BTU, F('3600'));
const POUND_PER_CUBIC_FOOT = div(POUND, F('0.028316846592'));
const POUND_PER_CUBIC_INCH = div(POUND, F('0.000016387064'));
const LITRES_PER_100KM_FROM_MPL = div(F('100'), F('1.609344'));

export const CATEGORIES: Category[] = [
  {
    id: 'length',
    label: 'Length',
    baseSymbol: 'm',
    defaults: ['meter', 'foot'],
    compounds: [{ id: 'ft_in', label: 'Feet + inches', units: ['foot', 'inch'] }],
    units: [
      U('kilometer', 'km', 'Kilometer', '1000'),
      U('meter', 'm', 'Meter', '1'),
      U('decimeter', 'dm', 'Decimeter', '0.1'),
      U('centimeter', 'cm', 'Centimeter', '0.01'),
      U('millimeter', 'mm', 'Millimeter', '0.001'),
      U('micrometer', 'µm', 'Micrometer', '0.000001', { aliases: ['micron', 'um'] }),
      U('nanometer', 'nm', 'Nanometer', '0.000000001'),
      U('mile', 'mi', 'Mile', '1609.344'),
      U('yard', 'yd', 'Yard', '0.9144'),
      U('foot', 'ft', 'Foot', '0.3048', { aliases: ['feet', "'"] }),
      U('inch', 'in', 'Inch', '0.0254', { aliases: ['inches', '"'] }),
      U('nautical_mile', 'nmi', 'Nautical mile', '1852'),
      U('astronomical_unit', 'au', 'Astronomical unit', '149597870700'),
      U('light_year', 'ly', 'Light year', '9460730472580800'),
    ],
  },
  {
    id: 'mass',
    label: 'Mass',
    baseSymbol: 'kg',
    defaults: ['kilogram', 'pound'],
    compounds: [{ id: 'lb_oz', label: 'Pounds + ounces', units: ['pound', 'ounce'] }],
    units: [
      U('tonne', 't', 'Tonne', '1000', { aliases: ['metric ton'] }),
      U('kilogram', 'kg', 'Kilogram', '1'),
      U('gram', 'g', 'Gram', '0.001'),
      U('milligram', 'mg', 'Milligram', '0.000001'),
      U('microgram', 'µg', 'Microgram', '0.000000001', { aliases: ['ug'] }),
      U('pound', 'lb', 'Pound', '0.45359237', { aliases: ['lbs'] }),
      U('ounce', 'oz', 'Ounce', '0.028349523125'),
      U('stone', 'st', 'Stone', '6.35029318'),
      U('short_ton', 'ton', 'Short ton (US)', '907.18474'),
      U('long_ton', 'LT', 'Long ton (UK)', '1016.0469088'),
      U('carat', 'ct', 'Carat', '0.0002'),
      U('grain', 'gr', 'Grain', '0.00006479891'),
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    baseSymbol: '°C',
    defaults: ['celsius', 'fahrenheit'],
    units: [
      U('celsius', '°C', 'Celsius', '1', { aliases: ['centigrade', 'C'] }),
      // °C = (°F − 32)·5/9 → factor 5/9 y desplazamiento −160/9 EXACTO. Escrito
      // como decimal (−17,777…) el cero absoluto dejaría de caer donde debe.
      U('fahrenheit', '°F', 'Fahrenheit', [5n, 9n], { offset: rat(-160n, 9n), aliases: ['F'] }),
      U('kelvin', 'K', 'Kelvin', '1', { offset: F('-273.15') }),
      U('rankine', '°R', 'Rankine', [5n, 9n], { offset: F('-273.15') }),
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    baseSymbol: 'm/s',
    defaults: ['kmh', 'mph'],
    units: [
      U('mps', 'm/s', 'Meter per second', '1'),
      U('kmh', 'km/h', 'Kilometer per hour', [5n, 18n], { aliases: ['kph'] }),
      U('mph', 'mph', 'Mile per hour', '0.44704'),
      U('fps', 'ft/s', 'Foot per second', '0.3048'),
      U('knot', 'kn', 'Knot', [463n, 900n], { aliases: ['kt', 'nautical'] }),
      U('mach', 'Ma', 'Mach (sea level)', '340.29', { approx: true }),
      U('lightspeed', 'c', 'Speed of light', '299792458'),
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    baseSymbol: 'L',
    defaults: ['liter', 'us_gallon'],
    units: [
      U('cubic_meter', 'm³', 'Cubic meter', '1000', { aliases: ['m3'] }),
      U('liter', 'L', 'Liter', '1', { aliases: ['litre'] }),
      U('milliliter', 'mL', 'Milliliter', '0.001', { aliases: ['cc', 'cm3', 'millilitre'] }),
      U('cubic_inch', 'in³', 'Cubic inch', '0.016387064', { aliases: ['in3'] }),
      U('cubic_foot', 'ft³', 'Cubic foot', '28.316846592', { aliases: ['ft3'] }),
      U('us_gallon', 'gal', 'US gallon', '3.785411784'),
      U('us_quart', 'qt', 'US quart', '0.946352946'),
      U('us_pint', 'pt', 'US pint', '0.473176473'),
      U('us_cup', 'cup', 'US cup', '0.2365882365'),
      U('us_fluid_ounce', 'fl oz', 'US fluid ounce', '0.0295735295625'),
      U('tablespoon', 'tbsp', 'Tablespoon (US)', '0.01478676478125'),
      U('teaspoon', 'tsp', 'Teaspoon (US)', '0.00492892159375'),
      U('imperial_gallon', 'imp gal', 'Imperial gallon', '4.54609'),
      U('imperial_pint', 'imp pt', 'Imperial pint', '0.56826125'),
      U('oil_barrel', 'bbl', 'Oil barrel', '158.987294928'),
    ],
  },
  {
    id: 'area',
    label: 'Area',
    baseSymbol: 'm²',
    defaults: ['square_meter', 'square_foot'],
    units: [
      U('square_kilometer', 'km²', 'Square kilometer', '1000000', { aliases: ['km2'] }),
      U('hectare', 'ha', 'Hectare', '10000'),
      U('are', 'a', 'Are', '100'),
      U('square_meter', 'm²', 'Square meter', '1', { aliases: ['m2', 'sqm'] }),
      U('square_centimeter', 'cm²', 'Square centimeter', '0.0001', { aliases: ['cm2'] }),
      U('square_millimeter', 'mm²', 'Square millimeter', '0.000001', { aliases: ['mm2'] }),
      U('square_mile', 'mi²', 'Square mile', '2589988.110336', { aliases: ['mi2'] }),
      U('acre', 'ac', 'Acre', '4046.8564224'),
      U('square_yard', 'yd²', 'Square yard', '0.83612736', { aliases: ['yd2'] }),
      U('square_foot', 'ft²', 'Square foot', '0.09290304', { aliases: ['ft2', 'sqft'] }),
      U('square_inch', 'in²', 'Square inch', '0.00064516', { aliases: ['in2'] }),
    ],
  },
  {
    id: 'time',
    label: 'Time',
    baseSymbol: 's',
    defaults: ['hour', 'minute'],
    compounds: [
      { id: 'hms', label: 'Hours + minutes + seconds', units: ['hour', 'minute', 'second'] },
      { id: 'dhms', label: 'Days + hours + minutes + seconds', units: ['day', 'hour', 'minute', 'second'] },
    ],
    units: [
      U('nanosecond', 'ns', 'Nanosecond', '0.000000001'),
      U('microsecond', 'µs', 'Microsecond', '0.000001', { aliases: ['us'] }),
      U('millisecond', 'ms', 'Millisecond', '0.001'),
      U('second', 's', 'Second', '1', { aliases: ['sec'] }),
      U('minute', 'min', 'Minute', '60'),
      U('hour', 'h', 'Hour', '3600', { aliases: ['hr'] }),
      U('day', 'd', 'Day', '86400'),
      U('week', 'wk', 'Week', '604800'),
      U('month', 'mo', 'Month (average)', '2629746', { approx: true }),
      U('year', 'yr', 'Year (average)', '31556952', { approx: true }),
      U('decade', 'dec', 'Decade', '315569520', { approx: true }),
    ],
  },
  {
    id: 'angle',
    label: 'Angle',
    baseSymbol: '°',
    defaults: ['degree', 'radian'],
    compounds: [{ id: 'dms', label: 'Degrees + minutes + seconds', units: ['degree', 'arcminute', 'arcsecond'] }],
    units: [
      U('degree', '°', 'Degree', '1', { aliases: ['deg'] }),
      { id: 'radian', symbol: 'rad', name: 'Radian', factor: DEG_PER_RAD, approx: true },
      { id: 'milliradian', symbol: 'mrad', name: 'Milliradian', factor: div(DEG_PER_RAD, F('1000')), approx: true },
      U('gradian', 'gon', 'Gradian', '0.9', { aliases: ['grad', 'gon'] }),
      U('turn', 'turn', 'Turn', '360', { aliases: ['revolution', 'rev'] }),
      U('arcminute', "'", 'Arcminute', [1n, 60n]),
      U('arcsecond', '"', 'Arcsecond', [1n, 3600n]),
    ],
  },
  {
    id: 'data',
    label: 'Data',
    baseSymbol: 'B',
    defaults: ['gigabyte', 'gibibyte'],
    units: [
      U('bit', 'bit', 'Bit', '0.125', { aliases: ['b'] }),
      U('byte', 'B', 'Byte', '1'),
      U('kilobyte', 'kB', 'Kilobyte (1000 B)', '1000', { aliases: ['KB'] }),
      U('megabyte', 'MB', 'Megabyte (1000 kB)', '1000000'),
      U('gigabyte', 'GB', 'Gigabyte (1000 MB)', '1000000000'),
      U('terabyte', 'TB', 'Terabyte (1000 GB)', '1000000000000'),
      U('petabyte', 'PB', 'Petabyte (1000 TB)', '1000000000000000'),
      U('kibibyte', 'KiB', 'Kibibyte (1024 B)', '1024'),
      U('mebibyte', 'MiB', 'Mebibyte (1024 KiB)', '1048576'),
      U('gibibyte', 'GiB', 'Gibibyte (1024 MiB)', '1073741824'),
      U('tebibyte', 'TiB', 'Tebibyte (1024 GiB)', '1099511627776'),
      U('pebibyte', 'PiB', 'Pebibyte (1024 TiB)', '1125899906842624'),
    ],
  },
  {
    id: 'datarate',
    label: 'Data rate',
    baseSymbol: 'bit/s',
    defaults: ['megabit_s', 'megabyte_s'],
    units: [
      U('bit_s', 'bit/s', 'Bit per second', '1', { aliases: ['bps'] }),
      U('kilobit_s', 'kbit/s', 'Kilobit per second', '1000', { aliases: ['kbps'] }),
      U('megabit_s', 'Mbit/s', 'Megabit per second', '1000000', { aliases: ['mbps'] }),
      U('gigabit_s', 'Gbit/s', 'Gigabit per second', '1000000000', { aliases: ['gbps'] }),
      U('byte_s', 'B/s', 'Byte per second', '8'),
      U('kilobyte_s', 'kB/s', 'Kilobyte per second', '8000'),
      U('megabyte_s', 'MB/s', 'Megabyte per second', '8000000'),
      U('mebibyte_s', 'MiB/s', 'Mebibyte per second', '8388608'),
    ],
  },
  {
    id: 'pressure',
    label: 'Pressure',
    baseSymbol: 'Pa',
    defaults: ['bar', 'psi'],
    units: [
      U('pascal', 'Pa', 'Pascal', '1'),
      U('hectopascal', 'hPa', 'Hectopascal', '100', { aliases: ['millibar', 'mbar'] }),
      U('kilopascal', 'kPa', 'Kilopascal', '1000'),
      U('megapascal', 'MPa', 'Megapascal', '1000000'),
      U('bar', 'bar', 'Bar', '100000'),
      U('atmosphere', 'atm', 'Atmosphere', '101325'),
      U('torr', 'Torr', 'Torr', [101325n, 760n], { aliases: ['mmhg'] }),
      U('mmhg', 'mmHg', 'Millimeter of mercury', '133.322387415'),
      U('inhg', 'inHg', 'Inch of mercury', '3386.388640341'),
      { id: 'psi', symbol: 'psi', name: 'Pound per square inch', factor: PSI },
    ],
  },
  {
    id: 'energy',
    label: 'Energy',
    baseSymbol: 'J',
    defaults: ['kilowatt_hour', 'megajoule'],
    units: [
      U('joule', 'J', 'Joule', '1'),
      U('kilojoule', 'kJ', 'Kilojoule', '1000'),
      U('megajoule', 'MJ', 'Megajoule', '1000000'),
      U('watt_hour', 'Wh', 'Watt hour', '3600'),
      U('kilowatt_hour', 'kWh', 'Kilowatt hour', '3600000'),
      U('calorie', 'cal', 'Calorie', '4.184'),
      U('kilocalorie', 'kcal', 'Kilocalorie (food calorie)', '4184', { aliases: ['Cal'] }),
      U('btu', 'BTU', 'British thermal unit', '1055.05585262'),
      U('electronvolt', 'eV', 'Electronvolt', '0.0000000000000000001602176634'),
      U('erg', 'erg', 'Erg', '0.0000001'),
    ],
  },
  {
    id: 'power',
    label: 'Power',
    baseSymbol: 'W',
    defaults: ['kilowatt', 'horsepower'],
    units: [
      U('watt', 'W', 'Watt', '1'),
      U('kilowatt', 'kW', 'Kilowatt', '1000'),
      U('megawatt', 'MW', 'Megawatt', '1000000'),
      { id: 'horsepower', symbol: 'hp', name: 'Horsepower (mechanical)', factor: HORSEPOWER },
      U('metric_horsepower', 'PS', 'Metric horsepower', '735.49875'),
      { id: 'btu_hour', symbol: 'BTU/h', name: 'BTU per hour', factor: BTU_PER_HOUR },
    ],
  },
  {
    id: 'force',
    label: 'Force',
    baseSymbol: 'N',
    defaults: ['newton', 'pound_force'],
    units: [
      U('newton', 'N', 'Newton', '1'),
      U('kilonewton', 'kN', 'Kilonewton', '1000'),
      U('dyne', 'dyn', 'Dyne', '0.00001'),
      U('kilogram_force', 'kgf', 'Kilogram-force', '9.80665'),
      U('pound_force', 'lbf', 'Pound-force', '4.4482216152605'),
      U('ounce_force', 'ozf', 'Ounce-force', '0.27801385095378125'),
    ],
  },
  {
    id: 'frequency',
    label: 'Frequency',
    baseSymbol: 'Hz',
    defaults: ['megahertz', 'gigahertz'],
    units: [
      U('hertz', 'Hz', 'Hertz', '1'),
      U('kilohertz', 'kHz', 'Kilohertz', '1000'),
      U('megahertz', 'MHz', 'Megahertz', '1000000'),
      U('gigahertz', 'GHz', 'Gigahertz', '1000000000'),
      U('rpm', 'rpm', 'Revolution per minute', [1n, 60n], { aliases: ['bpm'] }),
    ],
  },
  {
    id: 'fuel',
    label: 'Fuel economy',
    baseSymbol: 'L/100 km',
    defaults: ['mpg_us', 'l_100km'],
    units: [
      U('l_100km', 'L/100 km', 'Liters per 100 km', '1'),
      U('km_l', 'km/L', 'Kilometers per liter', '100', { inverse: true }),
      U('mpg_us', 'mpg', 'Miles per gallon (US)', [3785411784n, 16093440n], { inverse: true }),
      U('mpg_uk', 'mpg imp', 'Miles per gallon (imperial)', [454609000n, 1609344n], { inverse: true }),
      { id: 'mi_l', symbol: 'mi/L', name: 'Miles per liter', factor: LITRES_PER_100KM_FROM_MPL, inverse: true },
    ],
  },
  {
    id: 'density',
    label: 'Density',
    baseSymbol: 'kg/m³',
    defaults: ['g_cm3', 'kg_m3'],
    units: [
      U('kg_m3', 'kg/m³', 'Kilogram per cubic meter', '1'),
      U('g_cm3', 'g/cm³', 'Gram per cubic centimeter', '1000', { aliases: ['g/ml'] }),
      U('kg_l', 'kg/L', 'Kilogram per liter', '1000'),
      { id: 'lb_ft3', symbol: 'lb/ft³', name: 'Pound per cubic foot', factor: POUND_PER_CUBIC_FOOT },
      { id: 'lb_in3', symbol: 'lb/in³', name: 'Pound per cubic inch', factor: POUND_PER_CUBIC_INCH },
    ],
  },
  {
    id: 'typography',
    label: 'Typography',
    baseSymbol: 'px',
    defaults: ['pixel', 'point'],
    units: [
      U('pixel', 'px', 'Pixel (CSS, 96 dpi)', '1'),
      U('point', 'pt', 'Point', [4n, 3n]),
      U('pica', 'pc', 'Pica', '16'),
      U('typo_inch', 'in', 'Inch', '96'),
      U('typo_mm', 'mm', 'Millimeter', [480n, 127n]),
      U('typo_cm', 'cm', 'Centimeter', [4800n, 127n]),
      U('em', 'em', 'Em (16 px root)', '16'),
      U('rem', 'rem', 'Rem (16 px root)', '16'),
    ],
  },
];


export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c])
);

export const findUnit = (category: Category, id: string): Unit | undefined =>
  category.units.find(u => u.id === id);

// ---------------------------------------------------------------------------
// Conversión
// ---------------------------------------------------------------------------

/** Valor en la unidad base de la categoría. Exacto salvo unidades `approx`. */
export function toBase(unit: Unit, value: Rational): Rational {
  if (!unit || !isValid(value)) return INVALID;
  if (unit.inverse) return value.n === 0n ? INVALID : div(unit.factor, value);
  const scaled = mul(value, unit.factor);
  return unit.offset ? add(scaled, unit.offset) : scaled;
}

/** Vuelta desde la unidad base. */
export function fromBase(unit: Unit, base: Rational): Rational {
  if (!unit || !isValid(base)) return INVALID;
  if (unit.inverse) return base.n === 0n ? INVALID : div(unit.factor, base);
  const shifted = unit.offset ? sub(base, unit.offset) : base;
  return div(shifted, unit.factor);
}

export function convert(from: Unit, to: Unit, value: Rational): Rational {
  return fromBase(to, toBase(from, value));
}

/** True si el resultado arrastra una definición aproximada por algún lado. */
export const isApproximate = (from: Unit, to: Unit): boolean =>
  !!(from?.approx || to?.approx);

// ---------------------------------------------------------------------------
// Descomposición en unidades compuestas: 1.855 m → 6 ft 1.02 in
// ---------------------------------------------------------------------------

export interface CompoundPart {
  unit: Unit;
  /** Entero salvo en el último tramo, que se queda el resto. */
  value: Rational;
  last: boolean;
}

export function decompose(category: Category, compound: Compound, base: Rational): CompoundPart[] {
  if (!isValid(base)) return [];
  const units = compound.units
    .map(id => findUnit(category, id))
    .filter((u): u is Unit => !!u && !u.inverse && !u.offset);
  if (units.length === 0) return [];

  const negative = base.n < 0n;
  let rest: Rational = negative ? { n: -base.n, d: base.d } : base;
  const parts: CompoundPart[] = [];

  units.forEach((unit, i) => {
    const last = i === units.length - 1;
    const raw = div(rest, unit.factor);
    if (last) {
      parts.push({ unit, value: negative && parts.length === 0 ? { n: -raw.n, d: raw.d } : raw, last });
      return;
    }
    const whole = rat(raw.n / raw.d);
    rest = sub(rest, mul(whole, unit.factor));
    parts.push({ unit, value: negative && parts.length === 0 ? { n: -whole.n, d: whole.d } : whole, last });
  });

  return parts;
}

// ---------------------------------------------------------------------------
// Entrada en texto libre: "5'11\"", "2 ft 3 in", "1h 30min", "12 km"
// ---------------------------------------------------------------------------

/** Índice símbolo/alias → unidad, por categoría. Se construye una vez. */
const ALIAS_INDEX: Record<string, Map<string, Unit>> = {};

function aliasIndex(category: Category): Map<string, Unit> {
  const cached = ALIAS_INDEX[category.id];
  if (cached) return cached;
  const map = new Map<string, Unit>();
  const put = (key: string, unit: Unit) => {
    const k = key.trim().toLowerCase();
    if (k && !map.has(k)) map.set(k, unit);
  };
  for (const unit of category.units) {
    put(unit.symbol, unit);
    put(unit.name, unit);
    put(unit.id, unit);
    put(unit.id.replace(/_/g, ' '), unit);
    (unit.aliases || []).forEach(a => put(a, unit));
  }
  ALIAS_INDEX[category.id] = map;
  return map;
}

export interface ParsedInput {
  /** Valor en la unidad base de la categoría. */
  base: Rational;
  /** Unidad detectada en el texto, si el usuario escribió una. */
  detected?: Unit;
  /** True cuando el texto traía varios tramos ("5 ft 11 in"). */
  compound: boolean;
}

/**
 * Lee lo que el usuario haya escrito. Devuelve null si no hay nada
 * interpretable; el llamante decide si eso es un error o un campo a medias.
 *
 * `fallback` es la unidad del selector, que se usa para los tramos sin unidad
 * escrita ("12" en km, o el "11" de 5'11").
 */
export function parseQuantity(
  category: Category,
  text: string,
  fallback: Unit
): ParsedInput | null {
  const index = aliasIndex(category);
  const raw = text.trim().replace(/−/g, '-');
  if (!raw) return null;

  // Porcentaje: "50%" es la mitad de la unidad del selector. Se resuelve antes
  // de tokenizar porque el "%" no es ninguna unidad del catálogo y el
  // tokenizador lo rechazaría.
  if (/%$/.test(raw)) {
    const amount = parseDecimalOrFraction(raw.slice(0, -1).trim());
    if (!amount) return null;
    const base = toBase(fallback, div(amount, rat(100n)));
    return isValid(base) ? { base, detected: fallback, compound: false } : null;
  }

  // Notación de pies y pulgadas: 5'11", 5' 11.5", 5'
  const feetInches = /^([+-]?[\d.,]+)\s*'\s*(?:([\d.,]+)\s*"?)?$/.exec(raw);
  if (feetInches && category.id === 'length') {
    const ft = findUnit(category, 'foot');
    const inch = findUnit(category, 'inch');
    const a = parseDecimal(feetInches[1]);
    const b = feetInches[2] ? parseDecimal(feetInches[2]) : rat(0n);
    if (ft && inch && a && b) {
      const negative = a.n < 0n;
      const magnitude = add(mul(negative ? { n: -a.n, d: a.d } : a, ft.factor), mul(b, inch.factor));
      return {
        base: negative ? { n: -magnitude.n, d: magnitude.d } : magnitude,
        detected: ft,
        compound: !!feetInches[2],
      };
    }
  }

  // Tramos "número unidad" repetidos: "2 ft 3 in", "1h 30min", "12 km". Sin
  // unidad escrita se usa la del selector, que es el caso normal ("12").
  let consumed = 0;
  let total: Rational | null = null;
  let detected: Unit | undefined;
  let pieces = 0;

  TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(raw)) !== null) {
    consumed += match[0].length;
    const amount = parseDecimalOrFraction(`${match[1]}${match[2]}`);
    if (!amount) return null;
    const unitText = match[3].trim().toLowerCase();
    // Un segundo tramo sin unidad propia no es una suma ("1 2" no significa
    // nada), así que sólo el primero puede apoyarse en el selector.
    if (pieces > 0 && !unitText) return null;
    const unit = unitText ? index.get(unitText) : fallback;
    if (!unit) return null;
    if (!detected) detected = unit;
    const contribution = toBase(unit, amount);
    if (!isValid(contribution)) return null;
    total = total === null ? contribution : add(total, contribution);
    pieces++;
  }

  // Lo que el tokenizador no ha sabido leer ("12 xyz") invalida la entrada
  // entera: es mejor un error visible que convertir sólo la mitad del texto.
  if (total === null || consumed !== raw.length) return null;
  return { base: total, detected, compound: pieces > 1 };
}

/**
 * Un tramo = signo + número (decimal, fracción o mixto) + unidad opcional. La
 * unidad admite letras, barras y superíndices ("km/h", "m³") pero nunca
 * dígitos, para que "2 ft 3 in" se parta en dos tramos y no en uno raro.
 */
const TOKEN = /([+-]?)\s*(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|(?:\d+[.,]?\d*|[.,]\d+)(?:[eE][+-]?\d+)?)\s*([^\s\d+-]*)\s*/g;

function parseDecimalOrFraction(s: string): Rational | null {
  const mixed = /^([+-]?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s.trim());
  if (mixed) {
    if (mixed[4] === '0') return null;
    const value = add(rat(BigInt(mixed[2])), rat(BigInt(mixed[3]), BigInt(mixed[4])));
    return mixed[1] === '-' ? { n: -value.n, d: value.d } : value;
  }
  const simple = /^([+-]?\d+)\s*\/\s*(\d+)$/.exec(s.trim());
  if (simple) {
    if (simple[2] === '0') return null;
    return rat(BigInt(simple[1]), BigInt(simple[2]));
  }
  return parseDecimal(s);
}

/** Busca unidades por nombre traducido, nombre inglés, símbolo o alias. */
export function searchUnits(
  query: string,
  translate: (unit: Unit) => string
): { category: Category; unit: Unit }[] {
  const q = query.trim().toLowerCase();
  const out: { category: Category; unit: Unit; score: number }[] = [];
  for (const category of CATEGORIES) {
    for (const unit of category.units) {
      const haystack = [
        translate(unit).toLowerCase(),
        unit.name.toLowerCase(),
        unit.symbol.toLowerCase(),
        ...(unit.aliases || []).map(a => a.toLowerCase()),
      ];
      if (!q) {
        out.push({ category, unit, score: 0 });
        continue;
      }
      let score = -1;
      haystack.forEach((h, i) => {
        if (h === q) score = Math.max(score, 100 - i);
        else if (h.startsWith(q)) score = Math.max(score, 60 - i);
        else if (h.includes(q)) score = Math.max(score, 20 - i);
      });
      if (score >= 0) out.push({ category, unit, score });
    }
  }
  return out
    .sort((a, b) => b.score - a.score)
    .map(({ category, unit }) => ({ category, unit }));
}
