// ============================================================================
// Qué pone el cartel
// ----------------------------------------------------------------------------
// Antes esto era un campo de texto crudo con "@{channel}" en letra de máquina:
// nadie sabía que {channel} era el nombre del streamer, ni que se rellenaba
// solo. Ahora el nombre es una pastilla que no se escribe: se elige un formato
// ya hecho o se escribe lo que va antes y después del nombre. La plantilla que
// se guarda sigue siendo la misma cadena con {channel}, así que las marcas que
// la gente ya tenía guardadas siguen valiendo.
// ============================================================================
import React, { useState } from 'react';
import { Check, PenLine, User, Wand2, AlertCircle } from 'lucide-react';
import type { WatermarkConfig } from './types';
import { CHANNEL_TOKEN } from './watermarkService';
import { useBrand } from './brand';

interface Props {
  config: WatermarkConfig;
  onChangeConfig: (c: WatermarkConfig) => void;
  channelName: string;
  /** Con la marca en todos los clips el nombre cambia de uno a otro. */
  multiClip?: boolean;
  tr: (clave: string, respaldo: string) => string;
}

/** Parte la plantilla en lo de antes del nombre, si lleva nombre y lo de después. */
const partir = (template: string) => {
  const i = template.indexOf(CHANNEL_TOKEN);
  if (i < 0) return { antes: template, conNombre: false, despues: '' };
  return { antes: template.slice(0, i), conNombre: true, despues: template.slice(i + CHANNEL_TOKEN.length) };
};

