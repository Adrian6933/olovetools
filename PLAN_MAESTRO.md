# PLAN MAESTRO — Auditoría y mejora integral de oLoveTools

> **Versión:** 1.1 · 2026-07-03
> **Estado del progreso:** ver `AUDIT_PROGRESS.md` (cada sesión lo lee y lo actualiza)
> **Cómo usarlo:** una fase (o lote) por sesión de Claude Code. Abre una sesión nueva con el
> modelo recomendado y pega el prompt universal de abajo — él solo localiza el siguiente paso.
> No mezcles fases en una sesión.

## Prompt universal (el mismo para todas las sesiones)

No hace falta copiar el prompt de cada fase. Pega esto tal cual en cada sesión nueva:

```text
Lee la sección "PRÓXIMA ACCIÓN" de AUDIT_PROGRESS.md. Después abre PLAN_MAESTRO.md y localiza
la fase/sesión que indica como siguiente paso. Ejecuta ÚNICAMENTE esa sesión siguiendo su prompt
al pie de la letra (incluidas las skills que nombra y las reglas transversales del plan).
Cuando termines esa sesión: actualiza AUDIT_PROGRESS.md (tabla, "PRÓXIMA ACCIÓN" apuntando al
siguiente paso, y log), cierra con npx astro check + npm run build, y PARA — no empieces la
siguiente fase aunque te quede contexto.
```

Lo único que sigues eligiendo tú al abrir cada sesión es el **modelo** (tabla de abajo).
El "PARA al terminar" es importante: encadenar fases en una misma sesión degrada la calidad
cuando el contexto se llena.

---

## Recomendación de modelo por fase

| Fase | Modelo | Motivo |
|---|---|---|
| 1 (i18n), 3 (revisión tools), 6 (regresión) | **Sonnet · esfuerzo medio** | Fases mecánicas guiadas por scripts y checklists; son ~10-12 de las ~15-19 sesiones totales |
| 2 (anuncios), 4 (diseño/animaciones) | **Opus/Fable, o Sonnet · esfuerzo alto** | Pocas sesiones pero con decisiones delicadas: política AdSense, layout global, criterio estético |
| 5 (SEO) | **Sonnet · esfuerzo alto** | Tareas concretas ya diseñadas |

---

## Mapa de skills por fase

Las skills están instaladas globalmente en `~/.claude/skills/` y se activan solas por contexto,
pero cada prompt nombra las suyas explícitamente para forzar su uso:

| Fase | Skills |
|---|---|
| 1 (i18n) | Ninguna aplica (no hay skill de traducción instalada) — el ahorro viene de los scripts |
| 2 (anuncios) | `web-design-guidelines`, `cro`, `react-best-practices` |
| 3 (revisión tools) | `diagnosing-bugs` (al fallar algo), checklist de TOOL_REVIEW_STRATEGY.md |
| 4 (diseño) | `elegant-web-ui`, `make-interfaces-feel-better`, `emil-design-eng`, `review-animations`, `frontend-a11y`, `accessibility` |
| 5 (SEO) | `seo-audit`, `seo`, `schema`, `ai-seo` |
| 6 (regresión) | Ninguna — verificación mecánica |

**Sobre "ahorrar tokens":** no existe una skill de ahorro de tokens como tal; el ahorro está
diseñado en la infraestructura: scripts que sustituyen la lectura de 549 archivos, subagente
Explore para búsquedas amplias, leer solo la cabecera de `AUDIT_PROGRESS.md`, lotes por sesión,
`preview_snapshot` en vez de screenshots, y Sonnet-medio en las fases mecánicas.

---

## Estado actual y hallazgos críticos (auditoría del 2026-07-03)

1. **🔴 Bug AdSense — los anuncios nunca se rellenarían.** `src/components/shared/AdSlot.tsx`
   renderiza `<ins class="adsbygoogle">` pero nadie llama a `(window.adsbygoogle ||= []).push({})`.
   ~165 archivos ya usan AdSlot/AdBanner como placeholder sin slot IDs. Se arregla en Fase 2.
