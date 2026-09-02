# Prompt reutilizable: revisión y mejora profunda de una herramienta

Plantilla para pedir en una sesión nueva el mismo trabajo que se hizo en `backgroundremover`
(agosto 2026). Sustituye `<SLUG>` por la carpeta real de la herramienta y pega el resto tal cual.

Las secciones de *motor* y *editor* están escritas pensando en herramientas de imagen/archivo.
Para las de texto o datos (json-flow, regex-flow, hash-bolt...) borra la parte de "editor con
pinceles" y deja el resto: análisis, handoff, frontend, i18n, anuncios y responsive aplican a todas.

---

# Encargo: revisión y mejora profunda de la herramienta `<SLUG>` de olovetools

Repo: C:\Users\adria\Desktop\proyectos\olovetools (Astro + islas React + Tailwind, 9 idiomas).
La herramienta vive en `src/tools/<SLUG>/`, sus textos en `src/locales/{en,es,fr,de,pt,ru,hi,ja,zh}/<SLUG>.ts`,
y se monta desde `src/pages/[lang]/[tool]/index.astro`.

## 1. Primero analiza a fondo (no toques nada todavía)

Léete el componente principal, sus subcomponentes, `types.ts`, el diccionario en inglés y la
librería/npm que hace el trabajo pesado. Quiero un diagnóstico honesto en tabla de:

- **Motor / librería**: ¿se está usando con los defaults? Mira la config real del paquete en
  `node_modules` (schema, opciones, exports). Casi siempre hay ajustes de rendimiento o de calidad
  desaprovechados (aceleración por GPU, web worker, modelos alternativos, APIs de más bajo nivel
  que dan datos intermedios en vez del resultado ya aplanado).
- **Bugs reales**: estado duplicado/espejado en React, `setState` dentro de un updater de otro
  `setState`, refs duplicadas, `URL.createObjectURL` sin revocar, historial de undo que se come
  cientos de MB, listeners sin limpiar.
- **Límites de entrada**: formatos aceptados (¿HEIC del iPhone? ¿AVIF?), tamaño, lotes.
- **Funcionalidad que falta** frente a lo que ofrece la competencia de pago.
- **Textos que mienten** (tamaños, límites, "100% local" cuando algo se descarga de un CDN).
- **Frontend**: emojis gigantes haciendo de ilustración, iconos de lucide reciclados, cero
  "cómo funciona", cero muestra visual del resultado.
- **Responsive y anuncios** (ver sección 3, tiene reglas propias).

Enséñame el diagnóstico antes de implementar.

## 2. Luego implementa

**Motor y precisión**: exprime la librería (GPU, worker, calidad configurable). Si expone una API
de más bajo nivel que devuelve el dato intermedio (una máscara, un buffer, un AST), úsala: permite
edición no destructiva y postprocesado de calidad. Añade el postproceso que de verdad mejore el
resultado y hazlo medible.

**Editor / controles**: que el usuario pueda corregir a mano lo que la automatización falle.
Herramientas con modo doble (aplicar/deshacer), inversión temporal con Alt o clic derecho, atajos
de teclado, zoom al cursor + pan, comparar antes/después manteniendo pulsado, undo/redo barato en
memoria (guarda el mínimo, no el bitmap entero).

**Nada automático al subir**: subir un archivo NO lanza la operación cara. El archivo queda en
espera, el usuario elige ajustes y pulsa el botón. Añade también una vía manual que se salte por
completo la parte automática, para quien quiera control total desde el principio.

**Encadenado con el resto de la suite**: usa el mecanismo que ya existe — `src/lib/handoff.ts` y
el hook `useHandoffIntake` de `src/lib/useHandoff.ts` — para que el resultado viaje a otra
herramienta sin descargar y resubir. Para *recibir* basta una línea junto a la función de entrada
de ficheros. Para *emitir*, copia el patrón de
`src/tools/backgroundremover/components/NextStepBar.tsx`. No inventes otro mecanismo.

**Frontend**: SVG propios en un `components/Illustrations.tsx` (ilustración de héroe con animación
sutil respetando `prefers-reduced-motion`, iconos de features hechos a medida, arte para los pasos
de "cómo funciona"). Fuera emojis como ilustración. FAQ en `<details>` acordeón. Mantén la paleta y
el `glass-card` que ya tiene la herramienta en el `<style is:inline>` de su bloque en
`index.astro` — no metas un sistema de temas nuevo.

**i18n**: toda clave nueva va a los 9 idiomas con traducción de verdad, no inglés copiado. Hazlo con
un script en el scratchpad que inserte antes del `};` final y sea reejecutable (que salte las claves
que ya existan). Comprueba con `node scripts/check-translations.mjs --key <SLUG>`.

## 3. Anuncios y responsive (revísalo SIEMPRE, se rompe en silencio)

