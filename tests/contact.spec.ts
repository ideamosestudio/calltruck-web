import { test, expect } from '@playwright/test';

for (const succeeds of [true, false]) {
  test(`hosting form handles ${succeeds ? 'success' : 'failure'} without sending email`, async ({
    page,
  }) => {
    let submitted: Record<string, string> | undefined;
    await page.route(
      'https://forms.calltruck.com.ar/contact.php',
      async (route) => {
        const request = route.request();
        if (request.method() === 'GET') {
          await route.fulfill({ json: { token: 'test-only-token' } });
        } else {
          submitted = request.postDataJSON();
          await route.fulfill({
            status: succeeds ? 200 : 503,
            json: succeeds
              ? { ok: true }
              : { error: 'No se pudo enviar. Intentá más tarde.' },
          });
        }
      },
    );
    await page.goto('contacto/');
    await page.getByLabel('Nombre y apellido').fill('Prueba local');
    await page.getByLabel('Teléfono / WhatsApp').fill('1112345678');
    await page.getByLabel('Correo electrónico').fill('test@example.com');
    await page
      .getByLabel('Servicio', { exact: true })
      .selectOption('Otra consulta');
    await page
      .getByLabel('¿Qué necesitás resolver?')
      .fill('Prueba interceptada: no enviar.');
    const submit = page.getByRole('button', { name: 'Enviar consulta' });
    await submit.click();
    await expect(page.locator('.form-status')).toContainText(
      succeeds ? 'Tu consulta fue enviada' : 'No se pudo enviar',
    );
    await expect(submit).toBeEnabled();
    expect(submitted?.token).toBe('test-only-token');
    expect(submitted?.email).toBe('test@example.com');
    await expect(page.getByLabel('Nombre y apellido')).toHaveValue(
      succeeds ? '' : 'Prueba local',
    );
  });
}
