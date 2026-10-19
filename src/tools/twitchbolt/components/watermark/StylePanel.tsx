// Pestaña "Estilo": temas listos (cada uno pintado como el cartel de verdad),
// colores y los efectos del texto y de la tarjeta.
import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import type { TextEffect, WatermarkConfig } from '../../types';
import { BadgePreview, ColorField, Section, Segmented, Slider, Toggle, type Tr } from './ui';

interface Props {
  config: WatermarkConfig;
  onChange: (c: WatermarkConfig) => void;
  channelName: string;
  tr: Tr;
}

type Tema = Partial<WatermarkConfig> & { id: string };

const TEMAS_FONDO: Tema[] = [
  { id: 'twitch', bgColor: '#9146FF', textColor: '#ffffff', bgOpacity: 0.9, shadow: true, glowMode: false, shadowColor: 'rgba(0,0,0,0.7)', stroke: false, boxBorder: false, borderRadius: 8, textEffect: 'none' },
  { id: 'dark', bgColor: '#0e0e10', textColor: '#ffffff', bgOpacity: 0.75, shadow: false, glowMode: false, stroke: false, boxBorder: true, boxBorderColor: '#9146FF', boxBorderWidth: 2, borderRadius: 10, textEffect: 'none' },
  { id: 'neon', bgColor: '#05050a', textColor: '#00f3ff', bgOpacity: 0.85, shadow: true, glowMode: true, shadowColor: '#00f3ff', shadowBlur: 14, stroke: false, boxBorder: false, borderRadius: 8, textEffect: 'none' },
  { id: 'gold', bgColor: '#14120a', textColor: '#ffd700', bgOpacity: 0.9, shadow: false, glowMode: false, stroke: true, strokeColor: '#000000', strokeWidth: 2, boxBorder: true, boxBorderColor: '#ffd700', boxBorderWidth: 2, borderRadius: 6, textEffect: 'none' },
  { id: 'clean', bgColor: '#ffffff', textColor: '#0e0e10', bgOpacity: 0.95, shadow: false, glowMode: false, stroke: false, boxBorder: false, borderRadius: 999, textEffect: 'none' },
  { id: 'red', bgColor: '#ff0055', textColor: '#ffffff', bgOpacity: 0.9, shadow: true, glowMode: true, shadowColor: '#ff0055', shadowBlur: 12, stroke: false, boxBorder: false, borderRadius: 4, textEffect: 'none' },
  { id: 'outline', bgColor: '#000000', textColor: '#ffffff', bgOpacity: 0, shadow: false, glowMode: false, stroke: true, strokeColor: '#9146FF', strokeWidth: 4, boxBorder: false, borderRadius: 8, textEffect: 'none' },
  { id: 'glass', bgColor: '#ffffff', textColor: '#ffffff', bgOpacity: 0.18, shadow: true, glowMode: false, shadowColor: 'rgba(0,0,0,0.6)', stroke: false, boxBorder: true, boxBorderColor: '#ffffff', boxBorderWidth: 1, borderRadius: 12, textEffect: 'none' },
  { id: 'lime', bgColor: '#53FC18', textColor: '#000000', bgOpacity: 0.95, shadow: false, glowMode: false, stroke: false, boxBorder: false, borderRadius: 4, textEffect: 'none' },
];

/**
 * Sin tarjeta detrás: solo las letras, con lo justo para leerse sobre
 * cualquier vídeo (contorno, sombra, brillo...). El icono se quita porque sin
 * fondo queda como un borrón suelto.
 */
