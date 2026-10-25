// ============================================================================
// Animaciones listas para poner encima del vídeo ("suscríbete" y compañía)
// ----------------------------------------------------------------------------
// Son capas: van por encima de los clips, en su propia fila de la línea de
// tiempo, con un inicio y una duración en segundos del vídeo final. Se pintan
// a mano en un canvas (sin vídeos de pantalla verde que bajar ni licencias),
// la MISMA función para el visor del editor y para exportar, así lo que se ve
// es lo que sale.
//
// Todo se mide en "u": una unidad a 760 px de alto (o sea, algo más grande que
// a 1080), multiplicada por la escala de la capa. El texto va en el idioma del VÍDEO (no en el de la
// página): por defecto inglés, que es lo que más se usa en YouTube.
//
// La posición es la de la marca de agua (watermarkService): 0 % pegado al
// borde, 100 % pegado al de enfrente, 50 % centrado.
// ============================================================================

export type PlantillaId = 'suscribir' | 'combo' | 'banner' | 'minimo' | 'final' | 'twitch' | 'campana' | 'comentario';
export type IdiomaAnim = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'ja' | 'zh' | 'hi';

export interface Capa {
  id: string;
  plantilla: PlantillaId;
  idioma: IdiomaAnim;
  /** Segundo del vídeo final en que aparece. */
  inicio: number;
  /** Cuánto se ve, en segundos. */
  dur: number;
  /** Posición en % (como la marca de agua). */
  x: number;
  y: number;
  /** 1 = tamaño de serie. */
  escala: number;
  /** Nombre del canal, para las que lo enseñan. */
  canal: string;
}

export const IDIOMAS_ANIM: { id: IdiomaAnim; nombre: string }[] = [
  { id: 'en', nombre: 'English' },
  { id: 'es', nombre: 'Español' },
  { id: 'pt', nombre: 'Português' },
  { id: 'fr', nombre: 'Français' },
  { id: 'de', nombre: 'Deutsch' },
  { id: 'it', nombre: 'Italiano' },
  { id: 'ru', nombre: 'Русский' },
  { id: 'ja', nombre: '日本語' },
  { id: 'zh', nombre: '中文' },
  { id: 'hi', nombre: 'हिन्दी' },
];

interface Textos {
  sub: string; subbed: string; like: string; bell: string; noOlvides: string;
  gracias: string; follow: string; following: string; comenta: string;
}

/** Lo que dice cada animación, como lo dicen YouTube y Twitch en cada idioma. */
const TEXTOS: Record<IdiomaAnim, Textos> = {
  en: { sub: 'SUBSCRIBE', subbed: 'SUBSCRIBED', like: 'Like', bell: 'Turn on notifications', noOlvides: "Don't forget to subscribe!", gracias: 'Thanks for watching!', follow: 'Follow', following: 'Following', comenta: 'Leave a comment' },
  es: { sub: 'SUSCRIBIRSE', subbed: 'SUSCRITO', like: 'Me gusta', bell: 'Activa las notificaciones', noOlvides: '¡No olvides suscribirte!', gracias: '¡Gracias por ver!', follow: 'Seguir', following: 'Siguiendo', comenta: 'Deja un comentario' },
  pt: { sub: 'INSCREVER-SE', subbed: 'INSCRITO', like: 'Gostei', bell: 'Ative as notificações', noOlvides: 'Não esqueça de se inscrever!', gracias: 'Obrigado por assistir!', follow: 'Seguir', following: 'Seguindo', comenta: 'Deixe um comentário' },
  fr: { sub: "S'ABONNER", subbed: 'ABONNÉ', like: "J'aime", bell: 'Activez les notifications', noOlvides: "N'oubliez pas de vous abonner !", gracias: "Merci d'avoir regardé !", follow: 'Suivre', following: 'Suivi', comenta: 'Laissez un commentaire' },
  de: { sub: 'ABONNIEREN', subbed: 'ABONNIERT', like: 'Mag ich', bell: 'Glocke aktivieren', noOlvides: 'Vergiss nicht zu abonnieren!', gracias: 'Danke fürs Zuschauen!', follow: 'Folgen', following: 'Gefolgt', comenta: 'Schreib einen Kommentar' },
  it: { sub: 'ISCRIVITI', subbed: 'ISCRITTO', like: 'Mi piace', bell: 'Attiva le notifiche', noOlvides: 'Non dimenticare di iscriverti!', gracias: 'Grazie per la visione!', follow: 'Segui', following: 'Segui già', comenta: 'Lascia un commento' },
  ru: { sub: 'ПОДПИСАТЬСЯ', subbed: 'ВЫ ПОДПИСАНЫ', like: 'Нравится', bell: 'Включите уведомления', noOlvides: 'Не забудьте подписаться!', gracias: 'Спасибо за просмотр!', follow: 'Отслеживать', following: 'Отслеживается', comenta: 'Оставьте комментарий' },
  ja: { sub: 'チャンネル登録', subbed: '登録済み', like: '高評価', bell: '通知をオンにしてね', noOlvides: 'チャンネル登録お願いします！', gracias: 'ご視聴ありがとうございました！', follow: 'フォロー', following: 'フォロー中', comenta: 'コメントしてね' },
  zh: { sub: '订阅', subbed: '已订阅', like: '赞', bell: '打开通知', noOlvides: '别忘了订阅！', gracias: '感谢观看！', follow: '关注', following: '已关注', comenta: '留下评论' },
  hi: { sub: 'सब्सक्राइब करें', subbed: 'सब्सक्राइब किया', like: 'पसंद', bell: 'नोटिफ़िकेशन चालू करें', noOlvides: 'सब्सक्राइब करना न भूलें!', gracias: 'देखने के लिए धन्यवाद!', follow: 'फ़ॉलो करें', following: 'फ़ॉलो कर रहे हैं', comenta: 'कमेंट करें' },
};

