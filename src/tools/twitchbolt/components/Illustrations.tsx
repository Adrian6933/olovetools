import React from 'react';

// ============================================================================
// Hand-drawn SVG art for TwitchBolt. Local markup only: no emoji standing in
// for an illustration, and no lucide glyph pressed into a job it was not drawn
// for. Motion is declared inside each sprite so prefers-reduced-motion silences
// it before React hydrates.
// ============================================================================

const TW = '#a970ff';

export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 440 200" className={className} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes tb-fill { 0% { width: 0 } 100% { width: 84px } }
      @keyframes tb-nudge { 0%,100% { transform: translateY(0) } 50% { transform: translateY(6px) } }
      .tb-fill { animation: tb-fill 2.4s ease-in-out infinite alternate; }
      .tb-nudge { animation: tb-nudge 1.9s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .tb-fill { animation: none !important; width: 84px !important; }
        .tb-nudge { animation: none !important; transform: none !important; }
      }
    `}</style>

    {/* the pasted list */}
    <rect x="12" y="30" width="140" height="140" rx="14" fill="#140f1c" stroke="rgba(255,255,255,0.08)" />
    {[0, 1, 2, 3, 4].map(i => (
      <g key={i}>
        <circle cx="30" cy={54 + i * 24} r="3" fill={TW} opacity={0.55} />
        <rect x="40" y={50 + i * 24} width={96 - (i % 3) * 16} height="7" rx="3.5" fill="rgba(255,255,255,0.16)" />
      </g>
    ))}

    {/* the arrow through the middle */}
    <g className="tb-nudge">
      <path d="M170 100 h56" stroke={TW} strokeWidth="3" strokeLinecap="round" />
      <path d="M218 92 l 10 8 l -10 8" stroke={TW} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* the finished pack */}
    <rect x="248" y="30" width="180" height="140" rx="14" fill="rgba(169,112,255,0.07)" stroke="rgba(169,112,255,0.25)" />
    {[0, 1, 2].map(i => (
      <g key={i}>
        <rect x={264} y={48 + i * 40} width="60" height="32" rx="6" fill="#140f1c" stroke="rgba(255,255,255,0.1)" />
        <path d={`M${286} ${58 + i * 40} l 12 6 l -12 6 z`} fill={TW} opacity="0.75" />
        <rect x="334" y={56 + i * 40} width="78" height="6" rx="3" fill="rgba(255,255,255,0.14)" />
        <rect x="334" y={68 + i * 40} width="48" height="5" rx="2.5" fill="rgba(255,255,255,0.07)" />
      </g>
    ))}

    <rect x="264" y="150" width="84" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
    <rect className="tb-fill" x="264" y="150" width="84" height="6" rx="3" fill={TW} />
    <text x="360" y="156" fill="#7c8296" fontSize="9" fontFamily="sans-serif">one .zip</text>
  </svg>
);

const base = 'w-full h-full';

export const IconPaste: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="11" y="10" width="26" height="30" rx="4" stroke={TW} strokeWidth="2" />
    <rect x="18" y="6" width="12" height="8" rx="2" fill={TW} opacity="0.75" />
    {[0, 1, 2].map(i => (
      <rect key={i} x="17" y={22 + i * 6} width={14 - i * 3} height="3" rx="1.5" fill={TW} opacity="0.4" />
    ))}
  </svg>
);

export const IconBulk: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="6" y="14" width="22" height="16" rx="3" stroke={TW} strokeWidth="2" opacity="0.4" />
    <rect x="12" y="19" width="22" height="16" rx="3" stroke={TW} strokeWidth="2" opacity="0.7" />
    <rect x="18" y="24" width="22" height="16" rx="3" stroke={TW} strokeWidth="2" />
  </svg>
);

export const IconNoLogin: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="18" r="7" stroke={TW} strokeWidth="2" opacity="0.5" />
    <path d="M11 40 a13 13 0 0 1 26 0" stroke={TW} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <path d="M10 10 l 28 28" stroke="#ef4444" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const IconQuality: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M24 7 l 5 10 l 11 1.6 l -8 7.8 l 1.9 11 l -9.9 -5.2 l -9.9 5.2 l 1.9 -11 l -8 -7.8 l 11 -1.6 z" stroke={TW} strokeWidth="2" strokeLinejoin="round" />
    <path d="M24 15 l 2.6 5.2 l 5.7 .8 l -4.1 4 l 1 5.7 l -5.2 -2.7 l -5.2 2.7 l 1 -5.7 l -4.1 -4 l 5.7 -.8 z" fill={TW} opacity="0.45" />
  </svg>
);

export const IconZip: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M10 13 h12 l4 5 h12 a2 2 0 0 1 2 2 v16 a2 2 0 0 1 -2 2 H10 a2 2 0 0 1 -2 -2 V15 a2 2 0 0 1 2 -2 z" stroke={TW} strokeWidth="2" strokeLinejoin="round" />
    {[0, 1, 2, 3].map(i => (
      <rect key={i} x={i % 2 ? 24 : 21} y={20 + i * 5} width="3" height="4" rx="1" fill={TW} opacity="0.8" />
    ))}
  </svg>
);

export const IconRoute: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="9" cy="24" r="4" fill={TW} />
    <circle cx="24" cy="24" r="4" stroke={TW} strokeWidth="2" />
    <circle cx="39" cy="24" r="4" fill={TW} opacity="0.5" />
    <path d="M13 24 h7 M28 24 h7" stroke={TW} strokeWidth="2" strokeLinecap="round" />
    <path d="M24 15 v-5" stroke={TW} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const frame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 120" className="w-full h-auto" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#140f1c" stroke="rgba(169,112,255,0.18)" />
    {children}
  </svg>
);

export const StepPaste: React.FC = () =>
  frame(
    <>
      <rect x="22" y="22" width="156" height="76" rx="9" stroke={TW} strokeWidth="1.5" opacity="0.7" />
      {[0, 1, 2].map(i => (
        <g key={i}>
          <text x="34" y={45 + i * 20} fill="#7c8296" fontSize="8" fontFamily="monospace">clips.twitch.tv/</text>
          <rect x="112" y={38 + i * 20} width={46 - i * 8} height="7" rx="3.5" fill="rgba(169,112,255,0.32)" />
        </g>
      ))}
    </>
  );

export const StepPick: React.FC = () =>
  frame(
    <>
      {[
        { y: 24, label: 'Source', on: true },
        { y: 52, label: '720p', on: false },
        { y: 80, label: '360p', on: false },
      ].map((o, i) => (
        <g key={i}>
          <rect x="30" y={o.y} width="140" height="22" rx="7" fill={o.on ? 'rgba(169,112,255,0.16)' : 'rgba(255,255,255,0.03)'} stroke={o.on ? TW : 'rgba(255,255,255,0.08)'} strokeWidth={o.on ? 1.5 : 1} />
          <circle cx="44" cy={o.y + 11} r="4.5" stroke={o.on ? TW : '#475569'} strokeWidth="1.6" />
          {o.on && <circle cx="44" cy={o.y + 11} r="2.2" fill={TW} />}
          <text x="58" y={o.y + 14} fill={o.on ? '#e2e8f0' : '#7c8296'} fontSize="9" fontFamily="sans-serif">{o.label}</text>
        </g>
      ))}
    </>
  );

export const StepFetch: React.FC = () =>
  frame(
    <>
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x="24" y={26 + i * 24} width="152" height="16" rx="5" fill="rgba(255,255,255,0.04)" />
          <rect x="24" y={26 + i * 24} width={[152, 104, 46][i]} height="16" rx="5" fill="rgba(169,112,255,0.32)" />
          <text x="168" y={38 + i * 24} textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">{['100%', '68%', '30%'][i]}</text>
        </g>
      ))}
      <text x="100" y="108" textAnchor="middle" fill="#7c8296" fontSize="8.5" fontFamily="sans-serif">three at a time</text>
    </>
  );

export const StepSave: React.FC = () =>
  frame(
    <>
      <path d="M62 30 h30 l8 9 h38 a4 4 0 0 1 4 4 v34 a4 4 0 0 1 -4 4 H62 a4 4 0 0 1 -4 -4 V34 a4 4 0 0 1 4 -4 z" fill="rgba(169,112,255,0.1)" stroke={TW} strokeWidth="1.6" strokeLinejoin="round" />
      <text x="100" y="66" textAnchor="middle" fill={TW} fontSize="11" fontWeight="800" fontFamily="sans-serif">.zip</text>
      <path d="M100 84 v10" stroke={TW} strokeWidth="2" strokeLinecap="round" />
      <path d="M95 90 l 5 5 l 5 -5" stroke={TW} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
