# oLoveTools 🚀 — Catálogo de Herramientas y Roadmap

¡Bienvenido al mapa de ruta y catálogo de **oLoveTools**! Este documento detalla todas las herramientas implementadas en el ecosistema, organizadas por categoría, y plantea ideas futuras para expandir el sitio según su potencial de tráfico orgánico (SEO), retención de usuarios, rentabilidad de anuncios (CPC) y facilidad de desarrollo 100% local (sin costes de servidor).

**Última actualización:** Junio 2026 — **55 herramientas implementadas** en 9 idiomas.

---

## 🛠️ Herramientas Actuales (55 Implementadas)

### 🎬 Video & Clips (3)
| Herramienta | Ruta | Descripción | Tecnologías |
| :--- | :--- | :--- | :--- |
| **Clipy** 🎬 | `/clipy` | Buscador y organizador avanzado de clips y vídeos. | React, APIs de búsqueda. |
| **ClipBolt (Twitch)** ⚡ | `/twitchbolt` | Descargador rápido de clips de Twitch en MP4 de alta calidad. | Twitch API y descarga directa. |
| **ClipBolt (Kick)** 🟢 | `/kickbolt` | Descargador rápido de clips de la plataforma Kick. | Kick API y descarga directa. |

### 🔄 Conversores y Formateadores (9)
| Herramienta | Ruta | Descripción | Tecnologías |
| :--- | :--- | :--- | :--- |
| **FormatFlow** 🔄 | `/formatflow` | Conversor y formateador de archivos seguro. | Conversión local en navegador. |
| **URL-Bolt** 🌐 | `/url-bolt` | Codificador/decodificador de URL con desglose de anatomía. | `encodeURIComponent`, DOM Parser. |
| **Base64-Bolt** 🔠 | `/base64-bolt` | Codificador/decodificador Base64 + conversión de imágenes a DataURL. | `btoa`/`atob`, FileReader. |
| **SQL-Flow** 🛢️ | `/sql-flow` | Formateador y validador de consultas SQL. | Regex-based formatter. |
| **XML-JSON** 🔄 | `/xml-json` | Conversor bidireccional entre XML y JSON. | DOMParser, string building. |
| **Binary-Flow** 🔢 | `/binary-flow` | Conversor entre sistemas binario, octal, decimal y hexadecimal. | `bigint` para números grandes. |
| **UnitFlow** 📏 | `/unitflow` | Conversor universal de unidades (longitud, peso, temperatura, etc.). | Factores de conversión locales. |
| **Subtitles-Bolt** 💬 | `/subtitles-bolt` | Conversor entre formatos de subtítulos SRT, VTT y SBV. | Parsing/reformateo de texto. |
| **Aspect-Ratio** 📐 | `/aspect-ratio` | Calculadora de proporciones y resoluciones. | Algoritmo GCD. |

### 🎨 Visual & Diseño (7)
| Herramienta | Ruta | Descripción | Tecnologías |
| :--- | :--- | :--- | :--- |
| **CompressSnap** 📉 | `/compresssnap` | Compresor y optimizador inteligente de imágenes. | React, compresión local. |
| **Background Remover** 🖼️ | `/backgroundremover` | Eliminación de fondos de imágenes usando IA local. | React, ONNX / Transformers.js. |
| **CropSnap** ✂️ | `/cropsnap` | Recortador y redimensionador rápido de imágenes. | React, Canvas API. |
| **CSS-Designer** 🎨 | `/css-designer` | Diseñador visual de efectos CSS modernos. | React, Tailwind y Canvas local. |
| **ColorSnap** 🎨 | `/colorsnap` | Extractor de paletas de colores desde imágenes. | Canvas API, color quantization. |
| **Hex-to-RGB** 🌈 | `/hex-to-rgb` | Conversor entre HEX, RGB, HSL y CMYK. | Math conversiones manuales. |
| **SVG-Optimizer** 📐 | `/svg-optimizer` | Optimizador y minificador de código SVG. | React, DOMParser y XMLSerializer local. |

### 📄 Documentos & Archivos (4)
| Herramienta | Ruta | Descripción | Tecnologías |
| :--- | :--- | :--- | :--- |
| **PDF-Flow** 📄 | `/pdf-flow` | Herramienta todo en uno para PDF. | React, pdf-lib local. |
| **Zip-Flow** 📦 | `/zip-flow` | Compresor/extractor de archivos ZIP con explorador. | React, JSZip. |
| **Favicon-Bolt** 🎨 | `/favicon-bolt` | Generador de paquete completo de favicons. | React, compilador binario ICO. |
| **EXIF-Clear** 🛡️ | `/exif-clear` | Inspección y eliminación de EXIF/GPS. | React, ArrayBuffer header segment. |

