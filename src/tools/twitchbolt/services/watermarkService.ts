// ============================================================================
// CÓDIGO DORMIDO — NO ESTÁ CONECTADO A LA INTERFAZ (revisado 2026-08-31)
// ----------------------------------------------------------------------------
// Este editor de marca de agua está terminado pero NO lo importa nadie: no hay
// ningún botón en TwitchBolt que lo abra, así que ningún usuario puede llegar a
// él y no entra en el bundle publicado. Último trabajo real: 2026-07-28.
//
// No es un descuido pendiente de arreglar: Adrián decidió el 2026-08-31 dejarlo
// dormido a propósito, ni conectarlo ni borrarlo.
//
// Si algún día se conecta, quedan dos deudas conocidas antes de enseñarlo:
//   1. Los ~26 textos de la interfaz son ternarios `lang === 'es' ? … : …`, o
//      sea que los otros siete idiomas verían inglés. Necesita el diccionario.
//   2. El prop `lang` tiene DEFAULT 'es': sin idioma explícito sale en español.
//   3. processVideoWithWatermark() graba con MediaRecorder sobre un canvas, o
//      sea A VELOCIDAD REAL: un clip de 60 s tarda 60 s en procesarse. Antes de
//      publicarlo hay que avisarlo en pantalla o pasar el encoder a WebCodecs.
// ============================================================================

import { WatermarkConfig, PositionPreset, FontFamily } from '../types';

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

export const getFontCss = (fontFamily: FontFamily): string => {
  switch (fontFamily) {
    case 'montserrat': return "'Montserrat', sans-serif";
    case 'impact': return "'Impact', 'Arial Black', sans-serif";
    case 'bebas': return "'Bebas Neue', 'Impact', sans-serif";
    case 'orbitron': return "'Orbitron', system-ui, sans-serif";
    case 'righteous': return "'Righteous', cursive, sans-serif";
    case 'pixel': return "'Press Start 2P', monospace";
    case 'mono': return "'Courier New', Courier, monospace";
    case 'serif': return "Georgia, serif";
    case 'handwriting': return "'Permanent Marker', 'Caveat', cursive";
    case 'sans':
    default: return "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
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

export const calculateAnimationState = (
  config: WatermarkConfig, 
  currentTime: number, 
  duration: number
): { opacity: number; scale: number; offsetX: number; offsetY: number; rotation: number; typewriterRatio: number } => {
  let opacity = 1;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;
  let typewriterRatio = 1;

  const { entryEffect, entryDuration, exitEffect, exitDuration, entryDelay = 0 } = config;

  // Handle entryDelay
  if (entryDelay > 0 && currentTime < entryDelay) {
    return { opacity: 0, scale: 0, offsetX: 0, offsetY: 0, rotation: 0, typewriterRatio: 0 };
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
    }
  }

  return { opacity, scale, offsetX, offsetY, rotation, typewriterRatio };
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
  let text = config.template.replace('{channel}', channelName);

  // Apply Text Transformations
  if (config.textTransform === 'uppercase') text = text.toUpperCase();
  else if (config.textTransform === 'lowercase') text = text.toLowerCase();
  else if (config.textTransform === 'capitalize') {
    text = text.replace(/\b\w/g, c => c.toUpperCase());
  }
  
  // Calculate Position Coordinates
  let x = (config.customX / 100) * width;
  let y = (config.customY / 100) * height;

  // Animation values
  const { opacity, scale, offsetX, offsetY, rotation, typewriterRatio } = calculateAnimationState(config, currentTime, duration);

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

  const finalX = x + anchorX + offsetX;
  const finalY = y + anchorY + offsetY;

  ctx.translate(finalX + boxWidth / 2, finalY + boxHeight / 2);
  if (scale !== 1) ctx.scale(scale, scale);
  if (rotation !== 0) ctx.rotate(rotation);
  ctx.translate(-(finalX + boxWidth / 2), -(finalY + boxHeight / 2));

  // Background Box & Border
  if (config.bgOpacity > 0 || config.boxBorder) {
    ctx.save();
    const radius = Math.min(config.borderRadius, Math.min(boxWidth, boxHeight) / 2);
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

  // Text Stroke / Contorno
  ctx.textBaseline = 'middle';
  if (config.stroke && config.strokeWidth && config.strokeWidth > 0) {
    ctx.save();
    ctx.strokeStyle = config.strokeColor || '#000000';
    ctx.lineWidth = Math.max(1, Math.round((config.strokeWidth / 720) * height));
    ctx.lineJoin = 'round';
    ctx.strokeText(text, currentX, finalY + boxHeight / 2 + 1);
    ctx.restore();
  }

  // Text Fill
  ctx.fillStyle = config.textColor;
  ctx.fillText(text, currentX, finalY + boxHeight / 2 + 1);

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
