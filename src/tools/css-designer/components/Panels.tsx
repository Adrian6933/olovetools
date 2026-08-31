import React from 'react';
import { Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { Design, GradientState, ShadowLayer, TabId } from '../types';
import { ColorField, GradientBar, Segmented, Slider, Toggle } from './Controls';
import { DEFAULT_DESIGN, FILTER_PRESETS, GRADIENT_PRESETS, RADIUS_PRESETS, SHADOW_PRESETS, nextId } from '../lib/defaults';
import { gradientValue } from '../lib/serialize';

export interface PanelProps {
  design: Design;
  update: (patch: (current: Design) => Design, group?: string) => void;
  commit: () => void;
  t: any;
  activeStop: string | null;
  setActiveStop: (id: string | null) => void;
  activeLayer: string | null;
  setActiveLayer: (id: string | null) => void;
}

const label = (t: any, key: string, fallback: string): string => t[key] || fallback;

const PresetGrid: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <div className="space-y-2">
    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-1.5">{children}</div>
  </div>
);

const presetButton =
  'px-2.5 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-left truncate bg-slate-900/30 border-white/5 text-slate-400 hover:bg-violet-600/15 hover:border-violet-500/30 hover:text-white';

// ===========================================================================
// Glassmorphism
// ===========================================================================

