# 📖 CONTEXTO DEL PROYECTO — oLoveTools

> **Este archivo es una referencia de contexto para IAs y desarrolladores.** Antes de analizar carpeta por carpeta, lee este documento para entender la arquitectura completa del proyecto, cómo funciona cada pieza, y cómo añadir nuevas herramientas correctamente.

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
| 5 | Colores y Temas Visuales | Variables CSS, colores por herramienta |
| 6 | Favicons Dinámicos | Data URIs SVG por herramienta |
| 7 | Componentes Globales | Layout, ProjectCard, Modal, CookieBanner |
| 8 | Estructura de Herramienta | Patrón de carpetas y props estándar |
| 9 | ⭐ Guía: Añadir Nueva Herramienta | Los 7 pasos con código de ejemplo |
| 10 | SEO y Metadatos | Open Graph, hreflang, JSON-LD, sitemap |
| 11 | Monetización | AdSense, Cookie Banner, ads.txt |
| 12 | Persistencia (LocalStorage) | Claves de almacenamiento local |
| 13 | Animaciones CSS | Clases reutilizables y efectos |
| 14 | Fuentes Tipográficas | Outfit, Inter, Plus Jakarta Sans |
| 15 | Resumen de Herramientas | Descripción de las 5 tools actuales |
| 16 | Convenciones de Código | Naming, exports, patrones |
| 17 | Deployment y Hosting | Hostinger, Apache, SSG, proceso de deploy |
| 18 | Configuración Apache (.htaccess) | Redirecciones, caché, seguridad, HSTS |
| 19 | Página 404 | Diseño y comportamiento de la página de error |
| 20 | Flujo Clipy → ClipBolt | Conexión entre herramientas vía localStorage |
| 21 | Deuda Técnica | Código duplicado, archivos faltantes, bugs conocidos |
| 22 | ✅ Checklist Rápido | Lista comprimida para nuevas herramientas |
| 23 | ⚠️ Errores Frecuentes | Problemas comunes y cómo evitarlos |
| 24 | Archivos Misceláneos | metadata.json, robots.txt, manifest, ads.txt |

---

## 1. Stack Tecnológico

| Tecnología | Versión | Uso |
| :--- | :--- | :--- |
| **Astro** | v6+ | Framework principal. Genera páginas estáticas (SSG) con routing basado en archivos. |
| **React** | v19+ | Componentes interactivos de cada herramienta (hidratados con `client:load`). |
| **TypeScript** | v5.8+ | Tipado estático en todo el proyecto. |
| **Tailwind CSS** | v4+ (vía `@tailwindcss/vite`) | Estilos utilitarios. Se importa con `@import "tailwindcss"` en `global.css`. |
| **Framer Motion** | v12+ | Animaciones y transiciones fluidas en componentes React. |
| **Lucide React** | v0.555+ | Iconos SVG ligeros usados en toda la UI. |
| **JSZip** | v3.10+ | Compresión ZIP en cliente (usado por FormatFlow y Clipy). |
| **jsPDF** | v4.2+ | Generación de PDF en cliente (usado por FormatFlow). |
| **heic2any** | v0.0.4 | Conversión de imágenes HEIC a formatos estándar (FormatFlow). |
| **@google/genai** | v1.30+ | Integración con la API de Gemini (usado en el servicio de Clipy). |

**Comandos principales:**
```bash
npm run dev      # Servidor de desarrollo en http://localhost:4321
npm run build    # Build de producción estática en /dist
npm run preview  # Previsualización del build de producción
```

---

## 2. Estructura de Carpetas Completa

