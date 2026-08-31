import React, { useEffect, useMemo, useState } from 'react';
import { Globe2 } from 'lucide-react';
import { instantToCivil, isValidTimezone, localTimezone } from '../lib/schedule';

// ============================================================================
// Timezone picker
// ----------------------------------------------------------------------------
// The single most important control on the page: a crontab runs in the
// server's zone, which is almost never the reader's. The full IANA list comes
// from `Intl.supportedValuesOf`, which only exists in the browser — so it is
// filled after mount, and the server renders the short list alone. Rendering a
// 400-entry datalist on the server and a different one in the client is a
// hydration mismatch waiting to happen.
// ============================================================================

interface TimezonePickerProps {
  value: string;
  onChange: (tz: string) => void;
  t: any;
  /** Reference instant, so the offset badge matches the schedule preview. */
  nowTs: number;
  mounted: boolean;
}

const COMMON = [
  'UTC',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
];

/** "UTC+02:00" for the given zone at the given instant. */
function offsetLabel(tz: string, ts: number): string {
  try {
    const civil = instantToCivil(ts, tz);
    const asUtc = Date.UTC(civil.y, civil.mo - 1, civil.d, civil.h, civil.mi, civil.s);
    const minutes = Math.round((asUtc - ts) / 60000);
    const sign = minutes < 0 ? '-' : '+';
    const abs = Math.abs(minutes);
    return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export const TimezonePicker: React.FC<TimezonePickerProps> = ({ value, onChange, t, nowTs, mounted }) => {
  const [all, setAll] = useState<string[]>([]);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const supported = (Intl as any).supportedValuesOf;
    if (typeof supported !== 'function') return;
    try {
      setAll(supported('timeZone') as string[]);
    } catch {
      /* Older engines simply do not expose the list; the short one still works. */
    }
  }, []);

  const options = useMemo(() => {
    const local = localTimezone();
    const seen = new Set<string>();
    const out: string[] = [];
    for (const tz of [local, ...COMMON, value]) {
      if (tz && !seen.has(tz)) {
        seen.add(tz);
        out.push(tz);
      }
    }
    return out;
  }, [value]);

  const commit = (next: string) => {
    const trimmed = next.trim();
    if (trimmed && isValidTimezone(trimmed)) onChange(trimmed);
    else setDraft(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
          <Globe2 className="w-3.5 h-3.5 text-violet-400" />
          {t.tz_label || 'Server timezone'}
        </span>
        <span className="text-[10px] font-mono text-violet-300/70">
          {mounted ? offsetLabel(value, nowTs) : ''}
        </span>
      </div>

      <div className="flex gap-2">
        <select
          value={options.indexOf(value) !== -1 ? value : ''}
          onChange={e => e.target.value && onChange(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#12081e] border border-white/10 focus:border-violet-500/50 text-slate-200 text-xs outline-none transition-colors cursor-pointer"
        >
          {options.indexOf(value) === -1 && <option value="">{value}</option>}
          {options.map(tz => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
        }}
        list={all.length > 0 ? 'cronflow-timezones' : undefined}
        spellCheck={false}
        placeholder="Europe/Madrid"
        className="w-full px-3 py-2 rounded-xl bg-[#12081e] border border-white/10 focus:border-violet-500/50 text-violet-200 font-mono text-[11px] outline-none transition-colors"
      />
      {all.length > 0 && (
        <datalist id="cronflow-timezones">
          {all.map(tz => (
            <option key={tz} value={tz} />
          ))}
        </datalist>
      )}
    </div>
  );
};

export default TimezonePicker;
