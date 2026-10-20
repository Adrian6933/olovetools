/**
 * Saca los enlaces de clip de Kick de lo que se haya pegado, con o sin
 * https:// y separados por lo que sea. Kick escribe el mismo clip de varias
 * formas (kick.com/canal?clip=ID, kick.com/canal/clips/ID, kick.com/clips/ID):
 * todas cuentan como el mismo clip y solo se buscan una vez. Un enlace al canal
 * a secas no es un clip y no se cuenta.
 */
export const extraerEnlacesKick = (texto: string): string[] => {
  const re = /(?:https?:\/\/)?(?:www\.)?kick\.com\/[^\s"'<>,;]+/gi;
  const vistos = new Set<string>();
  const salida: string[] = [];
  for (const m of texto.match(re) || []) {
    const url = /^https?:\/\//i.test(m) ? m : `https://${m}`;
    let id: string | null = null;
    try {
      const u = new URL(url);
      id = u.searchParams.get('clip') || (u.pathname.match(/\/clips\/([A-Za-z0-9_-]+)/) || [])[1] || null;
    } catch {
      continue;
    }
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    salida.push(url);
  }
  return salida;
};
