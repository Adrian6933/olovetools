import React from 'react';

// ============================================================================
// Hand-drawn SVG art for TimeBolt. Local markup only: no emoji standing in for
// an illustration, no recycled icon-set glyph. Motion is declared inside the
// sprite so prefers-reduced-motion silences it before React hydrates.
// ============================================================================

const INK = '#34d399';

export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 250" className={`tool-hero-art ${className}`} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes tb-slide { 0%,100% { transform: translateX(0) } 50% { transform: translateX(28px) } }
      @keyframes tb-pulse { 0%,100% { opacity:.35 } 50% { opacity:.9 } }
      .tb-marker { animation: tb-slide 7s ease-in-out infinite; }
      .tb-cell { animation: tb-pulse 3.6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .tb-marker, .tb-cell { animation: none !important; opacity: 1 !important; }
      }
    `}</style>

    <rect x="10" y="26" width="400" height="198" rx="16" fill="#04140f" stroke="rgba(52,211,153,0.2)" />

    {/* four zone rows of hour cells */}
    {[0, 1, 2, 3].map(row => {
      const label = ['Madrid', 'New York', 'Tokyo', 'Sydney'][row];
      const shift = [0, -6, 8, 10][row];
      return (
        <g key={row}>
          <text x="26" y={62 + row * 42} fill="#94a3b8" fontSize="10" fontWeight="700" fontFamily="sans-serif">
            {label}
          </text>
          {Array.from({ length: 14 }).map((_, i) => {
            const hour = (i + 8 + shift + 24) % 24;
            const work = hour >= 9 && hour < 18;
            const night = hour < 6 || hour >= 22;
            return (
              <rect
                key={i}
                className={work && i === 5 ? 'tb-cell' : ''}
                x={96 + i * 22}
                y={48 + row * 42}
                width="20"
                height="20"
                rx="3"
                fill={work ? 'rgba(52,211,153,0.35)' : night ? 'rgba(30,41,59,0.6)' : 'rgba(52,211,153,0.1)'}
              />
            );
          })}
        </g>
      );
    })}

    {/* the meeting marker sliding across the columns */}
    <g className="tb-marker">
      <rect x="204" y="40" width="24" height="180" rx="5" fill="none" stroke={INK} strokeWidth="2" />
      <circle cx="216" cy="34" r="5" fill={INK} />
    </g>
  </svg>
);

const base = 'w-full h-full';

export const IconGrid: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    {[0, 1, 2].map(r =>
      [0, 1, 2, 3, 4].map(c => (
        <rect
          key={`${r}-${c}`}
          x={5 + c * 8}
          y={13 + r * 8}
          width="6.5"
          height="6.5"
          rx="1.6"
          fill={INK}
          opacity={c === 2 ? 0.9 : 0.28}
        />
      ))
    )}
    <rect x="20" y="10" width="9" height="27" rx="2.5" stroke={INK} strokeWidth="1.6" />
  </svg>
);

export const IconZones: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="16" stroke={INK} strokeWidth="2" />
    <ellipse cx="24" cy="24" rx="7" ry="16" stroke={INK} strokeWidth="1.5" opacity="0.55" />
    <path d="M8 24 h32 M11 15 h26 M11 33 h26" stroke={INK} strokeWidth="1.4" opacity="0.4" />
  </svg>
);

export const IconDst: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="14" stroke={INK} strokeWidth="2" />
    <path d="M24 15 v9 l6 4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M35 12 l4 -4 M39 8 v5 M39 8 h-5" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCalendar: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="8" y="12" width="32" height="28" rx="4" stroke={INK} strokeWidth="2" />
    <path d="M8 20 h32" stroke={INK} strokeWidth="2" />
    <path d="M16 8 v7 M32 8 v7" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    <rect x="15" y="25" width="8" height="7" rx="1.8" fill={INK} opacity="0.8" />
  </svg>
);

export const IconSave: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M11 12 h20 l6 6 v18 a2 2 0 0 1 -2 2 H13 a2 2 0 0 1 -2 -2 z" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    <rect x="17" y="12" width="12" height="8" rx="1.5" fill={INK} opacity="0.75" />
    <rect x="16" y="26" width="16" height="10" rx="2" stroke={INK} strokeWidth="1.6" />
  </svg>
);

export const IconOffline: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M24 7 l 14 6 v10 c0 9 -6 15 -14 18 c -8 -3 -14 -9 -14 -18 V13 z" stroke={INK} strokeWidth="2" />
    <path d="M17 24 l 5 5 l 9 -10" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const frame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 120" className="w-full h-auto" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#04140f" stroke="rgba(52,211,153,0.16)" />
    {children}
  </svg>
);

export const StepAdd: React.FC = () =>
  frame(
    <>
      <rect x="22" y="26" width="156" height="22" rx="6" stroke={INK} strokeWidth="1.6" />
      <circle cx="36" cy="37" r="4.5" stroke={INK} strokeWidth="1.5" />
      <path d="M39 40 l4 4" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
      <text x="52" y="41" fill="#64748b" fontSize="9" fontFamily="sans-serif">Bogotá</text>
      {['Bogotá', 'Tokyo'].map((c, i) => (
        <g key={c}>
          <rect x="22" y={58 + i * 24} width="156" height="18" rx="5" fill="rgba(52,211,153,0.1)" />
          <text x="32" y={70 + i * 24} fill="#94a3b8" fontSize="9" fontFamily="sans-serif">{c}</text>
        </g>
      ))}
    </>
  );

export const StepGrid: React.FC = () =>
  frame(
    <>
      {[0, 1, 2].map(r => (
        <g key={r}>
          <rect x="14" y={28 + r * 26} width="34" height="16" rx="3" fill="rgba(255,255,255,0.04)" />
          {Array.from({ length: 9 }).map((_, c) => {
            const work = (c + r * 3) % 9 >= 2 && (c + r * 3) % 9 <= 6;
            return (
              <rect
                key={c}
                x={54 + c * 15}
                y={28 + r * 26}
                width="13"
                height="16"
                rx="2.5"
                fill={work ? 'rgba(52,211,153,0.4)' : 'rgba(30,41,59,0.7)'}
              />
            );
          })}
        </g>
      ))}
      <rect x="114" y="24" width="13" height="80" rx="3" fill="none" stroke={INK} strokeWidth="1.8" />
    </>
  );

export const StepWarn: React.FC = () =>
  frame(
    <>
      <path d="M100 26 l 30 52 h-60 z" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M100 44 v16" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="100" cy="68" r="1.8" fill={INK} />
      <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">
        clocks change that day
      </text>
    </>
  );

export const StepShare: React.FC = () =>
  frame(
    <>
      <rect x="20" y="24" width="90" height="72" rx="7" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x="30" y={36 + i * 20} width="30" height="6" rx="2" fill={INK} opacity="0.5" />
          <rect x="66" y={36 + i * 20} width="34" height="6" rx="2" fill="rgba(255,255,255,0.15)" />
        </g>
      ))}
      <path d="M120 60 h30" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M143 53 l 8 7 l -8 7" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="156" y="44" width="26" height="32" rx="5" stroke={INK} strokeWidth="1.8" strokeDasharray="5 4" />
      <text x="169" y="64" textAnchor="middle" fill={INK} fontSize="8" fontWeight="700" fontFamily="monospace">ICS</text>
    </>
  );
