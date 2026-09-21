import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, TICKS, type Input } from '../src/contracts';
import { buildReplay, initialState, runSimulation, seedCommitment, verifyReplay } from '../src/simulation';
import { getGameEngine, registeredEngineVersions } from '../src/game-engine';
import '../src/engines/resource-arena';
import historicalReplay from '../../../../docs/evidencia/fixtures/testnet-replay.json';

const id = '00000000-0000-4000-8000-000000000001';
const nonce = '01'.repeat(32);
const still: Input[] = Array.from({ length: TICKS }, (_, tick) => ([{ tick, player: 'A' as const, move: 'STAY' as const }, { tick, player: 'B' as const, move: 'STAY' as const }])).flat();
describe('versioned deterministic arena', () => {
  it('registers current and historical engines behind the common boundary', () => {
    expect(registeredEngineVersions()).toEqual(['resource-arena/1.0.0', 'resource-arena/2.0.0']);
    expect(getGameEngine(ENGINE_VERSION).requiresSecret).toBe(true);
    expect(() => getGameEngine('chess/1.0.0')).toThrow('desconocida');
  });
  it('reproduces the complete demo with the same seed', async () => {
    const one = await buildReplay(id, 2026, nonce);
    expect(await buildReplay(id, 2026, nonce)).toEqual(one);
    expect((await verifyReplay(one)).valid).toBe(true);
    expect(one.inputs).toHaveLength(120);
    expect(runSimulation(one.seed, one.inputs).frames).toHaveLength(61);
  });
  it('is independent of input array ordering', async () => {
    const replay = await buildReplay(id, 2026);
    expect(runSimulation(2026, replay.inputs)).toEqual(runSimulation(2026, [...replay.inputs].reverse()));
  });
  it('preserves the version 1 regression vector', async () => {
    const replay = historicalReplay;
    expect(replay.seedHash).toBe('1e2ca4b90f76698cf5cd6c526d2a18eb6f3fd79d93acc9b3e676aa6ffefc42ae');
    expect(replay.finalStateHash).toBe('1f167557b9f13e95e9e5c2370bd10cc4e86cb8e079bc9374f28684c5edaf6161');
    const { state, winner, valid } = await verifyReplay(replay);
    expect(valid).toBe(true);
    expect([state.agents.A.score, state.agents.B.score, winner]).toEqual([16, 27, 'B']);
  });
  it('different seeds produce different arenas and commitments', async () => {
    expect(initialState(1).resources).not.toEqual(initialState(2).resources);
    expect((await buildReplay(id, 1)).seedHash).not.toBe((await buildReplay(id, 2)).seedHash);
  });
  it('clamps coordinates and uses the published tie rule', () => {
    const result = runSimulation(0, still.map(i => ({ ...i, move: i.player === 'A' ? 'LEFT' : 'RIGHT' })));
    expect(result.state.agents.A.x).toBe(0);
    expect(result.state.agents.B.x).toBe(7);
    expect(result.winner).toBe('A');
    expect(runSimulation(1, still).winner).toBe('B');
  });
  it('spawns unique resources outside players and keeps all frames bounded', async () => {
    const replay = await buildReplay(id, 42);
    for (const frame of runSimulation(42, replay.inputs).frames) {
      expect(new Set(frame.resources.map(r => `${r.x}:${r.y}`)).size).toBe(frame.resources.length);
      for (const agent of Object.values(frame.agents)) {
        expect(agent.x).toBeGreaterThanOrEqual(0); expect(agent.x).toBeLessThan(8);
        expect(agent.y).toBeGreaterThanOrEqual(0); expect(agent.y).toBeLessThan(8);
        expect(Number.isInteger(agent.score)).toBe(true);
      }
    }
  });
  it('rejects duplicates, incomplete logs, unsupported moves and invalid seeds', () => {
    expect(() => runSimulation(1, [still[0], ...still.slice(0, -1)])).toThrow('duplicado');
    expect(() => runSimulation(1, still.slice(1))).toThrow();
    expect(() => runSimulation(1, [{ ...still[0], move: 'FIRE' } as unknown as Input, ...still.slice(1)])).toThrow();
    expect(() => initialState(-1)).toThrow();
    expect(() => initialState(0x100000000)).toThrow();
  });
  it('detects modified hashes, winners and seed commitments', async () => {
    const replay = await buildReplay(id, 2026);
    expect((await verifyReplay({ ...replay, finalStateHash: '0'.repeat(64) })).valid).toBe(false);
    expect((await verifyReplay({ ...replay, winner: replay.winner === 'A' ? 'B' : 'A' })).valid).toBe(false);
    expect((await verifyReplay({ ...replay, seedHash: '0'.repeat(64) })).valid).toBe(false);
    expect((await verifyReplay(replay, '0'.repeat(64))).valid).toBe(false);
  });
  it('rejects unknown versions and extra fields', async () => {
    const replay = await buildReplay(id, 2026);
    await expect(verifyReplay({ ...replay, engineVersion: 'unknown' })).rejects.toThrow();
    await expect(verifyReplay({ ...replay, funds: 10 })).rejects.toThrow();
  });
  it('requires a 32-byte nonce in v2 and binds it to the published commitment', async () => {
    const replay = await buildReplay(id, 2026, nonce);
    expect(replay.engineVersion).toBe(ENGINE_VERSION);
    expect(replay.seedHash).toBe(await seedCommitment(2026, nonce));
    expect(await seedCommitment(2026, '02'.repeat(32))).not.toBe(replay.seedHash);
    expect((await verifyReplay({ ...replay, nonce: '02'.repeat(32) })).valid).toBe(false);
    const missing = { ...replay } as Record<string, unknown>; delete missing.nonce;
    await expect(verifyReplay(missing)).rejects.toThrow();
    await expect(verifyReplay({ ...replay, nonce: 'short' })).rejects.toThrow();
    await expect(seedCommitment(2026, '')).rejects.toThrow();
    const second = await buildReplay(id, 2026);
    expect(second.seedHash).not.toBe(replay.seedHash);
    expect(second.finalStateHash).toBe(replay.finalStateHash);
    // Relabelling the format does not validate against a v2 commitment.
    expect((await verifyReplay({ ...missing, engineVersion: historicalReplay.engineVersion }, replay.seedHash)).valid).toBe(false);
  });
  it('does not alias seed zero with the former fallback seed', () => {
    expect(initialState(0).resources).not.toEqual(initialState(0x9e3779b9).resources);
    for (const seed of [0, 0x7fffffff, 0x80000000, 0xffffffff]) expect(initialState(seed).seed).toBe(seed);
  });
  it('blocks conflicting destinations atomically, including a stationary occupant', () => {
    const inputs = still.map(input => ({ ...input, move: input.tick < 7 ? input.player === 'A' ? 'RIGHT' as const : 'UP' as const : 'STAY' as const }));
    const result = runSimulation(0, inputs);
    expect(result.frames[7].agents.A).toMatchObject({ x: 6, y: 0 });
    expect(result.frames[7].agents.B).toMatchObject({ x: 7, y: 1 });
    const stationary = still.map(input => ({ ...input, move: input.player === 'B' ? 'STAY' as const : input.tick < 7 ? 'RIGHT' as const : 'DOWN' as const }));
    for (const frame of runSimulation(1, stationary).frames) {
      expect([frame.agents.A.x, frame.agents.A.y]).not.toEqual([frame.agents.B.x, frame.agents.B.y]);
    }
  });
  it('sweeps 1000 seeds: reproducible unique hashes, bounded distinct agents and wins for both policies', async () => {
    const hashes = new Set<string>(), arenas = new Set<string>();
    const wins = { A: 0, B: 0 };
    for (let seed = 0; seed < 1000; seed++) {
      const replay = await buildReplay(id, seed, nonce);
      const result = await verifyReplay(replay, replay.seedHash);
      expect(result.valid, `seed ${seed}`).toBe(true);
      expect(hashes.has(result.actualHash), `hash collision at seed ${seed}`).toBe(false);
      hashes.add(result.actualHash);
      // Final state includes seed, so also check layouts independently of that field.
      const arena = JSON.stringify(result.frames[0].resources);
      expect(arenas.has(arena), `arena collision at seed ${seed}`).toBe(false); arenas.add(arena);
      wins[result.winner]++;
      for (const frame of result.frames) {
        const { A, B } = frame.agents;
        expect(A.x !== B.x || A.y !== B.y, `overlap: seed ${seed}, tick ${frame.tick}`).toBe(true);
        for (const agent of [A, B]) expect(Number.isInteger(agent.x) && Number.isInteger(agent.y) && agent.x >= 0 && agent.x < 8 && agent.y >= 0 && agent.y < 8, `bounds: seed ${seed}, tick ${frame.tick}`).toBe(true);
      }
    }
    expect(hashes.size).toBe(1000); expect(wins.A).toBeGreaterThan(0); expect(wins.B).toBeGreaterThan(0);
  }, 60_000);
});