2. **🔴 Riesgo de cloaking.** `src/pages/[lang]/[tool]/index.astro` (~líneas 2041-2072) inyecta
   un bloque `display:none` con h1/FAQ/keywords ocultos ("SSR SEO Content for AdSense Approval").
   Texto oculto = riesgo de penalización de Google y de rechazo de AdSense. **Debe eliminarse o
   hacerse visible ANTES de activar anuncios reales.** Se hace en Fase 5 (adelantar si llegan antes los slot IDs).
3. **🟡 ~55 OG images rotas.** Solo hay 5 `og-*.png` en `public/` pero las ~570 páginas referencian
   `og-{tool}.png`. Decidido: generarlas todas por script desde plantilla (Fase 5).
4. **🟡 1.809 incidencias i18n** (medición real de `scripts/check-translations.mjs`): claves
   faltantes (37-71 por idioma; `es/base64-bolt` tiene 37 — toda la UI), valores sin traducir
   (`seoKeywords` ×280, `footerCredit` ×200, `seoHeroTitle` ×120...) y textos ASCII sospechosos en ru/hi/ja/zh.
5. **🟡 Sin analytics.** El CookieBanner promete analytics pero no hay gtag. Decidido: GA4 + Consent Mode v2 (Fase 5).
6. **Layout para raíles:** el contenido es `max-w-7xl` (1280px). Un skyscraper 160×600 + margen
   necesita viewport **≥1650px** (a 1440px NO cabe). Raíles con `position:fixed` como hermanos de
   `#root` → CLS 0.
7. Sin tests/lint/CI. Verificación estándar = `npx astro check` (ya arreglado para excluir `dist/`)
   + `npm run build` (~570 páginas).

---

## Reglas transversales (van implícitas en todos los prompts)

- **Tokens:** JAMÁS abrir los 540 archivos de locales a mano — usar los scripts de la Fase 0.
  Para búsquedas amplias, usar el subagente Explore. Leer solo la cabecera de `AUDIT_PROGRESS.md`.
- **Progreso:** actualizar `AUDIT_PROGRESS.md` tras CADA herramienta/lote (no al final de la sesión),
  y añadir entrada al log. Así una sesión cortada no pierde trabajo.
- **Cierre de sesión:** `npx astro check` + `npm run build` siempre. Si el build rompe, aislar con `git diff`.
- **Commits:** recomendado un commit por fase/lote para poder revertir (pedir confirmación al usuario).
- **Encoding:** todo se lee/escribe en UTF-8 explícito. Este repo tiene historial de mojibake
  (`scripts/fix-mojibake.ps1`). En PowerShell, nunca `Out-File` sin `-Encoding utf8`.
- **Skills:** las skills globales instaladas se activan por contexto; los prompts nombran las
  relevantes explícitamente para forzar su uso.

---

## FASE 0 — Infraestructura ✅ COMPLETADA (2026-07-03)

Herramientas ya disponibles:

- **`node scripts/check-translations.mjs`** — valida los 549 locales contra `en` (60 archivos
  por idioma + las traducciones legales `src/locales/legal/{lang}.ts` como pseudo-herramienta
  `(legal)`): archivos faltantes, claves faltantes/sobrantes (incl. `faq`), valores sin traducir,
  ASCII sospechoso. Flags: `--lang es` (detalle), `--key footerCredit` (corte), `--json out.json`
  (volcado para el applier; las claves faltantes incluyen el texto inglés de origen).
  NO cubre `src/locales/dictionary.ts` (1.408 líneas, textos de navegación por idioma) — se
  revisa a mano una vez en la sesión 1.A.
- **`node scripts/apply-translations.mjs <archivo.json> [--dry]`** — aplica traducciones en masa.
  Formato `{"es": {"entropy-bolt": {"clave": "valor"}}}`. Herramienta `"*"` = aplicar a todos los archivos
  del idioma donde la clave siga idéntica al inglés (ideal para `footerCredit` y similares).
  Crea claves faltantes (rutas anidadas con puntos: `faq.1.question`). Los typos generan "claves
  sobrantes" que el checker detecta después — esa es la red de seguridad.
- **`AUDIT_PROGRESS.md`** — estado persistente entre sesiones.
- `tsconfig.json` ya excluye `dist/` → `astro check` rápido y limpio (0 errores).

---

## FASE 1 — Traducciones (3-4 sesiones · Sonnet medio)

