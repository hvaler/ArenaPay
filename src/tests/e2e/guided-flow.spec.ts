import { expect, test } from '@playwright/test';
import example from '../../../docs/evidencia/fixtures/testnet-replay-v2.json' with { type: 'json' };

test('requires confirmed funding and offers recovery guidance after expiry', async ({ page }) => {
  const local = { matchId: example.matchId, mode: 'local', status: 'Ready', seedHash: example.seedHash, engineVersion: 'resource-arena/2.0.0', createdAt: '2026-09-12', testnet: { contractId: 'CDEMO', chainId: '0'.repeat(64) } };
  const state = { local, ledger: 50, budgetA: { maximum: '30000000', spent: '10000000', expiresLedger: 100 }, budgetB: null, chain: { playerA: 'A', playerB: 'B', buyIn: '10000000', seedHash: example.seedHash, engineVersion: example.engineVersion, timeoutLedger: 100, fundedA: true, fundedB: false, status: 'Created' } };
  await page.route('**/api/testnet/config', route => route.fulfill({ json: { ready: true, network: 'testnet', contractId: 'CDEMO', rpcUrl: 'https://soroban-testnet.stellar.org', latestMatchId: example.matchId } }));
  await page.route('**/api/testnet/latest', route => route.fulfill({ json: local }));
  await page.route(`**/api/testnet/matches/${example.matchId}`, route => route.fulfill({ json: state }));
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Cargar ensayo verificado de Testnet' }).click();
  await expect(page.locator('[aria-current="step"]')).toContainText('Financiar 1/2');
  await expect(page.getByText('Semilla reservada hasta ejecutar; compromiso publicado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ejecutar simulación' })).toHaveCount(0);
  await expect(page.getByText(/2 XLM disponibles/)).toBeVisible();
  state.chain.status = 'Funded'; state.chain.fundedB = true;
  await page.getByRole('button', { name: 'Actualizar estado' }).dispatchEvent('click');
  await expect(page.getByRole('button', { name: 'Ejecutar simulación' })).toBeEnabled();
  await page.route(`**/api/testnet/matches/${example.matchId}`, route => route.fulfill({ status: 502, json: { message: 'RPC consultados: https://primary.example/, https://backup.example/.' } }));
  await page.clock.fastForward(15_000);
  await expect(page.getByRole('alert')).toContainText('https://primary.example/, https://backup.example/');
  await expect(page.getByRole('button', { name: 'Ejecutar simulación' })).toHaveCount(0);
  await page.unroute(`**/api/testnet/matches/${example.matchId}`);
  await page.route(`**/api/testnet/matches/${example.matchId}`, route => route.fulfill({ json: state }));
  state.ledger = 101;
  await page.getByRole('button', { name: 'Reintentar consulta' }).click();
  await expect(page.getByText(/Plazo vencido. Conecta una cuenta participante/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ejecutar simulación' })).toHaveCount(0);
});
test('opens a documented payout without wallet or API and supports keyboard replay steps', async ({ page }) => {
  await page.route('**/api/**', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Ver una partida pagada en Testnet', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Ensayo documentado' })).toContainText('Evidencia guardada');
  await expect(page.getByRole('link', { name: 'Abrir recibo de pago' })).toHaveAttribute('href', /deaa8c4292c7c9f55ab9d07b0ab5ec6abbde16af9e142aacb1cd169fd115989a$/);
  await page.getByRole('button', { name: 'Tick anterior', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Tick del replay')).toHaveValue('59');
  await page.getByRole('button', { name: 'Verificar reproducibilidad' }).click();
  await expect(page.getByText('Replay verificado localmente.')).toBeVisible();
  await expect(page.getByText('Premio confirmado en Testnet.', { exact: true })).toHaveCount(0);
});

test('guided preparation and documented evidence fit a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Nueva partida en Testnet', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Progreso de la partida Testnet' })).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toContainText('Preparar');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Ver una partida pagada en Testnet', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/arenapay-guided-mobile.png', fullPage: true });
});
