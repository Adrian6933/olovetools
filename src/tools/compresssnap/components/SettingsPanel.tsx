import React from 'react';
import { Gauge, Info, Maximize2, Palette, Target } from 'lucide-react';
import type { CompressSettings, OutputFormat, ResizeMode } from '../lib/types';

// ============================================================================
// The controls
// ----------------------------------------------------------------------------
// The panel is honest about what each knob does to each format, because the old
// one was not: the quality slider was shown for PNG, where it has no effect
// whatsoever, and the only thing that does shrink a PNG — the colour count —
// did not exist. Here the irrelevant control is hidden rather than left there
// to be dragged for nothing.
// ============================================================================

interface SettingsPanelProps {
  settings: CompressSettings;
  onChange: (patch: Partial<CompressSettings>) => void;
  /** Formats this browser can actually write, probed at runtime. */
  available: OutputFormat[];
  t: any;
  /** Shown next to the format picker so "original" is not a mystery. */
  sourceMime: string;
}

const FORMAT_LABEL: Record<OutputFormat, string> = {
  original: 'Original',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
};

const RESIZE_MODES: { id: ResizeMode; key: string; fallback: string }[] = [
  { id: 'none', key: 'resizeNone', fallback: 'Keep size' },
  { id: 'longEdge', key: 'resizeLongEdge', fallback: 'Long edge' },
  { id: 'scale', key: 'resizeScale', fallback: 'Percentage' },
  { id: 'dimensions', key: 'resizeCustom', fallback: 'Exact box' },
];

const PRESETS: { key: string; fallback: string; patch: Partial<CompressSettings> }[] = [
  { key: 'presetLight', fallback: 'Light', patch: { quality: 90, resizeMode: 'none', targetBytes: null, pngColors: 0 } },
  { key: 'presetBalanced', fallback: 'Balanced', patch: { quality: 80, resizeMode: 'none', targetBytes: null, pngColors: 128 } },
  { key: 'presetWeb', fallback: 'For the web', patch: { quality: 72, resizeMode: 'longEdge', longEdge: 1920, targetBytes: null, pngColors: 64 } },
  { key: 'presetStrong', fallback: 'Strong', patch: { quality: 55, resizeMode: 'longEdge', longEdge: 1280, targetBytes: null, pngColors: 32 } },
];

const numberField =
  'w-full px-2.5 py-1.5 rounded-lg bg-[#050c12] border border-white/10 focus:border-cyan-500/50 text-cyan-200 font-mono text-xs outline-none transition-colors';

