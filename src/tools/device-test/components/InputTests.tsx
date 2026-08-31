// ============================================================================
// Pruebas de teclado y de puntero
// ----------------------------------------------------------------------------
// Dos comprobaciones que cualquier probador de dispositivos trae y que aquí no
// existían: qué teclas responden (para encontrar la que se ha quedado muerta)
// y cuántos dedos detecta la pantalla a la vez.
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

// ----------------------------------------------------------------------------
// Teclado
// ----------------------------------------------------------------------------

const ROWS: string[][] = [
  ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
  ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
  ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
  ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
  ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'ControlRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'],
];

/** Etiqueta corta: `code` es la tecla física, que es justo lo que se prueba. */
function keyLabel(code: string): string {
  if (code.indexOf('Key') === 0) return code.slice(3);
  if (code.indexOf('Digit') === 0) return code.slice(5);
  if (code.indexOf('Arrow') === 0) return { Left: '←', Right: '→', Up: '↑', Down: '↓' }[code.slice(5)] || code;
  const short: Record<string, string> = {
    Escape: 'Esc', Backquote: '`', Minus: '−', Equal: '=', Backspace: '⌫', Tab: '⇥',
    BracketLeft: '[', BracketRight: ']', Backslash: '\\', CapsLock: '⇪', Semicolon: ';',
    Quote: "'", Enter: '⏎', ShiftLeft: '⇧', ShiftRight: '⇧', Comma: ',', Period: '.',
    Slash: '/', ControlLeft: 'Ctrl', ControlRight: 'Ctrl', MetaLeft: 'Meta',
    AltLeft: 'Alt', AltRight: 'Alt', Space: 'Space',
  };
  return short[code] || code;
}

export const KeyboardTest: React.FC<{ t: any }> = ({ t }) => {
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [last, setLast] = useState<{ code: string; key: string } | null>(null);
  const [active, setActive] = useState(false);
  const area = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const down = (event: KeyboardEvent) => {
      // Sin esto, probar Tab o F5 saca al usuario de la página en vez de
      // registrar la tecla, que es justo lo que ha venido a comprobar.
      event.preventDefault();
      setPressed(prev => ({ ...prev, [event.code]: true }));
      setSeen(prev => ({ ...prev, [event.code]: true }));
      setLast({ code: event.code, key: event.key });
    };
    const up = (event: KeyboardEvent) => {
      event.preventDefault();
      setPressed(prev => {
        const next = { ...prev };
        delete next[event.code];
        return next;
      });
    };
    const blur = () => setPressed({});
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [active]);

  const reset = () => { setPressed({}); setSeen({}); setLast(null); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => { setActive(a => !a); if (active) setPressed({}); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
            active ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          {active ? t.keyboardStop : t.keyboardStart}
        </button>
        <button type="button" onClick={reset}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:text-white transition-colors cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> {t.reset}
        </button>
        {last && (
          <span className="font-mono text-xs text-slate-400">
            <span className="text-cyan-400">{last.code}</span> · key="{last.key}"
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-slate-500">
          {Object.keys(seen).length} {t.keysSeen}
        </span>
      </div>

      <div ref={area} className={`space-y-1.5 overflow-x-auto pb-1 ${active ? '' : 'opacity-40'}`}>
        {ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 min-w-max">
            {row.map(code => {
              const isDown = !!pressed[code];
              const wasSeen = !!seen[code];
              return (
                <span
                  key={code}
                  className={`px-2 py-1.5 rounded-md text-[10px] font-bold font-mono border transition-colors select-none ${
                    isDown
                      ? 'bg-cyan-500 border-cyan-400 text-black'
                      : wasSeen
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-500'
                  } ${code === 'Space' ? 'px-10' : ''}`}
                >
                  {keyLabel(code)}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{t.keyboardHint}</p>
    </div>
  );
};

// ----------------------------------------------------------------------------
// Puntero y multitáctil
// ----------------------------------------------------------------------------

interface Dot {
  id: number;
  x: number;
  y: number;
  type: string;
  pressure: number;
}

export const PointerTest: React.FC<{ t: any }> = ({ t }) => {
  const [dots, setDots] = useState<Dot[]>([]);
  const [maxSeen, setMaxSeen] = useState(0);
  const [buttons, setButtons] = useState<Record<number, boolean>>({});
  const surface = useRef<HTMLDivElement | null>(null);

  const update = useCallback((event: React.PointerEvent, remove = false) => {
    const box = surface.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    setDots(prev => {
      const next = prev.filter(dot => dot.id !== event.pointerId);
      if (!remove) {
        next.push({
          id: event.pointerId,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          type: event.pointerType,
          pressure: event.pressure,
        });
      }
      setMaxSeen(current => Math.max(current, next.length));
      return next;
    });
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={surface}
        onPointerDown={event => {
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
          setButtons(prev => ({ ...prev, [event.button]: true }));
          update(event);
        }}
        onPointerMove={event => { if (event.buttons > 0) update(event); }}
        onPointerUp={event => update(event, true)}
        onPointerCancel={event => update(event, true)}
        onPointerLeave={event => update(event, true)}
        onContextMenu={event => event.preventDefault()}
        className="relative h-56 rounded-2xl border border-white/10 bg-black/30 overflow-hidden touch-none cursor-crosshair"
      >
        {dots.length === 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none text-center px-6">
            {t.pointerHint}
          </span>
        )}
        {dots.map(dot => (
          <span
            key={dot.id}
            className="absolute rounded-full border-2 border-cyan-400 bg-cyan-400/25 pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: dot.x,
              top: dot.y,
              // La presión sólo la dan lápiz y algunas pantallas; con ratón es
              // 0.5 fijo, así que el círculo no cambia y eso también informa.
              width: 30 + dot.pressure * 60,
              height: 30 + dot.pressure * 60,
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-slate-400">
        <span>{t.pointerActive}: <span className="text-cyan-400">{dots.length}</span></span>
        <span>{t.pointerMax}: <span className="text-cyan-400">{maxSeen}</span></span>
        <span>{t.pointerType}: <span className="text-cyan-400">{dots[0] ? dots[0].type : '—'}</span></span>
        <span>{t.pointerButtons}: <span className="text-cyan-400">{Object.keys(buttons).join(', ') || '—'}</span></span>
      </div>
    </div>
  );
};
