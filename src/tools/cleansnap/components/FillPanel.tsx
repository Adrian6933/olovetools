// ============================================================================
// Panel de relleno
// ----------------------------------------------------------------------------
// Los métodos van en dos grupos separados a propósito: los que RECONSTRUYEN
// (parches y suavizado) y los que TAPAN (desenfoque y mosaico). Antes estaban
// mezclados y con nombres que insinuaban lo contrario — "Content-aware" para
// una difusión, y un "modo IA" que era la misma difusión con más iteraciones.
// ============================================================================

import React from 'react';
import { Blend, Boxes, Grid3x3, Waves } from 'lucide-react';
import type { FillMethod, FillSettings } from '../lib/types';

interface FillPanelProps {
  settings: FillSettings;
  onChange: (next: FillSettings) => void;
  t: any;
}

const REBUILD: { id: FillMethod; icon: React.ReactNode }[] = [
  { id: 'patch', icon: <Boxes className="w-4 h-4" /> },
  { id: 'smooth', icon: <Waves className="w-4 h-4" /> },
];

const HIDE: { id: FillMethod; icon: React.ReactNode }[] = [
  { id: 'blur', icon: <Blend className="w-4 h-4" /> },
  { id: 'pixelate', icon: <Grid3x3 className="w-4 h-4" /> },
];

const Slider: React.FC<{
  label: string; value: number; min: number; max: number; step?: number;
  suffix?: string; onChange: (value: number) => void; hint?: string;
}> = ({ label, value, min, max, step = 1, suffix = '', onChange, hint }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-xs font-bold text-slate-300">{label}</span>
      <span className="font-mono text-xs font-black text-white tabular-nums">{value}{suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseInt(e.target.value, 10))}
      className="w-full h-1.5 rounded bg-white/10 accent-violet-500 cursor-pointer" />
    {hint && <p className="text-[11px] text-slate-500 leading-relaxed">{hint}</p>}
  </div>
);

export const FillPanel: React.FC<FillPanelProps> = ({ settings, onChange, t }) => {
  const patch = (next: Partial<FillSettings>) => onChange({ ...settings, ...next });
  const rebuilds = settings.method === 'patch' || settings.method === 'smooth';

  const button = (id: FillMethod, icon: React.ReactNode) => (
    <button
      key={id}
      type="button"
      onClick={() => patch({ method: id })}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
        settings.method === id
          ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
      }`}
    >
      {icon}
      <span className="truncate">{t.methods[id]}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{t.rebuildTitle}</span>
        <div className="grid grid-cols-2 gap-2">{REBUILD.map(m => button(m.id, m.icon))}</div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{t.methodHints[settings.method] || ''}</p>
      </div>

      <div className="space-y-2">
        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{t.hideTitle}</span>
        <div className="grid grid-cols-2 gap-2">{HIDE.map(m => button(m.id, m.icon))}</div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{t.hideNote}</p>
      </div>

      {settings.method === 'patch' && (
        <div className="space-y-4 pt-2 border-t border-white/10">
          <Slider label={t.patchSize} value={settings.patchSize} min={5} max={21} step={2}
            suffix=" px" onChange={v => patch({ patchSize: v })} hint={t.patchSizeHint} />
          <Slider label={t.searchRadius} value={settings.searchRadius} min={40} max={600} step={20}
            suffix=" px" onChange={v => patch({ searchRadius: v })} hint={t.searchRadiusHint} />
        </div>
      )}

      {(settings.method === 'blur' || settings.method === 'pixelate') && (
        <div className="pt-2 border-t border-white/10">
          <Slider label={t.strength} value={settings.strength} min={10} max={100}
            suffix="%" onChange={v => patch({ strength: v })} />
        </div>
      )}

      <div className="space-y-4 pt-2 border-t border-white/10">
        <Slider label={t.grow} value={settings.grow} min={-6} max={12}
          suffix=" px" onChange={v => patch({ grow: v })} hint={t.growHint} />
        {rebuilds && (
          <Slider label={t.feather} value={settings.feather} min={0} max={8}
            suffix=" px" onChange={v => patch({ feather: v })} hint={t.featherHint} />
        )}
      </div>
    </div>
  );
};

export default FillPanel;
