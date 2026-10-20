/**
 * Saca los enlaces de clip de lo que se haya pegado, con o sin https:// y
 * separados por lo que sea. Antes solo se partía por "http", así que
 * "clips.twitch.tv/Abc" pegado a pelo era un enlace inválido sin aviso, y dos
 * formas del mismo clip se descargaban dos veces.
 */
export const extraerEnlacesTwitch = (texto: string): string[] => {
  const re = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)*twitch\.tv\/[^\s"'<>,;]+/gi;
  const vistos = new Set<string>();
  const salida: string[] = [];
  for (const m of texto.match(re) || []) {
    const url = /^https?:\/\//i.test(m) ? m : `https://${m}`;
    // Mismo clip, distinta forma (con ?filter=, con barra final...): uno solo.
    const clave = url.replace(/^https?:\/\/(www\.|m\.)?/i, '').split(/[?#]/)[0].replace(/\/$/, '');
    // Un canal o un VOD no es un clip: mejor no contarlo que dar un error luego.
    const esClip = /^clips\.twitch\.tv\/[^/]+$/i.test(clave) || /\/clip\/[^/]+/i.test(clave);
    if (!esClip) continue;
    const slug = clave.includes('/clip/') ? clave.split('/clip/')[1].split('/')[0] : clave.replace(/^clips\.twitch\.tv\//i, '');
    if (vistos.has(slug)) continue;
    vistos.add(slug);
    salida.push(url);
  }
  return salida;
};
