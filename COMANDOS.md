# 🛠️ Comandos Útiles para el Desarrollo y Optimización de oLoveTools

Este documento contiene una recopilación de comandos útiles para auditar, optimizar, limpiar y depurar la aplicación. Están organizados por categoría y ordenados por importancia dentro de cada una. La mayoría se ejecutan con `npx` (que descarga y ejecuta la herramienta temporalmente sin instalarla globalmente).

---

## 📋 Tabla Rápida de Referencia

| Comando | ¿Qué hace en 1 frase? |
| :--- | :--- |
| `npm run dev` | Lanza el servidor de desarrollo en http://localhost:4321 |
| `npm run build` | Compila el sitio estático completo en la carpeta `/dist` |
| `npm run preview` | Sirve el build de producción en local para testearlo |
| `npx astro check` | Detecta errores de TypeScript y Astro antes de compilar |
| `npx unlighthouse --site <url>` | Audita SEO + rendimiento de TODAS las páginas del sitio |
| `npx depcheck` | Encuentra paquetes no usados o faltantes en package.json |
| `npx prettier --write .` | Formatea todo el código del proyecto automáticamente |
| `npm audit` | Escanea vulnerabilidades de seguridad en las dependencias |
| `npx react-doctor@latest` | Diagnostica problemas comunes en componentes React |
| `npx bundlephobia <paquete>` | Muestra el peso de un paquete npm antes de instalarlo |

---

## 🔧 1. Comandos Básicos del Proyecto

### Servidor de desarrollo
```bash
npm run dev
```
Levanta Astro en modo desarrollo con hot-reload en `http://localhost:4321`. Todos los cambios en archivos `.astro`, `.tsx`, `.ts` y `.css` se reflejan al instante sin recargar la página.

### Build de producción
```bash
npm run build
```
Genera el sitio estático completo en la carpeta `/dist`. Astro crea **~92 archivos HTML** (9 idiomas × herramientas + páginas legales + hub + 404). Los archivos JS y CSS se hashean automáticamente para invalidar cachés.

### Preview de producción
```bash
npm run preview
```
Después de un build, levanta un servidor local idéntico a producción. Es **imprescindible** para probar las redirecciones de idioma, las rutas dinámicas y verificar que el sitemap funciona correctamente antes de subir a Hostinger.

---

## 🔍 2. Auditoría y Diagnóstico

### `npx react-doctor@latest` 🩺
* **¿Qué hace?**
  Analiza tu código React para diagnosticar problemas comunes: malas prácticas, problemas de rendimiento latentes, uso incorrecto de Hooks (como dependencias faltantes en `useEffect`) y discrepancias en las versiones de React.
* **¿Para qué sirve en oLoveTools?**
  Ideal para pasarlo sobre carpetas como `src/tools/clipy/` o `src/tools/pastesnap/` para asegurarte de que no haya fugas de memoria ni renderizados innecesarios.

### `npx unlighthouse --site <url>` 🏠⚡
* **¿Qué hace?**
  **Escanea todo tu sitio web completo** (no solo una página). Rastrea todas las URLs, ejecuta Google Lighthouse en cada una y genera un dashboard local interactivo con puntuaciones de Rendimiento, Accesibilidad, Prácticas Recomendadas y SEO.
* **¿Para qué sirve en oLoveTools?**
  Como el sitio tiene soporte multiidioma con muchas subpáginas (`/es/clipy`, `/en/twitchbolt`, etc.), este comando permite auditar absolutamente todo de una sola vez.
* **Ejemplos de uso:**
  ```bash
  # En desarrollo local (después de npm run dev)
  npx unlighthouse --site http://localhost:4321

  # En producción
  npx unlighthouse --site https://olovetools.com
  ```

### `npx astro check` ✅
* **¿Qué hace?**
  Ejecuta el verificador de tipos de Astro sobre todos los archivos `.astro` del proyecto. Detecta errores silenciosos de TypeScript, props incorrectos en componentes y sintaxis rota antes de compilar.
* **Comando:**
  ```bash
  npx astro check
  ```
