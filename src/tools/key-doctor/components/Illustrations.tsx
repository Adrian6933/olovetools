import React from 'react';

// ============================================================================
// Hand-drawn SVG art for Key Doctor. Local markup only: no emoji standing in
// for an illustration, no recycled icon-set glyph. Motion is declared inside
// the sprite so prefers-reduced-motion silences it before React hydrates.
// ============================================================================

const INK = '#fbbf24';

export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 260" className={`tool-hero-art ${className}`} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes kd-press { 0%,72%,100% { transform: translateY(0) } 80% { transform: translateY(3px) } }
      @keyframes kd-glow { 0%,100% { opacity: .35 } 50% { opacity: .9 } }
      .kd-k1 { animation: kd-press 3.2s ease-in-out infinite; }
      .kd-k2 { animation: kd-press 3.2s ease-in-out infinite .5s; }
      .kd-k3 { animation: kd-press 3.2s ease-in-out infinite 1s; }
      .kd-beam { animation: kd-glow 2.6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .kd-k1,.kd-k2,.kd-k3,.kd-beam { animation: none !important; }
      }
    `}</style>

    <rect x="10" y="66" width="400" height="184" rx="18" fill="#140c02" stroke="rgba(251,191,36,0.22)" />

    {/* four rows of keycaps */}
    {[0, 1, 2, 3].map(r =>
      Array.from({ length: r === 3 ? 5 : 12 }).map((_, c) => {
        const wide = r === 3 && c === 2;
        const x = 26 + c * (wide ? 0 : 31) + (r === 3 ? c * 30 : 0) + (r === 1 ? 8 : 0) + (r === 2 ? 16 : 0);
        return (
          <rect
            key={`${r}-${c}`}
            x={r === 3 ? 26 + c * 72 : x}
            y={82 + r * 38}
            width={r === 3 && c === 2 ? 100 : 26}
            height="28"
            rx="5"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.10)"
          />
        );
      })
    )}

    {/* the three keys that are "being pressed" */}
    <g className="kd-k1">
      <rect x="88" y="120" width="26" height="28" rx="5" fill={INK} />
      <rect x="96" y="131" width="10" height="5" rx="2" fill="#0c0802" opacity="0.7" />
    </g>
    <g className="kd-k2">
      <rect x="181" y="158" width="26" height="28" rx="5" fill={INK} opacity="0.85" />
    </g>
    <g className="kd-k3">
      <rect x="274" y="82" width="26" height="28" rx="5" fill={INK} opacity="0.65" />
    </g>

    {/* the readout above the board */}
    <rect x="112" y="12" width="196" height="42" rx="10" fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.35)" />
    <text x="210" y="39" textAnchor="middle" fill={INK} fontSize="19" fontWeight="800" fontFamily="ui-monospace, monospace">
      KeyQ
    </text>
    <path className="kd-beam" d="M101 118 L 150 56" stroke={INK} strokeWidth="1.6" strokeDasharray="4 4" />
  </svg>
);

const base = 'w-full h-full';

export const IconBoard: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="4" y="13" width="40" height="24" rx="4" stroke={INK} strokeWidth="2" />
    {[0, 1].map(r =>
      [0, 1, 2, 3, 4].map(c => (
        <rect key={`${r}-${c}`} x={9 + c * 6.4} y={18 + r * 6.5} width="4.6" height="4.6" rx="1.2" fill={INK} opacity={r === 0 && c === 2 ? 0.95 : 0.32} />
      ))
    )}
    <rect x="15" y="31" width="18" height="3.5" rx="1.5" fill={INK} opacity="0.32" />
  </svg>
);

export const IconLayoutMap: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="7" y="10" width="15" height="15" rx="3.5" stroke={INK} strokeWidth="2" />
    <text x="14.5" y="21" textAnchor="middle" fill={INK} fontSize="9" fontWeight="800" fontFamily="monospace">Q</text>
    <rect x="26" y="23" width="15" height="15" rx="3.5" stroke={INK} strokeWidth="2" opacity="0.6" />
    <text x="33.5" y="34" textAnchor="middle" fill={INK} fontSize="9" fontWeight="800" fontFamily="monospace">A</text>
    <path d="M22 21 C 27 21, 24 27, 27 29" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M27 29 l 3.5 -1.2 M27 29 l -0.6 -3.6" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconRollover: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    {[0, 1, 2, 3].map(i => (
      <rect key={i} x={6 + i * 9.5} y={16 + (i % 2) * 6} width="8" height="16" rx="2.5" fill={INK} opacity={0.35 + i * 0.2} />
    ))}
    <path d="M6 40 h36" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const IconStuck: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="10" y="14" width="20" height="20" rx="4" stroke={INK} strokeWidth="2" />
    <path d="M17 24 h6" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="34" cy="32" r="8" stroke={INK} strokeWidth="2" />
    <path d="M34 28 v4.5 M34 35.5 v0.5" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const IconOffline: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M24 7 l 14 6 v10 c0 9 -6 15 -14 18 c -8 -3 -14 -9 -14 -18 V13 z" stroke={INK} strokeWidth="2" />
    <path d="M17 24 l 5 5 l 9 -10" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconReport: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="9" y="7" width="24" height="30" rx="4" stroke={INK} strokeWidth="2" />
    <path d="M15 16 h12 M15 22 h12 M15 28 h7" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M30 33 h9" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M35 29 l 5 4 l -5 4" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const frame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 120" className="w-full h-auto" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#140c02" stroke="rgba(251,191,36,0.16)" />
    {children}
  </svg>
);

export const StepArm: React.FC = () =>
  frame(
    <>
      <rect x="30" y="26" width="140" height="46" rx="8" stroke={INK} strokeWidth="1.8" strokeDasharray="6 4" />
      <text x="100" y="54" textAnchor="middle" fill={INK} fontSize="12" fontWeight="800" fontFamily="monospace">
        click here
      </text>
      <circle cx="100" cy="92" r="7" fill={INK} opacity="0.85" />
      <path d="M100 85 v-6" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  );

export const StepPress: React.FC = () =>
  frame(
    <>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <rect key={i} x={22 + i * 27} y="34" width="22" height="22" rx="4" fill={i === 2 ? INK : 'rgba(255,255,255,0.05)'} stroke={i === 2 ? INK : 'rgba(255,255,255,0.12)'} />
      ))}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <rect key={'b' + i} x={22 + i * 27} y="62" width="22" height="22" rx="4" fill={i === 4 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'} stroke={i === 4 ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.12)'} />
      ))}
      <path d="M100 96 h0" stroke={INK} strokeWidth="2" />
    </>
  );

export const StepSpot: React.FC = () =>
  frame(
    <>
      <rect x="26" y="30" width="60" height="26" rx="5" fill="rgba(245,158,11,0.18)" stroke="rgba(245,158,11,0.5)" />
      <rect x="26" y="64" width="60" height="26" rx="5" fill="rgba(239,68,68,0.25)" stroke="#f87171" />
      <path d="M96 43 h30 M96 77 h30" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeDasharray="4 3" />
      <text x="160" y="47" textAnchor="middle" fill={INK} fontSize="11" fontWeight="800" fontFamily="monospace">OK</text>
      <text x="160" y="81" textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="800" fontFamily="monospace">STUCK</text>
    </>
  );

export const StepShare: React.FC = () =>
  frame(
    <>
      <rect x="22" y="28" width="80" height="52" rx="7" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" />
      {[0, 1, 2].map(r =>
        [0, 1, 2, 3].map(c => (
          <rect key={`${r}-${c}`} x={30 + c * 18} y={36 + r * 15} width="14" height="11" rx="2" fill={r === 1 && c === 2 ? '#f87171' : INK} opacity={r === 1 && c === 2 ? 0.9 : 0.35} />
        ))
      )}
      <path d="M110 54 h34" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M137 47 l 8 7 l -8 7" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="150" y="38" width="30" height="32" rx="6" stroke={INK} strokeWidth="1.8" strokeDasharray="5 4" />
      <text x="165" y="58" textAnchor="middle" fill={INK} fontSize="10" fontWeight="800" fontFamily="monospace">PNG</text>
    </>
  );
