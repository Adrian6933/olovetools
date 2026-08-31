import React from 'react';

// ============================================================================
// Hand-drawn SVG art for EpochFlow. Local markup only: no emoji standing in for
// an illustration, no recycled icon-set glyph. Motion is declared inside the
// sprite so prefers-reduced-motion silences it before React hydrates.
// ============================================================================

const INK = '#38bdf8';

export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 250" className={className} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes ef-sweep { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      @keyframes ef-blink { 0%,100% { opacity:.3 } 50% { opacity:1 } }
      .ef-hand { transform-origin: 96px 132px; animation: ef-sweep 12s linear infinite; }
      .ef-digit { animation: ef-blink 2.2s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .ef-hand, .ef-digit { animation: none !important; opacity: 1 !important; }
      }
    `}</style>

    {/* clock face */}
    <circle cx="96" cy="132" r="62" fill="#04101f" stroke="rgba(56,189,248,0.25)" strokeWidth="2" />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      // Rounded to two decimals on purpose: an un-rounded trig value serialises
      // differently on the server than in the browser and breaks hydration.
      const x1 = (96 + Math.sin(a) * 50).toFixed(2);
      const y1 = (132 - Math.cos(a) * 50).toFixed(2);
      const x2 = (96 + Math.sin(a) * 56).toFixed(2);
      const y2 = (132 - Math.cos(a) * 56).toFixed(2);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeOpacity={i % 3 === 0 ? 0.8 : 0.3} strokeWidth="2" />;
    })}
    <line className="ef-hand" x1="96" y1="132" x2="96" y2="94" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    <line x1="96" y1="132" x2="126" y2="132" stroke={INK} strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="96" cy="132" r="4" fill={INK} />

    {/* the counter next to it */}
    <rect x="184" y="60" width="226" height="52" rx="12" fill="#04101f" stroke="rgba(56,189,248,0.22)" />
    <text x="200" y="84" fill="#64748b" fontSize="9" fontWeight="700" fontFamily="ui-monospace, monospace">
      UNIX
    </text>
    <text x="200" y="102" fill={INK} fontSize="17" fontWeight="800" fontFamily="ui-monospace, monospace">
      17000000
      <tspan className="ef-digit">00</tspan>
    </text>

    <rect x="184" y="122" width="226" height="42" rx="10" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.14)" />
    <text x="200" y="139" fill="#64748b" fontSize="8.5" fontWeight="700" fontFamily="ui-monospace, monospace">
      ISO 8601
    </text>
    <text x="200" y="155" fill="#94a3b8" fontSize="12" fontFamily="ui-monospace, monospace">
      2023-11-14T22:13:20Z
    </text>

    <rect x="184" y="174" width="108" height="38" rx="10" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.14)" />
    <text x="198" y="190" fill="#64748b" fontSize="8.5" fontWeight="700" fontFamily="ui-monospace, monospace">TOKYO</text>
    <text x="198" y="205" fill="#94a3b8" fontSize="11" fontFamily="ui-monospace, monospace">07:13 +09</text>

    <rect x="302" y="174" width="108" height="38" rx="10" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.14)" />
    <text x="316" y="190" fill="#64748b" fontSize="8.5" fontWeight="700" fontFamily="ui-monospace, monospace">MADRID</text>
    <text x="316" y="205" fill="#94a3b8" fontSize="11" fontFamily="ui-monospace, monospace">23:13 +01</text>
  </svg>
);

const base = 'w-full h-full';

export const IconUnits: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    {['s', 'ms', 'µs', 'ns'].map((u, i) => (
      <g key={u}>
        <rect x="5" y={5 + i * 10} width="38" height="8" rx="2.5" fill={INK} opacity={0.9 - i * 0.2} />
        <text x="9" y={11.5 + i * 10} fill="#04101f" fontSize="5.5" fontWeight="800" fontFamily="ui-monospace, monospace">
          {u}
        </text>
      </g>
    ))}
  </svg>
);

export const IconZones: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="16" stroke={INK} strokeWidth="2" />
    <ellipse cx="24" cy="24" rx="7" ry="16" stroke={INK} strokeWidth="1.6" opacity="0.55" />
    <path d="M8 24 h32" stroke={INK} strokeWidth="1.6" opacity="0.55" />
    <path d="M11 15 h26 M11 33 h26" stroke={INK} strokeWidth="1.4" opacity="0.35" />
  </svg>
);

export const IconSystems: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="6" y="10" width="16" height="12" rx="3" stroke={INK} strokeWidth="1.8" />
    <rect x="26" y="10" width="16" height="12" rx="3" stroke={INK} strokeWidth="1.8" opacity="0.55" />
    <rect x="6" y="26" width="16" height="12" rx="3" stroke={INK} strokeWidth="1.8" opacity="0.55" />
    <rect x="26" y="26" width="16" height="12" rx="3" fill={INK} opacity="0.8" />
  </svg>
);

export const IconDst: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="18" cy="24" r="7" fill={INK} opacity="0.85" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <line
          key={i}
          x1={(18 + Math.cos(a) * 10).toFixed(2)}
          y1={(24 + Math.sin(a) * 10).toFixed(2)}
          x2={(18 + Math.cos(a) * 13).toFixed(2)}
          y2={(24 + Math.sin(a) * 13).toFixed(2)}
          stroke={INK}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.6"
        />
      );
    })}
    <path d="M34 17 a8 8 0 1 0 6 12 a9 9 0 0 1 -6 -12 z" fill={INK} opacity="0.5" />
  </svg>
);

export const IconPrecise: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M8 30 h32" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
    {[0, 1, 2, 3, 4, 5, 6].map(i => (
      <line key={i} x1={8 + i * 5.4} y1={30} x2={8 + i * 5.4} y2={i % 2 ? 24 : 20} stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    ))}
    <circle cx="24" cy="14" r="4" fill={INK} />
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
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#04101f" stroke="rgba(56,189,248,0.16)" />
    {children}
  </svg>
);

export const StepPaste: React.FC = () =>
  frame(
    <>
      <rect x="20" y="32" width="160" height="26" rx="7" stroke={INK} strokeWidth="1.6" />
      <text x="32" y="49" fill={INK} fontSize="12" fontFamily="ui-monospace, monospace">
        1700000000123456
      </text>
      <rect x="20" y="72" width="76" height="20" rx="5" fill="rgba(56,189,248,0.18)" stroke="rgba(56,189,248,0.45)" />
      <text x="58" y="86" textAnchor="middle" fill={INK} fontSize="9" fontWeight="700" fontFamily="sans-serif">
        µs
      </text>
      <rect x="104" y="72" width="76" height="20" rx="5" stroke="rgba(255,255,255,0.12)" />
      <text x="142" y="86" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="700" fontFamily="sans-serif">
        ms
      </text>
    </>
  );

export const StepZone: React.FC = () =>
  frame(
    <>
      <circle cx="52" cy="58" r="26" stroke={INK} strokeWidth="1.8" />
      <ellipse cx="52" cy="58" rx="11" ry="26" stroke={INK} strokeWidth="1.4" opacity="0.5" />
      <path d="M26 58 h52" stroke={INK} strokeWidth="1.4" opacity="0.5" />
      <rect x="96" y="34" width="84" height="20" rx="5" fill="rgba(56,189,248,0.1)" />
      <text x="106" y="48" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace, monospace">Asia/Tokyo</text>
      <rect x="96" y="60" width="84" height="20" rx="5" fill="rgba(56,189,248,0.1)" />
      <text x="106" y="74" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace, monospace">UTC+09:00</text>
    </>
  );

export const StepCompare: React.FC = () =>
  frame(
    <>
      {['Unix', 'FILETIME', '.NET', 'Excel'].map((label, i) => (
        <g key={label}>
          <rect x="20" y={22 + i * 20} width="160" height="15" rx="4" fill="rgba(255,255,255,0.035)" />
          <text x="28" y={33 + i * 20} fill="#64748b" fontSize="8" fontWeight="700" fontFamily="sans-serif">
            {label}
          </text>
          <rect x="86" y={25 + i * 20} width={86 - i * 12} height="9" rx="2.5" fill={INK} opacity={0.55 - i * 0.1} />
        </g>
      ))}
    </>
  );

export const StepRead: React.FC = () =>
  frame(
    <>
      <rect x="20" y="24" width="160" height="22" rx="6" fill="rgba(56,189,248,0.08)" />
      <text x="30" y="39" fill="#94a3b8" fontSize="10" fontFamily="ui-monospace, monospace">
        2023-11-14T22:13:20Z
      </text>
      <rect x="20" y="52" width="76" height="20" rx="5" fill="rgba(255,255,255,0.04)" />
      <text x="30" y="66" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">Tuesday</text>
      <rect x="104" y="52" width="76" height="20" rx="5" fill="rgba(255,255,255,0.04)" />
      <text x="114" y="66" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">2 years ago</text>
      <rect x="20" y="78" width="160" height="20" rx="5" fill="rgba(255,255,255,0.04)" />
      <text x="30" y="92" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace, monospace">CET · no DST</text>
    </>
  );
