# 📖 CONTEXTO DEL PROYECTO — oLoveTools

> **Este archivo es una referencia de contexto para IAs y desarrolladores.** Contiene únicamente información técnica y arquitectónica del proyecto. NO incluye guías de estilo, diseño visual, layouts, colores ni tipografías — cada IA es libre de implementar la interfaz como considere más apropiada para la herramienta que está creando.

**Dominio en producción:** `https://olovetools.com`
**Contacto del desarrollador:** `adrian.contact.me.69@gmail.com`
**Google AdSense Publisher ID:** `ca-pub-4601581729676999`
**Hosting:** Hostinger (Servidor Apache)
**Última actualización de este documento:** Junio 2026

### 📑 Índice de Navegación Rápida

| # | Sección | Qué encontrar ahí |
| :--- | :--- | :--- |
| 1 | Stack Tecnológico | Astro, React, Tailwind, dependencias, comandos |
| 2 | Estructura de Carpetas | Árbol completo del proyecto |
| 3 | Sistema de Routing | Cómo se generan las URLs y páginas |
| 4 | Sistema de Traducciones | Hook `useTranslation`, diccionarios, idiomas |
| 5 | Favicons Dinámicos | Data URIs SVG por herramienta en `constants.ts` |
| 6 | Componentes Globales | Layout, ProjectCard, Modal, CookieBanner, ToolPlaceholder |
| 7 | Estructura de Herramienta | Patrón de carpetas y props estándar |
| 8 | ⭐ Guía: Añadir Nueva Herramienta | Los pasos con código de ejemplo (usar script generador) |
| 9 | SEO y Metadatos | Open Graph, hreflang, JSON-LD, sitemap |
| 10 | Monetización | AdSense, Cookie Banner, ads.txt |
| 11 | Persistencia (LocalStorage) | Claves de almacenamiento local |
| 12 | Resumen de Herramientas | Lista de las 55 tools implementadas (referencia, no guía de diseño) |
| 13 | Convenciones de Código | Naming, exports, patrones de archivos |
| 14 | Deployment y Hosting | Hostinger, Apache, SSG, proceso de deploy |
| 15 | Configuración Apache (.htaccess) | Redirecciones, caché, seguridad, HSTS |
| 16 | Página 404 | Comportamiento de la página de error |
| 17 | Flujo Clipy → ClipBolt | Conexión entre herramientas vía localStorage |
| 18 | Deuda Técnica | Código duplicado, archivos faltantes, bugs conocidos |
| 19 | ✅ Checklist Rápido | Lista comprimida para nuevas herramientas |
| 20 | ⚠️ Errores Frecuentes | Problemas comunes y cómo evitarlos |
| 21 | Archivos Misceláneos | metadata.json, robots.txt, manifest, ads.txt |

---

## 1. Stack Tecnológico

| Tecnología | Versión | Uso |
| :--- | :--- | :--- |
| **Astro** | v6+ | Framework principal. Genera páginas estáticas (SSG) con routing basado en archivos. |
| **React** | v19+ | Componentes interactivos de cada herramienta (hidratados con `client:load`). |
| **TypeScript** | v5.8+ | Tipado estático en todo el proyecto. |
| **Tailwind CSS** | v4+ (vía `@tailwindcss/vite`) | Framework de estilos utilitarios. Se importa con `@import "tailwindcss"` en `global.css`. |
| **Framer Motion** | v12+ | Librería de animaciones para componentes React. |
| **Lucide React** | v0.555+ | Iconos SVG ligeros usados en toda la UI. |
| **JSZip** | v3.10+ | Compresión ZIP en cliente. |
| **jsPDF** | v4.2+ | Generación de PDF en cliente. |
| **heic2any** | v0.0.4 | Conversión de imágenes HEIC a formatos estándar. |
| **@google/genai** | v1.30+ | Integración con la API de Gemini (usado en el servicio de Clipy). |

