// Pestaña "Estilo": temas listos (cada uno pintado como el cartel de verdad),
// colores y los efectos del texto y de la tarjeta.
import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import type { WatermarkConfig } from '../../types';
import { BadgePreview, ColorField, Section, Segmented, Slider, Toggle, type Tr } from './ui';

interface Props {
  config: WatermarkConfig;
  onChange: (c: WatermarkConfig) => void;
  channelName: string;
  tr: Tr;
}

type Tema = Partial<WatermarkConfig> & { id: string };

const TEMAS: Tema[] = [
  { id: 'twitch', bgColor: '#9146FF', textColor: '#ffffff', bgOpacity: 0.9, shadow: true, glowMode: false, shadowColor: 'rgba(0,0,0,0.7)', stroke: false, boxBorder: false, borderRadius: 8 },
  { id: 'dark', bgColor: '#0e0e10', textColor: '#ffffff', bgOpacity: 0.75, shadow: false, glowMode: false, stroke: false, boxBorder: true, boxBorderColor: '#9146FF', boxBorderWidth: 2, borderRadius: 10 },
  { id: 'neon', bgColor: '#05050a', textColor: '#00f3ff', bgOpacity: 0.85, shadow: true, glowMode: true, shadowColor: '#00f3ff', shadowBlur: 14, stroke: false, boxBorder: false, borderRadius: 8 },
  { id: 'gold', bgColor: '#14120a', textColor: '#ffd700', bgOpacity: 0.9, shadow: false, glowMode: false, stroke: true, strokeColor: '#000000', strokeWidth: 2, boxBorder: true, boxBorderColor: '#ffd700', boxBorderWidth: 2, borderRadius: 6 },
  { id: 'clean', bgColor: '#ffffff', textColor: '#0e0e10', bgOpacity: 0.95, shadow: false, glowMode: false, stroke: false, boxBorder: false, borderRadius: 999 },
  { id: 'red', bgColor: '#ff0055', textColor: '#ffffff', bgOpacity: 0.9, shadow: true, glowMode: true, shadowColor: '#ff0055', shadowBlur: 12, stroke: false, boxBorder: false, borderRadius: 4 },
  { id: 'outline', bgColor: '#000000', textColor: '#ffffff', bgOpacity: 0, shadow: false, glowMode: false, stroke: true, strokeColor: '#9146FF', strokeWidth: 4, boxBorder: false, borderRadius: 8 },
  { id: 'glass', bgColor: '#ffffff', textColor: '#ffffff', bgOpacity: 0.18, shadow: true, glowMode: false, shadowColor: 'rgba(0,0,0,0.6)', stroke: false, boxBorder: true, boxBorderColor: '#ffffff', boxBorderWidth: 1, borderRadius: 12 },
  { id: 'lime', bgColor: '#53FC18', textColor: '#000000', bgOpacity: 0.95, shadow: false, glowMode: false, stroke: false, boxBorder: false, borderRadius: 4 },
];

const StylePanel: React.FC<Props> = ({ config, onChange, channelName, tr }) => {
  const set = (parche: Partial<WatermarkConfig>) => onChange({ ...config, ...parche });
  const temaActivo = TEMAS.find(t => t.bgColor === config.bgColor && t.textColor === config.textColor && t.bgOpacity === config.bgOpacity)?.id;

  return (
    <div className="space-y-6">
      <Section title={tr('wm_styles', 'Ready-made styles')}>
        <div className="grid grid-cols-1 @2xs:grid-cols-2 gap-2">
          {TEMAS.map(({ id, ...tema }) => {
            const activo = temaActivo === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => set(tema)}
                aria-pressed={activo}
                className={`relative h-14 rounded-xl border flex items-center justify-center px-2 overflow-hidden transition-all cursor-pointer active:scale-[0.98] bg-[linear-gradient(135deg,#2a2438,#0d0b12)] ${
                  activo ? 'border-twitch ring-1 ring-twitch/40' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <BadgePreview config={{ ...config, ...tema }} channelName={channelName} size={13} />
                {activo && <Check className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-twitch" />}
              </button>
            );
          })}
        </div>
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
