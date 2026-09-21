import { describe, expect, it } from 'vitest';
import { Keypair, Networks, StrKey } from '@stellar/stellar-sdk/base';
import vector from '../../../../docs/evidencia/fixtures/resolution-v2.json';
import { fromHex, hex, onChainId, resolutionDigest } from '../src/stellar';

describe('Stellar signature domain', () => {
  it('matches the Rust-compatible XDR fixture and verifies its signature', () => {
    expect(hex(resolutionDigest(vector))).toBe(vector.digest);
    const referee = Keypair.fromPublicKey(StrKey.encodeEd25519PublicKey(fromHex(vector.refereePublicKey)));
    expect(referee.verify(resolutionDigest(vector), fromHex(vector.signature))).toBe(true);
  });
  it('binds network, contract, match, seed, version, winner and final hash', () => {
    const base = hex(resolutionDigest(vector));
    expect(hex(resolutionDigest(vector, Networks.PUBLIC))).not.toBe(base);
    for (const changed of [ { contractId: StrKey.encodeContract(new Uint8Array(32).fill(1)) }, { matchId: '44'.repeat(32) },
      { seedHash: '55'.repeat(32) }, { engineVersion: 'v2' }, { winner: Keypair.random().publicKey() }, { finalStateHash: '66'.repeat(32) } ]) {
      expect(hex(resolutionDigest({ ...vector, ...changed }))).not.toBe(base);
    }
  });
  it('maps a local id to stable domain-separated bytes32', () => {
    expect(onChainId('one')).toHaveLength(64); expect(onChainId('one')).toBe(onChainId('one')); expect(onChainId('one')).not.toBe(onChainId('two'));
  });
});
