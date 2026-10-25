// ============================================================================
// Muestras de la nitidez: la misma foto con cada nivel
// ----------------------------------------------------------------------------
// Debajo de "Sin / Suave / Media / Fuerte" se enseña cómo queda cada uno, sin
// bajar ni procesar ningún clip. La foto se pinta aquí: hierba, hojas y un
// texto de HUD, que es justo lo que la compresión de Twitch emborrona (en una
// imagen plana, como las portadas del proyecto, la nitidez no se nota). Se
// suaviza como llega un clip y se le pasa el mismo filtro CAS que exportar
// (nitidez.ts), así lo que se ve es lo que va a salir.
//
// Se hace una vez por página y se guarda como data URL.
// ============================================================================
import { crearNitidez, FUERZA, type NivelNitidez } from './nitidez';

const ANCHO = 132;
const ALTO = 74;

/** Aleatorio con semilla: la misma foto en cada visita. */
const azar = (semilla: number) => () => {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
};

/** La foto "tal cual llega": nítida al pintarla y suavizada después. */
const pintarFoto = (): HTMLCanvasElement => {
  // Se pinta al doble y se reduce con un desenfoque: así queda la textura
  // blanda de un vídeo comprimido, que es donde la nitidez se nota.
  const grande = document.createElement('canvas');
  grande.width = ANCHO * 2;
  grande.height = ALTO * 2;
  const g = grande.getContext('2d')!;
  const r = azar(7);
  const W = grande.width;
  const H = grande.height;

  // Cielo y fondo de árboles.
  const cielo = g.createLinearGradient(0, 0, 0, H * 0.45);
  cielo.addColorStop(0, '#8fb8d8');
  cielo.addColorStop(1, '#cfe0d0');
  g.fillStyle = cielo;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i += 1) {
    const x = r() * W;
    const y = H * 0.18 + r() * H * 0.3;
    g.fillStyle = `hsl(${105 + r() * 30}, ${35 + r() * 25}%, ${18 + r() * 22}%)`;
    g.beginPath();
    g.ellipse(x, y, 3 + r() * 6, 2 + r() * 4, r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  // Hierba: muchas briznas finas, el detalle que Twitch se come.
  g.fillStyle = '#3f6b2f';
  g.fillRect(0, H * 0.45, W, H * 0.55);
  for (let i = 0; i < 1400; i += 1) {
    const x = r() * W;
    const y = H * 0.45 + r() * H * 0.6;
    const alto = 4 + r() * 10 * (y / H);
    g.strokeStyle = `hsl(${85 + r() * 40}, ${40 + r() * 30}%, ${20 + r() * 35}%)`;
    g.lineWidth = 0.8 + r() * 0.8;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 4, y - alto);
    g.stroke();
  }
  // Un texto de HUD, para ver los bordes duros.
  // En el centro: es lo que enseña cada miniatura (CalidadSelector).
  g.font = '900 24px sans-serif';
  g.textAlign = 'center';
  g.lineWidth = 4;
  g.strokeStyle = 'rgba(0,0,0,0.8)';
  g.strokeText('+100', W / 2, H * 0.42);
  g.fillStyle = '#ffd84a';
  g.fillText('+100', W / 2, H * 0.42);

  const foto = document.createElement('canvas');
  foto.width = ANCHO;
  foto.height = ALTO;
  const f = foto.getContext('2d')!;
  f.filter = 'blur(0.6px)';
  f.imageSmoothingQuality = 'high';
  f.drawImage(grande, 0, 0, ANCHO, ALTO);
  return foto;
};

let muestras: Partial<Record<NivelNitidez, string>> | null = null;

/** Una data URL por nivel; {} si no hay WebGL (sin filtro no hay qué enseñar). */
export const muestrasNitidez = (): Partial<Record<NivelNitidez, string>> => {
  if (muestras) return muestras;
  try {
    const foto = pintarFoto();
    const filtro = crearNitidez(ANCHO, ALTO);
    if (!filtro) return (muestras = {});
    const salida: Partial<Record<NivelNitidez, string>> = {};
    for (const nivel of Object.keys(FUERZA) as NivelNitidez[]) {
      salida[nivel] = FUERZA[nivel] > 0 ? filtro.aplicar(foto, FUERZA[nivel]).toDataURL('image/png') : foto.toDataURL('image/png');
    }
    filtro.liberar();
    muestras = salida;
  } catch {
    muestras = {};
  }
  return muestras;
};
