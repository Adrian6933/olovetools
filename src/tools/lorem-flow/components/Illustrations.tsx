import React from 'react';

// ============================================================================
// Hand-drawn SVG art for LoremFlow. Local markup only: no emoji standing in for
// an illustration, no recycled icon-set glyph. Motion is declared inside the
// sprite so prefers-reduced-motion silences it before React hydrates.
// ============================================================================

const INK = '#a78bfa';

export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 250" className={className} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes lf-fill { 0% { width: 0 } 60%,100% { width: var(--w) } }
      @keyframes lf-blink { 0%,100% { opacity: 0 } 50% { opacity: 1 } }
      .lf-line { animation: lf-fill 4.5s ease-in-out infinite; }
      .lf-caret { animation: lf-blink 1.1s steps(1) infinite; }
      @media (prefers-reduced-motion: reduce) {
        .lf-line { animation: none !important; width: var(--w) !important; }
        .lf-caret { animation: none !important; opacity: 1 !important; }
      }
    `}</style>

    <rect x="10" y="20" width="188" height="210" rx="14" fill="#150a20" stroke="rgba(167,139,250,0.2)" />
    <text x="28" y="46" fill="#64748b" fontSize="9" fontWeight="700" fontFamily="ui-monospace, monospace">
      LATIN
    </text>
    {[0, 1, 2, 3, 4, 5, 6].map(i => (
      <rect
        key={i}
        className="lf-line"
        style={{ ['--w' as string]: `${[140, 152, 118, 146, 96, 150, 124][i]}px`, animationDelay: `${i * 0.18}s` }}
        x="28"
        y={62 + i * 21}
        width={[140, 152, 118, 146, 96, 150, 124][i]}
        height="9"
        rx="4"
        fill={INK}
        opacity={i === 4 ? 0.3 : 0.55}
      />
    ))}
    <rect className="lf-caret" x="180" y="188" width="2.5" height="12" fill={INK} />

    <rect x="222" y="20" width="188" height="210" rx="14" fill="#150a20" stroke="rgba(167,139,250,0.2)" />
    <text x="240" y="46" fill="#64748b" fontSize="9" fontWeight="700" fontFamily="ui-monospace, monospace">
      日本語
    </text>
    {/* CJK: no spaces, so the "words" pack tighter and break anywhere */}
    {[0, 1, 2, 3, 4, 5, 6].map(row =>
      Array.from({ length: 9 }).map((_, c) => (
        <rect
          key={`${row}-${c}`}
          x={240 + c * 17}
          y={60 + row * 21}
          width="13"
          height="13"
          rx="2.5"
          fill={INK}
          opacity={row === 6 && c > 4 ? 0.12 : 0.45}
        />
      ))
    )}
  </svg>
);

const base = 'w-full h-full';

export const IconScripts: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <text x="12" y="22" textAnchor="middle" fill={INK} fontSize="14" fontWeight="800" fontFamily="serif">A</text>
    <text x="34" y="22" textAnchor="middle" fill={INK} fontSize="13" fontWeight="700" fontFamily="sans-serif">あ</text>
    <text x="12" y="41" textAnchor="middle" fill={INK} fontSize="13" fontWeight="700" fontFamily="sans-serif">Ж</text>
    <text x="34" y="41" textAnchor="middle" fill={INK} fontSize="13" fontWeight="700" fontFamily="sans-serif">ع</text>
  </svg>
);

export const IconSeed: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="15" stroke={INK} strokeWidth="2" strokeDasharray="4 3" />
    <path d="M18 24 l4 4 l8 -9" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="24" cy="24" r="3.5" fill={INK} opacity="0.35" />
  </svg>
);

export const IconFormats: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="7" y="10" width="34" height="28" rx="4" stroke={INK} strokeWidth="2" />
    <path d="M14 19 l -4 4 l 4 4" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M34 19 l 4 4 l -4 4" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 16 l -6 16" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const IconExact: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M9 32 h30" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    {[0, 1, 2, 3, 4, 5].map(i => (
      <line key={i} x1={9 + i * 6} y1={32} x2={9 + i * 6} y2={i % 2 ? 26 : 21} stroke={INK} strokeWidth="2" strokeLinecap="round" />
    ))}
    <text x="34" y="18" textAnchor="middle" fill={INK} fontSize="11" fontWeight="800" fontFamily="ui-monospace, monospace">240</text>
  </svg>
);

export const IconRtl: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M38 24 H12" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M19 17 l -7 7 l 7 7" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="14" y="33" width="24" height="4" rx="2" fill={INK} opacity="0.35" />
    <rect x="20" y="10" width="18" height="4" rx="2" fill={INK} opacity="0.35" />
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
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#150a20" stroke="rgba(167,139,250,0.16)" />
    {children}
  </svg>
);

export const StepScript: React.FC = () =>
  frame(
    <>
      {['A', 'あ', 'Ж', 'ع'].map((g, i) => (
        <g key={g}>
          <rect
            x={20 + i * 42}
            y="30"
            width="34"
            height="30"
            rx="6"
            fill={i === 1 ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.04)'}
            stroke={i === 1 ? INK : 'rgba(255,255,255,0.12)'}
          />
          <text x={37 + i * 42} y="51" textAnchor="middle" fill={i === 1 ? INK : '#64748b'} fontSize="15" fontWeight="700">
            {g}
          </text>
        </g>
      ))}
      <rect x="20" y="74" width="160" height="8" rx="4" fill={INK} opacity="0.3" />
      <rect x="20" y="88" width="120" height="8" rx="4" fill={INK} opacity="0.3" />
    </>
  );

export const StepAmount: React.FC = () =>
  frame(
    <>
      {['Par', 'Sent', 'Word', 'Char'].map((label, i) => (
        <g key={label}>
          <rect
            x={16 + i * 43}
            y="28"
            width="38"
            height="20"
            rx="5"
            fill={i === 3 ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.04)'}
            stroke={i === 3 ? INK : 'rgba(255,255,255,0.12)'}
          />
          <text x={35 + i * 43} y="42" textAnchor="middle" fill={i === 3 ? INK : '#64748b'} fontSize="8" fontWeight="700" fontFamily="sans-serif">
            {label}
          </text>
        </g>
      ))}
      <rect x="16" y="62" width="168" height="26" rx="6" stroke={INK} strokeWidth="1.6" />
      <text x="30" y="79" fill={INK} fontSize="13" fontFamily="ui-monospace, monospace">240</text>
      <text x="150" y="79" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">exactly</text>
    </>
  );

export const StepSeed: React.FC = () =>
  frame(
    <>
      <rect x="24" y="30" width="70" height="22" rx="6" stroke={INK} strokeWidth="1.6" />
      <text x="59" y="45" textAnchor="middle" fill={INK} fontSize="11" fontFamily="ui-monospace, monospace">k7f2a1</text>
      <path d="M100 41 h20" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M114 36 l 6 5 l -6 5" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {[0, 1, 2].map(i => (
        <rect key={i} x={128} y={30 + i * 9} width={52 - i * 10} height="5" rx="2.5" fill={INK} opacity="0.45" />
      ))}
      <path d="M24 66 h70" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      <text x="24" y="86" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">same seed</text>
      <text x="128" y="86" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">same text</text>
    </>
  );

export const StepFormat: React.FC = () =>
  frame(
    <>
      <rect x="18" y="26" width="164" height="20" rx="5" fill="rgba(255,255,255,0.04)" />
      <text x="28" y="40" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace, monospace">&lt;p&gt;Lorem ipsum…&lt;/p&gt;</text>
      <rect x="18" y="52" width="164" height="20" rx="5" fill="rgba(255,255,255,0.04)" />
      <text x="28" y="66" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace, monospace">## Heading</text>
      <rect x="18" y="78" width="164" height="20" rx="5" fill="rgba(167,139,250,0.15)" />
      <text x="28" y="92" fill={INK} fontSize="9" fontFamily="ui-monospace, monospace">plain text</text>
    </>
  );
