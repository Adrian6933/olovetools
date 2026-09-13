import React from 'react';

// ============================================================================
// Hand-drawn SVG art for KickBolt. Local markup only: no emoji standing in for
// an illustration, and no lucide glyph doing a job it was not drawn for (the
// page used the same Sparkles icon three times for three different ideas).
// Motion is declared inside each sprite so prefers-reduced-motion silences it
// before React hydrates.
// ============================================================================

const KICK = '#53fc18';

/** One clock keeps links, previews, progress and completion in order.
 * Unanimated SVG attributes present the finished result for reduced motion.
 */
export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 440 240" className={`kb-hero ${className || ''}`} aria-hidden="true" fill="none">
    <style>{`
      .kb-hero .kb-link { animation: kb-links 8s ease-in-out infinite both; }
      .kb-hero .kb-preview-0 { animation: kb-preview-0 8s ease-in-out infinite both; }
      .kb-hero .kb-preview-1 { animation: kb-preview-1 8s ease-in-out infinite both; }
      .kb-hero .kb-preview-2 { animation: kb-preview-2 8s ease-in-out infinite both; }
      .kb-hero .kb-progress { transform-origin: 256px 180px; animation: kb-progress 8s linear infinite both; }
      .kb-hero .kb-packet { animation: kb-packet 8s ease-in-out infinite both; }
      .kb-hero .kb-complete { animation: kb-complete 8s ease-in-out infinite both; }
      @keyframes kb-links { 0% { opacity: .25; } 12%,90% { opacity: 1; } 100% { opacity: .25; } }
      @keyframes kb-preview-0 { 0%,18% { opacity: 0; transform: translateY(5px); } 28%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
      @keyframes kb-preview-1 { 0%,32% { opacity: 0; transform: translateY(5px); } 42%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
      @keyframes kb-preview-2 { 0%,46% { opacity: 0; transform: translateY(5px); } 56%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
      @keyframes kb-progress { 0%,18% { transform: scaleX(0); opacity: 1; } 70%,90% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0; } }
      @keyframes kb-packet { 0%,12% { opacity: 0; transform: translateX(0); } 18% { opacity: 1; transform: translateX(0); } 52% { opacity: 1; transform: translateX(48px); } 60%,100% { opacity: 0; transform: translateX(48px); } }
      @keyframes kb-complete { 0%,70% { opacity: 0; transform: translateY(4px); } 78%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) {
        .kb-hero .kb-link, .kb-hero .kb-preview-0, .kb-hero .kb-preview-1,
        .kb-hero .kb-preview-2, .kb-hero .kb-progress,
        .kb-hero .kb-packet, .kb-hero .kb-complete { animation: none; }
        .kb-hero .kb-packet { opacity: 0; }
      }
    `}</style>

    {/* Three pasted links correspond to exactly three output videos. */}
    <rect x="12" y="32" width="140" height="158" rx="16" fill="#101c13" stroke="#3d6443" />
    <path d="M29 49h28m5 0h8" stroke="#94c995" strokeWidth="3" strokeLinecap="round" />
    <circle cx="134" cy="49" r="3" fill="#8cf46c" />
    {[0, 1, 2].map(i => (
      <g key={i} className="kb-link">
        <rect x="24" y={65 + i * 38} width="116" height="28" rx="7" fill="#1b3020" stroke="#385b3b" />
        <g transform={`translate(31 ${73 + i * 38})`} stroke="#a2f58c" strokeWidth="1.5" strokeLinecap="round">
          <path d="m5 3 2-2a3 3 0 0 1 4 4L9 7M6 9l-2 2a3 3 0 0 1-4-4l2-2M4 7l3-3" />
        </g>
        <path d={`M52 ${76 + i * 38}h${66 - i * 9}m-${66 - i * 9} 7h42`} stroke="#a8c9a8" strokeWidth="3" strokeLinecap="round" />
      </g>
    ))}

    {/* Direction stays horizontal; only the transferred item moves. */}
    <path d="M169 111h52m-7-7 7 7-7 7" stroke="#53fc18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <g className="kb-packet" opacity="0">
      <rect x="163" y="101" width="15" height="20" rx="4" fill="#c5fcb5" />
      <path d="m168 107 5 4-5 4z" fill="#254823" />
    </g>

    <rect x="240" y="16" width="188" height="212" rx="16" fill="#112015" stroke="#54844c" />
    <path d="M257 33h36m5 0h8" stroke="#b1e5a5" strokeWidth="3" strokeLinecap="round" />
    <text x="412" y="37" textAnchor="end" fill="#c5fcb5" fontSize="10" fontFamily="ui-monospace, monospace">.mp4</text>
    {[0, 1, 2].map(i => (
      <g key={i} className={`kb-preview-${i}`}>
        <rect x="256" y={48 + i * 40} width="156" height="32" rx="7" fill="#203826" stroke="#496f43" />
        <rect x="261" y={53 + i * 40} width="44" height="22" rx="4" fill={['#486a31', '#316456', '#696431'][i]} />
        <path d={`M266 ${71 + i * 40}l9-10 8 7 8-9 9 12z`} fill="#d7efbf" fillOpacity=".45" />
        <path d={`M279 ${58 + i * 40}l9 6-9 6z`} fill="#edffe2" />
        <path d={`M315 ${59 + i * 40}h58m-58 10h36`} stroke="#b4d8a7" strokeWidth="3" strokeLinecap="round" />
        <text x="403" y={71 + i * 40} textAnchor="end" fill="#9cb494" fontSize="8" fontFamily="ui-monospace, monospace">0{i + 1}</text>
      </g>
    ))}

    {/* Dedicated footer: progress never intersects the last video (ends at 160). */}
    <path d="M256 172h156" stroke="#385b3b" />
    <rect x="256" y="180" width="156" height="4" rx="2" fill="#355436" />
    <rect className="kb-progress" x="256" y="180" width="156" height="4" rx="2" fill="#91f16c" />
    <g className="kb-complete">
      <rect x="256" y="195" width="156" height="22" rx="6" fill="#29432a" />
      <path d="M268 199v14m-3-11h6m-6 4h6m-6 4h6" stroke="#a2f58c" strokeWidth="1.5" />
      <text x="282" y="210" fill="#e5ffda" fontSize="11" fontFamily="ui-monospace, monospace">clips.zip</text>
      <circle cx="399" cy="206" r="7" fill="#bbf7d0" />
      <path d="m396 206 2 2 4-4" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
