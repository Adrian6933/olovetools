// ============================================================================
// Aviso: sin tarjeta gráfica (o sin WebCodecs) el procesado va lento
// ----------------------------------------------------------------------------
// Incrustar la marca, unir, cambiar el formato o afilar decodifica y vuelve a
// codificar cada fotograma. Con la gráfica lo hace ella; si el navegador la
// tiene desactivada ("aceleración por hardware" apagada, o un equipo sin
// controlador), WebGL cae a un render por software (SwiftShader, llvmpipe...)
// y todo funciona igual pero varias veces más lento, sin que se sepa por qué.
// Y sin WebCodecs (navegadores viejos) se graba en tiempo real: tarda lo que
// dura el vídeo y la pestaña tiene que quedarse a la vista.
//
// Solo se avisa de lo que se puede medir con fiabilidad. El codificador por
// hardware (VideoEncoder 'prefer-hardware') NO entra: con la gráfica bien,
// Chrome lo niega en muchos equipos para H.264 High y saldría un aviso falso.
// ============================================================================
import React, { useEffect, useState } from 'react';
import { Cpu, Timer } from 'lucide-react';

export interface Aceleracion {
  /** Hay VideoEncoder/VideoDecoder: se procesa fotograma a fotograma. */
  webcodecs: boolean;
  /** WebGL va por la gráfica (false = render por software). null: no se sabe. */
  grafica: boolean | null;
}

let comprobacion: Aceleracion | null = null;

/** Una vez por página: crear un contexto WebGL no es gratis. */
export const comprobarAceleracion = (): Aceleracion => {
  if (comprobacion) return comprobacion;
  const webcodecs = typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';
  let grafica: boolean | null = null;
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) {
      grafica = false;
    } else {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const nombre = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      grafica = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(nombre);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    grafica = null;
  }
  comprobacion = { webcodecs, grafica };
  return comprobacion;
};

interface Props {
  tx: (k: string, fb: string) => string;
  className?: string;
}

/** No pinta nada si todo va bien. */
const AvisoGrafica: React.FC<Props> = ({ tx, className = '' }) => {
  // Tras montar: en el servidor no hay WebGL y el HTML tiene que coincidir.
  const [acel, setAcel] = useState<Aceleracion | null>(null);
  useEffect(() => { setAcel(comprobarAceleracion()); }, []);
  if (!acel) return null;

  if (!acel.webcodecs) {
    return (
      <div role="note" className={`flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2.5 ${className}`}>
        <Timer className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <p className="text-[11px] font-medium text-amber-100/90 leading-snug">
          <b className="font-black text-amber-200">{tx('gpu_old_title', 'This browser records in real time.')}</b>{' '}
          {tx('gpu_old_text', 'It takes as long as the video lasts and the tab must stay visible. Chrome or Edge process it several times faster.')}
        </p>
      </div>
    );
  }
  if (acel.grafica === false) {
    return (
      <div role="note" className={`flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2.5 ${className}`}>
        <Cpu className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <p className="text-[11px] font-medium text-amber-100/90 leading-snug">
          <b className="font-black text-amber-200">{tx('gpu_off_title', 'Your graphics card is not being used.')}</b>{' '}
          {tx('gpu_off_text', 'The watermark, joining and sharpening work anyway, but much slower. Turn on "Use graphics acceleration when available" in your browser settings (System) and restart it.')}
        </p>
      </div>
    );
  }
  return null;
};

export default AvisoGrafica;
