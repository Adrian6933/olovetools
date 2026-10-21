// Nitidez y resolución de lo que se exporta (marca, vídeo unido, editor y la
// descarga mejorada). Es una sola preferencia por herramienta: se elige una
// vez y vale para todo. Ver nitidez.ts.
import React from 'react';
import { Sparkles, Maximize } from 'lucide-react';
import type { CalidadExport, NivelNitidez } from './nitidez';

interface Props {
  valor: CalidadExport;
  onChange: (c: CalidadExport) => void;
  t: any;
  /** Sin la explicación de debajo (en paneles estrechos). */
  compacto?: boolean;
}

const NIVELES: NivelNitidez[] = ['off', 'suave', 'media', 'fuerte'];

const CalidadSelector: React.FC<Props> = ({ valor, onChange, t, compacto }) => {
  const tx = (k: string, fb: string) => (typeof t?.[k] === 'string' && t[k]) || fb;
  const etiqueta: Record<NivelNitidez, string> = {
    off: tx('q_off', 'Off'),
    suave: tx('q_soft', 'Soft'),
    media: tx('q_mid', 'Medium'),
    fuerte: tx('q_strong', 'Strong'),
  };
  const pastilla = (activa: boolean) =>
    `flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${activa ? 'bg-twitch text-[var(--color-accent-ink)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-24 shrink-0 text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-twitch" />{tx('q_sharp', 'Sharpness')}</span>
        <div className="flex-1 flex p-1 rounded-xl bg-dark-950 border border-white/10 gap-1" role="radiogroup" aria-label={tx('q_sharp', 'Sharpness')}>
          {NIVELES.map(n => (
            <button key={n} type="button" role="radio" aria-checked={valor.nitidez === n} onClick={() => onChange({ ...valor, nitidez: n })} className={pastilla(valor.nitidez === n)}>{etiqueta[n]}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-24 shrink-0 text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5"><Maximize className="w-3.5 h-3.5 text-twitch" />{tx('q_res', 'Resolution')}</span>
        <div className="flex-1 flex p-1 rounded-xl bg-dark-950 border border-white/10 gap-1" role="radiogroup" aria-label={tx('q_res', 'Resolution')}>
          {([1080, 1440] as const).map(a => (
            <button key={a} type="button" role="radio" aria-checked={valor.alto === a} onClick={() => onChange({ ...valor, alto: a })} className={pastilla(valor.alto === a)}>
              {a === 1080 ? tx('q_1080', '1080p (original)') : tx('q_1440', '1440p (better on YouTube)')}
            </button>
          ))}
        </div>
      </div>
      {!compacto && <p className="text-[10px] text-gray-500 leading-snug">{tx('q_hint', 'Sharpness brings back texture to the grass and foliage that Twitch compresses away; it cannot invent detail that is not there.')}</p>}
    </div>
  );
};

export default CalidadSelector;