const sinFondo = { bgOpacity: 0, boxBorder: false, showIcon: false } as const;
const TEMAS_TEXTO: Tema[] = [
  { id: 't-outline', ...sinFondo, textColor: '#ffffff', stroke: true, strokeColor: '#000000', strokeWidth: 4, strokeJoin: 'round', shadow: false, glowMode: false, textEffect: 'none', fontWeight: '900' },
  { id: 't-shadow', ...sinFondo, textColor: '#ffffff', stroke: false, shadow: true, glowMode: false, shadowColor: '#000000', shadowBlur: 6, shadowOffsetX: 3, shadowOffsetY: 3, textEffect: 'none', fontWeight: 'bold' },
  { id: 't-soft', ...sinFondo, textColor: '#ffffff', stroke: false, shadow: true, glowMode: true, shadowColor: '#000000', shadowBlur: 18, textEffect: 'none', fontWeight: 'bold' },
  { id: 't-yellow', ...sinFondo, textColor: '#ffe14d', stroke: true, strokeColor: '#000000', strokeWidth: 5, strokeJoin: 'round', shadow: false, glowMode: false, textEffect: 'none', fontWeight: '900' },
  { id: 't-neon', ...sinFondo, textColor: '#ffd6f6', stroke: false, shadow: true, glowMode: true, shadowColor: '#ff3fd2', shadowBlur: 22, textEffect: 'none', fontWeight: 'bold' },
  { id: 't-cyan', ...sinFondo, textColor: '#e6fdff', stroke: false, shadow: true, glowMode: true, shadowColor: '#00e5ff', shadowBlur: 22, textEffect: 'none', fontWeight: 'bold' },
  { id: 't-3d', ...sinFondo, textColor: '#ffffff', stroke: false, shadow: false, glowMode: false, textEffect: 'extrude', effectColor: '#9146FF', fontWeight: '900' },
  { id: 't-gradient', ...sinFondo, textColor: '#ffffff', stroke: true, strokeColor: '#000000', strokeWidth: 3, shadow: false, glowMode: false, textEffect: 'gradient', effectColor: '#b98bff', fontWeight: '900' },
  { id: 't-double', ...sinFondo, textColor: '#ffffff', stroke: false, shadow: false, glowMode: false, textEffect: 'double', effectColor: '#9146FF', strokeColor: '#000000', fontWeight: '900' },
  { id: 't-glitch', ...sinFondo, textColor: '#ffffff', stroke: false, shadow: false, glowMode: false, textEffect: 'glitch', fontWeight: '900' },
  { id: 't-underline', ...sinFondo, textColor: '#ffffff', stroke: false, shadow: true, glowMode: false, shadowColor: '#000000', shadowBlur: 4, shadowOffsetX: 2, shadowOffsetY: 2, textEffect: 'underline', effectColor: '#9146FF', fontWeight: 'bold' },
  { id: 't-minimal', ...sinFondo, textColor: '#ffffff', stroke: false, shadow: true, glowMode: false, shadowColor: 'rgba(0,0,0,0.55)', shadowBlur: 3, shadowOffsetX: 1, shadowOffsetY: 1, textEffect: 'none', fontWeight: 'normal' },
];

/** Un tema está puesto si todo lo que define coincide con la configuración. */
const coincide = (tema: Tema, c: WatermarkConfig) =>
  Object.entries(tema).every(([k, v]) => k === 'id' || (c as any)[k] === v);

const EFECTOS: { id: TextEffect; key: string; fb: string }[] = [
  { id: 'none', key: 'wm_tfx_none', fb: 'None' },
  { id: 'gradient', key: 'wm_tfx_gradient', fb: 'Gradient' },
  { id: 'extrude', key: 'wm_tfx_extrude', fb: '3D' },
  { id: 'double', key: 'wm_tfx_double', fb: 'Double outline' },
  { id: 'glitch', key: 'wm_tfx_glitch', fb: 'Glitch' },
  { id: 'underline', key: 'wm_tfx_underline', fb: 'Underline' },
];

/** Fondo de las muestras sin tarjeta: claros y oscuros, como un vídeo. */
const FONDO_FOTO = 'bg-[linear-gradient(120deg,#7c8aa5_0%,#2b2f3a_45%,#c9b8a0_100%)]';