### 📝 Texto & Código (8)
| Herramienta | Ruta | Descripción | Tecnologías |
| :--- | :--- | :--- | :--- |
| **WordFlow** ✍️ | `/wordflow` | Contador avanzado de palabras + análisis de legibilidad. | React, ARI heuristics. |
| **Markdown-Live** 📝 | `/markdown-live` | Editor Markdown visual en tiempo real. | React, regex GFM parser. |
| **Hash-Bolt** 🔑 | `/hash-bolt` | Calculadora de hashes criptográficos. | Web Crypto API + MD5 local. |
| **Regex-Flow** 🔍 | `/regex-flow` | Probador y visualizador de expresiones regulares. | React, parser local. |
| **JSON-Flow** 🗂️ | `/json-flow` | Validador/formateador/conversor JSON. | React, renderizado local. |
| **HTML-Sanitizer** 🧹 | `/html-sanitizer` | Limpiador y desinfectador de HTML. | DOMParser, sandbox iframe. |
| **Cron-Flow** 📅 | `/cron-flow` | Generador y traductor de expresiones Cron. | Parser propio + Intl. |
| **List-Mixer** 🔀 | `/list-mixer` | Ordenador, mezclador y deduplicador de listas. | Operaciones de array nativas. |

### 🛠️ Productividad & Utilidades (12)
| Herramienta | Ruta | Descripción | Tecnologías |
| :--- | :--- | :--- | :--- |
| **CodeCard** 💻 | `/codecard` | Conversor de código a imágenes estéticas. | React, html-to-image. |
| **SocialBolt** ⚡ | `/socialbolt` | Descargador de TikTok/Reels/Shorts sin marca de agua. | React, API de TikWM y Cobalt. |
| **TTS-Bolt** 🗣️ | `/tts-bolt` | Convertidor de texto a voz con descarga MP3. | React, Web Speech API. |
| **GIF-Bolt** 👾 | `/gif-bolt` | Creador y optimizador de GIFs animados. | React, gifshot, frame extraction. |
| **AudioSnap** 🎙️ | `/audiosnap` | Grabadora y recortadora de audio de micrófono. | React, Web Audio API. |
| **DrawSnap** ✏️ | `/drawsnap` | Pizarra digital interactiva y dibujo vectorial. | React, Canvas API. |
| **DiffSnap** 🔍 | `/diffsnap` | Comparador de textos con visualización de diferencias. | React, algoritmo LCS Myers. |
| **Watermark-Snap** 🏷️ | `/watermark-snap` | Marcas de agua en lote sobre imágenes. | React, Canvas drawing engine. |
| **Meme-Bolt** 🎭 | `/meme-bolt` | Creador de memes con plantillas y stickers. | React, Canvas + SVG templates. |
| **PasteSnap** 📸 | `/pastesnap` | Compartir capturas pegando desde portapapeles. | Clipboard API, descarga local. |
| **QR-Bolt** 📱 | `/qr-bolt` | Generador de códigos QR personalizados. | React, canvas local. |
| **UUID-Generator** 🆔 | `/uuid-generator` | Generador de UUIDs v4 y v5 en lote. | `crypto.randomUUID` + Web Crypto SHA-1. |
| **Lottie-Viewer** 🎬 | `/lottie-viewer` | Reproductor e inspector de animaciones Lottie. | React, lottie-web local. |
| **Graph-Flow** 📊 | `/graph-flow` | Creador de gráficos desde CSV o datos manuales. | React, Canvas2D rendering. |

### ⏰ Tiempo & Productividad (4)
| Herramienta | Ruta | Descripción | Tecnologías |
| :--- | :--- | :--- | :--- |
| **RecordSnap** 🎥 | `/recordsnap` | Grabadora de pantalla y webcam. | React, MediaRecorder API. |
| **Epoch-Flow** ⏰ | `/epoch-flow` | Conversor Unix Epoch ↔ fecha humana. | `Date` API, ISO 8601. |
| **Time-Bolt** 🗺️ | `/time-bolt` | Conversor de zonas horarias + meeting planner. | `Intl.DateTimeFormat`. |
| **Device-Test** 🎙️ | `/device-test` | Test de webcam, micrófono e información del sistema. | getUserMedia, AudioContext. |

### 🔒 Seguridad & Privacidad (2)
| Herramienta | Ruta | Descripción | Tecnologías |
| :--- | :--- | :--- | :--- |
| **PassBolt** 🔑 | `/passbolt` | Generador de contraseñas + analizador de entropía. | `crypto.getRandomValues`. |
| **Whois-Bolt** 🔍 | `/whois-bolt` | Consulta DNS via DNS over HTTPS. | Google DoH API (`dns.google`). |

