import React from 'react';

// ============================================================================
// Hand-drawn SVG art for BinaryFlow. Local markup only: no emoji standing in
// for an illustration, no recycled icon-set glyph. Motion is declared inside
// the sprite so prefers-reduced-motion silences it before React hydrates.
// ============================================================================

const INK = '#60a5fa';

export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 250" className={className} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes bf-flip { 0%,44%,100% { opacity:.25 } 50%,94% { opacity:1 } }
      @keyframes bf-slide { 0%,100% { transform: translateX(0) } 50% { transform: translateX(6px) } }
      .bf-b1 { animation: bf-flip 3.4s ease-in-out infinite; }
      .bf-b2 { animation: bf-flip 3.4s ease-in-out infinite .4s; }
      .bf-b3 { animation: bf-flip 3.4s ease-in-out infinite .8s; }
      .bf-arrow { animation: bf-slide 2.8s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .bf-b1,.bf-b2,.bf-b3,.bf-arrow { animation: none !important; opacity: 1 !important; }
      }
    `}</style>

    <rect x="8" y="34" width="180" height="182" rx="16" fill="#050d1c" stroke="rgba(96,165,250,0.2)" />
    <text x="26" y="62" fill={INK} fontSize="11" fontWeight="800" fontFamily="ui-monospace, monospace" opacity="0.6">
      BITS
    </text>
    {/* two rows of bit cells, a few of them "flipping" */}
    {[0, 1].map(row =>
      Array.from({ length: 8 }).map((_, i) => {
        const on = [1, 3, 4, 6].includes(i) === (row === 0);
        const cls = i === 2 ? 'bf-b1' : i === 5 ? 'bf-b2' : i === 7 ? 'bf-b3' : '';
        return (
          <g key={`${row}-${i}`} className={cls}>
            <rect
              x={26 + i * 18}
              y={78 + row * 34}
              width="15"
              height="26"
              rx="3.5"
              fill={on ? INK : 'rgba(255,255,255,0.04)'}
              stroke={on ? INK : 'rgba(255,255,255,0.1)'}
            />
            <text
              x={33.5 + i * 18}
              y={96 + row * 34}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fontFamily="ui-monospace, monospace"
              fill={on ? '#020610' : '#64748b'}
            >
              {on ? '1' : '0'}
            </text>
          </g>
        );
      })
    )}
    <rect x="26" y="152" width="144" height="1" fill="rgba(96,165,250,0.2)" />
    <text x="26" y="176" fill="#94a3b8" fontSize="12" fontFamily="ui-monospace, monospace">
      0xC0FFEE
    </text>
    <text x="26" y="196" fill="#64748b" fontSize="12" fontFamily="ui-monospace, monospace">
      12648430
    </text>

    <g className="bf-arrow">
      <path d="M200 125 h34" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M228 118 l 8 7 l -8 7" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    <rect x="246" y="34" width="166" height="182" rx="16" fill="#050d1c" stroke="rgba(96,165,250,0.2)" />
    <text x="264" y="62" fill={INK} fontSize="11" fontWeight="800" fontFamily="ui-monospace, monospace" opacity="0.6">
      IEEE-754
    </text>
    <rect x="264" y="76" width="16" height="24" rx="3" fill="#fb7185" />
    <rect x="284" y="76" width="44" height="24" rx="3" fill="#fbbf24" />
    <rect x="332" y="76" width="62" height="24" rx="3" fill="#38bdf8" />
    <text x="272" y="112" fill="#fb7185" fontSize="8" fontWeight="700" fontFamily="sans-serif">S</text>
    <text x="298" y="112" fill="#fbbf24" fontSize="8" fontWeight="700" fontFamily="sans-serif">EXP</text>
    <text x="350" y="112" fill="#38bdf8" fontSize="8" fontWeight="700" fontFamily="sans-serif">MANTISSA</text>
    <text x="264" y="146" fill="#94a3b8" fontSize="12" fontFamily="ui-monospace, monospace">0.1 + 0.2</text>
    <text x="264" y="168" fill="#64748b" fontSize="10.5" fontFamily="ui-monospace, monospace">
      0.30000000000
    </text>
    <text x="264" y="184" fill="#64748b" fontSize="10.5" fontFamily="ui-monospace, monospace">
      000004440892
    </text>
  </svg>
);

const base = 'w-full h-full';

export const IconBits: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    {[0, 1, 2, 3].map(i => (
      <rect key={i} x={6 + i * 10} y="14" width="8" height="20" rx="2" fill={INK} opacity={i % 2 ? 0.3 : 0.9} />
    ))}
    <path d="M6 40 h36" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const IconSigned: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="16" stroke={INK} strokeWidth="2" />
    <path d="M14 24 h8" stroke="#fb7185" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M26 24 h8 M30 20 v8" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const IconFloat: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="5" y="18" width="7" height="13" rx="2" fill="#fb7185" />
    <rect x="14" y="18" width="13" height="13" rx="2" fill="#fbbf24" />
    <rect x="29" y="18" width="14" height="13" rx="2" fill="#38bdf8" />
    <path d="M5 38 h38" stroke={INK} strokeWidth="1.6" opacity="0.35" strokeLinecap="round" />
    <path d="M5 12 h38" stroke={INK} strokeWidth="1.6" opacity="0.35" strokeLinecap="round" />
  </svg>
);

export const IconBase: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <text x="24" y="22" textAnchor="middle" fill={INK} fontSize="15" fontWeight="800" fontFamily="ui-monospace, monospace">
      36
    </text>
    <path d="M12 28 h24" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <text x="24" y="42" textAnchor="middle" fill={INK} fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace" opacity="0.7">
      2
    </text>
  </svg>
);

export const IconBytes: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="7" y="10" width="34" height="28" rx="4" stroke={INK} strokeWidth="2" />
    <path d="M13 18 h9 M26 18 h9 M13 25 h6 M23 25 h12 M13 32 h14" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
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
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#050d1c" stroke="rgba(96,165,250,0.16)" />
    {children}
  </svg>
);

export const StepType: React.FC = () =>
  frame(
    <>
      <rect x="22" y="34" width="156" height="30" rx="7" stroke={INK} strokeWidth="1.6" />
      <text x="36" y="54" fill={INK} fontSize="13" fontFamily="ui-monospace, monospace">-42</text>
      <rect x="96" y="42" width="2" height="14" fill={INK} opacity="0.8" />
      <rect x="22" y="76" width="46" height="20" rx="5" fill="rgba(96,165,250,0.18)" stroke="rgba(96,165,250,0.4)" />
      <text x="45" y="90" textAnchor="middle" fill={INK} fontSize="9" fontWeight="700" fontFamily="sans-serif">DEC</text>
      <rect x="74" y="76" width="46" height="20" rx="5" stroke="rgba(255,255,255,0.12)" />
      <rect x="126" y="76" width="46" height="20" rx="5" stroke="rgba(255,255,255,0.12)" />
    </>
  );

export const StepWidth: React.FC = () =>
  frame(
    <>
      {['8', '16', '32', '64'].map((w, i) => (
        <g key={w}>
          <rect
            x={20 + i * 42}
            y="30"
            width="34"
            height="22"
            rx="5"
            fill={i === 2 ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.04)'}
            stroke={i === 2 ? INK : 'rgba(255,255,255,0.12)'}
          />
          <text x={37 + i * 42} y="45" textAnchor="middle" fill={i === 2 ? INK : '#64748b'} fontSize="10" fontWeight="700" fontFamily="sans-serif">
            {w}
          </text>
        </g>
      ))}
      <rect x="20" y="68" width="10" height="20" rx="2.5" fill="#fb7185" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={33 + i * 16} y="68" width="10" height="20" rx="2.5" fill={INK} opacity={i % 3 ? 0.25 : 0.8} />
      ))}
      <text x="100" y="104" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="ui-monospace, monospace">
        -42 = 0xD6
      </text>
    </>
  );

export const StepFlip: React.FC = () =>
  frame(
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={26 + i * 19}
          y="34"
          width="15"
          height="26"
          rx="3.5"
          fill={i === 3 ? INK : 'rgba(255,255,255,0.05)'}
          stroke={i === 3 ? INK : 'rgba(255,255,255,0.12)'}
        />
      ))}
      <path d="M100 72 v10" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="90" r="8" fill="rgba(96,165,250,0.25)" stroke={INK} strokeWidth="1.6" />
      <path d="M96 90 l 3 3 l 5 -6" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );

export const StepRead: React.FC = () =>
  frame(
    <>
      <rect x="20" y="26" width="160" height="18" rx="5" fill="rgba(255,255,255,0.04)" />
      <text x="30" y="39" fill="#94a3b8" fontSize="10" fontFamily="ui-monospace, monospace">1101 0110</text>
      <rect x="20" y="50" width="76" height="18" rx="5" fill="rgba(255,255,255,0.04)" />
      <text x="30" y="63" fill="#94a3b8" fontSize="10" fontFamily="ui-monospace, monospace">214</text>
      <rect x="104" y="50" width="76" height="18" rx="5" fill="rgba(251,113,133,0.15)" />
      <text x="114" y="63" fill="#fb7185" fontSize="10" fontFamily="ui-monospace, monospace">-42</text>
      <rect x="20" y="74" width="160" height="18" rx="5" fill="rgba(255,255,255,0.04)" />
      <text x="30" y="87" fill="#94a3b8" fontSize="10" fontFamily="ui-monospace, monospace">0xD6   0o326</text>
    </>
  );