* **Consejo:** Ejecútalo **siempre antes de un build** para evitar que errores sutiles lleguen a producción.

### `npx why-is-node-running` 🔎
* **¿Qué hace?**
  Si tu servidor de desarrollo o tu build se queda colgado sin terminar, este comando te muestra exactamente qué proceso o timer está manteniendo Node.js activo y no le permite cerrarse.
* **Comando:**
  ```bash
  npx why-is-node-running
  ```

---

## 📦 3. Gestión de Dependencias

### `npx depcheck` 📋
* **¿Qué hace?**
  Analiza tu código y te dice qué paquetes de `package.json` **no estás usando en ningún archivo**. También avisa si estás importando un paquete en el código pero olvidaste instalarlo.
* **Comando:**
  ```bash
  npx depcheck
  ```
* **¿Para qué sirve en oLoveTools?**
  Actualmente el proyecto tiene dependencias como `i18next` y `react-i18next` en `package.json` pero usa un sistema de traducciones personalizado (`dictionary.ts`). `depcheck` ayuda a identificar y limpiar estas dependencias huérfanas.

### `npm audit` 🛡️
* **¿Qué hace?**
  Escanea todas las dependencias (directas y transitivas) en busca de vulnerabilidades de seguridad conocidas (CVEs).
* **Comandos:**
  ```bash
  npm audit              # Muestra el informe de vulnerabilidades
  npm audit fix          # Intenta solucionar automáticamente las que pueda
  npm audit fix --force  # Fuerza actualizaciones (puede romper cosas, usar con cuidado)
  ```

### `npx npm-check-updates` (alias `ncu`) ⬆️
* **¿Qué hace?**
  Comprueba si hay versiones más recientes de todas tus dependencias y te ofrece actualizarlas automáticamente en `package.json`.
* **Comandos:**
  ```bash
  npx npm-check-updates          # Solo muestra qué se puede actualizar
  npx npm-check-updates -u       # Actualiza package.json (luego hacer npm install)
  ```

### `npx bundlephobia <nombre-paquete>` 📊
* **¿Qué hace?**
  **Antes de instalar** un nuevo paquete npm, te muestra cuánto pesa (en KB minificado + gzipped) y cuánto ralentizaría tu bundle final.
* **Ejemplo:**
  ```bash
  npx bundlephobia framer-motion   # ¿Cuánto pesa framer-motion?
  ```
* **¿Para qué sirve en oLoveTools?** Como el proyecto prioriza rendimiento client-side ($0 servidor), es crítico que cada nueva dependencia sea lo más ligera posible.

---

## 🎨 4. Calidad de Código y Formateo

### `npx prettier --write .` ✨
* **¿Qué hace?**
  Formatea automáticamente TODO el código del proyecto (tabulaciones, comillas, saltos de línea) en archivos `.ts`, `.tsx`, `.astro`, `.css`, `.json` y `.md`. Unifica el estilo visual.
* **Comando:**
  ```bash
  npx prettier --write .
  ```
* **Consejo:** Ejecútalo **antes de cada commit a Git** para mantener la consistencia del código.

### `npx eslint .` 🔍
* **¿Qué hace?**
  Linter estático para JavaScript/TypeScript. Detecta variables no usadas, imports innecesarios, código muerto y anti-patrones comunes de React.
* **Comando:**
  ```bash
  npx eslint . --ext .ts,.tsx,.astro
  ```

### `npx tsc --noEmit` 🧪
* **¿Qué hace?**
  Ejecuta el compilador TypeScript en modo verificación (sin generar archivos). Detecta errores de tipado en archivos `.ts` y `.tsx` que Astro podría no reportar.
* **Comando:**
  ```bash
  npx tsc --noEmit
  ```

---

## ⚡ 5. Rendimiento y Tamaño del Bundle

### `npx vite-bundle-visualizer` 📊
* **¿Qué hace?**
  Genera un mapa visual interactivo (treemap) de tu bundle de producción, mostrando qué dependencias y archivos ocupan más espacio. Se abre automáticamente en el navegador.
