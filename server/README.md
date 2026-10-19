# Correo directo desde el hosting

El sitio estático se publica en GitHub Pages. El subdominio HTTPS
`forms.calltruck.com.ar` ejecuta `contact.php` usando el correo local de cPanel,
con destinatario fijo `info@calltruck.com.ar`, sin intermediarios ni contraseñas
de correo dentro del frontend.

## Instalación

Copiar únicamente `contact.php` y `.htaccess` a
`/home3/calltruckcpanel/public_html/forms.calltruck.com.ar`.
PHP crea su estado privado en `/home3/calltruckcpanel/.calltruck-forms`.
No publicar esa carpeta ni incorporarla al repositorio.

El endpoint exige un origen permitido, token firmado de un solo uso, validación
de campos y un campo trampa. Limita los envíos a 5 por IP por hora y 100 globales
por hora. Un HTTP 200 confirma aceptación por el agente de correo local;
verificar la entrega en Track Delivery o en la casilla receptora.

## Respaldo y migración

Respaldo inicial del 19/10/2026 guardado fuera de `public_html`, en
`/home3/calltruckcpanel/calltruck-backups/calltruck-site-2026-10-19.zip`.
Incluye fuentes, archivos públicos, compilación y endpoint. No es todavía
un respaldo automático ni incluye correos de la casilla.

Antes de apuntar el dominio principal a GitHub Pages, separar el correo del
registro A principal: `mail.calltruck.com.ar` debe apuntar al hosting y el MX a
ese nombre. Conservar y comprobar SPF, DKIM, DMARC y el enrutamiento local.
Después actualizar la configuración de dominio/base de Astro y GitHub Pages,
recompilar y verificar HTTPS, recursos y formulario en el dominio definitivo.

## Validación local

`npm run build`, `npm run check:site` y `npm test -- tests/contact.spec.ts`.
Las pruebas del formulario interceptan las solicitudes: no envían correos.
