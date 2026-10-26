// Nitidez de lo que se exporta (marca, vídeo unido, editor y la
// descarga mejorada). Es una sola preferencia por herramienta: se elige una
// vez y vale para todo. Ver nitidez.ts.
import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { CalidadExport, NivelNitidez } from './nitidez';
import { muestrasNitidez } from './muestraNitidez';

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
  // Debajo de cada nivel, la misma foto con ese nivel (muestraNitidez.ts).
  // Tras montar: hace falta WebGL, que en el servidor no hay.
  const [muestras, setMuestras] = useState<Partial<Record<NivelNitidez, string>>>({});
  useEffect(() => { setMuestras(muestrasNitidez()); }, []);
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
      {muestras.off && (
        <div className="flex gap-2" aria-hidden="true">
          <span className="w-24 shrink-0" />
          <div className="flex-1 grid grid-cols-4 gap-1 px-1">
            {NIVELES.map(n => (
              <button
                key={n}
                type="button"
                tabIndex={-1}
                onClick={() => onChange({ ...valor, nitidez: n })}
                title={etiqueta[n]}
                className={`h-14 rounded-lg overflow-hidden cursor-pointer transition-all ${valor.nitidez === n ? 'ring-2 ring-twitch' : 'ring-1 ring-white/10 opacity-70 hover:opacity-100'}`}
                // Ampliada al doble y sin suavizar: a tamaño de miniatura la
                // diferencia entre niveles no se vería.
                style={{ backgroundImage: `url(${muestras[n]})`, backgroundSize: '264px 148px', backgroundPosition: 'center 30%', imageRendering: 'pixelated' }}
              />
            ))}
          </div>
        </div>
      )}
      {!compacto && <p className="text-[10px] text-gray-500 leading-snug">{tx('q_hint', 'Sharpness brings back texture to the grass and foliage that Twitch compresses away; it cannot invent detail that is not there.')}</p>}
    </div>
  );
};

export default CalidadSelector;