const base = 'w-full h-full';

export const IconPaste: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="11" y="10" width="26" height="30" rx="4" stroke={KICK} strokeWidth="2" />
    <rect x="18" y="6" width="12" height="8" rx="2" fill={KICK} opacity="0.75" />
    {[0, 1, 2].map(i => (
      <rect key={i} x="17" y={22 + i * 6} width={14 - i * 3} height="3" rx="1.5" fill={KICK} opacity="0.4" />
    ))}
  </svg>
);

export const IconBulk: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="6" y="14" width="22" height="16" rx="3" stroke={KICK} strokeWidth="2" opacity="0.4" />
    <rect x="12" y="19" width="22" height="16" rx="3" stroke={KICK} strokeWidth="2" opacity="0.7" />
    <rect x="18" y="24" width="22" height="16" rx="3" stroke={KICK} strokeWidth="2" />
  </svg>
);

export const IconQuality: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M24 7 l 5 10 l 11 1.6 l -8 7.8 l 1.9 11 l -9.9 -5.2 l -9.9 5.2 l 1.9 -11 l -8 -7.8 l 11 -1.6 z" stroke={KICK} strokeWidth="2" strokeLinejoin="round" />
    <path d="M24 15 l 2.6 5.2 l 5.7 .8 l -4.1 4 l 1 5.7 l -5.2 -2.7 l -5.2 2.7 l 1 -5.7 l -4.1 -4 l 5.7 -.8 z" fill={KICK} opacity="0.45" />
  </svg>
);

