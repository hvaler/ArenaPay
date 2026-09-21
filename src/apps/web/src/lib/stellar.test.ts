import { afterEach, describe, expect, it, vi } from 'vitest';
import { Account, Keypair, Networks, TransactionBuilder, Contract } from '@stellar/stellar-sdk/base';
import * as freighter from '@stellar/freighter-api';
import { WALLET_ABSENT, wallet, walletAnswers, walletCall, type Wallet } from './stellar';

// La extensión no existe fuera del navegador; se sustituye para poder provocar cada respuesta
// que da al conectar: cuenta concedida, nadie escuchando y rechazo explícito.
vi.mock('@stellar/freighter-api', () => ({ requestAccess: vi.fn(), getNetworkDetails: vi.fn(), isConnected: vi.fn() }));
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

describe('wallet connection across browsers', () => {
  const freighterMock = freighter as unknown as {
    requestAccess: ReturnType<typeof vi.fn>;
    getNetworkDetails: ReturnType<typeof vi.fn>;
    isConnected: ReturnType<typeof vi.fn>;
  };
  const address = Keypair.random().publicKey();
  const nunca = () => new Promise<never>(() => {});
  afterEach(() => { vi.clearAllMocks(); });

  it('connects without consulting the window.freighter flag', async () => {
    // Edge publica esa marca más tarde que Chrome: la conexión no debe depender de ella.
    delete (globalThis as { freighter?: boolean }).freighter;
    freighterMock.requestAccess.mockResolvedValue({ address });
    freighterMock.isConnected.mockResolvedValue({ isConnected: false });
    freighterMock.getNetworkDetails.mockResolvedValue({ networkPassphrase: Networks.TESTNET });
    await expect(wallet.connect()).resolves.toBe(address);
  });

  it('gives up instead of hanging when the extension never answers', async () => {
    // REQUEST_ACCESS no lleva plazo en la biblioteca: sin este corte el botón queda colgado.
    freighterMock.requestAccess.mockImplementation(nunca);
    freighterMock.isConnected.mockResolvedValue({ isConnected: false });
    await expect(wallet.connect()).rejects.toThrow(WALLET_ABSENT);
  });

  it('waits for a slow approval when the wallet does answer the probe', async () => {
    freighterMock.isConnected.mockResolvedValue({ isConnected: true });
    freighterMock.requestAccess.mockReturnValue(new Promise(resolve => setTimeout(() => resolve({ address }), 40)));
    freighterMock.getNetworkDetails.mockResolvedValue({ networkPassphrase: Networks.TESTNET });
    await expect(wallet.connect()).resolves.toBe(address);
  });

  it('surfaces the reason the wallet gave instead of the install notice', async () => {
    freighterMock.requestAccess.mockResolvedValue({ address: '', error: { code: -1, message: 'User declined access' } });
    freighterMock.isConnected.mockResolvedValue({ isConnected: true });
    await expect(wallet.connect()).rejects.toThrow('User declined access');
  });

  it('refuses a wallet that is not on Testnet', async () => {
    freighterMock.requestAccess.mockResolvedValue({ address });
    freighterMock.isConnected.mockResolvedValue({ isConnected: true });
    freighterMock.getNetworkDetails.mockResolvedValue({ networkPassphrase: Networks.PUBLIC });
    await expect(wallet.connect()).rejects.toThrow('Testnet');
  });

  it('retries the probe before declaring the wallet unreachable', async () => {
    freighterMock.isConnected
      .mockResolvedValueOnce({ isConnected: false })
      .mockResolvedValueOnce({ isConnected: false })
      .mockResolvedValueOnce({ isConnected: true });
    const wait = vi.fn(async () => {});
    await expect(walletAnswers(3, wait)).resolves.toBe(true);
    expect(freighterMock.isConnected).toHaveBeenCalledTimes(3);
  });
});