```
olovetools/
├── public/                          # Archivos estáticos servidos tal cual
│   ├── .htaccess                    # Reglas de servidor Apache (redirecciones, caché)
│   ├── ads.txt                      # Verificación Google AdSense
│   ├── icon.svg                     # Favicon principal del hub
│   ├── manifest.json                # PWA manifest
│   ├── og-image.png                 # Open Graph image del hub principal
│   ├── og-clipy.png                 # OG image para Clipy
│   ├── og-clipbolt.png              # OG image para ClipBolt/Twitchbolt
│   ├── og-formatflow.png            # OG image para FormatFlow
│   ├── og-pastesnap.png             # OG image para PasteSnap
│   └── robots.txt                   # Reglas de crawling + sitemap URL
│
├── src/
│   ├── components/                  # Componentes React GLOBALES (compartidos)
│   │   ├── Home.tsx                 # Página principal del hub (grid de herramientas)
│   │   ├── Layout.tsx               # Layout global: navbar + footer + modales legales + selector de idioma
│   │   ├── ProjectCard.tsx          # Tarjeta de cada herramienta en el hub
│   │   ├── Modal.tsx                # Modal reutilizable animado
│   │   ├── CookieBanner.tsx         # Banner de consentimiento de cookies (traducido a 9 idiomas)
│   │   └── ToolPlaceholder.tsx      # Placeholder para herramientas sin implementar aún
│   │
│   ├── layouts/
│   │   └── LegalLayout.astro        # Layout Astro para páginas legales (privacy, terms, cookies, about)
│   │
│   ├── pages/                       # Rutas de Astro (file-based routing)
│   │   ├── index.astro              # Redirección automática raíz → /{idioma detectado}/
│   │   ├── 404.astro                # Página de error 404 personalizada
│   │   └── [lang]/                  # Rutas dinámicas por idioma
│   │       ├── index.astro          # Hub principal: /{lang}/
│   │       ├── [tool]/
│   │       │   └── index.astro      # ⭐ PÁGINA DE CADA HERRAMIENTA: /{lang}/{tool}/
│   │       ├── about/index.astro    # Página "About Us"
│   │       ├── privacy/index.astro  # Página de Política de Privacidad
│   │       ├── terms/index.astro    # Página de Términos de Servicio
│   │       └── cookies/index.astro  # Página de Política de Cookies
│   │
│   ├── tools/                       # ⭐ HERRAMIENTAS INDIVIDUALES (cada una es autónoma)
│   │   ├── clipy/
│   │   │   ├── Clipy.tsx            # Componente principal (43KB)
│   │   │   ├── types.ts             # Tipos propios de Clipy
│   │   │   ├── components/          # Sub-componentes: SearchBar, ClipGrid, FloatingPlayer, etc.
│   │   │   └── services/
│   │   │       └── geminiService.ts # Integración con Google Gemini AI
│   │   │
│   │   ├── twitchbolt/
│   │   │   ├── Twitchbolt.tsx       # Componente principal (~30KB)
│   │   │   ├── types.ts             # Tipos de clips Twitch
│   │   │   ├── components/          # Header, Footer, ClipResult, ClipSkeleton, LegalModal
│   │   │   └── services/
│   │   │       └── twitchService.ts # Lógica de la API de descarga de clips de Twitch
│   │   │
│   │   ├── kickbolt/
│   │   │   ├── Kickbolt.tsx         # Componente principal (~30KB)
│   │   │   ├── types.ts             # Tipos de clips Kick
│   │   │   ├── components/          # Header, Footer, ClipResult, ClipSkeleton, LegalModal
│   │   │   └── services/
│   │   │       └── kickService.ts   # Lógica de la API de descarga de clips de Kick
│   │   │
│   │   ├── formatflow/
│   │   │   ├── Formatflow.tsx       # Componente principal (46KB — el más grande)
│   │   │   ├── types.ts             # Tipos de formatos soportados
│   │   │   ├── components/          # Header, DropZone, ControlPanel, CookieBanner, LegalModal
│   │   │   └── services/
│   │   │       └── imageService.ts  # Lógica de conversión de imágenes en cliente
│   │   │
│   │   └── pastesnap/
│   │       ├── Pastesnap.tsx        # Componente principal (~35KB)
│   │       ├── types.ts             # Tipos de imágenes y uploads
│   │       └── components/          # Header, LanguageSwitcher, CookieConsent, LegalModal
│   │
│   ├── locales/                     # ⭐ SISTEMA DE TRADUCCIONES
│   │   ├── dictionary.ts            # Motor central de traducciones (useTranslation hook)
│   │   ├── en/                      # Traducciones en inglés
│   │   │   ├── hub.ts               # Textos del hub principal
│   │   │   ├── clipy.ts             # Textos de Clipy
│   │   │   ├── twitchbolt.ts        # Textos de Twitchbolt
│   │   │   ├── kickbolt.ts          # Textos de Kickbolt
│   │   │   ├── formatflow.ts        # Textos de FormatFlow
│   │   │   └── pastesnap.ts         # Textos de PasteSnap
│   │   ├── es/                      # (misma estructura que en/)
│   │   ├── fr/                      # ...
│   │   ├── de/                      # ...
│   │   ├── pt/                      # ...
│   │   ├── ru/                      # ...
│   │   ├── hi/                      # ...
│   │   ├── ja/                      # ...
│   │   ├── zh/                      # ...
│   │   └── legal/                   # Traducciones de páginas legales
│   │       ├── index.ts             # Exporta legalTranslations
│   │       ├── en.ts, es.ts, fr.ts, de.ts, pt.ts, ru.ts, hi.ts, ja.ts, zh.ts
│   │
│   ├── styles/
│   │   └── global.css               # Estilos globales de Tailwind, animaciones y tema de colores
│   │
│   ├── constants.ts                 # Definiciones globales: MOCK_PROJECTS, TOOL_FAVICONS, TOOL_THEME_COLORS, LANGUAGES
│   └── types.ts                     # Tipos globales: Project, ProjectCategory, LanguageCode, Language
│
├── astro.config.mjs                 # Configuración Astro: site, integraciones (react, sitemap, tailwind)
├── tsconfig.json                    # Config TypeScript: paths @/*, JSX react-jsx
├── package.json                     # Dependencias y scripts
└── HERRAMIENTAS.md                  # Catálogo de herramientas actuales y roadmap de futuras
```

---

## 3. Sistema de Routing (Cómo funcionan las URLs)

Astro usa **file-based routing**. La estructura de `src/pages/` define las rutas:

