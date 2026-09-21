import { describe, expect, it } from 'vitest';
import { EVIDENCE_VERSION, outcomeWinner, replayEnvelopeSchema, replayOutcome } from '../src/replay-envelope';
import historicalReplay from '../../../../docs/evidencia/fixtures/testnet-replay.json';

const base = {
  evidenceVersion: EVIDENCE_VERSION,
  matchId: '00000000-0000-4000-8000-000000000001',
  gameId: 'hex', engineVersion: 'hex/1.0.0', configuration: { size: 9 },
  actions: [{ cell: 'A1' }], finalStateHash: 'a'.repeat(64),
};

describe('generic replay envelope', () => {
  it.each([
    { type: 'win', winner: 'A', reason: 'rules' },
    { type: 'draw', reason: 'move-limit' },
    { type: 'cancelled', reason: 'expired' },
  ])('models outcome $type', outcome => {
    const replay = replayEnvelopeSchema.parse({ ...base, outcome });
    expect(replayOutcome(replay)).toEqual(outcome);
    expect(outcomeWinner(replay.outcome)).toBe(outcome.type === 'win' ? 'A' : undefined);
  });

  it('requires seed and commitment together and rejects extra fields', () => {
    expect(() => replayEnvelopeSchema.parse({ ...base, seed: 1, outcome: { type: 'draw', reason: 'rules' } })).toThrow();
    expect(() => replayEnvelopeSchema.parse({ ...base, outcome: { type: 'draw', reason: 'rules' }, funds: 10 })).toThrow();
  });

  it('adapts a frozen historical replay without changing it', () => {
    expect(replayOutcome(historicalReplay)).toEqual({ type: 'win', winner: 'B', reason: 'rules' });
    expect(historicalReplay).not.toHaveProperty('evidenceVersion');
  });
});
