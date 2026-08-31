// ============================================================================
// Panel de ajustes
// ----------------------------------------------------------------------------
// Dos vías desde el primer momento: los presets deciden por ti (formato,
// calidad y tamaño de una vez) y el modo manual no toca nada — quien quiere
// control lo tiene sin pelearse antes con una sugerencia automática.
//
// Los formatos que el navegador no sabe escribir salen apagados y con el
// motivo, en vez de ofrecerse y devolver un PNG con la extensión cambiada.
// ============================================================================

import React from 'react';
import {
  FlipHorizontal2, FlipVertical2, Redo2, RotateCw, Sliders, Undo2, Wand2, Zap,
} from 'lucide-react';
import type { FormatInfo, OutputId, ResizeMode, Settings } from '../lib/types';
import { formatInfo } from '../lib/formats';

interface ControlPanelProps {
  formats: FormatInfo[];
  settings: Settings;
  onChange: (next: Settings) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  livePreview: boolean;
  onLivePreview: (value: boolean) => void;
  /** Dimensiones del original seleccionado, para calcular la proporción. */
  sourceWidth: number;
  sourceHeight: number;
  t: any;
}

/** Presets. `null` en un campo = no lo toca, se respeta lo que hubiera. */
const PRESETS: { id: string; patch: Partial<Settings> }[] = [
  { id: 'web', patch: { format: 'image/webp', quality: 82, resizeMode: 'longEdge', longEdge: 1920, sharpen: 25, targetBytes: 0 } },
  { id: 'social', patch: { format: 'image/jpeg', quality: 88, resizeMode: 'longEdge', longEdge: 1440, sharpen: 15, targetBytes: 0 } },
  { id: 'archive', patch: { format: 'image/png', quality: 100, resizeMode: 'none', sharpen: 0, targetBytes: 0 } },
  { id: 'email', patch: { format: 'image/jpeg', quality: 85, resizeMode: 'longEdge', longEdge: 1600, sharpen: 10, targetBytes: 500 * 1024 } },
];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</span>
    {children}
  </div>
);

