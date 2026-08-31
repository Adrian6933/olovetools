import React, { useState } from 'react';
import { Clock, Gauge, Scissors, Type } from 'lucide-react';
import { FRAME_RATES } from '../lib/timing';
import { parseTime, toSrtTime } from '../lib/model';

// ============================================================================
// Timing and text operations
// ----------------------------------------------------------------------------
// Nothing here runs on load. Each block is a set of inputs and a button, and
// the button is what changes the track — so an accidental keystroke in a field
// never rewrites 1500 timestamps behind the user's back.
// ============================================================================

interface TimingPanelProps {
  t: any;
  disabled: boolean;
  onShift: (deltaMs: number) => void;
  onFrameRate: (from: number, to: number) => void;
  onResync: (fromA: number, toA: number, fromB: number, toB: number) => void;
  onRewrap: (width: number, maxLines: number) => void;
  onStripTags: () => void;
  /** Prefilled from the first and last cue, so the resync boxes are not empty. */
  firstStart: number;
  lastStart: number;
  defaultWidth: number;
  defaultLines: number;
}

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon, title, children,
}) => (
  <div className="space-y-2.5">
    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
      <span className="text-blue-400">{icon}</span>
      {title}
    </span>
    {children}
  </div>
);

const numberField =
  'w-full px-2.5 py-1.5 rounded-lg bg-[#020610] border border-white/10 focus:border-blue-500/50 text-blue-200 font-mono text-xs outline-none transition-colors';
const actionButton =
  'px-3.5 py-2 rounded-xl bg-blue-600/15 border border-blue-600/30 text-blue-300 text-[11px] font-black hover:bg-blue-600/25 transition-all cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed';

export const TimingPanel: React.FC<TimingPanelProps> = ({
  t, disabled, onShift, onFrameRate, onResync, onRewrap, onStripTags,
  firstStart, lastStart, defaultWidth, defaultLines,
}) => {
  const [shiftSeconds, setShiftSeconds] = useState('1');
  const [fromFps, setFromFps] = useState(25);
  const [toFps, setToFps] = useState(23.976);
  const [anchorA, setAnchorA] = useState(toSrtTime(firstStart));
  const [targetA, setTargetA] = useState(toSrtTime(firstStart));
  const [anchorB, setAnchorB] = useState(toSrtTime(lastStart));
  const [targetB, setTargetB] = useState(toSrtTime(lastStart));
  const [width, setWidth] = useState(defaultWidth);
  const [maxLines, setMaxLines] = useState(defaultLines);

  const applyShift = (sign: number) => {
    const seconds = parseFloat(shiftSeconds.replace(',', '.'));
    if (!Number.isFinite(seconds)) return;
    onShift(Math.round(seconds * 1000) * sign);
  };

  const applyResync = () => {
    const values = [anchorA, targetA, anchorB, targetB].map(parseTime);
    if (values.some(v => !Number.isFinite(v))) return;
    onResync(values[0], values[1], values[2], values[3]);
  };

  return (
    <div className="space-y-6">
      <Section icon={<Clock className="w-3.5 h-3.5" />} title={t.timing_shiftTitle || 'Shift everything'}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={shiftSeconds}
            onChange={e => setShiftSeconds(e.target.value)}
            inputMode="decimal"
            aria-label={t.timing_shiftSeconds || 'Seconds'}
            className={`${numberField} w-24`}
          />
          <span className="text-[11px] text-slate-500 font-bold">{t.unit_seconds || 'seconds'}</span>
          <button onClick={() => applyShift(-1)} disabled={disabled} className={actionButton}>
            − {t.timing_earlier || 'earlier'}
          </button>
          <button onClick={() => applyShift(1)} disabled={disabled} className={actionButton}>
            + {t.timing_later || 'later'}
          </button>
        </div>
      </Section>

      <Section icon={<Gauge className="w-3.5 h-3.5" />} title={t.timing_fpsTitle || 'Frame rate'}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          {t.timing_fpsHint ||
            'Subtitles that start right and drift further out as the film goes on were authored for a different frame rate. Pick the two and the whole track is rescaled.'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={fromFps}
            onChange={e => setFromFps(Number(e.target.value))}
            aria-label={t.timing_fpsFrom || 'Authored at'}
            className={`${numberField} w-28 cursor-pointer`}
          >
            {FRAME_RATES.map(fps => (
              <option key={fps} value={fps} className="bg-[#020610]">
                {fps}
              </option>
            ))}
          </select>
          <span className="text-slate-600 text-xs">→</span>
          <select
            value={toFps}
            onChange={e => setToFps(Number(e.target.value))}
            aria-label={t.timing_fpsTo || 'Played at'}
            className={`${numberField} w-28 cursor-pointer`}
          >
            {FRAME_RATES.map(fps => (
              <option key={fps} value={fps} className="bg-[#020610]">
                {fps}
              </option>
            ))}
          </select>
          <button onClick={() => onFrameRate(fromFps, toFps)} disabled={disabled || fromFps === toFps} className={actionButton}>
            {t.timing_convert || 'Convert'}
          </button>
        </div>
      </Section>

      <Section icon={<Scissors className="w-3.5 h-3.5" />} title={t.timing_resyncTitle || 'Resync from two points'}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          {t.timing_resyncHint ||
            'Tell it where two cues really belong and everything between and around them follows. Fixes an offset and a drift in one go.'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 block">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {t.timing_anchorA || 'First cue is at'}
            </span>
            <input value={anchorA} onChange={e => setAnchorA(e.target.value)} spellCheck={false} className={numberField} />
          </label>
          <label className="space-y-1 block">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {t.timing_targetA || 'should be at'}
            </span>
            <input value={targetA} onChange={e => setTargetA(e.target.value)} spellCheck={false} className={numberField} />
          </label>
          <label className="space-y-1 block">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {t.timing_anchorB || 'Last cue is at'}
            </span>
            <input value={anchorB} onChange={e => setAnchorB(e.target.value)} spellCheck={false} className={numberField} />
          </label>
          <label className="space-y-1 block">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {t.timing_targetB || 'should be at'}
            </span>
            <input value={targetB} onChange={e => setTargetB(e.target.value)} spellCheck={false} className={numberField} />
          </label>
        </div>
        <button onClick={applyResync} disabled={disabled} className={actionButton}>
          {t.timing_resync || 'Resync'}
        </button>
      </Section>

      <Section icon={<Type className="w-3.5 h-3.5" />} title={t.timing_textTitle || 'Text'}>
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 block">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {t.timing_width || 'Characters/line'}
            </span>
            <input
              type="number"
              min={10}
              max={120}
              value={width}
              onChange={e => setWidth(Number(e.target.value))}
              className={`${numberField} w-20`}
            />
          </label>
          <label className="space-y-1 block">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {t.timing_lines || 'Lines'}
            </span>
            <input
              type="number"
              min={1}
              max={4}
              value={maxLines}
              onChange={e => setMaxLines(Number(e.target.value))}
              className={`${numberField} w-16`}
            />
          </label>
          <button onClick={() => onRewrap(width, maxLines)} disabled={disabled} className={actionButton}>
            {t.timing_rewrap || 'Rebalance lines'}
          </button>
          <button onClick={onStripTags} disabled={disabled} className={actionButton}>
            {t.timing_stripTags || 'Remove tags'}
          </button>
        </div>
      </Section>
    </div>
  );
};

export default TimingPanel;
