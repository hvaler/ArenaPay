import { ENGINE_VERSION, GRID_SIZE, POLICIES, TICKS, inputSchema, replaySchema, seedSchema, nonceSchema, type ArenaState, type Input, type Move, type Player, type Position, type Replay } from '../contracts';
import { canonicalJson, sha256Hex } from '../hash';

const moves: Move[] = ['UP', 'LEFT', 'DOWN', 'RIGHT', 'STAY'];
const delta: Record<Move, Position> = { UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 }, STAY: { x: 0, y: 0 } };
const distance = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const sameCell = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

function random(state: ArenaState): number {
  // Full 32-bit state, including zero; no fallback that aliases another seed.
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let n = state.rng;
  n = Math.imul(n ^ (n >>> 15), n | 1);
  n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
  return (n ^ (n >>> 14)) >>> 0;
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
    engineVersion: ENGINE_VERSION, seed, rng: seed, tick: 0,
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
  const next = { A: { ...state.agents.A }, B: { ...state.agents.B } };
  for (const input of inputs) Object.assign(next[input.player], destination(state.agents[input.player], input.move));
  // Resolve both proposals atomically. If they target one cell, both stay;
  // allowing just one to move could put it on the blocked player's old cell.
  // Swaps between two distinct cells are allowed.
  if (!sameCell(next.A, next.B)) {
    Object.assign(state.agents.A, next.A); Object.assign(state.agents.B, next.B);
  }
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

export function createNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}

export async function seedCommitment(seed: number, nonce: string): Promise<string> {
  seedSchema.parse(seed);
  nonceSchema.parse(nonce);
  return sha256Hex(canonicalJson({ engineVersion: ENGINE_VERSION, seed, nonce }));
}

export async function buildReplay(matchId: string, seed: number, nonce: string = createNonce()): Promise<Replay> {
  nonceSchema.parse(nonce);
  const state = initialState(seed);
  const inputs: Input[] = [];
  for (let tick = 0; tick < TICKS; tick++) {
    const pair = (['A', 'B'] as const).map(player => ({ tick, player, move: chooseMove(state, player) }));
    inputs.push(...pair);
    step(state, pair);
  }
  const result = runSimulation(seed, inputs);
  return replaySchema.parse({ matchId, engineVersion: ENGINE_VERSION, seed, nonce, seedHash: await seedCommitment(seed, nonce), policies: POLICIES,
    inputs, winner: result.winner, finalStateHash: await sha256Hex(canonicalJson(result.state)) });
}

export async function verifyReplay(raw: unknown, expectedSeedHash?: string) {
  const replay = replaySchema.parse(raw);
  if (replay.engineVersion !== ENGINE_VERSION) throw new Error('Versión de motor incompatible.');
  const result = runSimulation(replay.seed, replay.inputs);
  const actualHash = await sha256Hex(canonicalJson(result.state));
  const commitment = await seedCommitment(replay.seed, replay.nonce);
  return { valid: actualHash === replay.finalStateHash && result.winner === replay.winner && commitment === replay.seedHash
    && (expectedSeedHash === undefined || commitment === expectedSeedHash), actualHash, ...result };
}
