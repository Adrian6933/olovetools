import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  FlipHorizontal,
  Grid,
  Image as ImageIcon,
  Layers,
  Lock,
  Plus,
  Smile,
  Sliders,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react';
import type { Layer, StickerLayer, TextLayer } from '../types';
import type { MemeDocApi } from '../lib/useMemeDoc';
import { STICKER_LIST, STICKERS } from '../lib/stickers';
import { TEMPLATES } from '../lib/templates';
import { FONTS, isFontAvailable, SUPPORTS_LETTER_SPACING } from '../lib/text';
import { makeSticker, makeText, nextCaptionY } from '../lib/doc';

export type InspectorTab = 'background' | 'text' | 'stickers' | 'canvas';

interface InspectorProps {
  api: MemeDocApi;
  t: any;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  tab: InspectorTab;
  setTab: (tab: InspectorTab) => void;
  templateId: string | null;
  onPickTemplate: (id: string) => void;
  onRequestUpload: () => void;
  onBlankCanvas: (ratio: number) => void;
  children?: React.ReactNode;
}

const RATIOS: { id: string; label: string; ratio: number }[] = [
  { id: 'square', label: '1:1', ratio: 1 },
  { id: 'portrait', label: '4:5', ratio: 4 / 5 },
  { id: 'story', label: '9:16', ratio: 9 / 16 },
  { id: 'wide', label: '16:9', ratio: 16 / 9 },
];

