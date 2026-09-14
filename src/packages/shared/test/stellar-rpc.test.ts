import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Account, Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk/base';
import { sc } from '../src/stellar';

const endpoints = vi.hoisted(() => new Map<string, ReturnType<typeof fakeServer>>());
function fakeServer() {
  return { getNetwork: vi.fn(), simulateTransaction: vi.fn(), getLatestLedger: vi.fn(), getAccount: vi.fn(), sendTransaction: vi.fn(), getTransaction: vi.fn() };
}
vi.mock('@stellar/stellar-sdk/rpc', async importOriginal => ({
  ...await importOriginal<typeof import('@stellar/stellar-sdk/rpc')>(),
  Server: vi.fn(function (url: string) { return endpoints.get(url); }),
}));
import { StellarRpc } from '../src/stellar-rpc';

const primary = 'https://primary.example/', backup = 'https://backup.example/';
const source = Keypair.random().publicKey();
const contract = 'CDHPEYP7KEYYO3D6G44PK22MUNKF4ZBFHLOM6DUL2NOUKXNNTO4R4RID';
beforeEach(() => {
  endpoints.clear();
  for (const url of [primary, backup]) {
    const server = fakeServer();
    server.getNetwork.mockResolvedValue({ passphrase: Networks.TESTNET });
    server.simulateTransaction.mockResolvedValue({ result: { retval: sc.text('ok') }, transactionData: {}, minResourceFee: '0' });
    server.getLatestLedger.mockResolvedValue({ sequence: 100 });
    endpoints.set(url, server);
  }
});
describe('read-only RPC fallback', () => {
  it('uses the primary without querying the backup when it succeeds', async () => {
    const client = new StellarRpc(primary, [backup]);
    expect(await client.read(contract, 'get_match', [], source)).toEqual(sc.text('ok'));
    expect(endpoints.get(backup)!.getNetwork).not.toHaveBeenCalled();
  });
  it('falls back after a read failure and verifies the backup network', async () => {
    endpoints.get(primary)!.simulateTransaction.mockRejectedValue(new Error('offline'));
    expect(await new StellarRpc(primary, [backup]).read(contract, 'get_match', [], source)).toEqual(sc.text('ok'));
    expect(endpoints.get(backup)!.getNetwork).toHaveBeenCalledOnce();
    expect(endpoints.get(backup)!.sendTransaction).not.toHaveBeenCalled();
  });
  it('also falls back for ledger reads and rejects a wrong-network endpoint', async () => {
    endpoints.get(primary)!.getNetwork.mockResolvedValue({ passphrase: Networks.PUBLIC });
    expect(await new StellarRpc(primary, [backup]).latestLedger()).toEqual({ sequence: 100 });
    expect(endpoints.get(primary)!.getLatestLedger).not.toHaveBeenCalled();
  });
  it('names every attempted endpoint when all readings fail', async () => {
    for (const server of endpoints.values()) server.simulateTransaction.mockResolvedValue({ error: 'failed' });
    const promise = new StellarRpc(primary, [backup, primary]).read(contract, 'get_match', [], source);
    await expect(promise).rejects.toThrow(`RPC consultados: ${primary}, ${backup}`);
    expect(endpoints.get(primary)!.simulateTransaction).toHaveBeenCalledOnce();
  });
  it('rejects insecure fallback addresses', () => {
    expect(() => new StellarRpc(primary, ['http://backup.example'])).toThrow('HTTPS');
  });
  it('does not fall back when preparing a write fails', async () => {
    endpoints.get(primary)!.getAccount.mockRejectedValue(new Error('offline'));
    await expect(new StellarRpc(primary, [backup]).prepare(source, {} as never)).rejects.toThrow('offline');
    expect(endpoints.get(backup)!.getNetwork).not.toHaveBeenCalled();
  });
  it('submits once to the primary and reconciles by the transaction hash', async () => {
    const transaction = new TransactionBuilder(new Account(source, '0'), { fee: '100', networkPassphrase: Networks.TESTNET }).setTimeout(60).build();
    const hash = Buffer.from(transaction.hash()).toString('hex');
    endpoints.get(primary)!.sendTransaction.mockResolvedValue({ status: 'PENDING', hash });
    endpoints.get(primary)!.getTransaction.mockResolvedValue({ status: 'SUCCESS' });
    expect(await new StellarRpc(primary, [backup]).submit(transaction)).toEqual({ hash, returnValue: undefined });
    expect(endpoints.get(primary)!.sendTransaction).toHaveBeenCalledOnce();
    expect(endpoints.get(primary)!.getTransaction).toHaveBeenCalledWith(hash);
    expect(endpoints.get(backup)!.sendTransaction).not.toHaveBeenCalled();
  });
  it('reconciles by hash and never resends after an ambiguous send error', async () => {
    const transaction = new TransactionBuilder(new Account(source, '0'), { fee: '100', networkPassphrase: Networks.TESTNET }).setTimeout(60).build();
    const hash = Buffer.from(transaction.hash()).toString('hex');
    endpoints.get(primary)!.sendTransaction.mockRejectedValue(new Error('response lost'));
    endpoints.get(primary)!.getTransaction.mockResolvedValue({ status: 'SUCCESS' });
    await expect(new StellarRpc(primary, [backup]).submit(transaction)).resolves.toEqual({ hash, returnValue: undefined });
    expect(endpoints.get(primary)!.sendTransaction).toHaveBeenCalledOnce();
    expect(endpoints.get(backup)!.getNetwork).not.toHaveBeenCalled();
    expect(endpoints.get(backup)!.sendTransaction).not.toHaveBeenCalled();
  });

  it('keeps an ambiguous send pending when its hash cannot be confirmed', async () => {
    vi.useFakeTimers();
    try {
      const transaction = new TransactionBuilder(new Account(source, '0'), { fee: '100', networkPassphrase: Networks.TESTNET }).setTimeout(60).build();
      const hash = Buffer.from(transaction.hash()).toString('hex');
      endpoints.get(primary)!.sendTransaction.mockRejectedValue(new Error('response lost'));
      endpoints.get(primary)!.getTransaction.mockResolvedValue({ status: 'NOT_FOUND' });
      const assertion = expect(new StellarRpc(primary, [backup]).submit(transaction)).rejects.toThrow(`Envío ambiguo; confirmación pendiente (${hash})`);
      await vi.runAllTimersAsync();
      await assertion;
      expect(endpoints.get(primary)!.sendTransaction).toHaveBeenCalledOnce();
      expect(endpoints.get(primary)!.getTransaction).toHaveBeenCalledTimes(45);
      expect(endpoints.get(backup)!.sendTransaction).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
