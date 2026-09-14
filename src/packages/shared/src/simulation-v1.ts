// Frozen historical engine: preserves the hashes and receipts of version 1.
import { LEGACY_ENGINE_VERSION as ENGINE_VERSION, GRID_SIZE, POLICIES, TICKS, inputSchema, replaySchema, seedSchema, type ArenaState, type Input, type Move, type Player, type Position, type Replay } from './contracts';
import { canonicalJson, sha256Hex } from './hash';

const moves: Move[] = ['UP', 'LEFT', 'DOWN', 'RIGHT', 'STAY'];
const delta: Record<Move, Position> = { UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 }, STAY: { x: 0, y: 0 } };
const distance = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const sameCell = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

function random(state: ArenaState): number {
  let n = state.rng;
  n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
  state.rng = n >>> 0;
  return state.rng;
}

function spawnResource(state: ArenaState): void {
  const free: Position[] = [];
  for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) {
    const cell = { x, y };
    if (!sameCell(cell, state.agents.A) && !sameCell(cell, state.agents.B) && !state.resources.some(r => sameCell(r, cell))) free.push(cell);
  }
  if (free.length) state.resources.push({ ...free[random(state) % free.length], value: 1 + random(state) % 3 });
}

export function initialState(seed: number): ArenaState {
  seedSchema.parse(seed);
  const state: ArenaState = {
    engineVersion: ENGINE_VERSION, seed, rng: seed || 0x9e3779b9, tick: 0,
    agents: { A: { x: 0, y: 0, score: 0 }, B: { x: 7, y: 7, score: 0 } }, resources: [],
  };
  for (let i = 0; i < 12; i++) spawnResource(state);
  return state;
}

function destination(position: Position, move: Move): Position {
  return {
    x: Math.max(0, Math.min(GRID_SIZE - 1, position.x + delta[move].x)),
    y: Math.max(0, Math.min(GRID_SIZE - 1, position.y + delta[move].y)),
  };
}

/** Both policies read the same pre-tick state. Fixed ties: UP, LEFT, DOWN, RIGHT, STAY. */
export function chooseMove(state: ArenaState, player: Player): Move {
  const position = state.agents[player];
  const rival = state.agents[player === 'A' ? 'B' : 'A'];
  if (!state.resources.length) return 'STAY';
  const targets = [...state.resources].sort((a, b) => {
    const utility = (r: typeof a) => player === 'A'
      ? -distance(position, r)
      : r.value * 4 - distance(position, r) * 2 + Math.min(3, distance(rival, r));
    return utility(b) - utility(a) || a.y - b.y || a.x - b.x;
  });
  let best: Move = 'STAY';
  let bestScore = -Infinity;
  for (const move of moves) {
    const next = destination(position, move);
    const score = -distance(next, targets[0]) * 10 + (player === 'B' ? Math.min(3, distance(next, rival)) : 0);
    if (score > bestScore) { best = move; bestScore = score; }
  }
  return best;
}

function step(state: ArenaState, inputs: readonly Input[]): void {
  for (const input of [...inputs].sort((a, b) => a.player < b.player ? -1 : 1)) {
    Object.assign(state.agents[input.player], destination(state.agents[input.player], input.move));
  }
  // Movement is simultaneous; collection priority alternates to resolve shared cells.
  const order: Player[] = state.tick % 2 === 0 ? ['A', 'B'] : ['B', 'A'];
  for (const player of order) {
    const index = state.resources.findIndex(r => sameCell(r, state.agents[player]));
    if (index >= 0) state.agents[player].score += state.resources.splice(index, 1)[0].value;
  }
  state.tick++;
  if (state.tick % 5 === 0 && state.tick < TICKS && state.resources.length < 12) spawnResource(state);
}

export function runSimulation(seed: number, rawInputs: readonly Input[]) {
  const state = initialState(seed);
  if (rawInputs.length !== TICKS * 2) throw new Error('El replay debe incluir dos movimientos por tick.');
  const inputs = rawInputs.map(input => inputSchema.parse(input));
  const keyed = new Map<string, Input>();
  for (const input of inputs) {
    const key = `${input.tick}:${input.player}`;
    if (keyed.has(key)) throw new Error('Movimiento duplicado.');
    keyed.set(key, input);
  }
  const frames = [structuredClone(state)];
  for (let tick = 0; tick < TICKS; tick++) {
    step(state, [keyed.get(`${tick}:A`)!, keyed.get(`${tick}:B`)!]);
    frames.push(structuredClone(state));
  }
  const winner: Player = state.agents.A.score === state.agents.B.score
    ? (seed % 2 === 0 ? 'A' : 'B') : state.agents.A.score > state.agents.B.score ? 'A' : 'B';
  return { state, frames, winner };
}

export async function seedCommitment(seed: number): Promise<string> {
  seedSchema.parse(seed);
  return sha256Hex(canonicalJson({ engineVersion: ENGINE_VERSION, seed }));
}

export async function buildReplay(matchId: string, seed: number): Promise<Replay> {
  const state = initialState(seed);
  const inputs: Input[] = [];
  for (let tick = 0; tick < TICKS; tick++) {
    const pair = (['A', 'B'] as const).map(player => ({ tick, player, move: chooseMove(state, player) }));
    inputs.push(...pair);
    step(state, pair);
  }
  const result = runSimulation(seed, inputs);
  return replaySchema.parse({ matchId, engineVersion: ENGINE_VERSION, seed, seedHash: await seedCommitment(seed), policies: POLICIES,
    inputs, winner: result.winner, finalStateHash: await sha256Hex(canonicalJson(result.state)) });
}

export async function verifyReplay(raw: unknown, expectedSeedHash?: string) {
  const replay = replaySchema.parse(raw);
  const result = runSimulation(replay.seed, replay.inputs);
  const actualHash = await sha256Hex(canonicalJson(result.state));
  const commitment = await seedCommitment(replay.seed);
  return { valid: actualHash === replay.finalStateHash && result.winner === replay.winner && commitment === replay.seedHash
    && (expectedSeedHash === undefined || commitment === expectedSeedHash), actualHash, ...result };
}
