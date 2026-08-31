// ============================================================================
// Medidor de nivel
// ----------------------------------------------------------------------------
// Con escala en dBFS, no con barras de altura arbitraria. Los números que
// enseña son los que hacen falta para responder "¿me está cogiendo el micro?":
// el nivel eficaz, el pico retenido, si está saturando y si directamente no
// entra nada.
// ============================================================================

import React from 'react';
import { AlertTriangle, VolumeX } from 'lucide-react';
import { CLIP_DBFS, SILENCE_DBFS } from '../lib/audio';
import type { AudioLevels } from '../lib/types';

interface AudioMeterProps {
  levels: AudioLevels | null;
  t: any;
}

/** -60 dBFS a la izquierda, 0 a la derecha. */
function toPercent(db: number): number {
  return Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
}

export const AudioMeter: React.FC<AudioMeterProps> = ({ levels, t }) => {
  const rms = levels ? levels.rms : -100;
  const hold = levels ? levels.hold : -100;
  const silent = rms <= SILENCE_DBFS;

  return (
    <div className="space-y-3">
      <div className="relative h-7 rounded-lg bg-black/50 border border-white/10 overflow-hidden">
        {/* Zona de aviso a partir de -6 dBFS y roja pegada al techo */}
        <div className="absolute inset-y-0 right-0 w-[10%] bg-red-500/10" />
        <div className="absolute inset-y-0 right-[10%] w-[15%] bg-amber-500/10" />
        <div
          className={`absolute inset-y-0 left-0 transition-[width] duration-75 ${
            levels && levels.clipping ? 'bg-red-500' : rms > -6 ? 'bg-amber-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${toPercent(rms)}%` }}
        />
        {levels && hold > -100 && (
          <div className="absolute inset-y-0 w-0.5 bg-white/90" style={{ left: `${toPercent(hold)}%` }} />
        )}
        {[-60, -48, -36, -24, -12, -6, 0].map(mark => (
          <span key={mark} className="absolute inset-y-0 w-px bg-white/10" style={{ left: `${toPercent(mark)}%` }} />
        ))}
      </div>

      <div className="flex justify-between text-[9px] font-mono text-slate-600">
        {[-60, -48, -36, -24, -12, 0].map(mark => <span key={mark}>{mark}</span>)}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px]">
        <span className="text-slate-400">
          RMS <span className="text-white tabular-nums">{levels ? rms.toFixed(1) : '—'}</span> dBFS
        </span>
        <span className="text-slate-400">
          {t.peak} <span className="text-white tabular-nums">{levels ? hold.toFixed(1) : '—'}</span> dBFS
        </span>
        {levels && levels.clipping && (
          <span className="inline-flex items-center gap-1.5 text-red-400 font-bold">
            <AlertTriangle className="w-3.5 h-3.5" /> {t.clipping}
          </span>
        )}
        {levels && silent && !levels.clipping && (
          <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold">
            <VolumeX className="w-3.5 h-3.5" /> {t.silent}
          </span>
        )}
      </div>

      {/* Espectro, repartido en escala logarítmica */}
      <div className="flex items-end gap-[2px] h-16" aria-hidden="true">
        {Array.from({ length: 32 }).map((_, index) => {
          const value = levels ? levels.bands[index] || 0 : 0;
          return (
            <span
              key={index}
              className="flex-1 rounded-sm bg-gradient-to-t from-cyan-600 to-cyan-300 transition-[height] duration-75"
              style={{ height: `${Math.max(3, value * 100)}%` }}
            />
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{t.meterHint}</p>
    </div>
  );
};

export default AudioMeter;