**Objetivo:** 0 incidencias en el checker para los 9 idiomas.
**Hecho cuando:** `node scripts/check-translations.mjs` reporta 0 sin-traducir y 0 claves faltantes
(o solo falsos positivos justificados, que se añaden a la allowlist del script).

### Prompt sesión 1.A (fix mecánico global)

```text
Lee la sección "PRÓXIMA ACCIÓN" de AUDIT_PROGRESS.md y la sección FASE 1 de PLAN_MAESTRO.md.
Ejecuta `node scripts/check-translations.mjs`. Identifica las claves sin traducir que se repiten
globalmente (footerCredit ×200, faqTitle, emailCopied, contactForIdeas, seoPrivacyTitle...).
Tradúcelas UNA sola vez a los 8 idiomas no-ingleses y aplícalas con el comodín "*" de
`node scripts/apply-translations.mjs` (usa --dry primero). NO abras archivos de locales a mano.
Re-ejecuta el checker y reporta el remanente por idioma. Arregla también la clave rota
`match_fail: ` (con espacio) de es/hash-bolt. Después revisa UNA vez src/locales/dictionary.ts
(el checker no lo cubre): comprueba que los textos de navegación/UI de los 9 idiomas están
completos y traducidos, y corrige lo que falte. Actualiza AUDIT_PROGRESS.md (columna i18n de las
herramientas que queden limpias + log). Cierra con npx astro check y npm run build.
```

### Prompt sesiones 1.B-1.D (por lotes de idioma — repetir cambiando idiomas)

```text
Lee la sección "PRÓXIMA ACCIÓN" de AUDIT_PROGRESS.md. Ejecuta
`node scripts/check-translations.mjs --lang es --json .tmp-es.json` (y lo mismo para fr).
El JSON contiene, por herramienta: claves sin traducir (con el texto inglés) y claves faltantes
(con el texto inglés de origen). Traduce SOLO esas claves con calidad nativa, respetando nombres
de marca (oLoveTools, EntropyBolt...), tecnicismos y placeholders. Los seoKeywords tradúcelos como
palabras clave de búsqueda reales de ese idioma (no traducción literal). Genera el JSON de
traducciones y aplícalo con `node scripts/apply-translations.mjs` (--dry primero). Re-ejecuta el
checker hasta 0 hallazgos en esos idiomas. Borra los .tmp-*.json. NO abras locales a mano.
Actualiza AUDIT_PROGRESS.md. Cierra con npx astro check y npm run build.
```

Reparto sugerido: 1.B = es+fr · 1.C = de+pt · 1.D = ru+hi+ja+zh (los CJK tienen menos volumen).

---

## FASE 2 — Anuncios (1-2 sesiones · Opus/Fable o Sonnet alto)

**Objetivo:** infraestructura de anuncios lista para activar pegando slot IDs en UN solo archivo.
**Hecho cuando:** con IDs vacíos, el sitio en producción se ve idéntico a hoy (placeholders solo
en dev); con IDs de prueba, los `<ins>` reciben el push sin errores de consola; build OK.

### Prompt