| Ruta en el navegador | Archivo Astro | Qué se renderiza |
| :--- | :--- | :--- |
| `/` | `pages/index.astro` | Detecta idioma del navegador y redirige a `/{lang}/` |
| `/{lang}/` (ej. `/es/`) | `pages/[lang]/index.astro` | **Hub principal** con el grid de herramientas |
| `/{lang}/{tool}/` (ej. `/es/clipy/`) | `pages/[lang]/[tool]/index.astro` | **Página de la herramienta individual** |
| `/{lang}/privacy/` | `pages/[lang]/privacy/index.astro` | Página de Política de Privacidad |
| `/{lang}/terms/` | `pages/[lang]/terms/index.astro` | Página de Términos de Servicio |
| `/{lang}/cookies/` | `pages/[lang]/cookies/index.astro` | Página de Política de Cookies |
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

## 4. Sistema de Traducciones (i18n) — En Detalle

### Arquitectura

El archivo central es `src/locales/dictionary.ts`. Exporta:

1. **Diccionarios por herramienta:** `clipyDictionary`, `twitchboltDictionary`, `kickboltDictionary`, `pastesnapDictionary`, `formatflowDictionary`, `hubDictionary`.
2. **Hook `useTranslation(lang, tool)`:** Devuelve `{ t, lang, dictionary }`.
   - `t('clave')` → Devuelve el texto traducido. Soporta acceso con puntos: `t('categories.All')`.
   - `dictionary` → Objeto completo del diccionario para pasar como prop.

### Estructura de un archivo de traducciones

Cada archivo en `src/locales/{lang}/{tool}.ts` exporta un objeto con claves de texto:

```typescript
// src/locales/es/clipy.ts
export default {
  "seo_title": "Clipy | Descarga Clips de Twitch",
  "seo_description": "Busca y encuentra los mejores clips...",
  "app_title": "CLIPY",
  "search_placeholder": "Buscar juegos, streamers...",
  // ... más claves
};
```

### Traducciones legales (separadas)

Las páginas legales (privacy, terms, cookies, about) usan un sistema separado en `src/locales/legal/`:
- Cada archivo (`en.ts`, `es.ts`, ...) exporta HTML dentro de strings.
- Se accede a ellas mediante `legalTranslations[lang]` importado desde `src/locales/legal/index.ts`.

---

## 5. Sistema de Colores y Temas Visuales

### Colores del Hub (globales)

Definidos en `src/styles/global.css` bajo `@theme`:

| Variable CSS | Valor | Uso |
| :--- | :--- | :--- |
| `--color-twitch` | `#9146FF` | Color principal de Twitch (Clipy, ClipBolt) |
| `--color-kick` | `#53FC18` | Color verde de Kick (Kickbolt) |
| `--color-dark-950` | `#070708` | Fondo más oscuro |
| `--color-dark-900` | `#0e0e10` | Fondo de la navbar |
| `--color-primary` | `#6366f1` | Indigo principal (FormatFlow) |
| `--color-secondary` | `#a855f7` | Púrpura secundario |
| `--color-love` | `#ec4899` | Rosa (acentos) |

### Colores por herramienta

Definidos en `src/constants.ts` → `TOOL_THEME_COLORS`:

```typescript
{
  clipy: "#9146ff",       // Morado Twitch
  twitchbolt: "#7c3aed",  // Violeta
  kickbolt: "#53fc18",    // Verde Kick
  formatflow: "#38bdf8",  // Azul cielo
  pastesnap: "#6366f1",   // Indigo
  default: "#060609"      // Negro del hub
}
```

### Estilos CSS por herramienta

Cada herramienta tiene sus **estilos inline** en `pages/[lang]/[tool]/index.astro` (líneas 106-273). Esto incluye:
- **Fondo personalizado** (gradientes radiales únicos).
- **Scrollbar personalizada** con el color temático.
- **Clases `.glass-card`** con backdrop-filter específico.
- **Animaciones exclusivas** (ej. `rotate-continuous` para Clipy).

---

## 6. Favicons Dinámicos por Herramienta

Definidos en `src/constants.ts` → `TOOL_FAVICONS`. Cada herramienta tiene un **favicon SVG en Data URI** que se inyecta dinámicamente en el `<head>` de su página. Esto cambia el icono de la pestaña del navegador según la herramienta activa.

---

## 7. Componentes Globales Clave

### `Layout.tsx` (Navbar + Footer + Modales)

- **Navbar fija** (sticky top) con:
  - Logo "oLoveTools" con icono de corazón (Lucide `Heart`).
  - **Selector de idioma** animado (dropdown con Framer Motion).
- **Footer** con:
  - Copyright dinámico con el año actual.
  - Botón para copiar email de contacto al portapapeles.
  - Links legales (Privacy, Terms, Cookies, About) que usan `legalTranslations`.
- **Modales inline** para Privacy, Terms y Cookies (traducidos a 9 idiomas dentro del propio componente).

> **IMPORTANTE:** El `Layout.tsx` se usa **solo en el Hub principal**. Las herramientas individuales (Clipy, Twitchbolt, etc.) tienen **sus propios Headers y Footers** dentro de `src/tools/{tool}/components/`.

### `ProjectCard.tsx` (Tarjeta del Hub)

