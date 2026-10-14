# Calltruck

Sitio estático en Astro, publicado en https://ideamosestudio.github.io/calltruck-web/.

## Desarrollo y validación

Node 24 LTS y pnpm 12.11.2 (misma versión que CI).

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm format:check
pnpm audit:security
pnpm build
pnpm check:site
pnpm test
```

Las pruebas usan Chrome instalado localmente. En CI se instala Chromium con Playwright. No envían formularios ni mensajes. El workflow publica solo después de compilar y validar.

## Estructura

- `src/pages`: siete páginas y el endpoint estático `llms.txt`.
- `src/components/SiteImage.astro`: imágenes responsivas optimizadas durante el build.
- `src/components/HeroBackdrop.astro`: foto animada y degradado fijo.
- `src/components/SEO.astro`: canonical, Open Graph, Twitter y JSON-LD.
- `src/config/site.ts`: identidad, URL pública y descripción de páginas para metadatos y asistentes.
- `src/assets/images`: originales utilizados. El build elimina las copias originales generadas que no se usan en el resultado público.
- `public`: favicon, logos, iconos y archivos sin procesamiento.
- `scripts`: validación de salida y política de seguridad para HTML estático.
- `tests`: navegación, imágenes, formularios, SEO, responsive y funcionamiento sin JavaScript.

Las imágenes secundarias del slider se cargan al seleccionarlas; las de contenido usan lazy loading. No agregar fotos de archivo o pruebas a `public`: todo su contenido se publica. Los originales retirados siguen disponibles en Git.

## SEO e IA

La información principal llega en HTML estático. Cada página tiene título, descripción y canonical propios; los datos estructurados describen la organización, el sitio, las páginas y los servicios, sin inventar horarios, tarifas o reseñas. `llms.txt` es un índice complementario, no una garantía de indexación o aparición en respuestas de IA.

GitHub Pages aloja este proyecto en una subcarpeta. Los robots consultan **el robots.txt de la raíz del dominio**, no `/calltruck-web/robots.txt`. El archivo incluido queda listo para un alojamiento propio; para aplicar reglas al dominio compartido debe gestionarse su raíz. El sitemap también se enlaza desde el HTML. Search Console requiere acceso y verificación del propietario.

Si cambia el dominio, actualizar `astro.config.mjs`, `src/config/site.ts`, el destino de éxito del formulario y `public/robots.txt` juntos.

## Seguridad y mantenimiento

El sitio publicado no ejecuta Node ni un backend propio. El build incorpora CSP con hashes para los scripts inline, restringe orígenes de formularios y frames y no permite plugins. GitHub Pages controla los headers HTTP; políticas como HSTS o `frame-ancestors` necesitan configuración del hosting y no se reemplazan con una etiqueta meta.

El formulario depende de FormSubmit, con honeypot, CAPTCHA y límites de longitud. La activación del correo y la entrega final deben verificarse con el propietario; la validación local no envía emails. La validación del navegador no sustituye los controles del proveedor.

`pnpm audit` verifica avisos conocidos, no demuestra ausencia absoluta de vulnerabilidades. `esbuild` tiene un override a la rama corregida 0.28 por GHSA-g7r4-m6w7-qqqr; retirarlo cuando la dependencia de Astro/Vite ya resuelva una versión corregida. Dependabot revisa semanalmente paquetes y acciones. Las acciones de despliegue se fijan a SHA y los permisos de publicación se limitan al job de despliegue.

No guardar secretos en el repositorio. Los `.env`, dependencias, artefactos y reportes locales están ignorados. Para una medición reproducible de rendimiento, usar Lighthouse sobre el mismo entorno y dispositivo, sin ejecutar otras pruebas en paralelo. Sus puntuaciones son de laboratorio, no métricas reales de visitantes.

## Vista previa de color

La pestaña del margen derecho permite probar cinco acentos. La selección se guarda solo en localStorage del navegador y puede restablecerse al naranja original. Los logos de marca conservan sus colores. El panel se cierra con Escape o al tocar fuera y permanece oculto al abrir el menú mobile.