export const Inspector: React.FC<InspectorProps> = ({
  api,
  t,
  selectedId,
  onSelect,
  tab,
  setTab,
  templateId,
  onPickTemplate,
  onRequestUpload,
  onBlankCanvas,
  children,
}) => {
  const { doc } = api;
  const selected = doc.layers.find(l => l.id === selectedId) || null;
  const activeText = selected?.kind === 'text' ? (selected as TextLayer) : null;
  const activeSticker = selected?.kind === 'sticker' ? (selected as StickerLayer) : null;

  const addText = () => {
    const layer = makeText(t.newCaption || 'New caption', 50, nextCaptionY(doc));
    api.mutate(d => ({ ...d, layers: [...d.layers, layer] }));
    onSelect(layer.id);
    setTab('text');
  };

  const addSticker = (id: string) => {
    const layer = makeSticker(id);
    api.mutate(d => ({ ...d, layers: [...d.layers, layer] }));
    onSelect(layer.id);
  };

  const move = (id: string, delta: number) => {
    api.mutate(d => {
      const index = d.layers.findIndex(l => l.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= d.layers.length) return d;
      const layers = [...d.layers];
      const [item] = layers.splice(index, 1);
      layers.splice(target, 0, item);
      return { ...d, layers };
    });
  };

  const remove = (id: string) => {
    api.mutate(d => ({ ...d, layers: d.layers.filter(l => l.id !== id) }));
    if (selectedId === id) onSelect(null);
  };

  const TABS: { key: InspectorTab; label: string; icon: any }[] = [
    { key: 'background', label: t.tabBackground || 'Background', icon: Grid },
    { key: 'text', label: t.tabText || 'Text', icon: Type },
    { key: 'stickers', label: t.tabStickers || 'Stickers', icon: Smile },
    { key: 'canvas', label: t.tabCanvas || 'Canvas', icon: Sliders },
  ];

  return (
    <div className="flex flex-col gap-5 min-w-0">
      <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
        {TABS.map(item => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`py-2 px-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-1.5 min-w-0 ${
                active ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {tab === 'background' && (
        <div className="flex flex-col gap-5">
          {children}

          <Section title={t.templatesTitle || 'Templates'}>
            <div className="grid grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => onPickTemplate(tpl.id)}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer bg-black/30 hover:border-fuchsia-500/40 flex flex-col gap-1.5 text-left ${
                    templateId === tpl.id ? 'border-fuchsia-500 bg-fuchsia-500/5' : 'border-white/5'
                  }`}
                >
                  <span
                    className="w-full aspect-square overflow-hidden bg-black/60 rounded-lg [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover"
                    dangerouslySetInnerHTML={{ __html: tpl.svg }}
                  />
                  <span className="text-[9px] font-bold text-slate-300 truncate">
                    {t[`tpl_${tpl.id}`] || tpl.name}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title={t.ownImageTitle || 'Your own picture'}>
            <button
              onClick={onRequestUpload}
              className="w-full border-2 border-dashed border-white/15 hover:border-fuchsia-500/50 bg-black/20 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-black/40 text-center"
            >
              <ImageIcon className="w-5 h-5 text-fuchsia-400" />
              <span className="text-[11px] font-bold text-slate-300">{t.uploadCta || 'Choose a picture'}</span>
              <span className="text-[10px] text-slate-500">{t.uploadFormats || 'PNG · JPG · WebP · GIF · AVIF · HEIC'}</span>
            </button>
          </Section>

          <Section title={t.blankTitle || 'Start from a blank canvas'} hint={t.blankHint || 'No template, no preset caption — you place everything.'}>
            <div className="grid grid-cols-4 gap-2">
              {RATIOS.map(r => (
                <button
                  key={r.id}
                  onClick={() => onBlankCanvas(r.ratio)}
                  className="py-2 rounded-lg border border-white/10 bg-white/5 text-[11px] font-black text-slate-300 hover:border-fuchsia-500/40 hover:text-white transition-colors cursor-pointer"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {tab === 'text' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.captionsTitle || 'Captions'}</span>
            <button
              onClick={addText}
              className="py-1 px-2.5 bg-fuchsia-500/10 border border-fuchsia-500/30 hover:bg-fuchsia-500 text-fuchsia-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              {t.addCaption || 'Add'}
            </button>
          </div>

          <LayerList
            layers={doc.layers}
            kind="text"
            selectedId={selectedId}
            onSelect={onSelect}
            onMove={move}
            onRemove={remove}
            onToggleLock={id => {
              const layer = doc.layers.find(l => l.id === id);
              if (layer) api.patchLayer(id, { locked: !layer.locked });
            }}
            emptyLabel={t.noCaptions || 'No captions yet.'}
            t={t}
          />

          {activeText ? (
            <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
              <Field label={t.wording || 'Wording'}>
                <textarea
                  value={activeText.text}
                  rows={2}
                  onChange={e => api.patchLayer(activeText.id, { text: e.target.value } as Partial<Layer>)}
                  placeholder={t.wordingPlaceholder || 'Type your caption. Enter adds a line break.'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none transition-colors resize-y"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t.font || 'Font'}>
                  <select
                    value={activeText.fontFamily}
                    onChange={e => api.patchLayer(activeText.id, { fontFamily: e.target.value } as Partial<Layer>)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-fuchsia-500 outline-none cursor-pointer"
                  >
                    {FONTS.map(font => (
                      <option key={font.id} value={font.id}>
                        {font.label}
                        {isFontAvailable(font.probe) ? '' : ` · ${t.fontMissing || 'not on this device'}`}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t.alignment || 'Alignment'}>
                  <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
                    {([
                      ['left', AlignLeft],
                      ['center', AlignCenter],
                      ['right', AlignRight],
                    ] as const).map(([value, Icon]) => (
                      <button
                        key={value}
                        onClick={() => api.patchLayer(activeText.id, { align: value } as Partial<Layer>)}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          activeText.align === value ? 'bg-fuchsia-500 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {!isFontAvailable(FONTS.find(f => f.id === activeText.fontFamily)?.probe || '') && (
                <p className="text-[10px] leading-relaxed text-amber-400/90 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                  {t.fontFallbackWarning ||
                    'This device does not ship that font, so the browser substitutes a similar one. The export will match what you see here.'}
                </p>
              )}

              <Slider
                label={t.fontSize || 'Size'}
                value={activeText.fontSize}
                min={1}
                max={30}
                step={0.2}
                suffix="%"
                api={api}
                onInput={v => api.patchLayer(activeText.id, { fontSize: v } as Partial<Layer>, true)}
              />
              <Slider
                label={t.boxWidth || 'Wrap width'}
                value={activeText.boxWidth}
                min={10}
                max={100}
                step={1}
                suffix="%"
                api={api}
                onInput={v => api.patchLayer(activeText.id, { boxWidth: v } as Partial<Layer>, true)}
              />
              <Slider
                label={t.lineHeight || 'Line height'}
                value={activeText.lineHeight}
                min={0.7}
                max={2}
                step={0.05}
                api={api}
                onInput={v => api.patchLayer(activeText.id, { lineHeight: v } as Partial<Layer>, true)}
              />

              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label={t.textColor || 'Text'}
                  value={activeText.color}
                  onChange={v => api.patchLayer(activeText.id, { color: v } as Partial<Layer>)}
                />
                <ColorField
                  label={t.strokeColor || 'Outline'}
                  value={activeText.strokeColor}
                  onChange={v => api.patchLayer(activeText.id, { strokeColor: v } as Partial<Layer>)}
                />
              </div>

              <Slider
                label={t.strokeWidth || 'Outline thickness'}
                value={activeText.strokeWidth}
                min={0}
                max={22}
                step={0.5}
                api={api}
                onInput={v => api.patchLayer(activeText.id, { strokeWidth: v } as Partial<Layer>, true)}
              />
              <Slider
                label={t.shadow || 'Drop shadow'}
                value={activeText.shadow}
                min={0}
                max={40}
                step={1}
                api={api}
                onInput={v => api.patchLayer(activeText.id, { shadow: v } as Partial<Layer>, true)}
              />
              {SUPPORTS_LETTER_SPACING && (
                <Slider
                  label={t.letterSpacing || 'Letter spacing'}
                  value={activeText.letterSpacing}
                  min={-0.1}
                  max={0.4}
                  step={0.01}
                  api={api}
                  onInput={v => api.patchLayer(activeText.id, { letterSpacing: v } as Partial<Layer>, true)}
                />
              )}
              <Slider
                label={t.rotation || 'Rotation'}
                value={activeText.rotation}
                min={-180}
                max={180}
                step={1}
                suffix="°"
                api={api}
                onInput={v => api.patchLayer(activeText.id, { rotation: v } as Partial<Layer>, true)}
              />
              <Slider
                label={t.opacity || 'Opacity'}
                value={Math.round(activeText.opacity * 100)}
                min={10}
                max={100}
                step={1}
                suffix="%"
                api={api}
                onInput={v => api.patchLayer(activeText.id, { opacity: v / 100 } as Partial<Layer>, true)}
              />

              <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={activeText.uppercase}
                  onChange={e => api.patchLayer(activeText.id, { uppercase: e.target.checked } as Partial<Layer>)}
                  className="accent-fuchsia-500 w-3.5 h-3.5"
                />
                {t.uppercase || 'All caps'}
              </label>
            </div>
          ) : (
            <Empty label={t.selectCaption || 'Pick a caption to edit its typography.'} />
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {tab === 'stickers' && (
        <div className="flex flex-col gap-5">
          <Section title={t.stickerPalette || 'Click to add'}>
            <div className="grid grid-cols-5 gap-2">
              {STICKER_LIST.map(def => (
                <button
                  key={def.id}
                  onClick={() => addSticker(def.id)}
                  title={t[`sticker_${def.id}`] || def.name}
                  className="aspect-square bg-black/40 hover:bg-fuchsia-500/10 border border-white/5 hover:border-fuchsia-500/40 rounded-xl flex items-center justify-center p-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <span
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: def.svg.split('%COLOR%').join('#e879f9') }}
                  />
                </button>
              ))}
            </div>
          </Section>

          <LayerList
            layers={doc.layers}
            kind="sticker"
            selectedId={selectedId}
            onSelect={onSelect}
            onMove={move}
            onRemove={remove}
            onToggleLock={id => {
              const layer = doc.layers.find(l => l.id === id);
              if (layer) api.patchLayer(id, { locked: !layer.locked });
            }}
            emptyLabel={t.noStickers || 'No stickers placed yet.'}
            t={t}
          />

          {activeSticker && (
            <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
              <Slider
                label={t.stickerSize || 'Size'}
                value={activeSticker.size}
                min={3}
                max={160}
                step={1}
                suffix="%"
                api={api}
                onInput={v => api.patchLayer(activeSticker.id, { size: v } as Partial<Layer>, true)}
              />
              <Slider
                label={t.rotation || 'Rotation'}
                value={activeSticker.rotation}
                min={-180}
                max={180}
                step={1}
                suffix="°"
                api={api}
                onInput={v => api.patchLayer(activeSticker.id, { rotation: v } as Partial<Layer>, true)}
              />
              <Slider
                label={t.opacity || 'Opacity'}
                value={Math.round(activeSticker.opacity * 100)}
                min={10}
                max={100}
                step={1}
                suffix="%"
                api={api}
                onInput={v => api.patchLayer(activeSticker.id, { opacity: v / 100 } as Partial<Layer>, true)}
              />

              <div className="flex items-end gap-3">
                {STICKERS[activeSticker.sticker]?.tintable && (
                  <ColorField
                    label={t.stickerColor || 'Colour'}
                    value={activeSticker.color}
                    onChange={v => api.patchLayer(activeSticker.id, { color: v } as Partial<Layer>)}
                  />
                )}
                <button
                  onClick={() => api.patchLayer(activeSticker.id, { flipX: !activeSticker.flipX } as Partial<Layer>)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    activeSticker.flipX
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  {t.flip || 'Flip'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {tab === 'canvas' && (
        <div className="flex flex-col gap-5">
          <Section
            title={t.captionBarTitle || 'Meme caption bar'}
            hint={t.captionBarHint || 'The classic white strip above the picture. 0 turns it off.'}
          >
            <Slider
              label={t.captionBarHeight || 'Bar height'}
              value={doc.captionBar}
              min={0}
              max={40}
              step={1}
              suffix="%"
              api={api}
              onInput={v => api.setDoc(d => ({ ...d, captionBar: v }))}
            />
            <ColorField
              label={t.barColor || 'Bar colour'}
              value={doc.padColor}
              onChange={v => api.mutate(d => ({ ...d, padColor: v }))}
            />
          </Section>

          <Section title={t.fitTitle || 'Picture fit'}>
            <div className="grid grid-cols-3 gap-2">
              {(['cover', 'contain', 'stretch'] as const).map(fit => (
                <button
                  key={fit}
                  onClick={() => api.mutate(d => ({ ...d, fit }))}
                  className={`py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    doc.fit === fit
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {t[`fit_${fit}`] || fit}
                </button>
              ))}
            </div>
          </Section>

          <Section title={t.ratioTitle || 'Canvas shape'}>
            <div className="grid grid-cols-4 gap-2">
              {RATIOS.map(r => (
                <button
                  key={r.id}
                  onClick={() =>
                    api.mutate(d => ({ ...d, height: Math.round(d.width / r.ratio) }))
                  }
                  className="py-2 rounded-lg border border-white/10 bg-white/5 text-[11px] font-black text-slate-300 hover:border-fuchsia-500/40 hover:text-white transition-colors cursor-pointer"
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-medium tabular-nums">
              {t.canvasSize || 'Canvas'}: {doc.width} × {doc.height + Math.round((doc.height * doc.captionBar) / 100)} px
            </p>
          </Section>

          <Section title={t.layerOrderTitle || 'All layers'} hint={t.layerOrderHint || 'The last one in the list sits on top.'}>
            <LayerList
              layers={doc.layers}
              selectedId={selectedId}
              onSelect={onSelect}
              onMove={move}
              onRemove={remove}
              onToggleLock={id => {
                const layer = doc.layers.find(l => l.id === id);
                if (layer) api.patchLayer(id, { locked: !layer.locked });
              }}
              emptyLabel={t.noLayers || 'Nothing on the canvas yet.'}
              t={t}
            />
          </Section>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <div className="flex flex-col gap-2.5">
    <div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      {hint && <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{hint}</p>}
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1.5 min-w-0">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const Empty: React.FC<{ label: string }> = ({ label }) => (
  <div className="border border-white/5 border-dashed rounded-xl py-6 px-4 text-center text-xs text-slate-600 font-medium bg-black/10">
    {label}
  </div>
);

/**
 * Range input wired to the history: dragging updates the document without
 * pushing entries, and releasing commits a single undo step for the whole sweep.
 */
const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  api: MemeDocApi;
  onInput: (value: number) => void;
}> = ({ label, value, min, max, step, suffix = '', api, onInput }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
      <span className="truncate">{label}</span>
      <span className="text-fuchsia-400 font-mono tabular-nums shrink-0">
        {Number.isInteger(value) ? value : value.toFixed(2)}
        {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onPointerDown={api.begin}
      onChange={e => onInput(parseFloat(e.target.value))}
      onPointerUp={api.commit}
      onKeyUp={api.commit}
      onBlur={api.commit}
      className="w-full accent-fuchsia-500 cursor-pointer"
    />
  </div>
);

const ColorField: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <Field label={label}>
    <div className="flex gap-2 items-center min-w-0">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-8 h-8 shrink-0 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-center text-xs text-white uppercase outline-none focus:border-fuchsia-500"
      />
    </div>
  </Field>
);

const LayerList: React.FC<{
  layers: Layer[];
  kind?: Layer['kind'];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onToggleLock: (id: string) => void;
  emptyLabel: string;
  t: any;
}> = ({ layers, kind, selectedId, onSelect, onMove, onRemove, onToggleLock, emptyLabel, t }) => {
  const list = kind ? layers.filter(l => l.kind === kind) : layers;
  if (list.length === 0) return <Empty label={emptyLabel} />;

  return (
    <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
      {list.map(layer => {
        const active = layer.id === selectedId;
        const label =
          layer.kind === 'text'
            ? layer.text.split('\n')[0] || (t.emptyCaption || '(empty)')
            : t[`sticker_${layer.sticker}`] || STICKERS[layer.sticker]?.name || layer.sticker;
        return (
          <div
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className={`flex items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer min-w-0 ${
              active ? 'bg-fuchsia-500/5 border-fuchsia-500/50 text-white' : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/10'
            }`}
          >
            {layer.kind === 'text' ? (
              <Type className="w-3 h-3 shrink-0 text-fuchsia-400/70" />
            ) : (
              <Layers className="w-3 h-3 shrink-0 text-fuchsia-400/70" />
            )}
            <span className="text-[11px] font-bold truncate flex-1 min-w-0">{label}</span>
            <IconBtn onClick={() => onMove(layer.id, -1)} label={t.sendBackward || 'Send backward'}>
              <ArrowDown className="w-3 h-3" />
            </IconBtn>
            <IconBtn onClick={() => onMove(layer.id, 1)} label={t.bringForward || 'Bring forward'}>
              <ArrowUp className="w-3 h-3" />
            </IconBtn>
            <IconBtn onClick={() => onToggleLock(layer.id)} label={t.lockLayer || 'Lock layer'}>
              {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </IconBtn>
            <IconBtn onClick={() => onRemove(layer.id)} label={t.deleteLayer || 'Delete'} danger>
              <Trash2 className="w-3 h-3" />
            </IconBtn>
          </div>
        );
      })}
    </div>
  );
};

const IconBtn: React.FC<{ onClick: () => void; label: string; danger?: boolean; children: React.ReactNode }> = ({
  onClick,
  label,
  danger,
  children,
}) => (
  <button
    onClick={e => {
      e.stopPropagation();
      onClick();
    }}
    title={label}
    aria-label={label}
    className={`p-1 rounded transition-colors shrink-0 cursor-pointer ${
      danger ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-500 hover:text-white hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

export default Inspector;
