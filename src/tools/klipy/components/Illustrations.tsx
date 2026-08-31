import React from 'react';

// ============================================================================
// Hand-drawn SVG art for Klipy. Local markup only: no emoji standing in for an
// illustration, no recycled icon-set glyph. Motion is declared inside the
// sprite so prefers-reduced-motion silences it before React hydrates.
// ============================================================================

const KICK = '#53fc18';

export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 240" className={className} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes kp-live { 0%,100% { opacity:.35 } 50% { opacity:1 } }
      @keyframes kp-star { 0%,100% { transform: scale(1) } 50% { transform: scale(1.18) } }
      .kp-live { animation: kp-live 1.8s ease-in-out infinite; }
      .kp-star { transform-origin: 356px 60px; animation: kp-star 2.6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .kp-live,.kp-star { animation: none !important; opacity: 1 !important; transform: none !important; }
      }
    `}</style>

    {/* a grid of clip cards */}
    {[0, 1, 2].map(col =>
      [0, 1].map(row => {
        const x = 14 + col * 116;
        const y = 30 + row * 96;
        const featured = col === 2 && row === 0;
        return (
          <g key={`${col}-${row}`}>
            <rect x={x} y={y} width="104" height="80" rx="10" fill="#0d130f" stroke={featured ? KICK : 'rgba(255,255,255,0.08)'} strokeWidth={featured ? 1.6 : 1} />
            <rect x={x + 8} y={y + 8} width="88" height="46" rx="6" fill="rgba(83,252,24,0.10)" />
            <path d={`M${x + 44} ${y + 22} l 16 9 l -16 9 z`} fill={KICK} opacity={featured ? 0.95 : 0.5} />
            <rect x={x + 8} y={y + 60} width={66 - col * 8} height="5" rx="2.5" fill="rgba(255,255,255,0.22)" />
            <rect x={x + 8} y={y + 69} width={40 - row * 6} height="4" rx="2" fill="rgba(255,255,255,0.10)" />
          </g>
        );
      })
    )}

    {/* live badge on one card */}
    <g className="kp-live">
      <rect x="252" y="38" width="34" height="14" rx="7" fill="#ef4444" />
      <text x="269" y="48" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800" fontFamily="sans-serif">LIVE</text>
    </g>

    {/* the saved star */}
    <g className="kp-star">
      <path
        d="M356 52 l 3.4 7 l 7.6 1.1 l -5.5 5.4 l 1.3 7.6 l -6.8 -3.6 l -6.8 3.6 l 1.3 -7.6 l -5.5 -5.4 l 7.6 -1.1 z"
        fill="#facc15"
      />
    </g>

    {/* the hand-off strip */}
    <rect x="14" y="204" width="392" height="26" rx="8" fill="rgba(83,252,24,0.08)" stroke="rgba(83,252,24,0.2)" />
    <text x="30" y="221" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Star what you like, then send the list straight to Kickbolt</text>
  </svg>
);

const base = 'w-full h-full';

export const IconBrowse: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    {[0, 1].map(r =>
      [0, 1, 2].map(c => (
        <rect key={`${r}-${c}`} x={5 + c * 13.5} y={12 + r * 13.5} width="11" height="11" rx="2.5" fill={KICK} opacity={r === 0 && c === 1 ? 0.9 : 0.3} />
      ))
    )}
  </svg>
);

export const IconLive: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="6" fill="#ef4444" />
    <path d="M14 14 a14 14 0 0 0 0 20 M34 14 a14 14 0 0 1 0 20" stroke={KICK} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M9 9 a21 21 0 0 0 0 30 M39 9 a21 21 0 0 1 0 30" stroke={KICK} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
  </svg>
);

export const IconStar: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path
      d="M24 9 l 4.6 9.6 l 10.4 1.5 l -7.5 7.4 l 1.8 10.5 l -9.3 -5 l -9.3 5 l 1.8 -10.5 l -7.5 -7.4 l 10.4 -1.5 z"
      fill="#facc15"
      opacity="0.9"
    />
  </svg>
);

export const IconHandoff: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="5" y="16" width="15" height="16" rx="3.5" stroke={KICK} strokeWidth="2" />
    <rect x="28" y="16" width="15" height="16" rx="3.5" stroke={KICK} strokeWidth="2" opacity="0.5" />
    <path d="M20 24 h8" stroke={KICK} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M25 21 l 3 3 l -3 3" stroke={KICK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconRemembered: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M11 12 h20 l6 6 v18 a2 2 0 0 1 -2 2 H13 a2 2 0 0 1 -2 -2 z" stroke={KICK} strokeWidth="2" strokeLinejoin="round" />
    <rect x="17" y="12" width="12" height="8" rx="1.5" fill={KICK} opacity="0.7" />
    <path d="M18 30 l 4 4 l 8 -9" stroke={KICK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconNetwork: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="7" y="18" width="34" height="20" rx="5" stroke={KICK} strokeWidth="2" />
    <path d="M16 18 v-4 a8 8 0 0 1 16 0 v4" stroke={KICK} strokeWidth="2" />
    <path d="M24 26 v5" stroke={KICK} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const frame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 120" className="w-full h-auto" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#0d130f" stroke="rgba(83,252,24,0.16)" />
    {children}
  </svg>
);

export const StepSearch: React.FC = () =>
  frame(
    <>
      <rect x="24" y="32" width="152" height="26" rx="9" stroke={KICK} strokeWidth="1.6" />
      <circle cx="42" cy="45" r="5" stroke={KICK} strokeWidth="1.6" />
      <path d="M46 49 l 4 4" stroke={KICK} strokeWidth="1.6" strokeLinecap="round" />
      <text x="58" y="49" fill="#64748b" fontSize="9.5" fontFamily="sans-serif">Just Chatting</text>
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x={24 + i * 39} y="70" width="33" height="26" rx="5" fill="rgba(83,252,24,0.12)" />
      ))}
    </>
  );

export const StepWatch: React.FC = () =>
  frame(
    <>
      <rect x="30" y="26" width="140" height="64" rx="8" fill="rgba(83,252,24,0.08)" stroke="rgba(83,252,24,0.25)" />
      <path d="M92 46 l 22 12 l -22 12 z" fill={KICK} />
      <rect x="38" y="34" width="26" height="12" rx="6" fill="#ef4444" />
      <text x="51" y="43" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="800" fontFamily="sans-serif">LIVE</text>
    </>
  );

export const StepStar: React.FC = () =>
  frame(
    <>
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x="24" y={26 + i * 24} width="118" height="18" rx="5" fill="rgba(255,255,255,0.04)" />
          <path
            d={`M${158} ${30 + i * 24} l 2.4 4.9 l 5.4 .8 l -3.9 3.8 l .9 5.4 l -4.8 -2.5 l -4.8 2.5 l .9 -5.4 l -3.9 -3.8 l 5.4 -.8 z`}
            fill={i === 1 ? '#facc15' : 'rgba(255,255,255,0.14)'}
          />
        </g>
      ))}
      <text x="100" y="106" textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">kept for next time</text>
    </>
  );

export const StepSend: React.FC = () =>
  frame(
    <>
      <rect x="20" y="34" width="66" height="48" rx="8" stroke={KICK} strokeWidth="1.6" />
      <text x="53" y="62" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="700" fontFamily="sans-serif">Klipy</text>
      <path d="M92 58 h24" stroke={KICK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M110 52 l 6 6 l -6 6" stroke={KICK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="122" y="34" width="60" height="48" rx="8" fill="rgba(83,252,24,0.14)" stroke={KICK} strokeWidth="1.6" />
      <text x="152" y="62" textAnchor="middle" fill={KICK} fontSize="9" fontWeight="800" fontFamily="sans-serif">Kickbolt</text>
    </>
  );