Renderiza cada herramienta como una tarjeta premium con:
- **Icono** mapeado desde Lucide (`IconMap` con Film, Download, Repeat, Image, etc.).
- **Gradiente de color** de fondo usando la propiedad `color` del proyecto.
- **Tags traducidos** usando el diccionario del hub.
- **Link directo** a `/{lang}/{tool.slug}`.

### `CookieBanner.tsx`

Banner GDPR/AdSense que aparece al fondo de la pantalla. Se muestra solo si `localStorage.cookieConsent` no existe. Traducido inline a 9 idiomas.

---

## 8. Estructura de una Herramienta Individual

Cada herramienta en `src/tools/{slug}/` sigue este patrón:

```
src/tools/{slug}/
├── {Slug}.tsx           # Componente principal React (recibe lang y dictionary como props)
├── types.ts             # Interfaces y tipos TypeScript propios
├── components/          # Sub-componentes internos
│   ├── Header.tsx       # Cabecera propia con logo y navegación
│   ├── Footer.tsx       # Pie de página propio con SEO content
│   ├── LegalModal.tsx   # Modal legal propio
│   └── ...              # Otros componentes específicos
└── services/            # Lógica de negocio y llamadas a APIs
    └── {name}Service.ts # Servicio principal
```

### Props estándar de un componente principal de herramienta

```typescript
interface ToolProps {
  lang: string;         // Código del idioma actual (ej. "es")
  dictionary?: any;     // Objeto completo del diccionario de traducciones
}
```

### Cómo se renderiza en la página Astro

En `pages/[lang]/[tool]/index.astro`, cada herramienta se renderiza condicionalmente:

```astro
{tool === 'clipy' && <ClipyApp lang={castLang} dictionary={dictionary} client:load transition:persist />}
{tool === 'twitchbolt' && <Twitchbolt lang={castLang} dictionary={dictionary} client:load transition:persist />}
// ... etc
```

La directiva `client:load` hidrata el componente React en el cliente inmediatamente. `transition:persist` mantiene el estado durante las transiciones de Astro.

---

## 9. ⭐ GUÍA: Cómo Añadir una Nueva Herramienta

Para añadir una herramienta nueva (ej. `compresssnap`), se deben seguir estos pasos **EN ORDEN**:

### Paso 1: Crear la estructura de la herramienta

```
src/tools/compresssnap/
├── Compresssnap.tsx      # Componente principal React
├── types.ts              # Tipos propios (si los necesita)
├── components/           # Sub-componentes
│   ├── Header.tsx
│   └── ...
└── services/             # Servicios/lógica (si los necesita)
    └── compressService.ts
```

### Paso 2: Registrar la herramienta en `src/constants.ts`

**A)** Añadir al array `MOCK_PROJECTS`:
```typescript
{
  id: '6',                    // Siguiente ID numérico
  name: 'CompressSnap',
  slug: 'compresssnap',       // ⚠️ Debe coincidir con el nombre de la carpeta en tools/
  description: 'Compress and optimize images instantly in your browser.',
  category: ProjectCategory.UTILITY,
  tags: ['Image', 'Compress', 'WebP', 'Optimize'],
  icon: 'Image',             // Nombre del icono de Lucide (debe existir en IconMap de ProjectCard.tsx)
  color: 'bg-gradient-to-br from-cyan-500 to-blue-600'
}
```

**B)** Añadir favicon en `TOOL_FAVICONS`:
```typescript
compresssnap: "data:image/svg+xml,...",  // SVG inline en Data URI
```

**C)** Añadir color temático en `TOOL_THEME_COLORS`:
```typescript
compresssnap: "#06b6d4",  // Color principal de la herramienta
```

### Paso 3: Crear las traducciones en TODOS los idiomas

Para cada uno de los **9 idiomas**, crear el archivo:
```
src/locales/en/compresssnap.ts
src/locales/es/compresssnap.ts
src/locales/fr/compresssnap.ts
src/locales/de/compresssnap.ts
src/locales/pt/compresssnap.ts
src/locales/ru/compresssnap.ts
src/locales/hi/compresssnap.ts
src/locales/ja/compresssnap.ts
src/locales/zh/compresssnap.ts
```

Cada archivo debe exportar por defecto un objeto con al menos:
```typescript
export default {
  "seo_title": "CompressSnap | Compress Images Online Free",
  "seo_description": "Compress JPG, PNG and convert to WebP instantly...",
  // ... todas las claves de texto que use el componente
};
```

### Paso 4: Registrar en el sistema de traducciones (`src/locales/dictionary.ts`)

**A)** Importar los 9 archivos de idioma:
```typescript
import en_compresssnap from './en/compresssnap';
import es_compresssnap from './es/compresssnap';
// ... los 9 idiomas
```

**B)** Crear el diccionario:
```typescript
export const compresssnapDictionary: Record<string, any> = {
  en: en_compresssnap,
  es: es_compresssnap,
  // ... los 9 idiomas
};
```

