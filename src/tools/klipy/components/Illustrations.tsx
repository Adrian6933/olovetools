import React from 'react';

// ============================================================================
// Hand-drawn SVG art for Klipy. Local markup only: no emoji standing in for an
// illustration, and no lucide glyph pressed into a job it was not drawn for.
// Motion is declared inside each sprite so prefers-reduced-motion silences it
// before React hydrates.
// ============================================================================

// Verde de Kick. Mismos dibujos que Clipy: la herramienta es la misma, cambia
// la plataforma.
const TW = '#53fc18';

// Sin ilustracion de hero a proposito: Clipy abre con la rejilla real de
// categorias de Kick, con sus miniaturas en vivo. Un dibujo decorativo encima
// solo empujaria la herramienta hacia abajo sin decir nada que la rejilla no
// diga ya mejor.

const base = 'w-full h-full';

export const IconSearch: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="21" cy="21" r="12" stroke={TW} strokeWidth="2.4" />
    <path d="M30 30 l 9 9" stroke={TW} strokeWidth="2.8" strokeLinecap="round" />
    <path d="M16 21 h10 M21 16 v10" stroke={TW} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
  </svg>
);

export const IconFilter: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M8 12 h32 l -12 14 v13 l -8 -4 v-9 z" stroke={TW} strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx="34" cy="34" r="6" fill={TW} opacity="0.8" />
    <path d="M31 34 h6" stroke="#0d130f" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconPlayer: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="6" y="11" width="36" height="24" rx="4" stroke={TW} strokeWidth="2" />
    <path d="M20 19 l 10 5 l -10 5 z" fill={TW} />
    <path d="M16 41 h16" stroke={TW} strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const IconCollection: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="7" y="14" width="26" height="20" rx="3.5" stroke={TW} strokeWidth="2" opacity="0.45" />
    <rect x="13" y="19" width="26" height="20" rx="3.5" stroke={TW} strokeWidth="2" opacity="0.7" />
    <path d="M22 26 l 3.4 6.9 l 7.6 1.1 l -5.5 5.3" stroke={TW} strokeWidth="0" />
    <path d="M26 22 l 2.6 5.3 l 5.8 .8 l -4.2 4.1 l 1 5.8 l -5.2 -2.7 l -5.2 2.7 l 1 -5.8 l -4.2 -4.1 l 5.8 -.8 z" fill="#facc15" opacity="0.9" />
  </svg>
);

export const IconBlock: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="15" stroke={TW} strokeWidth="2.4" />
    <path d="M14 14 l 20 20" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

export const IconHandoff: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="5" y="16" width="15" height="16" rx="3.5" stroke={TW} strokeWidth="2" />
    <rect x="28" y="16" width="15" height="16" rx="3.5" stroke={TW} strokeWidth="2" opacity="0.5" />
    <path d="M20 24 h8" stroke={TW} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M25 21 l 3 3 l -3 3" stroke={TW} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const frame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 120" className="w-full h-auto" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#0d130f" stroke="rgba(83,252,24,0.18)" />
    {children}
  </svg>
);

export const StepSearch: React.FC = () =>
  frame(
    <>
      <rect x="24" y="30" width="152" height="26" rx="9" stroke={TW} strokeWidth="1.6" />
      <circle cx="42" cy="43" r="5" stroke={TW} strokeWidth="1.6" />
      <path d="M46 47 l 4 4" stroke={TW} strokeWidth="1.6" strokeLinecap="round" />
      <text x="58" y="47" fill="#7c7490" fontSize="9.5" fontFamily="sans-serif">Just Chatting</text>
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x={24 + i * 39} y="68" width="33" height="26" rx="5" fill="rgba(83,252,24,0.14)" />
      ))}
    </>
  );

export const StepFilter: React.FC = () =>
  frame(
    <>
      {[
        { y: 24, w: 150, on: true, label: 'Last 24 h' },
        { y: 52, w: 150, on: false, label: 'Most viewed' },
        { y: 80, w: 150, on: false, label: 'English only' },
      ].map((o, i) => (
        <g key={i}>
          <rect x="25" y={o.y} width={o.w} height="22" rx="7" fill={o.on ? 'rgba(83,252,24,0.18)' : 'rgba(255,255,255,0.03)'} stroke={o.on ? TW : 'rgba(255,255,255,0.08)'} strokeWidth={o.on ? 1.5 : 1} />
          <rect x="36" y={o.y + 7} width="14" height="8" rx="4" fill={o.on ? TW : '#3f3a4d'} />
          <circle cx={o.on ? 46 : 40} cy={o.y + 11} r="3" fill="#fff" />
          <text x="58" y={o.y + 14} fill={o.on ? '#e2e8f0' : '#7c7490'} fontSize="8.5" fontFamily="sans-serif">{o.label}</text>
        </g>
      ))}
    </>
  );

export const StepWatch: React.FC = () =>
  frame(
    <>
      <rect x="30" y="24" width="140" height="66" rx="8" fill="rgba(83,252,24,0.09)" stroke="rgba(83,252,24,0.28)" />
      <path d="M92 45 l 22 12 l -22 12 z" fill={TW} />
      <rect x="38" y="32" width="26" height="12" rx="6" fill="#ef4444" />
      <text x="51" y="41" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="800" fontFamily="sans-serif">LIVE</text>
      <text x="100" y="107" textAnchor="middle" fill="#7c7490" fontSize="8.5" fontFamily="sans-serif">without leaving the page</text>
    </>
  );

export const StepSend: React.FC = () =>
  frame(
    <>
      <rect x="20" y="34" width="66" height="48" rx="8" stroke={TW} strokeWidth="1.6" />
      <text x="53" y="62" textAnchor="middle" fill="#7c7490" fontSize="9" fontWeight="700" fontFamily="sans-serif">Klipy</text>
      <path d="M92 58 h24" stroke={TW} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M110 52 l 6 6 l -6 6" stroke={TW} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="122" y="34" width="60" height="48" rx="8" fill="rgba(83,252,24,0.16)" stroke={TW} strokeWidth="1.6" />
      <text x="152" y="62" textAnchor="middle" fill={TW} fontSize="8.5" fontWeight="800" fontFamily="sans-serif">KickBolt</text>
    </>
  );