export interface Plantilla {
  id: PlantillaId;
  /** Duración y sitio de serie al añadirla. */
  dur: number;
  x: number;
  y: number;
  /** Ocupa toda la pantalla (la pantalla final). */
  pantalla?: boolean;
  /** Color de su bloque en la línea de tiempo. */
  color: string;
}

export const PLANTILLAS: Plantilla[] = [
  { id: 'suscribir', dur: 4, x: 50, y: 82, color: '#ff3b3b' },
  { id: 'combo', dur: 4.5, x: 50, y: 82, color: '#f97316' },
  { id: 'banner', dur: 5, x: 4, y: 88, color: '#ef4444' },
  { id: 'minimo', dur: 4, x: 96, y: 6, color: '#fb7185' },
  { id: 'final', dur: 5, x: 50, y: 50, pantalla: true, color: '#a855f7' },
  { id: 'twitch', dur: 3.5, x: 50, y: 82, color: '#9147ff' },
  { id: 'campana', dur: 4, x: 96, y: 8, color: '#eab308' },
  { id: 'comentario', dur: 4, x: 4, y: 86, color: '#22c55e' },
];

export const plantilla = (id: PlantillaId) => PLANTILLAS.find(p => p.id === id) || PLANTILLAS[0];

// ---- utilidades de dibujo ---------------------------------------------------

const FUENTE = '"Roboto", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif';
const lim = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const salida = (t: number) => 1 - Math.pow(1 - lim(t), 3);
const rebote = (t: number) => { const c = 1.70158; const x = lim(t) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
/** 0→1 entre a y b. */
const tramo = (t: number, a: number, b: number) => lim((t - a) / Math.max(0.001, b - a));

const pastilla = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = h / 2) => {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
};

const texto = (c: CanvasRenderingContext2D, s: string, x: number, y: number, tam: number, color: string, peso = 700, alin: CanvasTextAlign = 'center') => {
  c.font = `${peso} ${tam}px ${FUENTE}`;
  c.textAlign = alin;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(s, x, y);
};

const ancho = (c: CanvasRenderingContext2D, s: string, tam: number, peso = 700) => {
  c.font = `${peso} ${tam}px ${FUENTE}`;
  return c.measureText(s).width;
};

/** El logo de reproducir (rectángulo rojo con triángulo blanco). */
const logo = (c: CanvasRenderingContext2D, x: number, y: number, w: number) => {
  const h = w * 0.7;
  c.fillStyle = '#ff0000';
  pastilla(c, x, y - h / 2, w, h, h * 0.28);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.moveTo(x + w * 0.4, y - h * 0.24);
  c.lineTo(x + w * 0.4, y + h * 0.24);
  c.lineTo(x + w * 0.68, y);
  c.closePath();
  c.fill();
};

