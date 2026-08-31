import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Globe, Search, X } from 'lucide-react';
import { listZones, offsetLabel, offsetMinutes } from '../lib/format';

interface ZonePickerProps {
  value: string;
  /** Instant used to show each zone's offset, since offsets move with DST. */
  at: Date;
  onChange: (zone: string) => void;
  t: any;
}

const MAX_SHOWN = 80;

export const ZonePicker: React.FC<ZonePickerProps> = ({ value, at, onChange, t }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement | null>(null);

  // The zone list comes from Intl, so it can only be read in the browser.
  const [zones, setZones] = useState<string[]>([]);
  useEffect(() => setZones(listZones()), []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '_');
    const list = q ? zones.filter(z => z.toLowerCase().includes(q)) : zones;
    return list.slice(0, MAX_SHOWN);
  }, [zones, query]);

  const currentOffset = offsetMinutes(at, value);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-slate-950/60 text-slate-200 hover:border-sky-500/40 text-xs font-bold transition-all cursor-pointer max-w-full"
      >
        <Globe className="w-4 h-4 text-sky-400 shrink-0" />
        <span className="truncate">{value.replace(/_/g, ' ')}</span>
        <span className="font-mono text-sky-300/80 shrink-0">UTC{offsetLabel(currentOffset)}</span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-sky-500/25 bg-[#020813] shadow-2xl shadow-black/60 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.zoneSearch || 'Search a city or zone…'}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-600"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label={t.clear || 'Clear'}
                className="p-1 rounded text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-slate-600">{t.zoneNoResults || 'No zone matches.'}</p>
            )}
            {filtered.map(zone => {
              const off = offsetMinutes(at, zone);
              return (
                <button
                  key={zone}
                  onClick={() => {
                    onChange(zone);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-xs transition-colors cursor-pointer ${
                    zone === value ? 'bg-sky-500/15 text-sky-200' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{zone.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">UTC{offsetLabel(off)}</span>
                </button>
              );
            })}
          </div>

          {zones.length > MAX_SHOWN && (
            <p className="px-4 py-2 text-[10px] text-slate-600 border-t border-white/5">
              {(t.zoneCount || '{shown} of {total} zones — type to narrow')
                .replace('{shown}', String(filtered.length))
                .replace('{total}', String(zones.length))}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ZonePicker;
