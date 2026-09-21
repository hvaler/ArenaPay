import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('navigates between the public sections and reports the published milestone', async ({ page }) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(navigation.getByRole('link', { name: 'Arena' })).toHaveAttribute('aria-current', 'location');

  await navigation.getByRole('link', { name: 'Evidencia' }).click();
  await expect(page).toHaveURL(/#evidence$/);
  await expect(navigation.getByRole('link', { name: 'Evidencia' })).toHaveAttribute('aria-current', 'location');

  await navigation.getByRole('link', { name: 'Proyecto' }).click();
  await expect(page).toHaveURL(/#roadmap$/);
  await expect(navigation.getByRole('link', { name: 'Proyecto' })).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('#roadmap')).toContainText('Demo y entrega publicadas');
  await expect(page.locator('footer')).toContainText('ArenaPay 0.4.0');
});

test('creates, runs, scrubs, verifies and downloads the same persisted replay', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/');
  await expect(page.locator('#practice-game')).toHaveValue('resource-arena/2.0.0');
  await expect(page.locator('#practice-game option')).toHaveText(['Arena de recursos · resource-arena/2.0.0']);
  await expect(page.getByRole('button', { name: 'Verificar reproducibilidad' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Ejecutar simulación' })).toHaveCount(0);
  await page.getByLabel('Semilla de la arena').fill('2026');
  await page.getByRole('button', { name: 'Crear partida de práctica', exact: true }).click();
  await expect(page.getByText('Semilla 2026 fijada antes de ejecutar')).toBeVisible();
  await page.getByRole('button', { name: 'Ejecutar simulación' }).click();
  await expect(page.getByText('120 inputs · 60 ticks · 2 agentes')).toBeVisible();
  await page.getByRole('button', { name: 'Pausar replay' }).click();
  await page.getByLabel('Tick del replay').fill('60');
  await expect(page.getByText('Sin premio liquidado.')).toBeVisible();
  await page.getByRole('button', { name: 'Verificar reproducibilidad' }).click();
  await expect(page.getByText('Replay verificado localmente.')).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar JSON' }).click();
  const download = await downloadEvent;
  const replay = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(replay.seed).toBe(2026); expect(replay.inputs).toHaveLength(120);
  expect(replay.engineVersion).toBe('resource-arena/2.0.0');
  expect(replay.nonce).toMatch(/^[a-f0-9]{64}$/);
  const privateFile = await page.request.get(`/@fs/${process.cwd().replaceAll('\\', '/')}/data/matches/${replay.matchId}.json`);
  expect(privateFile.status()).toBe(403);
  expect(await privateFile.text()).not.toContain(replay.nonce);
  const persisted = await page.request.get(`/api/matches/${replay.matchId}/replay`);
  expect(await persisted.json()).toEqual(replay);
  await page.screenshot({ path: 'test-results/arenapay-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('rejects tampered replay evidence without claiming a payout', async ({ page, request }) => {
  const created = await (await request.post('/api/matches', { data: { seed: 12 } })).json();
  const completed = await (await request.post(`/api/matches/${created.matchId}/run`)).json();
  await page.goto('/');
  await page.getByLabel('Archivo de replay').setInputFiles({ name: 'tampered.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...completed.replay, finalStateHash: '0'.repeat(64) })) });
  await page.getByRole('button', { name: 'Verificar reproducibilidad' }).click();
  await expect(page.getByText(/^Evidencia inconsistente\./)).toBeVisible();
  await expect(page.getByText('Replay verificado localmente.')).toHaveCount(0);
  await expect(page.getByText('Premio liquidado', { exact: true })).toHaveCount(0);
});

test('mobile layout fits and invalid seeds are actionable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Semilla de la arena').fill('abc');
  await page.getByRole('button', { name: 'Crear partida de práctica', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Escribe una semilla entera');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/arenapay-mobile.png', fullPage: true });
});

test('explains an API failure and allows retrying', async ({ page }) => {
  await page.goto('/');
  await page.route('**/api/matches', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'No se pudo guardar la partida.' }) }));
  await page.getByRole('button', { name: 'Crear partida de práctica', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo guardar');
  await expect(page.getByRole('button', { name: 'Crear partida de práctica', exact: true })).toBeEnabled();
  await page.unroute('**/api/matches');
  await page.getByRole('button', { name: 'Crear partida de práctica', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ejecutar simulación' })).toBeVisible();
});

test('loads the real Testnet rehearsal and verifies against the contract', async ({ page, request }) => {
  test.setTimeout(90_000);
  const config = await (await request.get('/api/testnet/config')).json();
  test.skip(!config.ready || !config.latestMatchId, 'Requires the local Testnet rehearsal.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Cargar ensayo verificado de Testnet' }).click();
  await expect(page.getByText('Estado confirmado: Settled')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText('Premio liquidado: Nova')).toBeVisible();
  await page.getByRole('button', { name: 'Comprobar replay contra la cadena' }).click();
  await expect(page.getByText('Hash coincide 100% con el resultado del contrato.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver transacción en Testnet' })).toHaveAttribute('href', `https://stellar.expert/explorer/testnet/tx/${config.latestSettlementTx}`);
  await page.getByLabel('Tick del replay').fill('60');
  await page.getByRole('region', { name: 'Escrow en Stellar Testnet' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/arenapay-testnet.png' });
});
