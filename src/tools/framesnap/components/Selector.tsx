// ============================================================================
// Desplegable propio, en lugar de <select>.
// ----------------------------------------------------------------------------
// La lista de un <select> nativo no la dibuja la página: la dibuja el sistema
// operativo, con sus colores. Sobre un fondo oscuro sale un rectángulo blanco
// que no se parece a nada del resto de la herramienta, y ni `background` ni
// `color` sobre <option> se respetan igual en Windows, macOS y Linux.
//
// Esto es un botón y una lista normales, así que se ven igual en todas partes
// y —lo que importa aquí— también dentro de pantalla completa, donde el menú
// nativo se dibujaría fuera del elemento que está en pantalla completa.
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectorOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectorProps<T extends string | number> {
  value: T;
  options: SelectorOption<T>[];
  onChange: (value: T) => void;
  /** Para lectores de pantalla; el botón sólo enseña la etiqueta elegida. */
  label: string;
  title?: string;
  /** Abre hacia arriba, para las barras pegadas al borde de abajo. */
  up?: boolean;
  /** Alinea la lista por la derecha, para lo que vive en el borde derecho. */
  alignRight?: boolean;
  className?: string;
}

export function Selector<T extends string | number>({
  value,
  options,
  onChange,
  label,
  title,
  up = false,
  alignRight = false,
  className = '',
}: SelectorProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const index = Math.max(0, options.findIndex(option => option.value === value));
  const current = options[index];

  useEffect(() => {
    if (!open) return;
    setActive(index);
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    // `capture`: dentro de la barra de pantalla completa hay botones que paran
    // la propagación, y sin capturar antes el desplegable se quedaba abierto.
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, index]);

  const commit = (option: SelectorOption<T>) => {
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(a => Math.min(options.length - 1, a + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(a => Math.max(0, a - 1));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (options[active]) commit(options[active]);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        title={title}
        className={`flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold outline-none transition-colors ${
          open
            ? 'border-orange-500/50 bg-orange-500/10 text-orange-100'
            : 'border-white/10 bg-white/5 text-slate-300 hover:border-orange-500/30 hover:text-orange-100'
        }`}
      >
        <span className="truncate">{current?.label ?? ''}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className={`absolute z-50 min-w-full max-w-[16rem] overflow-hidden rounded-xl border border-white/10 bg-[#140b04] shadow-[0_20px_50px_rgba(0,0,0,0.75)] ${
            up ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${alignRight ? 'right-0' : 'left-0'}`}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((option, i) => {
              const selected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => commit(option)}
                  className={`flex w-full cursor-pointer items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-[11px] font-bold outline-none transition-colors ${
                    selected ? 'text-orange-300' : 'text-slate-300'
                  } ${i === active ? 'bg-orange-500/15' : 'hover:bg-white/5'}`}
                >
                  <Check className={`h-3.5 w-3.5 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} />
                  <span className="flex-1">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Selector;
