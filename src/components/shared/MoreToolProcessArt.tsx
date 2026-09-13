import React, { useId } from 'react';

interface ArtProps { className?: string; animated?: boolean }

const styles = `
  .process-demo .pd-result { animation: pd-result 8s ease-in-out infinite both; }
  .process-demo .pd-finish { animation: pd-finish 8s ease-in-out infinite both; }
  .process-demo .pd-progress { transform-box: fill-box; transform-origin: left; animation: pd-progress 8s linear infinite both; }
  .process-demo .pd-page { animation: pd-page 8s ease-in-out infinite both; }
  .process-demo .pd-code { animation: pd-code 8s ease-in-out infinite both; }
  .process-demo .pd-wave { transform-box: fill-box; transform-origin: center; animation: pd-wave 1.6s ease-in-out infinite alternate; }
  .process-demo .pd-rec { animation: pd-rec 8s ease-in-out infinite both; }
  @keyframes pd-result { 0%,28% { opacity: 0; transform: translateY(6px); } 44%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(0); } }
  @keyframes pd-finish { 0%,70% { opacity: 0; } 78%,90% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes pd-progress { 0%,18% { transform: scaleX(0); opacity: 1; } 70%,90% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0; } }
  @keyframes pd-page { 0%,12% { opacity: 0; transform: translateX(0); } 20% { opacity: 1; transform: translateX(0); } 40% { opacity: 1; transform: translateX(55px); } 48%,100% { opacity: 0; transform: translateX(55px); } }
  @keyframes pd-code { 0%,18% { clip-path: inset(0 100% 0 0) fill-box; opacity: 1; } 65%,90% { clip-path: inset(0 0 0 0) fill-box; opacity: 1; } 100% { clip-path: inset(0 0 0 0) fill-box; opacity: 0; } }
  @keyframes pd-wave { from { transform: scaleY(.35); } to { transform: scaleY(1); } }
  @keyframes pd-rec { 0%,8%,70%,100% { opacity: 0; } 16%,64% { opacity: 1; } }
  .process-demo[data-static] .pd-motion { animation: none !important; }
  .process-demo[data-static] .pd-transient { opacity: 0; }
  @media (prefers-reduced-motion: reduce) {
    .process-demo .pd-motion { animation: none !important; }
    .process-demo .pd-transient { opacity: 0; }
  }
`;

const Frame: React.FC<ArtProps & { color: string; children: React.ReactNode }> = ({ className = '', animated = true, color, children }) => (
  <svg viewBox="0 0 440 280" className={`process-demo ${className}`} data-static={animated ? undefined : ''} style={{ color }} fill="none" aria-hidden="true">
    <style>{styles}</style>{children}
  </svg>
);