**Comandos principales:**
```bash
npm run dev      # Servidor de desarrollo en http://localhost:4321 (incluye el backend /api y /proxy)
npm run build    # Build de producción estática en /dist
npm run preview  # Previsualización del build de producción
npm run server   # Backend Node standalone (server/index.mjs) para producción
npx astro check  # Verificación de TypeScript en todo el proyecto
```

**Backend (Node):** las herramientas Klipy, ClipFlow, Clipy, KickBolt y TwitchBolt usan un pequeño backend Node (`server/app.mjs`): proxy CORS de vídeo (`/proxy`), proxy de la API de Kick (`/api/kick`) y emisión del token de app de Twitch (`/api/twitch/token`). En dev se monta automáticamente dentro del dev server de Astro. En producción: `npm run server` detrás del mismo dominio, o un Cloudflare Worker (`cloudflare-worker/worker.js`) + variable `PUBLIC_API_BASE` en el build. Ver `server/README.md`.

---

## 2. Estructura de Carpetas Completa

```
olovetools/
├── public/                          # Archivos estáticos servidos tal cual
│   ├── .htaccess                    # Reglas de servidor Apache
│   ├── ads.txt                      # Verificación Google AdSense
│   ├── icon.svg                     # Favicon principal del hub
│   ├── manifest.json                # PWA manifest
│   ├── og-{tool}.png                # Open Graph image por herramienta
│   └── robots.txt                   # Reglas de crawling + sitemap URL
│
├── src/
│   ├── components/                  # Componentes React GLOBALES (compartidos)
│   │   ├── Home.tsx                 # Página principal del hub (grid de herramientas)
│   │   ├── Layout.tsx               # Layout global: navbar + footer + modales
│   │   ├── ProjectCard.tsx          # Tarjeta de cada herramienta en el hub
│   │   ├── Modal.tsx                # Modal reutilizable
│   │   ├── CookieBanner.tsx         # Banner de consentimiento de cookies
│   │   └── ToolPlaceholder.tsx      # Placeholder para herramientas sin implementar
│   │
│   ├── layouts/
│   │   └── LegalLayout.astro        # Layout Astro para páginas legales
│   │
│   ├── pages/                       # Rutas de Astro (file-based routing)
│   │   ├── index.astro              # Redirección automática raíz → /{idioma detectado}/
│   │   ├── 404.astro                # Página de error 404 personalizada
│   │   └── [lang]/
│   │       ├── index.astro          # Hub principal: /{lang}/
│   │       ├── [tool]/
│   │       │   └── index.astro      # Página de cada herramienta: /{lang}/{tool}/
│   │       ├── about/index.astro
│   │       ├── privacy/index.astro
│   │       ├── terms/index.astro
│   │       └── cookies/index.astro
│   │
│   ├── tools/                       # ⭐ HERRAMIENTAS INDIVIDUALES
│   │   ├── {tool-slug}/
│   │   │   ├── {ComponentName}.tsx  # Componente principal
│   │   │   └── components/          # Sub-componentes (Header, Footer, etc.)
│   │   │       ├── Header.tsx
│   │   │       ├── Footer.tsx
│   │   │       ├── LanguageSwitcher.tsx
│   │   │       └── LegalModal.tsx
│   │   └── ...                      # 55 herramientas en total
│   │
│   ├── locales/                     # Sistema de traducciones i18n
│   │   ├── dictionary.ts            # Motor central de traducciones
│   │   ├── en/  es/  fr/  de/  pt/  ru/  hi/  ja/  zh/
│   │   │   ├── hub.ts               # Textos del hub principal
│   │   │   ├── {tool}.ts            # Textos de cada herramienta
│   │   │   └── legal/               # Textos de páginas legales
│   │
│   ├── styles/
│   │   └── global.css               # Estilos globales de Tailwind
│   │
│   ├── constants.ts                 # TOOL_FAVICONS, TOOL_THEME_COLORS, MOCK_PROJECTS, LANGUAGES
│   ├── types.ts                     # Tipos globales: Project, Language, etc.
│   └── scripts/                     # Scripts de desarrollo
│       └── generate-tool.mjs        # Generador automático de herramientas
│
├── astro.config.mjs                 # Configuración Astro
├── tsconfig.json                    # Config TypeScript
├── package.json                     # Dependencias y scripts
└── *.md                             # Documentación (CONTEXTO.md, HERRAMIENTAS.md, etc.)
```

