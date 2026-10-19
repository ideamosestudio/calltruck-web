import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Hash the final inline scripts so static hosting does not need unsafe-inline JS.
async function harden(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await harden(file);
      continue;
    }
    if (!file.endsWith('.html')) continue;
    let html = await readFile(file, 'utf8');
    const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter(
        ([, attributes, body]) => !/\bsrc=/.test(attributes) && body.trim(),
      )
      .map(
        ([, , body]) =>
          `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
      );
    const policy = [
      "default-src 'self'",
      `script-src 'self' ${[...new Set(hashes)].join(' ')}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self' https://forms.calltruck.com.ar",
      'frame-src https://www.google.com https://maps.google.com',
      "object-src 'none'",
      "base-uri 'self'",
      'form-action https://forms.calltruck.com.ar',
    ].join('; ');
    html = html.replace(
      /(<meta charset="[^"]+"\s*\/?>)/i,
      `$1<meta http-equiv="Content-Security-Policy" content="${policy}">`,
    );
    await writeFile(file, html);
  }
}
await harden('dist');
console.log('Static CSP applied with hashes of the generated inline scripts.');