const WatermarkTextEditor: React.FC<Props> = ({ config, onChangeConfig, channelName, multiClip, tr }) => {
  const brand = useBrand();
  const follow = tr('wm_tpl_follow', 'FOLLOW');
  const formatos = [
    `@${CHANNEL_TOKEN}`,
    CHANNEL_TOKEN,
    `${brand.domain}/${CHANNEL_TOKEN}`,
    `LIVE: ${CHANNEL_TOKEN}`,
    `${follow} ${CHANNEL_TOKEN}`,
  ];

  const esFormato = formatos.includes(config.template);
  // El modo "lo escribo yo" se queda abierto aunque lo escrito coincida por
  // casualidad con un formato: si no, el campo desaparecería bajo los dedos.
  const [propio, setPropio] = useState(!esFormato);
  const { antes, conNombre, despues } = partir(config.template);

  const poner = (template: string) => onChangeConfig({ ...config, template });

  const cambiarConNombre = (incluir: boolean) => {
    if (incluir) {
      const base = antes.trim();
      poner(`${base}${base ? ' ' : ''}${CHANNEL_TOKEN}`);
    } else {
      poner(`${antes}${despues}`.trim());
    }
  };

  /** Una muestra con el nombre resaltado, para las tarjetas y el resultado. */
  const Muestra: React.FC<{ template: string; resaltar?: boolean }> = ({ template, resaltar = true }) => {
    const p = partir(template);
    return (
      <>
        {p.antes}
        {p.conNombre && (
          <span className={resaltar ? 'text-twitch' : undefined}>{channelName}</span>
        )}
        {p.despues}
      </>
    );
  };

  const vacio = !config.template.trim();

  return (
    <div className="space-y-4">
      <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">{tr('wm_text_title', 'What the watermark says')}</h4>
      {vacio && (
        <p className="flex items-center gap-2 text-xs font-bold text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {tr('wm_text_empty', 'Write something so the watermark shows up')}
        </p>
      )}

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-400">
        <Wand2 className="w-3.5 h-3.5 text-twitch shrink-0 mt-0.5" />
        <span>
          {multiClip
            ? tr('wm_text_auto_bulk', "Each clip gets its own streamer's name automatically — you don't have to type it.")
            : tr('wm_text_auto', "The streamer's name is filled in automatically from the clip — you don't have to type it.")}
        </span>
      </p>

      {/* Formatos hechos: se ven tal cual quedan, con el nombre ya puesto. */}
      <div className="grid grid-cols-1 @2xs:grid-cols-2 gap-2">
        {formatos.map(f => {
          const activo = !propio && config.template === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => { setPropio(false); poner(f); }}
              aria-pressed={activo}
              className={`relative min-w-0 px-3 py-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                activo
                  ? 'bg-twitch/15 border-twitch text-white ring-1 ring-twitch/40'
                  : 'bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.07] hover:border-white/20'
              }`}
            >
              <span className="block truncate pr-5"><Muestra template={f} /></span>
              {activo && <Check className="absolute top-1/2 -translate-y-1/2 right-2.5 w-3.5 h-3.5 text-twitch" />}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setPropio(true)}
          aria-pressed={propio}
          className={`px-3 py-3 rounded-xl border border-dashed text-xs font-black flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
            propio
              ? 'bg-twitch/15 border-twitch text-twitch'
              : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'
          }`}
        >
          <PenLine className="w-3.5 h-3.5 shrink-0" />
          {tr('wm_text_custom', 'Write my own')}
        </button>
      </div>

      {propio && (
        <div className="p-4 rounded-2xl border border-twitch/30 bg-twitch/[0.06] space-y-4 animate-fade-in">
          {conNombre ? (
            // Lo de antes · el nombre · lo de después. El nombre no se puede
            // borrar a mano: se quita con el interruptor de abajo.
            // Se ve como un solo campo de texto con el nombre ya metido en
            // medio: se escribe a su izquierda y a su derecha.
            <div>
              <div className="flex flex-col @2xs:flex-row @2xs:items-center gap-1.5 bg-dark-950 border border-white/10 rounded-xl p-1.5 focus-within:border-twitch transition-colors">
                <input
                  type="text"
                  value={antes}
                  onChange={e => poner(`${e.target.value}${CHANNEL_TOKEN}${despues}`)}
                  placeholder={tr('wm_text_before_ph', 'e.g. Clip by')}
                  aria-label={tr('wm_text_before', 'Before the name')}
                  className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-sm text-white @2xs:text-right placeholder-gray-600 outline-none"
                />
                <span
                  className="shrink-0 self-start @2xs:self-auto max-w-full @2xs:max-w-[45%] h-8 px-2.5 rounded-lg bg-twitch text-[var(--color-accent-ink)] text-sm font-black flex items-center gap-1.5 shadow-lg shadow-twitch/25"
                  title={tr('wm_text_name_hint', "Replaced with the streamer's name")}
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{multiClip ? tr('wm_text_name_chip', 'Streamer') : channelName}</span>
                </span>
                <input
                  type="text"
                  value={despues}
                  onChange={e => poner(`${antes}${CHANNEL_TOKEN}${e.target.value}`)}
                  placeholder={tr('wm_text_after_ph', 'e.g. · live')}
                  aria-label={tr('wm_text_after', 'After the name')}
                  className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-sm text-white placeholder-gray-600 outline-none"
                />
              </div>
              <div className="hidden @2xs:flex justify-between gap-2 mt-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span>← {tr('wm_text_before', 'Before the name')}</span>
                <span>{tr('wm_text_after', 'After the name')} →</span>
              </div>
            </div>
          ) : (
            <label className="block">
              <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                {tr('wm_text_fixed', 'Your text')}
              </span>
              <input
                type="text"
                value={config.template}
                onChange={e => poner(e.target.value.split(CHANNEL_TOKEN).join(''))}
                placeholder={tr('wm_text_fixed_ph', 'e.g. your channel or brand')}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-twitch"
              />
            </label>
          )}

          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <span className="text-xs font-bold text-gray-300">{tr('wm_text_include_name', "Include the streamer's name")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={conNombre}
              onClick={() => cambiarConNombre(!conNombre)}
              className={`w-10 h-[22px] rounded-full p-[3px] flex shrink-0 transition-colors cursor-pointer ${conNombre ? 'bg-twitch justify-end' : 'bg-white/15 justify-start'}`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </label>
        </div>
      )}
    </div>
  );
};

export default WatermarkTextEditor;
