import { describe, expect, it, vi } from 'vitest';
import { Account, Keypair, Networks, TransactionBuilder, Contract } from '@stellar/stellar-sdk/base';
import { walletCall, type Wallet } from './stellar';
import vector from '../../../../../docs/evidencia/fixtures/resolution-v2.json';
const key = Keypair.random();
const transaction = () => new TransactionBuilder(new Account(key.publicKey(), '0'), { networkPassphrase: Networks.TESTNET, fee: '100' })
  .addOperation(new Contract(vector.contractId).call('get_config')).setTimeout(60).build();
const signer = (): Wallet => ({ connect: async () => key.publicKey(), address: async () => key.publicKey(), network: async () => Networks.TESTNET,
  sign: async xdr => xdr });
describe('wallet transaction boundary', () => {
  it('submits only the transaction that was prepared', async () => {
    const port = { prepare: vi.fn(async () => transaction()), submit: vi.fn(async () => ({ hash: 'hash' })) };
    await walletCall(port, signer(), key.publicKey(), vector.contractId, 'get_config', []);
    expect(port.submit).toHaveBeenCalledOnce();
  });
  it('does not submit after a rejected signature', async () => {
    const port = { prepare: vi.fn(async () => transaction()), submit: vi.fn() };
    await expect(walletCall(port, { ...signer(), sign: async () => { throw new Error('Rechazada'); } }, key.publicKey(), vector.contractId, 'get_config', [])).rejects.toThrow('Rechazada');
    expect(port.submit).not.toHaveBeenCalled();
  });
  it('rejects mainnet and account switches before preparation', async () => {
    const port = { prepare: vi.fn(), submit: vi.fn() };
    await expect(walletCall(port, { ...signer(), network: async () => Networks.PUBLIC }, key.publicKey(), vector.contractId, 'get_config', [])).rejects.toThrow('Testnet');
    await expect(walletCall(port, { ...signer(), address: async () => Keypair.random().publicKey() }, key.publicKey(), vector.contractId, 'get_config', [])).rejects.toThrow('cuenta');
    expect(port.prepare).not.toHaveBeenCalled();
  });
  it('rejects a changed transaction returned by the wallet', async () => {
    const original = transaction(); const changed = new TransactionBuilder(new Account(key.publicKey(), '5'), { networkPassphrase: Networks.TESTNET, fee: '100' })
      .addOperation(new Contract(vector.contractId).call('get_config')).setTimeout(60).build();
    const port = { prepare: vi.fn(async () => original), submit: vi.fn() };
    await expect(walletCall(port, { ...signer(), sign: async () => changed.toXDR() }, key.publicKey(), vector.contractId, 'get_config', [])).rejects.toThrow('diferente');
    expect(port.submit).not.toHaveBeenCalled();
  });
});
