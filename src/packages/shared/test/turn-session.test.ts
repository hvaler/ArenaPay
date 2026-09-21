import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createTurnSession, submitTurnAction, TurnProtocolError } from '../src/turn-session';

const move = (overrides: Record<string, unknown> = {}) => ({ actionId: randomUUID(), expectedRevision: 4,
  expectedSequence: 0, player: 'A', action: { cell: 3 }, ...overrides });
const apply = (state: unknown, action: unknown) => ({ state: { ...(state as object), ...(action as object) }, nextPlayer: 'B' });

describe('turn protocol', () => {
  it('records one action and advances the authoritative sequence', () => {
    const session = createTurnSession(['A', 'B'], 'A', { cell: null });
    const result = submitTurnAction(session, 4, move(), apply, new Date('2026-09-21T12:00:00Z'));
    expect(result.duplicate).toBe(false);
    expect(result.session).toMatchObject({ sequence: 1, activePlayer: 'B', state: { cell: 3 } });
    expect(result.session.actions[0]).toMatchObject({ sequence: 0, player: 'A', acceptedAt: '2026-09-21T12:00:00.000Z' });
  });

  it('returns an idempotent retry before rejecting its old revision and sequence', () => {
    const session = createTurnSession(['A', 'B'], 'A', {}), request = move();
    const accepted = submitTurnAction(session, 4, request, apply).session;
    expect(submitTurnAction(accepted, 5, request, apply)).toEqual({ session: accepted, duplicate: true });
  });

  it('rejects reuse of an action ID with different content', () => {
    const session = createTurnSession(['A', 'B'], 'A', {}), request = move();
    const accepted = submitTurnAction(session, 4, request, apply).session;
    expect(() => submitTurnAction(accepted, 5,
      { ...request, expectedRevision: 5, expectedSequence: 1, action: { cell: 4 } }, apply))
      .toThrow('otro contenido');
  });

  it('measures the action limit in bytes', () => {
    expect(() => submitTurnAction(createTurnSession(['A', 'B'], 'A', {}), 4,
      move({ action: { text: '€'.repeat(6_000) } }), apply)).toThrow('16 KiB');
  });

  it.each([
    [move({ expectedRevision: 3 }), 'La partida cambió'],
    [move({ expectedSequence: 1 }), 'secuencia de turno'],
    [move({ player: 'B' }), 'No es el turno'],
    [move({ player: 'C' }), 'no pertenece'],
  ])('rejects stale or unauthorized actions', (request, message) => {
    const session = createTurnSession(['A', 'B'], 'A', {});
    expect(() => submitTurnAction(session, 4, request, apply)).toThrow(message);
  });

  it('closes the session with an explicit draw', () => {
    const session = createTurnSession(['A', 'B'], 'A', {});
    const result = submitTurnAction(session, 4, move(), state => ({ state, outcome: { type: 'draw', reason: 'rules' } }));
    expect(result.session.outcome).toEqual({ type: 'draw', reason: 'rules' });
    expect(() => submitTurnAction(result.session, 5, move({ expectedRevision: 5, expectedSequence: 1, player: 'B' }), apply)).toThrow(TurnProtocolError);
  });
});
