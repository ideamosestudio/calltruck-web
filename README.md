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

## Color destacado

El acento definitivo es gris #A7ADB5. El selector de pruebas fue retirado y las preferencias anteriores del navegador se descartan. Los logos de marca conservan sus colores.

## Habilitaciones y marcas

El bloque compartido al final de las páginas refleja las habilitaciones indicadas por el cliente. El cliente confirmó expresamente ISTA Certified Laboratory, diferenciándolo de la iniciativa aduanera ISTA. No se publican números de registro, vencimientos ni alcances no proporcionados.

Los archivos originales de los logos se conservan en `public/images/credentials`:

- SEDRONAR: https://www.sanrafael.gov.ar/wp-content/uploads/2024/07/sedronar-logo.png (fuente municipal).
- RENPRE: https://marpaq.com.ar/wp-content/uploads/2025/12/Logo-Renpre.png.
- SENASA: https://marpaq.com.ar/wp-content/uploads/2025/12/Logo-Senasa.png.
- PCRMA: https://tfaster.com.ar/wp-content/uploads/2020/04/certificado-pcrma.png. Identidad contrastada con el Programa de Cuidado Responsable de CIQyP: https://www.ciqyp.org.ar/.
- ISTA: https://www.ten-e.com/wp-content/uploads/2026/08/ISTA-1024x329.png (marca ISTA; variante de certificación confirmada por el cliente).

La presentación aplica escala de grises por CSS y recupera el color original al pasar el cursor. Los tamaños se compensan por marca, sin deformar las proporciones.

Actualizar este bloque si el cliente informa cambios en sus habilitaciones. Los logos identifican las entidades; no sustituyen la documentación de Calltruck.

## Optimización de octubre de 2026

Las portadas se sirven en AVIF con variantes responsivas; el resto de las fotografías mantiene WebP. En dispositivos táctiles el slider comienza pausado para evitar descargar fotografías adicionales sin interacción. El indicador de carga no bloquea la lectura del contenido.

Los logos de clientes son PNG transparentes optimizados y siempre grises, con rutas versionadas para evitar caché antigua. Se retiraron las versiones que ya no se utilizaban. Fuentes de los reemplazos: Cachamai (cachamai.com.ar), TML (tmlogistica.com.ar), Toshin (toshingroup.com), Violetta (violettacosmeticos.com) y Andreani (vector publicado por Red Hat en su caso de éxito). Locksley y LIT conservan los archivos aportados por el cliente.

El contenido principal está en HTML estático, con metadatos, sitemap y JSON-LD de organización, servicios, páginas de empresa y contacto. llms.txt resume datos verificables y enlaza a las páginas; no garantiza indexación ni aparición en respuestas de IA.