```text
Lee la sección "PRÓXIMA ACCIÓN" de AUDIT_PROGRESS.md, la FASE 2 de PLAN_MAESTRO.md,
src/components/shared/AdSlot.tsx y las líneas 1970-2080 de src/pages/[lang]/[tool]/index.astro.
Usa las skills web-design-guidelines, cro y react-best-practices. Implementa:

1. `src/config/ads.ts` (nuevo): ADS_ENABLED, AD_CLIENT='ca-pub-4601581729676999',
   AD_SLOTS={railLeft:'',railRight:'',top:'',mid:'',late:''} y RAIL_BLOCKLIST (tools donde los
   raíles molestan: pizarras/canvas full-width como drawsnap o whiteboard-flow). Este será el
   ÚNICO archivo a editar cuando el usuario cree las unidades en AdSense.
2. AdSlot.tsx: (a) si no recibe adSenseClient/adSenseSlot por props, resolverlos desde ads.ts
   mapeando position→AD_SLOTS; (b) BUG ACTUAL: nadie hace el push — añade useEffect que ejecute
   (window.adsbygoogle=window.adsbygoogle||[]).push({}) cuando el <ins> se active, con guarda
   anti-duplicado (data-ad-status / flag propio) compatible con ClientRouter y soft navigations
   de Astro; (c) añade tamaño skyscraper (w-[160px] h-[600px]) a SIZE_CLASSES; (d) para tamaños
   fijos elimina data-ad-format="auto" y data-full-width-responsive; (e) en producción sin slot
   ID renderiza null — el recuadro punteado "Advertisement" solo debe verse en import.meta.env.DEV.
3. `src/components/shared/AdRail.tsx` (nuevo): dos raíles skyscraper con position:fixed centrados
   verticalmente, visibles SOLO a partir de 1650px de viewport (el contenido es max-w-7xl=1280px;
   160px de anuncio + margen por lado necesita ≥1648px — a 1440px NO cabe). aria-hidden="true".
   Móntalo UNA vez en src/pages/[lang]/[tool]/index.astro como hermano de <div id="root">,
   pasando el slug para respetar RAIL_BLOCKLIST. CLS debe ser 0.
4. Política AdSense: máximo 1 anuncio por viewport, nunca pegado a botones de acción, sin anuncios
   en herramientas placeholder. NO actives nada más: el anchor móvil y el CMP se activan desde el
   panel de AdSense, no por código.

Verifica: npx astro check, npm run build, y preview de 3 herramientas (una de RAIL_BLOCKLIST)
a 1700px y 375px con consola limpia. Actualiza AUDIT_PROGRESS.md (columna Ads del lote probado,
log, y recuerda en "Tareas manuales" que el usuario debe: crear las unidades de anuncio en el
panel AdSense y pegar los IDs en src/config/ads.ts; activar anchor ads móviles; activar el CMP
de Google en Privacy & messaging).
```

**⚠️ Antes de activar anuncios reales:** el bloque de texto oculto de `index.astro` debe estar
eliminado (Fase 5, punto 2). Si los slot IDs llegan antes de la Fase 5, hacer ese punto primero.

---

## FASE 3 — Revisión funcional de las 60 herramientas (6-7 sesiones · Sonnet medio)

**Objetivo:** las 60 herramientas verificadas funcionando, con consola limpia y responsive.
**Lotes:** 3.1 = Tier 1 (10 tools pesadas, quizá dividir en dos) · 3.2 = Tiers 2+3 (11) ·
3.3-3.7 = Tier 4 en lotes de 8-10. Ver tiers en la tabla de `AUDIT_PROGRESS.md`.
**Hecho cuando:** 60/60 filas con ✅ o ❌-documentado en la columna Func.

### Prompt (repetir por lote cambiando la lista)

```text
Lee la sección "PRÓXIMA ACCIÓN" y la tabla de AUDIT_PROGRESS.md. Lote de hoy: [LISTA DE TOOLS].
Arranca el dev server una sola vez con preview_start. Por cada herramienta:
1. Abre /es/{tool}. Usa preview_snapshot (árbol de accesibilidad — barato); screenshot SOLO si
   sospechas un problema visual.
2. preview_console_logs: 0 errores (los errores = fallo a investigar con la skill diagnosing-bugs).
3. Ejecuta la acción primaria con datos de muestra (preview_fill/preview_click) y verifica el
   resultado (output correcto, botón copiar/descargar funciona).
4. preview_resize a 375px (móvil) y 1700px (los raíles de anuncios no deben solapar contenido).
5. Spot-check de un idioma CJK: abre /ja/{tool} y verifica que no hay layout roto ni textos en inglés.
6. Pasa en modo rápido el checklist de 10 puntos de TOOL_REVIEW_STRATEGY.md.
Regla de alcance: bugs de <15 min se arreglan en esta sesión; mayores se anotan como ❌ diferido
con severidad y descripción en la columna Notas. ACTUALIZA la fila de AUDIT_PROGRESS.md tras CADA
herramienta, no al final. Cierra con npx astro check + npm run build + entrada en el log.
```

Si se acumulan ❌ diferidos, dedicar una sesión extra de fixes al terminar los lotes.

---

## FASE 4 — Diseño y animaciones (2 sesiones · Opus/Fable o Sonnet alto)