La infraestructura de anuncios YA existe y es compartida — **no crees componentes nuevos**:
`src/config/ads.ts` (slot IDs, `ADS_ENABLED`, `RAIL_BLOCKLIST`), `AdRail` (los dos raíles fijos
izquierdo y derecho), `AdSlot` (`content`, `side`, `anchor`, `infeed`) y `AdBanner`
(`-top` / `-mid` / `-bottom` horizontales). `index.astro` ya monta raíles + anchor + content + side
en las 60 herramientas. Tu trabajo es que la herramienta **no los inutilice**:

- **Los raíles laterales fijos son lo primero que hay que comprobar.** `AdRail` mide en runtime el
  hueco entre `<main>` y el borde del viewport, y si no cabe **no los renderiza y no avisa**. Si el
  `<main>` de la tool es `w-full` sin `max-w`, el hueco es 0 y **los raíles no salen jamás, en
  ningún ancho de pantalla**. Solución: el `max-w` va **en el propio `<main>`**, reservando el
  espacio de los raíles:
  `max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]`
  (los raíles son 120px desde 1400px y 160px desde 1650px, más 24px de aire a cada lado).
  Ajusta el `max-w` y el `rem` del `min()` al ancho que ya tuviera el contenedor interno, y quita
  el `max-w` duplicado de dentro. Verifícalo midiendo: a 1400px debe dar hueco ≥168px por lado, y
  a 1800px ≥208px.
  *Estado a agosto 2026:* ya arreglado en backgroundremover, codecard, compresssnap, cropsnap,
  pdf-flow, qr-bolt, recordsnap, pastesnap, graph-flow y svg-optimizer. **Quedan pendientes
  `drawsnap` y `formatflow`**: son layouts tipo aplicación a ancho completo y estrecharlos es una
  decisión de diseño, no un arreglo mecánico.
- Los `<ins>` de AdSense ya son responsive (`data-ad-format="auto"` +
  `data-full-width-responsive="true"`). **Ojo al medirlos**: si redimensionas la ventana, AdSense NO
  vuelve a pedir creatividad, así que verás un 728x90 desbordando en móvil que es un artefacto de tu
  test. Recarga a ese ancho antes de dar por buena una conclusión.
- Añade los bloques que falten a la tool (`AdBanner` `-top` y `-bottom` como mínimo) si no los tiene.

Y el responsive en sí, comprobado a **375 / 768 / 1400 / 1800 px**:

- **Trampa nº1: `flex-1` dentro de un contenedor `flex-col`.** Pone `flex-basis:0%` sobre el eje
  vertical y **anula el `h-[...]`**, colapsando el panel a 2px de alto. Si el contenedor es
  `flex-col lg:flex-row`, el hijo debe llevar `lg:flex-1`, nunca `flex-1` a secas.
- Comprueba desbordamiento horizontal real con `document.documentElement.scrollWidth > clientWidth`,
  y lista los elementos con `getBoundingClientRect().right > vw`. Ojo: `overflow-x-hidden` en el
  wrapper esconde el desbordamiento pero el contenido sigue **cortado** (le pasaba al título del
  header a 375px). Los decorativos dentro de un padre `overflow-hidden` sí son falsos positivos.
- Revisa el `Header.tsx` de la tool: "oLoveTools" + el nombre de la herramienta no cabe en 375px.
  El arreglo aplicado en backgroundremover es `hidden sm:inline` en el span del nombre.
- Barras de herramientas: que envuelvan (`flex-wrap`), no que se salgan.

## 4. Reglas que me ahorran tiempo

- Arregla los errores que te encuentres de paso, en el momento. No los aparques.
- Coste cero: nada de APIs de pago ni servicios externos. Todo en el navegador.
- Verifica de verdad en el navegador antes de decirme que funciona, y mide con números
  (`javascript_tool` leyendo píxeles/estado/rects), no "parece que va".
- Al final: `npx tsc --noEmit` y `npx astro build` limpios.

## 5. Trampas conocidas del Browser pane (no las confundas con bugs)

- `document.visibilityState` siempre es `"hidden"`, así que **`requestAnimationFrame` y
  `ResizeObserver` no disparan**: un canvas pintado dentro de un rAF sale en blanco con tamaño
  300×150, y tras un resize se queda con el tamaño anterior. Compruébalo con `document.hidden`
  antes de investigar. (En backgroundremover se resolvió pintando síncrono cuando `document.hidden`,
  que además arregla el caso real de volver a una pestaña en segundo plano.)
- Los screenshots se cuelgan por las animaciones CSS infinitas. Usa `read_page` y `javascript_tool`.
- Si mides un resultado con debounce, no concluyas "no funciona" con una sola medición: mide otra
  vez en una llamada posterior, ya asentado.
- El puerto 4321 suele tener ya un `astro dev` externo con HMR sobre el mismo directorio.
