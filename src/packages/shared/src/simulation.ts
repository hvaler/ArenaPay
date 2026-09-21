/**
 * Compatibility facade for existing clients and historical replay links.
 * New orchestration code should depend on game-engine.ts and the registry.
 */
import { type Input } from './contracts';
import { getGameEngine, replayEngineVersion } from './game-engine';
import { currentGameEngine, type ResourceArenaEngine } from './engines/resource-arena';

const engineFor = (version: string) => getGameEngine(version) as ResourceArenaEngine;

export const initialState = currentGameEngine.initialState;

export function runSimulation(seed: number, inputs: readonly Input[], engineVersion = currentGameEngine.version) {
  return engineFor(engineVersion).run(seed, inputs);
}

export function createNonce(): string {
  const secret = currentGameEngine.createSecret();
  if (!secret) throw new Error('El motor actual no genera secretos.');
  return secret;
}

export async function seedCommitment(seed: number, nonce: string): Promise<string> {
  return currentGameEngine.seedCommitment(seed, nonce);
}

export async function buildReplay(matchId: string, seed: number, nonce: string = createNonce()) {
  return currentGameEngine.buildReplay(matchId, seed, nonce);
}

export async function verifyReplay(raw: unknown, expectedSeedHash?: string) {
  return engineFor(replayEngineVersion(raw)).verifyReplay(raw, expectedSeedHash);
}