const Row: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <div className="space-y-2.5">
    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
      <span className="text-cyan-400">{icon}</span>
      {label}
    </span>
    {children}
  </div>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings, onChange, available, t, sourceMime,
}) => {
  // PNG is lossless: the quality argument is ignored by every encoder, so the
  // slider is hidden rather than shown doing nothing.
  const effectiveMime = settings.format === 'original' ? sourceMime : settings.format;
  const isPng = effectiveMime === 'image/png';
  const budgetOn = settings.targetBytes !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(preset => (
          <button
            key={preset.key}
            onClick={() => onChange(preset.patch)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold border bg-[#0a1a22] border-white/5 text-slate-400 hover:text-white hover:border-cyan-500/30 transition-all cursor-pointer outline-none"
          >
            {t[preset.key] || preset.fallback}
          </button>
        ))}
      </div>

      <Row icon={<Palette className="w-3.5 h-3.5" />} label={t.formatLabel || 'Output format'}>
        <div className="flex flex-wrap gap-2">
          {available.map(format => (
            <button
              key={format}
              onClick={() => onChange({ format })}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer outline-none ${
                settings.format === format
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/25'
                  : 'bg-[#0a1a22] border-white/5 text-slate-400 hover:text-white hover:border-cyan-500/30'
              }`}
            >
              {format === 'original'
                ? `${t.formatOriginal || 'Original'}${sourceMime ? ` · ${(sourceMime.split('/')[1] || '').toUpperCase()}` : ''}`
                : FORMAT_LABEL[format]}
            </button>
          ))}
        </div>
        {available.indexOf('image/avif') === -1 && (
          <p className="text-[10px] text-slate-600 leading-relaxed flex items-start gap-1.5">
            <Info className="w-3 h-3 shrink-0 mt-0.5" />
            {t.avifUnsupported || 'This browser cannot write AVIF, so it is not offered.'}
          </p>
        )}
      </Row>

      {!isPng && (
        <Row icon={<Gauge className="w-3.5 h-3.5" />} label={t.qualityLabel || 'Quality'}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={100}
              value={settings.quality}
              disabled={budgetOn}
              onChange={e => onChange({ quality: Number(e.target.value) })}
              className="flex-1 accent-cyan-500 disabled:opacity-40"
              aria-label={t.qualityLabel || 'Quality'}
            />
            <span className="w-10 text-right font-mono text-xs text-cyan-200 tabular-nums">{settings.quality}</span>
          </div>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            {budgetOn
              ? t.qualityFromBudget || 'Quality is being searched for to fit the size budget below.'
              : t.qualityHint || 'Lower quality, smaller file. The measured loss is shown on each result.'}
          </p>
        </Row>
      )}

      {isPng && (
        <Row icon={<Palette className="w-3.5 h-3.5" />} label={t.pngColorsLabel || 'PNG colours'}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={256}
              step={2}
              value={settings.pngColors}
              onChange={e => onChange({ pngColors: Number(e.target.value) })}
              className="flex-1 accent-cyan-500"
              aria-label={t.pngColorsLabel || 'PNG colours'}
            />
            <span className="w-16 text-right font-mono text-xs text-cyan-200 tabular-nums">
              {settings.pngColors === 0 ? t.pngColorsAll || 'all' : settings.pngColors}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.dither}
              onChange={e => onChange({ dither: e.target.checked })}
              className="accent-cyan-500"
            />
            <span className="text-[11px] text-slate-400 font-medium">{t.ditherLabel || 'Dither the gradients'}</span>
          </label>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            {t.pngNote ||
              'PNG has no quality setting — every encoder ignores it. Reducing the palette is what makes one smaller, and on flat artwork it is invisible.'}
          </p>
        </Row>
      )}

      <Row icon={<Target className="w-3.5 h-3.5" />} label={t.budgetLabel || 'Size budget'}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={budgetOn}
            disabled={isPng}
            onChange={e => onChange({ targetBytes: e.target.checked ? 200 * 1024 : null })}
            className="accent-cyan-500 disabled:opacity-40"
          />
          <span className="text-[11px] text-slate-400 font-medium">
            {t.budgetToggle || 'Get every image under a set size'}
          </span>
        </label>
        {budgetOn && !isPng && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={20000}
              value={Math.round(settings.targetBytes / 1024)}
              onChange={e => {
                const kb = Number(e.target.value);
                if (Number.isFinite(kb) && kb > 0) onChange({ targetBytes: Math.round(kb * 1024) });
              }}
              className={`${numberField} w-24`}
              aria-label={t.budgetLabel || 'Size budget'}
            />
            <span className="text-[11px] text-slate-500 font-bold">KB</span>
            <span className="text-[10px] text-slate-600">
              {t.budgetHint || 'Quality is bisected until it fits.'}
            </span>
          </div>
        )}
        {isPng && (
          <p className="text-[10px] text-slate-600 leading-relaxed">
            {t.budgetPngNote || 'A byte budget needs a quality knob to search; PNG has none. Use the palette instead.'}
          </p>
        )}
      </Row>

      <Row icon={<Maximize2 className="w-3.5 h-3.5" />} label={t.resizeModeLabel || 'Resize'}>
        <div className="flex flex-wrap gap-2">
          {RESIZE_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => onChange({ resizeMode: mode.id })}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer outline-none ${
                settings.resizeMode === mode.id
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-[#0a1a22] border-white/5 text-slate-400 hover:text-white hover:border-cyan-500/30'
              }`}
            >
              {t[mode.key] || mode.fallback}
            </button>
          ))}
        </div>

        {settings.resizeMode === 'longEdge' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={16}
              max={16384}
              value={settings.longEdge}
              onChange={e => onChange({ longEdge: Number(e.target.value) || 1 })}
              className={`${numberField} w-28`}
              aria-label={t.longEdgeLabel || 'Longest side (px)'}
            />
            <span className="text-[11px] text-slate-500 font-bold">px</span>
            <span className="text-[10px] text-slate-600">
              {t.longEdgeHint || 'Never upscales — a smaller image is left alone.'}
            </span>
          </div>
        )}

        {settings.resizeMode === 'scale' && (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={100}
              value={settings.scale}
              onChange={e => onChange({ scale: Number(e.target.value) })}
              className="flex-1 accent-cyan-500"
              aria-label={t.scaleLabel || 'Scale'}
            />
            <span className="w-12 text-right font-mono text-xs text-cyan-200 tabular-nums">{settings.scale}%</span>
          </div>
        )}

        {settings.resizeMode === 'dimensions' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={settings.width}
                onChange={e => onChange({ width: Number(e.target.value) || 1 })}
                className={`${numberField} w-24`}
                aria-label={t.widthLabel || 'Width'}
              />
              <span className="text-slate-600 text-xs">×</span>
              <input
                type="number"
                min={1}
                value={settings.height}
                onChange={e => onChange({ height: Number(e.target.value) || 1 })}
                className={`${numberField} w-24`}
                aria-label={t.heightLabel || 'Height'}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintainAspectRatio}
                onChange={e => onChange({ maintainAspectRatio: e.target.checked })}
                className="accent-cyan-500"
              />
              <span className="text-[11px] text-slate-400 font-medium">
                {t.keepAspectLabel || 'Fit inside the box, keep the shape'}
              </span>
            </label>
          </div>
        )}
      </Row>

      <label className="flex items-start gap-2 cursor-pointer pt-1 border-t border-white/5">
        <input
          type="checkbox"
          checked={settings.measureQuality}
          onChange={e => onChange({ measureQuality: e.target.checked })}
          className="accent-cyan-500 mt-0.5"
        />
        <span className="text-[11px] text-slate-400 font-medium leading-relaxed">
          {t.measureLabel || 'Measure the quality loss (SSIM)'}
          <span className="block text-[10px] text-slate-600">
            {t.measureHint || 'Decodes the result back and compares it. Adds a little time per image.'}
          </span>
        </span>
      </label>
    </div>
  );
};

export default SettingsPanel;
