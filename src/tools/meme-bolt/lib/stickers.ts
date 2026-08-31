// ============================================================================
// Sticker set
// ----------------------------------------------------------------------------
// All hand-drawn SVG, no emoji fonts (which render differently on every OS and
// would make the export look nothing like the preview).
//
// `%COLOR%` is substituted before rasterising, so the tintable stickers follow
// the layer colour instead of forcing a palette.
// ============================================================================

export interface StickerDef {
  id: string;
  name: string;
  /** Intrinsic aspect ratio (width / height). */
  ratio: number;
  /** Sensible starting width, as a percentage of the canvas width. */
  size: number;
  /** True when the art uses %COLOR% and should expose a colour control. */
  tintable: boolean;
  svg: string;
  group: 'faces' | 'props' | 'marks';
}

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

const DEFS: StickerDef[] = [
  {
    id: 'shades',
    name: 'Pixel Shades',
    ratio: 200 / 60,
    size: 26,
    tintable: false,
    group: 'props',
    svg: svg(
      200,
      60,
      `<g fill="#0b0b0f">
        <rect x="10" y="12" width="76" height="34" rx="3"/>
        <rect x="114" y="12" width="76" height="34" rx="3"/>
        <rect x="86" y="20" width="28" height="10"/>
        <rect x="0" y="12" width="12" height="10"/>
        <rect x="188" y="12" width="12" height="10"/>
      </g>
      <g fill="#f8fafc" opacity="0.92">
        <rect x="22" y="20" width="14" height="14"/>
        <rect x="44" y="30" width="14" height="14"/>
        <rect x="126" y="20" width="14" height="14"/>
        <rect x="148" y="30" width="14" height="14"/>
      </g>`
    ),
  },
  {
    id: 'cap',
    name: 'Snapback',
    ratio: 200 / 120,
    size: 30,
    tintable: true,
    group: 'props',
    svg: svg(
      200,
      120,
      `<path d="M28 78 C28 30 62 8 100 8 C138 8 172 30 172 78 Z" fill="%COLOR%"/>
      <path d="M20 78 H196 C196 96 176 102 150 102 H20 Z" fill="%COLOR%"/>
      <path d="M28 78 H172 V90 H28 Z" fill="rgba(0,0,0,0.35)"/>
      <circle cx="100" cy="14" r="9" fill="rgba(255,255,255,0.55)"/>
      <path d="M100 8 V78" stroke="rgba(0,0,0,0.25)" stroke-width="4"/>`
    ),
  },
  {
    id: 'crown',
    name: 'Crown',
    ratio: 200 / 150,
    size: 26,
    tintable: true,
    group: 'props',
    svg: svg(
      200,
      150,
      `<path d="M14 128 L28 34 L72 82 L100 16 L128 82 L172 34 L186 128 Z" fill="%COLOR%" stroke="rgba(0,0,0,0.35)" stroke-width="6" stroke-linejoin="round"/>
      <rect x="14" y="122" width="172" height="22" rx="8" fill="%COLOR%" stroke="rgba(0,0,0,0.35)" stroke-width="6"/>
      <circle cx="100" cy="12" r="11" fill="#fff" opacity="0.8"/>`
    ),
  },
  {
    id: 'tears',
    name: 'Tears',
    ratio: 1,
    size: 18,
    tintable: false,
    group: 'faces',
    svg: svg(
      120,
      120,
      `<defs><linearGradient id="stTear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bae6fd"/><stop offset="1" stop-color="#0284c7"/></linearGradient></defs>
      <path d="M38 6 C38 40 8 52 8 82 C8 102 22 116 40 116 C58 116 72 102 72 82 C72 52 42 40 38 6 Z" fill="url(#stTear)"/>
      <path d="M92 40 C92 62 74 70 74 88 C74 101 82 110 93 110 C104 110 112 101 112 88 C112 70 94 62 92 40 Z" fill="url(#stTear)" opacity="0.85"/>
      <ellipse cx="30" cy="74" rx="8" ry="14" fill="#fff" opacity="0.55"/>`
    ),
  },
  {
    id: 'bubble',
    name: 'Speech Bubble',
    ratio: 200 / 160,
    size: 32,
    tintable: true,
    group: 'props',
    svg: svg(
      200,
      160,
      `<path d="M14 12 H186 A14 14 0 0 1 200 26 V110 A14 14 0 0 1 186 124 H86 L44 154 L54 124 H14 A14 14 0 0 1 0 110 V26 A14 14 0 0 1 14 12 Z" fill="%COLOR%" stroke="#0b0b0f" stroke-width="9" stroke-linejoin="round"/>`
    ),
  },
  {
    id: 'troll',
    name: 'Grin Face',
    ratio: 1,
    size: 24,
    tintable: false,
    group: 'faces',
    svg: svg(
      160,
      160,
      `<circle cx="80" cy="80" r="72" fill="#f8fafc" stroke="#0b0b0f" stroke-width="8"/>
      <path d="M22 82 C34 136 126 136 138 82 C126 106 34 106 22 82 Z" fill="#0b0b0f"/>
      <path d="M22 82 C34 136 126 136 138 82" fill="none" stroke="#0b0b0f" stroke-width="8" stroke-linecap="round"/>
      <path d="M18 78 C32 78 26 100 18 106" fill="none" stroke="#0b0b0f" stroke-width="7"/>
      <path d="M142 78 C128 78 134 100 142 106" fill="none" stroke="#0b0b0f" stroke-width="7"/>
      <ellipse cx="56" cy="62" rx="14" ry="11" fill="#fff" stroke="#0b0b0f" stroke-width="7"/>
      <circle cx="56" cy="62" r="5" fill="#0b0b0f"/>
      <ellipse cx="104" cy="62" rx="14" ry="11" fill="#fff" stroke="#0b0b0f" stroke-width="7"/>
      <circle cx="104" cy="62" r="5" fill="#0b0b0f"/>
      <path d="M38 44 C50 34 66 38 74 48" fill="none" stroke="#0b0b0f" stroke-width="6" stroke-linecap="round"/>
      <path d="M122 44 C110 34 94 38 86 48" fill="none" stroke="#0b0b0f" stroke-width="6" stroke-linecap="round"/>`
    ),
  },
  {
    id: 'skull',
    name: 'Skull',
    ratio: 1,
    size: 20,
    tintable: true,
    group: 'faces',
    svg: svg(
      160,
      160,
      `<path d="M80 8 C36 8 14 42 14 76 C14 100 26 112 38 120 L38 142 A8 8 0 0 0 46 150 H114 A8 8 0 0 0 122 142 L122 120 C134 112 146 100 146 76 C146 42 124 8 80 8 Z" fill="%COLOR%"/>
      <ellipse cx="54" cy="76" rx="18" ry="21" fill="#0b0b0f"/>
      <ellipse cx="106" cy="76" rx="18" ry="21" fill="#0b0b0f"/>
      <path d="M80 96 L70 118 H90 Z" fill="#0b0b0f"/>
      <g fill="#0b0b0f"><rect x="58" y="130" width="8" height="20"/><rect x="76" y="130" width="8" height="20"/><rect x="94" y="130" width="8" height="20"/></g>`
    ),
  },
  {
    id: 'fire',
    name: 'Fire',
    ratio: 120 / 160,
    size: 16,
    tintable: false,
    group: 'props',
    svg: svg(
      120,
      160,
      `<defs><linearGradient id="stFire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fbbf24"/><stop offset="0.55" stop-color="#f97316"/><stop offset="1" stop-color="#ef4444"/></linearGradient></defs>
      <path d="M60 4 C46 40 8 52 8 100 C8 134 32 156 60 156 C88 156 112 134 112 100 C112 66 84 62 78 34 C70 56 52 56 60 4 Z" fill="url(#stFire)"/>
      <path d="M60 74 C52 92 38 100 38 118 C38 132 48 142 60 142 C72 142 82 132 82 118 C82 100 68 94 60 74 Z" fill="#fde68a"/>`
    ),
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    ratio: 1,
    size: 16,
    tintable: true,
    group: 'marks',
    svg: svg(
      160,
      160,
      `<path d="M96 12 C102 52 110 60 150 66 C110 72 102 80 96 120 C90 80 82 72 42 66 C82 60 90 52 96 12 Z" fill="%COLOR%"/>
      <path d="M42 92 C46 116 50 120 74 124 C50 128 46 132 42 156 C38 132 34 128 10 124 C34 120 38 116 42 92 Z" fill="%COLOR%" opacity="0.85"/>`
    ),
  },
  {
    id: 'stonks',
    name: 'Up Arrow',
    ratio: 1,
    size: 24,
    tintable: true,
    group: 'marks',
    svg: svg(
      160,
      160,
      `<path d="M14 138 L58 92 L88 118 L134 60" fill="none" stroke="%COLOR%" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M96 42 H146 V92" fill="none" stroke="%COLOR%" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`
    ),
  },
  {
    id: 'circle-mark',
    name: 'Red Circle',
    ratio: 1,
    size: 34,
    tintable: true,
    group: 'marks',
    svg: svg(
      200,
      200,
      `<path d="M172 74 C160 30 112 12 74 22 C30 34 14 82 24 122 C34 164 78 186 118 180 C160 174 186 138 184 100" fill="none" stroke="%COLOR%" stroke-width="14" stroke-linecap="round"/>`
    ),
  },
  {
    id: 'arrow',
    name: 'Pointer Arrow',
    ratio: 200 / 120,
    size: 26,
    tintable: true,
    group: 'marks',
    svg: svg(
      200,
      120,
      `<path d="M6 60 H150" stroke="%COLOR%" stroke-width="18" stroke-linecap="round"/>
      <path d="M124 20 L190 60 L124 100 Z" fill="%COLOR%"/>`
    ),
  },
  {
    id: 'censor',
    name: 'Censor Bar',
    ratio: 200 / 46,
    size: 30,
    tintable: true,
    group: 'marks',
    svg: svg(200, 46, `<rect width="200" height="46" rx="4" fill="%COLOR%"/>`),
  },
  {
    id: 'stamp',
    name: 'Approved Stamp',
    ratio: 200 / 120,
    size: 30,
    tintable: true,
    group: 'marks',
    svg: svg(
      200,
      120,
      `<rect x="8" y="8" width="184" height="104" rx="12" fill="none" stroke="%COLOR%" stroke-width="10"/>
      <path d="M44 62 L78 94 L156 30" fill="none" stroke="%COLOR%" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`
    ),
  },
];

export const STICKERS: Record<string, StickerDef> = Object.fromEntries(DEFS.map(d => [d.id, d]));
export const STICKER_LIST = DEFS;

/** Returns the SVG source with the tint applied, ready to rasterise. */
export function stickerSvg(def: StickerDef, color: string): string {
  return def.tintable ? def.svg.split('%COLOR%').join(color) : def.svg;
}
