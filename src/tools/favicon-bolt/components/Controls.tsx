import React, { useRef } from 'react';
import {
  Image as ImageIcon,
  Redo2,
  RotateCcw,
  Smile,
  Sparkles,
  Type,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import type { IconSettings, ShapeKind, SourceImage } from '../types';
import { ACCEPTED } from '../lib/source';

interface ControlsProps {
  settings: IconSettings;
  source: SourceImage | null;
  /** `commit` records an undo step; sliders pass false until pointer-up. */
  update: (patch: Partial<IconSettings>, commit?: boolean) => void;
  onPickFile: (file: File) => void;
  onClearSource: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  error: string | null;
  t: any;
}

const SHAPES: ShapeKind[] = ['none', 'circle', 'square', 'rounded', 'squircle'];

const FONTS = [
  { value: 'system-ui', label: 'System UI' },
  { value: 'Georgia, serif', label: 'Serif' },
  { value: 'ui-monospace, monospace', label: 'Mono' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet' },
  { value: 'Impact, sans-serif', label: 'Impact' },
];

const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider" title={hint}>
    {children}
  </label>
);

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
  onCommit: () => void;
}> = ({ label, value, min, max, step = 1, suffix = '%', onChange, onCommit }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
      <span>{label}</span>
      <span className="text-blue-400 font-mono normal-case">
        {step < 1 ? value.toFixed(2) : Math.round(value)}
        {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      onPointerUp={onCommit}
      onKeyUp={onCommit}
      className="w-full accent-blue-500 cursor-pointer"
    />
  </div>
);

const ColorField: React.FC<{ value: string; onChange: (v: string) => void; onCommit: () => void }> = ({
  value,
  onChange,
  onCommit,
}) => (
  <div className="flex gap-2">
    <input
      type="color"
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onCommit}
      className="w-10 h-10 shrink-0 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0"
    />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onCommit}
      spellCheck={false}
      className="min-w-0 flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white uppercase outline-none focus:border-blue-500 transition-colors"
    />
  </div>
);