---

## 3. Sistema de Routing (Cómo funcionan las URLs)

Astro usa **file-based routing**. La estructura de `src/pages/` define las rutas:

| Ruta en el navegador | Archivo Astro | Qué se renderiza |
| :--- | :--- | :--- |
| `/` | `pages/index.astro` | Detecta idioma del navegador y redirige a `/{lang}/` |
| `/{lang}/` (ej. `/es/`) | `pages/[lang]/index.astro` | **Hub principal** con el grid de herramientas |
| `/{lang}/{tool}/` (ej. `/es/clipy/`) | `pages/[lang]/[tool]/index.astro` | **Página de la herramienta individual** |
| `/{lang}/privacy/` | `pages/[lang]/privacy/index.astro` | Política de Privacidad |
| `/{lang}/terms/` | `pages/[lang]/terms/index.astro` | Términos de Servicio |
| `/{lang}/cookies/` | `pages/[lang]/cookies/index.astro` | Política de Cookies |
| `/{lang}/about/` | `pages/[lang]/about/index.astro` | Página "About Us" |

### Idiomas soportados (9 en total)

| Código | Idioma |
| :--- | :--- |
| `en` | English (default) |
| `es` | Español |
| `fr` | Français |
| `de` | Deutsch |
| `pt` | Português |
| `ru` | Русский |
| `hi` | हिन्दी |
| `ja` | 日本語 |
| `zh` | 中文 |

El idioma del usuario se persiste en `localStorage` bajo la clave `olovetools_lang`.

---

## 4. Sistema de Traducciones (i18n) - En Detalle

### Arquitectura

El archivo central es `src/locales/dictionary.ts`. Exporta:

1. **Diccionarios por herramienta:** `clipyDictionary`, `twitchboltDictionary`, `kickboltDictionary`, `pastesnapDictionary`, `formatflowDictionary`, `hubDictionary`, `base64boltDictionary`, `urlboltDictionary`, `uuidGeneratorDictionary`, `listMixerDictionary`, `htmlSanitizerDictionary`, `colorsnapDictionary`, `hexToRgbDictionary`, `aspectRatioDictionary`, `unitflowDictionary`, `sqlFlowDictionary`, `cronFlowDictionary`, `xmlJsonDictionary`, `binaryFlowDictionary`, `morseFlowDictionary`, `epochFlowDictionary`, `timeBoltDictionary`, `deviceTestDictionary`, `loremFlowDictionary`, `keyDoctorDictionary`, `whiteboardFlowDictionary`, `subtitlesBoltDictionary`, `entropy-boltDictionary`, `whoisBoltDictionary`, `svgoptimizerDictionary`, `graphflowDictionary`, etc.

2. **Hook `useTranslation(lang, tool)`:** Devuelve `{ t, lang, dictionary }`.
   - `t('clave')` → Devuelve el texto traducido. Soporta acceso con puntos: `t('categories.All')`.
   - `dictionary` → Objeto completo del diccionario para pasar como prop.

### Estructura de un archivo de traducciones

Cada archivo en `src/locales/{lang}/{tool}.ts` exporta un objeto con claves de texto. Las claves estándar que **toda** herramienta debe tener son:

