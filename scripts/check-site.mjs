import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve('dist');
const origin = 'https://calltruck.com.ar';
const base = '/';
const walk = async (dir) =>
  (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? walk(path.join(dir, entry.name))
          : path.join(dir, entry.name),
      ),
    )
  ).flat();
const files = await walk(root);
const pages = files.filter((file) => file.endsWith('index.html'));
const titles = new Set();
const checked = new Set();
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  assert(
    !/[←-⇿➔➜➝➞▶◀]/u.test(html),
    `${file}: controls use vector icons, not text arrows`,
  );
  const relative = path
    .relative(root, file)
    .replaceAll('\\', '/')
    .replace(/index\.html$/, '');
  const canonical = `${origin}${base}${relative}`;
  assert.equal(
    (html.match(/<h1[\s>]/g) || []).length,
    1,
    `${relative}: single H1`,
  );
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title && !titles.has(title), `${relative}: unique title`);
  titles.add(title);
  assert(
    html.includes(`rel="canonical" href="${canonical}"`),
    `${relative}: canonical`,
  );
  assert(
    /name="description" content="[^"]+"/.test(html),
    `${relative}: description`,
  );
  const json = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  )?.[1];
  assert(
    JSON.parse(json)['@graph'].some((item) => item['@type'] === 'Organization'),
  );
  assert(
    !/http:\/\//.test(html.replaceAll('http://www.w3.org/2000/svg', '')),
    `${relative}: no insecure URLs`,
  );
  for (const image of html.matchAll(/<img\b[^>]+>/g)) {
    assert(/\balt(?:=|\s|>)/.test(image[0]), `${relative}: image alt`);
    assert(
      /\bwidth=/.test(image[0]) && /\bheight=/.test(image[0]),
      `${relative}: image dimensions`,
    );
  }
  const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(
    (match) => match[1],
  );
  for (const [, srcset] of html.matchAll(/\bsrcset="([^"]+)"/g))
    references.push(
      ...srcset.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]),
    );
  for (const reference of references) {
    const url = new URL(reference.replaceAll('&amp;', '&'), `${origin}${base}`);
    if (url.origin !== origin || !url.pathname.startsWith(base)) continue;
    const target = path.join(
      root,
      decodeURIComponent(url.pathname.slice(base.length)),
      url.pathname.endsWith('/') ? 'index.html' : '',
    );
    if (checked.has(target)) continue;
    await access(target).catch(() => {
      throw new Error(`${relative}: missing ${url.pathname}`);
    });
    checked.add(target);
  }
}
assert.equal(pages.length, 7);
assert(
  (await readFile(path.join(root, 'sitemap-0.xml'), 'utf8')).includes(
    `${origin}${base}contacto/`,
  ),
);
assert(
  (await readFile(path.join(root, 'llms.txt'), 'utf8')).includes(
    'info@calltruck.com.ar',
  ),
);
console.log(
  `Verified ${pages.length} pages, SEO metadata, structured data, image dimensions and ${checked.size} local resources.`,
);