export const Controls: React.FC<ControlsProps> = ({
  settings: s,
  source,
  update,
  onPickFile,
  onClearSource,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  error,
  t,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const set = (patch: Partial<IconSettings>) => update(patch, false);
  const commit = () => update({}, true);
  const setNow = (patch: Partial<IconSettings>) => update(patch, true);

  const modes: { key: IconSettings['mode']; icon: React.ReactNode; label: string }[] = [
    { key: 'emoji', icon: <Smile className="w-3.5 h-3.5" />, label: t.label_mode_emoji || 'Emoji' },
    { key: 'text', icon: <Type className="w-3.5 h-3.5" />, label: t.label_mode_text || 'Letters' },
    { key: 'image', icon: <ImageIcon className="w-3.5 h-3.5" />, label: t.label_mode_image || 'Image' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Mode + history */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={() => setNow({ mode: m.key })}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-[11px] font-black uppercase rounded-lg transition-all cursor-pointer border-none outline-none ${
                s.mode === m.key
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m.icon}
              <span className="truncate">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title={`${t.undoBtn || 'Undo'} (Ctrl+Z)`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/10 bg-white/5 text-[10px] font-black uppercase text-slate-300 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-3.5 h-3.5" />
            {t.undoBtn || 'Undo'}
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title={`${t.redoBtn || 'Redo'} (Ctrl+Shift+Z)`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/10 bg-white/5 text-[10px] font-black uppercase text-slate-300 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 className="w-3.5 h-3.5" />
            {t.redoBtn || 'Redo'}
          </button>
        </div>
      </div>

      {/* Source */}
      {s.mode === 'emoji' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t.label_emoji_input || 'Type an emoji'}</Label>
            <input
              type="text"
              value={s.emoji}
              onChange={e => set({ emoji: e.target.value })}
              onBlur={commit}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-center text-2xl focus:border-blue-500 outline-none transition-colors"
            />
            <span className="text-[10px] text-slate-600 font-medium">
              {t.emojiHint || 'Family, flag and skin-tone emoji are kept whole.'}
            </span>
          </div>
        </div>
      )}

      {s.mode === 'text' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t.label_text_input || 'Letters (up to 3)'}</Label>
            <input
              type="text"
              maxLength={3}
              value={s.text}
              onChange={e => set({ text: e.target.value })}
              onBlur={commit}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-center text-2xl font-black uppercase focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t.label_text_color || 'Letter colour'}</Label>
            <ColorField value={s.textColor} onChange={v => set({ textColor: v })} onCommit={commit} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <Label>{t.label_font_family || 'Font'}</Label>
              <select
                value={s.fontFamily}
                onChange={e => setNow({ fontFamily: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none cursor-pointer"
              >
                {FONTS.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <Label>{t.label_font_weight || 'Weight'}</Label>
              <select
                value={s.fontWeight}
                onChange={e => setNow({ fontWeight: parseInt(e.target.value, 10) })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none cursor-pointer"
              >
                {[400, 600, 700, 900].map(w => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {s.mode === 'image' && (
        <div className="flex flex-col gap-4">
          <input
            type="file"
            ref={fileRef}
            accept={ACCEPTED}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.target.value = '';
            }}
            className="hidden"
          />
          {source ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
              <img
                src={source.url}
                alt=""
                className="w-12 h-12 shrink-0 object-contain rounded bg-white/5 border border-white/10 p-1"
              />
              <div className="min-w-0 flex-1 flex flex-col">
                <span className="text-xs font-bold text-white truncate">{source.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {source.svgText ? 'SVG' : `${source.width}×${source.height}`}
                </span>
              </div>
              <button
                onClick={onClearSource}
                title={t.removeFileBtn || 'Remove'}
                className="shrink-0 w-8 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) onPickFile(f);
              }}
              className="border-2 border-dashed border-white/15 hover:border-blue-500/50 bg-black/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-black/40 group text-center"
            >
              <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {t.dropzonePrompt || 'Drop a logo or click to pick one'}
              </span>
              <span className="text-[10px] text-slate-600 font-medium">
                {t.dropzoneSubtitle || 'PNG, JPG, WebP, AVIF, SVG, GIF and iPhone HEIC. Up to 30 MB.'}
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300">
              {error}
            </div>
          )}

          {source && (
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={s.trim}
                  onChange={e => setNow({ trim: e.target.checked })}
                  className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                {t.trimLabel || 'Trim transparent margin'}
              </label>
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={s.clipToShape}
                  onChange={e => setNow({ clipToShape: e.target.checked })}
                  className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                {t.clipLabel || 'Clip artwork to the shape'}
              </label>
            </div>
          )}
        </div>
      )}

      {/* Glyph size */}
      {s.mode !== 'image' && (
        <Slider
          label={t.label_font_scale || 'Glyph size'}
          value={s.fontScale}
          min={20}
          max={110}
          onChange={v => set({ fontScale: v })}
          onCommit={commit}
        />
      )}

      {/* Plate */}
      <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t.label_bg_shape || 'Background shape'}</Label>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            {SHAPES.map(key => (
              <button
                key={key}
                onClick={() => setNow({ shape: key })}
                className={`py-2 px-1 font-bold uppercase border rounded-lg transition-all cursor-pointer outline-none truncate ${
                  s.shape === key
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : 'border-white/10 hover:border-white/20 text-slate-300'
                }`}
              >
                {t[`shape_${key}`] || key}
              </button>
            ))}
          </div>
        </div>

        {s.shape !== 'none' && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>{t.label_bg_type || 'Fill'}</Label>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {(['solid', 'gradient'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setNow({ fill: k })}
                    className={`py-2 font-bold uppercase border rounded-lg transition-all cursor-pointer outline-none ${
                      s.fill === k
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : 'border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    {t[`fill_${k}`] || k}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t.label_bg_color || 'Background colour'}</Label>
              <ColorField value={s.bgColor} onChange={v => set({ bgColor: v })} onCommit={commit} />
            </div>

            {s.fill === 'gradient' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>{t.label_bg_color2 || 'Second colour'}</Label>
                  <ColorField value={s.bgColor2} onChange={v => set({ bgColor2: v })} onCommit={commit} />
                </div>
                <Slider
                  label={t.label_gradient_angle || 'Gradient angle'}
                  value={s.gradientAngle}
                  min={0}
                  max={360}
                  suffix="°"
                  onChange={v => set({ gradientAngle: v })}
                  onCommit={commit}
                />
              </>
            )}

            <Slider
              label={t.label_border_width || 'Border width'}
              value={s.borderWidth}
              min={0}
              max={15}
              onChange={v => set({ borderWidth: v })}
              onCommit={commit}
            />

            {s.borderWidth > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>{t.label_border_color || 'Border colour'}</Label>
                <ColorField value={s.borderColor} onChange={v => set({ borderColor: v })} onCommit={commit} />
              </div>
            )}
          </>
        )}

        <Slider
          label={t.label_padding || 'Padding'}
          value={s.padding}
          min={0}
          max={45}
          onChange={v => set({ padding: v })}
          onCommit={commit}
        />
      </div>

      {/* Manual transform */}
      <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
        <div className="flex items-center justify-between">
          <Label>{t.label_transform || 'Manual placement'}</Label>
          <button
            onClick={() => setNow({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 })}
            className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 hover:text-blue-400 transition-colors cursor-pointer bg-transparent border-none outline-none"
          >
            <RotateCcw className="w-3 h-3" />
            {t.resetTransformBtn || 'Reset'}
          </button>
        </div>
        <Slider
          label={t.label_scale || 'Zoom'}
          value={s.scale}
          min={0.2}
          max={4}
          step={0.01}
          suffix="×"
          onChange={v => set({ scale: v })}
          onCommit={commit}
        />
        <Slider
          label={t.label_rotation || 'Rotation'}
          value={s.rotation}
          min={-180}
          max={180}
          suffix="°"
          onChange={v => set({ rotation: v })}
          onCommit={commit}
        />
      </div>

      {/* Output tuning */}
      <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
        <label
          title={t.sharpenHint || 'Unsharp mask on the 16-48px frames, applied on premultiplied alpha so it cannot fringe the edges.'}
          className="flex items-start gap-2 text-[11px] font-bold text-slate-400 cursor-pointer hover:text-slate-200 transition-colors"
        >
          <input
            type="checkbox"
            checked={s.sharpenSmall}
            onChange={e => setNow({ sharpenSmall: e.target.checked })}
            className="accent-blue-500 w-3.5 h-3.5 mt-0.5 cursor-pointer"
          />
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            {t.sharpenLabel || 'Sharpen the small sizes'}
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <Label hint={t.appNameHint}>{t.label_app_name || 'Site name (manifest)'}</Label>
          <input
            type="text"
            value={s.appName}
            onChange={e => set({ appName: e.target.value })}
            onBlur={commit}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t.label_app_short_name || 'Short name'}</Label>
          <input
            type="text"
            value={s.appShortName}
            onChange={e => set({ appShortName: e.target.value })}
            onBlur={commit}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t.label_theme_color || 'Theme colour'}</Label>
          <ColorField value={s.themeColor} onChange={v => set({ themeColor: v })} onCommit={commit} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label hint={t.appleBgHint}>{t.label_apple_bg || 'iOS background'}</Label>
          <ColorField value={s.appleBg} onChange={v => set({ appleBg: v })} onCommit={commit} />
          <span className="text-[10px] text-slate-600 font-medium leading-relaxed">
            {t.appleBgHint || 'iOS drops transparency on the home screen, so the touch icon is flattened onto this colour.'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Controls;