**C)** Añadir la nueva herramienta al hook `useTranslation`:
```typescript
export const useTranslation = (lang: Language, tool: 'clipy' | 'twitchbolt' | 'kickbolt' | 'hub' | 'pastesnap' | 'formatflow' | 'compresssnap') => {
  const dictionaryObj =
    tool === 'clipy' ? clipyDictionary :
    tool === 'twitchbolt' ? twitchboltDictionary :
    // ... existentes ...
    tool === 'compresssnap' ? compresssnapDictionary :
    hubDictionary;
  // ...
};
```

### Paso 5: Registrar en la página de herramientas (`pages/[lang]/[tool]/index.astro`)

**A)** Importar el componente:
```typescript
import Compresssnap from '../../../tools/compresssnap/Compresssnap';
```

**B)** Añadir el slug al array `tools` en `getStaticPaths()`:
```typescript
const tools = ['clipy', 'twitchbolt', 'kickbolt', 'formatflow', 'pastesnap', 'compresssnap'];
```

**C)** Añadir el nombre visible en `toolNames`:
```typescript
compresssnap: 'CompressSnap',
```

**D)** Añadir el condicional de renderizado en el JSX:
```astro
{tool === 'compresssnap' && <Compresssnap lang={castLang} dictionary={dictionary} client:load transition:persist />}
```

**E)** (Opcional pero recomendado) Añadir estilos CSS personalizados dentro del bloque `<head>`:
```astro
{tool === 'compresssnap' && (
  <style is:inline>
    body {
      background-color: #070b12 !important;
      /* ... estilos personalizados ... */
    }
  </style>
)}
```

### Paso 6: Añadir las traducciones en el Hub

En cada archivo `src/locales/{lang}/hub.ts`, añadir la descripción traducida del proyecto dentro de `"projects"`:
```typescript
"5": {
  "description": "Comprime y optimiza tus imágenes al instante directamente en tu navegador."
}
```

Y cualquier tag nuevo en `"tags"`:
```typescript
"Compress": "Comprimir",
"WebP": "WebP",
"Optimize": "Optimizar"
```

### Paso 7: Imagen Open Graph (opcional pero recomendado)

Añadir un archivo `public/og-compresssnap.png` (1200×630px recomendado) para las previsualizaciones en redes sociales.

---

## 10. SEO y Metadatos

### Estructura SEO por página

