import { test, expect } from '@playwright/test';

test('desktop wheel eases, slows and reverses without residual movement', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1366, height: 900 },
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  await page.goto('./');
  await page
    .locator('.hero-slide.is-active img')
    .evaluate((img: HTMLImageElement) => img.decode());
  await page.mouse.move(700, 400);
  await page.evaluate(() => {
    (window as any).wheelSamples = [];
    const start = performance.now();
    const sample = () => {
      (window as any).wheelSamples.push(scrollY);
      if (performance.now() - start < 700) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(750);
  const samples = await page.evaluate(
    () => (window as any).wheelSamples as number[],
  );
  expect(new Set(samples.filter((n) => n > 0)).size).toBeGreaterThan(3);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(40);
  expect(await page.evaluate(() => scrollY)).toBeLessThanOrEqual(65);
  expect(
    Math.max(...samples.slice(1).map((n, i) => n - samples[i])),
  ).toBeLessThan(40);
  await page.mouse.wheel(0, 240);
  await page.waitForTimeout(45);
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(before);
  await context.close();
});

test('native wheel exceptions retain browser control', async ({
  browser,
  baseURL,
}) => {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1366, height: 900 },
      reducedMotion,
    });
    const page = await context.newPage();
    await page.goto('contacto/');
    const result = await page.evaluate((reduced) => {
      const field = document.querySelector('textarea')!;
      const send = (target: EventTarget, options: WheelEventInit) => {
        const event = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaY: 120,
          ...options,
        });
        target.dispatchEvent(event);
        return event.defaultPrevented;
      };
      const results = [
        send(field, {}),
        send(document.body, { ctrlKey: true }),
        send(document.body, { deltaY: 10.5 }),
        send(document.body, { deltaX: 200, deltaY: 10 }),
      ];
      const nested = document.createElement('div');
      nested.style.cssText = 'height:20px;overflow:auto';
      nested.innerHTML = '<div style="height:200px">Scrollable content</div>';
      document.body.append(nested);
      results.push(send(nested, {}));
      nested.remove();
      if (reduced === 'reduce') results.push(send(document.body, {}));
      return results;
    }, reducedMotion);
    expect(result.every((prevented) => !prevented)).toBe(true);
    await context.close();
  }
});
