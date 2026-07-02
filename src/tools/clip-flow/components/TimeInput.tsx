import React, { useState, useEffect } from 'react';

export const formatHMS = (totalSeconds: number): string => {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

export const parseHMS = (text: string): number | null => {
  const trimmed = text.trim();
  if (!/^\d{1,3}(:\d{1,2}){1,2}$/.test(trimmed)) return null;
  const parts = trimmed.split(':').map(p => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
};

interface TimeInputProps {
  value: number; // seconds
  min?: number;
  max?: number;
  onChange: (seconds: number) => void;
  className?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({ value, min = 0, max = Infinity, onChange, className = '' }) => {
  const [text, setText] = useState(formatHMS(value));

  useEffect(() => { setText(formatHMS(value)); }, [value]);

  const commit = () => {
    const parsed = parseHMS(text);
    if (parsed === null) { setText(formatHMS(value)); return; }
    const clamped = Math.min(max, Math.max(min, parsed));
    onChange(clamped);
    setText(formatHMS(clamped));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
      const base = parseHMS(text) ?? value;
      const clamped = Math.min(max, Math.max(min, base + delta));
      onChange(clamped);
      setText(formatHMS(clamped));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={`bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm font-mono text-white text-center w-24 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors ${className}`}
    />
  );
};
