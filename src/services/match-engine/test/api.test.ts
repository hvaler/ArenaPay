import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app';
import { MatchService } from '../src/match-service';
import { verifyReplay } from '../../../packages/shared/src/simulation';
import { TestnetService } from '../src/testnet-service';
import { RpcReadError } from '../../../packages/shared/src/stellar-rpc';

describe('local match API and persistence', () => {
  let directory: string;
  let app: ReturnType<typeof buildApp>;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'arenapay-test-')); app = buildApp(new MatchService(directory)); });
  afterEach(async () => { vi.restoreAllMocks(); await app.close(); await rm(directory, { recursive: true, force: true }); });

  it('publishes commitment before running and persists a reproducible replay across service restarts', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/matches', payload: { seed: 2026 } });
    expect(response.statusCode).toBe(201);
    const created = response.json();
    expect(created.status).toBe('Ready'); expect(created.replay).toBeUndefined();
    expect(created.revision).toBe(0);
    const run = await app.inject({ method: 'POST', url: `/api/matches/${created.matchId}/run` });
    expect(run.statusCode).toBe(200);
    const completed = run.json();
    expect((await verifyReplay(completed.replay, created.seedHash)).valid).toBe(true);
    expect(completed.revision).toBe(1);
    expect(completed.outcome).toEqual({ type: 'win', winner: completed.replay.winner, reason: 'rules' });
    const restarted = new MatchService(directory);
    expect(await restarted.get(created.matchId)).toEqual(run.json());
    const download = await app.inject(`/api/matches/${created.matchId}/replay`);
    expect(download.json()).toEqual(run.json().replay);
    expect(download.headers['content-disposition']).toContain('attachment');
  });
  it('publishes the engine catalog without coupling rules to a renderer version', async () => {
    const response = await app.inject('/api/games');
    expect(response.statusCode).toBe(200);
    expect(response.json().engines).toEqual(expect.arrayContaining([
      expect.objectContaining({ engineVersion: 'resource-arena/1.0.0', gameId: 'resource-arena', lifecycle: 'historical', rendererId: 'resource-arena' }),
      expect.objectContaining({ engineVersion: 'resource-arena/2.0.0', gameId: 'resource-arena', lifecycle: 'active', rendererId: 'resource-arena' }),
    ]));
  });
  it('selects an active engine explicitly and refuses historical engines for new matches', async () => {
    const selected = await app.inject({ method: 'POST', url: '/api/matches', payload: { seed: 7, engineVersion: 'resource-arena/2.0.0' } });
    expect(selected.statusCode).toBe(201);
    expect(selected.json().engineVersion).toBe('resource-arena/2.0.0');
    const historical = await app.inject({ method: 'POST', url: '/api/matches', payload: { seed: 7, engineVersion: 'resource-arena/1.0.0' } });
    expect(historical.statusCode).toBe(400);
    expect(historical.json().message).toContain('histórico');
  });
  it('rejects duplicate and concurrent runs', async () => {
    const created = (await app.inject({ method: 'POST', url: '/api/matches', payload: { seed: 1 } })).json();
    const runs = await Promise.all([0, 1].map(() => app.inject({ method: 'POST', url: `/api/matches/${created.matchId}/run` })));
    expect(runs.map(r => r.statusCode).sort()).toEqual([200, 409]);
    expect((await app.inject({ method: 'POST', url: `/api/matches/${created.matchId}/run` })).statusCode).toBe(409);
  });
  it.each([{ seed: -1 }, { seed: '42' }, { seed: 1.2 }, { seed: 1, winner: 'A' }, {}])('rejects invalid create requests %j', async payload => {
    expect((await app.inject({ method: 'POST', url: '/api/matches', payload })).statusCode).toBe(400);
  });
  it('returns 404 for missing matches and 400 for invalid identifiers', async () => {
    expect((await app.inject(`/api/matches/${randomUUID()}`)).statusCode).toBe(404);
    expect((await app.inject('/api/matches/not-a-uuid')).statusCode).toBe(400);
  });
  it('rejects replay download before execution and arbitrary run parameters', async () => {
    const created = (await app.inject({ method: 'POST', url: '/api/matches', payload: { seed: 1 } })).json();
    expect((await app.inject(`/api/matches/${created.matchId}/replay`)).statusCode).toBe(409);
    expect((await app.inject({ method: 'POST', url: `/api/matches/${created.matchId}/run`, payload: { winner: 'B' } })).statusCode).toBe(400);
  });
  it('does not let the local run endpoint bypass a Testnet funding gate', async () => {
    const service = new MatchService(directory);
    const match = await service.create(1);
    await service.bindTestnet(match.matchId, { contractId: 'test-contract', chainId: 'a'.repeat(64) });
    const response = await app.inject({ method: 'POST', url: `/api/matches/${match.matchId}/run` });
    expect(response.statusCode).toBe(409);
    expect((await service.get(match.matchId)).replay).toBeUndefined();
  });
  it('keeps the nonce private across create/get and restart, revealing only with the replay', async () => {
    const created = (await app.inject({ method: 'POST', url: '/api/matches', payload: { seed: 2026 } })).json();
    const stored = JSON.parse(await readFile(join(directory, `${created.matchId}.json`), 'utf8'));
    expect(stored.nonce).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(created)).not.toContain(stored.nonce);
    const other = (await app.inject({ method: 'POST', url: '/api/matches', payload: { seed: 2026 } })).json();
    expect(other.seedHash).not.toBe(created.seedHash);
    expect((await app.inject(`/api/matches/${created.matchId}`)).body).not.toContain(stored.nonce);
    const restarted = new MatchService(directory);
    const completed = await restarted.run(created.matchId);
    expect(completed.replay).toHaveProperty('nonce', stored.nonce);
    expect(completed).not.toHaveProperty('nonce');
    expect((await verifyReplay(completed.replay, created.seedHash)).valid).toBe(true);
  });
  it('atomically binds new Testnet matches and hides seed and nonce on every pre-run read', async () => {
    const service = new MatchService(directory);
    const created = await service.createTestnet('test-contract');
    expect(created).not.toHaveProperty('seed'); expect(created).not.toHaveProperty('nonce');
    expect(created.testnet?.chainId).toMatch(/^[a-f0-9]{64}$/);
    const restarted = new MatchService(directory);
    const publicGet = (await app.inject(`/api/matches/${created.matchId}`)).json();
    expect(publicGet).toEqual(created);
    expect(await restarted.get(created.matchId)).toEqual(created);
    expect((await app.inject(`/api/matches/${created.matchId}/replay`)).statusCode).toBe(409);
    await expect(restarted.run(created.matchId)).rejects.toThrow('ambos depósitos');
    const completed = await restarted.run(created.matchId, created.testnet);
    expect(completed.seed).toBe(completed.replay?.seed);
    expect((await verifyReplay(completed.replay, created.seedHash)).valid).toBe(true);
  });
  it('rejects a client-selected Testnet seed before creating a match', async () => {
    const create = vi.spyOn(TestnetService.prototype, 'create');
    const response = await app.inject({ method: 'POST', url: '/api/testnet/matches', payload: { seed: 2026, playerA: 'GAARLVPR7GF6J72HMGII7Y6PKFOK35HPKZ7WRBJBPWASLSBTSUXSHIQZ', playerB: 'GBJGSL3A65PK6W3UC5SQQCRC3EPSHODI7QWW4UY5CW7M4VR2ITRGY2N7', buyIn: '10000000' } });
    expect(response.statusCode).toBe(400); expect(create).not.toHaveBeenCalled();
  });
  it('fails closed if the stored nonce is missing instead of making a replacement', async () => {
    const service = new MatchService(directory), match = await service.create(1);
    const path = join(directory, `${match.matchId}.json`), stored = JSON.parse(await readFile(path, 'utf8'));
    delete stored.nonce; await writeFile(path, JSON.stringify(stored));
    await expect(service.run(match.matchId)).rejects.toThrow('Falta el nonce');
    expect((await service.get(match.matchId)).replay).toBeUndefined();
  });
  it('propagates the attempted RPC endpoints to the API caller', async () => {
    const message = 'No se pudo confirmar el estado. RPC consultados: https://one.example/, https://two.example/.';
    vi.spyOn(TestnetService.prototype, 'state').mockRejectedValue(new RpcReadError(message));
    const response = await app.inject(`/api/testnet/matches/${randomUUID()}`);
    expect(response.statusCode).toBe(502); expect(response.json().message).toBe(message);
  });
});

