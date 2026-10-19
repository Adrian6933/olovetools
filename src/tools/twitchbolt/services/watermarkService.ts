// ============================================================================
// Marca de agua de TwitchBolt: estado guardado, tipografías, animación y
// dibujo sobre canvas, y el render del vídeo con la marca incrustada.
//
// El render graba con MediaRecorder sobre un canvas, o sea A VELOCIDAD REAL:
// un clip de 60 s tarda 60 s. La interfaz lo avisa antes de empezar.
// ============================================================================

import type { WatermarkConfig, PositionPreset, FontFamily, FontCategory } from '../types';

export const WATERMARK_STORAGE_KEY = 'twitchbolt_watermark_config';
export const PRESETS_STORAGE_KEY = 'twitchbolt_watermark_presets';

export const DEFAULT_POSITION_PRESETS: PositionPreset[] = [
  { id: 'top-left', name: 'Top left', x: 5, y: 5, isDefault: true },
  { id: 'top-center', name: 'Top centre', x: 50, y: 5, isDefault: true },
  { id: 'top-right', name: 'Top right', x: 95, y: 5, isDefault: true },
  { id: 'center', name: 'Centre', x: 50, y: 50, isDefault: true },
  { id: 'bottom-left', name: 'Bottom left', x: 5, y: 95, isDefault: true },
  { id: 'bottom-center', name: 'Bottom centre', x: 50, y: 95, isDefault: true },
  { id: 'bottom-right', name: 'Bottom right', x: 95, y: 95, isDefault: true },
];

/** Hueco de la plantilla que se cambia por el nombre del streamer de cada clip. */
export const CHANNEL_TOKEN = '{channel}';

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: false,
  template: '@{channel}',
  positionId: 'top-right',
  customX: 95,
  customY: 5,
  fontFamily: 'sans',
  fontSize: 22,
  textColor: '#ffffff',
  bgColor: '#9146FF',
  bgOpacity: 0.85,
  borderRadius: 8,
  paddingX: 14,
  paddingY: 8,
  shadow: true,
  shadowColor: 'rgba(0, 0, 0, 0.7)',
  showIcon: true,
  entryEffect: 'fade',
  entryDuration: 0.8,
  exitEffect: 'none',
  exitDuration: 0.8,
  textTransform: 'none',
  fontWeight: 'bold',
  fontStyle: 'normal',
  letterSpacing: 0,
  stroke: false,
  strokeColor: '#000000',
  strokeWidth: 2,
  strokeOpacity: 1.0,
  strokeJoin: 'round',
  shadowBlur: 8,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  glowMode: false,
  boxBorder: false,
  boxBorderColor: '#ffffff',
  boxBorderWidth: 2,
};

// ---- Tipografías -----------------------------------------------------------
// Antes el selector ofrecía Bebas, Orbitron, Pixel o Graffiti pero ninguna se
// cargaba: el vídeo salía con la letra del sistema y todas parecían la misma.
// Ahora cada una trae su familia de Google Fonts, que se pide solo al abrir el
// editor (no pesa en la página para quien solo descarga clips).
export interface FontEntry {
  id: FontFamily;
  name: string;
  /** Familia tal como la nombra Google Fonts; también es el nombre CSS. */
  family: string;
  /** Lo que va tras family= en la URL de Google Fonts. */
  google: string;
  fallback: string;
  cat: FontCategory;
}

