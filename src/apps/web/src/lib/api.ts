import type { LocalMatch } from '../../../../packages/shared/src/contracts';
import { practiceApi } from './practice';
import { apiUrl, browserPractice } from './runtime';
async function request(path: string, options?: RequestInit): Promise<LocalMatch> {
  let response: Response;
  try { response = await fetch(apiUrl(path), { ...options, signal: AbortSignal.timeout(120_000) }); }
  catch { throw new Error('No se pudo conectar con el motor. Comprueba que ArenaPay esté iniciado e inténtalo de nuevo.'); }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? 'No se pudo completar la solicitud.');
  }
  return response.json() as Promise<LocalMatch>;
}
export const matchApi = {
  create: (seed: number) => browserPractice ? practiceApi.create(seed) : request('/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed }) }),
  get: (id: string, testnet = false) => testnet ? request(`/testnet/matches/${encodeURIComponent(id)}`) : browserPractice ? practiceApi.get(id) : request(`/matches/${encodeURIComponent(id)}`),
  run: (id: string, testnet = false) => testnet ? request(`/testnet/matches/${encodeURIComponent(id)}/run`, { method: 'POST' }) : browserPractice ? practiceApi.run(id) : request(`/matches/${encodeURIComponent(id)}/run`, { method: 'POST' }),
};
