import { useCallback, useEffect, useRef, useState } from 'react';
import { STUCK_MS, type KeyRecord, type KeyStat, type Rollover, type Timing } from '../types';

const HISTORY_CAP = 60;

const emptyStat = (): KeyStat => ({
  downs: 0,
  minHold: Infinity,
  maxHold: 0,
  held: false,
  stuck: false,
  lastKey: '',
});

export interface KeyboardApi {
  /** True while the capture surface has focus and is swallowing keystrokes. */
  armed: boolean;
  current: KeyRecord | null;
  history: KeyRecord[];
  stats: Record<string, KeyStat>;
  held: string[];
  rollover: Rollover;
  timing: Timing;
  reset: () => void;
  clearHistory: () => void;
  setArmed: (v: boolean) => void;
}

/**
 * The capture engine.
 *
 * Capture is *armed*, not global. The previous version called preventDefault on
 * every keydown at the window, which quietly made the whole page impossible to
 * use with a keyboard: Tab could not move focus, and no other control could be
 * reached. Here the listeners only swallow keys while the test surface holds
 * focus, and Escape always gives focus back.
 */
export function useKeyboard(onNewCode?: (code: string) => void): KeyboardApi {
  const [armed, setArmed] = useState(false);
  const [current, setCurrent] = useState<KeyRecord | null>(null);
  const [history, setHistory] = useState<KeyRecord[]>([]);
  const [stats, setStats] = useState<Record<string, KeyStat>>({});
  const [held, setHeld] = useState<string[]>([]);
  const [rollover, setRollover] = useState<Rollover>({ max: 0, best: [] });
  const [timing, setTiming] = useState<Timing>({ repeatDelay: 0, repeatRate: 0, medianHold: 0, samples: 0 });

  // Refs, not state: these are written on every keystroke and reading stale
  // state inside the listener would corrupt the tallies.
  const downAt = useRef<Map<string, number>>(new Map());
  const holds = useRef<number[]>([]);
  const firstRepeat = useRef<{ code: string; downAt: number; firstAt: number; lastAt: number } | null>(null);
  const heldRef = useRef<Set<string>>(new Set());
  const notify = useRef(onNewCode);
  notify.current = onNewCode;

  const bump = useCallback((code: string, mut: (s: KeyStat) => void) => {
    setStats(prev => {
      const s = { ...(prev[code] || emptyStat()) };
      mut(s);
      return { ...prev, [code]: s };
    });
  }, []);

  useEffect(() => {
    if (!armed) return;

    const onDown = (e: KeyboardEvent) => {
      // Escape is the way out of the capture surface, so it is never swallowed.
      if (e.key === 'Escape') {
        setArmed(false);
        return;
      }
      e.preventDefault();

      const record: KeyRecord = {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        location: e.location,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
        capsLock: e.getModifierState('CapsLock'),
        numLock: e.getModifierState('NumLock'),
        scrollLock: e.getModifierState('ScrollLock'),
        repeat: e.repeat,
        at: e.timeStamp,
      };
      setCurrent(record);

      if (e.repeat) {
        // Auto-repeat: the first gap is the OS delay, later gaps are the rate.
        const r = firstRepeat.current;
        if (r && r.code === e.code) {
          if (r.firstAt === 0) {
            const delay = e.timeStamp - r.downAt;
            r.firstAt = e.timeStamp;
            r.lastAt = e.timeStamp;
            setTiming(t => ({ ...t, repeatDelay: Math.round(delay) }));
          } else {
            const rate = e.timeStamp - r.lastAt;
            r.lastAt = e.timeStamp;
            setTiming(t => ({ ...t, repeatRate: Math.round(rate) }));
          }
        }
        return;
      }

      setHistory(prev => [record, ...prev].slice(0, HISTORY_CAP));
      downAt.current.set(e.code, e.timeStamp);
      firstRepeat.current = { code: e.code, downAt: e.timeStamp, firstAt: 0, lastAt: 0 };

      heldRef.current.add(e.code);
      const snapshot = [...heldRef.current];
      setHeld(snapshot);
      setRollover(r => (snapshot.length > r.max ? { max: snapshot.length, best: snapshot } : r));

      bump(e.code, s => {
        s.downs++;
        s.held = true;
        s.stuck = false;
        s.lastKey = e.key;
      });
      notify.current?.(e.code);
    };

    const onUp = (e: KeyboardEvent) => {
      e.preventDefault();
      const start = downAt.current.get(e.code);
      heldRef.current.delete(e.code);
      setHeld([...heldRef.current]);
      if (start !== undefined) {
        const hold = e.timeStamp - start;
        holds.current.push(hold);
        downAt.current.delete(e.code);
        const sorted = [...holds.current].sort((a, b) => a - b);
        setTiming(t => ({
          ...t,
          medianHold: Math.round(sorted[Math.floor(sorted.length / 2)]),
          samples: sorted.length,
        }));
        bump(e.code, s => {
          s.held = false;
          s.stuck = false;
          s.minHold = Math.min(s.minHold, hold);
          s.maxHold = Math.max(s.maxHold, hold);
        });
      }
      if (firstRepeat.current?.code === e.code) firstRepeat.current = null;
    };

    // Alt+Tab and clicking away never deliver the keyup, which would otherwise
    // leave keys latched down for good.
    const release = () => {
      heldRef.current.forEach(code => bump(code, s => { s.held = false; }));
      heldRef.current.clear();
      downAt.current.clear();
      setHeld([]);
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', release);
      release();
    };
  }, [armed, bump]);

  // A key down for seconds with no keyup is the classic used-keyboard fault, so
  // it gets its own polled check rather than waiting for a keyup that will not
  // arrive.
  useEffect(() => {
    if (!armed) return;
    const id = setInterval(() => {
      const now = performance.now();
      downAt.current.forEach((start, code) => {
        if (now - start > STUCK_MS) bump(code, s => { s.stuck = true; });
      });
    }, 1000);
    return () => clearInterval(id);
  }, [armed, bump]);

  const reset = useCallback(() => {
    setCurrent(null);
    setHistory([]);
    setStats({});
    setHeld([]);
    setRollover({ max: 0, best: [] });
    setTiming({ repeatDelay: 0, repeatRate: 0, medianHold: 0, samples: 0 });
    holds.current = [];
    downAt.current.clear();
    heldRef.current.clear();
    firstRepeat.current = null;
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    armed,
    current,
    history,
    stats,
    held,
    rollover,
    timing,
    reset,
    clearHistory,
    setArmed,
  };
}
