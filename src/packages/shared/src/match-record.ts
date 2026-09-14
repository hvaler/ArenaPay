import { z } from 'zod';
import { ENGINE_VERSION, LEGACY_ENGINE_VERSION, seedSchema, type LocalMatch } from './contracts';
import { buildReplay, createNonce, seedCommitment } from './simulation';
import { buildReplay as buildLegacyReplay } from './simulation-v1';
import { onChainId } from './stellar';

export type StoredMatch = LocalMatch & { seed: number; nonce?: string };

export function assertMatchId(id: string) {
  if (!z.string().uuid().safeParse(id).success) throw new Error('Identificador de partida inválido.');
}

export function publicMatch(match: StoredMatch): LocalMatch {
  const { nonce: _nonce, seed, ...visible } = match;
  return match.testnet && !match.replay ? visible : { ...visible, seed };
}

export async function createStoredMatch(seed: number, testnetContractId?: string): Promise<StoredMatch> {
  seedSchema.parse(seed);
  const nonce = createNonce(), matchId = crypto.randomUUID();
  return { matchId, mode: 'local', status: 'Ready', seed, nonce,
    seedHash: await seedCommitment(seed, nonce), engineVersion: ENGINE_VERSION, createdAt: new Date().toISOString(),
    ...(testnetContractId ? { testnet: { contractId: testnetContractId, chainId: onChainId(matchId) } } : {}) };
}

export async function completeStoredMatch(match: StoredMatch, funding?: { contractId: string; chainId: string }): Promise<StoredMatch> {
  if (match.testnet && (funding?.contractId !== match.testnet.contractId || funding.chainId !== match.testnet.chainId)) {
    throw new Error('Ejecuta esta partida desde el flujo Testnet tras confirmar ambos depósitos.');
  }
  if (match.status !== 'Ready') throw new Error('La partida ya tiene un replay.');
  if (match.engineVersion !== LEGACY_ENGINE_VERSION && !match.nonce) throw new Error('Falta el nonce guardado. No se puede sustituir el compromiso.');
  const replay = match.engineVersion === LEGACY_ENGINE_VERSION ? await buildLegacyReplay(match.matchId, match.seed) : await buildReplay(match.matchId, match.seed, match.nonce!);
  if (replay.seedHash !== match.seedHash || replay.engineVersion !== match.engineVersion) throw new Error('El replay no coincide con el compromiso guardado.');
  return { ...match, status: 'Completed', replay };
}