const StylePanel: React.FC<Props> = ({ config, onChange, channelName, tr }) => {
  const set = (parche: Partial<WatermarkConfig>) => onChange({ ...config, ...parche });
  const temaActivo = [...TEMAS_TEXTO, ...TEMAS_FONDO].find(t => coincide(t, config))?.id;

  const rejilla = (temas: Tema[], fondo: string) => (
    <div className="grid grid-cols-2 gap-2">
      {temas.map(({ id, ...tema }) => {
        const activo = temaActivo === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => set(tema)}
            aria-pressed={activo}
            className={`relative h-14 rounded-xl border flex items-center justify-center px-2 overflow-hidden transition-all cursor-pointer active:scale-[0.98] ${fondo} ${
              activo ? 'border-twitch ring-1 ring-twitch/40' : 'border-white/10 hover:border-white/30'
            }`}
          >
            <BadgePreview config={{ ...config, ...tema }} channelName={channelName} size={14} />
            {activo && <Check className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-twitch" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <Section title={tr('wm_styles_text', 'Text only')}>
        {rejilla(TEMAS_TEXTO, FONDO_FOTO)}
      </Section>

      <Section title={tr('wm_styles', 'With background')}>
        {rejilla(TEMAS_FONDO, 'bg-[linear-gradient(135deg,#2a2438,#0d0b12)]')}
      </Section>

      <Section title={tr('wm_text_effect', 'Text effect')}>
        <div className="grid grid-cols-3 gap-2">
          {EFECTOS.map(e => {
            const activo = (config.textEffect || 'none') === e.id;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => set({ textEffect: e.id })}
                aria-pressed={activo}
                className={`rounded-xl border overflow-hidden transition-all cursor-pointer active:scale-[0.98] ${activo ? 'border-twitch ring-1 ring-twitch/40' : 'border-white/10 hover:border-white/30'}`}
              >
                <span className={`h-12 flex items-center justify-center ${FONDO_FOTO}`}>
                  <BadgePreview config={{ ...config, bgOpacity: 0, boxBorder: false, showIcon: false, textEffect: e.id }} channelName={channelName} size={15} text="Aa" />
                </span>
                <span className={`block px-1 py-1 text-[10px] font-bold truncate ${activo ? 'bg-twitch text-white' : 'bg-white/[0.03] text-gray-300'}`}>{tr(e.key, e.fb)}</span>
              </button>
            );
          })}
        </div>
        {config.textEffect && config.textEffect !== 'none' && config.textEffect !== 'glitch' && (
          <ColorField label={tr('wm_effect_color', 'Effect colour')} value={config.effectColor || '#9146FF'} onChange={v => set({ effectColor: v })} />
        )}
      </Section>

      <Section title={tr('wm_colors', 'Colours')}>
        <div className="grid grid-cols-1 @2xs:grid-cols-2 gap-2">
          <ColorField label={tr('wm_color_text', 'Text')} value={config.textColor} onChange={v => set({ textColor: v })} />
          <ColorField label={tr('wm_color_bg', 'Background')} value={config.bgColor} onChange={v => set({ bgColor: v })} />
        </div>
        <Slider label={tr('wm_bg_opacity', 'Background opacity')} value={Math.round(config.bgOpacity * 100)} min={0} max={100} unit="%" onChange={v => set({ bgOpacity: v / 100 })} />
        <Slider label={tr('wm_radius', 'Corner roundness')} value={Math.min(30, config.borderRadius)} min={0} max={30} unit="px" onChange={v => set({ borderRadius: v })} />
      </Section>

      <Section title={tr('wm_effects_text', 'Text effects')}>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          <Toggle label={tr('wm_stroke', 'Text outline')} checked={!!config.stroke} onChange={v => set({ stroke: v })} />
          {config.stroke && (
            <div className="grid grid-cols-1 @2xs:grid-cols-2 gap-3 items-end">
              <ColorField label={tr('wm_stroke_color', 'Outline colour')} value={config.strokeColor || '#000000'} onChange={v => set({ strokeColor: v })} />
              <Slider label={tr('wm_stroke_width', 'Width')} value={config.strokeWidth || 2} min={1} max={10} unit="px" onChange={v => set({ strokeWidth: v })} />
              <div className="@2xs:col-span-2">
                <Segmented<'round' | 'miter' | 'bevel'>
                  value={config.strokeJoin || 'round'}
                  onChange={v => set({ strokeJoin: v })}
                  options={[
                    { id: 'round', label: tr('wm_join_round', 'Rounded') },
                    { id: 'miter', label: tr('wm_join_miter', 'Sharp') },
                    { id: 'bevel', label: tr('wm_join_bevel', 'Bevelled') },
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          <Toggle label={tr('wm_shadow', 'Shadow')} checked={config.shadow} onChange={v => set({ shadow: v })} />
          {config.shadow && (
            <>
              <Segmented<'shadow' | 'glow'>
                value={config.glowMode ? 'glow' : 'shadow'}
                onChange={v => set({ glowMode: v === 'glow' })}
                options={[
                  { id: 'shadow', label: tr('wm_shadow_drop', 'Drop shadow') },
                  { id: 'glow', label: <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />{tr('wm_glow', 'Neon glow')}</span> },
                ]}
              />
              <ColorField
                label={tr('wm_shadow_color', 'Shadow colour')}
                value={config.shadowColor?.startsWith('#') ? config.shadowColor : '#000000'}
                onChange={v => set({ shadowColor: v })}
              />
              <Slider label={tr('wm_blur', 'Blur')} value={config.shadowBlur ?? 8} min={0} max={30} unit="px" onChange={v => set({ shadowBlur: v })} />
              {!config.glowMode && (
                <div className="grid grid-cols-2 gap-3">
                  <Slider label={tr('wm_offset_x', 'Offset X')} value={config.shadowOffsetX ?? 2} min={-15} max={15} unit="px" onChange={v => set({ shadowOffsetX: v })} />
                  <Slider label={tr('wm_offset_y', 'Offset Y')} value={config.shadowOffsetY ?? 2} min={-15} max={15} unit="px" onChange={v => set({ shadowOffsetY: v })} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          <Toggle label={tr('wm_box_border', 'Card border')} checked={!!config.boxBorder} onChange={v => set({ boxBorder: v })} />
          {config.boxBorder && (
            <div className="grid grid-cols-1 @2xs:grid-cols-2 gap-3 items-end">
              <ColorField label={tr('wm_box_border_color', 'Border colour')} value={config.boxBorderColor || '#ffffff'} onChange={v => set({ boxBorderColor: v })} />
              <Slider label={tr('wm_box_border_width', 'Border width')} value={config.boxBorderWidth || 2} min={1} max={8} unit="px" onChange={v => set({ boxBorderWidth: v })} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          <Toggle label={tr('wm_show_icon', 'Twitch icon')} checked={config.showIcon} onChange={v => set({ showIcon: v })} />
        </div>
      </Section>
    </div>
  );
};

export default StylePanel;
