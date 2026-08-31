// ============================================================================
// Meme templates
// ----------------------------------------------------------------------------
// Original flat-vector re-drawings, not photographs: they are SVG strings, so
// the exporter can rasterise them at whatever size the user asks for instead of
// upscaling a 500 px bitmap (which is what the old version did).
//
// Every template declares where its captions go, in the same 0-100 canvas
// coordinates the layers use.
// ============================================================================

import type { TextAlign } from '../types';

export interface TemplateCaption {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  boxWidth: number;
  align?: TextAlign;
  color?: string;
  strokeWidth?: number;
}

export interface MemeTemplate {
  id: string;
  /** Fallback label; the dictionary key `tpl_<id>` wins when present. */
  name: string;
  /** width / height */
  ratio: number;
  /** Base pixel width used for the document. */
  width: number;
  svg: string;
  captions: TemplateCaption[];
}

const wrap = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

// ---------------------------------------------------------------------------
// Shared figure pieces, so the people across templates look like one cast.
// ---------------------------------------------------------------------------
const skin = '#a4693f';
const skinDark = '#8a5330';

/** Head + shoulders, facing the viewer. `dx`/`dy` place the chin. */
const bust = (dx: number, dy: number, s: number, jacket: string, jacket2: string) => `
  <g transform="translate(${dx} ${dy}) scale(${s})">
    <path d="M-92 190 C-92 96 -50 56 0 56 C50 56 92 96 92 190 Z" fill="${jacket}"/>
    <path d="M-30 60 C-18 84 18 84 30 60 L46 70 C24 104 -24 104 -46 70 Z" fill="${jacket2}"/>
    <rect x="-13" y="18" width="26" height="46" rx="12" fill="${skinDark}"/>
    <ellipse cx="0" cy="-22" rx="46" ry="52" fill="${skin}"/>
    <path d="M-46 -26 C-44 -78 44 -78 46 -26 C46 -54 30 -66 0 -66 C-30 -66 -46 -54 -46 -26 Z" fill="#17131a"/>
    <path d="M-40 4 C-30 40 30 40 40 4 C36 34 22 46 0 46 C-22 46 -36 34 -40 4 Z" fill="#2a2028"/>
    <ellipse cx="-17" cy="-24" rx="6" ry="4.4" fill="#1c1418"/>
    <ellipse cx="17" cy="-24" rx="6" ry="4.4" fill="#1c1418"/>
  </g>`;

// ---------------------------------------------------------------------------
// 1 · Two-panel approve / reject
// ---------------------------------------------------------------------------
const twoPanel = wrap(
  900,
  900,
  `<defs>
    <linearGradient id="tpA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f97316"/><stop offset="1" stop-color="#ea580c"/></linearGradient>
    <linearGradient id="tpB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#facc15"/><stop offset="1" stop-color="#eab308"/></linearGradient>
  </defs>
  <rect width="900" height="900" fill="#0b0710"/>
  <rect x="0" y="0" width="450" height="450" fill="url(#tpA)"/>
  <rect x="0" y="450" width="450" height="450" fill="url(#tpB)"/>
  <rect x="450" y="0" width="450" height="450" fill="#f4f1ea"/>
  <rect x="450" y="450" width="450" height="450" fill="#e9e4d9"/>
  ${bust(215, 300, 1.05, '#e11d48', '#fb7185')}
  <g transform="translate(300 270) rotate(14)">
    <rect x="-26" y="-64" width="52" height="118" rx="26" fill="${skin}"/>
    <rect x="-30" y="-84" width="60" height="40" rx="20" fill="${skin}"/>
    <path d="M-30 -74 L30 -74" stroke="${skinDark}" stroke-width="5" stroke-linecap="round"/>
  </g>
  ${bust(215, 750, 1.05, '#0ea5e9', '#7dd3fc')}
  <g transform="translate(318 690) rotate(-18)">
    <rect x="-24" y="-30" width="48" height="86" rx="22" fill="${skin}"/>
    <rect x="-10" y="-86" width="30" height="72" rx="15" fill="${skin}"/>
  </g>
  <path d="M0 450 H900" stroke="#0b0710" stroke-width="9"/>
  <path d="M450 0 V900" stroke="#0b0710" stroke-width="9"/>`
);