### 🎲 Generadores & Texto Creativo (3)
| Herramienta | Ruta | Descripción | Tecnologías |
| :--- | :--- | :--- | :--- |
| **Lorem-Flow** ✍️ | `/lorem-flow` | Generador de texto Lorem Ipsum. | Word pool algorítmico. |
| **Key-Doctor** ⌨️ | `/key-doctor` | Detector de eventos de teclado JavaScript. | Event listeners. |
| **Whiteboard-Flow** 📌 | `/whiteboard-flow` | Pizarra Kanban con drag & drop. | HTML5 DnD, localStorage. |
| **Morse-Flow** 📻 | `/morse-flow` | Codificador/decodificador de código Morse con audio. | Web Audio API (sine tones). |

---

## 📊 Resumen del Catálogo

| Categoría | Cantidad |
| :--- | :---: |
| 🎬 Video & Clips | 3 |
| 🔄 Conversores y Formateadores | 9 |
| 🎨 Visual & Diseño | 7 |
| 📄 Documentos & Archivos | 4 |
| 📝 Texto & Código | 8 |
| 🛠️ Productividad & Utilidades | 14 |
| ⏰ Tiempo & Productividad | 4 |
| 🔒 Seguridad & Privacidad | 2 |
| 🎲 Generadores & Creatividad | 4 |
| **TOTAL** | **55** |

**Idiomas soportados:** 9 (en, es, fr, de, pt, ru, hi, ja, zh)
**Cobertura SEO:** JSON-LD Schema.org, Open Graph, hreflang, FAQ, sitemap dinámico.

---

## 🔮 Roadmap: Futuras Mejoras

Todas las ideas del roadmap original han sido implementadas. Las siguientes son expansiones de capacidades transversales:

### 🚀 Fase 6: Mejoras Transversales
- [ ] **PWA completa** — Service Worker + manifest para instalación nativa
- [ ] **Sistema de favoritos** — localStorage para marcar herramientas favoritas en el hub
- [ ] **Búsqueda global** — Buscador en el hub con fuzzy matching
- [ ] **Modo oscuro/claro** — Toggle global (actualmente todas las herramientas son dark)
- [ ] **Historial de acciones** — Últimas acciones por herramienta (localStorage)
- [ ] **Sistema de atajos de teclado** — Shortcuts para power users
- [ ] **Sharing social** — Botones para compartir resultados en Twitter/LinkedIn
- [ ] **Blog/Changelog** — Documentar cada nueva herramienta y cambio

### 🌐 Fase 7: Expansión Internacional
- [ ] Traducciones completas a idiomas adicionales (árabe, portugués brasileño, turco, vietnamita, polaco)
- [ ] Variantes regionales (es-MX vs es-ES, fr-CA, etc.)
- [ ] Soporte RTL para árabe y hebreo

### 🧪 Fase 8: Herramientas Avanzadas (Ideas nuevas)
- [ ] **DiffSnap Pro** — Comparar imágenes lado a lado
- [ ] **CodeCard Pro** — Más temas, syntax highlighting
- [ ] **PDF-Flow Pro** — OCR básico con Tesseract.js
- [ ] **Regex-Flow Pro** — Generación automática de regex con IA
- [ ] **Chart-Flow** — Dashboard interactivo con múltiples gráficos
- [ ] **Note-Flow** — Markdown + bloqueo de notas cifradas
- [ ] **Color-Palette-Generator** — Generador de paletas desde teoría del color

---

## 📈 Métricas del Proyecto

| Métrica | Valor |
| :--- | :--- |
| Herramientas totales | 55 |
| Idiomas soportados | 9 |
| Líneas de código (estimado) | ~50,000+ |
| Errores de TypeScript | 0 |
| Vulnerabilidades de seguridad | 0 conocidas (auditoría pendiente) |
| Cobertura de tests | Pendiente de implementación |
| Tiempo de build | < 30 segundos |

---

## 🔧 Mantenimiento

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
node scripts/generate-tool.mjs --slug=NUEVA-TOOL --name="Nombre" --color=emerald --icon=Icon
```

### Cómo Añadir una Nueva Herramienta
1. Usar el script generador: `node scripts/generate-tool.mjs --slug=nombre --name="Nombre" --color=emerald --icon=IconName`
2. Implementar la lógica en `src/tools/{slug}/{ComponentName}.tsx`
3. Añadir entradas en `src/locales/{lang}/{slug}.ts` (9 idiomas)
4. Verificar compilación: `npx astro check`
5. Probar en el navegador en `http://localhost:4321/{lang}/{slug}`

### Convenciones de Código
- Componentes en PascalCase (ej: `UrlBolt.tsx`)
- Carpetas en kebab-case (ej: `url-bolt/`)
- Variables internas en camelCase (ej: `urlboltDictionary`)
- Colores temáticos por herramienta definidos en `src/constants.ts`
- Cada herramienta usa el mismo patrón: Header + main + Footer + 3 LegalModals
