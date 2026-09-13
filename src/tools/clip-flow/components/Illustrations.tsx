import React from 'react';

// ============================================================================
// Hand-drawn SVG art for ClipFlow. Local markup only: no emoji standing in for
// an illustration, no recycled icon-set glyph. Motion is declared inside the
// sprite so prefers-reduced-motion silences it before React hydrates.
// ============================================================================

const INK = '#a78bfa';

export const HeroArt: React.FC<{ className?: string; nota1?: string; nota2?: string }> = ({ className, nota1, nota2 }) => (
  <svg viewBox="0 0 420 250" className={`tool-hero-art ${className}`} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes cf-play { 0% { transform: translateX(0) } 100% { transform: translateX(316px) } }
      @keyframes cf-pulse { 0%,100% { opacity:.4 } 50% { opacity:1 } }
      .cf-head { animation: cf-play 6s linear infinite; }
      .cf-cut { animation: cf-pulse 2.4s ease-in-out infinite; }
      .cf-cut2 { animation: cf-pulse 2.4s ease-in-out infinite .8s; }
      @media (prefers-reduced-motion: reduce) {
        .cf-head,.cf-cut,.cf-cut2 { animation: none !important; opacity: 1 !important; }
      }
    `}</style>

    {/* the long timeline */}
    <rect x="10" y="26" width="400" height="70" rx="10" fill="#150c22" stroke="rgba(167,139,250,0.2)" />
    {Array.from({ length: 44 }).map((_, i) => (
      <rect
        key={i}
        x={20 + i * 8.7}
        y={40 + (i % 5) * 3}
        width="4"
        height={42 - (i % 5) * 6}
        rx="1.6"
        fill={INK}
        opacity={0.18 + ((i * 7) % 5) * 0.09}
      />
    ))}

    {/* two marked cuts on the same timeline */}
    <g className="cf-cut">
      <rect x="64" y="30" width="70" height="62" rx="6" fill="rgba(167,139,250,0.22)" stroke={INK} strokeWidth="1.6" />
    </g>
    <g className="cf-cut2">
      <rect x="248" y="30" width="86" height="62" rx="6" fill="rgba(167,139,250,0.22)" stroke={INK} strokeWidth="1.6" />
    </g>
    <g className="cf-head">
      <rect x="20" y="24" width="2.5" height="74" fill="#f472b6" />
      <circle cx="21" cy="24" r="4" fill="#f472b6" />
    </g>

    {/* the resulting parts, and the joined file */}
    {[0, 1].map(i => (
      <g key={i}>
        <rect x={14 + i * 108} y="118" width="96" height="46" rx="8" fill="#150c22" stroke="rgba(167,139,250,0.2)" />
        <path d={`M${38 + i * 108} 132 l 18 9 l -18 9 z`} fill={INK} opacity="0.8" />
        <text x={62 + i * 108} y="147" fill="#64748b" fontSize="9" fontWeight="700" fontFamily="ui-monospace, monospace">
          part {i + 1}
        </text>
      </g>
    ))}
    <path d="M232 141 h26" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M252 135 l 7 6 l -7 6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="266" y="118" width="140" height="46" rx="8" fill="rgba(167,139,250,0.12)" stroke="rgba(167,139,250,0.35)" />
    <text x="336" y="146" textAnchor="middle" fill={INK} fontSize="12" fontWeight="800" fontFamily="ui-monospace, monospace">
      one MP4
    </text>

    {/* the relay, stated rather than hidden */}
    <rect x="14" y="182" width="392" height="52" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
    <circle cx="46" cy="208" r="9" stroke={INK} strokeWidth="1.8" />
    <path d="M42 208 l3 3 l6 -7" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <text x="66" y="204" fill="#94a3b8" fontSize="9.5" fontFamily="sans-serif">{nota1 || 'Twitch CDN sends no CORS headers,'}</text>
    <text x="66" y="218" fill="#64748b" fontSize="9.5" fontFamily="sans-serif">{nota2 || 'so segments come through a relay. Cutting stays here.'}</text>
  </svg>
);

const base = 'w-full h-full';

export const IconMultiCut: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="5" y="16" width="38" height="16" rx="3.5" stroke={INK} strokeWidth="2" />
    <rect x="11" y="16" width="9" height="16" fill={INK} opacity="0.7" />
    <rect x="28" y="16" width="11" height="16" fill={INK} opacity="0.45" />
    <path d="M5 38 h38" stroke={INK} strokeWidth="1.6" opacity="0.35" strokeLinecap="round" />
  </svg>
);

export const IconNoLimit: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="15" stroke={INK} strokeWidth="2" />
    <path d="M24 15 v10 l7 4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 11 l 26 26" stroke="#f472b6" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const IconJoin: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="5" y="12" width="14" height="11" rx="2.5" fill={INK} opacity="0.75" />
    <rect x="5" y="26" width="14" height="11" rx="2.5" fill={INK} opacity="0.45" />
    <path d="M21 18 h8 a4 4 0 0 1 4 4 v0 a4 4 0 0 0 4 4 h4" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M21 32 h8 a4 4 0 0 0 4 -4" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    <rect x="35" y="20" width="9" height="9" rx="2.5" stroke={INK} strokeWidth="1.8" />
  </svg>
);

export const IconCopy: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="6" y="14" width="36" height="20" rx="4" stroke={INK} strokeWidth="2" />
    <path d="M14 24 h8 M26 24 h8" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M24 18 v12" stroke="#f472b6" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 3" />
  </svg>
);

export const IconRelay: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="4" y="19" width="11" height="11" rx="2.5" stroke={INK} strokeWidth="1.8" />
    <rect x="18.5" y="19" width="11" height="11" rx="2.5" fill={INK} opacity="0.8" />
    <rect x="33" y="19" width="11" height="11" rx="2.5" stroke={INK} strokeWidth="1.8" />
    <path d="M15 24.5 h3.5 M29.5 24.5 h3.5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M24 15 v-4" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const IconLocalCut: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M24 7 l 14 6 v10 c0 9 -6 15 -14 18 c -8 -3 -14 -9 -14 -18 V13 z" stroke={INK} strokeWidth="2" />
    <path d="M18 22 l 5 5 M30 22 l -12 12 M30 34 l -5 -5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="17" cy="35" r="2.4" stroke={INK} strokeWidth="1.6" />
  </svg>
);

const frame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 120" className="w-full h-auto" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#150c22" stroke="rgba(167,139,250,0.16)" />
    {children}
  </svg>
);

export const StepPaste: React.FC = () =>
  frame(
    <>
      <rect x="20" y="36" width="160" height="26" rx="7" stroke={INK} strokeWidth="1.6" />
      <text x="32" y="53" fill={INK} fontSize="10" fontFamily="ui-monospace, monospace">twitch.tv/videos/…</text>
      <rect x="20" y="72" width="70" height="18" rx="5" fill="rgba(167,139,250,0.2)" />
      <text x="55" y="85" textAnchor="middle" fill={INK} fontSize="8.5" fontWeight="700" fontFamily="sans-serif">1080p60</text>
      <rect x="96" y="72" width="60" height="18" rx="5" stroke="rgba(255,255,255,0.12)" />
      <text x="126" y="85" textAnchor="middle" fill="#64748b" fontSize="8.5" fontWeight="700" fontFamily="sans-serif">720p</text>
    </>
  );

export const StepMark: React.FC<{ caption?: string }> = ({ caption }) =>
  frame(
    <>
      <rect x="16" y="34" width="168" height="30" rx="6" fill="rgba(255,255,255,0.04)" />
      {Array.from({ length: 22 }).map((_, i) => (
        <rect key={i} x={22 + i * 7.5} y={40 + (i % 4) * 2} width="3" height={18 - (i % 4) * 3} rx="1.2" fill={INK} opacity="0.35" />
      ))}
      <rect x="40" y="32" width="34" height="34" rx="5" fill="rgba(167,139,250,0.25)" stroke={INK} strokeWidth="1.4" />
      <rect x="116" y="32" width="42" height="34" rx="5" fill="rgba(167,139,250,0.25)" stroke={INK} strokeWidth="1.4" />
      <text x="100" y="88" textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">{caption || 'as many cuts as you want'}</text>
    </>
  );

export const StepRelay: React.FC<{ caption?: string }> = ({ caption }) =>
  frame(
    <>
      <rect x="16" y="42" width="42" height="26" rx="6" stroke={INK} strokeWidth="1.6" />
      <text x="37" y="58" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="700" fontFamily="sans-serif">Twitch</text>
      <path d="M60 55 h20" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M74 50 l 6 5 l -6 5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="82" y="42" width="42" height="26" rx="6" fill="rgba(167,139,250,0.18)" stroke={INK} strokeWidth="1.6" />
      <text x="103" y="58" textAnchor="middle" fill={INK} fontSize="8" fontWeight="700" fontFamily="sans-serif">relay</text>
      <path d="M126 55 h20" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M140 50 l 6 5 l -6 5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="148" y="42" width="36" height="26" rx="6" stroke={INK} strokeWidth="1.6" />
      <text x="166" y="58" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="700" fontFamily="sans-serif">you</text>
      <text x="100" y="90" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">{caption || 'shown, not hidden'}</text>
    </>
  );

export const StepExport: React.FC<{ caption?: string }> = ({ caption }) =>
  frame(
    <>
      <rect x="22" y="30" width="60" height="22" rx="5" fill="rgba(167,139,250,0.2)" />
      <text x="52" y="45" textAnchor="middle" fill={INK} fontSize="9" fontWeight="700" fontFamily="sans-serif">part 1</text>
      <rect x="22" y="58" width="60" height="22" rx="5" fill="rgba(167,139,250,0.2)" />
      <text x="52" y="73" textAnchor="middle" fill={INK} fontSize="9" fontWeight="700" fontFamily="sans-serif">part 2</text>
      <path d="M90 55 h22" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M106 49 l 6 6 l -6 6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="118" y="38" width="62" height="34" rx="7" stroke={INK} strokeWidth="1.8" strokeDasharray="5 4" />
      <text x="149" y="59" textAnchor="middle" fill={INK} fontSize="10" fontWeight="800" fontFamily="monospace">MP4</text>
      <text x="100" y="97" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">{caption || 'stream copy, no re-encode'}</text>
    </>
  );