describe('public API profile', () => {
  const origin = 'https://arenapay.example';
  const playerA = 'GAARLVPR7GF6J72HMGII7Y6PKFOK35HPKZ7WRBJBPWASLSBTSUXSHIQZ';
  const playerB = 'GBJGSL3A65PK6W3UC5SQQCRC3EPSHODI7QWW4UY5CW7M4VR2ITRGY2N7';
  const payload = { playerA, playerB, buyIn: '10000000' };
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => { vi.restoreAllMocks(); await Promise.all(apps.splice(0).map(app => app.close())); });
  const createApp = (dailyMatchLimit = 20) => {
    const app = buildApp(new MatchService(), { publicMode: true, allowedOrigins: [origin], dailyMatchLimit });
    apps.push(app); return app;
  };

  it('reports public persistent mode and removes all practice routes', async () => {
    const app = createApp();
    expect((await app.inject('/api/health')).json()).toMatchObject({ status: 'ok', mode: 'public', persistence: 'filesystem' });
    expect((await app.inject({ method: 'POST', url: '/api/matches', payload: { seed: 1 } })).statusCode).toBe(404);
    expect((await app.inject('/api/matches/00000000-0000-4000-8000-000000000000')).statusCode).toBe(404);
  });

  it('answers preflight only for an allowed browser origin', async () => {
    const app = createApp();
    const allowed = await app.inject({ method: 'OPTIONS', url: '/api/testnet/matches', headers: { origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } });
    expect(allowed.statusCode).toBe(204); expect(allowed.headers['access-control-allow-origin']).toBe(origin);
    const blocked = await app.inject({ method: 'OPTIONS', url: '/api/testnet/matches', headers: { origin: 'https://attacker.example', 'access-control-request-method': 'POST' } });
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('limits paid match creation by visitor and by daily public quota', async () => {
    vi.spyOn(TestnetService.prototype, 'create').mockResolvedValue({ matchId: randomUUID(), mode: 'local', status: 'Ready', seedHash: 'a'.repeat(64), engineVersion: 'resource-arena/2.0.0', createdAt: new Date().toISOString(), testnet: { contractId: 'contract', chainId: 'b'.repeat(64), createTx: 'c'.repeat(64) } });
    const limitedByIp = createApp();
    const responses = [];
    for (let index = 0; index < 4; index++) responses.push(await limitedByIp.inject({ method: 'POST', url: '/api/testnet/matches', payload, headers: { origin, 'x-forwarded-for': '203.0.113.7' } }));
    expect(responses.map(response => response.statusCode)).toEqual([201, 201, 201, 429]);

    const limitedByDay = createApp(1);
    expect((await limitedByDay.inject({ method: 'POST', url: '/api/testnet/matches', payload, headers: { origin, 'x-forwarded-for': '203.0.113.8' } })).statusCode).toBe(201);
    expect((await limitedByDay.inject({ method: 'POST', url: '/api/testnet/matches', payload, headers: { origin, 'x-forwarded-for': '203.0.113.9' } })).statusCode).toBe(429);
  });
});
