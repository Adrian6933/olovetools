import React, { useId } from 'react';

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// Shared timing, not shared subject matter: each tool demonstrates its own action.
// CSS guards work before hydration; base attributes always show a finished scene.
const motionStyles = `
  .tool-process .tp-enter { animation: tp-enter 8s ease-in-out infinite both; }
  .tool-process .tp-travel { animation: tp-travel 8s ease-in-out infinite both; }
  .tool-process .tp-progress { transform-box: fill-box; transform-origin: left; animation: tp-progress 8s linear infinite both; }
  .tool-process .tp-done { animation: tp-done 8s ease-in-out infinite both; }
  .tool-process .tp-size { transform-box: fill-box; transform-origin: left; animation: tp-size 8s ease-in-out infinite both; }
  .tool-process .tp-remove { animation: tp-remove 8s ease-in-out infinite both; }
  .tool-process .tp-beam { animation: tp-beam 8s ease-in-out infinite both; }
  @keyframes tp-enter { 0%,24% { opacity: 0; transform: translateY(6px); } 40%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
  @keyframes tp-travel { 0%,12% { opacity: 0; transform: translateX(0); } 20% { opacity: 1; transform: translateX(0); } 38% { opacity: 1; transform: translateX(48px); } 44%,100% { opacity: 0; transform: translateX(48px); } }
  @keyframes tp-progress { 0%,40% { transform: scaleX(0); opacity: 1; } 70%,90% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0; } }
  @keyframes tp-done { 0%,70% { opacity: 0; } 78%,90% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes tp-size { 0%,35% { transform: scaleX(1); opacity: 0; } 42% { transform: scaleX(1); opacity: 1; } 70%,90% { transform: scaleX(.25); opacity: 1; } 100% { transform: scaleX(.25); opacity: 0; } }
  @keyframes tp-remove { 0% { clip-path: inset(0 0 0 0) fill-box; opacity: 0; } 8%,18% { clip-path: inset(0 0 0 0) fill-box; opacity: 1; } 70%,90% { clip-path: inset(0 0 0 100%) fill-box; opacity: 1; } 95% { clip-path: inset(0 0 0 100%) fill-box; opacity: 0; } 100% { clip-path: inset(0 0 0 0) fill-box; opacity: 0; } }
  @keyframes tp-beam { 0%,18% { transform: translateX(0); opacity: 0; } 22% { opacity: 1; } 70% { transform: translateX(360px); opacity: 1; } 74%,100% { transform: translateX(360px); opacity: 0; } }
  .tool-process[data-static] .tp-motion { animation: none !important; }
  .tool-process[data-static] .tp-transient { opacity: 0; }
  .tool-process[data-static] .tp-size { transform: scaleX(.25); }
  @media (prefers-reduced-motion: reduce) {
    .tool-process .tp-motion { animation: none !important; }
    .tool-process .tp-transient { opacity: 0; }
    .tool-process .tp-size { transform: scaleX(.25); }
  }
`;

const Frame: React.FC<ArtProps & { accent: string; children: React.ReactNode }> = ({ className = '', animated = true, accent, children }) => (
  <svg viewBox="0 0 440 260" className={`tool-process ${className}`} data-static={animated ? undefined : ''} style={{ color: accent }} fill="none" aria-hidden="true">
    <style>{motionStyles}</style>
    {children}
  </svg>
);

const Photo: React.FC<{ x: number; y: number; width?: number }> = ({ x, y, width = 128 }) => (
  <svg x={x} y={y} width={width} height={width * .625} viewBox="0 0 128 80" fill="none">
    <rect width="128" height="80" rx="8" fill="#192033" />
    <rect width="128" height="80" rx="8" fill="currentColor" fillOpacity=".12" />
    <circle cx="96" cy="22" r="10" fill="#fde6ad" />
    <path d="M0 70 32 27 66 64 89 40 128 72v8H0z" fill="currentColor" fillOpacity=".7" />
    <path d="m0 75 35-19 29 17 30-16 34 18v5H0z" fill="#0c1320" fillOpacity=".5" />
  </svg>
);

const Transfer: React.FC = () => (
  <>
    <path d="M184 121h54m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <g className="tp-motion tp-transient tp-travel" opacity="0">
      <rect x="178" y="111" width="15" height="20" rx="4" fill="currentColor" />
      <path d="M182 117h7m-7 4h5" stroke="#121422" strokeWidth="1.5" />
    </g>
  </>
);

