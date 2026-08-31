// ============================================================================
// Worker de formateo.
// ----------------------------------------------------------------------------
// sql-formatter se importa SÓLO aquí, de forma estática. Dos motivos:
//   1. Un `import()` dinámico dentro de un worker rompe el build (el worker se
//      emite como IIFE y no admite chunks).
//   2. Un fallback en el hilo principal con import estático metería la librería
//      entera en el chunk que se carga de entrada. El fallback vive en
//      useFormatter.ts y usa import dinámico, así que sigue siendo perezoso.
// ============================================================================

import { format, type FormatOptionsWithLanguage } from 'sql-formatter';
import { analyze, type Analysis } from './analyze';
import { minify } from './transform';

export interface FormatRequest {
  id: number;
  text: string;
  mode: 'format' | 'minify';
  options: FormatOptionsWithLanguage;
  stripComments: boolean;
}

export interface FormatResponse {
  id: number;
  ok: boolean;
  output: string;
  /** Mensaje crudo del motor cuando la consulta no se puede formatear. */
  engineError?: string;
  analysis: Analysis;
  /** Milisegundos reales de trabajo, para poder enseñar un número honesto. */
  ms: number;
}

self.onmessage = (event: MessageEvent<FormatRequest>) => {
  const { id, text, mode, options, stripComments } = event.data;
  const started = performance.now();
  const analysis = analyze(text);
  let output = '';
  let ok = true;
  let engineError: string | undefined;

  try {
    output = mode === 'minify' ? minify(text, { stripComments }) : format(text, options);
  } catch (error) {
    // El motor lanza en sintaxis que no reconoce. La entrada se devuelve tal
    // cual: perder lo que el usuario escribió sería mucho peor que no formatear.
    ok = false;
    output = text;
    engineError = error instanceof Error ? error.message : String(error);
  }

  const response: FormatResponse = {
    id,
    ok,
    output,
    engineError,
    analysis,
    ms: Math.round((performance.now() - started) * 10) / 10,
  };
  (self as unknown as Worker).postMessage(response);
};
