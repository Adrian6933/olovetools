// Pestaña "Posición": un mapa del vídeo con los sitios típicos para tocar, las
// posiciones guardadas y el ajuste fino. Arrastrar sobre el vídeo grande
// también mueve el cartel; esto es para quien prefiere tocar un sitio.
import React, { useState } from 'react';
import { Plus, Trash2, Move } from 'lucide-react';
import type { PositionPreset, WatermarkConfig } from '../types';
import { Section, Slider, type Tr } from './ui';
import { POS_MAX, POS_MIN } from '../watermarkService';

interface Props {
  config: WatermarkConfig;
  onChange: (c: WatermarkConfig) => void;
  presets: PositionPreset[];
  onSavePreset: (p: PositionPreset) => void;
  onDeletePreset: (id: string) => void;
  tr: Tr;
}

const PositionPanel: React.FC<Props> = ({ config, onChange, presets, onSavePreset, onDeletePreset, tr }) => {
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState('');
  const fabrica = presets.filter(p => p.isDefault);
  const propias = presets.filter(p => !p.isDefault);

  const elegir = (p: PositionPreset) => onChange({ ...config, positionId: p.id, customX: p.x, customY: p.y });

  const guardar = () => {
    const nuevo: PositionPreset = {
      id: `custom_${Date.now()}`,
      name: nombre.trim() || `${config.customX}% · ${config.customY}%`,
      x: config.customX,
      y: config.customY,
      isDefault: false,
    };
    onSavePreset(nuevo);
    elegir(nuevo);
    setNombre('');
    setGuardando(false);
  };

  return (
    <div className="space-y-6">
      <Section title={tr('wm_pos_pick', 'Tap a spot')}>
        <div className="relative w-full aspect-video rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#2a2438,#0d0b12)] overflow-hidden">
          <div className="absolute inset-[12%] border border-dashed border-white/10 rounded-lg pointer-events-none" />
          {fabrica.map(p => {
            const activo = config.positionId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => elegir(p)}
                title={tr('wm_pos_' + p.id, p.name)}
                aria-label={tr('wm_pos_' + p.id, p.name)}
                aria-pressed={activo}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center cursor-pointer group"
                style={{ left: `${Math.min(92, Math.max(8, p.x))}%`, top: `${Math.min(88, Math.max(12, p.y))}%` }}
              >
                <span className={`rounded-full transition-all ${activo ? 'w-4 h-4 bg-twitch ring-4 ring-twitch/30' : 'w-2.5 h-2.5 bg-white/30 group-hover:bg-white group-hover:w-3.5 group-hover:h-3.5'}`} />
              </button>
            );
          })}
          {config.positionId === 'custom' || !fabrica.some(p => p.id === config.positionId) ? (
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-twitch ring-4 ring-twitch/30 pointer-events-none"
              style={{ left: `${Math.min(100, Math.max(0, config.customX))}%`, top: `${Math.min(100, Math.max(0, config.customY))}%` }}
            />
          ) : null}
        </div>
        <p className="flex items-center gap-2 text-[11px] text-gray-500">
          <Move className="w-3.5 h-3.5 text-twitch shrink-0" />
          {tr('wm_drag_hint', 'Or drag it on the video')}
        </p>
      </Section>

      <Section
        title={tr('wm_presets_custom', 'Saved positions')}
        right={!guardando && (
          <button
            type="button"
            onClick={() => setGuardando(true)}
            className="text-[11px] font-bold text-twitch hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> {tr('wm_save_current', 'Save this one')}
          </button>
        )}
      >
        {guardando && (
          <div className="flex gap-2">
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') setGuardando(false); }}
              placeholder={tr('wm_preset_name_ph', 'Name (e.g. Gamer corner)')}
              autoFocus
              className="flex-1 min-w-0 bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-twitch"
            />
            <button type="button" onClick={guardar} className="px-3 rounded-xl bg-twitch text-[var(--color-accent-ink)] text-xs font-black cursor-pointer hover:bg-twitch-dark">
              {tr('wm_save', 'Save')}
            </button>
          </div>
        )}
        {propias.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {propias.map(p => {
              const activo = config.positionId === p.id;
              return (
                <span key={p.id} className={`inline-flex items-center rounded-full border text-xs font-bold ${activo ? 'bg-twitch/15 border-twitch text-white' : 'border-white/10 text-gray-300'}`}>
                  <button type="button" onClick={() => elegir(p)} className="pl-3 pr-1 py-1.5 cursor-pointer max-w-[10rem] truncate">{p.name}</button>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(p.id)}
                    title={tr('wm_delete_preset', 'Delete')}
                    aria-label={tr('wm_delete_preset', 'Delete')}
                    className="pr-2 pl-1 py-1.5 text-gray-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : !guardando && (
          <p className="text-[11px] text-gray-500">{tr('wm_no_presets', 'Move the watermark where you like it and save it to reuse later.')}</p>
        )}
      </Section>

      <Section title={tr('wm_fine_tune', 'Fine tune')}>
        <Slider label={tr('wm_pos_x', 'Horizontal')} value={config.customX} min={POS_MIN} max={POS_MAX} unit="%" onChange={v => onChange({ ...config, positionId: 'custom', customX: v })} />
        <Slider label={tr('wm_pos_y', 'Vertical')} value={config.customY} min={POS_MIN} max={POS_MAX} unit="%" onChange={v => onChange({ ...config, positionId: 'custom', customY: v })} />
      </Section>
    </div>
  );
};

export default PositionPanel;