**Principio anti-explosión de alcance:** SOLO componentes compartidos. Como las 60 herramientas
consumen `src/components/shared/` y `src/components/chrome/`, la mejora se propaga sola.
**Hecho cuando:** kit de motion creado y aplicado a los compartidos, `prefers-reduced-motion`
verificado, sin CLS nuevo (comparar preview antes/después en 2-3 herramientas).

### Prompt sesión 4.A (kit + chrome)

```text
Lee la sección "PRÓXIMA ACCIÓN" de AUDIT_PROGRESS.md y la FASE 4 de PLAN_MAESTRO.md.
Usa las skills elegant-web-ui, make-interfaces-feel-better, emil-design-eng, review-animations
y frontend-a11y. Framer Motion 12 ya está instalado (se usa en Home.tsx, Layout.tsx, Modal.tsx).
Crea `src/components/shared/motion.ts`: variants reutilizables (fadeInUp, staggerContainer,
cardHover, pressScale) + helper que respete useReducedMotion. Regla dura: solo transform/opacity
(nunca propiedades que causen layout/CLS), nada de animar la entrada de contenido above-the-fold.
Aplica el kit a los componentes compartidos: UnifiedHeader y UnifiedFooter (src/components/chrome/),
Hero, FAQSection (acordeón animado), ScrollToTop, TrustBar/BottomCTA/FeaturesGrid si existen,
y Modal.tsx. PROHIBIDO tocar carpetas de src/tools/ — si ves algo mejorable ahí, anótalo en
AUDIT_PROGRESS.md. Verifica en preview con 2 herramientas: sin CLS nuevo, animaciones desactivadas
con prefers-reduced-motion emulado. npx astro check + npm run build. Actualiza AUDIT_PROGRESS.md.
```

### Prompt sesión 4.B (hub)

```text
Lee la sección "PRÓXIMA ACCIÓN" de AUDIT_PROGRESS.md. Usa las skills elegant-web-ui,
make-interfaces-feel-better, review-animations y accessibility. Con el kit src/components/shared/motion.ts
de la sesión anterior, mejora el hub: src/components/Home.tsx (entrada con stagger del grid,
hover de tarjetas, transiciones del buscador/filtros si existen) y ProjectCard.tsx. Revisa
contraste y estados de foco visibles del grid (tema dark). Verifica en preview el hub en /es/ y
/ja/ a 375px y 1440px: sin CLS, reduced-motion respetado, consola limpia. npx astro check +
npm run build. Actualiza AUDIT_PROGRESS.md (columna Diseño global + log).
```

---

## FASE 5 — SEO (1-2 sesiones · Sonnet alto)

**Decisiones ya tomadas por el usuario:** GA4 sí · OG images generadas por script.
**Hecho cuando:** 0 OG rotas, 0 texto oculto, sección "relacionadas" en todas las páginas,
`llms.txt` servido, GA4 cableado al consentimiento.

### Prompt

```text
Lee la sección "PRÓXIMA ACCIÓN" de AUDIT_PROGRESS.md y la FASE 5 de PLAN_MAESTRO.md.
Usa las skills seo-audit, seo, schema y ai-seo. Tareas en orden:
1. OG images: solo existen 5 og-*.png en public/ pero index.astro referencia og-{tool}.png para
   ~60 herramientas. Crea scripts/generate-og.mjs (usa sharp, instálalo como devDependency) que
   componga una plantilla 1200×630 con el nombre de la herramienta y su color de
   src/constants.ts (TOOL_THEME_COLORS), y genere las que falten. Ejecuta y verifica que todas
   las referencias resuelven.
2. CLOAKING: elimina el bloque "hidden-seo-content" (display:none, ~líneas 2041-2072 de
   src/pages/[lang]/[tool]/index.astro). Antes de borrar, comprueba qué partes NO están ya
   visibles en la página (muchas tools ya muestran FAQ/SEO visible en el footer) y mueve solo
   esas a una sección SSR visible. Es riesgo de penalización y bloquea la activación de AdSense.
3. Enlazado interno: crea src/config/related-tools.ts (mapa slug → 4-6 slugs relacionados,
   cúralos por afinidad temática) y una sección SSR "Herramientas relacionadas" en index.astro
   FUERA de la isla React (crawlable), con títulos traducidos vía los locales del hub.
4. public/llms.txt: índice de las 60 herramientas con descripción de una línea y URL canónica /en/.
5. GA4: pide al usuario el Measurement ID (G-XXXX) si no está en AUDIT_PROGRESS.md. Implementa
   gtag con Consent Mode v2: default denied, y update granted/denied cableado al Accept/Decline
   de src/components/CookieBanner.tsx (localStorage cookieConsent). Añádelo a las páginas de
   src/pages/ (no a cada tool component).
Verifica: npx astro check, npm run build, JSON-LD válido en 3 páginas de muestra en preview,
consola limpia, y que og-{tool}.png existe para las 60. Actualiza AUDIT_PROGRESS.md.
```

