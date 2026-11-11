// ============================================================================
// Vista previa del vertical: la miniatura del primer clip pintada en 9:16 con
// el mismo crearEncaje que usa la exportación, así lo que se ve aquí es lo que
// sale (recorte, fondo difuminado o el clip escalado encima).
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { loadImage } from '../../lib/loadImage';
import { crearEncaje, type Encaje } from './formato';

// Resolución del lienzo: el tamaño en pantalla lo decide quien lo coloca.
const LADO_LARGO = 640;
const LADO_CORTO = 360;

export default function VistaEncaje({ src, encaje, etiqueta, formato = '9:16' }: { src?: string; encaje: Encaje; etiqueta: string; formato?: '16:9' | '9:16' }) {
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
    const W = c.width;
    const H = c.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (!img) return;
    ctx.imageSmoothingQuality = 'high';
    crearEncaje(ctx, W, H, encaje)(img, img.naturalWidth, img.naturalHeight);
  }, [img, encaje, formato]);

  return (
    <canvas
      ref={lienzo}
      width={formato === '9:16' ? LADO_CORTO : LADO_LARGO}
      height={formato === '9:16' ? LADO_LARGO : LADO_CORTO}
      role="img"
      aria-label={etiqueta}
      className="block w-full h-full rounded-xl border border-white/10 bg-black"
    />
  );
}