* **Comando:**
  ```bash
  npx vite-bundle-visualizer
  ```
* **¿Para qué sirve en oLoveTools?** Permite identificar si librerías como `framer-motion` o `jsPDF` están inflando demasiado el bundle de alguna herramienta y si conviene hacer code-splitting o lazy-loading.

### Medir el tamaño de la carpeta `/dist`
```bash
# En PowerShell (Windows)
Get-ChildItem -Recurse dist | Measure-Object -Property Length -Sum | Select-Object @{Name="SizeMB";Expression={[math]::Round($_.Sum/1MB, 2)}}

# Contar archivos HTML generados
(Get-ChildItem -Recurse dist -Filter *.html).Count
```

---

## 🔗 6. SEO y Enlaces

### `npx check-links` 🔗
* **¿Qué hace?**
  Analiza los archivos HTML compilados en `dist/` y comprueba que todos los enlaces internos y externos funcionen correctamente (sin 404s ni enlaces rotos).
* **Comando:**
  ```bash
  npm run build
  npx check-links dist/**/*.html
  ```

### `npx is-website-vulnerable <url>` 🛡️
* **¿Qué hace?**
  Escanea las librerías JavaScript cargadas en tu sitio web en producción y comprueba si alguna tiene vulnerabilidades de seguridad conocidas.
* **Comando:**
  ```bash
  npx is-website-vulnerable https://olovetools.com
  ```

### Comprobar cabeceras de seguridad del servidor
```bash
# En PowerShell
Invoke-WebRequest -Uri "https://olovetools.com" -Method HEAD | Select-Object -ExpandProperty Headers
```
* **¿Para qué sirve?** Verifica que las cabeceras de seguridad del `.htaccess` (HSTS, X-Frame-Options, etc.) se están aplicando correctamente en producción.

---

## 🌐 7. Monitorización y Producción

### Verificar que el sitemap es accesible
```bash
Invoke-WebRequest -Uri "https://olovetools.com/sitemap-index.xml" | Select-Object StatusCode, StatusDescription
```

### Enviar sitemap a Google Search Console (manual)
1. Ir a [Google Search Console](https://search.google.com/search-console)
2. Seleccionar la propiedad `olovetools.com`
3. En "Sitemaps" → Enviar: `https://olovetools.com/sitemap-index.xml`

### Test de velocidad online (sin comando)
* [PageSpeed Insights](https://pagespeed.web.dev/) — Test oficial de Google para rendimiento y SEO
* [GTmetrix](https://gtmetrix.com/) — Análisis detallado con cascada de carga
* [WebPageTest](https://www.webpagetest.org/) — Test avanzado desde múltiples ubicaciones

---

## 🧹 8. Limpieza y Mantenimiento

### Limpiar caché de Astro
```bash
Remove-Item -Recurse -Force .astro
npm run build
```
* **¿Cuándo usarlo?** Si el servidor de desarrollo muestra comportamientos extraños o no refleja cambios recientes. Borra la caché interna de Astro y fuerza una recompilación limpia.

### Reinstalación limpia de dependencias
```bash
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```
* **¿Cuándo usarlo?** Si `npm install` da errores de resolución de versiones o si sospechas que el `node_modules` está corrupto.

### Buscar archivos grandes innecesarios en el proyecto
```bash
Get-ChildItem -Recurse src -File | Sort-Object Length -Descending | Select-Object -First 20 FullName, @{Name="SizeKB";Expression={[math]::Round($_.Length/1KB, 1)}}
```
* **¿Para qué sirve?** Identifica los archivos más pesados del proyecto para optimizarlos o dividirlos en componentes más pequeños.

---

## 🔄 9. Git (Control de Versiones)

### Ver los últimos cambios realizados
```bash
git log --oneline -15
```

### Ver archivos modificados pendientes de commit
```bash
git status
```

### Guardar cambios rápidamente
```bash
git add .
git commit -m "descripción del cambio"
```

### Crear una nueva rama para una herramienta nueva
```bash
git checkout -b feature/compresssnap
```

### Ver diferencias antes de hacer commit
```bash
git diff --stat
```