```typescript
export default {
  "title": "Tool Name",
  "seo_title": "Tool Name | Short SEO Description",
  "seo_description": "Long SEO meta description (150-160 chars)",
  "seoHeroTitle": "Hero Section Title",
  "seoHeroText": "Hero section description paragraph",
  "seoBrowserSpeedTitle": "Speed/Performance title",
  "seoBrowserSpeedText": "Speed/Performance description",
  "seoUseCaseTitle": "Use case title",
  "seoUseCaseText": "Use case description",
  "seoPrivacyTitle": "Privacy title",
  "seoPrivacyText": "Privacy description",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "faqTitle": "FAQ",
  "faq": [
    { "question": "...", "answer": "..." }
  ],
  "footerTagline": "Tagline for footer",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  // ... claves específicas de la herramienta ...
};
```

---

## 5. Favicons Dinámicos

Los favicons SVG se definen como Data URIs en `src/constants.ts` dentro del objeto `TOOL_FAVICONS`. Cada herramienta tiene su propio icono inline SVG:

```typescript
export const TOOL_FAVICONS: Record<string, string> = {
  'tool-slug': "data:image/svg+xml,<svg ...>...</svg>",
  // ...
  default: "/icon.svg"
};
```

Los colores temáticos también están en `constants.ts` dentro de `TOOL_THEME_COLORS` y se usan para el `<meta name="theme-color">` y para los gradientes de fondo del body.

---

## 6. Componentes Globales

| Componente | Ubicación | Propósito |
| :--- | :--- | :--- |
| `Layout` | `src/components/Layout.tsx` | Envuelve toda la página: navbar, footer, modal legal, selector de idioma. |
| `Home` | `src/components/Home.tsx` | Página principal del hub con grid filtrable de herramientas. |
| `ProjectCard` | `src/components/ProjectCard.tsx` | Tarjeta de cada herramienta en el grid del hub. |
| `Modal` | `src/components/Modal.tsx` | Modal reutilizable animado. |
| `CookieBanner` | `src/components/CookieBanner.tsx` | Banner de consentimiento de cookies (traducido a 9 idiomas). |
| `ToolPlaceholder` | `src/components/ToolPlaceholder.tsx` | Placeholder para herramientas sin implementar. |

---

## 7. Estructura de una Herramienta

Cada herramienta vive en su propia carpeta en `src/tools/{tool-slug}/` y sigue este patrón:

```
src/tools/{tool-slug}/
├── {ComponentName}.tsx          # Componente principal (default export)
├── types.ts                     # Tipos específicos (opcional)
├── services/                    # Servicios externos (opcional)
│   └── {name}Service.ts
└── components/                  # Sub-componentes
    ├── Header.tsx
    ├── Footer.tsx
    ├── LanguageSwitcher.tsx
    └── LegalModal.tsx
```

**Props estándar del componente principal:**
```typescript
interface ToolProps {
  lang: string;        // Código del idioma actual
  dictionary: any;     // Diccionario de traducciones
}
```

**Estructura básica del componente (template, no obligatoria):**
```typescript
export default function ToolName({ lang, dictionary }: ToolProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  return (
    <div className="...">
      <Header currentLang={lang} onLanguageChange={...} onReset={...} t={t} />
      <main>
        {/* Contenido específico de la herramienta */}
      </main>
      <Footer lang={lang} t={t} onOpenModal={setLegalModal} />
      <LegalModal isOpen={legalModal === 'privacy'} ... />
      <LegalModal isOpen={legalModal === 'terms'} ... />
      <LegalModal isOpen={legalModal === 'cookies'} ... />
    </div>
  );
}
```

---

## 8. ⭐ Guía: Añadir Nueva Herramienta

### Opción A: Usar el Script Generador (Recomendado)

```bash
node scripts/generate-tool.mjs \
  --slug=mi-herramienta \
  --name="Mi-Herramienta" \
  --color=emerald \
  --icon=Link \
  --description="Descripción corta de la herramienta para SEO."
```