---

## FASE 6 — Regresión final y deploy (1 sesión · Sonnet medio)

### Prompt

```text
Lee AUDIT_PROGRESS.md completo y la FASE 6 de PLAN_MAESTRO.md. Ejecuta en orden:
1. node scripts/check-translations.mjs → debe estar limpio (0 incidencias reales).
2. npx astro check → 0 errores. 3. npm run build → ~570 páginas sin errores.
4. En preview: home + 1 herramienta por Tier (mínimo 5) a 375px, 1440px y 1700px, consola limpia.
   Incluye también las páginas legales (/es/privacy, /es/terms, /es/cookies, /es/about, y una
   en /ja/) y la página 404 — nadie las revisa en las otras fases.
5. Checklist pre-AdSense: sin texto oculto en el HTML generado (grep "hidden-seo" en dist/),
   sin placeholders de anuncio visibles en build de producción, raíles solo ≥1650px, densidad
   máx. 1 anuncio/viewport, ads.txt presente.
6. Cierra los ❌ diferidos pendientes que sean rápidos; documenta el resto como backlog al final
   de AUDIT_PROGRESS.md. 7. Marca AUDIT_PROGRESS.md como COMPLETADO con fecha y resumen.
8. Genera el paquete de deploy: npm run build:zip. Recuerda al usuario las tareas manuales
   pendientes de su lista (slot IDs, anchor móvil, CMP, GA4 property).
```

---

## Riesgos y trampas conocidas

1. **Tokens en i18n:** el flujo checker→JSON→applier existe para no abrir 540 archivos. Si un
   prompt de traducción se queda sin contexto, dividir por idioma, nunca por archivo.
2. **Archivos no parseables:** el checker los reporta y sigue (verificado: 536 JSON puro + 4
   fallback, 0 fallos). Si el applier reescribe uno de los 4 no-JSON, lo normaliza a JSON válido.
3. **Mojibake/encoding:** historial real en este repo. UTF-8 explícito siempre.
4. **Build de 570 páginas** es la red de seguridad global: al cierre de CADA sesión.
5. **Política AdSense:** sin texto oculto, sin anuncios junto a botones, máx. 1/viewport, nada
   de anchor custom (usar el del panel). Las herramientas placeholder no llevan anuncios.
6. **ClientRouter de Astro + adsbygoogle:** las soft navigations pueden duplicar el push o dejar
   `<ins>` huérfanos → guarda por atributo de estado (Fase 2, punto 2b).
7. **Raíles a 1440px NO caben** (max-w-7xl deja ~80px por lado): breakpoint real 1650px.
8. **Explosión de alcance en diseño:** Fase 4 solo toca shared/, chrome/, Home.tsx, ProjectCard.tsx
   y Modal.tsx. "Ya que estoy, retoco esta tool" está prohibido.
9. **astro check:** ya excluye dist/ (tsconfig). Si vuelve a crashear por memoria:
   NODE_OPTIONS=--max-old-space-size=6144.

## Tareas manuales del usuario (no las puede hacer la IA)

- [ ] Crear las unidades de anuncio en el panel de AdSense y pegar los slot IDs en `src/config/ads.ts` (tras Fase 2)
- [ ] Activar **anchor ads** móviles y el **CMP de Google** (Privacy & messaging) en el panel de AdSense
- [ ] Crear la propiedad **GA4** y facilitar el Measurement ID `G-XXXXXXX` (para Fase 5)
- [ ] Subir `olovetools-dist.zip` a Hostinger tras la Fase 6