const Slider: React.FC<{
  value: number; min: number; max: number; step?: number;
  onChange: (value: number) => void; suffix?: string; label: string; disabled?: boolean;
}> = ({ value, min, max, step = 1, onChange, suffix = '', label, disabled }) => (
  <div className={`space-y-2 ${disabled ? 'opacity-40' : ''}`}>
    <div className="flex justify-between items-baseline">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <span className="font-mono text-xs font-black text-white tabular-nums">{value}{suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full accent-indigo-500 cursor-pointer disabled:cursor-not-allowed" />
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  formats, settings, onChange, onUndo, onRedo, canUndo, canRedo,
  livePreview, onLivePreview, sourceWidth, sourceHeight, t,
}) => {
  const patch = (next: Partial<Settings>) => onChange({ ...settings, ...next });
  const info = formatInfo(settings.format);
  const current = formats.find(f => f.id === settings.format);
  const lossy = info.lossy && (!current || current.available);
  const alpha = info.alpha;

  const pickFormat = (id: OutputId) => {
    // Al saltar a un formato sin alfa, el fondo pasa a importar: se deja el
    // que hubiera y se avisa en la sección de fondo, no se cambia a la fuerza.
    patch({ format: id });
  };

  const setWidth = (value: number) => {
    if (settings.lockAspect && sourceWidth > 0) {
      const ratio = sourceHeight / sourceWidth;
      patch({ width: value, height: Math.max(1, Math.round(value * ratio)) });
    } else {
      patch({ width: value });
    }
  };

  const setHeight = (value: number) => {
    if (settings.lockAspect && sourceHeight > 0) {
      const ratio = sourceWidth / sourceHeight;
      patch({ height: value, width: Math.max(1, Math.round(value * ratio)) });
    } else {
      patch({ height: value });
    }
  };

  return (
    <div className="space-y-8">
      {/* --- Presets vs manual ------------------------------------------- */}
      <Section title={t.presetsTitle}>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map(preset => (
            <button key={preset.id} type="button" onClick={() => patch(preset.patch)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-left hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors cursor-pointer group">
              <Wand2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-300 group-hover:text-white leading-tight">
                {t.presets[preset.id]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{t.presetsHint}</p>
      </Section>

      {/* --- Formato ------------------------------------------------------ */}
      <Section title={t.outputFormat}>
        <div className="grid grid-cols-4 gap-1.5">
          {formats.map(format => {
            const active = settings.format === format.id;
            return (
              <button
                key={format.id}
                type="button"
                disabled={!format.available}
                onClick={() => pickFormat(format.id)}
                title={format.available ? undefined : t.formatUnavailable}
                className={`py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  active
                    ? 'bg-indigo-500 text-white border border-indigo-400'
                    : format.available
                      ? 'bg-slate-900/70 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-600'
                      : 'bg-slate-950/60 text-slate-700 border border-slate-900 line-through'
                }`}
              >
                {format.label}
              </button>
            );
          })}
        </div>
        {formats.some(f => !f.available) && (
          <p className="text-[11px] text-slate-500 leading-relaxed">{t.formatUnavailableHint}</p>
        )}
      </Section>

      {/* --- Calidad y peso ---------------------------------------------- */}
      <Section title={t.qualityTitle}>
        <Slider label={t.quality} value={settings.quality} min={5} max={100} suffix="%"
          disabled={!lossy} onChange={value => patch({ quality: value })} />
        {!lossy && <p className="text-[11px] text-slate-500">{t.qualityLossless}</p>}

        <label className="flex items-center gap-3 pt-1 cursor-pointer">
          <input type="checkbox" checked={settings.targetBytes > 0} disabled={!lossy}
            onChange={e => patch({ targetBytes: e.target.checked ? 500 * 1024 : 0 })}
            className="w-4 h-4 accent-indigo-500 cursor-pointer" />
          <span className="text-xs font-bold text-slate-300">{t.targetSize}</span>
        </label>
        {settings.targetBytes > 0 && lossy && (
          <div className="pl-7 space-y-2">
            <div className="flex items-center gap-2">
              <input type="number" min={10} max={20000} value={Math.round(settings.targetBytes / 1024)}
                onChange={e => patch({ targetBytes: Math.max(10, parseInt(e.target.value, 10) || 10) * 1024 })}
                className="w-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm" />
              <span className="text-xs font-bold text-slate-500">KB</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{t.targetSizeHint}</p>
          </div>
        )}
      </Section>

      {/* --- Tamaño ------------------------------------------------------- */}
      <Section title={t.resizeTitle}>
        <div className="grid grid-cols-4 gap-1.5">
          {(['none', 'scale', 'longEdge', 'dimensions'] as ResizeMode[]).map(mode => (
            <button key={mode} type="button" onClick={() => patch({ resizeMode: mode })}
              className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                settings.resizeMode === mode
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-900/70 text-slate-400 border border-slate-800 hover:text-white'
              }`}>
              {t.resizeModes[mode]}
            </button>
          ))}
        </div>

        {settings.resizeMode === 'scale' && (
          <Slider label={t.scale} value={settings.scale} min={10} max={400} step={5} suffix="%"
            onChange={value => patch({ scale: value })} />
        )}

        {settings.resizeMode === 'longEdge' && (
          <div className="flex items-center gap-2">
            <input type="number" min={16} max={16384} value={settings.longEdge}
              onChange={e => patch({ longEdge: Math.max(16, parseInt(e.target.value, 10) || 16) })}
              className="w-28 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm" />
            <span className="text-xs font-bold text-slate-500">px · {t.longEdgeHint}</span>
          </div>
        )}

        {settings.resizeMode === 'dimensions' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={16384} value={settings.width} onChange={e => setWidth(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm" />
              <span className="text-slate-600 font-black">×</span>
              <input type="number" min={1} max={16384} value={settings.height} onChange={e => setHeight(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm" />
              <span className="text-xs font-bold text-slate-500">px</span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.lockAspect} onChange={e => patch({ lockAspect: e.target.checked })}
                className="w-4 h-4 accent-purple-500 cursor-pointer" />
              <span className="text-xs font-bold text-slate-300">{t.lockAspect}</span>
            </label>
            {settings.lockAspect && (
              <div className="grid grid-cols-3 gap-1.5">
                {(['contain', 'cover', 'stretch'] as const).map(fit => (
                  <button key={fit} type="button" onClick={() => patch({ fit })}
                    className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      settings.fit === fit ? 'bg-slate-200 text-slate-900' : 'bg-slate-900/70 text-slate-400 border border-slate-800 hover:text-white'
                    }`}>
                    {t.fits[fit]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Slider label={t.sharpen} value={settings.sharpen} min={0} max={100} suffix="%"
          onChange={value => patch({ sharpen: value })} />
        <p className="text-[11px] text-slate-500 leading-relaxed">{t.sharpenHint}</p>
      </Section>

      {/* --- Orientación y fondo ------------------------------------------ */}
      <Section title={t.transformTitle}>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => patch({ rotate: (((settings.rotate + 90) % 360) as Settings['rotate']) })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer">
            <RotateCw className="w-3.5 h-3.5" /> {settings.rotate}°
          </button>
          <button type="button" onClick={() => patch({ flipH: !settings.flipH })}
            className={`p-2 rounded-lg border text-slate-300 transition-colors cursor-pointer ${settings.flipH ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'}`}
            aria-label={t.flipH} aria-pressed={settings.flipH}>
            <FlipHorizontal2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => patch({ flipV: !settings.flipV })}
            className={`p-2 rounded-lg border text-slate-300 transition-colors cursor-pointer ${settings.flipV ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'}`}
            aria-label={t.flipV} aria-pressed={settings.flipV}>
            <FlipVertical2 className="w-4 h-4" />
          </button>
        </div>

        {!alpha && (
          <label className="flex items-center gap-3 pt-1">
            <input type="color" value={settings.background} onChange={e => patch({ background: e.target.value })}
              className="w-9 h-9 rounded-lg bg-transparent border border-slate-700 cursor-pointer" />
            <span className="text-xs font-bold text-slate-300 leading-tight">{t.background}</span>
          </label>
        )}
      </Section>

      {/* --- Medida y vista previa ---------------------------------------- */}
      <Section title={t.engineTitle}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={settings.measureQuality} onChange={e => patch({ measureQuality: e.target.checked })}
            className="w-4 h-4 mt-0.5 accent-emerald-500 cursor-pointer" />
          <span className="text-xs font-bold text-slate-300 leading-snug">
            {t.measureQuality}
            <span className="block font-medium text-slate-500 mt-0.5">{t.measureQualityHint}</span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={livePreview} onChange={e => onLivePreview(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-amber-500 cursor-pointer" />
          <span className="text-xs font-bold text-slate-300 leading-snug">
            {t.livePreview}
            <span className="block font-medium text-slate-500 mt-0.5">{t.livePreviewHint}</span>
          </span>
        </label>
      </Section>

      {/* --- Historial ----------------------------------------------------- */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <button type="button" onClick={onUndo} disabled={!canUndo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
          <Undo2 className="w-3.5 h-3.5" /> {t.undo}
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
          <Redo2 className="w-3.5 h-3.5" /> {t.redo}
        </button>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
          <Sliders className="w-3 h-3" /> {t.historyHint}
        </span>
      </div>
    </div>
  );
};

export default ControlPanel;
