// ============================================================================
// Zona de entrada
// ----------------------------------------------------------------------------
// El texto de aquí sólo nombra formatos que la herramienta descodifica de
// verdad. Antes anunciaba EPS y RAW, que nunca se llegaron a leer, y TIFF, que
// tampoco — ahora TIFF sí entra, vía utif, y EPS y RAW se rechazan con un
// mensaje claro en lugar de devolver un PNG disfrazado.
// ============================================================================

import React, { useCallback, useRef, useState } from 'react';
import { ACCEPTED_INPUT, ACCEPT_ATTR } from '../lib/intake';
import { MAX_FILES } from '../lib/useQueue';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  compact?: boolean;
  t: any;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFiles, compact, t }) => {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      onFiles(Array.from(list));
    },
    [onFiles]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setOver(false);
      take(event.dataTransfer.files);
    },
    [take]
  );

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={e => { e.preventDefault(); setOver(false); }}
      onDrop={onDrop}
      onClick={() => inputRef.current && inputRef.current.click()}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current && inputRef.current.click(); }}
      className={`glass-card w-full rounded-3xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center gap-4 px-6 ${
        compact ? 'py-8' : 'py-14 sm:py-20'
      } ${over ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500'}`}
    >
      {/* Bandeja con la hoja entrando: dibujo propio, no un icono a 64px. */}
      <svg viewBox="0 0 72 56" className={compact ? 'w-12 h-10' : 'w-20 h-16'} fill="none" aria-hidden="true">
        <path d="M6 34v12a4 4 0 0 0 4 4h52a4 4 0 0 0 4-4V34" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 34h16l4 7h20l4-7h16" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        <rect x="26" y="4" width="20" height="22" rx="3" fill="#a855f7" fillOpacity="0.14" stroke="#a855f7" strokeWidth="2" />
        <path d="M36 10v10M31.5 16l4.5 4.5 4.5-4.5" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="space-y-2 max-w-md">
        <p className="text-lg sm:text-xl font-black text-white leading-tight">{t.title}</p>
        <p className="text-sm text-slate-400 leading-relaxed">
          {t.subtitle.replace('{max}', String(MAX_FILES))}
        </p>
        <p className="text-[11px] font-mono text-slate-500 break-words">{ACCEPTED_INPUT}</p>
        <p className="text-[11px] text-slate-500">{t.waits}</p>
      </div>

      <input ref={inputRef} type="file" className="hidden" accept={ACCEPT_ATTR} multiple
        onClick={e => e.stopPropagation()}
        onChange={e => { take(e.target.files); e.target.value = ''; }} />
    </div>
  );
};

export default DropZone;