const GlassPanel: React.FC<PanelProps> = ({ design, update, commit, t }) => {
  const g = design.glass;
  const set = (patch: Partial<Design['glass']>, group?: string) =>
    update(d => ({ ...d, glass: { ...d.glass, ...patch } }), group);

  return (
    <div className="space-y-5">
      <Slider label={label(t, 'backdrop_blur', 'Backdrop Blur')} value={g.blur} min={0} max={60} step={1} suffix="px" defaultValue={DEFAULT_DESIGN.glass.blur} onChange={v => set({ blur: v }, 'glass.blur')} onCommit={commit} />
      <Slider label={label(t, 'bg_opacity', 'Background Opacity')} value={g.opacity} min={0} max={1} step={0.01} defaultValue={DEFAULT_DESIGN.glass.opacity} onChange={v => set({ opacity: v }, 'glass.opacity')} onCommit={commit} />
      <Slider label={label(t, 'saturation', 'Saturation')} value={g.saturation} min={0} max={300} step={5} suffix="%" defaultValue={DEFAULT_DESIGN.glass.saturation} onChange={v => set({ saturation: v }, 'glass.sat')} onCommit={commit} />
      <Slider label={label(t, 'glass_brightness', 'Brightness')} value={g.brightness} min={40} max={200} step={1} suffix="%" defaultValue={DEFAULT_DESIGN.glass.brightness} onChange={v => set({ brightness: v }, 'glass.bright')} onCommit={commit} />
      <Slider label={label(t, 'border_width', 'Border Width')} value={g.borderWidth} min={0} max={8} step={1} suffix="px" defaultValue={DEFAULT_DESIGN.glass.borderWidth} onChange={v => set({ borderWidth: v }, 'glass.bw')} onCommit={commit} />
      <Slider label={label(t, 'border_opacity', 'Border Opacity')} value={g.borderOpacity} min={0} max={1} step={0.01} defaultValue={DEFAULT_DESIGN.glass.borderOpacity} onChange={v => set({ borderOpacity: v }, 'glass.bo')} onCommit={commit} />
      <Slider label={label(t, 'corner_radius', 'Corner Radius')} value={g.radius} min={0} max={80} step={1} suffix="px" defaultValue={DEFAULT_DESIGN.glass.radius} onChange={v => set({ radius: v }, 'glass.r')} onCommit={commit} />
      <Slider label={label(t, 'glass_shadow', 'Drop shadow')} value={g.shadowStrength} min={0} max={1} step={0.01} defaultValue={DEFAULT_DESIGN.glass.shadowStrength} onChange={v => set({ shadowStrength: v }, 'glass.sh')} onCommit={commit} />

      <Toggle
        label={label(t, 'glass_highlight', 'Inner highlight')}
        hint={label(t, 'glass_highlight_hint', 'The 1px light line along the top edge')}
        checked={g.innerHighlight}
        onChange={v => {
          set({ innerHighlight: v });
          commit();
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ColorField label={label(t, 'bg_color', 'Background Color')} value={g.bgColor} onChange={v => set({ bgColor: v }, 'glass.bgc')} onCommit={commit} pickLabel={t.pick_from_screen} />
        <ColorField label={label(t, 'border_color', 'Border Color')} value={g.borderColor} onChange={v => set({ borderColor: v }, 'glass.bc')} onCommit={commit} pickLabel={t.pick_from_screen} />
      </div>
    </div>
  );
};

// ===========================================================================
// Box shadow
// ===========================================================================

const ShadowPanel: React.FC<PanelProps> = ({ design, update, commit, t, activeLayer, setActiveLayer }) => {
  const s = design.shadow;
  const selected = s.layers.find(l => l.id === activeLayer) || s.layers[0];

  const setShadow = (patch: Partial<Design['shadow']>, group?: string) =>
    update(d => ({ ...d, shadow: { ...d.shadow, ...patch } }), group);

  const setLayer = (id: string, patch: Partial<ShadowLayer>, group?: string) =>
    update(
      d => ({
        ...d,
        shadow: { ...d.shadow, layers: d.shadow.layers.map(l => (l.id === id ? { ...l, ...patch } : l)) },
      }),
      group
    );

  const addLayer = () => {
    const created: ShadowLayer = { id: nextId('s'), enabled: true, inset: false, x: 0, y: 8, blur: 16, spread: -2, color: '#0b0716', opacity: 0.3 };
    update(d => ({ ...d, shadow: { ...d.shadow, layers: [...d.shadow.layers, created] } }));
    setActiveLayer(created.id);
    commit();
  };

  const duplicate = (layer: ShadowLayer) => {
    const copy = { ...layer, id: nextId('s') };
    update(d => ({
      ...d,
      shadow: { ...d.shadow, layers: [...d.shadow.layers.slice(0, d.shadow.layers.indexOf(layer) + 1), copy, ...d.shadow.layers.slice(d.shadow.layers.indexOf(layer) + 1)] },
    }));
    setActiveLayer(copy.id);
    commit();
  };

  const remove = (id: string) => {
    update(d => ({ ...d, shadow: { ...d.shadow, layers: d.shadow.layers.filter(l => l.id !== id) } }));
    if (activeLayer === id) setActiveLayer(null);
    commit();
  };

  return (
    <div className="space-y-5">
      <PresetGrid title={label(t, 'presets', 'Presets')}>
        {SHADOW_PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            className={presetButton}
            onClick={() => {
              const layers = preset.layers.map(l => ({ ...l, id: nextId('s') }));
              setShadow({ layers, ...(preset.cardBg ? { cardBg: preset.cardBg } : {}) });
              setActiveLayer(layers[0].id);
              commit();
            }}
          >
            {label(t, preset.key, preset.fallback)}
          </button>
        ))}
      </PresetGrid>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label(t, 'shadow_layers', 'Shadow layers')}
          </span>
          <button
            type="button"
            onClick={addLayer}
            className="flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300 cursor-pointer bg-transparent border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            {label(t, 'add_layer', 'Add layer')}
          </button>
        </div>

        <div className="space-y-1.5">
          {s.layers.map((layer, i) => (
            <div
              key={layer.id}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${
                selected?.id === layer.id ? 'bg-violet-600/10 border-violet-500/30' : 'bg-slate-950/40 border-white/5'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveLayer(layer.id)}
                className="flex-1 min-w-0 flex items-center gap-2 text-left bg-transparent border-none cursor-pointer p-0"
              >
                <span className="w-4 h-4 shrink-0 rounded border border-white/20" style={{ backgroundColor: layer.color, opacity: Math.max(0.25, layer.opacity) }} />
                <span className="text-[11px] font-mono text-slate-400 truncate">
                  {layer.inset ? 'inset ' : ''}
                  {layer.x} {layer.y} {layer.blur} {layer.spread}
                </span>
              </button>
              <button type="button" aria-label={`${label(t, 'layer', 'Layer')} ${i + 1}`} onClick={() => { setLayer(layer.id, { enabled: !layer.enabled }); commit(); }} className="shrink-0 text-slate-500 hover:text-violet-300 cursor-pointer bg-transparent border-none p-0.5">
                {layer.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button type="button" aria-label={label(t, 'duplicate', 'Duplicate')} onClick={() => duplicate(layer)} className="shrink-0 text-slate-500 hover:text-violet-300 cursor-pointer bg-transparent border-none p-0.5">
                <Copy className="w-3.5 h-3.5" />
              </button>
              {s.layers.length > 1 && (
                <button type="button" aria-label={label(t, 'remove_stop', 'Remove')} onClick={() => remove(layer.id)} className="shrink-0 text-slate-500 hover:text-rose-400 cursor-pointer bg-transparent border-none p-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="space-y-5 rounded-2xl border border-white/5 bg-slate-900/20 p-4">
          <Toggle label={label(t, 'inset_shadow', 'Inset Shadow')} checked={selected.inset} onChange={v => { setLayer(selected.id, { inset: v }); commit(); }} />
          <Slider label={label(t, 'offset_x', 'Offset X')} value={selected.x} min={-80} max={80} step={1} suffix="px" onChange={v => setLayer(selected.id, { x: v }, 'sh.x')} onCommit={commit} />
          <Slider label={label(t, 'offset_y', 'Offset Y')} value={selected.y} min={-80} max={80} step={1} suffix="px" onChange={v => setLayer(selected.id, { y: v }, 'sh.y')} onCommit={commit} />
          <Slider label={label(t, 'shadow_blur', 'Shadow Blur')} value={selected.blur} min={0} max={160} step={1} suffix="px" onChange={v => setLayer(selected.id, { blur: v }, 'sh.b')} onCommit={commit} />
          <Slider label={label(t, 'spread_radius', 'Spread Radius')} value={selected.spread} min={-60} max={60} step={1} suffix="px" onChange={v => setLayer(selected.id, { spread: v }, 'sh.s')} onCommit={commit} />
          <Slider label={label(t, 'shadow_opacity', 'Shadow Opacity')} value={selected.opacity} min={0} max={1} step={0.01} onChange={v => setLayer(selected.id, { opacity: v }, 'sh.o')} onCommit={commit} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ColorField label={label(t, 'shadow_color', 'Shadow Color')} value={selected.color} onChange={v => setLayer(selected.id, { color: v }, 'sh.c')} onCommit={commit} pickLabel={t.pick_from_screen} />
            <ColorField label={label(t, 'bg_color', 'Background Color')} value={s.cardBg} onChange={v => setShadow({ cardBg: v }, 'sh.bg')} onCommit={commit} pickLabel={t.pick_from_screen} />
          </div>
          <Slider label={label(t, 'corner_radius', 'Corner Radius')} value={s.radius} min={0} max={100} step={1} suffix="px" defaultValue={DEFAULT_DESIGN.shadow.radius} onChange={v => setShadow({ radius: v }, 'sh.r')} onCommit={commit} />
        </div>
      )}
    </div>
  );
};

// ===========================================================================
// Gradient
// ===========================================================================

const GradientPanel: React.FC<PanelProps> = ({ design, update, commit, t, activeStop, setActiveStop }) => {
  const g = design.gradient;
  const selected = g.stops.find(s => s.id === activeStop) || g.stops[0];

  const setGradient = (patch: Partial<GradientState>, group?: string) =>
    update(d => ({ ...d, gradient: { ...d.gradient, ...patch } }), group);

  const setStop = (id: string, patch: Partial<GradientState['stops'][number]>, group?: string) =>
    update(
      d => ({ ...d, gradient: { ...d.gradient, stops: d.gradient.stops.map(s => (s.id === id ? { ...s, ...patch } : s)) } }),
      group
    );

  const addStop = (position: number) => {
    const sorted = [...g.stops].sort((a, b) => a.position - b.position);
    const after = sorted.filter(s => s.position <= position).pop() || sorted[0];
    const created = { id: nextId('g'), color: after.color, position, opacity: after.opacity };
    update(d => ({ ...d, gradient: { ...d.gradient, stops: [...d.gradient.stops, created] } }));
    setActiveStop(created.id);
    commit();
  };

  const removeStop = (id: string) => {
    if (g.stops.length <= 2) return;
    update(d => ({ ...d, gradient: { ...d.gradient, stops: d.gradient.stops.filter(s => s.id !== id) } }));
    if (activeStop === id) setActiveStop(null);
    commit();
  };

  const barPreview = gradientValue({ ...g, kind: 'linear', angle: 90, repeating: false }, 'hex', false);

  return (
    <div className="space-y-5">
      <PresetGrid title={label(t, 'presets', 'Presets')}>
        {GRADIENT_PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            className={presetButton}
            onClick={() => {
              const stops = preset.stops.map(s => ({ ...s, id: nextId('g') }));
              setGradient({ stops, angle: preset.angle, kind: preset.kind || 'linear' });
              setActiveStop(stops[0].id);
              commit();
            }}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded shrink-0 border border-white/20"
                style={{ backgroundImage: `linear-gradient(135deg, ${preset.stops.map(s => s.color).join(', ')})` }}
              />
              <span className="truncate">{label(t, preset.key, preset.fallback)}</span>
            </span>
          </button>
        ))}
      </PresetGrid>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Segmented
          label={label(t, 'gradient_type', 'Gradient Type')}
          value={g.kind}
          options={[
            { id: 'linear', label: label(t, 'linear', 'Linear') },
            { id: 'radial', label: label(t, 'radial', 'Radial') },
            { id: 'conic', label: label(t, 'conic', 'Conic') },
          ]}
          onChange={v => {
            setGradient({ kind: v });
            commit();
          }}
        />
        <Segmented
          label={label(t, 'interpolation', 'Interpolation')}
          value={g.interpolation}
          options={[
            { id: 'srgb', label: 'sRGB' },
            { id: 'oklab', label: 'OKLab' },
            { id: 'oklch', label: 'OKLCH' },
          ]}
          onChange={v => {
            setGradient({ interpolation: v });
            commit();
          }}
        />
      </div>

      <Toggle
        label={label(t, 'repeating', 'Repeating')}
        hint={label(t, 'repeating_hint', 'Tiles the stop list instead of stretching it')}
        checked={g.repeating}
        onChange={v => {
          setGradient({ repeating: v });
          commit();
        }}
      />

      {g.kind !== 'radial' && (
        <Slider
          label={label(t, 'gradient_angle', 'Angle (Degrees)')}
          value={g.angle}
          min={0}
          max={360}
          step={1}
          suffix="°"
          defaultValue={135}
          onChange={v => setGradient({ angle: v }, 'gr.a')}
          onCommit={commit}
        />
      )}

      {g.kind !== 'linear' && (
        <div className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/20 p-4">
          {g.kind === 'radial' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Segmented
                label={label(t, 'radial_shape', 'Shape')}
                value={g.shape}
                options={[
                  { id: 'circle', label: label(t, 'circle', 'Circle') },
                  { id: 'ellipse', label: label(t, 'ellipse', 'Ellipse') },
                ]}
                onChange={v => {
                  setGradient({ shape: v });
                  commit();
                }}
              />
              <Segmented
                label={label(t, 'radial_size', 'Size')}
                value={g.size}
                wrap
                options={[
                  { id: 'closest-side', label: 'closest-side' },
                  { id: 'farthest-side', label: 'farthest-side' },
                  { id: 'closest-corner', label: 'closest-corner' },
                  { id: 'farthest-corner', label: 'farthest-corner' },
                ]}
                onChange={v => {
                  setGradient({ size: v });
                  commit();
                }}
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Slider label={label(t, 'center_x', 'Center X')} value={g.posX} min={0} max={100} step={1} suffix="%" defaultValue={50} onChange={v => setGradient({ posX: v }, 'gr.x')} onCommit={commit} />
            <Slider label={label(t, 'center_y', 'Center Y')} value={g.posY} min={0} max={100} step={1} suffix="%" defaultValue={50} onChange={v => setGradient({ posY: v }, 'gr.y')} onCommit={commit} />
          </div>
        </div>
      )}

      <GradientBar
        label={label(t, 'color_stops', 'Color Stops')}
        stops={g.stops}
        activeId={selected?.id || null}
        preview={barPreview}
        onSelect={setActiveStop}
        onMove={(id, position) => setStop(id, { position }, `gr.stop.${id}`)}
        onAdd={addStop}
        onRemove={removeStop}
        onCommit={commit}
      />
      <p className="text-[11px] text-slate-500 -mt-2">
        {label(t, 'stops_hint', 'Click the bar to add a stop, drag to move it, Alt-click or right-click to remove it.')}
      </p>

      {selected && (
        <div className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/20 p-4">
          <ColorField label={label(t, 'stop_color', 'Stop colour')} value={selected.color} onChange={v => setStop(selected.id, { color: v }, 'gr.c')} onCommit={commit} pickLabel={t.pick_from_screen} />
          <Slider label={label(t, 'position', 'Position')} value={selected.position} min={0} max={100} step={1} suffix="%" onChange={v => setStop(selected.id, { position: v }, 'gr.p')} onCommit={commit} />
          <Slider label={label(t, 'stop_opacity', 'Stop opacity')} value={selected.opacity} min={0} max={1} step={0.01} onChange={v => setStop(selected.id, { opacity: v }, 'gr.o')} onCommit={commit} />
        </div>
      )}
    </div>
  );
};

// ===========================================================================
// Border radius
// ===========================================================================

const RadiusPanel: React.FC<PanelProps> = ({ design, update, commit, t }) => {
  const r = design.radius;
  const set = (patch: Partial<Design['radius']>, group?: string) =>
    update(d => ({ ...d, radius: { ...d.radius, ...patch } }), group);

  const setCorner = (corner: 'tl' | 'tr' | 'br' | 'bl', value: number) => {
    if (r.linked) set({ tl: value, tr: value, br: value, bl: value }, 'rad.all');
    else set({ [corner]: value } as Partial<Design['radius']>, `rad.${corner}`);
  };

  const max = r.unit === '%' ? 50 : 200;

  return (
    <div className="space-y-5">
      <Segmented
        label={label(t, 'radius_mode', 'Mode')}
        value={r.organic ? 'organic' : 'corners'}
        options={[
          { id: 'corners', label: label(t, 'corner_radius', 'Corner Radius') },
          { id: 'organic', label: label(t, 'fancy_radius', 'Organic shape') },
        ]}
        onChange={v => {
          set({ organic: v === 'organic' });
          commit();
        }}
      />

      {!r.organic ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle label={label(t, 'link_corners', 'Link corners')} checked={r.linked} onChange={v => { set({ linked: v }); commit(); }} />
            <Segmented
              label={label(t, 'unit', 'Unit')}
              value={r.unit}
              options={[
                { id: 'px', label: 'px' },
                { id: '%', label: '%' },
              ]}
              onChange={v => {
                set({ unit: v, tl: Math.min(r.tl, v === '%' ? 50 : 200), tr: Math.min(r.tr, v === '%' ? 50 : 200), br: Math.min(r.br, v === '%' ? 50 : 200), bl: Math.min(r.bl, v === '%' ? 50 : 200) });
                commit();
              }}
            />
          </div>
          <Slider label={label(t, 'top_left', 'Top-Left')} value={r.tl} min={0} max={max} step={1} suffix={r.unit} onChange={v => setCorner('tl', v)} onCommit={commit} />
          {!r.linked && (
            <>
              <Slider label={label(t, 'top_right', 'Top-Right')} value={r.tr} min={0} max={max} step={1} suffix={r.unit} onChange={v => setCorner('tr', v)} onCommit={commit} />
              <Slider label={label(t, 'bottom_right', 'Bottom-Right')} value={r.br} min={0} max={max} step={1} suffix={r.unit} onChange={v => setCorner('br', v)} onCommit={commit} />
              <Slider label={label(t, 'bottom_left', 'Bottom-Left')} value={r.bl} min={0} max={max} step={1} suffix={r.unit} onChange={v => setCorner('bl', v)} onCommit={commit} />
            </>
          )}
        </>
      ) : (
        <>
          <PresetGrid title={label(t, 'presets', 'Presets')}>
            {RADIUS_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  set({ organicValue: preset.value });
                  commit();
                }}
                className={`${presetButton} ${r.organicValue === preset.value ? '!bg-violet-600/20 !border-violet-500/50 !text-white' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 shrink-0 bg-violet-400/70" style={{ borderRadius: preset.value }} />
                  <span className="truncate">{label(t, preset.key, preset.fallback)}</span>
                </span>
              </button>
            ))}
          </PresetGrid>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cd-organic" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {label(t, 'manual_shape', 'Manual shape (CSS)')}
            </label>
            <input
              id="cd-organic"
              type="text"
              value={r.organicValue}
              spellCheck={false}
              onChange={e => set({ organicValue: e.target.value }, 'rad.org')}
              onBlur={commit}
              className="bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-violet-300 focus:outline-none focus:border-violet-500"
            />
          </div>
        </>
      )}

      <ColorField label={label(t, 'bg_color', 'Background Color')} value={r.fill} onChange={v => set({ fill: v }, 'rad.f')} onCommit={commit} pickLabel={t.pick_from_screen} />
    </div>
  );
};

// ===========================================================================
// Filters
// ===========================================================================

const FilterPanel: React.FC<PanelProps> = ({ design, update, commit, t }) => {
  const f = design.filter;
  const set = (patch: Partial<Design['filter']>, group?: string) =>
    update(d => ({ ...d, filter: { ...d.filter, ...patch } }), group);

  return (
    <div className="space-y-5">
      <PresetGrid title={label(t, 'presets', 'Presets')}>
        {FILTER_PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            className={presetButton}
            onClick={() => {
              set(preset.patch);
              commit();
            }}
          >
            {label(t, preset.key, preset.fallback)}
          </button>
        ))}
      </PresetGrid>

      <Toggle
        label={label(t, 'as_backdrop', 'Apply as backdrop-filter')}
        hint={label(t, 'as_backdrop_hint', 'Filters what is behind the element instead of the element itself')}
        checked={f.backdrop}
        onChange={v => {
          set({ backdrop: v });
          commit();
        }}
      />

      <Slider label={label(t, 'filter_blur', 'Blur')} value={f.blur} min={0} max={40} step={0.5} suffix="px" defaultValue={0} onChange={v => set({ blur: v }, 'f.b')} onCommit={commit} />
      <Slider label={label(t, 'filter_brightness', 'Brightness')} value={f.brightness} min={0} max={250} step={1} suffix="%" defaultValue={100} onChange={v => set({ brightness: v }, 'f.br')} onCommit={commit} />
      <Slider label={label(t, 'filter_contrast', 'Contrast')} value={f.contrast} min={0} max={250} step={1} suffix="%" defaultValue={100} onChange={v => set({ contrast: v }, 'f.c')} onCommit={commit} />
      <Slider label={label(t, 'saturation', 'Saturation')} value={f.saturate} min={0} max={300} step={1} suffix="%" defaultValue={100} onChange={v => set({ saturate: v }, 'f.s')} onCommit={commit} />
      <Slider label={label(t, 'filter_hue', 'Hue rotate')} value={f.hueRotate} min={0} max={360} step={1} suffix="°" defaultValue={0} onChange={v => set({ hueRotate: v }, 'f.h')} onCommit={commit} />
      <Slider label={label(t, 'filter_grayscale', 'Grayscale')} value={f.grayscale} min={0} max={100} step={1} suffix="%" defaultValue={0} onChange={v => set({ grayscale: v }, 'f.g')} onCommit={commit} />
      <Slider label={label(t, 'filter_sepia', 'Sepia')} value={f.sepia} min={0} max={100} step={1} suffix="%" defaultValue={0} onChange={v => set({ sepia: v }, 'f.se')} onCommit={commit} />
      <Slider label={label(t, 'filter_invert', 'Invert')} value={f.invert} min={0} max={100} step={1} suffix="%" defaultValue={0} onChange={v => set({ invert: v }, 'f.i')} onCommit={commit} />
      <Slider label={label(t, 'filter_opacity', 'Opacity')} value={f.opacity} min={0} max={100} step={1} suffix="%" defaultValue={100} onChange={v => set({ opacity: v }, 'f.o')} onCommit={commit} />

      <Toggle label={label(t, 'filter_drop_shadow', 'Drop shadow')} checked={f.dropShadowOn} onChange={v => { set({ dropShadowOn: v }); commit(); }} />
      {f.dropShadowOn && (
        <div className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/20 p-4">
          <Slider label={label(t, 'offset_x', 'Offset X')} value={f.dropShadowX} min={-40} max={40} step={1} suffix="px" onChange={v => set({ dropShadowX: v }, 'f.dx')} onCommit={commit} />
          <Slider label={label(t, 'offset_y', 'Offset Y')} value={f.dropShadowY} min={-40} max={40} step={1} suffix="px" onChange={v => set({ dropShadowY: v }, 'f.dy')} onCommit={commit} />
          <Slider label={label(t, 'shadow_blur', 'Shadow Blur')} value={f.dropShadowBlur} min={0} max={60} step={1} suffix="px" onChange={v => set({ dropShadowBlur: v }, 'f.db')} onCommit={commit} />
          <ColorField label={label(t, 'shadow_color', 'Shadow Color')} value={f.dropShadowColor} onChange={v => set({ dropShadowColor: v }, 'f.dc')} onCommit={commit} pickLabel={t.pick_from_screen} />
        </div>
      )}
    </div>
  );
};

// ===========================================================================

const PANELS: Record<TabId, React.FC<PanelProps>> = {
  glass: GlassPanel,
  shadow: ShadowPanel,
  gradient: GradientPanel,
  radius: RadiusPanel,
  filter: FilterPanel,
};

export const Panel: React.FC<PanelProps & { tab: TabId }> = ({ tab, ...props }) => {
  const Component = PANELS[tab];
  return <Component {...props} />;
};
