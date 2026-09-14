import { describe, expect, it } from 'vitest';
import { journeyStep } from './Journey';
import type { ChainMatch } from '../../../../packages/shared/src/stellar';
const chain: ChainMatch = { playerA: 'A', playerB: 'B', buyIn: '10000000', engineVersion: 'v1', seedHash: '', timeoutLedger: 100, fundedA: false, fundedB: false, status: 'Created' };
describe('progreso basado en confirmaciones', () => {
  it('un replay local o una verificación no acredita financiación ni pago', () => {
    expect(journeyStep(undefined, true, true)).toBe(0);
    expect(journeyStep(chain, true, true)).toBe(1);
    expect(journeyStep({ ...chain, status: 'Funded' }, true, true)).toBe(4);
  });
  it('solo el contrato confirmado completa el recorrido y distingue cancelación', () => {
    expect(journeyStep({ ...chain, status: 'Settled' })).toBe(5);
    expect(journeyStep({ ...chain, status: 'Cancelled' }, true, true)).toBe(-1);
  });
});