// ---------------------------------------------------------------------------
// 2 · Two buttons
// ---------------------------------------------------------------------------
const twoButtons = wrap(
  900,
  1150,
  `<defs>
    <linearGradient id="tbSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#0f172a"/></linearGradient>
    <radialGradient id="tbBtn" cx="35%" cy="30%"><stop offset="0" stop-color="#f87171"/><stop offset="1" stop-color="#b91c1c"/></radialGradient>
  </defs>
  <rect width="900" height="1150" fill="url(#tbSky)"/>
  <rect x="40" y="40" width="820" height="500" rx="26" fill="#111827" stroke="#334155" stroke-width="6"/>
  <rect x="70" y="70" width="760" height="440" rx="16" fill="#1f2937"/>
  <circle cx="270" cy="300" r="132" fill="#7f1d1d"/>
  <circle cx="270" cy="288" r="120" fill="url(#tbBtn)"/>
  <ellipse cx="238" cy="248" rx="44" ry="26" fill="#fecaca" opacity="0.45"/>
  <circle cx="630" cy="300" r="132" fill="#7f1d1d"/>
  <circle cx="630" cy="288" r="120" fill="url(#tbBtn)"/>
  <ellipse cx="598" cy="248" rx="44" ry="26" fill="#fecaca" opacity="0.45"/>
  <rect x="0" y="560" width="900" height="590" fill="#e2e8f0"/>
  <path d="M0 560 H900" stroke="#0f172a" stroke-width="8"/>
  ${bust(450, 1000, 1.9, '#f8fafc', '#cbd5e1')}
  <g transform="translate(300 780) rotate(-42)">
    <rect x="-30" y="-150" width="60" height="230" rx="30" fill="${skin}"/>
  </g>
  <ellipse cx="392" cy="836" rx="14" ry="22" fill="#38bdf8" opacity="0.85"/>
  <ellipse cx="512" cy="852" rx="12" ry="19" fill="#38bdf8" opacity="0.85"/>`
);

// ---------------------------------------------------------------------------
// 3 · Change my mind
// ---------------------------------------------------------------------------
const changeMyMind = wrap(
  1200,
  900,
  `<defs>
    <linearGradient id="cmSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient>
    <linearGradient id="cmGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#64748b"/><stop offset="1" stop-color="#334155"/></linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#cmSky)"/>
  <circle cx="1010" cy="150" r="76" fill="#fde68a" opacity="0.9"/>
  <path d="M0 470 H1200 V900 H0 Z" fill="url(#cmGround)"/>
  <path d="M60 470 L180 300 L300 470 Z" fill="#166534" opacity="0.6"/>
  <path d="M980 470 L1090 320 L1200 470 Z" fill="#166534" opacity="0.5"/>
  ${bust(300, 700, 1.5, '#1f2937', '#374151')}
  <rect x="330" y="600" width="740" height="300" rx="10" fill="#f8fafc"/>
  <rect x="330" y="600" width="740" height="300" rx="10" fill="none" stroke="#0f172a" stroke-width="10"/>
  <rect x="300" y="576" width="800" height="34" rx="14" fill="#94a3b8"/>
  <rect x="360" y="640" width="680" height="220" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="470" y="880" width="460" height="20" fill="#1e293b"/>`
);

// ---------------------------------------------------------------------------
// 4 · Small victory
// ---------------------------------------------------------------------------
const smallVictory = wrap(
  900,
  900,
  `<defs>
    <radialGradient id="svBg" cx="50%" cy="35%"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#1d4ed8"/></radialGradient>
    <linearGradient id="svSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcd34d"/><stop offset="1" stop-color="#d97706"/></linearGradient>
  </defs>
  <rect width="900" height="900" fill="url(#svBg)"/>
  <path d="M0 620 C220 574 420 640 620 606 C740 586 830 606 900 592 L900 900 L0 900 Z" fill="url(#svSand)"/>
  <circle cx="140" cy="140" r="66" fill="#fef9c3" opacity="0.85"/>
  ${bust(450, 700, 2.1, '#f1f5f9', '#cbd5e1')}
  <g transform="translate(268 604) rotate(24)">
    <rect x="-40" y="-40" width="80" height="150" rx="38" fill="${skin}"/>
    <circle cx="0" cy="-52" r="52" fill="${skin}"/>
    <path d="M-34 -66 L34 -66" stroke="${skinDark}" stroke-width="7" stroke-linecap="round"/>
    <path d="M-30 -44 L30 -44" stroke="${skinDark}" stroke-width="7" stroke-linecap="round"/>
  </g>
  <g fill="#fef08a" opacity="0.9">
    <circle cx="700" cy="250" r="9"/><circle cx="760" cy="330" r="6"/><circle cx="660" cy="360" r="5"/>
    <circle cx="200" cy="300" r="7"/><circle cx="150" cy="380" r="5"/>
  </g>`
);

