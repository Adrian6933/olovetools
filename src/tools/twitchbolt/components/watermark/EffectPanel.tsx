// Pestaña "Animación": cada efecto es una tarjeta donde el cartel hace ese
// efecto en bucle, calculado con la misma función que dibuja el vídeo. Así se
// elige viendo el movimiento, no adivinando qué será "Aparición elástica".
//
// Un solo bucle de requestAnimationFrame mueve todas las tarjetas tocando el
// estilo de cada una por referencia: con estado de React serían doce
// renderizados por fotograma.
import React, { useEffect, useRef, useState } from 'react';
import { Check, LogIn, LogOut, Play, Repeat } from 'lucide-react';
import type { EntryEffect, ExitEffect, LoopEffect, WatermarkConfig } from '../../types';
import { calculateAnimationState, formatWatermarkText } from '../../services/watermarkService';
import { BadgePreview, Section, Segmented, Slider, type Tr } from './ui';

interface Props {
  config: WatermarkConfig;
  onChange: (c: WatermarkConfig) => void;
  channelName: string;
  tr: Tr;
  onTestEntry: () => void;
  onTestExit: () => void;
}

const ENTRADAS: { id: EntryEffect; key: string; fb: string }[] = [
  { id: 'none', key: 'wm_fx_none', fb: 'None' },
  { id: 'fade', key: 'wm_fx_fade_in', fb: 'Fade in' },
  { id: 'slide-down', key: 'wm_fx_slide_down', fb: 'From above' },
  { id: 'slide-up', key: 'wm_fx_slide_up', fb: 'From below' },
  { id: 'slide-left', key: 'wm_fx_slide_left', fb: 'From the right' },
  { id: 'slide-right', key: 'wm_fx_slide_right', fb: 'From the left' },
  { id: 'zoom', key: 'wm_fx_zoom_in', fb: 'Zoom in' },
  { id: 'bounce', key: 'wm_fx_bounce', fb: 'Bounce' },
  { id: 'rotate-in', key: 'wm_fx_rotate_fade', fb: 'Spin in' },
  { id: 'pop-in', key: 'wm_fx_pop_spring', fb: 'Elastic pop' },
  { id: 'flip-x', key: 'wm_fx_flip', fb: 'Flip' },
  { id: 'typewriter', key: 'wm_fx_typewriter', fb: 'Typewriter' },
  { id: 'drop', key: 'wm_fx_drop', fb: 'Drop and bounce' },
  { id: 'spin', key: 'wm_fx_spin', fb: 'Spin' },
  { id: 'stretch', key: 'wm_fx_stretch', fb: 'Stretch' },
  { id: 'glitch', key: 'wm_fx_glitch', fb: 'Glitch' },
];

const SALIDAS: { id: ExitEffect; key: string; fb: string }[] = [
  { id: 'none', key: 'wm_fxo_none', fb: 'Stays' },
  { id: 'fade', key: 'wm_fxo_fade', fb: 'Fade out' },
  { id: 'slide-down', key: 'wm_fxo_slide_down', fb: 'Down' },
  { id: 'slide-up', key: 'wm_fxo_slide_up', fb: 'Up' },
  { id: 'slide-left', key: 'wm_fxo_slide_left', fb: 'Left' },
  { id: 'slide-right', key: 'wm_fxo_slide_right', fb: 'Right' },
  { id: 'zoom', key: 'wm_fxo_zoom_out', fb: 'Zoom out' },
  { id: 'rotate-out', key: 'wm_fxo_rotate', fb: 'Spin out' },
  { id: 'pop-out', key: 'wm_fxo_pop', fb: 'Elastic out' },
  { id: 'drop', key: 'wm_fxo_drop', fb: 'Fall' },
  { id: 'spin', key: 'wm_fxo_spin', fb: 'Spin away' },
  { id: 'shrink', key: 'wm_fxo_shrink', fb: 'Squeeze' },
  { id: 'glitch', key: 'wm_fxo_glitch', fb: 'Glitch' },
];

