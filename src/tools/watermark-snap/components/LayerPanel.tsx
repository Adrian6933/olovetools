import React from 'react';
import {
  ChevronDown, ChevronUp, Copy, Eye, EyeOff, Grid3x3, Image as ImageIcon,
  Move, Plus, Trash2, Type,
} from 'lucide-react';
import type { Layer, LogoAsset, Placement, TextLayer } from '../types';
import { ANCHORS, BLEND_MODES, FONT_OPTIONS, FONT_WEIGHTS, PRESET_IDS, type PresetId } from '../lib/layers';
import { ColorField, FieldLabel, Section, Segmented, Slider, Toggle } from './Fields';
import { PresetThumb } from './Illustrations';

interface LayerPanelProps {
  layers: Layer[];
  assets: Map<string, LogoAsset>;
  selectedId: string | null;
  t: any;
  onSelect: (id: string) => void;
  onAddText: () => void;
  onAddLogo: () => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (id: string, direction: -1 | 1) => void;
  /** Cambio en vivo (sin entrada en el historial). */
  onPatch: (id: string, patch: Partial<Layer>) => void;
  /** Cierra el cambio y lo guarda en el historial. */
  onCommit: () => void;
  onPreset: (id: string, preset: PresetId) => void;
}

const ANCHOR_TITLES: Record<string, string> = {
  'top-left': '↖', 'top-center': '↑', 'top-right': '↗',
  'mid-left': '←', center: '•', 'mid-right': '→',
  'bottom-left': '↙', 'bottom-center': '↓', 'bottom-right': '↘',
};

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers, assets, selectedId, t,
  onSelect, onAddText, onAddLogo, onRemove, onDuplicate, onReorder, onPatch, onCommit, onPreset,
}) => {
  const layer = layers.find(l => l.id === selectedId) || null;
  const text = layer?.kind === 'text' ? (layer as TextLayer) : null;

  const patch = (p: Partial<Layer>) => layer && onPatch(layer.id, p as Partial<Layer>);
  const patchText = (p: Partial<TextLayer>) => layer && onPatch(layer.id, p as Partial<Layer>);

  return (
    <div className="flex flex-col gap-4">
      {/* --------------------------------------------------------------- */}
      {/* Lista de capas                                                   */}
      {/* --------------------------------------------------------------- */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t.layersTitle || 'Watermark layers'}
          </span>
          <div className="flex gap-1">
            <button
              onClick={onAddText}
              title={t.addTextLayer || 'Add text layer'}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-[10px] font-black uppercase text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
            >
              <Type className="w-3 h-3" />
              <Plus className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={onAddLogo}
              title={t.addLogoLayer || 'Add logo layer'}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-[10px] font-black uppercase text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
            >
              <ImageIcon className="w-3 h-3" />
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {layers.length === 0 ? (
          <p className="text-[11px] text-slate-500 leading-relaxed bg-black/20 border border-dashed border-white/10 rounded-xl p-3">
            {t.noLayersHint || 'No watermark yet. Add a text or logo layer to begin.'}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {layers.map((l, index) => {
              const active = l.id === selectedId;
              const label = l.kind === 'text' ? (l as TextLayer).text || '—' : assets.get(l.assetId)?.name || 'logo';
              return (
                <div
                  key={l.id}
                  onClick={() => onSelect(l.id)}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    active ? 'border-amber-500/60 bg-amber-500/10' : 'border-white/10 bg-black/20 hover:border-white/25'
                  }`}
                >
                  <button
                    onClick={e => { e.stopPropagation(); onPatch(l.id, { visible: !l.visible }); onCommit(); }}
                    title={t.toggleVisibility || 'Show / hide'}
                    className="p-1 rounded-md text-slate-400 hover:text-white bg-transparent border-none cursor-pointer transition-colors"
                  >
                    {l.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                  {l.kind === 'text' ? (
                    <Type className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                  ) : (
                    <ImageIcon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                  )}
                  <span className="flex-1 min-w-0 truncate text-[11px] font-bold text-white">{label}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); onReorder(l.id, -1); }}
                      disabled={index === 0}
                      title={t.moveDown || 'Move down'}
                      className="p-1 rounded-md text-slate-500 hover:text-white disabled:opacity-20 bg-transparent border-none cursor-pointer transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onReorder(l.id, 1); }}
                      disabled={index === layers.length - 1}
                      title={t.moveUp || 'Move up'}
                      className="p-1 rounded-md text-slate-500 hover:text-white disabled:opacity-20 bg-transparent border-none cursor-pointer transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDuplicate(l.id); }}
                      title={t.duplicateLayer || 'Duplicate'}
                      className="p-1 rounded-md text-slate-500 hover:text-amber-400 bg-transparent border-none cursor-pointer transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onRemove(l.id); }}
                      title={t.deleteLayer || 'Delete'}
                      className="p-1 rounded-md text-slate-500 hover:text-red-400 bg-transparent border-none cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!layer ? null : (
        <>
          {/* ------------------------------------------------------------- */}
          {/* Contenido                                                      */}
          {/* ------------------------------------------------------------- */}
          {text && (
            <Section title={t.sectionContent || 'Content'}>
              <input
                type="text"
                value={text.text}
                onChange={e => patchText({ text: e.target.value })}
                onBlur={onCommit}
                placeholder={t.textPlaceholder || '© Your Brand'}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/60 transition-colors"
              />

              <div className="grid grid-cols-4 gap-1.5">
                {PRESET_IDS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => onPreset(layer.id, preset)}
                    title={t[`preset_${preset}`] || preset}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-lg border border-white/10 bg-black/20 hover:border-amber-500/50 hover:bg-amber-500/5 text-slate-400 hover:text-amber-300 transition-all cursor-pointer"
                  >
                    <PresetThumb preset={preset} className="w-full h-auto" />
                    <span className="text-[8px] font-black uppercase tracking-wider truncate w-full text-center">
                      {t[`preset_${preset}`] || preset}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <FieldLabel>{t.labelFont || 'Font'}</FieldLabel>
                  <select
                    value={text.fontFamily}
                    onChange={e => { patchText({ fontFamily: e.target.value }); onCommit(); }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-amber-500/60 cursor-pointer"
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <FieldLabel>{t.labelWeight || 'Weight'}</FieldLabel>
                  <select
                    value={text.fontWeight}
                    onChange={e => { patchText({ fontWeight: parseInt(e.target.value, 10) }); onCommit(); }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-amber-500/60 cursor-pointer"
                  >
                    {FONT_WEIGHTS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Toggle label={t.labelItalic || 'Italic'} checked={text.italic} onChange={v => { patchText({ italic: v }); onCommit(); }} />
              </div>

              <Slider
                label={t.labelTracking || 'Letter spacing'}
                value={text.letterSpacing}
                min={-10} max={60} step={1} unit="%"
                onChange={v => patchText({ letterSpacing: v })}
                onCommit={onCommit}
              />

              <ColorField label={t.labelColor || 'Colour'} value={text.color} onChange={v => patchText({ color: v })} onCommit={onCommit} />
            </Section>
          )}

          {/* ------------------------------------------------------------- */}
          {/* Colocación                                                     */}
          {/* ------------------------------------------------------------- */}
          <Section title={t.sectionPlacement || 'Placement'}>
            <Segmented<Placement>
              value={layer.placement}
              onChange={v => { patch({ placement: v }); onCommit(); }}
              options={[
                { value: 'anchor', label: t.placeAnchor || 'Anchor', icon: <Grid3x3 className="w-3 h-3" /> },
                { value: 'free', label: t.placeFree || 'Free', icon: <Move className="w-3 h-3" /> },
                { value: 'tile', label: t.placeTile || 'Tile', icon: <Grid3x3 className="w-3 h-3" /> },
              ]}
            />

            {layer.placement === 'anchor' && (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {ANCHORS.map(a => (
                    <button
                      key={a}
                      onClick={() => { patch({ anchor: a }); onCommit(); }}
                      title={t[`anchor_${a}`] || a}
                      aria-label={t[`anchor_${a}`] || a}
                      className={`aspect-[2/1] flex items-center justify-center rounded-lg border text-sm font-black transition-all cursor-pointer ${
                        layer.anchor === a
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                          : 'border-white/10 bg-black/20 text-slate-500 hover:border-white/30 hover:text-slate-300'
                      }`}
                    >
                      {ANCHOR_TITLES[a]}
                    </button>
                  ))}
                </div>
                <Slider
                  label={t.labelMargin || 'Margin'}
                  value={layer.margin}
                  min={0} max={25} step={0.5} unit="%"
                  hint={t.hintMargin || 'Distance to the edge, as a percentage of the short side.'}
                  onChange={v => patch({ margin: v })}
                  onCommit={onCommit}
                />
              </>
            )}

            {layer.placement === 'free' && (
              <p className="flex items-start gap-2 text-[11px] text-slate-400 bg-white/5 border border-white/5 rounded-xl p-2.5 leading-relaxed">
                <Move className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{t.freeHint || 'Drag the watermark straight on the canvas. Arrow keys nudge it, Shift + arrows move it faster.'}</span>
              </p>
            )}

            {layer.placement === 'tile' && (
              <>
                <Slider label={t.labelTileAngle || 'Grid angle'} value={layer.tile.angle} min={-90} max={90} unit="°"
                  onChange={v => patch({ tile: { ...layer.tile, angle: v } })} onCommit={onCommit} />
                <Slider label={t.labelTileGapX || 'Horizontal gap'} value={layer.tile.gapX} min={0} max={400} step={5} unit="%"
                  onChange={v => patch({ tile: { ...layer.tile, gapX: v } })} onCommit={onCommit} />
                <Slider label={t.labelTileGapY || 'Vertical gap'} value={layer.tile.gapY} min={0} max={400} step={5} unit="%"
                  onChange={v => patch({ tile: { ...layer.tile, gapY: v } })} onCommit={onCommit} />
                <Toggle label={t.labelStagger || 'Brick offset'} checked={layer.tile.stagger}
                  onChange={v => { patch({ tile: { ...layer.tile, stagger: v } }); onCommit(); }} />
              </>
            )}
          </Section>

          {/* ------------------------------------------------------------- */}
          {/* Aspecto                                                        */}
          {/* ------------------------------------------------------------- */}
          <Section title={t.sectionAppearance || 'Appearance'}>
            <Slider
              label={layer.kind === 'text' ? (t.labelSize || 'Size') : (t.labelLogoSize || 'Logo size')}
              value={layer.scale}
              min={0.5} max={layer.kind === 'text' ? 40 : 100} step={0.5} unit="%"
              hint={t.hintSize || 'Relative to the image width, so a whole batch of different sizes comes out consistent.'}
              onChange={v => patch({ scale: v })}
              onCommit={onCommit}
            />
            <Slider label={t.labelOpacity || 'Opacity'} value={Math.round(layer.opacity * 100)} min={0} max={100} unit="%"
              onChange={v => patch({ opacity: v / 100 })} onCommit={onCommit} />
            <Slider label={t.labelRotation || 'Rotation'} value={layer.rotation} min={-180} max={180} unit="°"
              onChange={v => patch({ rotation: v })} onCommit={onCommit} />

            <div className="flex flex-col gap-1">
              <FieldLabel hint={t.hintBlend || 'How the watermark mixes with the photo underneath.'}>
                {t.labelBlend || 'Blend mode'}
              </FieldLabel>
              <select
                value={layer.blend}
                onChange={e => { patch({ blend: e.target.value as Layer['blend'] }); onCommit(); }}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-amber-500/60 cursor-pointer"
              >
                {BLEND_MODES.map(m => (
                  <option key={m} value={m}>{t[`blend_${m}`] || m}</option>
                ))}
              </select>
            </div>
          </Section>

          {/* ------------------------------------------------------------- */}
          {/* Legibilidad (solo texto)                                       */}
          {/* ------------------------------------------------------------- */}
          {text && (
            <Section title={t.sectionLegibility || 'Legibility'}>
              <p className="text-[10px] text-slate-500 leading-relaxed -mt-1">
                {t.legibilityHint || 'Plain white text disappears over a bright sky. An outline, a shadow or a plate keeps it readable on any photo.'}
              </p>

              <Toggle label={t.labelStroke || 'Outline'} checked={text.stroke.enabled}
                onChange={v => { patchText({ stroke: { ...text.stroke, enabled: v } }); onCommit(); }} />
              {text.stroke.enabled && (
                <div className="pl-4 border-l border-white/5 flex flex-col gap-2">
                  <Slider label={t.labelStrokeWidth || 'Thickness'} value={text.stroke.width} min={1} max={20} unit="%"
                    onChange={v => patchText({ stroke: { ...text.stroke, width: v } })} onCommit={onCommit} />
                  <ColorField label={t.labelStrokeColor || 'Outline colour'} value={text.stroke.color}
                    onChange={v => patchText({ stroke: { ...text.stroke, color: v } })} onCommit={onCommit} />
                </div>
              )}

              <Toggle label={t.labelShadow || 'Shadow'} checked={text.shadow.enabled}
                onChange={v => { patchText({ shadow: { ...text.shadow, enabled: v } }); onCommit(); }} />
              {text.shadow.enabled && (
                <div className="pl-4 border-l border-white/5 flex flex-col gap-2">
                  <Slider label={t.labelShadowBlur || 'Blur'} value={text.shadow.blur} min={0} max={60} unit="%"
                    onChange={v => patchText({ shadow: { ...text.shadow, blur: v } })} onCommit={onCommit} />
                  <Slider label={t.labelShadowOffset || 'Offset'} value={text.shadow.offset} min={-20} max={20} unit="%"
                    onChange={v => patchText({ shadow: { ...text.shadow, offset: v } })} onCommit={onCommit} />
                  <ColorField label={t.labelShadowColor || 'Shadow colour'} value={text.shadow.color} alpha
                    onChange={v => patchText({ shadow: { ...text.shadow, color: v } })} onCommit={onCommit} />
                </div>
              )}

              <Toggle label={t.labelPlate || 'Background plate'} checked={text.plate.enabled}
                onChange={v => { patchText({ plate: { ...text.plate, enabled: v } }); onCommit(); }} />
              {text.plate.enabled && (
                <div className="pl-4 border-l border-white/5 flex flex-col gap-2">
                  <Slider label={t.labelPlatePadX || 'Horizontal padding'} value={text.plate.padX} min={0} max={120} step={2} unit="%"
                    onChange={v => patchText({ plate: { ...text.plate, padX: v } })} onCommit={onCommit} />
                  <Slider label={t.labelPlatePadY || 'Vertical padding'} value={text.plate.padY} min={0} max={120} step={2} unit="%"
                    onChange={v => patchText({ plate: { ...text.plate, padY: v } })} onCommit={onCommit} />
                  <Slider label={t.labelPlateRadius || 'Corner radius'} value={text.plate.radius} min={0} max={50} unit="%"
                    onChange={v => patchText({ plate: { ...text.plate, radius: v } })} onCommit={onCommit} />
                  <ColorField label={t.labelPlateColor || 'Plate colour'} value={text.plate.color} alpha
                    onChange={v => patchText({ plate: { ...text.plate, color: v } })} onCommit={onCommit} />
                </div>
              )}
            </Section>
          )}
        </>
      )}
    </div>
  );
};

export default LayerPanel;
