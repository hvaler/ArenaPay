import { expect, test } from '@playwright/test';

test('public operation uses the persistent API while practice stays in the browser', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url()); });
  await page.goto('./');
  await expect(page.getByText('Stellar Testnet', { exact: true })).toBeVisible();
  await expect(page.getByText('Cargando integración de Testnet…')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nueva partida en Testnet', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nueva partida en Testnet', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Escrow en Stellar Testnet' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Escrow en Stellar Testnet' }).getByLabel('Juego')).toHaveValue('resource-arena/2.0.0');
  await expect(page.getByText('Solo Testnet · Firmas en tu wallet')).toBeVisible({ timeout: 30_000 });
  expect(requests.some(url => new URL(url).pathname === '/api/testnet/config')).toBe(true);

  const beforePractice = requests.length;
  await page.getByRole('button', { name: 'Probar la arena', exact: true }).click();
  await page.getByLabel('Semilla de la arena').fill('2026');
  await page.getByRole('button', { name: 'Crear partida de práctica', exact: true }).click();
  await page.getByRole('button', { name: 'Ejecutar simulación' }).click();
  await expect(page.getByText('Sin premio liquidado.')).toBeVisible({ timeout: 30_000 });
  expect(requests.slice(beforePractice).some(url => new URL(url).pathname.startsWith('/api/matches'))).toBe(false);
  expect(errors).toEqual([]);
});