// ---------------------------------------------------------------------------
// 5 · Expanding brain (4 tiers)
// ---------------------------------------------------------------------------
const brainTier = (cy: number, r: number, glow: number, color: string) => `
  <g transform="translate(225 ${cy})">
    ${glow > 0 ? `<circle r="${r * (1.35 + glow * 0.35)}" fill="${color}" opacity="${0.1 + glow * 0.13}"/>` : ''}
    <path d="M${-r} 0 C${-r} ${-r * 0.95} ${-r * 0.42} ${-r * 1.28} 0 ${-r * 1.02} C${r * 0.42} ${-r * 1.28} ${r} ${-r * 0.95} ${r} 0 C${r} ${r * 0.92} ${r * 0.4} ${r * 1.2} 0 ${r * 1.02} C${-r * 0.4} ${r * 1.2} ${-r} ${r * 0.92} ${-r} 0 Z" fill="${color}"/>
    <path d="M0 ${-r * 1.02} L0 ${r * 1.02}" stroke="#4c0519" stroke-width="${r * 0.07}" opacity="0.45"/>
    <path d="M${-r * 0.62} ${-r * 0.34} C${-r * 0.28} ${-r * 0.06} ${-r * 0.58} ${r * 0.3} ${-r * 0.24} ${r * 0.54}" stroke="#4c0519" stroke-width="${r * 0.06}" fill="none" opacity="0.45"/>
    <path d="M${r * 0.62} ${-r * 0.34} C${r * 0.28} ${-r * 0.06} ${r * 0.58} ${r * 0.3} ${r * 0.24} ${r * 0.54}" stroke="#4c0519" stroke-width="${r * 0.06}" fill="none" opacity="0.45"/>
  </g>`;

const expandingBrain = wrap(
  900,
  1200,
  `<rect width="900" height="1200" fill="#f8fafc"/>
  <rect x="0" y="0" width="450" height="300" fill="#111827"/>
  <rect x="0" y="300" width="450" height="300" fill="#1f2937"/>
  <rect x="0" y="600" width="450" height="300" fill="#312e81"/>
  <rect x="0" y="900" width="450" height="300" fill="#4c1d95"/>
  <rect x="450" y="0" width="450" height="1200" fill="#f1f5f9"/>
  ${brainTier(150, 52, 0, '#f9a8d4')}
  ${brainTier(450, 74, 0.4, '#f472b6')}
  ${brainTier(750, 92, 0.9, '#e879f9')}
  ${brainTier(1050, 108, 1.5, '#fde68a')}
  <g stroke="#0b0710" stroke-width="7"><path d="M0 300 H900"/><path d="M0 600 H900"/><path d="M0 900 H900"/><path d="M450 0 V1200"/></g>`
);

// ---------------------------------------------------------------------------
// 6 · Everything is fine
// ---------------------------------------------------------------------------
const everythingFine = wrap(
  1200,
  900,
  `<defs>
    <linearGradient id="efRoom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c2d12"/><stop offset="1" stop-color="#431407"/></linearGradient>
    <linearGradient id="efFlame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f59e0b"/><stop offset="0.6" stop-color="#f97316"/><stop offset="1" stop-color="#fca5a5"/></linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#efRoom)"/>
  <rect x="0" y="640" width="1200" height="260" fill="#292524"/>
  <g fill="url(#efFlame)" opacity="0.95">
    <path d="M120 640 C90 560 160 540 140 470 C210 520 232 590 214 640 Z"/>
    <path d="M300 640 C268 546 348 520 322 448 C400 506 424 586 400 640 Z"/>
    <path d="M900 640 C868 552 946 528 920 456 C998 512 1022 588 998 640 Z"/>
    <path d="M1080 640 C1052 570 1114 548 1096 486 C1160 532 1180 596 1160 640 Z"/>
  </g>
  <g fill="#fbbf24" opacity="0.55">
    <circle cx="230" cy="380" r="10"/><circle cx="420" cy="300" r="7"/><circle cx="960" cy="330" r="9"/><circle cx="1120" cy="400" r="6"/>
  </g>
  <rect x="470" y="620" width="270" height="26" rx="8" fill="#78350f"/>
  <rect x="500" y="646" width="26" height="80" fill="#78350f"/>
  <rect x="684" y="646" width="26" height="80" fill="#78350f"/>
  ${bust(604, 620, 1.35, '#facc15', '#fde047')}
  <g transform="translate(700 596)">
    <rect x="-26" y="-14" width="52" height="46" rx="8" fill="#f8fafc"/>
    <path d="M26 -2 a16 16 0 0 1 0 24" stroke="#f8fafc" stroke-width="9" fill="none"/>
  </g>`
);

