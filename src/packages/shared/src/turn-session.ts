import { z } from 'zod';
import { canonicalJson } from './hash';
import type { MatchOutcome } from './replay-envelope';

export const turnParticipantSchema = z.string().min(1).max(64);
export const turnActionRequestSchema = z.object({
  actionId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
  expectedSequence: z.number().int().nonnegative(),
  player: turnParticipantSchema,
  action: z.unknown().refine(value => value !== undefined, 'La acción es obligatoria.'),
}).strict();

export type TurnActionRequest = z.infer<typeof turnActionRequestSchema>;
export interface RecordedTurnAction {
  actionId: string;
  sequence: number;
  player: string;
  action: unknown;
  acceptedAt: string;
}
export interface TurnSession {
  participants: readonly string[];
  sequence: number;
  activePlayer: string;
  state: unknown;
  actions: readonly RecordedTurnAction[];
  outcome?: MatchOutcome;
}
export interface TurnTransition {
  state: unknown;
  nextPlayer?: string;
  outcome?: MatchOutcome;
}

export class TurnProtocolError extends Error {
  constructor(readonly statusCode: 400 | 403 | 409 | 413, message: string) { super(message); }
}

export function createTurnSession(participants: readonly string[], activePlayer: string, state: unknown): TurnSession {
  const unique = new Set(participants);
  if (participants.length < 2 || unique.size !== participants.length || !unique.has(activePlayer)) {
    throw new TurnProtocolError(400, 'La sesión necesita participantes únicos y un turno inicial válido.');
  }
  participants.forEach(participant => turnParticipantSchema.parse(participant));
  return { participants: [...participants], sequence: 0, activePlayer, state, actions: [] };
}

/** Applies one action atomically. Duplicate action IDs return the earlier result before stale checks. */
export function submitTurnAction(
  session: TurnSession,
  currentRevision: number,
  raw: unknown,
  apply: (state: unknown, action: unknown, player: string) => TurnTransition,
  now = new Date(),
): { session: TurnSession; duplicate: boolean } {
  const request = turnActionRequestSchema.parse(raw);
  let serializedAction: string;
  try { serializedAction = canonicalJson(request.action); }
  catch { throw new TurnProtocolError(400, 'La acción no se puede serializar.'); }
  if (new TextEncoder().encode(serializedAction).byteLength > 16_384) {
    throw new TurnProtocolError(413, 'La acción supera el límite de 16 KiB.');
  }
  const duplicate = session.actions.find(action => action.actionId === request.actionId);
  if (duplicate) {
    if (duplicate.player !== request.player || canonicalJson(duplicate.action) !== serializedAction) {
      throw new TurnProtocolError(409, 'El identificador de acción ya se utilizó con otro contenido.');
    }
    return { session, duplicate: true };
  }
  if (session.outcome) throw new TurnProtocolError(409, 'La partida ya terminó.');
  if (request.expectedRevision !== currentRevision) throw new TurnProtocolError(409, 'La partida cambió. Actualiza el estado antes de mover.');
  if (request.expectedSequence !== session.sequence) throw new TurnProtocolError(409, 'La secuencia de turno está desactualizada.');
  if (!session.participants.includes(request.player)) throw new TurnProtocolError(403, 'El participante no pertenece a esta partida.');
  if (request.player !== session.activePlayer) throw new TurnProtocolError(409, 'No es el turno de este participante.');

  const transition = apply(session.state, request.action, request.player);
  if (!transition.outcome && (!transition.nextPlayer || !session.participants.includes(transition.nextPlayer))) {
    throw new TurnProtocolError(400, 'El motor no declaró el siguiente turno.');
  }
  const recorded: RecordedTurnAction = { actionId: request.actionId, sequence: session.sequence,
    player: request.player, action: request.action, acceptedAt: now.toISOString() };
  return { duplicate: false, session: { ...session, state: transition.state,
    sequence: session.sequence + 1, activePlayer: transition.nextPlayer ?? session.activePlayer,
    actions: [...session.actions, recorded], outcome: transition.outcome } };
}
