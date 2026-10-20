// Una línea encima de las tarjetas: cómo se reordenan (manteniendo pulsado) y
// atajos para ordenar de golpe. El orden manda en los nombres del ZIP y en el
// vídeo unido.
import React, { useState } from 'react';
import { Hand, ArrowDownUp, Clock, Eye, CalendarDays, Copy, Check } from 'lucide-react';
import type { ClipItem } from './types';

interface Props {
  clips: ClipItem[];
  onReorder: (next: ClipItem[]) => void;
  t: any;
}

const ClipSortBar: React.FC<Props> = ({ clips, onReorder, t }) => {
  const [copiado, setCopiado] = useState(false);

  const ordenarPor = (clave: 'views' | 'date' | 'duration' | 'reverse') => {
    if (clave === 'reverse') { onReorder(clips.slice().reverse()); return; }
    const valor = (c: ClipItem) => {
      const d = c.data;
      if (!d) return -Infinity;
      if (clave === 'views') return d.views;
      if (clave === 'duration') return d.duration;
      const ms = Date.parse(d.createdAt || '');
      return isNaN(ms) ? 0 : ms;
    };
    onReorder(clips.slice().sort((a, b) => valor(b) - valor(a)));
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(clips.map(c => c.url).join('\n'));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch { /* sin permiso de portapapeles */ }
  };

  const chip = 'h-8 px-3 rounded-full border border-white/10 text-[11px] font-bold text-gray-400 hover:text-white hover:border-white/25 flex items-center gap-1.5 cursor-pointer transition-colors';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
      <p className="flex items-center gap-2 text-xs font-bold text-gray-400">
        <Hand className="w-4 h-4 text-twitch shrink-0" />
        {t.dragHint || 'Hold a clip and drag it to change the order'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => ordenarPor('views')} className={chip}><Eye className="w-3.5 h-3.5" />{t.sortViews || 'Most viewed'}</button>
        <button type="button" onClick={() => ordenarPor('date')} className={chip}><CalendarDays className="w-3.5 h-3.5" />{t.sortDate || 'Newest'}</button>
        <button type="button" onClick={() => ordenarPor('duration')} className={chip}><Clock className="w-3.5 h-3.5" />{t.sortDuration || 'Longest'}</button>
        <button type="button" onClick={() => ordenarPor('reverse')} className={chip}><ArrowDownUp className="w-3.5 h-3.5" />{t.sortReverse || 'Reverse'}</button>
        <button type="button" onClick={copiar} className={chip}>
          {copiado ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copiado ? (t.copied || 'Copied') : (t.copyLinks || 'Copy links')}
        </button>
      </div>
    </div>
  );
};

export default ClipSortBar;