/** Campana centrada en (x, y), de alto `t`; `llena` la rellena. */
const campana = (c: CanvasRenderingContext2D, x: number, y: number, t: number, color: string, llena: boolean, giro = 0) => {
  c.save();
  c.translate(x, y - t * 0.42);
  c.rotate(giro);
  c.translate(0, t * 0.42);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = t * 0.09;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(-t * 0.36, t * 0.22);
  c.quadraticCurveTo(-t * 0.3, t * 0.12, -t * 0.3, -t * 0.02);
  c.bezierCurveTo(-t * 0.3, -t * 0.42, t * 0.3, -t * 0.42, t * 0.3, -t * 0.02);
  c.quadraticCurveTo(t * 0.3, t * 0.12, t * 0.36, t * 0.22);
  c.closePath();
  if (llena) c.fill(); else c.stroke();
  c.beginPath();
  c.arc(0, t * 0.32, t * 0.08, 0, Math.PI * 2);
  c.fill();
  c.restore();
};

/** Pulgar hacia arriba centrado en (x, y), de alto `t`. */
const pulgar = (c: CanvasRenderingContext2D, x: number, y: number, t: number, color: string, lleno: boolean) => {
  c.save();
  c.translate(x - t * 0.5, y - t * 0.5);
  c.scale(t / 24, t / 24);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 2;
  c.lineJoin = 'round';
  const p = new Path2D('M7 10v11H3V10h4zm2 11h8.5a2 2 0 0 0 2-1.6l1.3-6.5A2 2 0 0 0 18.8 10H14V5.5A2.5 2.5 0 0 0 11.5 3L9 10v11z');
  if (lleno) c.fill(p); else c.stroke(p);
  c.restore();
};

/** Corazón centrado en (x, y), de ancho `t`. */
const corazon = (c: CanvasRenderingContext2D, x: number, y: number, t: number, color: string, lleno: boolean) => {
  c.save();
  c.translate(x - t / 2, y - t / 2);
  c.scale(t / 24, t / 24);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 2.2;
  const p = new Path2D('M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 18.8 5 21 8.3 19.5 11.8 17.5 16.4 12 21 12 21z');
  if (lleno) c.fill(p); else c.stroke(p);
  c.restore();
};