const Check: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g className="tp-motion tp-done" transform={`translate(${x} ${y})`}>
    <circle r="9" fill="#bbf7d0" />
    <path d="m-4 0 3 3 5-6" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const ConversionProcessArt: React.FC<ArtProps & { clipboard?: boolean }> = ({ clipboard = false, ...props }) => (
  <Frame {...props} accent={clipboard ? '#c4a1ff' : '#a5b4fc'}>
    <rect x="16" y="40" width="152" height="180" rx="16" fill="#111421" stroke="currentColor" strokeOpacity=".55" />
    {clipboard ? (
      <>
        <rect x="65" y="30" width="54" height="24" rx="8" fill="#c4a1ff" />
        <path d="M81 42h22" stroke="#352552" strokeWidth="4" strokeLinecap="round" />
        <path d="M46 65h18m-9-9v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ) : <text x="32" y="65" fill="#e2e8f0" fontFamily="ui-monospace, monospace" fontSize="12">photo.heic</text>}
    <Photo x={28} y={83} />
    <path d="M32 183h83m-83 12h57" stroke="currentColor" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
    <Transfer />
    <rect x="252" y="24" width="172" height="216" rx="16" fill="#141525" stroke="currentColor" strokeOpacity=".65" />
    {/* Formats are choices; only the selected format produces a file. */}
    {['PNG', 'JPG', 'WEBP'].map((format, i) => (
      <g key={format}>
        <rect x={264 + i * 50} y="38" width="46" height="22" rx="6" fill={i === (clipboard ? 0 : 2) ? '#7160b5' : '#252539'} stroke="currentColor" strokeOpacity={i === (clipboard ? 0 : 2) ? .9 : .15} />
        <text x={287 + i * 50} y="53" textAnchor="middle" fill="#eee9ff" fontFamily="ui-monospace, monospace" fontSize="9">{format}</text>
      </g>
    ))}
    <g className="tp-motion tp-enter">
      <Photo x={268} y={77} width={140} />
      <text x="270" y="184" fill="#eee9ff" fontFamily="ui-monospace, monospace" fontSize="12">{clipboard ? 'image.png' : 'photo.webp'}</text>
    </g>
    <rect x="268" y="197" width="140" height="4" rx="2" fill="#39354b" />
    <rect className="tp-motion tp-progress" x="268" y="197" width="140" height="4" rx="2" fill="currentColor" />
    <g className="tp-motion tp-done">
      <path d="M279 209v14m-5-5 5 5 5-5m-9 8h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M295 218h78" stroke="currentColor" strokeWidth="3" strokeOpacity=".45" strokeLinecap="round" />
    </g>
    <Check x={399} y={219} />
  </Frame>
);

export const CompressionProcessArt: React.FC<ArtProps> = props => (
  <Frame {...props} accent="#67e8f9">
    {/* Same picture and dimensions on both sides; only the byte bar shrinks. */}
    {[16, 252].map(x => (
      <g key={x}>
        <rect x={x} y="40" width="172" height="174" rx="16" fill="#0b1821" stroke="#397285" />
        <Photo x={x + 16} y={57} width={140} />
      </g>
    ))}
    <path d="M201 121h34m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <text x="32" y="167" fill="#cffafe" fontFamily="ui-monospace, monospace" fontSize="12">4 MB</text>
    <rect x="32" y="182" width="140" height="9" rx="4" fill="#67e8f9" fillOpacity=".7" />
    <rect x="268" y="182" width="140" height="9" rx="4" fill="#1c3e4b" />
    <rect className="tp-motion tp-size" x="268" y="182" width="140" height="9" rx="4" fill="#67e8f9" />
    <text className="tp-motion tp-done" x="268" y="167" fill="#cffafe" fontFamily="ui-monospace, monospace" fontSize="12">1 MB</text>
    <Check x={399} y={164} />
    <g className="tp-motion tp-done">
      <rect x="180" y="225" width="80" height="26" rx="13" fill="#15353c" stroke="#397285" />
      <text x="220" y="243" textAnchor="middle" fill="#a5f3fc" fontFamily="ui-monospace, monospace" fontSize="13">−75%</text>
    </g>
  </Frame>
);

export const BackgroundProcessArt: React.FC<ArtProps> = props => {
  const id = useId().replace(/:/g, '');
  return (
    <Frame {...props} accent="#f0abfc">
      <defs>
        <pattern id={`${id}-checker`} width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#271e33" />
          <path d="M0 0h12v12H0zM12 12h12v12H12z" fill="#40304e" />
        </pattern>
        <clipPath id={`${id}-frame`}><rect x="40" y="16" width="360" height="216" rx="18" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-frame)`}>
        <rect x="40" y="16" width="360" height="216" fill={`url(#${id}-checker)`} />
        <g className="tp-motion tp-remove" style={{ clipPath: 'inset(0 0 0 100%) fill-box' }}>
          <rect x="40" y="16" width="360" height="216" fill="#6b388e" />
          <circle cx="335" cy="64" r="21" fill="#fbdba4" />
          <path d="M40 191 121 101 204 182 296 124 400 191v41H40z" fill="#412452" />
          <path d="M40 213 127 162 221 211 305 166 400 204v28H40z" fill="#291d39" />
        </g>
        {/* The subject is above both background layers and never disappears. */}
        <path d="M155 232v-23c0-33 29-56 65-56s65 23 65 56v23z" fill="#e9b6f4" />
        <path d="M201 147v20q19 18 38 0v-20" fill="#f4cfcb" />
        <ellipse cx="220" cy="109" rx="36" ry="43" fill="#f8ddd3" />
        <path d="M184 111v-10c0-32 16-48 37-48 30 0 41 23 35 51-12-1-24-12-30-23-7 17-25 25-42 30z" fill="#302038" />
        <path d="M202 115h3m27 0h3m-23 18q8 5 16 0" stroke="#8c5d70" strokeWidth="2.5" strokeLinecap="round" />
        <rect className="tp-motion tp-transient tp-beam" x="40" y="16" width="2" height="216" fill="#fae8ff" opacity="0" />
      </g>
      <rect x="40" y="16" width="360" height="216" rx="18" stroke="#b77ac8" strokeWidth="1.5" />
      <g className="tp-motion tp-done">
        <rect x="154" y="217" width="132" height="32" rx="9" fill="#30203e" stroke="#b77ac8" />
        <text x="166" y="238" fill="#fae8ff" fontFamily="ui-monospace, monospace" fontSize="12">cutout.png</text>
      </g>
      <Check x={270} y={233} />
    </Frame>
  );
};
