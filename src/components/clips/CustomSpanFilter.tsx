import React, { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { CustomSpan } from './types';

/**
 * Topes para que un numero tecleado de mas no dispare un barrido eterno: el
 * barrido completo va por franjas de una hora o un dia, y 10 años en dias ya
 * son 3650 franjas. Un año en horas es lo mismo que 365 dias, pero se deja
 * porque hay quien piensa en horas.
 */
const MAX_AMOUNT: Record<CustomSpan['unit'], number> = { hours: 8760, days: 3650 };

/**
 * "Ultimas 48 horas" / "Ultimos 45 dias". Una plantilla por unidad y por
 * singular/plural y no "Ultimos" + numero + unidad: en español el adjetivo
 * concuerda con la unidad (ultimas horas, ultimos dias) y en otros idiomas
 * cambia hasta el orden.
 */
export const formatCustomSpan = (span: CustomSpan, t: (key: string) => string) =>
  t(`custom_${span.unit}_${span.amount === 1 ? 'one' : 'other'}`).replace('{n}', String(span.amount));

interface CustomSpanFilterProps {
  value: CustomSpan | null;
  onChange: (span: CustomSpan | null) => void;
  disabled?: boolean;
  t: (key: string) => string;
}

/**
 * Quinta opcion junto a 24 horas / 7 dias / 30 dias: un numero y una unidad
 * (horas o dias). Se pide al pulsar Aplicar o Enter, no a cada tecla: cada
 * cambio vacia la rejilla y vuelve a cargar, y escribir "48" pasaria por "4".
 */
const CustomSpanFilter: React.FC<CustomSpanFilterProps> = ({ value, onChange, disabled = false, t }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [amountText, setAmountText] = useState('48');
  const [unit, setUnit] = useState<CustomSpan['unit']>('hours');

  useEffect(() => {
    if (!open) return;
    if (value) {
      setAmountText(String(value.amount));
      setUnit(value.unit);
    }
    // Directo al numero, que es lo que se viene a cambiar.
    const id = setTimeout(() => inputRef.current?.select(), 30);
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const amount = Number(amountText);
  const valid = Number.isInteger(amount) && amount >= 1 && amount <= MAX_AMOUNT[unit];
  const draft: CustomSpan | null = valid ? { amount, unit } : null;

  const apply = () => {
    if (!draft) return;
    onChange(draft);
    setOpen(false);
  };

  const active = !!value || open;

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex items-stretch h-full">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          title={t('custom_desc')}
          className={`w-full h-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm transition-all font-medium whitespace-nowrap ${
            value ? 'rounded-l-md' : 'rounded-md'
          } ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          } ${
            active
              ? 'bg-twitch-base text-[var(--color-accent-ink)] shadow-md'
              : `text-gray-400 ${disabled ? '' : 'hover:text-white hover:bg-twitch-surfaceAlt'}`
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{value ? formatCustomSpan(value, t) : t('time_custom')}</span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            disabled={disabled}
            aria-label={t('custom_clear')}
            title={t('custom_clear')}
            className="flex items-center justify-center px-1.5 rounded-r-md bg-twitch-base text-[var(--color-accent-ink)] hover:brightness-110 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="block w-px h-4 bg-current opacity-25 -ml-1.5 mr-1.5" aria-hidden="true" />
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={t('time_custom')}
          className="absolute top-full left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-twitch-surfaceAlt border border-twitch-surfaceAlt rounded-xl shadow-xl z-30 p-3 animate-in fade-in zoom-in-95 duration-100"
        >
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('custom_label')}</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_AMOUNT[unit]}
              step={1}
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
              aria-label={t('custom_amount')}
              aria-invalid={!valid}
              className={`w-24 min-w-0 bg-twitch-black text-gray-100 text-sm font-bold tabular-nums rounded-lg border px-2.5 py-2 outline-none focus:ring-1 ${
                valid ? 'border-twitch-surfaceAlt focus:border-twitch-base focus:ring-twitch-base' : 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
              }`}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as CustomSpan['unit'])}
              aria-label={t('custom_unit')}
              style={{ colorScheme: 'dark' }}
              className="flex-1 min-w-0 bg-twitch-black text-gray-100 text-sm rounded-lg border border-twitch-surfaceAlt px-2 py-2 outline-none focus:border-twitch-base focus:ring-1 focus:ring-twitch-base cursor-pointer"
            >
              <option value="hours">{t('unit_hours')}</option>
              <option value="days">{t('unit_days')}</option>
            </select>
          </div>

          <p className={`mt-2 min-h-[1rem] text-[11px] font-medium ${valid ? 'text-gray-400' : 'text-red-400'}`}>
            {draft ? formatCustomSpan(draft, t) : t('custom_invalid').replace('{max}', String(MAX_AMOUNT[unit]))}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white bg-twitch-black/60 hover:bg-twitch-black transition-colors cursor-pointer"
            >
              {t('range_cancel')}
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!draft}
              className="flex-1 py-2 rounded-lg text-xs font-black bg-twitch-base text-[var(--color-accent-ink)] hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('range_apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSpanFilter;
