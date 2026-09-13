import React from 'react';

// ============================================================================
// Hand-drawn SVG art for WhoisBolt. Local markup only: no emoji standing in for
// an illustration, no recycled icon-set glyph. Motion is declared inside the
// sprite so prefers-reduced-motion silences it before React hydrates.
// ============================================================================

const INK = '#818cf8';

export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="-2 20 422 190" className={`tool-hero-art ${className}`} role="img" aria-hidden="true" fill="none">
    <style>{`
      @keyframes wb-travel { 0% { opacity:0; transform: translateX(0) } 15% { opacity:1 } 85% { opacity:1 } 100% { opacity:0; transform: translateX(150px) } }
      @keyframes wb-glow { 0%,100% { opacity:.3 } 50% { opacity:.9 } }
      .wb-packet { animation: wb-travel 3.6s ease-in-out infinite; }
      .wb-packet2 { animation: wb-travel 3.6s ease-in-out infinite 1.2s; }
      .wb-packet3 { animation: wb-travel 3.6s ease-in-out infinite 2.4s; }
      .wb-node { animation: wb-glow 3s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .wb-packet,.wb-packet2,.wb-packet3,.wb-node { animation: none !important; opacity: 1 !important; transform: none !important; }
      }
    `}</style>

    {/* the query box */}
    <rect x="12" y="96" width="120" height="58" rx="12" fill="#0b0d20" stroke="rgba(129,140,248,0.25)" />
    <text x="28" y="120" fill="#64748b" fontSize="8.5" fontWeight="700" fontFamily="ui-monospace, monospace">QUERY</text>
    <text x="28" y="140" fill={INK} fontSize="13" fontFamily="ui-monospace, monospace">example.com</text>

    {/* three wires to three resolvers */}
    {[0, 1, 2].map(i => (
      <path
        key={i}
        d={`M136 125 C 180 125, 190 ${52 + i * 62}, 240 ${52 + i * 62}`}
        stroke={INK}
        strokeOpacity="0.25"
        strokeWidth="1.6"
      />
    ))}
    <g className="wb-packet"><circle cx="180" cy="112" r="3.5" fill={INK} /></g>
    <g className="wb-packet2"><circle cx="180" cy="125" r="3.5" fill={INK} /></g>
    <g className="wb-packet3"><circle cx="180" cy="138" r="3.5" fill={INK} /></g>

    {['A', 'MX', 'CAA'].map((label, i) => (
      <g key={label}>
        <rect x="240" y={34 + i * 62} width="166" height="38" rx="9" fill="#0b0d20" stroke="rgba(129,140,248,0.2)" />
        <rect x="252" y={45 + i * 62} width="28" height="16" rx="4" fill={INK} opacity="0.85" />
        <text x="266" y={57 + i * 62} textAnchor="middle" fill="#0b0d20" fontSize="9" fontWeight="800" fontFamily="sans-serif">
          {label}
        </text>
        <text x="290" y={57 + i * 62} fill="#94a3b8" fontSize="10.5" fontFamily="ui-monospace, monospace">
          {['93.184.216.34', 'mail.example.com', 'letsencrypt.org'][i]}
        </text>
        <circle className="wb-node" cx="396" cy={53 + i * 62} r="3.5" fill="#34d399" />
      </g>
    ))}
  </svg>
);

const base = 'w-full h-full';

export const IconResolvers: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="10" cy="24" r="5" fill={INK} opacity="0.85" />
    {[0, 1, 2].map(i => (
      <g key={i}>
        <path d={`M15 24 C 24 24, 26 ${12 + i * 12}, 33 ${12 + i * 12}`} stroke={INK} strokeWidth="1.6" opacity="0.4" />
        <rect x="34" y={7 + i * 12} width="10" height="10" rx="2.5" stroke={INK} strokeWidth="1.6" />
      </g>
    ))}
  </svg>
);

export const IconTypes: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    {['A', 'MX', 'TXT', 'CAA'].map((label, i) => (
      <g key={label}>
        <rect x={5 + (i % 2) * 20} y={10 + Math.floor(i / 2) * 16} width="18" height="12" rx="3" fill={INK} opacity={i === 3 ? 0.9 : 0.3} />
        <text
          x={14 + (i % 2) * 20}
          y={19 + Math.floor(i / 2) * 16}
          textAnchor="middle"
          fill={i === 3 ? '#0b0d20' : '#c7d2fe'}
          fontSize="6.5"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          {label}
        </text>
      </g>
    ))}
  </svg>
);