/** El puntero del ratón, con la punta en (x, y); `pulsa` 0-1 dibuja la onda. */
const puntero = (c: CanvasRenderingContext2D, x: number, y: number, u: number, pulsa: number) => {
  if (pulsa > 0 && pulsa < 1) {
    c.save();
    c.globalAlpha *= 1 - pulsa;
    c.strokeStyle = '#fff';
    c.lineWidth = 4 * u;
    c.beginPath();
    c.arc(x, y, (10 + 40 * pulsa) * u, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  c.save();
  c.translate(x, y);
  c.scale(u * 2.1, u * 2.1);
  const p = new Path2D('M0 0 L0 22 L6 16.5 L10 25.5 L14 23.7 L10 14.8 L17.5 14.8 Z');
  c.fillStyle = '#fff';
  c.strokeStyle = '#000';
  c.lineWidth = 1.4;
  c.lineJoin = 'round';
  c.fill(p);
  c.stroke(p);
  c.restore();
};

/** Recorrido del puntero: de `a` a `b` entre los segundos ta y tb. */
const recorrido = (t: number, ta: number, tb: number, a: [number, number], b: [number, number]): [number, number] => {
  const e = salida(tramo(t, ta, tb));
  return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
};

// ---- las plantillas ---------------------------------------------------------
// medir: tamaño de la caja en px; pintar: dentro de esa caja (0,0)-(w,h).

interface Dibujo {
  medir: (c: CanvasRenderingContext2D, x: Textos, u: number, capa: Capa) => { w: number; h: number };
  pintar: (c: CanvasRenderingContext2D, x: Textos, u: number, t: number, dur: number, w: number, h: number, capa: Capa) => void;
}

const DIBUJOS: Record<PlantillaId, Dibujo> = {
  // El de toda la vida: botón rojo, el puntero lo pulsa, pasa a gris y suena la campana.
  suscribir: {
    medir: (c, x, u) => {
      const tw = Math.max(ancho(c, x.sub, 38 * u), ancho(c, x.subbed, 38 * u));
      return { w: tw + 76 * u + 16 * u + 84 * u, h: 84 * u };
    },
    pintar: (c, x, u, t, _d, w, h) => {
      const clic = 1.1;
      const clicCampana = 2.0;
      const hecho = t >= clic;
      const pw = w - 100 * u;
      // Entra con un pequeño rebote, desde el centro de la caja.
      const e = rebote(tramo(t, 0, 0.45));
      c.translate(w / 2, h / 2);
      c.scale(e, e);
      c.translate(-w / 2, -h / 2);
      const pulsado = 1 - 0.07 * Math.max(0, 1 - Math.abs(t - clic) / 0.12);
      c.save();
      c.translate(pw / 2, h / 2);
      c.scale(pulsado, pulsado);
      c.translate(-pw / 2, -h / 2);
      c.fillStyle = hecho ? '#e5e5e5' : '#ff0000';
      c.shadowColor = 'rgba(0,0,0,0.35)';
      c.shadowBlur = 18 * u;
      c.shadowOffsetY = 6 * u;
      pastilla(c, 0, 0, pw, h);
      c.fill();
      c.shadowColor = 'transparent';
      texto(c, hecho ? x.subbed : x.sub, pw / 2, h / 2 + 1 * u, 38 * u, hecho ? '#5f5f5f' : '#fff', 800);
      c.restore();
      // Campana
      const bx = pw + 16 * u;
      c.fillStyle = 'rgba(30,30,30,0.92)';
      pastilla(c, bx, 0, 84 * u, h, 22 * u);
      c.fill();
      const suena = t >= clicCampana ? Math.sin((t - clicCampana) * 26) * 0.45 * Math.exp(-(t - clicCampana) * 2.6) : 0;
      campana(c, bx + 42 * u, h / 2, 46 * u, '#fff', t >= clicCampana, suena);
      // Puntero: entra, pulsa el botón, va a la campana y la pulsa.
      const inicio: [number, number] = [w + 60 * u, h + 120 * u];
      const enBoton: [number, number] = [pw * 0.62, h * 0.62];
      const enCampana: [number, number] = [bx + 46 * u, h * 0.64];
      const p = t < clic + 0.25 ? recorrido(t, 0.25, clic - 0.08, inicio, enBoton)
        : t < clicCampana + 0.2 ? recorrido(t, clic + 0.3, clicCampana - 0.08, enBoton, enCampana)
          : recorrido(t, clicCampana + 0.45, clicCampana + 1.1, enCampana, [w + 80 * u, h + 140 * u]);
      const onda = t >= clicCampana ? tramo(t, clicCampana, clicCampana + 0.45) : tramo(t, clic, clic + 0.45);
      c.save();
      c.globalAlpha *= 1 - tramo(t, clicCampana + 0.6, clicCampana + 1.1);
      puntero(c, p[0], p[1], u, onda);
      c.restore();
    },
  },

  // Me gusta + suscribirse + campana, pulsados uno detrás de otro.
  combo: {
    medir: (c, x, u) => {
      const lw = ancho(c, x.like, 32 * u) + 110 * u;
      const sw = Math.max(ancho(c, x.sub, 34 * u), ancho(c, x.subbed, 34 * u)) + 70 * u;
      return { w: lw + 18 * u + sw + 18 * u + 78 * u, h: 78 * u };
    },
    pintar: (c, x, u, t, _d, w, h) => {
      const lw = ancho(c, x.like, 32 * u) + 110 * u;
      const sw = w - lw - 18 * u - 18 * u - 78 * u;
      const tLike = 0.9, tSub = 1.7, tBell = 2.5;
      const aparece = (i: number) => rebote(tramo(t, i * 0.12, i * 0.12 + 0.45));
      const grupo = (i: number, x0: number, ww: number, pinta: () => void) => {
        const e = aparece(i);
        c.save();
        c.globalAlpha *= lim(e);
        c.translate(x0 + ww / 2, h / 2);
        c.scale(0.6 + 0.4 * e, 0.6 + 0.4 * e);
        c.translate(-(x0 + ww / 2), -h / 2);
        pinta();
        c.restore();
      };
      c.shadowColor = 'rgba(0,0,0,0.35)';
      c.shadowBlur = 16 * u;
      grupo(0, 0, lw, () => {
        c.fillStyle = 'rgba(30,30,30,0.92)';
        pastilla(c, 0, 0, lw, h);
        c.fill();
        c.shadowColor = 'transparent';
        pulgar(c, 44 * u, h / 2, 40 * u, t >= tLike ? '#3ea6ff' : '#fff', t >= tLike);
        texto(c, x.like, 74 * u, h / 2 + 1 * u, 32 * u, '#fff', 600, 'left');
      });
      const sx = lw + 18 * u;
      grupo(1, sx, sw, () => {
        c.fillStyle = t >= tSub ? '#e5e5e5' : '#ff0000';
        pastilla(c, sx, 0, sw, h);
        c.fill();
        c.shadowColor = 'transparent';
        texto(c, t >= tSub ? x.subbed : x.sub, sx + sw / 2, h / 2 + 1 * u, 34 * u, t >= tSub ? '#5f5f5f' : '#fff', 800);
      });
      const bx = sx + sw + 18 * u;
      grupo(2, bx, 78 * u, () => {
        c.fillStyle = 'rgba(30,30,30,0.92)';
        pastilla(c, bx, 0, 78 * u, h);
        c.fill();
        c.shadowColor = 'transparent';
        const suena = t >= tBell ? Math.sin((t - tBell) * 26) * 0.45 * Math.exp(-(t - tBell) * 2.6) : 0;
        campana(c, bx + 39 * u, h / 2, 42 * u, '#fff', t >= tBell, suena);
      });
      c.shadowColor = 'transparent';
      const a: [number, number] = [44 * u, h * 0.66];
      const b: [number, number] = [sx + sw * 0.55, h * 0.66];
      const d: [number, number] = [bx + 42 * u, h * 0.68];
      const p = t < tLike + 0.2 ? recorrido(t, 0.35, tLike - 0.08, [w * 0.4, h + 140 * u], a)
        : t < tSub + 0.2 ? recorrido(t, tLike + 0.15, tSub - 0.08, a, b)
          : t < tBell + 0.3 ? recorrido(t, tSub + 0.15, tBell - 0.08, b, d)
            : recorrido(t, tBell + 0.4, tBell + 1, d, [w + 60 * u, h + 140 * u]);
      const ult = t >= tBell ? tBell : t >= tSub ? tSub : tLike;
      c.save();
      c.globalAlpha *= 1 - tramo(t, tBell + 0.5, tBell + 1);
      puntero(c, p[0], p[1], u, tramo(t, ult, ult + 0.45));
      c.restore();
    },
  },

  // Rótulo inferior: "No olvides suscribirte" con el canal debajo.
  banner: {
    medir: (c, x, u, capa) => {
      const tw = Math.max(ancho(c, x.noOlvides, 40 * u, 800), capa.canal ? ancho(c, capa.canal, 28 * u, 500) : 0);
      const sw = ancho(c, x.sub, 26 * u, 800) + 44 * u;
      return { w: 26 * u + 92 * u + 26 * u + tw + 34 * u + sw + 26 * u, h: 124 * u };
    },
    pintar: (c, x, u, t, dur, w, h, capa) => {
      const entra = salida(tramo(t, 0, 0.55));
      const sale = salida(tramo(t, dur - 0.5, dur));
      const abierto = entra - sale;
      // Se despliega desde la izquierda.
      c.save();
      c.beginPath();
      c.rect(0, 0, w * lim(abierto), h);
      c.clip();
      c.fillStyle = 'rgba(15,15,15,0.9)';
      pastilla(c, 0, 0, w, h, 26 * u);
      c.fill();
      c.fillStyle = '#ff0000';
      c.fillRect(0, 0, 8 * u, h);
      logo(c, 26 * u, h / 2, 92 * u);
      const tx0 = 26 * u + 92 * u + 26 * u;
      const conCanal = !!capa.canal;
      texto(c, x.noOlvides, tx0, conCanal ? h * 0.38 : h / 2, 40 * u, '#fff', 800, 'left');
      if (conCanal) texto(c, capa.canal, tx0, h * 0.68, 28 * u, '#aaa', 500, 'left');
      const sw = ancho(c, x.sub, 26 * u, 800) + 44 * u;
      const sx = w - 26 * u - sw;
      const late = 1 + 0.05 * Math.max(0, Math.sin(t * 5));
      c.save();
      c.translate(sx + sw / 2, h / 2);
      c.scale(late, late);
      c.fillStyle = '#ff0000';
      pastilla(c, -sw / 2, -27 * u, sw, 54 * u);
      c.fill();
      texto(c, x.sub, 0, 1 * u, 26 * u, '#fff', 800);
      c.restore();
      c.restore();
    },
  },

  // Pastilla pequeña en una esquina: no tapa nada y se queda latiendo.
  minimo: {
    medir: (c, x, u) => ({ w: 22 * u + 54 * u + 14 * u + ancho(c, x.sub, 28 * u, 800) + 26 * u, h: 66 * u }),
    pintar: (c, x, u, t, _d, w, h) => {
      const e = rebote(tramo(t, 0, 0.5));
      const late = 1 + 0.035 * Math.sin(t * 4);
      c.translate(w / 2, h / 2);
      c.scale(e * late, e * late);
      c.translate(-w / 2, -h / 2);
      c.shadowColor = 'rgba(0,0,0,0.4)';
      c.shadowBlur = 14 * u;
      c.fillStyle = '#fff';
      pastilla(c, 0, 0, w, h);
      c.fill();
      c.shadowColor = 'transparent';
      logo(c, 22 * u, h / 2, 54 * u);
      texto(c, x.sub, 22 * u + 54 * u + 14 * u, h / 2 + 1 * u, 28 * u, '#0f0f0f', 800, 'left');
    },
  },

  // Pantalla final: fondo oscurecido, "gracias por ver" y el botón.
  final: {
    medir: () => ({ w: 0, h: 0 }),
    pintar: (c, x, u, t, _d, w, h, capa) => {
      c.fillStyle = `rgba(0,0,0,${0.62 * salida(tramo(t, 0, 0.5))})`;
      c.fillRect(0, 0, w, h);
      const e = rebote(tramo(t, 0.15, 0.7));
      c.save();
      c.globalAlpha *= lim(e);
      c.translate(w / 2, h * 0.38);
      c.scale(0.7 + 0.3 * e, 0.7 + 0.3 * e);
      texto(c, x.gracias, 0, 0, 92 * u, '#fff', 900);
      if (capa.canal) texto(c, capa.canal, 0, 82 * u, 40 * u, '#cfcfcf', 500);
      c.restore();
      const clic = 1.5;
      const bw = Math.max(ancho(c, x.sub, 40 * u, 800), ancho(c, x.subbed, 40 * u, 800)) + 90 * u;
      const bh = 92 * u;
      const by = h * 0.6;
      const eb = rebote(tramo(t, 0.45, 0.95));
      const pulsado = 1 - 0.07 * Math.max(0, 1 - Math.abs(t - clic) / 0.12);
      c.save();
      c.globalAlpha *= lim(eb);
      c.translate(w / 2, by + bh / 2);
      c.scale((0.6 + 0.4 * eb) * pulsado, (0.6 + 0.4 * eb) * pulsado);
      c.fillStyle = t >= clic ? '#e5e5e5' : '#ff0000';
      pastilla(c, -bw / 2, -bh / 2, bw, bh);
      c.fill();
      texto(c, t >= clic ? x.subbed : x.sub, 0, 1 * u, 40 * u, t >= clic ? '#5f5f5f' : '#fff', 800);
      c.restore();
      const p = t < clic + 0.3
        ? recorrido(t, 0.8, clic - 0.08, [w * 0.72, h * 0.95], [w / 2 + bw * 0.15, by + bh * 0.62])
        : recorrido(t, clic + 0.5, clic + 1.2, [w / 2 + bw * 0.15, by + bh * 0.62], [w * 0.8, h * 1.05]);
      c.save();
      c.globalAlpha *= lim(tramo(t, 0.7, 0.9)) * (1 - tramo(t, clic + 0.6, clic + 1.2));
      puntero(c, p[0], p[1], u * 1.2, tramo(t, clic, clic + 0.45));
      c.restore();
    },
  },

  // El de Twitch: "Seguir" morado con corazón, que estalla al pulsarlo.
  twitch: {
    medir: (c, x, u) => ({ w: Math.max(ancho(c, x.follow, 34 * u), ancho(c, x.following, 34 * u)) + 120 * u, h: 76 * u }),
    pintar: (c, x, u, t, _d, w, h) => {
      const clic = 1.0;
      const hecho = t >= clic;
      const e = rebote(tramo(t, 0, 0.45));
      const pulsado = 1 - 0.07 * Math.max(0, 1 - Math.abs(t - clic) / 0.12);
      c.save();
      c.translate(w / 2, h / 2);
      c.scale(e * pulsado, e * pulsado);
      c.translate(-w / 2, -h / 2);
      c.shadowColor = 'rgba(0,0,0,0.35)';
      c.shadowBlur = 16 * u;
      c.fillStyle = hecho ? '#3a3a3d' : '#9147ff';
      pastilla(c, 0, 0, w, h, 14 * u);
      c.fill();
      c.shadowColor = 'transparent';
      corazon(c, 46 * u, h / 2, 38 * u, hecho ? '#bf94ff' : '#fff', hecho);
      texto(c, hecho ? x.following : x.follow, 80 * u, h / 2 + 1 * u, 34 * u, '#fff', 700, 'left');
      c.restore();
      // Corazones que salen al pulsar.
      if (hecho) {
        const k = tramo(t, clic, clic + 0.9);
        for (let i = 0; i < 7; i += 1) {
          const ang = -Math.PI / 2 + (i - 3) * 0.38;
          const dist = (30 + 90 * salida(k)) * u;
          c.save();
          c.globalAlpha *= 1 - k;
          corazon(c, 46 * u + Math.cos(ang) * dist, h / 2 + Math.sin(ang) * dist, (16 + (i % 3) * 6) * u, '#bf94ff', true);
          c.restore();
        }
      }
      const p = t < clic + 0.3
        ? recorrido(t, 0.3, clic - 0.08, [w + 40 * u, h + 120 * u], [w * 0.55, h * 0.64])
        : recorrido(t, clic + 0.45, clic + 1.1, [w * 0.55, h * 0.64], [w + 60 * u, h + 140 * u]);
      c.save();
      c.globalAlpha *= 1 - tramo(t, clic + 0.55, clic + 1.1);
      puntero(c, p[0], p[1], u, tramo(t, clic, clic + 0.45));
      c.restore();
    },
  },

  // Campana que suena sola, con su globo de texto.
  campana: {
    medir: (c, x, u) => ({ w: 100 * u + 14 * u + ancho(c, x.bell, 30 * u, 700) + 44 * u, h: 100 * u }),
    pintar: (c, x, u, t, _d, w, h) => {
      const e = rebote(tramo(t, 0, 0.45));
      c.save();
      c.translate(50 * u, h / 2);
      c.scale(e, e);
      c.shadowColor = 'rgba(0,0,0,0.4)';
      c.shadowBlur = 14 * u;
      c.fillStyle = '#ff0000';
      c.beginPath();
      c.arc(0, 0, 50 * u, 0, Math.PI * 2);
      c.fill();
      c.shadowColor = 'transparent';
      // Suena en ráfagas, una por segundo y pico.
      const fase = (t - 0.4) % 1.4;
      const suena = t > 0.4 && fase < 0.8 ? Math.sin(fase * 30) * 0.4 * (1 - fase / 0.8) : 0;
      campana(c, 0, 0, 56 * u, '#fff', true, suena);
      c.restore();
      // El globo se despliega a su lado.
      const g = salida(tramo(t, 0.35, 0.8));
      const gx = 114 * u;
      const gw = (w - gx) * g;
      if (gw > 4 * u) {
        c.save();
        c.beginPath();
        c.rect(gx, 0, gw, h);
        c.clip();
        c.fillStyle = 'rgba(15,15,15,0.9)';
        pastilla(c, gx, h / 2 - 32 * u, w - gx, 64 * u);
        c.fill();
        texto(c, x.bell, gx + 22 * u, h / 2 + 1 * u, 30 * u, '#fff', 700, 'left');
        c.restore();
      }
    },
  },

  // Bocadillo de comentario con los puntos de "escribiendo".
  comentario: {
    medir: (c, x, u) => ({ w: 30 * u + 48 * u + 18 * u + ancho(c, x.comenta, 32 * u, 700) + 90 * u, h: 104 * u }),
    pintar: (c, x, u, t, _d, w, h) => {
      const e = rebote(tramo(t, 0, 0.45));
      c.translate(0, h);
      c.scale(e, e);
      c.translate(0, -h);
      const bh = 84 * u;
      c.shadowColor = 'rgba(0,0,0,0.35)';
      c.shadowBlur = 16 * u;
      c.fillStyle = '#fff';
      pastilla(c, 0, 0, w, bh, 26 * u);
      c.fill();
      c.beginPath();
      c.moveTo(34 * u, bh - 2 * u);
      c.lineTo(30 * u, h);
      c.lineTo(66 * u, bh - 2 * u);
      c.closePath();
      c.fill();
      c.shadowColor = 'transparent';
      // Icono de comentario
      c.fillStyle = '#065fd4';
      pastilla(c, 30 * u, bh / 2 - 22 * u, 48 * u, 38 * u, 9 * u);
      c.fill();
      c.beginPath();
      c.moveTo(40 * u, bh / 2 + 14 * u);
      c.lineTo(40 * u, bh / 2 + 26 * u);
      c.lineTo(54 * u, bh / 2 + 14 * u);
      c.fill();
      for (let i = 0; i < 3; i += 1) {
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc((42 + i * 12) * u, bh / 2 - 3 * u, 3.4 * u, 0, Math.PI * 2);
        c.fill();
      }
      const tx0 = 30 * u + 48 * u + 18 * u;
      texto(c, x.comenta, tx0, bh / 2 + 1 * u, 32 * u, '#0f0f0f', 700, 'left');
      // Puntos de "escribiendo".
      const px = w - 64 * u;
      for (let i = 0; i < 3; i += 1) {
        const salto = Math.max(0, Math.sin(t * 7 - i * 0.7)) * 7 * u;
        c.fillStyle = '#909090';
        c.beginPath();
        c.arc(px + i * 16 * u, bh / 2 - salto, 5 * u, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
};

/** Misma regla de posición que la marca de agua: continua y pegable al borde. */
const eje = (pct: number, total: number, caja: number) => (pct / 100) * (total - caja);

/**
 * Pinta la capa en el instante `t` (segundos desde que empieza) sobre un lienzo
 * de W x H. Al final se desvanece sola, sea cual sea la plantilla.
 */
export const dibujarCapa = (ctx: CanvasRenderingContext2D, capa: Capa, t: number, W: number, H: number) => {
  if (t < 0 || t > capa.dur) return;
  const d = DIBUJOS[capa.plantilla];
  const x = TEXTOS[capa.idioma] || TEXTOS.en;
  // Tamaño de serie: el botón ocupa ~11 % del alto, como los de YouTube.
  const u = (H / 760) * (capa.escala || 1);
  const pl = plantilla(capa.plantilla);
  ctx.save();
  ctx.globalAlpha = 1 - tramo(t, capa.dur - 0.3, capa.dur);
  if (pl.pantalla) {
    d.pintar(ctx, x, H / 900, t, capa.dur, W, H, capa);
  } else {
    const { w, h } = d.medir(ctx, x, u, capa);
    ctx.translate(eje(capa.x, W, w), eje(capa.y, H, h));
    d.pintar(ctx, x, u, t, capa.dur, w, h, capa);
  }
  ctx.restore();
};

/** Todas las capas que se ven en el segundo T del vídeo final. */
export const dibujarCapas = (ctx: CanvasRenderingContext2D, capas: Capa[], T: number, W: number, H: number) => {
  for (const c of capas) if (T >= c.inicio && T <= c.inicio + c.dur) dibujarCapa(ctx, c, T - c.inicio, W, H);
};
