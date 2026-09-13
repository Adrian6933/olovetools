import React from 'react';

// ============================================================================
// Hand-drawn SVG art for Clipy. Local markup only: no emoji standing in for an
// illustration, and no lucide glyph pressed into a job it was not drawn for.
// Motion is declared inside each sprite so prefers-reduced-motion silences it
// before React hydrates.
// ============================================================================

const TW = '#9146ff';

// Sin ilustracion de hero a proposito: Clipy abre con la rejilla real de
// categorias de Twitch, con sus miniaturas en vivo. Un dibujo decorativo encima
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
    <path d="M31 34 h6" stroke="#16121f" strokeWidth="1.8" strokeLinecap="round" />
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

/** A shared seven-second cycle: action, result, hold, then a quiet reset.
 * Base SVG attributes show the completed state when reduced motion is enabled.
 */
const frame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 120" className="clipy-step w-full h-auto" fill="none" aria-hidden="true">
    <style>{`
      .clipy-step .cp-result { animation: cp-result 7s ease-in-out infinite; }
      .clipy-step .cp-query { transform-origin: 53px 36px; animation: cp-query 7s ease-in-out infinite; }
      .clipy-step .cp-toggle { animation: cp-toggle 7s ease-in-out infinite; }
      .clipy-step .cp-selected { animation: cp-selected 7s ease-in-out infinite; }
      .clipy-step .cp-progress { transform-origin: 29px 86px; animation: cp-progress 7s linear infinite; }
      .clipy-step .cp-transfer { animation: cp-transfer 7s ease-in-out infinite; }
      .clipy-step .cp-done { animation: cp-done 7s ease-in-out infinite; }
      @keyframes cp-query { 0%,8% { transform: scaleX(0); opacity: 0; } 25%,88% { transform: scaleX(1); opacity: 1; } 100% { opacity: 0; } }
      @keyframes cp-result { 0%,25% { opacity: 0; transform: translateY(5px); } 38%,88% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
      @keyframes cp-toggle { 0%,18% { transform: translateX(-10px); } 30%,90% { transform: translateX(0); } 100% { transform: translateX(-10px); } }
      @keyframes cp-selected { 0%,18%,100% { opacity: .15; } 30%,90% { opacity: 1; } }
      @keyframes cp-progress { 0%,16% { transform: scaleX(0); opacity: 1; } 76%,90% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0; } }
      @keyframes cp-transfer { 0%,22% { opacity: 0; transform: translateX(0); } 30% { opacity: 1; transform: translateX(0); } 60% { opacity: 1; transform: translateX(35px); } 67%,100% { opacity: 0; transform: translateX(35px); } }
      @keyframes cp-done { 0%,62% { opacity: 0; } 72%,90% { opacity: 1; } 100% { opacity: 0; } }
      @media (prefers-reduced-motion: reduce) {
        .clipy-step .cp-result, .clipy-step .cp-query, .clipy-step .cp-toggle,
        .clipy-step .cp-selected, .clipy-step .cp-progress,
        .clipy-step .cp-transfer, .clipy-step .cp-done { animation: none; }
        .clipy-step .cp-transfer { opacity: 0; }
      }
    `}</style>
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#100d18" stroke="#493263" />
    <path d="M16 15h18m4 0h5" stroke="#76539c" strokeWidth="2" strokeLinecap="round" />
    <circle cx="182" cy="15" r="2" fill="#b68aff" />
    {children}
  </svg>
);

