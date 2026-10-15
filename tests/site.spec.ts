import { test, expect } from '@playwright/test';
import { pages, site } from '../src/config/site';

for (const width of [320, 390, 1366]) {
  for (const route of pages) {
    test(`${route.name} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(route.path || './');
      await expect(page.locator('body')).toHaveClass(/is-loaded/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('#consulta form')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${site.url}${route.path}`,
      );
      const schema = await page
        .locator('script[type="application/ld+json"]')
        .textContent();
      expect(JSON.parse(schema!)['@graph']).toBeTruthy();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      expect(overflow).toBe(false);
      const hero = page.locator('.hero img').first();
      await expect(hero).toHaveJSProperty('complete', true);
      expect(
        await hero.evaluate((img: HTMLImageElement) => img.naturalWidth),
      ).toBeGreaterThan(0);
      expect(await hero.getAttribute('srcset')).toBeTruthy();
      if (width < 980) {
        await page
          .getByRole('button', { name: 'Abrir menú', exact: true })
          .click();
        await expect(page.locator('main')).toHaveAttribute('inert', '');
        await expect(page.locator('[data-menu]')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('main')).not.toHaveAttribute('inert', '');
        await page.locator('.footer-premium').scrollIntoViewIfNeeded();
        const toggle = page.locator('[data-footer-toggle]').first();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#footer-explore')).toBeVisible();
      }
      expect(errors).toEqual([]);
    });
  }
}

test('slider loads additional images only on demand', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.hero-slides > img')).toHaveCount(1);
  await page.getByRole('button', { name: 'Ver imagen 3', exact: true }).click();
  await expect(page.locator('[data-slide="2"]')).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(page.locator('.hero-slides > img')).toHaveCount(2);
  await expect(page.locator('.hero-slide.is-active')).toHaveJSProperty(
    'complete',
    true,
  );
});

test('contact anchor and native form validation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('contacto/');
  await page
    .getByRole('link', { name: 'Enviar una consulta', exact: true })
    .click();
  await expect(page).toHaveURL(/\/contacto\/#consulta$/);
  await page.locator('#contact-email').fill('not-an-email');
  expect(
    await page
      .locator('form')
      .evaluate((form: HTMLFormElement) => form.checkValidity()),
  ).toBe(false);
  await expect(page.locator('.floating-wa')).not.toBeVisible();
});

test('content and navigation remain available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/calltruck-web/');
  await expect(page.locator('.page-loader')).not.toBeVisible();
  await expect(page.locator('h1')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-menu]')).toBeVisible();
  await expect(page.locator('#footer-explore')).toBeVisible();
  await context.close();
});

test('gray accent replaces stored preview colors', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('calltruck-accent', 'blue'),
  );
  await page.goto('./');
  await expect(
    page.getByRole('button', { name: 'Personalizar color del sitio' }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim(),
    ),
  ).toBe('#a7adb5');
  expect(
    await page.evaluate(() => localStorage.getItem('calltruck-accent')),
  ).toBeNull();
});

test('contact intro stays pinned while the form scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 607 });
  await page.goto('contacto/');
  const intro = page.locator('.contact-panel__intro');
  const grid = page.locator('.contact-panel__grid');
  const start = await grid.evaluate(
    (el) => el.getBoundingClientRect().top + scrollY,
  );
  await page.evaluate((y) => {
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, y);
  }, start);
  await expect(intro).toHaveCSS('position', 'sticky');
  const before = await intro.boundingBox();
  const formBefore = await page.locator('form').boundingBox();
  await page.evaluate(() => scrollBy(0, 100));
  await expect
    .poll(async () => (await intro.boundingBox())!.y)
    .toBeCloseTo(before!.y, 0);
  expect((await page.locator('form').boundingBox())!.y).toBeLessThan(
    formBefore!.y - 90,
  );
  expect(before!.y + before!.height).toBeLessThan(607);
});
