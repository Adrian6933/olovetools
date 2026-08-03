import React, { useEffect, useRef, useState } from 'react';
import { createTicker } from '../lib/recorder';

interface LevelMeterProps {
  /** Returns the current peak, 0–1. Null while nothing is armed. */
  read: () => number;
  active: boolean;
  bars?: number;
  className?: string;
}

/**
 * Isolated so the 20 Hz level updates re-render twelve `<span>`s instead of the
 * whole tool. The ticker is worker-driven, so the meter also keeps moving in a
 * background tab — and, unlike the old rAF loop, it cannot leak a second loop
 * when the recording is paused and resumed.
 */
export const LevelMeter: React.FC<LevelMeterProps> = ({ read, active, bars = 14, className = '' }) => {
  const [level, setLevel] = useState(0);
  const reader = useRef(read);
  reader.current = read;

  useEffect(() => {
    if (!active) {
      setLevel(0);
      return;
    }
    const ticker = createTicker(50, () => setLevel(reader.current()));
    return () => ticker.stop();
  }, [active]);

  return (
    <div className={`flex items-end gap-[3px] h-6 ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => {
        const threshold = (i + 1) / bars;
        const lit = level >= threshold * 0.92;
        const height = lit ? 30 + threshold * 70 : 12;
        return (
          <span
            key={i}
            style={{ height: `${height}%` }}
            className={`w-1 rounded-full transition-[height,background-color] duration-75 ${
              lit ? (threshold > 0.85 ? 'bg-red-400' : threshold > 0.65 ? 'bg-amber-300' : 'bg-amber-500') : 'bg-white/10'
            }`}
          />
        );
      })}
    </div>
  );
};

export default LevelMeter;
