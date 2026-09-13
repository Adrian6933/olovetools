import React from 'react';

// ============================================================================
// Hand-drawn SVG art for TwitchBolt. Local markup only: no emoji standing in
// for an illustration, and no lucide glyph pressed into a job it was not drawn
// for. Motion is declared inside each sprite so prefers-reduced-motion silences
// it before React hydrates.
// ============================================================================

const TW = '#a970ff';

/** One clock keeps links, previews, progress and completion in order.
 * Unanimated SVG attributes present the finished result for reduced motion.
 */
export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 440 240" className={`tb-hero ${className || ''}`} aria-hidden="true" fill="none">
    <style>{`
      .tb-hero .tb-link { animation: tb-links 8s ease-in-out infinite both; }
      .tb-hero .tb-preview-0 { animation: tb-preview-0 8s ease-in-out infinite both; }
      .tb-hero .tb-preview-1 { animation: tb-preview-1 8s ease-in-out infinite both; }
      .tb-hero .tb-preview-2 { animation: tb-preview-2 8s ease-in-out infinite both; }
      .tb-hero .tb-progress { transform-origin: 256px 180px; animation: tb-progress 8s linear infinite both; }
      .tb-hero .tb-packet { animation: tb-packet 8s ease-in-out infinite both; }
      .tb-hero .tb-complete { animation: tb-complete 8s ease-in-out infinite both; }
      @keyframes tb-links { 0% { opacity: .25; } 12%,90% { opacity: 1; } 100% { opacity: .25; } }
      @keyframes tb-preview-0 { 0%,18% { opacity: 0; transform: translateY(5px); } 28%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
      @keyframes tb-preview-1 { 0%,32% { opacity: 0; transform: translateY(5px); } 42%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
      @keyframes tb-preview-2 { 0%,46% { opacity: 0; transform: translateY(5px); } 56%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
      @keyframes tb-progress { 0%,18% { transform: scaleX(0); opacity: 1; } 70%,90% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0; } }
      @keyframes tb-packet { 0%,12% { opacity: 0; transform: translateX(0); } 18% { opacity: 1; transform: translateX(0); } 52% { opacity: 1; transform: translateX(48px); } 60%,100% { opacity: 0; transform: translateX(48px); } }
      @keyframes tb-complete { 0%,70% { opacity: 0; transform: translateY(4px); } 78%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) {
        .tb-hero .tb-link, .tb-hero .tb-preview-0, .tb-hero .tb-preview-1,
        .tb-hero .tb-preview-2, .tb-hero .tb-progress,
        .tb-hero .tb-packet, .tb-hero .tb-complete { animation: none; }
        .tb-hero .tb-packet { opacity: 0; }
      }
    `}</style>

    {/* Three pasted links correspond to exactly three output videos. */}
    <rect x="12" y="32" width="140" height="158" rx="16" fill="#171020" stroke="#59406f" />
    <path d="M29 49h28m5 0h8" stroke="#aa86ce" strokeWidth="3" strokeLinecap="round" />
    <circle cx="134" cy="49" r="3" fill="#b68aff" />
    {[0, 1, 2].map(i => (
      <g key={i} className="tb-link">
        <rect x="24" y={65 + i * 38} width="116" height="28" rx="7" fill="#261b34" stroke="#49315f" />
        <g transform={`translate(31 ${73 + i * 38})`} stroke="#c9a4ff" strokeWidth="1.5" strokeLinecap="round">
          <path d="m5 3 2-2a3 3 0 0 1 4 4L9 7M6 9l-2 2a3 3 0 0 1-4-4l2-2M4 7l3-3" />
        </g>
        <path d={`M52 ${76 + i * 38}h${66 - i * 9}m-${66 - i * 9} 7h42`} stroke="#b39acb" strokeWidth="3" strokeLinecap="round" />
      </g>
    ))}

    {/* Direction stays horizontal; only the transferred item moves. */}
    <path d="M169 111h52m-7-7 7 7-7 7" stroke="#a970ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <g className="tb-packet" opacity="0">
      <rect x="163" y="101" width="15" height="20" rx="4" fill="#d6baff" />
      <path d="m168 107 5 4-5 4z" fill="#39204f" />
    </g>

    <rect x="240" y="16" width="188" height="212" rx="16" fill="#1c1328" stroke="#8054ac" />
    <path d="M257 33h36m5 0h8" stroke="#c3a1e7" strokeWidth="3" strokeLinecap="round" />
    <text x="412" y="37" textAnchor="end" fill="#d6baff" fontSize="10" fontFamily="ui-monospace, monospace">.mp4</text>
    {[0, 1, 2].map(i => (
      <g key={i} className={`tb-preview-${i}`}>
        <rect x="256" y={48 + i * 40} width="156" height="32" rx="7" fill="#2a1c3a" stroke="#674583" />
        <rect x="261" y={53 + i * 40} width="44" height="22" rx="4" fill={['#65418a', '#514677', '#794774'][i]} />
        <path d={`M266 ${71 + i * 40}l9-10 8 7 8-9 9 12z`} fill="#d5b9f5" fillOpacity=".45" />
        <path d={`M279 ${58 + i * 40}l9 6-9 6z`} fill="#f1e5ff" />
        <path d={`M315 ${59 + i * 40}h58m-58 10h36`} stroke="#c4aadf" strokeWidth="3" strokeLinecap="round" />
        <text x="403" y={71 + i * 40} textAnchor="end" fill="#a88dbf" fontSize="8" fontFamily="ui-monospace, monospace">0{i + 1}</text>
      </g>
    ))}

    {/* Dedicated footer: progress never intersects the last video (ends at 160). */}
    <path d="M256 172h156" stroke="#49315f" />
    <rect x="256" y="180" width="156" height="4" rx="2" fill="#47305e" />
    <rect className="tb-progress" x="256" y="180" width="156" height="4" rx="2" fill="#c29aff" />
    <g className="tb-complete">
      <rect x="256" y="195" width="156" height="22" rx="6" fill="#312042" />
      <path d="M268 199v14m-3-11h6m-6 4h6m-6 4h6" stroke="#c9a4ff" strokeWidth="1.5" />
      <text x="282" y="210" fill="#eadbff" fontSize="11" fontFamily="ui-monospace, monospace">clips.zip</text>
      <circle cx="399" cy="206" r="7" fill="#bbf7d0" />
      <path d="m396 206 2 2 4-4" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
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