export const IconZip: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M10 13 h12 l4 5 h12 a2 2 0 0 1 2 2 v16 a2 2 0 0 1 -2 2 H10 a2 2 0 0 1 -2 -2 V15 a2 2 0 0 1 2 -2 z" stroke={KICK} strokeWidth="2" strokeLinejoin="round" />
    {[0, 1, 2, 3].map(i => (
      <rect key={i} x={i % 2 ? 24 : 21} y={20 + i * 5} width="3" height="4" rx="1" fill={KICK} opacity="0.8" />
    ))}
  </svg>
);

export const IconNoLogin: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="18" r="7" stroke={KICK} strokeWidth="2" opacity="0.5" />
    <path d="M11 40 a13 13 0 0 1 26 0" stroke={KICK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <path d="M10 10 l 28 28" stroke="#ef4444" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const IconRoute: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="9" cy="24" r="4" fill={KICK} />
    <circle cx="24" cy="24" r="4" stroke={KICK} strokeWidth="2" />
    <circle cx="39" cy="24" r="4" fill={KICK} opacity="0.5" />
    <path d="M13 24 h7 M28 24 h7" stroke={KICK} strokeWidth="2" strokeLinecap="round" />
    <path d="M24 15 v-5" stroke={KICK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const frame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 120" className="w-full h-auto" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#0d130f" stroke="rgba(83,252,24,0.16)" />
    {children}
  </svg>
);

export const StepPaste: React.FC = () =>
  frame(
    <>
      <rect x="22" y="22" width="156" height="76" rx="9" stroke={KICK} strokeWidth="1.5" opacity="0.7" />
      {[0, 1, 2].map(i => (
        <g key={i}>
          <text x="34" y={45 + i * 20} fill="#64748b" fontSize="8" fontFamily="monospace">kick.com/…/clips/</text>
          <rect x="118" y={38 + i * 20} width={40 - i * 8} height="7" rx="3.5" fill="rgba(83,252,24,0.3)" />
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
          <rect x="30" y={o.y} width="140" height="22" rx="7" fill={o.on ? 'rgba(83,252,24,0.14)' : 'rgba(255,255,255,0.03)'} stroke={o.on ? KICK : 'rgba(255,255,255,0.08)'} strokeWidth={o.on ? 1.5 : 1} />
          <circle cx="44" cy={o.y + 11} r="4.5" stroke={o.on ? KICK : '#475569'} strokeWidth="1.6" />
          {o.on && <circle cx="44" cy={o.y + 11} r="2.2" fill={KICK} />}
          <text x="58" y={o.y + 14} fill={o.on ? '#e2e8f0' : '#64748b'} fontSize="9" fontFamily="sans-serif">{o.label}</text>
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
          <rect x="24" y={26 + i * 24} width={[152, 104, 46][i]} height="16" rx="5" fill="rgba(83,252,24,0.28)" />
          <text x="168" y={38 + i * 24} textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">{['100%', '68%', '30%'][i]}</text>
        </g>
      ))}
      <text x="100" y="108" textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">three at a time</text>
    </>
  );

export const StepSave: React.FC = () =>
  frame(
    <>
      <path d="M62 30 h30 l8 9 h38 a4 4 0 0 1 4 4 v34 a4 4 0 0 1 -4 4 H62 a4 4 0 0 1 -4 -4 V34 a4 4 0 0 1 4 -4 z" fill="rgba(83,252,24,0.1)" stroke={KICK} strokeWidth="1.6" strokeLinejoin="round" />
      <text x="100" y="66" textAnchor="middle" fill={KICK} fontSize="11" fontWeight="800" fontFamily="sans-serif">.zip</text>
      <path d="M100 84 v10" stroke={KICK} strokeWidth="2" strokeLinecap="round" />
      <path d="M95 90 l 5 5 l 5 -5" stroke={KICK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