export const StepSearch: React.FC = () =>
  frame(
    <>
      <rect x="18" y="25" width="164" height="24" rx="7" fill="#21172f" stroke="#9563cf" />
      <circle cx="32" cy="36" r="4" stroke="#d2b6ff" strokeWidth="1.5" />
      <path d="m35 39 4 4" stroke="#d2b6ff" strokeWidth="1.5" strokeLinecap="round" />
      <g className="cp-query">
        <text x="53" y="40" fill="#eadfff" fontSize="10" fontFamily="sans-serif">Just Chatting</text>
        <path d="M120 31v11" stroke="#b68aff" />
      </g>
      {[0, 1, 2].map(i => (
        <g key={i} className="cp-result" style={{ animationDelay: `${i * .18}s` }}>
          <rect x={18 + i * 56} y="59" width="52" height="43" rx="6" fill="#251b36" stroke="#61467e" />
          <path d={`M${22 + i * 56} 85 l12 -13 9 7 10 -11 13 17z`} fill={['#8053b5', '#6163b0', '#a15090'][i]} />
          <circle cx={54 + i * 56} cy="69" r="4" fill="#ddc6ff" />
          <path d={`M${25 + i * 56} 94h24`} stroke="#c0a9db" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
    </>
  );

export const StepFilter: React.FC = () =>
  frame(
    <>
      {[
        { y: 25, label: '24 h' },
        { y: 53, label: '1 000 +' },
        { y: 81, label: 'EN' },
      ].map((o, i) => (
        <g key={i}>
          <rect x="18" y={o.y} width="164" height="22" rx="6" fill="#20172c" stroke="#513a6c" />
          <rect className="cp-selected" x="18" y={o.y} width="164" height="22" rx="6" fill="#9146ff" fillOpacity=".12" stroke="#b68aff" style={{ animationDelay: `${i * .35}s` }} />
          <text x="32" y={o.y + 15} fill="#eadfff" fontSize="10" fontFamily="sans-serif">{o.label}</text>
          <rect x="146" y={o.y + 6} width="24" height="11" rx="5.5" fill="#7041a8" />
          <circle className="cp-toggle" cx="164" cy={o.y + 11.5} r="4" fill="#f2eaff" style={{ animationDelay: `${i * .35}s` }} />
        </g>
      ))}
    </>
  );

export const StepWatch: React.FC<{ caption?: string }> = ({ caption }) =>
  frame(
    <>
      <rect x="18" y="25" width="164" height="69" rx="7" fill="#241933" stroke="#745096" />
      <path d="m24 76 30-30 25 21 26-30 29 25 20-17 22 31z" fill="#65428d" />
      <circle cx="147" cy="41" r="8" fill="#b68aff" />
      <circle cx="100" cy="57" r="15" fill="#100d18" fillOpacity=".85" stroke="#b68aff" />
      <path d="M96 51v12m8-12v12" stroke="#eadfff" strokeWidth="3" strokeLinecap="round" />
      <path d="M29 86h142" stroke="#443153" strokeWidth="3" strokeLinecap="round" />
      <path className="cp-progress" d="M29 86h142" stroke="#c6a0ff" strokeWidth="3" strokeLinecap="round" />
      <text x="100" y="108" textAnchor="middle" fill="#c1b1d4" fontSize="8.5" fontFamily="sans-serif">{caption || 'without leaving the page'}</text>
    </>
  );

export const StepSend: React.FC = () =>
  frame(
    <>
      <rect x="16" y="30" width="60" height="57" rx="8" fill="#241933" stroke="#8056a9" />
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x="25" y={40 + i * 13} width="14" height="9" rx="2" fill="#a775eb" />
          <path d={`M45 ${44 + i * 13}h20`} stroke="#c1a8de" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <path d="M83 59h32m-6-5 6 5-6 5" stroke="#8965ad" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <g className="cp-transfer" opacity="0">
        <rect x="79" y="49" width="13" height="19" rx="3" fill="#c6a0ff" />
        <path d="m83 55 5 4-5 4z" fill="#241933" />
      </g>
      <rect x="124" y="30" width="60" height="57" rx="8" fill="#241933" stroke="#8056a9" />
      <path d="m155 40-10 17h9l-3 15 13-20h-10l4-12z" fill="#b68aff" />
      <g className="cp-done">
        <circle cx="177" cy="81" r="9" fill="#bbf7d0" stroke="#100d18" strokeWidth="2" />
        <path d="m173 81 3 3 5-6" stroke="#166534" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x="46" y="104" textAnchor="middle" fill="#e5d6f8" fontSize="10" fontWeight="700" fontFamily="sans-serif">Clipy</text>
      <text x="154" y="104" textAnchor="middle" fill="#e5d6f8" fontSize="9" fontWeight="700" fontFamily="sans-serif">TwitchBolt</text>
    </>
  );