El script genera automáticamente:
- Carpeta `src/tools/mi-herramienta/` con Header, Footer, LanguageSwitcher, LegalModal
- Componente principal con esqueleto
- 9 archivos de diccionario en `src/locales/{lang}/mi-herramienta.ts`
- Actualización de `src/locales/dictionary.ts` (imports, diccionario, switch)
- Actualización de `src/pages/[lang]/[tool]/index.astro` (getStaticPaths, render, estilo)
- Actualización de `src/constants.ts` (favicon, theme color)

### Opción B: Manual (cuando el script no aplica)

1. Crear carpeta `src/tools/{slug}/` con el componente principal
2. Crear archivos de traducción en los 9 idiomas
3. Añadir imports y diccionario en `src/locales/dictionary.ts`
4. Añadir entrada en el `useTranslation` switch
5. Añadir slug en el array `tools` de `getStaticPaths()` en `index.astro`
6. Añadir nombre en el objeto `toolNames`
7. Añadir bloque de estilo inline para la herramienta
8. Añadir línea de render con `client:load transition:persist`
9. Añadir entrada en el fallback condition
10. Añadir favicon y theme color en `src/constants.ts`
11. Añadir entrada en `MOCK_PROJECTS` (para que aparezca en el hub)
12. Verificar: `npx astro check` debe dar 0 errores

---

## 9. SEO y Metadatos

Cada página de herramienta tiene configurado:

- **Título:** `{nombre} | {t('seo_title')}` (dinámico por idioma)
- **Meta description:** `t('seo_description')`
- **Open Graph:** `og:title`, `og:description`, `og:url`, `og:image` (por herramienta)
- **Twitter Card:** `summary_large_image`
- **Canonical:** URL canónica por idioma
- **hreflang:** Para cada uno de los 9 idiomas
- **JSON-LD:** Schema.org `WebApplication` con `applicationCategory: UtilitiesApplication`

Para añadir `og-{tool}.png` en `public/`, se recomienda una imagen 1200x630 con el nombre de la herramienta y un fondo de color temático.

---

## 10. Monetización

| Elemento | Ubicación | Detalle |
| :--- | :--- | :--- |
| Google AdSense | `<script async>` en cada página | Publisher ID: `ca-pub-4601581729676999` |
| Cookie Banner | `src/components/CookieBanner.tsx` | Aparece si el usuario no ha aceptado. |
| ads.txt | `public/ads.txt` | Verificación de AdSense. |

---

## 11. Persistencia (LocalStorage)

Claves utilizadas en `localStorage`:

| Clave | Usado por | Propósito |
| :--- | :--- | :--- |
| `olovetools_lang` | Todas | Idioma seleccionado por el usuario |
| `whiteboard-flow-notes-v1` | Whiteboard-Flow | Notas del Kanban |
| (claves específicas de cada herramienta) | Varias | Estado de la herramienta |

---

## 12. Resumen de Herramientas (55 Implementadas)

Las 55 herramientas actualmente implementadas se listan en `HERRAMIENTAS.md` con sus descripciones, rutas, y tecnologías. Consulta ese archivo para ver el catálogo completo.

---

## 13. Convenciones de Código

### Reglas generales
- **Todo componente React** se exporta como `export const` o `export default`.
- **Los slugs de herramientas** siempre en **minúsculas** y guiones (ej. `clipy`, `pastesnap`, `base64-bolt`).
- **Las IDs de proyectos** en `MOCK_PROJECTS` son strings numéricos secuenciales (`'1'`, `'2'`, ...).
- **Categorías de proyectos** (enum `ProjectCategory`): `Utility`, `Creative`, `Development`, `Social`.
- Los **iconos de Lucide** se referencian por nombre de string en el campo `icon` del proyecto.
- Todas las herramientas reciben **`lang`** y **`dictionary`** como props desde la página Astro.

### Convención de nombres de archivos
- Componentes React: `PascalCase.tsx` (ej. `ClipResult.tsx`).
- Servicios: `camelCase.ts` (ej. `kickService.ts`).
- Traducciones: `lowercase.ts` con guiones (ej. `clipy.ts`, `base64-bolt.ts`).
- Componentes principales de herramientas: `PascalCase.tsx` con el nombre de la herramienta (ej. `Base64Bolt.tsx`, `UrlBolt.tsx`).

