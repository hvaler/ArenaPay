import { describe, expect, it } from 'vitest';
import { Keypair } from '@stellar/stellar-sdk/base';
import { buildReplay } from '../../../packages/shared/src/simulation';
import { fromHex, resolutionDigest, type ChainMatch } from '../../../packages/shared/src/stellar';
import vector from '../../../../docs/evidencia/fixtures/resolution-v2.json';
import { signResult } from '../src/referee';
const replay = await buildReplay('00000000-0000-4000-8000-000000000001', 2026);
const chain: ChainMatch = { playerA: Keypair.random().publicKey(), playerB: Keypair.random().publicKey(), buyIn: '100',
  seedHash: replay.seedHash, engineVersion: replay.engineVersion, timeoutLedger: 200, fundedA: true, fundedB: true, status: 'Funded' };
const key = Keypair.random();
describe('referee', () => {
  it('signs a reproduced result only for a funded on-chain match', async () => {
    const signed = await signResult(key.secret(), vector.contractId, replay, chain, 100);
    expect(key.verify(resolutionDigest(signed), fromHex(signed.signature))).toBe(true);
    expect(signed.winner).toBe(replay.winner === 'A' ? chain.playerA : chain.playerB);
  });
  it('rejects missing funding, expired rounds and mismatched commitments', async () => {
    await expect(signResult(key.secret(), vector.contractId, replay, { ...chain, status: 'Created' }, 100)).rejects.toThrow();
    await expect(signResult(key.secret(), vector.contractId, replay, { ...chain, fundedB: false }, 100)).rejects.toThrow();
    await expect(signResult(key.secret(), vector.contractId, replay, chain, 200)).rejects.toThrow();
    await expect(signResult(key.secret(), vector.contractId, replay, { ...chain, seedHash: '0'.repeat(64) }, 100)).rejects.toThrow();
  });
});
