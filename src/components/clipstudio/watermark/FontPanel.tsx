// Pestaña "Letra": cada tipografía se enseña escribiendo el propio cartel con
// ella, agrupadas por estilo, y debajo el tamaño y los retoques.
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { FontCategory, FontWeight, TextTransform, WatermarkConfig } from '../types';
import { FONT_CATALOG, formatWatermarkText, getFontCss } from '../watermarkService';
import { Section, Segmented, Slider, type Tr } from './ui';

interface Props {
  config: WatermarkConfig;
  onChange: (c: WatermarkConfig) => void;
  channelName: string;
  tr: Tr;
}

const FontPanel: React.FC<Props> = ({ config, onChange, channelName, tr }) => {
  const [cat, setCat] = useState<FontCategory | 'all'>('all');
  const muestra = formatWatermarkText(config, channelName) || channelName;
  const peso = config.fontWeight === '900' ? 900 : config.fontWeight === 'normal' ? 400 : 700;

  const cats: { id: FontCategory | 'all'; label: string }[] = [
    { id: 'all', label: tr('wm_fontcat_all', 'All') },
    { id: 'gaming', label: tr('wm_fontcat_gaming', 'Gaming') },
    { id: 'bold', label: tr('wm_fontcat_bold', 'Bold') },
    { id: 'clean', label: tr('wm_fontcat_clean', 'Clean') },
    { id: 'fun', label: tr('wm_fontcat_fun', 'Fun') },
    { id: 'hand', label: tr('wm_fontcat_hand', 'Handwritten') },
  ];
  const lista = cat === 'all' ? FONT_CATALOG : FONT_CATALOG.filter(f => f.cat === cat);

  return (
    <div className="space-y-6">
      <Section title={tr('wm_font', 'Font')}>
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
          {cats.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              aria-pressed={cat === c.id}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                cat === c.id ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/25'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {lista.map(f => {
            const activa = config.fontFamily === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ ...config, fontFamily: f.id })}
                aria-pressed={activa}
                className={`relative h-[74px] rounded-xl border px-3 pt-2 pb-1.5 flex flex-col justify-between text-left overflow-hidden transition-all cursor-pointer active:scale-[0.98] ${
                  activa ? 'bg-twitch/15 border-twitch ring-1 ring-twitch/40' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/25'
                }`}
              >
                <span
                  className="block w-full truncate text-white text-xl leading-tight pt-1"
                  style={{ fontFamily: getFontCss(f.id), fontWeight: peso, fontStyle: config.fontStyle || 'normal' }}
                >
                  {muestra}
                </span>
                <span className={`text-[10px] font-bold truncate ${activa ? 'text-twitch' : 'text-gray-500'}`}>{f.name}</span>
                {activa && <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-twitch" />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={tr('wm_weight', 'Weight')}>
        <Segmented<FontWeight>
          value={config.fontWeight || 'bold'}
          onChange={v => onChange({ ...config, fontWeight: v })}
          options={[
            { id: 'normal', label: <span style={{ fontWeight: 400 }}>{tr('wm_weight_normal', 'Normal')}</span> },
            { id: 'bold', label: <span style={{ fontWeight: 700 }}>{tr('wm_weight_bold', 'Bold')}</span> },
            { id: '900', label: <span style={{ fontWeight: 900 }}>{tr('wm_weight_black', 'Black')}</span> },
          ]}
        />
        <Segmented<'normal' | 'italic'>
          value={config.fontStyle || 'normal'}
          onChange={v => onChange({ ...config, fontStyle: v })}
          options={[
            { id: 'normal', label: tr('wm_style_upright', 'Upright') },
            { id: 'italic', label: <span className="italic">{tr('wm_italic', 'Italic')}</span> },
          ]}
        />
      </Section>

      <Section title={tr('wm_case', 'Letter case')}>
        <Segmented<TextTransform>
          value={config.textTransform || 'none'}
          onChange={v => onChange({ ...config, textTransform: v })}
          options={[
            { id: 'none', label: 'Aa' },
            { id: 'uppercase', label: 'AA' },
            { id: 'lowercase', label: 'aa' },
            { id: 'capitalize', label: 'Aa Bb' },
          ]}
        />
      </Section>

      <div className="space-y-4 pt-1">
        <Slider label={tr('wm_size', 'Size')} value={config.fontSize} min={14} max={72} unit="px" onChange={v => onChange({ ...config, fontSize: v })} />
        <Slider label={tr('wm_kerning', 'Letter spacing')} value={config.letterSpacing || 0} min={0} max={10} unit="px" onChange={v => onChange({ ...config, letterSpacing: v })} />
      </div>
    </div>
  );
};

export default FontPanel;
