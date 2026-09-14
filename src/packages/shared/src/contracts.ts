import { z } from 'zod';

export const LEGACY_ENGINE_VERSION = 'resource-arena/1.0.0';
export const ENGINE_VERSION = 'resource-arena/2.0.0';
export const TICKS = 60;
export const GRID_SIZE = 8;
export const POLICIES = { A: 'collector-v1', B: 'tactician-v1' } as const;
export const seedSchema = z.number().int().min(0).max(0xffffffff);
export const playerSchema = z.enum(['A', 'B']);
export const moveSchema = z.enum(['UP', 'DOWN', 'LEFT', 'RIGHT', 'STAY']);
export const inputSchema = z.object({ tick: z.number().int().min(0).max(TICKS - 1), player: playerSchema, move: moveSchema }).strict();
const hexSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const nonceSchema = hexSchema;
const replayFields = {
  matchId: z.string().uuid(), seed: seedSchema,
  seedHash: hexSchema,
  policies: z.object({ A: z.literal(POLICIES.A), B: z.literal(POLICIES.B) }).strict(),
  inputs: z.array(inputSchema).length(TICKS * 2), finalStateHash: hexSchema, winner: playerSchema,
};
export const replaySchema = z.discriminatedUnion('engineVersion', [
  z.object({ ...replayFields, engineVersion: z.literal(ENGINE_VERSION), nonce: nonceSchema }).strict(),
  z.object({ ...replayFields, engineVersion: z.literal(LEGACY_ENGINE_VERSION) }).strict(),
]);
export type Player = z.infer<typeof playerSchema>;
export type Move = z.infer<typeof moveSchema>;
export type Input = z.infer<typeof inputSchema>;
export type Replay = z.infer<typeof replaySchema>;
export interface Position { x: number; y: number }
export interface AgentState extends Position { score: number }
export interface Resource extends Position { value: number }
export interface ArenaState {
  engineVersion: string; seed: number; rng: number; tick: number;
  agents: Record<Player, AgentState>; resources: Resource[];
}
// Reserved for the on-chain adapter; local simulations never enter these states.
export type MatchStatus = 'Created' | 'Funded' | 'Settled' | 'Cancelled';
export interface MatchRecord {
  matchId: string; playerA: string; playerB: string; buyIn: bigint; engineVersion: string;
  seedHash: string; timeoutLedger: number; status: MatchStatus; finalStateHash?: string; winner?: string;
}
export interface LocalMatch {
  matchId: string; mode: 'local'; status: 'Ready' | 'Completed'; seed?: number;
  seedHash: string; engineVersion: string; createdAt: string; replay?: Replay;
  testnet?: { contractId: string; chainId: string; createTx?: string };
}
export const PRODUCT_STATEMENT = 'ArenaPay es una plataforma para competiciones verificables sobre Soroban: registra un replay reproducible, protege las inscripciones en escrow y liquida el premio mediante una resolución firmada. Su MVP enfrenta a Atlas y Nova, dos agentes deterministas.';
