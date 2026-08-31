import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, Star } from 'lucide-react';
import { CATEGORIES, searchUnits, type Category, type Unit } from '../lib/units';

// ============================================================================
// Selector de unidad con buscador, y paleta global (Ctrl+K) que busca en las
// dieciocho categorías a la vez. Un <select> nativo no sirve aquí: con 156
// unidades hay que poder escribir "kn" y que salga el nudo.
// ============================================================================

interface PickerProps {
  category: Category;
  value: string;
  onChange: (unitId: string) => void;
  label: string;
  unitName: (unit: Unit) => string;
  isFavorite: (unitId: string) => boolean;
  onToggleFavorite: (unitId: string) => void;
  t: any;
  accent?: 'blue' | 'sky';
}

/** Cierra al hacer clic fuera y al pulsar Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

export const UnitPicker: React.FC<PickerProps> = ({
  category,
  value,
  onChange,
  label,
  unitName,
  isFavorite,
  onToggleFavorite,
  t,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const ref = useDismiss(open, () => setOpen(false));

  const selected = category.units.find(u => u.id === value);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = category.units.filter(unit => {
      if (!q) return true;
      return [unitName(unit), unit.name, unit.symbol, ...(unit.aliases || [])]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    // Los favoritos suben al principio, conservando el orden del catálogo.
    return [...matches.filter(u => isFavorite(u.id)), ...matches.filter(u => !isFavorite(u.id))];
  }, [category, query, unitName, isFavorite]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(Math.max(0, options.findIndex(u => u.id === value)));
      // El foco tiene que esperar a que el panel exista en el DOM.
      const id = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    if (active) (active as HTMLElement).scrollIntoView({ block: 'nearest' });
  }, [cursor, open]);

  const choose = (unit: Unit) => {
    onChange(unit.id);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(options.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(0, c - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[cursor]) choose(options[cursor]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="w-full flex items-center justify-between gap-3 bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 cursor-pointer outline-none focus-visible:border-blue-500/60 hover:border-blue-500/30 transition-colors text-left"
      >
        <span className="min-w-0 flex items-baseline gap-2">
          <span className="truncate">{selected ? unitName(selected) : '—'}</span>
          <span className="text-[11px] font-mono text-blue-400/70 shrink-0">{selected?.symbol}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-blue-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full min-w-[16rem] rounded-2xl border border-blue-500/20 bg-[#050e22] shadow-2xl shadow-black/60 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
            <Search className="w-4 h-4 text-blue-400/70 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={t.search_placeholder || 'Search units…'}
              spellCheck={false}
              className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-600"
            />
          </div>
          <div ref={listRef} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {options.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-slate-500">{t.search_empty || 'No unit matches that.'}</p>
            )}
            {options.map((unit, i) => (
              <div
                key={unit.id}
                data-active={i === cursor}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                  i === cursor ? 'bg-blue-500/15' : 'hover:bg-white/5'
                }`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose(unit)}
                role="option"
                aria-selected={unit.id === value}
              >
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleFavorite(unit.id);
                  }}
                  aria-label={t.tooltip_favorite || 'Pin this unit'}
                  className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-amber-300 transition-colors cursor-pointer outline-none"
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite(unit.id) ? 'fill-amber-300 text-amber-300' : ''}`} />
                </button>
                <span className="flex-1 min-w-0 truncate text-sm text-slate-200">{unitName(unit)}</span>
                <span className="shrink-0 text-[11px] font-mono text-blue-400/70">{unit.symbol}</span>
                {unit.id === value && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Paleta global: busca en las dieciocho categorías y salta a la que haga falta
// ---------------------------------------------------------------------------

interface PaletteProps {
  open: boolean;
  onClose: () => void;
  onPick: (category: Category, unit: Unit) => void;
  unitName: (unit: Unit) => string;
  categoryName: (category: Category) => string;
  t: any;
}

export const SearchPalette: React.FC<PaletteProps> = ({ open, onClose, onPick, unitName, categoryName, t }) => {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) {
      // Sin consulta se enseña una unidad representativa por categoría, para
      // que la paleta sirva también de índice.
      return CATEGORIES.map(category => ({
        category,
        unit: category.units.find(u => u.id === category.defaults[0]) || category.units[0],
      }));
    }
    return searchUnits(query, unitName).slice(0, 40);
  }, [query, unitName]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    const id = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(id);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    if (active) (active as HTMLElement).scrollIntoView({ block: 'nearest' });
  }, [cursor, open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(results.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(0, c - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = results[cursor];
      if (hit) onPick(hit.category, hit.unit);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-24"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-blue-500/25 bg-[#050e22] shadow-2xl shadow-black/70 overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t.search_title || 'Find a unit'}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <Search className="w-4 h-4 text-blue-400/70 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={t.search_placeholder || 'Search units…'}
            spellCheck={false}
            className="w-full bg-transparent border-none outline-none text-base text-white placeholder-slate-600"
          />
          <kbd className="shrink-0 text-[10px] font-mono text-slate-600 border border-white/10 rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-slate-500">{t.search_empty || 'No unit matches that.'}</p>
          )}
          {results.map(({ category, unit }, i) => (
            <button
              key={`${category.id}:${unit.id}`}
              data-active={i === cursor}
              onMouseEnter={() => setCursor(i)}
              onClick={() => onPick(category, unit)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer outline-none ${
                i === cursor ? 'bg-blue-500/15' : 'hover:bg-white/5'
              }`}
            >
              <span className="flex-1 min-w-0 truncate text-sm text-slate-200">{unitName(unit)}</span>
              <span className="shrink-0 text-[11px] font-mono text-blue-400/70">{unit.symbol}</span>
              <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-600">
                {categoryName(category)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
