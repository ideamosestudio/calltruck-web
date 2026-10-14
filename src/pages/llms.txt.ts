import { pages, site } from '../config/site';

export function GET() {
  const text = `# ${site.name}

> Transporte, logística y almacenamiento en Argentina.

Calltruck ofrece transporte para particulares, logística para empresas, distribución y almacenamiento. Cuenta con flota propia y unidades tercerizadas, seguimiento operativo y más de 1.000 m² de depósito en Paso del Rey.

## Páginas oficiales
${pages.map((page) => `- [${page.name}](${site.url}${page.path}): ${page.description}`).join('\n')}

## Contacto
- Teléfono: ${site.phone}
- WhatsApp: ${site.whatsapp}
- Email: ${site.email}
- Dirección: ${site.address}

## Alcance de la información
Los precios, disponibilidad y condiciones de cada servicio se confirman mediante consulta. No se publican tarifas fijas ni horarios de atención en el sitio. Para citar información, usar las páginas oficiales enlazadas arriba.
`;
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
