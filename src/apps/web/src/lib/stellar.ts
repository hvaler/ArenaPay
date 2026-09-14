import * as freighter from '@stellar/freighter-api';
import { Contract, Networks, Transaction, TransactionBuilder, type xdr } from '@stellar/stellar-sdk/base';
import type { StellarRpc } from '../../../../packages/shared/src/stellar-rpc';

export interface Wallet {
  connect(): Promise<string>;
  address(): Promise<string>;
  network(): Promise<string>;
  sign(xdr: string, address: string): Promise<string>;
}
const explain = (error: unknown) => typeof error === 'string' ? error : 'La wallet rechazó la solicitud.';
export const wallet: Wallet = {
  async connect() {
    const installed = await freighter.isConnected();
    if (!installed.isConnected) throw new Error('Instala Freighter en Chrome o Edge y abre ArenaPay en ese navegador.');
    const result = await freighter.requestAccess();
    if (result.error || !result.address) throw new Error(explain(result.error));
    if (await this.network() !== Networks.TESTNET) throw new Error('Selecciona Testnet en Freighter antes de conectar.');
    return result.address;
  },
  async address() {
    const result = await freighter.getAddress();
    if (result.error || !result.address) throw new Error('Conecta Freighter para continuar.');
    return result.address;
  },
  async network() { const result = await freighter.getNetworkDetails(); if (result.error) throw new Error(explain(result.error)); return result.networkPassphrase; },
  async sign(transaction, address) {
    const result = await freighter.signTransaction(transaction, { networkPassphrase: Networks.TESTNET, address });
    if (result.error || !result.signedTxXdr) throw new Error(explain(result.error));
    if (result.signerAddress !== address) throw new Error('La wallet cambió de cuenta. Vuelve a conectar.');
    return result.signedTxXdr;
  },
};

export async function walletCall(port: Pick<StellarRpc, 'prepare' | 'submit'>, signer: Wallet, source: string, contractId: string, method: string, args: xdr.ScVal[]) {
  if (await signer.network() !== Networks.TESTNET) throw new Error('Solo se permiten operaciones en Testnet.');
  if (await signer.address() !== source) throw new Error('La cuenta de Freighter ha cambiado. Conecta el participante correcto.');
  const prepared = await port.prepare(source, new Contract(contractId).call(method, ...args));
  const signed = TransactionBuilder.fromXDR(await signer.sign(prepared.toXDR(), source), Networks.TESTNET);
  if (!(signed instanceof Transaction) || signed.hash().toString() !== prepared.hash().toString()) throw new Error('La wallet devolvió una transacción diferente.');
  return port.submit(signed);
}
