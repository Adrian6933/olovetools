// ¿Es este un equipo flojo? Las tools que codifican vídeo, pasan modelos de IA
// o reparten trabajo entre workers lo miran para no lanzar más trabajo a la vez
// del que el equipo aguanta: en un portátil de 4 GB, dos vídeos decodificándose
// a la vez acaban con la pestaña cerrada por falta de memoria.
//
// Solo en el navegador y después del montaje: en el servidor no hay navigator
// y leerlo durante el render rompe la hidratación.

interface NavigatorConPistas extends Navigator {
  deviceMemory?: number;
  userAgentData?: { mobile?: boolean };
}

export interface PerfilEquipo {
  /** Núcleos lógicos que dice el navegador (4 si no lo dice). */
  nucleos: number;
  /** GB de memoria redondeados por el navegador (solo Chromium); null si no lo dice. */
  memoriaGB: number | null;
  movil: boolean;
  flojo: boolean;
}

let cache: PerfilEquipo | null = null;

export const perfilEquipo = (): PerfilEquipo => {
  if (cache) return cache;
  if (typeof navigator === 'undefined') {
    return { nucleos: 4, memoriaGB: null, movil: false, flojo: false };
  }
  const nav = navigator as NavigatorConPistas;
  const nucleos = nav.hardwareConcurrency || 4;
  const memoriaGB = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
  const movil = nav.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '');
  // deviceMemory se queda en 8 como mucho y Safari/Firefox no lo dan: ahí
  // solo quedan los núcleos. Un móvil cuenta como flojo aunque tenga 8
  // núcleos: la mitad son de bajo consumo y el sistema mata la pestaña antes.
  const flojo = movil || nucleos <= 4 || (memoriaGB !== null && memoriaGB <= 4);
  cache = { nucleos, memoriaGB, movil, flojo };
  return cache;
};

export const esEquipoFlojo = (): boolean => perfilEquipo().flojo;

/**
 * Cuántos trabajos pesados lanzar a la vez: `normal` en un equipo con margen,
 * `flojo` en uno justo, y nunca más que núcleos menos uno (el hilo principal
 * también tiene que respirar).
 */
export const trabajosALaVez = (normal: number, flojo = 1): number => {
  const p = perfilEquipo();
  const tope = Math.max(1, p.nucleos - 1);
  return Math.max(1, Math.min(p.flojo ? flojo : normal, tope));
};
