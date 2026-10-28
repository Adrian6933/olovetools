// ============================================================================
// Vista previa del vertical: la miniatura del primer clip pintada en 9:16 con
// el mismo crearEncaje que usa la exportación, así lo que se ve aquí es lo que
// sale (recorte, fondo difuminado o el clip escalado encima).
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { loadImage } from '../../lib/loadImage';
import { crearEncaje, type Encaje } from './formato';

const ANCHO = 108;
const ALTO = 192;

export default function VistaEncaje({ src, encaje, etiqueta }: { src?: string; encaje: Encaje; etiqueta: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    setImg(null);
    if (!src) return;
    let vivo = true;
    // Sin crossOrigin: solo se pinta, no se leen los píxeles, así que da igual
    // que el lienzo quede "manchado" por la miniatura de otro dominio.
    loadImage(src).then(i => { if (vivo) setImg(i); }).catch(() => { /* se queda en negro */ });
    return () => { vivo = false; };
  }, [src]);

  useEffect(() => {
    const c = lienzo.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    // El lienzo va al doble para que no se vea borroso en pantallas densas.
    const W = c.width;
    const H = c.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (!img) return;
    ctx.imageSmoothingQuality = 'high';
    crearEncaje(ctx, W, H, encaje)(img, img.naturalWidth, img.naturalHeight);
  }, [img, encaje]);

  return (
    <canvas
      ref={lienzo}
      width={ANCHO * 2}
      height={ALTO * 2}
      role="img"
      aria-label={etiqueta}
      className="shrink-0 rounded-xl border border-white/10 bg-black"
      style={{ width: ANCHO, height: ALTO }}
    />
  );
}