// ---------------------------------------------------------------------------
// 7 · Blank meme card — a clean stage for a caption-bar meme.
// ---------------------------------------------------------------------------
const blankStage = wrap(
  1000,
  1000,
  `<defs>
    <linearGradient id="bsBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#312e81"/><stop offset="0.55" stop-color="#6d28d9"/><stop offset="1" stop-color="#db2777"/></linearGradient>
    <pattern id="bsGrid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M50 0 H0 V50" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1000" height="1000" fill="url(#bsBg)"/>
  <rect width="1000" height="1000" fill="url(#bsGrid)"/>
  <circle cx="820" cy="180" r="120" fill="#f0abfc" opacity="0.28"/>
  <circle cx="180" cy="840" r="160" fill="#38bdf8" opacity="0.22"/>`
);

export const TEMPLATES: MemeTemplate[] = [
  {
    id: 'two-panel',
    name: 'Two Panel',
    ratio: 1,
    width: 900,
    svg: twoPanel,
    captions: [
      { text: 'The old way', x: 75, y: 25, fontSize: 5.2, boxWidth: 44, color: '#111827', strokeWidth: 0 },
      { text: 'The better way', x: 75, y: 75, fontSize: 5.2, boxWidth: 44, color: '#111827', strokeWidth: 0 },
    ],
  },
  {
    id: 'two-buttons',
    name: 'Two Buttons',
    ratio: 900 / 1150,
    width: 900,
    svg: twoButtons,
    captions: [
      { text: 'Option A', x: 30, y: 17, fontSize: 4, boxWidth: 26 },
      { text: 'Option B', x: 70, y: 17, fontSize: 4, boxWidth: 26 },
      { text: 'Me, every single time', x: 50, y: 93, fontSize: 4.6, boxWidth: 82, color: '#0f172a', strokeWidth: 0 },
    ],
  },
  {
    id: 'change-my-mind',
    name: 'Change My Mind',
    ratio: 1200 / 900,
    width: 1200,
    svg: changeMyMind,
    captions: [{ text: 'Local beats cloud', x: 58, y: 82, fontSize: 6.5, boxWidth: 52, color: '#0f172a', strokeWidth: 0 }],
  },
  {
    id: 'small-victory',
    name: 'Small Victory',
    ratio: 1,
    width: 900,
    svg: smallVictory,
    captions: [
      { text: 'Uploaded nothing', x: 50, y: 10, fontSize: 7.5, boxWidth: 88 },
      { text: 'Still got the meme', x: 50, y: 90, fontSize: 7.5, boxWidth: 88 },
    ],
  },
  {
    id: 'expanding-brain',
    name: 'Expanding Brain',
    ratio: 900 / 1200,
    width: 900,
    svg: expandingBrain,
    captions: [
      { text: 'Upload it to a server', x: 75, y: 12.5, fontSize: 3.4, boxWidth: 44, color: '#0f172a', strokeWidth: 0 },
      { text: 'Install an app', x: 75, y: 37.5, fontSize: 3.4, boxWidth: 44, color: '#0f172a', strokeWidth: 0 },
      { text: 'Use a browser tool', x: 75, y: 62.5, fontSize: 3.4, boxWidth: 44, color: '#0f172a', strokeWidth: 0 },
      { text: 'Never leave the tab', x: 75, y: 87.5, fontSize: 3.4, boxWidth: 44, color: '#0f172a', strokeWidth: 0 },
    ],
  },
  {
    id: 'everything-fine',
    name: 'Everything Is Fine',
    ratio: 1200 / 900,
    width: 1200,
    svg: everythingFine,
    captions: [
      { text: 'Deploy on Friday', x: 50, y: 12, fontSize: 6.4, boxWidth: 86 },
      { text: 'This is fine', x: 50, y: 90, fontSize: 6.4, boxWidth: 86 },
    ],
  },
  {
    id: 'blank-stage',
    name: 'Blank Stage',
    ratio: 1,
    width: 1000,
    svg: blankStage,
    captions: [{ text: 'Your text here', x: 50, y: 50, fontSize: 8, boxWidth: 84 }],
  },
];

export const getTemplate = (id: string): MemeTemplate =>
  TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
