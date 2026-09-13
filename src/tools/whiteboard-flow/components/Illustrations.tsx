import React from 'react';

// ============================================================================
// Hand-drawn SVG art for WhiteboardFlow.
// ----------------------------------------------------------------------------
// Everything here is local markup: no emoji standing in for an illustration and
// no recycled icon-set glyph. Motion is declared in CSS inside the sprite so it
// is neutralised by prefers-reduced-motion even before React hydrates.
// ============================================================================

const INK = '#67e8f9';

export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes wbf-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
      @keyframes wbf-dash { to { stroke-dashoffset: -24 } }
      .wbf-n1 { animation: wbf-float 5.5s ease-in-out infinite; }
      .wbf-n2 { animation: wbf-float 6.5s ease-in-out infinite 0.7s; }
      .wbf-n3 { animation: wbf-float 7.5s ease-in-out infinite 1.4s; }
      .wbf-link { stroke-dasharray: 6 6; animation: wbf-dash 2.4s linear infinite; }
      @media (prefers-reduced-motion: reduce) {
        .wbf-n1, .wbf-n2, .wbf-n3, .wbf-link { animation: none !important; }
      }
    `}</style>

    <rect x="8" y="8" width="404" height="284" rx="18" fill="#050f14" stroke="rgba(103,232,249,0.18)" />
    <g fill="rgba(103,232,249,0.14)">
      {Array.from({ length: 9 }).map((_, r) =>
        Array.from({ length: 13 }).map((_, c) => (
          <circle key={`${r}-${c}`} cx={30 + c * 30} cy={34 + r * 30} r="1.4" />
        ))
      )}
    </g>

    <path
      className="wbf-link"
      d="M126 96 C 176 96, 176 168, 226 168"
      stroke={INK}
      strokeOpacity="0.6"
      strokeWidth="2"
    />
    <path
      className="wbf-link"
      d="M296 168 C 330 168, 330 232, 300 232"
      stroke={INK}
      strokeOpacity="0.45"
      strokeWidth="2"
    />

    <g className="wbf-n1">
      <rect x="42" y="60" width="88" height="70" rx="8" fill="#fef08a" stroke="#fde047" />
      <rect x="54" y="76" width="58" height="6" rx="3" fill="#422006" opacity="0.55" />
      <rect x="54" y="90" width="44" height="6" rx="3" fill="#422006" opacity="0.35" />
      <rect x="54" y="104" width="50" height="6" rx="3" fill="#422006" opacity="0.35" />
    </g>

    <g className="wbf-n2">
      <rect x="222" y="132" width="88" height="70" rx="8" fill="#bae6fd" stroke="#7dd3fc" />
      <rect x="234" y="148" width="52" height="6" rx="3" fill="#082f49" opacity="0.55" />
      <rect x="234" y="162" width="60" height="6" rx="3" fill="#082f49" opacity="0.35" />
      <rect x="234" y="176" width="38" height="6" rx="3" fill="#082f49" opacity="0.35" />
    </g>

    <g className="wbf-n3">
      <rect x="214" y="204" width="88" height="60" rx="8" fill="#a7f3d0" stroke="#6ee7b7" />
      <rect x="226" y="220" width="46" height="6" rx="3" fill="#022c22" opacity="0.55" />
      <rect x="226" y="234" width="58" height="6" rx="3" fill="#022c22" opacity="0.35" />
    </g>

    <g className="wbf-n2">
      <rect x="60" y="176" width="76" height="58" rx="8" fill="#ddd6fe" stroke="#c4b5fd" />
      <rect x="72" y="192" width="42" height="6" rx="3" fill="#2e1065" opacity="0.55" />
      <rect x="72" y="206" width="52" height="6" rx="3" fill="#2e1065" opacity="0.3" />
    </g>
  </svg>
);

const iconBase = 'w-full h-full';

export const IconCanvas: React.FC = () => (
  <svg viewBox="0 0 48 48" className={iconBase} fill="none" aria-hidden="true">
    <rect x="5" y="9" width="38" height="30" rx="5" stroke={INK} strokeWidth="2" />
    <circle cx="14" cy="18" r="1.5" fill={INK} opacity="0.5" />
    <circle cx="24" cy="18" r="1.5" fill={INK} opacity="0.5" />
    <circle cx="34" cy="18" r="1.5" fill={INK} opacity="0.5" />
    <circle cx="14" cy="28" r="1.5" fill={INK} opacity="0.5" />
    <circle cx="24" cy="28" r="1.5" fill={INK} opacity="0.5" />
    <circle cx="34" cy="28" r="1.5" fill={INK} opacity="0.5" />
    <rect x="18" y="21" width="14" height="11" rx="2.5" fill={INK} opacity="0.85" />
  </svg>
);

export const IconTouch: React.FC = () => (
  <svg viewBox="0 0 48 48" className={iconBase} fill="none" aria-hidden="true">
    <rect x="9" y="10" width="16" height="13" rx="3" fill={INK} opacity="0.8" />
    <rect x="27" y="24" width="14" height="12" rx="3" stroke={INK} strokeWidth="2" strokeDasharray="4 3" />
    <path d="M25 18 C 32 18, 32 26, 30 29" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    <path d="M30 29 l 4 -1 M30 29 l -1 -4" stroke={INK} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconUndo: React.FC = () => (
  <svg viewBox="0 0 48 48" className={iconBase} fill="none" aria-hidden="true">
    <path d="M14 20 H30 a9 9 0 0 1 0 18 H20" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M20 12 l -8 8 l 8 8" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconExport: React.FC = () => (
  <svg viewBox="0 0 48 48" className={iconBase} fill="none" aria-hidden="true">
    <rect x="8" y="12" width="22" height="26" rx="4" stroke={INK} strokeWidth="2" />
    <path d="M24 24 h14" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M33 19 l 6 5 l -6 5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="13" y="18" width="10" height="4" rx="2" fill={INK} opacity="0.6" />
  </svg>
);

export const IconOffline: React.FC = () => (
  <svg viewBox="0 0 48 48" className={iconBase} fill="none" aria-hidden="true">
    <path d="M24 7 l 14 6 v10 c0 9 -6 15 -14 18 c -8 -3 -14 -9 -14 -18 V13 z" stroke={INK} strokeWidth="2" />
    <path d="M17 24 l 5 5 l 9 -10" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconHandoff: React.FC = () => (
  <svg viewBox="0 0 48 48" className={iconBase} fill="none" aria-hidden="true">
    <rect x="6" y="16" width="15" height="16" rx="3.5" stroke={INK} strokeWidth="2" />
    <rect x="27" y="16" width="15" height="16" rx="3.5" stroke={INK} strokeWidth="2" opacity="0.55" />
    <path d="M21 24 h6" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M24 21 l 3 3 l -3 3" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// --- "How it works" step art ------------------------------------------------

const stepFrame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 130" className="w-full h-auto" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="196" height="126" rx="12" fill="#050f14" stroke="rgba(103,232,249,0.16)" />
    {children}
  </svg>
);

export const StepStart: React.FC = () =>
  stepFrame(
    <>
      <rect x="22" y="24" width="70" height="34" rx="6" stroke={INK} strokeWidth="1.6" strokeDasharray="5 4" />
      <path d="M57 34 v14 M50 41 h14" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <rect x="108" y="24" width="70" height="34" rx="6" fill="#fef08a" stroke="#fde047" />
      <rect x="118" y="34" width="40" height="5" rx="2.5" fill="#422006" opacity="0.5" />
      <rect x="118" y="45" width="30" height="5" rx="2.5" fill="#422006" opacity="0.3" />
      <rect x="22" y="72" width="156" height="34" rx="6" fill="rgba(103,232,249,0.07)" stroke="rgba(103,232,249,0.2)" />
      <rect x="34" y="84" width="60" height="6" rx="3" fill={INK} opacity="0.45" />
      <rect x="104" y="84" width="40" height="6" rx="3" fill={INK} opacity="0.25" />
    </>
  );

export const StepArrange: React.FC = () =>
  stepFrame(
    <>
      <rect x="18" y="20" width="52" height="26" rx="5" fill="#bae6fd" stroke="#7dd3fc" />
      <rect x="76" y="58" width="52" height="26" rx="5" fill="#fbcfe8" stroke="#f9a8d4" />
      <rect x="132" y="20" width="52" height="26" rx="5" fill="#a7f3d0" stroke="#6ee7b7" />
      <path d="M70 33 C 90 33, 82 58, 102 58" stroke={INK} strokeWidth="1.8" strokeOpacity="0.7" />
      <path d="M128 71 C 156 71, 150 46, 158 46" stroke={INK} strokeWidth="1.8" strokeOpacity="0.5" />
      <circle cx="102" cy="104" r="10" stroke={INK} strokeWidth="1.8" />
      <path d="M98 104 h8 M102 100 v8" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </>
  );

export const StepRefine: React.FC = () =>
  stepFrame(
    <>
      <rect x="26" y="30" width="64" height="40" rx="6" fill="#fed7aa" stroke="#fdba74" />
      <rect x="110" y="30" width="64" height="40" rx="6" fill="#ddd6fe" stroke="#c4b5fd" />
      <rect x="110" y="30" width="64" height="40" rx="6" stroke={INK} strokeWidth="2" />
      <circle cx="174" cy="50" r="4" fill={INK} />
      <path d="M40 92 H 96" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M48 86 l -8 6 l 8 6" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M112 92 H 168" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M160 86 l 8 6 l -8 6" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
    </>
  );

export const StepShip: React.FC = () =>
  stepFrame(
    <>
      <rect x="24" y="24" width="80" height="60" rx="8" fill="rgba(103,232,249,0.08)" stroke="rgba(103,232,249,0.3)" />
      <rect x="36" y="38" width="24" height="16" rx="3" fill="#fef08a" />
      <rect x="66" y="38" width="24" height="16" rx="3" fill="#bae6fd" />
      <rect x="36" y="60" width="54" height="10" rx="3" fill="#a7f3d0" />
      <path d="M110 54 h44" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M146 47 l 8 7 l -8 7" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="132" y="76" width="46" height="30" rx="6" stroke={INK} strokeWidth="1.8" strokeDasharray="5 4" />
      <text x="155" y="96" textAnchor="middle" fill={INK} fontSize="12" fontWeight="700" fontFamily="sans-serif">
        PNG
      </text>
    </>
  );
