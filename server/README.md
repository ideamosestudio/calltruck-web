# Correo directo desde el hosting

El sitio estático se publica en GitHub Pages. El subdominio HTTPS
`forms.calltruck.com.ar` ejecuta `contact.php` usando el correo local de cPanel,
con destinatario fijo `info@calltruck.com.ar`, sin intermediarios ni contraseñas
de correo dentro del frontend.

## Instalación

Copiar `contact.php` y las reglas de `.htaccess` a
`/home3/calltruckcpanel/public_html/forms.calltruck.com.ar`.
Conservar el bloque del manejador PHP generado por cPanel al actualizar
`.htaccess`. `harden-account.sh` aplica esta combinación y límites de PHP,
con copias previas privadas. La cuenta usa `ea-php85`.
PHP crea su estado privado en `/home3/calltruckcpanel/.calltruck-forms`.
No publicar esa carpeta ni incorporarla al repositorio.

El endpoint exige un origen permitido, token firmado de un solo uso, validación
de campos y un campo trampa. Limita los envíos a 5 por IP por hora y 100 globales
por hora. También limita a 40 solicitudes por IP cada 10 minutos, incluyendo
tokens e intentos inválidos, y mantiene un máximo de 2000 contadores activos.
Solo admite JSON desde los orígenes HTTPS del dominio definitivo.
Un HTTP 200 confirma aceptación por el agente de correo local;
verificar la entrega en Track Delivery o en la casilla receptora.

## Respaldo y dominio

Respaldo inicial del 19/10/2026 guardado fuera de `public_html`, en
`/home3/calltruckcpanel/calltruck-backups/calltruck-site-2026-10-19.zip`.
Incluye fuentes, archivos públicos, compilación y endpoint. No es todavía
un respaldo automático ni incluye correos de la casilla.

El dominio principal sirve desde GitHub Pages con HTTPS.
`mail.calltruck.com.ar` apunta al hosting y el MX usa ese nombre.
SPF y DKIM se verificaron válidos; el enrutamiento es local.
DMARC permanece en observación: no endurecerlo sin inventariar todos los
emisores legítimos y revisar informes de autenticación.

El firewall ModSecurity está habilitado en ambos dominios. Los destinatarios
inexistentes se rechazan durante SMTP. El proveedor tiene deshabilitada la
función de clasificación antispam de cPanel: se necesita habilitación de
Nuthost para activar cuarentena de correo entrante. No habilitar borrado
automático de mensajes sospechosos.

## Validación local

`npm run build`, `npm run check:site` y `npm test -- tests/contact.spec.ts`.
Las pruebas del formulario interceptan las solicitudes: no envían correos.
`php scripts/test-contact.php` ejecuta 16 comprobaciones del endpoint con
estado temporal y transporte de correo simulado. Nunca usa el estado real.

## Límites de la plataforma

GitHub Pages administra TLS y caché del sitio estático. No aplica `.htaccess`
ni permite configurar cabeceras HTTP arbitrarias. La CSP del HTML usa hashes
de scripts; las cabeceras del endpoint se gestionan en cPanel.
El sistema operativo, Exim, nginx/Apache y las reglas del firewall del servidor
compartido son responsabilidad del proveedor. La auditoría de dependencias
no certifica ausencia absoluta de vulnerabilidades.
