import {
  ARENA_V2_ENGINE_VERSION, ENGINE_VERSION, LEGACY_ENGINE_VERSION, replaySchema,
  type ArenaState, type Input, type Player, type Replay,
} from '../contracts';
import { registerGameEngine, type GameEngine } from '../game-engine';
import * as current from './resource-arena-v3';
import * as arenaV2 from './resource-arena-v2';
import * as legacy from '../simulation-v1';

export type ResourceArenaEngine = GameEngine<Replay, ArenaState, Input, Player>;

export const resourceArenaV3: ResourceArenaEngine = {
  version: ENGINE_VERSION,
  descriptor: {
    gameId: 'resource-arena', displayName: 'Arena de recursos', lifecycle: 'active', rendererId: 'resource-arena',
    replayFormat: 'resource-arena-replay/2',
    capabilities: { agents: true, humans: false, turns: false, draws: false, cancellation: true },
  },
  requiresSecret: true,
  initialState: current.initialState,
  run: current.runSimulation,
  createSecret: current.createNonce,
  seedCommitment(seed, secret) {
    if (!secret) throw new Error('Falta el secreto de la partida.');
    return current.seedCommitment(seed, secret);
  },
  buildReplay(matchId, seed, secret) {
    if (!secret) throw new Error('Falta el secreto de la partida.');
    return current.buildReplay(matchId, seed, secret);
  },
  verifyReplay: current.verifyReplay,
};

// 2.0.0 se conserva sin tocar: la evidencia publicada se verifica contra sus reglas exactas.
// No admite partidas nuevas porque un empate de casilla detenía la competición.
export const resourceArenaV2: ResourceArenaEngine = {
  version: ARENA_V2_ENGINE_VERSION,
  descriptor: {
    gameId: 'resource-arena', displayName: 'Arena de recursos', lifecycle: 'historical', rendererId: 'resource-arena',
    replayFormat: 'resource-arena-replay/2',
    capabilities: { agents: true, humans: false, turns: false, draws: false, cancellation: true },
  },
  requiresSecret: true,
  initialState: arenaV2.initialState,
  run: arenaV2.runSimulation,
  createSecret: arenaV2.createNonce,
  seedCommitment(seed, secret) {
    if (!secret) throw new Error('Falta el secreto de la partida.');
    return arenaV2.seedCommitment(seed, secret);
  },
  buildReplay(matchId, seed, secret) {
    if (!secret) throw new Error('Falta el secreto de la partida.');
    return arenaV2.buildReplay(matchId, seed, secret);
  },
  verifyReplay: arenaV2.verifyReplay,
};

export const resourceArenaV1: ResourceArenaEngine = {
  version: LEGACY_ENGINE_VERSION,
  descriptor: {
    gameId: 'resource-arena', displayName: 'Arena de recursos', lifecycle: 'historical', rendererId: 'resource-arena',
    replayFormat: 'resource-arena-replay/1',
    capabilities: { agents: true, humans: false, turns: false, draws: false, cancellation: true },
  },
  requiresSecret: false,
  initialState: legacy.initialState,
  run: legacy.runSimulation,
  createSecret: () => undefined,
  seedCommitment: seed => legacy.seedCommitment(seed),
  buildReplay: (matchId, seed) => legacy.buildReplay(matchId, seed),
  async verifyReplay(raw, expectedSeedHash) {
    const replay = replaySchema.parse(raw);
    if (replay.engineVersion !== LEGACY_ENGINE_VERSION) throw new Error('Versión de motor incompatible.');
    return legacy.verifyReplay(replay, expectedSeedHash);
  },
};

registerGameEngine(resourceArenaV1);
registerGameEngine(resourceArenaV2);
registerGameEngine(resourceArenaV3);

export const currentGameEngine = resourceArenaV3;