export const FONT_CATALOG: FontEntry[] = [
  { id: 'sans', name: 'Inter', family: 'Inter', google: 'Inter:wght@400;700;900', fallback: 'system-ui, sans-serif', cat: 'clean' },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat', google: 'Montserrat:wght@400;700;900', fallback: 'sans-serif', cat: 'clean' },
  { id: 'oswald', name: 'Oswald', family: 'Oswald', google: 'Oswald:wght@400;700', fallback: 'sans-serif', cat: 'clean' },
  { id: 'serif', name: 'Playfair', family: 'Playfair Display', google: 'Playfair+Display:wght@400;700;900', fallback: 'Georgia, serif', cat: 'clean' },
  { id: 'mono', name: 'JetBrains Mono', family: 'JetBrains Mono', google: 'JetBrains+Mono:wght@400;700', fallback: 'monospace', cat: 'clean' },
  { id: 'bebas', name: 'Bebas Neue', family: 'Bebas Neue', google: 'Bebas+Neue', fallback: 'Impact, sans-serif', cat: 'bold' },
  { id: 'impact', name: 'Anton', family: 'Anton', google: 'Anton', fallback: 'Impact, sans-serif', cat: 'bold' },
  { id: 'teko', name: 'Teko', family: 'Teko', google: 'Teko:wght@400;700', fallback: 'sans-serif', cat: 'bold' },
  { id: 'bungee', name: 'Bungee', family: 'Bungee', google: 'Bungee', fallback: 'sans-serif', cat: 'bold' },
  { id: 'bangers', name: 'Bangers', family: 'Bangers', google: 'Bangers', fallback: 'cursive', cat: 'bold' },
  { id: 'orbitron', name: 'Orbitron', family: 'Orbitron', google: 'Orbitron:wght@400;700;900', fallback: 'sans-serif', cat: 'gaming' },
  { id: 'audiowide', name: 'Audiowide', family: 'Audiowide', google: 'Audiowide', fallback: 'sans-serif', cat: 'gaming' },
  { id: 'russo', name: 'Russo One', family: 'Russo One', google: 'Russo+One', fallback: 'sans-serif', cat: 'gaming' },
  { id: 'blackops', name: 'Black Ops', family: 'Black Ops One', google: 'Black+Ops+One', fallback: 'sans-serif', cat: 'gaming' },
  { id: 'pixel', name: 'Press Start', family: 'Press Start 2P', google: 'Press+Start+2P', fallback: 'monospace', cat: 'gaming' },
  { id: 'silkscreen', name: 'Silkscreen', family: 'Silkscreen', google: 'Silkscreen:wght@400;700', fallback: 'monospace', cat: 'gaming' },
  { id: 'righteous', name: 'Righteous', family: 'Righteous', google: 'Righteous', fallback: 'sans-serif', cat: 'fun' },
  { id: 'monoton', name: 'Monoton', family: 'Monoton', google: 'Monoton', fallback: 'sans-serif', cat: 'fun' },
  { id: 'rubikglitch', name: 'Rubik Glitch', family: 'Rubik Glitch', google: 'Rubik+Glitch', fallback: 'sans-serif', cat: 'fun' },
  { id: 'creepster', name: 'Creepster', family: 'Creepster', google: 'Creepster', fallback: 'cursive', cat: 'fun' },
  { id: 'handwriting', name: 'Permanent Marker', family: 'Permanent Marker', google: 'Permanent+Marker', fallback: 'cursive', cat: 'hand' },
  { id: 'pacifico', name: 'Pacifico', family: 'Pacifico', google: 'Pacifico', fallback: 'cursive', cat: 'hand' },
  { id: 'lobster', name: 'Lobster', family: 'Lobster', google: 'Lobster', fallback: 'cursive', cat: 'hand' },
  { id: 'caveat', name: 'Caveat', family: 'Caveat', google: 'Caveat:wght@400;700', fallback: 'cursive', cat: 'hand' },
];

const fontEntry = (id: FontFamily): FontEntry =>
  FONT_CATALOG.find(f => f.id === id) || FONT_CATALOG[0];

export const getFontCss = (fontFamily: FontFamily): string => {
  const f = fontEntry(fontFamily);
  return `'${f.family}', ${f.fallback}`;
};

let fontSheet: Promise<void> | null = null;