const BUCLES: { id: LoopEffect; key: string; fb: string }[] = [
  { id: 'none', key: 'wm_fxl_none', fb: 'Still' },
  { id: 'pulse', key: 'wm_fxl_pulse', fb: 'Pulse' },
  { id: 'heartbeat', key: 'wm_fxl_heartbeat', fb: 'Heartbeat' },
  { id: 'float', key: 'wm_fxl_float', fb: 'Float' },
  { id: 'swing', key: 'wm_fxl_swing', fb: 'Swing' },
  { id: 'shake', key: 'wm_fxl_shake', fb: 'Shake' },
  { id: 'flicker', key: 'wm_fxl_flicker', fb: 'Neon flicker' },
];

/** Duración del bucle de cada tarjeta y de la animación dentro de él. */
const CICLO = 2.2;
const ANIM = 0.8;
/** Los desplazamientos están en píxeles de 720p; la tarjeta mide ~80 px de alto. */
const ESCALA = 0.45;

const EffectPanel: React.FC<Props> = ({ config, onChange, channelName, tr, onTestEntry, onTestExit }) => {
  const [modo, setModo] = useState<'in' | 'out' | 'loop'>('in');
  const refs = useRef(new Map<string, HTMLSpanElement>());
  const configRef = useRef(config);
  configRef.current = config;
  const texto = formatWatermarkText(config, channelName) || channelName;
  const textoRef = useRef(texto);
  textoRef.current = texto;

  useEffect(() => {
    let id = 0;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const t = ((ahora - inicio) / 1000) % CICLO;
      refs.current.forEach((el, clave) => {
        const [lado, efecto] = clave.split(':');
        const base = configRef.current;
        // Cada tarjeta enseña SOLO su efecto: lo demás de la configuración no
        // se mezcla, o todas temblarían si el bucle elegido es "temblar".
        const demo: WatermarkConfig = lado === 'in'
          ? { ...base, entryEffect: efecto as EntryEffect, entryDuration: ANIM, entryDelay: 0.25, exitEffect: 'none', loopEffect: 'none' }
          : lado === 'out'
            ? { ...base, entryEffect: 'none', entryDelay: 0, exitEffect: efecto as ExitEffect, exitDuration: ANIM, loopEffect: 'none' }
            : { ...base, entryEffect: 'none', entryDelay: 0, exitEffect: 'none', loopEffect: efecto as LoopEffect };
        // Los bucles corren con un reloj que no se reinicia, para que no salten.
        const tiempo = lado === 'loop' ? (ahora - inicio) / 1000 : t;
        const s = calculateAnimationState(demo, tiempo, lado === 'loop' ? 1e6 : CICLO - 0.25);
        el.style.opacity = String(Math.max(0, Math.min(1, s.opacity)));
        el.style.transform = `translate(${s.offsetX * ESCALA}px, ${s.offsetY * ESCALA}px) scale(${Math.max(0, s.scale * s.scaleX)}, ${Math.max(0, s.scale)}) rotate(${s.rotation}rad)`;
        if (lado === 'in' && efecto === 'typewriter') {
          const full = textoRef.current;
          const n = s.typewriterRatio >= 1 ? full.length : Math.max(0, Math.round(full.length * s.typewriterRatio));
          const span = el.querySelector('span.truncate');
          if (span) span.textContent = full.slice(0, Math.max(1, n));
        }
      });
      id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, []);

  const lista: { id: string; key: string; fb: string }[] = modo === 'in' ? ENTRADAS : modo === 'out' ? SALIDAS : BUCLES;
  const actual = modo === 'in' ? config.entryEffect : modo === 'out' ? config.exitEffect : (config.loopEffect || 'none');

  return (
    <div className="space-y-5">
      <Segmented<'in' | 'out' | 'loop'>
        value={modo}
        onChange={setModo}
        options={[
          { id: 'in', label: <span className="inline-flex items-center gap-1"><LogIn className="w-3.5 h-3.5 shrink-0" />{tr('wm_entry_short', 'In')}</span> },
          { id: 'loop', label: <span className="inline-flex items-center gap-1"><Repeat className="w-3.5 h-3.5 shrink-0" />{tr('wm_loop_short', 'While on')}</span> },
          { id: 'out', label: <span className="inline-flex items-center gap-1"><LogOut className="w-3.5 h-3.5 shrink-0" />{tr('wm_exit_short', 'Out')}</span> },
        ]}
      />
      <p className="text-[11px] text-gray-500 -mt-2">
        {modo === 'in'
          ? tr('wm_mode_in_hint', 'How the watermark appears at the start.')
          : modo === 'out'
            ? tr('wm_mode_out_hint', 'How it leaves at the end of the clip.')
            : tr('wm_mode_loop_hint', 'A movement that repeats while it is on screen.')}
      </p>

      <div className="grid grid-cols-2 @xs:grid-cols-3 gap-2">
        {lista.map(e => {
          const activo = actual === e.id;
          const clave = `${modo}:${e.id}`;
          return (
            <button
              key={clave}
              type="button"
              onClick={() => {
                onChange(
                  modo === 'in' ? { ...config, entryEffect: e.id as EntryEffect }
                  : modo === 'out' ? { ...config, exitEffect: e.id as ExitEffect }
                  : { ...config, loopEffect: e.id as LoopEffect }
                );
                // Al elegir, se ve también en el vídeo grande.
                if (e.id !== 'none' && modo !== 'loop') (modo === 'in' ? onTestEntry : onTestExit)();
              }}
              aria-pressed={activo}
              className={`relative rounded-xl border overflow-hidden text-left transition-all cursor-pointer active:scale-[0.98] ${
                activo ? 'border-twitch ring-1 ring-twitch/40' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <span className="h-20 flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#2a2438,#0d0b12)]">
                {e.id === 'none' ? (
                  <BadgePreview config={config} channelName={channelName} size={11} />
                ) : (
                  <BadgePreview
                    ref={el => { if (el) refs.current.set(clave, el); else refs.current.delete(clave); }}
                    config={config}
                    channelName={channelName}
                    size={11}
                    className="will-change-transform"
                  />
                )}
              </span>
              <span className={`block px-2 py-1.5 text-[10px] font-bold truncate ${activo ? 'bg-twitch text-white' : 'bg-white/[0.03] text-gray-300'}`}>
                {tr(e.key, e.fb)}
              </span>
              {activo && <Check className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-twitch" />}
            </button>
          );
        })}
      </div>

      {modo === 'in' && config.entryEffect !== 'none' && (
        <Section
          title={tr('wm_timing', 'Timing')}
          right={<button type="button" onClick={onTestEntry} className="text-[11px] font-bold text-twitch hover:text-white flex items-center gap-1 cursor-pointer"><Play className="w-3 h-3" />{tr('wm_test', 'Test')}</button>}
        >
          <Slider label={tr('wm_entry_duration', 'Duration')} value={config.entryDuration} min={0.2} max={3.5} step={0.1} unit="s" onChange={v => onChange({ ...config, entryDuration: v })} />
          <Slider label={tr('wm_entry_delay', 'Start delay')} value={config.entryDelay || 0} min={0} max={5} step={0.2} unit="s" onChange={v => onChange({ ...config, entryDelay: v })} />
        </Section>
      )}
      {modo === 'out' && config.exitEffect !== 'none' && (
        <Section
          title={tr('wm_timing', 'Timing')}
          right={<button type="button" onClick={onTestExit} className="text-[11px] font-bold text-twitch hover:text-white flex items-center gap-1 cursor-pointer"><Play className="w-3 h-3" />{tr('wm_test', 'Test')}</button>}
        >
          <Slider label={tr('wm_exit_duration', 'Duration')} value={config.exitDuration} min={0.2} max={3.5} step={0.1} unit="s" onChange={v => onChange({ ...config, exitDuration: v })} />
        </Section>
      )}
    </div>
  );
};

export default EffectPanel;