export const IconDnssec: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <path d="M24 7 l 14 6 v10 c0 9 -6 15 -14 18 c -8 -3 -14 -9 -14 -18 V13 z" stroke={INK} strokeWidth="2" />
    <rect x="19" y="22" width="10" height="9" rx="2" fill={INK} opacity="0.85" />
    <path d="M21 22 v-3 a3 3 0 0 1 6 0 v3" stroke={INK} strokeWidth="1.8" />
  </svg>
);

export const IconStatus: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="15" stroke={INK} strokeWidth="2" />
    <path d="M24 15 v11" stroke="#f87171" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="24" cy="32" r="1.8" fill="#f87171" />
  </svg>
);

export const IconPropagation: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    {[0, 1, 2].map(i => (
      <rect key={i} x="7" y={9 + i * 12} width="20" height="9" rx="2.5" fill={INK} opacity={i === 1 ? 0.35 : 0.85} />
    ))}
    <path d="M32 13 l4 4 l6 -7" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M33 24 l8 8 M41 24 l-8 8" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M32 41 l4 4 l6 -7" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconPrivacy: React.FC = () => (
  <svg viewBox="0 0 48 48" className={base} fill="none" aria-hidden="true">
    <rect x="8" y="18" width="32" height="20" rx="5" stroke={INK} strokeWidth="2" />
    <path d="M16 18 v-4 a8 8 0 0 1 16 0 v4" stroke={INK} strokeWidth="2" />
    <path d="M24 26 v5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const frame = (children: React.ReactNode) => (
  <svg viewBox="0 0 200 120" className="w-full h-auto" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="196" height="116" rx="12" fill="#0b0d20" stroke="rgba(129,140,248,0.16)" />
    {children}
  </svg>
);

export const StepAsk: React.FC = () =>
  frame(
    <>
      <rect x="20" y="34" width="128" height="26" rx="7" stroke={INK} strokeWidth="1.6" />
      <text x="32" y="51" fill={INK} fontSize="12" fontFamily="ui-monospace, monospace">example.com</text>
      <rect x="154" y="34" width="26" height="26" rx="7" fill={INK} opacity="0.85" />
      <circle cx="165" cy="45" r="5" stroke="#0b0d20" strokeWidth="1.8" />
      <path d="M169 49 l4 4" stroke="#0b0d20" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="20" y="72" width="42" height="16" rx="4" fill="rgba(129,140,248,0.2)" />
      <text x="41" y="83" textAnchor="middle" fill={INK} fontSize="8" fontWeight="700" fontFamily="sans-serif">Google</text>
      <rect x="68" y="72" width="52" height="16" rx="4" stroke="rgba(255,255,255,0.12)" />
      <text x="94" y="83" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="700" fontFamily="sans-serif">Cloudflare</text>
    </>
  );

export const StepRead: React.FC = () =>
  frame(
    <>
      {['A', 'MX', 'TXT'].map((label, i) => (
        <g key={label}>
          <rect x="18" y={24 + i * 26} width="26" height="16" rx="4" fill={INK} opacity="0.8" />
          <text x="31" y={36 + i * 26} textAnchor="middle" fill="#0b0d20" fontSize="8" fontWeight="800" fontFamily="sans-serif">
            {label}
          </text>
          <rect x="50" y={26 + i * 26} width={110 - i * 22} height="12" rx="3" fill="rgba(255,255,255,0.08)" />
          <text x="168" y={36 + i * 26} textAnchor="end" fill="#64748b" fontSize="7.5" fontFamily="ui-monospace, monospace">
            TTL 5m
          </text>
        </g>
      ))}
    </>
  );

export const StepCompare: React.FC = () =>
  frame(
    <>
      {['Google', 'Cloudflare', 'DNS.SB'].map((label, i) => (
        <g key={label}>
          <text x="20" y={34 + i * 26} fill="#64748b" fontSize="8" fontWeight="700" fontFamily="sans-serif">{label}</text>
          <rect x="76" y={24 + i * 26} width={i === 1 ? 60 : 84} height="12" rx="3" fill={i === 1 ? 'rgba(248,113,113,0.4)' : 'rgba(52,211,153,0.4)'} />
        </g>
      ))}
      <text x="100" y="104" textAnchor="middle" fill="#f87171" fontSize="8.5" fontWeight="700" fontFamily="sans-serif">
        not propagated yet
      </text>
    </>
  );

export const StepTrust: React.FC = () =>
  frame(
    <>
      <path d="M100 26 l 22 9 v16 c0 14 -9 23 -22 28 c -13 -5 -22 -14 -22 -28 V35 z" stroke={INK} strokeWidth="2" />
      <path d="M89 54 l 8 8 l 14 -16" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="100" y="100" textAnchor="middle" fill="#64748b" fontSize="8.5" fontWeight="700" fontFamily="sans-serif">
        DNSSEC validated
      </text>
    </>
  );