/** Pide la hoja de Google Fonts una sola vez; resuelve cuando ya está leída. */
export const loadWatermarkFonts = (): Promise<void> => {
  if (typeof document === 'undefined') return Promise.resolve();
  if (fontSheet) return fontSheet;
  fontSheet = new Promise<void>(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${FONT_CATALOG.map(f => 'family=' + f.google).join('&')}&display=swap`;
    link.onload = () => resolve();
    // Sin red se sigue con la letra de respaldo en vez de quedarse esperando.
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  return fontSheet;
};

/**
 * Espera a que la letra elegida esté de verdad lista. Hace falta antes de
 * grabar: el canvas no avisa, pinta con la de respaldo los primeros fotogramas
 * y el clip sale con la letra cambiando a mitad.
 */
export const ensureWatermarkFont = async (config: WatermarkConfig): Promise<void> => {
  if (typeof document === 'undefined' || !document.fonts) return;
  await loadWatermarkFonts();
  const f = fontEntry(config.fontFamily);
  const weight = config.fontWeight === '900' ? '900' : config.fontWeight === 'normal' ? '400' : '700';
  try {
    await Promise.race([
      document.fonts.load(`${config.fontStyle === 'italic' ? 'italic ' : ''}${weight} 40px "${f.family}"`),
      new Promise(r => setTimeout(r, 5000)),
    ]);
  } catch {
    // Si falla, se dibuja con la de respaldo: mejor eso que no exportar.
  }
};

export const loadStoredWatermarkConfig = (): WatermarkConfig => {
  if (typeof window === 'undefined') return DEFAULT_WATERMARK_CONFIG;
  try {
    const saved = localStorage.getItem(WATERMARK_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_WATERMARK_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Error reading watermark config from localStorage", e);
  }
  return DEFAULT_WATERMARK_CONFIG;
};

export const saveStoredWatermarkConfig = (config: WatermarkConfig): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Error saving watermark config to localStorage", e);
  }
};

export const loadStoredPresets = (): PositionPreset[] => {
  if (typeof window === 'undefined') return DEFAULT_POSITION_PRESETS;
  try {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (saved) {
      const custom: PositionPreset[] = JSON.parse(saved);
      return [...DEFAULT_POSITION_PRESETS, ...custom.filter(c => !DEFAULT_POSITION_PRESETS.some(d => d.id === c.id))];
    }
  } catch (e) {
    console.warn("Error reading custom position presets from localStorage", e);
  }
  return DEFAULT_POSITION_PRESETS;
};

export const saveCustomPresets = (presets: PositionPreset[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const customOnly = presets.filter(p => !p.isDefault);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customOnly));
  } catch (e) {
    console.warn("Error saving custom presets to localStorage", e);
  }
};

// ---- curvas de animación ----------------------------------------------------
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** Rebote al llegar: 0 → 1 con dos botes que se apagan. */
const rebote = (t: number) => {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
/** Muelle: se pasa un poco y vuelve. */
const elastico = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);
/** Ruido determinista 0-1: el mismo instante da siempre lo mismo, también al exportar. */
const ruido = (x: number) => {
  const v = Math.sin(Math.floor(x) * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};

export const calculateAnimationState = (
  config: WatermarkConfig, 
  currentTime: number, 
  duration: number
): { opacity: number; scale: number; scaleX: number; offsetX: number; offsetY: number; rotation: number; typewriterRatio: number } => {
  let opacity = 1;
  let scale = 1;
  // Estirar en horizontal sin tocar el alto (efectos "estirar" y "encoger").
  let scaleX = 1;
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;
  let typewriterRatio = 1;

  const { entryEffect, entryDuration, exitEffect, exitDuration, entryDelay = 0 } = config;

  // Handle entryDelay
  if (entryDelay > 0 && currentTime < entryDelay) {
    return { opacity: 0, scale: 0, scaleX: 1, offsetX: 0, offsetY: 0, rotation: 0, typewriterRatio: 0 };
  }

  const effectiveTime = currentTime - entryDelay;

  // Entry Effect calculation
  if (entryEffect !== 'none' && entryDuration > 0 && effectiveTime < entryDuration) {
    const progress = Math.min(1, Math.max(0, effectiveTime / entryDuration));
    switch (entryEffect) {
      case 'fade':
        opacity = progress;
        break;
      case 'slide-down':
        offsetY = -40 * (1 - progress);
        opacity = progress;
        break;
      case 'slide-up':
        offsetY = 40 * (1 - progress);
        opacity = progress;
        break;
      case 'slide-left':
        offsetX = 40 * (1 - progress);
        opacity = progress;
        break;
      case 'slide-right':
        offsetX = -40 * (1 - progress);
        opacity = progress;
        break;
      case 'zoom':
        scale = 0.2 + 0.8 * progress;
        opacity = progress;
        break;
      case 'bounce':
        scale = Math.max(0, 1 + Math.sin(progress * Math.PI * 2.5) * 0.3 * (1 - progress));
        opacity = Math.min(1, progress * 1.5);
        break;
      case 'rotate-in':
        scale = 0.2 + 0.8 * progress;
        rotation = (1 - progress) * (Math.PI / 4);
        opacity = progress;
        break;
      case 'pop-in':
        scale = progress < 0.7 ? (progress / 0.7) * 1.25 : 1.25 - ((progress - 0.7) / 0.3) * 0.25;
        opacity = Math.min(1, progress * 1.5);
        break;
      case 'flip-x':
        scale = 0.3 + 0.7 * progress;
        offsetY = -20 * (1 - progress);
        opacity = progress;
        break;
      case 'typewriter':
        typewriterRatio = progress;
        opacity = progress > 0 ? 1 : 0;
        break;
      case 'drop': {
        // Cae desde arriba y rebota dos veces al tocar su sitio.
        const b = rebote(progress);
        offsetY = -90 * (1 - b);
        opacity = Math.min(1, progress * 3);
        break;
      }
      case 'spin':
        rotation = (1 - easeOut(progress)) * Math.PI * 2;
        scale = 0.3 + 0.7 * easeOut(progress);
        opacity = Math.min(1, progress * 2);
        break;
      case 'stretch':
        scaleX = elastico(progress);
        opacity = Math.min(1, progress * 3);
        break;
      case 'glitch': {
        // Aparece a trompicones: saltos laterales y parpadeo que se calman.
        const fuerza = 1 - progress;
        offsetX = (ruido(currentTime * 30) - 0.5) * 50 * fuerza;
        offsetY = (ruido(currentTime * 30 + 7) - 0.5) * 12 * fuerza;
        opacity = progress > 0.85 ? 1 : ruido(currentTime * 40 + 3) > 0.35 ? 1 : 0.15;
        break;
      }
    }
  }

  // Exit Effect calculation
  if (exitEffect !== 'none' && exitDuration > 0 && duration > 0 && currentTime > (duration - exitDuration)) {
    const remaining = Math.max(0, duration - currentTime);
    const progress = Math.min(1, Math.max(0, remaining / exitDuration)); // 1 -> 0 as it exits
    switch (exitEffect) {
      case 'fade':
        opacity = Math.min(opacity, progress);
        break;
      case 'slide-down':
        offsetY += 40 * (1 - progress);
        opacity = Math.min(opacity, progress);
        break;
      case 'slide-up':
        offsetY -= 40 * (1 - progress);
        opacity = Math.min(opacity, progress);
        break;
      case 'slide-left':
        offsetX -= 40 * (1 - progress);
        opacity = Math.min(opacity, progress);
        break;
      case 'slide-right':
        offsetX += 40 * (1 - progress);
        opacity = Math.min(opacity, progress);
        break;
      case 'zoom':
        scale *= (0.2 + 0.8 * progress);
        opacity = Math.min(opacity, progress);
        break;
      case 'rotate-out':
        scale *= (0.2 + 0.8 * progress);
        rotation -= (1 - progress) * (Math.PI / 4);
        opacity = Math.min(opacity, progress);
        break;
      case 'pop-out':
        scale *= Math.max(0, progress * 1.15);
        opacity = Math.min(opacity, progress);
        break;
      case 'drop': {
        // Se cae: acelera hacia abajo como si lo soltaran.
        const q = 1 - progress;
        offsetY += 160 * q * q;
        opacity = Math.min(opacity, Math.min(1, progress * 2.5));
        break;
      }
      case 'spin':
        rotation -= (1 - progress) * Math.PI * 2;
        scale *= 0.2 + 0.8 * progress;
        opacity = Math.min(opacity, progress);
        break;
      case 'shrink':
        scaleX *= progress;
        opacity = Math.min(opacity, Math.min(1, progress * 3));
        break;
      case 'glitch': {
        const fuerza = 1 - progress;
        offsetX += (ruido(currentTime * 30) - 0.5) * 50 * fuerza;
        opacity = Math.min(opacity, progress < 0.15 ? 0 : ruido(currentTime * 40 + 3) > 0.35 * fuerza ? progress : 0.1);
        break;
      }
    }
  }

  // Movimiento continuo mientras se ve: se suma a lo de entrada y salida.
  switch (config.loopEffect) {
    case 'pulse':
      scale *= 1 + 0.06 * Math.sin(currentTime * Math.PI * 2 * 0.8);
      break;
    case 'heartbeat': {
      // Dos latidos seguidos y una pausa, como un corazón.
      const f = currentTime % 1.2;
      const golpe = (c: number) => Math.max(0, 1 - Math.abs(f - c) / 0.09);
      scale *= 1 + 0.1 * Math.max(golpe(0.1), golpe(0.32));
      break;
    }
    case 'float':
      offsetY += 6 * Math.sin(currentTime * Math.PI * 2 * 0.5);
      break;
    case 'shake':
      // Tiembla un momento cada tres segundos; temblar siempre cansa.
      if (currentTime % 3 < 0.45) {
        offsetX += Math.sin(currentTime * 70) * 5;
        rotation += Math.sin(currentTime * 55) * 0.03;
      }
      break;
    case 'swing':
      rotation += Math.sin(currentTime * Math.PI * 2 * 0.6) * 0.07;
      break;
    case 'flicker':
      // Parpadeo de neón: casi siempre encendido, a veces se apaga un instante.
      if (ruido(Math.floor(currentTime * 12)) > 0.9) opacity *= 0.35;
      break;
  }

  return { opacity, scale, scaleX, offsetX, offsetY, rotation, typewriterRatio };
};

/** El texto final del cartel: plantilla con el nombre y mayúsculas aplicadas. */
export const formatWatermarkText = (config: WatermarkConfig, channelName: string): string => {
  // split/join y no replace: replace con cadena solo cambia la primera, y
  // "{channel} · twitch.tv/{channel}" dejaba la segunda tal cual en el vídeo.
  let text = config.template.split(CHANNEL_TOKEN).join(channelName);
  if (config.textTransform === 'uppercase') text = text.toUpperCase();
  else if (config.textTransform === 'lowercase') text = text.toLowerCase();
  else if (config.textTransform === 'capitalize') {
    // \b\w solo ve ASCII: "élite" salía "éLite". Se sube la primera letra de
    // cada palabra separada por espacios, sea del alfabeto que sea.
    text = text.replace(/(^|\s)(\S)/gu, (_m, sep: string, c: string) => sep + c.toUpperCase());
  }
  return text;
};

export const drawWatermarkOnCanvas = (
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  channelName: string,
  width: number,
  height: number,
  currentTime: number = 0,
  duration: number = 0
) => {
  let text = formatWatermarkText(config, channelName);
  if (!text.trim()) return;

  // Calculate Position Coordinates
  let x = (config.customX / 100) * width;
  let y = (config.customY / 100) * height;

  // Animation values
  const { opacity, scale, scaleX, offsetX, offsetY, rotation, typewriterRatio } = calculateAnimationState(config, currentTime, duration);

  if (opacity <= 0.01) return;

  if (typewriterRatio < 1 && config.entryEffect === 'typewriter') {
    const visibleLen = Math.max(1, Math.round(text.length * typewriterRatio));
    text = text.substring(0, visibleLen);
  }

  ctx.save();
  ctx.globalAlpha = opacity;

  // Font setup
  const fontSize = Math.max(12, Math.round((config.fontSize / 720) * height)); // responsive font size
  const fontCss = getFontCss(config.fontFamily);
  
  const styleStr = config.fontStyle === 'italic' ? 'italic ' : '';
  const weightStr = config.fontWeight === '900' ? '900 ' : config.fontWeight === 'normal' ? 'normal ' : 'bold ';
  
  ctx.font = `${styleStr}${weightStr}${fontSize}px ${fontCss}`;

  // Letter Spacing if supported
  if (config.letterSpacing && config.letterSpacing > 0 && 'letterSpacing' in ctx) {
    const spacingPx = Math.round((config.letterSpacing / 720) * height);
    (ctx as any).letterSpacing = `${spacingPx}px`;
  }

  const paddingX = Math.round((config.paddingX / 720) * height);
  const paddingY = Math.round((config.paddingY / 720) * height);
  const iconSize = config.showIcon ? Math.round(fontSize * 1.1) : 0;
  const iconGap = config.showIcon ? Math.round(fontSize * 0.4) : 0;

  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  const boxWidth = textWidth + paddingX * 2 + (config.showIcon ? iconSize + iconGap : 0);
  const boxHeight = textHeight + paddingY * 2;

  // Adjust anchor alignment based on percentage so it doesn't overflow edge
  let anchorX = 0;
  if (config.customX > 70) anchorX = -boxWidth;
  else if (config.customX > 30) anchorX = -boxWidth / 2;

  let anchorY = 0;
  if (config.customY > 70) anchorY = -boxHeight;
  else if (config.customY > 30) anchorY = -boxHeight / 2;

  // Los desplazamientos de la animación están pensados para 720p: escalados
  // con el alto, el recorrido se ve igual en un clip de 360p que en uno 1080p.
  const escalaAnim = height / 720;
  const finalX = x + anchorX + offsetX * escalaAnim;
  const finalY = y + anchorY + offsetY * escalaAnim;

  ctx.translate(finalX + boxWidth / 2, finalY + boxHeight / 2);
  if (scale !== 1 || scaleX !== 1) ctx.scale(scale * scaleX, scale);
  if (rotation !== 0) ctx.rotate(rotation);
  ctx.translate(-(finalX + boxWidth / 2), -(finalY + boxHeight / 2));

  // Background Box & Border
  if (config.bgOpacity > 0 || config.boxBorder) {
    ctx.save();
    const radius = Math.min(config.borderRadius * (height / 720), Math.min(boxWidth, boxHeight) / 2);
    ctx.beginPath();
    ctx.roundRect(finalX, finalY, boxWidth, boxHeight, radius);

    if (config.bgOpacity > 0) {
      ctx.globalAlpha = opacity * config.bgOpacity;
      ctx.fillStyle = config.bgColor;
      ctx.fill();
    }

    if (config.boxBorder && config.boxBorderWidth && config.boxBorderWidth > 0) {
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = config.boxBorderColor || '#ffffff';
      ctx.lineWidth = Math.max(1, Math.round((config.boxBorderWidth / 720) * height));
      ctx.stroke();
    }
    ctx.restore();
  }

  // Advanced Shadow & Glow
  if (config.shadow) {
    ctx.shadowColor = config.shadowColor || 'rgba(0, 0, 0, 0.7)';
    if (config.glowMode) {
      ctx.shadowBlur = Math.round(((config.shadowBlur || 15) / 720) * height);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.shadowBlur = Math.round(((config.shadowBlur ?? 8) / 720) * height);
      ctx.shadowOffsetX = Math.round(((config.shadowOffsetX ?? 2) / 720) * height);
      ctx.shadowOffsetY = Math.round(((config.shadowOffsetY ?? 2) / 720) * height);
    }
  }

  // Optional Twitch Glitch Icon
  let currentX = finalX + paddingX;
  if (config.showIcon) {
    ctx.save();
    const iconY = finalY + (boxHeight - iconSize) / 2;
    ctx.fillStyle = config.textColor;
    ctx.beginPath();
    const s = iconSize / 24;
    const ix = currentX;
    const iy = iconY;
    // Twitch SVG path
    ctx.moveTo(ix + 4.5 * s, iy + 2 * s);
    ctx.lineTo(ix + 2 * s, iy + 4.5 * s);
    ctx.lineTo(ix + 2 * s, iy + 19.5 * s);
    ctx.lineTo(ix + 7 * s, iy + 19.5 * s);
    ctx.lineTo(ix + 7 * s, iy + 22.5 * s);
    ctx.lineTo(ix + 10 * s, iy + 19.5 * s);
    ctx.lineTo(ix + 13.5 * s, iy + 19.5 * s);
    ctx.lineTo(ix + 22 * s, iy + 11 * s);
    ctx.lineTo(ix + 22 * s, iy + 2 * s);
    ctx.closePath();
    ctx.fill();

    // Inner eyes
    ctx.fillStyle = config.bgColor || '#9146FF';
    ctx.fillRect(ix + 11.5 * s, iy + 6.5 * s, 2 * s, 6 * s);
    ctx.fillRect(ix + 16.5 * s, iy + 6.5 * s, 2 * s, 6 * s);
    ctx.restore();

    currentX += iconSize + iconGap;
  }

  ctx.textBaseline = 'middle';
  const tx = currentX;
  const ty = finalY + boxHeight / 2 + 1;
  const efecto = config.textEffect || 'none';
  const colorEfecto = config.effectColor || '#9146FF';

  // ---- Efectos del texto que van por DEBAJO del relleno ----
  if (efecto === 'extrude') {
    // Relieve 3D: copias desplazadas en diagonal, sin sombra cada una.
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = colorEfecto;
    const capas = Math.max(3, Math.round(fontSize * 0.14));
    for (let i = capas; i >= 1; i -= 1) ctx.fillText(text, tx + i, ty + i);
    ctx.restore();
  } else if (efecto === 'double') {
    // Contorno doble: uno ancho de color por fuera, uno fino oscuro dentro.
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colorEfecto;
    ctx.lineWidth = Math.max(3, fontSize * 0.3);
    ctx.strokeText(text, tx, ty);
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = config.strokeColor || '#000000';
    ctx.lineWidth = Math.max(2, fontSize * 0.14);
    ctx.strokeText(text, tx, ty);
    ctx.restore();
  } else if (efecto === 'glitch') {
    // Separación de color RGB que tiembla con el tiempo.
    ctx.save();
    ctx.shadowColor = 'transparent';
    const d = Math.max(1.5, fontSize * 0.06) * (1 + 0.8 * (ruido(currentTime * 14) - 0.5));
    ctx.globalAlpha *= 0.85;
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(text, tx - d, ty);
    ctx.fillStyle = '#ff0050';
    ctx.fillText(text, tx + d, ty);
    ctx.restore();
  } else if (efecto === 'underline') {
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = colorEfecto;
    const grosor = Math.max(2, fontSize * 0.13);
    ctx.fillRect(tx, ty + fontSize * 0.5, ctx.measureText(text).width, grosor);
    ctx.restore();
  }

  // Text Stroke / Contorno
  if (config.stroke && config.strokeWidth && config.strokeWidth > 0) {
    ctx.save();
    ctx.strokeStyle = config.strokeColor || '#000000';
    ctx.lineWidth = Math.max(1, Math.round((config.strokeWidth / 720) * height));
    ctx.lineJoin = config.strokeJoin || 'round';
    ctx.strokeText(text, currentX, finalY + boxHeight / 2 + 1);
    ctx.restore();
  }

  // Text Fill
  if (efecto === 'gradient') {
    const g = ctx.createLinearGradient(0, ty - fontSize / 2, 0, ty + fontSize / 2);
    g.addColorStop(0, config.textColor);
    g.addColorStop(1, colorEfecto);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = config.textColor;
  }
  if (efecto === 'extrude' || efecto === 'double' || efecto === 'glitch') ctx.shadowColor = 'transparent';
  ctx.fillText(text, tx, ty);

  ctx.restore();
};

/**
 * Process a video blob by rendering it onto an HTML canvas frame-by-frame 
 * with the watermark overlay applied, and recording it into a new Blob.
 */
export interface WatermarkRenderProgress {
  /** Porcentaje 0-100. */
  pct: number;
  /** Segundos del clip ya grabados. */
  elapsed: number;
  /** Duración total del clip, en segundos. */
  total: number;
}

/**
 * Graba el clip con la marca de agua incrustada.
 *
 * VA A VELOCIDAD REAL y no hay atajo: canvas.captureStream() muestrea a ritmo
 * de reloj de pared, así que acelerar el vídeo no acelera el render — sólo
 * comprime el contenido en menos tiempo, y el archivo resultante se reproduce
 * a esa misma velocidad de más, con el audio agudo. Un clip de 60 s tarda 60 s.
 * Por eso `onProgress` informa también de los segundos, para poder enseñar
 * cuánto queda de verdad en vez de una barra sin referencia.
 */
export const processVideoWithWatermark = async (
  originalBlob: Blob,
  channelName: string,
  config: WatermarkConfig,
  onProgress?: (p: WatermarkRenderProgress) => void,
  signal?: AbortSignal
): Promise<Blob> => {
  await ensureWatermarkFont(config);
  return new Promise<Blob>((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(originalBlob);
    video.crossOrigin = 'anonymous';
    video.src = objectUrl;
    // Arranca en silencio para que la política de autorreproducción nunca sea
    // un problema; si el audio consigue enrutarse al grabador se desactiva
    // más abajo, porque `muted` silencia también esa rama.
    video.muted = true;
    video.playsInline = true;

    let audioCtx: AudioContext | null = null;
    let recorder: MediaRecorder | null = null;
    let finished = false;
    let cancelado = false;
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;
    let dibujoId: ReturnType<typeof setInterval> | undefined;
    let alAvanzar: (() => void) | null = null;
    let pausadoFuera = false;

    const limpiar = () => {
      clearTimeout(safetyTimer);
      if (dibujoId !== undefined) clearInterval(dibujoId);
      video.removeEventListener('ended', alTerminar);
      if (alAvanzar) video.removeEventListener('timeupdate', alAvanzar);
      signal?.removeEventListener('abort', alCancelar);
      try { video.pause(); } catch { /* ya parado */ }
      URL.revokeObjectURL(objectUrl);
      if (audioCtx) audioCtx.close().catch(() => { /* ya cerrado */ });
    };

    const alTerminar = () => {
      if (finished) return;
      finished = true;
      clearTimeout(safetyTimer);
      if (dibujoId !== undefined) clearInterval(dibujoId);
      video.removeEventListener('ended', alTerminar);
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch { /* ya parando */ }
      } else {
        limpiar();
        reject(new Error('El grabador nunca llegó a arrancar'));
      }
    };

    const alCancelar = () => {
      if (finished) return;
      cancelado = true;
      finished = true;
      if (recorder && recorder.state !== 'inactive') {
        // Se para el grabador igualmente para soltar el encoder; el onstop
        // verá `cancelado` y rechazará en vez de devolver un vídeo a medias.
        try { recorder.stop(); } catch { /* ya parando */ }
      } else {
        limpiar();
        reject(new DOMException('Render cancelado', 'AbortError'));
      }
    };

    if (signal?.aborted) {
      URL.revokeObjectURL(objectUrl);
      reject(new DOMException('Render cancelado', 'AbortError'));
      return;
    }
    signal?.addEventListener('abort', alCancelar);

    video.onloadedmetadata = async () => {
      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        const duration = video.duration || 10;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          limpiar();
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        // captureStream(0) NO muestrea por su cuenta: entrega un fotograma sólo
        // cuando se le pide con requestFrame(). Así el vídeo deja de depender de
        // que el compositor del navegador esté pintando, que es justo lo que se
        // para en una pestaña de fondo. Si el navegador no lo soporta se vuelve
        // al muestreo automático a 60 fps.
        let canvasStream: MediaStream;
        let pistaManual: any = null;
        try {
          canvasStream = canvas.captureStream(0);
          const [pista] = canvasStream.getVideoTracks();
          if (pista && typeof (pista as any).requestFrame === 'function') {
            pistaManual = pista;
          } else {
            canvasStream = canvas.captureStream(60);
          }
        } catch {
          canvasStream = canvas.captureStream(60);
        }

        // El audio del original se desvía al grabador. createMediaElementSource
        // saca el sonido del elemento y lo mete en el grafo, así que al no
        // conectarlo a audioCtx.destination no se oye nada por los altavoces
        // pero sí llega al archivo. Y hay que quitar `muted`: un elemento
        // silenciado alimenta silencio al grafo, y el vídeo salía mudo.
        try {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioCtx.createMediaElementSource(video);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          dest.stream.getAudioTracks().forEach((track: MediaStreamTrack) => canvasStream.addTrack(track));
          video.muted = false;
          video.volume = 1;
        } catch (e) {
          console.warn('No se pudo llevar el audio al grabador; el vídeo saldrá mudo', e);
        }

        let mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

        recorder = new MediaRecorder(canvasStream, {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: 15000000,
          audioBitsPerSecond: 192000,
        });
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const tipo = recorder?.mimeType || 'video/mp4';
          limpiar();
          if (cancelado) {
            reject(new DOMException('Render cancelado', 'AbortError'));
            return;
          }
          if (pausadoFuera) {
            reject(new Error('BACKGROUND_PAUSE'));
            return;
          }
          resolve(new Blob(chunks, { type: tipo }));
        };

        recorder.onerror = (err) => {
          limpiar();
          reject(err);
        };

        // Parar sólo desde el bucle de dibujo era el fallo antiguo: el navegador
        // frena requestAnimationFrame (a veces del todo) cuando la pestaña no
        // pinta — en segundo plano, minimizada o en ahorro de energía— así que
        // el vídeo acababa y nadie llamaba a stop(). `ended` y `timeupdate` los
        // mueve el reloj del medio, no el pintado, así que siguen llegando.
        video.addEventListener('ended', alTerminar);
        // Con nombre y con guarda de `finished` a propósito. Antes era una
        // función anónima que nadie quitaba: tras cancelar seguía llegando un
        // `timeupdate` DESPUÉS de que la promesa se hubiera rechazado, volvía a
        // poner la interfaz en "renderizando" y ahí se quedaba clavada para
        // siempre, sin error y sin forma de salir.
        alAvanzar = () => {
          if (finished || !onProgress || duration <= 0) return;
          onProgress({
            pct: Math.min(100, Math.round((video.currentTime / duration) * 100)),
            elapsed: video.currentTime,
            total: duration,
          });
        };
        video.addEventListener('timeupdate', alAvanzar);

        recorder.start(100);

        video.playbackRate = 1.0;
        video.currentTime = 0;
        await video.play();

        // Red de seguridad: la duración real más holgura de codificación.
        safetyTimer = setTimeout(alTerminar, duration * 1000 + 10000);

        // El dibujo lo mueve setInterval, NUNCA requestAnimationFrame. Medido en
        // este mismo navegador con la pestaña en segundo plano: rAF cae a 0 fps
        // y requestVideoFrameCallback también, mientras setInterval sigue a 57
        // fps porque el audio del clip mantiene la pestaña sin estrangular. Con
        // rAF el canvas dejaba de actualizarse y el archivo salía casi negro y a
        // 0,4 Mbps en vez de los 15 pedidos — sin ningún error, sólo un vídeo
        // roto. La otra función de este servicio ya usaba setInterval por esto.
        dibujoId = setInterval(() => {
          if (finished) return;
          if (video.ended) { alTerminar(); return; }
          if (video.paused) {
            // Con el audio enrutado esto no debería pasar. Si pasa, el navegador
            // ha parado el vídeo por ahorro de energía: mejor decirlo que
            // entregar un archivo cortado que parece bueno.
            pausadoFuera = true;
            alTerminar();
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);
          drawWatermarkOnCanvas(ctx, config, channelName, width, height, video.currentTime, duration);
          if (pistaManual) pistaManual.requestFrame();
        }, 1000 / 60);
      } catch (err) {
        limpiar();
        reject(err);
      }
    };

    video.onerror = () => {
      limpiar();
      reject(new Error('No se pudo cargar el vídeo para incrustar la marca de agua'));
    };
  });
};

export interface OverlaySegment {
  channelName: string;
  duration: number; // seconds
}

/**
 * Renders just the animated name badge — no clip footage — onto a
 * transparent WebM (VP9 preserves real alpha in Chromium, verified: a
 * canvas cleared to transparent and recorded via captureStream() plays back
 * with the background genuinely see-through, not composited onto black).
 * Meant to be dropped into a video editor as a name-overlay layer, kept
 * separate from the original clip.
 *
 * Accepts multiple segments so the same renderer covers both the
 * single-clip export (one segment) and the "all clips back-to-back" export
 * (one segment per clip, concatenated in one continuous timeline).
 *
 * Resolution is capped at 800x450 by default: measured directly in this
 * Chromium build, canvas.captureStream() + MediaRecorder(vp9) keeps real
 * alpha up to ~850x478 but silently composites onto opaque black at 854x480
 * and above — there is no error or fallback signal, the file just quietly
 * stops being transparent. 800x450 stays safely under that cliff while
 * still being plenty sharp for a text/logo overlay layer.
 */
export const renderTextOverlayVideo = async (
  segments: OverlaySegment[],
  config: WatermarkConfig,
  width = 800,
  height = 450,
  onProgress?: (loaded: number, total: number) => void
): Promise<Blob> => {
  return new Promise<Blob>((resolve, reject) => {
    const totalDuration = segments.reduce((sum, s) => sum + Math.max(0, s.duration), 0);
    if (totalDuration <= 0 || segments.length === 0) {
      reject(new Error("Nothing to render"));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const canvasStream = canvas.captureStream(30);

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

    const recorder = new MediaRecorder(canvasStream, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: 6000000,
    });
    const chunks: BlobPart[] = [];
    let finished = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;

    // Driven entirely by setInterval, never requestAnimationFrame: there is
    // no source <video> here to supply an unthrottled media clock, and rAF
    // alone can be throttled to zero in a backgrounded/hidden tab, which
    // would hang this forever. setInterval keeps firing (throttled to a
    // minimum of roughly once a second when hidden, but never fully
    // stopped), so this always finishes in bounded time.
    const finishRecording = () => {
      if (finished) return;
      finished = true;
      if (intervalId !== undefined) clearInterval(intervalId);
      if (safetyTimer !== undefined) clearTimeout(safetyTimer);
      if (recorder.state !== 'inactive') {
        try { recorder.stop(); } catch { /* already stopping */ }
      }
    };

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
    };
    recorder.onerror = (err) => reject(err);

    recorder.start(100);
    const startTime = performance.now();

    intervalId = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= totalDuration) {
        finishRecording();
        return;
      }

      // Locate which clip segment this point on the combined timeline
      // belongs to, and how far into that segment we are.
      let acc = 0;
      let seg = segments[0];
      let segTime = elapsed;
      for (const s of segments) {
        if (elapsed < acc + s.duration) {
          seg = s;
          segTime = elapsed - acc;
          break;
        }
        acc += s.duration;
      }

      ctx.clearRect(0, 0, width, height);
      drawWatermarkOnCanvas(ctx, config, seg.channelName, width, height, segTime, seg.duration);

      if (onProgress) {
        onProgress(Math.min(100, Math.round((elapsed / totalDuration) * 100)), 100);
      }
    }, 1000 / 30);

    safetyTimer = setTimeout(finishRecording, totalDuration * 1000 + 10000);
  });
};

// ---------------------------------------------------------------------------
// Exportar un clip con la marca incrustada
// ---------------------------------------------------------------------------

export const QUALITY_STORAGE_KEY = 'twitchbolt_quality';

/** Calidad elegida en la barra de resultados, para no volver a ponerla cada vez. */
export const loadStoredQuality = (fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  try {
    return localStorage.getItem(QUALITY_STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
};

export const saveStoredQuality = (quality: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUALITY_STORAGE_KEY, quality);
  } catch {
    /* almacenamiento lleno o bloqueado: la sesión sigue, sólo no se recuerda */
  }
};

export const WATERMARK_ALL_STORAGE_KEY = 'twitchbolt_watermark_all';

/**
 * Si la marca de agua va puesta en la descarga en lote. Se recuerda porque es
 * una decisión de las que se toman una vez ("mis clips llevan mi marca") y no
 * una por cada tanda de enlaces que se pega.
 */
export const loadStoredWatermarkAll = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(WATERMARK_ALL_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveStoredWatermarkAll = (activa: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WATERMARK_ALL_STORAGE_KEY, activa ? '1' : '0');
  } catch {
    /* almacenamiento lleno o bloqueado: la sesión sigue, sólo no se recuerda */
  }
};

/**
 * Nombre de archivo a partir del título del clip.
 *
 * Cambiar a la brava todo lo que no sea a-z0-9 por un guión bajo dejaba cosas
 * como `1___________________1080p.mp4`: un título en japonés, en cirílico o con
 * emojis se convertía en una hilera de guiones. Aquí se quitan las tildes (la
 * letra se queda), se junta cada tramo de caracteres raros en UN guión, y se va
 * probando cada candidato hasta que uno deje algo legible: título, canal y, de
 * último recurso, el identificador del clip, que siempre es ASCII y único.
 */
export const nombreDeArchivo = (...candidatos: (string | undefined)[]): string => {
  const limpiar = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()
      .slice(0, 60)
      .replace(/_+$/, '');
  for (const candidato of candidatos) {
    const limpio = limpiar(candidato || '');
    if (limpio) return limpio;
  }
  return 'clip';
};