### Reglas para el código generado por IA
- No añadir comentarios al código a menos que se solicite explícitamente.
- No usar `console.log` en producción.
- Implementar manejo de errores para todas las entradas del usuario.
- Usar `useMemo` y `useCallback` para optimizar re-renders cuando sea apropiado.
- La interfaz de usuario de cada herramienta debe ser **original y diferente** a las demás — no copiar layouts ni estilos de herramientas existentes.

---

## 14. Deployment y Hosting

### Plataforma de hosting

El sitio se aloja en **Hostinger** con un servidor **Apache**. El despliegue se realiza subiendo la carpeta `/dist` generada por `npm run build`.

### Proceso de despliegue

```bash
# 1. Build de producción
npm run build

# 2. (Opcional) Previsualizar en local
npm run preview

# 3. Subir el contenido de /dist al servidor de Hostinger
#    (a public_html/ mediante FTP o el file manager de Hostinger)
```

### Generación de páginas estáticas (SSG)

Astro genera **TODAS** las combinaciones de idioma + herramienta en tiempo de build usando `getStaticPaths()`. Esto significa:
- **9 idiomas × 55 herramientas = 495 páginas de herramientas**
- **9 páginas del hub** (`/en/`, `/es/`, `/fr/`, etc.)
- **9 × 4 páginas legales = 36 páginas** (privacy, terms, cookies, about por idioma)
- **1 página 404 + 1 página de redirección raíz**
- **Total aproximado: ~542 páginas HTML estáticas**

Cada página es un archivo `.html` independiente que no requiere servidor Node.js para funcionar.

---

## 15. Configuración del Servidor Apache (.htaccess)

El archivo `public/.htaccess` es **crítico** para el funcionamiento del sitio en producción. Contiene:

### Redirecciones

| Regla | Qué hace |
| :--- | :--- |
| **HTTPS + no-www** | Redirige `http://` y `www.` a `https://olovetools.com` en un solo salto (301 permanente). |
| **Detección de idioma del servidor** | Cuando el usuario accede a `/`, el servidor detecta el header `Accept-Language` y redirige a `/{idioma}/` con 302 temporal. |

### Rendimiento (WPO)

| Regla | Qué hace |
| :--- | :--- |
| **GZIP/Deflate** | Comprime HTML, CSS, JS, JSON, SVG y fuentes WOFF2. |
| **Cache-Control** | Assets estáticos: caché de 1 año. Archivos HTML: `no-cache`. |
| **MIME Types** | Declara tipos de fuentes WOFF2, imágenes WebP y SVG. |

### Seguridad

| Cabecera | Qué protege |
| :--- | :--- |
| `X-Frame-Options: SAMEORIGIN` | Anti-clickjacking. |
| `X-Content-Type-Options: nosniff` | Previene inyecciones MIME. |
| `Strict-Transport-Security` | Fuerza HTTPS durante 1 año. |
| `Referrer-Policy` | Controla envío de referrer. |
| `Cross-Origin-Opener-Policy` | Aislamiento de ventanas. |
| `Options -Indexes` | Bloquea listados de directorios. |
| `FilesMatch "^\."` | Bloquea acceso a archivos ocultos. |

---

## 16. Página 404

El archivo `src/pages/404.astro` renderiza una página de error personalizada con navegación de vuelta al hub. Se activa automáticamente cuando una ruta no coincide con ningún `getStaticPaths`.

---

## 17. Flujo Clipy → ClipBolt

Clipy permite guardar listas de clips favoritos en `localStorage` y exportarlas como archivos `.txt` que pueden ser importados en ClipBolt (Twitch) o Kickbolt (Kick) para descarga masiva.

---

## 18. Deuda Técnica Conocida

