// ============================================================================
// Remate de PDF y TIFF
// ----------------------------------------------------------------------------
// Estos dos no caben en el worker: jspdf y utif son CommonJS pesados, y un
// `import()` dinámico dentro de un worker rompe el build (se empaqueta como
// IIFE). Meterlos con import estático los arrastraría al paquete del worker
// aunque nadie pida un PDF en toda la sesión.
//
// El worker ya ha hecho lo caro — orientar, remuestrear, afilar y codificar el
// ráster —, así que aquí sólo queda envolverlo. La librería se carga la primera
// vez que alguien elige ese formato, y no antes.
// ============================================================================

import type { EncodeOutcome } from './encode';
import type { OutputId } from './types';

export async function finishContainer(target: OutputId, outcome: EncodeOutcome): Promise<Blob> {
  if (target === 'pdf') return toPdf(outcome);
  if (target === 'tiff') return toTiff(outcome);
  return outcome.blob;
}

async function toPdf(outcome: EncodeOutcome): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: outcome.width > outcome.height ? 'l' : 'p',
    unit: 'px',
    format: [outcome.width, outcome.height],
    compress: true,
  });
  // addImage acepta el blob como data URL; el ráster portador ya es un JPEG a
  // la calidad que pidió el usuario, así que no se recomprime aquí.
  const dataUrl = await blobToDataUrl(outcome.blob);
  pdf.addImage(dataUrl, 'JPEG', 0, 0, outcome.width, outcome.height);
  return pdf.output('blob');
}

async function toTiff(outcome: EncodeOutcome): Promise<Blob> {
  if (!outcome.rgba) throw new Error('tiff-pixels-missing');
  const module = await import('utif');
  const UTIF: any = (module as any).default || module;
  const buffer = UTIF.encodeImage(outcome.rgba.data, outcome.rgba.width, outcome.rgba.height);
  return new Blob([buffer], { type: 'image/tiff' });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