Cada página incluye automáticamente:
- `<title>` dinámico traducido.
- `<meta name="description">` traducido.
- **Open Graph** (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`).
- **Twitter Card** (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
- `<link rel="canonical">` apuntando a la URL canónica.
- **Hreflang alternates** para los 9 idiomas + `x-default` (en).
- **JSON-LD Schema** (`WebApplication` type) para Rich Snippets en Google.

### SSR SEO Content (truco para AdSense)

Cada página de herramienta incluye un `<div style="display:none" aria-hidden="true">` con contenido HTML estático traducido invisible para el usuario pero visible para el crawler de Google. Esto ayuda con la aprobación de AdSense porque Google ve contenido legible del lado del servidor, aunque la UI real se renderice con React en cliente.

### Sitemap

Generado automáticamente por `@astrojs/sitemap` con configuración i18n. Se accede en `https://olovetools.com/sitemap-index.xml`.

---

## 11. Monetización

- **Google AdSense** integrado en todas las páginas (scripts de carga async en el `<head>`).
- **Cookie Banner** GDPR-compliant mostrado en la primera visita.
- **ads.txt** configurado en `public/ads.txt` para verificación de publisher.

---

## 12. Persistencia de Datos (LocalStorage)

El proyecto **NO usa bases de datos ni servidores backend**. Todo se almacena en `localStorage` del navegador:

| Clave | Uso |
| :--- | :--- |
| `olovetools_lang` | Idioma preferido del usuario |
| `cookieConsent` | Si el usuario aceptó/rechazó cookies (`"true"` / `"false"`) |
| `clipbolt_shared_clips` | Clips compartidos desde Clipy a ClipBolt |
| Claves internas de cada herramienta | Clips guardados, historial de búsquedas, preferencias, etc. |

---

## 13. Animaciones y Clases CSS Reutilizables

Definidas en `src/styles/global.css`:

| Clase/Utilidad | Efecto |
| :--- | :--- |
| `animate-fade-in` | Fade in suave (0.6s) |
| `animate-slide-up` | Aparición deslizante desde abajo (0.7s) |
| `animate-float` | Flotación infinita arriba/abajo (3s) |
| `animate-shimmer` | Brillo deslizante (para skeletons) |
| `animate-shake` | Vibración rápida (0.5s) |
| `animate-rotate-slow` | Rotación continua lenta (12s) |
| `transition-premium` | Transición suave tipo Bezier premium |
| `.glass` | Efecto glassmorphism (blur + fondo semitransparente) |
| `.custom-scrollbar` | Scrollbar personalizada fina y con colores morados |
| `.no-scrollbar` | Ocultar scrollbar completamente |

---

## 14. Fuentes Tipográficas

Cargadas desde Google Fonts con `preconnect` y lazy loading (`media="print" onload`):

| Fuente | Uso |
| :--- | :--- |
| **Outfit** (300–800) | Títulos principales, logotipos, headings bold |
| **Inter** (300–700) | Texto base, body, UI general |
| **Plus Jakarta Sans** (400–800) | Fuente alternativa para Clipy y PasteSnap |

Variable CSS: `--font-sans` = Inter, `--font-outfit` = Outfit.

---

## 15. Herramientas Existentes — Resumen de Cada Una

### Clipy 🎬
- **Slug:** `clipy`
- **Qué hace:** Busca clips de Twitch por juegos, streamers o keywords. Permite guardar favoritos en listas locales, previsualizar clips en un reproductor flotante, y exportar la lista a `.txt` o compartirla con ClipBolt.
- **APIs externas:** Twitch API (clips, games, search), Google Gemini AI.
- **Componentes clave:** `SearchBar`, `ClipGrid`, `FloatingPlayer`, `CategoryGrid`, `FilterBar`.
- **Servicio:** `geminiService.ts` (integración con IA).

### ClipBolt Twitch (Twitchbolt) ⚡
- **Slug:** `twitchbolt`
- **Nombre visible:** "ClipBolt" (no "Twitchbolt").
- **Qué hace:** Descargador de clips de Twitch. El usuario pega un enlace de clip y obtiene la descarga directa en MP4 sin pérdida de calidad.
- **APIs externas:** Twitch API para resolver metadatos de clips.
- **Componentes clave:** `Header`, `Footer`, `ClipResult`, `ClipSkeleton`, `LegalModal`.

### ClipBolt Kick (Kickbolt) 🟢
- **Slug:** `kickbolt`
- **Qué hace:** Lo mismo que ClipBolt pero para la plataforma **Kick** (alternativa a Twitch).
- **APIs externas:** Kick API.
- **Componentes clave:** Misma estructura que Twitchbolt.
- **Servicio:** `kickService.ts`.

### FormatFlow 🔄
- **Slug:** `formatflow`
- **Qué hace:** Conversor multiuso de archivos: imágenes (JPG, PNG, WebP, HEIC, TIFF, BMP, GIF, AVIF, SVG), audio y documentos. Todo el procesamiento es 100% local en el navegador.
- **Componentes clave:** `Header`, `DropZone`, `ControlPanel`, `CookieBanner`, `LegalModal`.
- **Servicio:** `imageService.ts` (lógica de conversión de formatos de imagen con Canvas API).
- **Librerías especiales:** `heic2any` (HEIC→JPG), `jsPDF` (JPG→PDF), `JSZip` (descarga por lotes en ZIP), `utif` (TIFF support).

### PasteSnap 📸
- **Slug:** `pastesnap`
- **Qué hace:** Permite pegar una imagen directamente desde el portapapeles (`Ctrl+V`) y descargarla en alta calidad sin login.
- **Componentes clave:** `Header`, `LanguageSwitcher`, `CookieConsent`, `LegalModal`.
- **Sin servicios externos:** Todo funciona en el navegador con la Clipboard API.

---

## 16. Convenciones y Patrones de Código

### Reglas generales
- **Todo componente React** se exporta como `export const` o `export default` (named export para componentes principales, default export para las herramientas).
- **Los slugs de herramientas** siempre en **minúsculas** y una sola palabra (ej. `clipy`, `pastesnap`, `formatflow`).
- **Las IDs de proyectos** en `MOCK_PROJECTS` son strings numéricos secuenciales (`'1'`, `'2'`, `'3'`, ...).
- **Categorías de proyectos:** `Utility`, `Creative`, `Development`, `Social` (enum `ProjectCategory`).
- Los **iconos de Lucide** se referencian por nombre de string en el campo `icon` del proyecto y se mapean en `ProjectCard.tsx` → `IconMap`.
- Todas las herramientas reciben **`lang`** y **`dictionary`** como props desde la página Astro.

### Convención de nombres de archivos
- Componentes React: `PascalCase.tsx` (ej. `ClipResult.tsx`, `DropZone.tsx`).
- Servicios: `camelCase.ts` (ej. `kickService.ts`, `imageService.ts`).
- Traducciones: `lowercase.ts` (ej. `clipy.ts`, `hub.ts`).
- Componentes principales de herramientas: `PascalCase.tsx` con el nombre de la herramienta (ej. `Clipy.tsx`, `Twitchbolt.tsx`).

---

## 17. Deployment y Hosting

### Plataforma de hosting

El sitio se aloja en **Hostinger** con un servidor **Apache**. El despliegue se realiza subiendo la carpeta `/dist` generada por `npm run build`.

### Proceso de despliegue

```bash
# 1. Build de producción
npm run build

# 2. (Opcional) Previsualizar en local para confirmar que todo funciona
npm run preview

# 3. Subir el contenido de /dist al servidor de Hostinger
#    (normalmente a la carpeta public_html/ mediante FTP o el file manager de Hostinger)
```

### Generación de páginas estáticas (SSG)

Astro genera **TODAS** las combinaciones de idioma + herramienta en tiempo de build usando `getStaticPaths()`. Esto significa:
- **9 idiomas × 5 herramientas = 45 páginas de herramientas**
- **9 páginas del hub** (`/en/`, `/es/`, `/fr/`, etc.)
- **9 × 4 páginas legales = 36 páginas** (privacy, terms, cookies, about por idioma)
- **1 página 404 + 1 página de redirección raíz**
- **Total aproximado: ~92 páginas HTML estáticas**

Cada página es un archivo `.html` independiente que no requiere servidor Node.js para funcionar.

---

## 18. Configuración del Servidor Apache (.htaccess)

El archivo `public/.htaccess` es **crítico** para el funcionamiento del sitio en producción. Contiene:

### Redirecciones

| Regla | Qué hace |
| :--- | :--- |
| **HTTPS + no-www** | Redirige `http://` y `www.` a `https://olovetools.com` en un solo salto (301 permanente). |
| **Detección de idioma del servidor** | Cuando el usuario accede a `/` (raíz), el servidor detecta el header `Accept-Language` del navegador y redirige a `/{idioma}/` con un código 302 temporal. Esto es más rápido que el redirect JavaScript de `pages/index.astro` y mejor para el SEO (evita el warning "Client-side redirect" de PageSpeed). |

### Rendimiento (WPO)

| Regla | Qué hace |
| :--- | :--- |
| **GZIP/Deflate** | Comprime HTML, CSS, JS, JSON, SVG y fuentes WOFF2 para reducir el tamaño de transferencia. |
| **Cache-Control** | Assets estáticos (imágenes, JS, CSS, fuentes): caché de **1 año** con flag `immutable`. Archivos HTML: `no-cache` para que siempre se descarguen frescos. |
| **MIME Types** | Declara explícitamente los tipos de fuentes WOFF2, imágenes WebP y SVG. |

### Seguridad

| Cabecera | Qué protege |
| :--- | :--- |
| `X-Frame-Options: SAMEORIGIN` | Impide que otros sitios incrusten tu web en un `<iframe>` (anti-clickjacking). |
| `X-Content-Type-Options: nosniff` | Evita que el navegador "adivine" el tipo MIME de archivos (previene inyecciones). |
| `Strict-Transport-Security (HSTS)` | Fuerza HTTPS a nivel de navegador durante 1 año (mejora la puntuación de Lighthouse). |
| `Referrer-Policy` | Controla qué información de URL se envía al navegar a sitios externos. |
| `Cross-Origin-Opener-Policy` | Aísla las ventanas del navegador para proteger contra ataques de canal lateral. |
| `Options -Indexes` | Bloquea la visualización de listados de archivos de directorios. |
| `FilesMatch "^\."` | Bloquea el acceso a archivos ocultos como `.git`, `.env`, `.htaccess`. |

### Página 404

```apache
ErrorDocument 404 /404.html
```

> **IMPORTANTE para IAs:** El `.htaccess` tiene una **doble capa de detección de idioma**: primero el servidor Apache intenta redirigir según `Accept-Language`, y como respaldo, `pages/index.astro` lo hace en JavaScript del cliente con `navigator.language`. Ambos deben mantenerse sincronizados si se añade un nuevo idioma.

---

## 19. Página 404 Personalizada

El archivo `src/pages/404.astro` renderiza una página de error premium con:
- Efecto **glow** de fondo con gradiente indigo.
- Texto "Oops!" con gradiente de color blanco a gris.
- Botón "Return to oLoveTools Hub" que:
  - Lee `localStorage.olovetools_lang` para redirigir al idioma guardado del usuario.
  - Si no hay idioma guardado, redirige a `/` (que a su vez redirige al idioma del navegador).
- Incluye el `CookieBanner` para cumplir con las normativas GDPR incluso en la página de error.

---

## 20. Flujo de Datos entre Herramientas (Clipy → ClipBolt)

Existe una **conexión activa** entre **Clipy** y **ClipBolt (Twitchbolt)**:

1. En Clipy, cuando el usuario selecciona clips y pulsa "Download" / "Batch Export", se guardan los clips seleccionados en `localStorage` bajo la clave `clipbolt_shared_clips`.
2. Clipy redirige automáticamente al usuario a `/{lang}/clipbolt` (la URL de Twitchbolt).
3. ClipBolt lee `clipbolt_shared_clips` de `localStorage` y ofrece la descarga directa o extracción ZIP de esos clips.

> **IMPORTANTE:** Si se cambia el slug de `twitchbolt` o la clave de localStorage, esta integración se romperá.

---

## 21. Deuda Técnica y Problemas Conocidos

### Código duplicado

- Los componentes `CookieBanner`, `LegalModal` y `Header` están **duplicados** en varias herramientas (`clipy/components/CookieBanner.tsx`, `formatflow/components/CookieBanner.tsx`, `pastesnap/components/CookieConsent.tsx`). Cada uno tiene su propia implementación ligeramente diferente. El componente global `src/components/CookieBanner.tsx` es la versión "canónica" pero no todas las herramientas lo usan.

### Imagen OG faltante

- **No existe** `public/og-kickbolt.png`. Kickbolt intentará cargar `og-kickbolt.png` como imagen Open Graph pero devolverá un 404. Se debería crear esta imagen.

### Archivo metadata.json en la raíz

- `metadata.json` en la raíz del proyecto contiene metadatos básicos (`name`, `description`, `requestFramePermissions`). Es un archivo de configuración de Hostinger/hosting, no del código de la aplicación.

---

## 22. ✅ Checklist Rápido para Añadir una Nueva Herramienta

Versión comprimida de la Sección 9 para copiar y usar rápidamente:

```
□ 1. Crear carpeta:           src/tools/{slug}/
□ 2. Crear componente:        src/tools/{slug}/{Slug}.tsx
□ 3. Crear types (opcional):  src/tools/{slug}/types.ts
□ 4. Crear sub-componentes:   src/tools/{slug}/components/
□ 5. Crear servicio (si API): src/tools/{slug}/services/

□ 6. Registrar en constants.ts:
     → MOCK_PROJECTS (id, name, slug, description, category, tags, icon, color)
     → TOOL_FAVICONS (data URI SVG)
     → TOOL_THEME_COLORS (hex color)

□ 7. Crear traducciones × 9 idiomas:
     → src/locales/{en,es,fr,de,pt,ru,hi,ja,zh}/{slug}.ts

□ 8. Registrar en dictionary.ts:
     → Importar los 9 archivos
     → Crear {slug}Dictionary
     → Añadir al union type del hook useTranslation
     → Añadir al condicional dictionaryObj

□ 9. Registrar en pages/[lang]/[tool]/index.astro:
     → Importar componente
     → Añadir slug al array tools[] de getStaticPaths()
     → Añadir a toolNames{}
     → Añadir condicional de renderizado {tool === '{slug}' && <.../>}
     → (Opcional) Añadir bloque <style is:inline> personalizado

□ 10. Añadir descripciones traducidas en locales/{lang}/hub.ts:
      → projects.{id}.description
      → Nuevos tags si hay

□ 11. (Opcional) Crear public/og-{slug}.png (1200×630px)
```

---

## 23. ⚠️ Errores Frecuentes al Modificar el Proyecto

### Error: "La herramienta nueva no aparece en el hub"
**Causa:** No se añadió el proyecto a `MOCK_PROJECTS` en `src/constants.ts`, o el `slug` no coincide con el nombre de la carpeta en `src/tools/`.

### Error: "La página de la herramienta nueva da 404"
**Causa:** No se añadió el slug al array `tools` dentro de `getStaticPaths()` en `pages/[lang]/[tool]/index.astro`. Astro no genera la página si no está en esa lista.

### Error: "Los textos de la herramienta salen como las claves sin traducir"
**Causa:** No se registró el diccionario de la nueva herramienta en el condicional de `useTranslation()` dentro de `dictionary.ts`. El hook devuelve el diccionario del hub por defecto si no reconoce el nombre de la herramienta.

### Error: "El favicon de la pestaña no cambia"
**Causa:** No se añadió la entrada en `TOOL_FAVICONS` en `constants.ts`. El sistema usa `TOOL_FAVICONS.default` (que es `/icon.svg`) como fallback.

### Error: "Al navegar entre herramientas el estilo del body se 'contamina'"
**Causa:** Los estilos inline `<style is:inline>` de cada herramienta en `[tool]/index.astro` usan `!important` en el `body`. Cuando Astro hace View Transitions (`ClientRouter`), puede que restos de estilos persistan. Cada bloque de estilos de herramienta debe resetear los valores del body explícitamente.

### Error: "Build falla con 'Cannot find module ./xx/newslug'"
**Causa:** Falta crear los archivos de traducción en **TODOS** los 9 idiomas. Si `dictionary.ts` importa `import es_newslug from './es/newslug'` y el archivo no existe, el build falla inmediatamente. Hay que crear los 9 archivos de idioma antes de compilar.

### Error: "El nuevo idioma no aparece en el selector"
**Causa:** Hay que tocar **4 lugares** para añadir un nuevo idioma:
1. `src/constants.ts` → array `LANGUAGES`
2. `src/types.ts` → type `LanguageCode`
3. `src/locales/dictionary.ts` → type `Language` y todos los diccionarios
4. `pages/[lang]/index.astro` y `pages/[lang]/[tool]/index.astro` → arrays de `getStaticPaths()`
5. `public/.htaccess` → regla de detección de idioma del servidor Apache

---

## 24. Archivos de Configuración Misceláneos

| Archivo | Qué es |
| :--- | :--- |
| `metadata.json` (raíz) | Metadatos básicos del proyecto para el hosting (Hostinger). Contiene `name`, `description` y `requestFramePermissions`. |
| `log.txt` (raíz) | Archivo de logs de desarrollo local. No se incluye en producción. |
| `public/ads.txt` | Archivo de verificación para Google AdSense. Contiene la línea `google.com, pub-4601581729676999, DIRECT, f08c47fec0942fa0`. |
| `public/manifest.json` | Manifest de PWA con nombre "oLoveTools Collection", start URL `/en/`, tema oscuro `#060609`. |
| `public/robots.txt` | Permite el crawling de todo el sitio y apunta al sitemap: `https://olovetools.com/sitemap-index.xml`. |
| `.gitignore` | Ignora `node_modules/`, `dist/`, `.astro/` y archivos de entorno. |
