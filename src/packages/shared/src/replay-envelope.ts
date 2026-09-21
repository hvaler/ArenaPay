import { z } from 'zod';

export const EVIDENCE_VERSION = 'arenapay-evidence/1.0.0' as const;
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const engineVersionSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*\/\d+\.\d+\.\d+$/);

export const matchOutcomeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('win'), winner: z.string().min(1), reason: z.enum(['rules', 'resignation', 'timeout', 'adjudication']) }).strict(),
  z.object({ type: z.literal('draw'), reason: z.enum(['rules', 'agreement', 'repetition', 'move-limit', 'stalemate', 'insufficient-material']) }).strict(),
  z.object({ type: z.literal('cancelled'), reason: z.enum(['expired', 'participant', 'operator', 'funding']) }).strict(),
]);

/** Generic evidence produced by new engines. Historical resource-arena replays remain byte-for-byte unchanged. */
export const replayEnvelopeSchema = z.object({
  evidenceVersion: z.literal(EVIDENCE_VERSION),
  matchId: z.string().uuid(),
  gameId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  engineVersion: engineVersionSchema,
  configuration: z.record(z.string(), z.unknown()),
  seed: z.number().int().min(0).max(0xffffffff).optional(),
  seedHash: hashSchema.optional(),
  secret: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  actions: z.array(z.unknown()).max(10_000),
  outcome: matchOutcomeSchema,
  finalStateHash: hashSchema,
}).strict().superRefine((value, context) => {
  if ((value.seed === undefined) !== (value.seedHash === undefined)) {
    context.addIssue({ code: 'custom', message: 'La semilla y su compromiso deben aparecer juntos.' });
  }
});

export type MatchOutcome<TWinner extends string = string> =
  | { type: 'win'; winner: TWinner; reason: 'rules' | 'resignation' | 'timeout' | 'adjudication' }
  | { type: 'draw'; reason: 'rules' | 'agreement' | 'repetition' | 'move-limit' | 'stalemate' | 'insufficient-material' }
  | { type: 'cancelled'; reason: 'expired' | 'participant' | 'operator' | 'funding' };
export type ReplayEnvelope = z.infer<typeof replayEnvelopeSchema>;

/** Compatibility adapter: old arena replays encode only a decisive winner. */
export function replayOutcome(raw: unknown): MatchOutcome {
  const envelope = replayEnvelopeSchema.safeParse(raw);
  if (envelope.success) return envelope.data.outcome;
  if (typeof raw === 'object' && raw !== null && 'winner' in raw && (raw.winner === 'A' || raw.winner === 'B')) {
    return { type: 'win', winner: raw.winner, reason: 'rules' };
  }
  throw new Error('El replay no declara un resultado compatible.');
}

export function outcomeWinner(outcome: MatchOutcome): string | undefined {
  return outcome.type === 'win' ? outcome.winner : undefined;
}