const Done: React.FC<{ label: string; x?: number; y?: number }> = ({ label, x = 270, y = 236 }) => (
  <g className="pd-motion pd-finish">
    <rect x={x} y={y} width="148" height="28" rx="8" fill="#18212c" stroke="currentColor" strokeOpacity=".5" />
    <text x={x + 12} y={y + 18} fill="#e8edf5" fontSize="11" fontFamily="ui-monospace, monospace">{label}</text>
    <circle cx={x + 133} cy={y + 14} r="7" fill="#bbf7d0" />
    <path d={`m${x + 130} ${y + 14} 2 2 4-4`} stroke="#166534" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const PdfProcessArt: React.FC<ArtProps> = props => (
  <Frame {...props} color="#fca5a5">
    {[0, 1, 2].map(i => (
      <g key={i}>
        <rect x={24 + i * 22} y={40 + i * 22} width="110" height="142" rx="9" fill={['#35232d', '#543540', '#efdddd'][i]} stroke="#ce8e98" />
        <text x={38 + i * 22} y={64 + i * 22} fill={i === 2 ? '#78454d' : '#eacbd0'} fontSize="11" fontFamily="ui-monospace, monospace">0{i + 1}</text>
        {[0, 1, 2, 3].map(r => <path key={r} d={`M${38 + i * 22} ${82 + i * 22 + r * 15}h${r % 2 ? 54 : 76}`} stroke={i === 2 ? '#ad7a82' : '#bd8e97'} strokeWidth="4" strokeLinecap="round" />)}
      </g>
    ))}
    <path d="M191 135h55m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <g className="pd-motion pd-transient pd-page" opacity="0">
      <rect x="186" y="122" width="19" height="26" rx="4" fill="#ffe4e6" />
      <path d="M191 130h9m-9 6h7" stroke="#be5663" strokeWidth="2" />
    </g>
    <g className="pd-motion pd-result">
      <rect x="284" y="36" width="126" height="184" rx="10" fill="#b5717b" />
      <rect x="277" y="30" width="126" height="184" rx="10" fill="#fff1f2" stroke="#fda4af" />
      <path d="M288 31v181" stroke="#dc5667" strokeWidth="7" />
      {[0, 1, 2].map(i => (
        <g key={i}>
          <text x="300" y={65 + i * 39} fill="#9f4253" fontSize="10" fontFamily="ui-monospace, monospace">0{i + 1}</text>
          <path d={`M322 ${61 + i * 39}h63m-63 10h45`} stroke="#b98e96" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      <rect x="300" y="173" width="85" height="24" rx="6" fill="#be344c" />
      <text x="342" y="190" textAnchor="middle" fill="#fff1f2" fontSize="13" fontFamily="ui-monospace, monospace">PDF</text>
    </g>
    <Done label="merged.pdf" />
  </Frame>
);

export const RecordingProcessArt: React.FC<ArtProps> = props => (
  <Frame {...props} color="#fcd34d">
    <rect x="22" y="18" width="396" height="204" rx="18" fill="#2b2215" stroke="#a78042" />
    <rect x="32" y="28" width="376" height="184" rx="12" fill="#15120d" />
    <rect x="48" y="61" width="212" height="114" rx="8" fill="#30291b" stroke="#705c35" />
    <path d="M61 75h58m-58 20h174m-174 14h137" stroke="#bcab85" strokeWidth="5" strokeLinecap="round" />
    <rect x="61" y="131" width="81" height="28" rx="5" fill="#b98a36" />
    <path d="M156 138h73m-73 14h51" stroke="#807052" strokeWidth="4" strokeLinecap="round" />
    <g className="pd-motion pd-rec pd-transient" opacity="0">
      <circle cx="55" cy="44" r="4" fill="#fb7185" />
      <text x="66" y="48" fill="#fecdd3" fontSize="11" fontFamily="ui-monospace, monospace">REC</text>
    </g>
    {/* Centered waveform bars, contained inside their panel at every height. */}
    <rect x="278" y="61" width="111" height="48" rx="8" fill="#30291b" />
    {[12, 23, 34, 20, 30, 16, 26, 12].map((h, i) => (
      <rect key={i} className="pd-motion pd-wave" x={288 + i * 12} y={85 - h / 2} width="5" height={h} rx="2.5" fill="#fcd34d" style={{ animationDelay: `${-i * .19}s` }} />
    ))}
    <circle cx="334" cy="149" r="32" fill="#563c20" stroke="#e5bc6e" strokeWidth="2" />
    <circle cx="334" cy="138" r="10" fill="#fde2a4" />
    <path d="M315 171c0-21 38-21 38 0" fill="#fde2a4" />
    <rect x="48" y="193" width="341" height="4" rx="2" fill="#4d412c" />
    <rect className="pd-motion pd-progress" x="48" y="193" width="341" height="4" rx="2" fill="#fcd34d" />
    <path d="M190 222h60l6 24h-72z" fill="#6b5330" />
    <path d="M163 249h89" stroke="#8f713b" strokeWidth="7" strokeLinecap="round" />
    <Done label="recording.webm" x={266} y={236} />
  </Frame>
);

// Decorative modules, not a scannable link or a real download.
const qrRows = [0b0110100101, 0b1011010110, 0b0101101010, 0b1101001101, 0b0010110011, 0b1010011010, 0b0111010101, 0b1001101001, 0b0100110110, 0b1110010011];
export const QrProcessArt: React.FC<ArtProps> = props => (
  <Frame {...props} color="#6ee7b7">
    <rect x="20" y="51" width="135" height="162" rx="13" fill="#0e211c" stroke="#387965" />
    <path d="M36 72h79" stroke="#b5dfd1" strokeWidth="4" strokeLinecap="round" />
    <rect x="34" y="89" width="107" height="28" rx="6" fill="#1b3b30" stroke="#5ca78c" />
    <text x="44" y="107" fill="#d1fae5" fontSize="11" fontFamily="ui-monospace, monospace">https://…</text>
    {['#6ee7b7', '#60a5fa', '#c4b5fd'].map((c, i) => <circle key={c} cx={47 + i * 35} cy="141" r="10" fill={c} stroke={i === 0 ? '#ecfdf5' : 'none'} strokeWidth="2" />)}
    <path d="M39 180h37m10 0h42" stroke="#78b09c" strokeWidth="6" strokeLinecap="round" />
    <path d="M166 134h29m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="207" y="24" width="214" height="204" rx="16" fill="#0d211b" stroke="#50947a" />
    <g className="pd-motion pd-code">
      {[[224, 40], [350, 40], [224, 166]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="45" height="45" rx="9" stroke="#6ee7b7" strokeWidth="7" />
          <rect x={x + 14} y={y + 14} width="17" height="17" rx="4" fill="#a7f3d0" />
        </g>
      ))}
      {qrRows.flatMap((row, r) => Array.from({ length: 10 }, (_, c) => {
        if (!(row & (1 << c)) || (r < 3 && (c < 3 || c > 6)) || (r > 6 && c < 3) || (r >= 4 && r <= 5 && c >= 4 && c <= 5)) return null;
        return <rect key={`${r}-${c}`} x={222 + c * 18} y={39 + r * 18} width="12" height="12" rx="3" fill="#6ee7b7" />;
      }))}
    </g>
    <g className="pd-motion pd-finish">
      <rect x="292" y="109" width="43" height="43" rx="10" fill="#d1fae5" />
      <path d="m313 117 9 15h-18z" fill="#047857" />
      <circle cx="313" cy="139" r="4" fill="#047857" />
    </g>
    <Done label="qr.svg" />
  </Frame>
);

export const CodeProcessArt: React.FC<ArtProps> = props => {
  const gradient = useId().replace(/:/g, '');
  const lines = ['const greet = () => {', '  return "hello";', '};', '', 'greet();'];
  return (
    <Frame {...props} color="#a5b4fc">
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7137b8" /><stop offset="1" stopColor="#326ada" /></linearGradient></defs>
      <rect x="12" y="64" width="136" height="145" rx="10" fill="#171c2c" stroke="#54617c" />
      {lines.map((line, i) => <text key={i} x="22" y={90 + i * 21} fill="#cbd5e1" fontSize="8.5" fontFamily="ui-monospace, monospace">{line}</text>)}
      <path d="M157 134h29m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="197" y="24" width="231" height="204" rx="15" fill={`url(#${gradient})`} />
      <rect x="214" y="44" width="197" height="163" rx="9" fill="#151b2b" stroke="#bcc5e3" strokeOpacity=".25" />
      {['#fb7185', '#fcd34d', '#6ee7b7'].map((c, i) => <circle key={c} cx={229 + i * 12} cy="59" r="3" fill={c} />)}
      <path d="M224 74h177" stroke="#35415a" />
      <g className="pd-motion pd-code">
        <rect x="220" y="112" width="185" height="20" fill="#7496dd" fillOpacity=".13" />
        {lines.map((line, i) => (
          <g key={i}>
            <text x="223" y={101 + i * 20} fill="#7084a4" fontSize="8" fontFamily="ui-monospace, monospace">{i + 1}</text>
            <text x="237" y={101 + i * 20} fill={['#c4b5fd', '#a7f3d0', '#cbd5e1', '#cbd5e1', '#93c5fd'][i]} fontSize="9" fontFamily="ui-monospace, monospace">{line}</text>
          </g>
        ))}
      </g>
      <Done label="code.png" />
    </Frame>
  );
};