- **Código duplicado en Header/Footer/LanguageSwitcher/LegalModal:** Cada herramienta tiene su propia copia de estos 4 componentes. Considerar extraer a componentes compartidos en una futura refactorización.
- **Whois-Bolt hace peticiones de red** (DNS over HTTPS a Google). No es 100% local como el resto.
- **Auditoría de seguridad:** No se ha realizado auditoría formal de las dependencias.
- **Tests:** No hay tests automatizados. Considerar añadir Vitest o Playwright.

---

## 19. ✅ Checklist Rápido (Para Nuevas Herramientas)

- [ ] Carpeta `src/tools/{slug}/` creada con `components/`
- [ ] Componente principal implementado (export default)
- [ ] 9 archivos de traducción en `src/locales/{lang}/{slug}.ts`
- [ ] Diccionario añadido en `src/locales/dictionary.ts` (imports + export + switch)
- [ ] Slug añadido en array `tools` de `getStaticPaths` en `index.astro`
- [ ] Nombre añadido en objeto `toolNames`
- [ ] Bloque de estilo inline añadido
- [ ] Línea de render con `client:load transition:persist` añadida
- [ ] Entrada en el fallback condition del render
- [ ] Favicon SVG añadido en `TOOL_FAVICONS` en `constants.ts`
- [ ] Theme color añadido en `TOOL_THEME_COLORS` en `constants.ts`
- [ ] Entrada en `MOCK_PROJECTS` para que aparezca en el hub
- [ ] `npx astro check` da 0 errores
- [ ] Probada manualmente en el navegador

---

## 20. ⚠️ Errores Frecuentes

### Error: "Cannot find module './xx/newslug'"
**Causa:** Falta crear los archivos de traducción en **TODOS** los 9 idiomas. Si `dictionary.ts` importa `import es_newslug from './es/newslug'` y el archivo no existe, el build falla inmediatamente.

### Error: "La nueva herramienta no aparece en el hub"
**Causa:** Falta añadir la entrada en `MOCK_PROJECTS` en `constants.ts`. El hub renderiza solo lo que está en ese array.

### Error: "Al navegar entre herramientas el estilo del body se 'contamina'"
**Causa:** Los estilos inline `<style is:inline>` de cada herramienta usan `!important` en el `body`. Cada bloque debe resetear los valores del body explícitamente.

### Error: "El nuevo idioma no aparece en el selector"
**Causa:** Hay que tocar **4 lugares** para añadir un nuevo idioma:
1. `src/constants.ts` → array `LANGUAGES`
2. `src/types.ts` → type `LanguageCode`
3. `src/locales/dictionary.ts` → type `Language` y todos los diccionarios
4. `pages/[lang]/index.astro` y `pages/[lang]/[tool]/index.astro` → arrays de `getStaticPaths()`
5. `public/.htaccess` → regla de detección de idioma

---

## 21. Archivos de Configuración Misceláneos

| Archivo | Qué es |
| :--- | :--- |
| `metadata.json` (raíz) | Metadatos del proyecto para hosting. |
| `log.txt` (raíz) | Logs de desarrollo local. |
| `public/ads.txt` | Verificación Google AdSense. |
| `public/manifest.json` | PWA manifest. |
| `public/robots.txt` | Permite crawling + apunta al sitemap. |
| `.gitignore` | Ignora `node_modules/`, `dist/`, `.astro/`. |

---

## 📌 Nota Final para IAs

**Este documento NO contiene información de diseño, estilos, layouts, colores, tipografías ni animaciones.** Cada herramienta debe ser implementada con la interfaz que la IA considere más apropiada para su funcionalidad específica. La originalidad visual entre herramientas es un objetivo del proyecto: evita que todas las páginas se vean iguales.

Las únicas restricciones visuales son:
- Usar Tailwind CSS v4 con clases utilitarias
- Mantener la accesibilidad (navegación por teclado, contraste suficiente)
- Ser responsive (mobile-first)
- Usar el sistema de traducciones para todo el texto visible
