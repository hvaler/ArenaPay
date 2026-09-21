import * as freighter from '@stellar/freighter-api';
import { Contract, Networks, Transaction, TransactionBuilder, type xdr } from '@stellar/stellar-sdk/base';
import type { StellarRpc } from '../../../../packages/shared/src/stellar-rpc';

export interface Wallet {
  connect(): Promise<string>;
  address(): Promise<string>;
  network(): Promise<string>;
  sign(xdr: string, address: string): Promise<string>;
}
const explain = (error: unknown) => {
  if (typeof error === 'string') return error;
  const message = (error as { message?: string } | undefined)?.message;
  return message ?? 'La wallet rechazó la solicitud.';
};

export const WALLET_ABSENT = 'Freighter no responde en este navegador. Comprueba que la extensión esté instalada, desbloqueada y con permiso para este sitio: en Edge y Brave suele quedar limitada a «al hacer clic», y hay que concederle acceso desde el icono de extensiones.';

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// La biblioteca solo pone plazo a REQUEST_CONNECTION_STATUS y REQUEST_PUBLIC_KEY. El mensaje de
// REQUEST_ACCESS que envía requestAccess() no lo lleva, así que si nadie responde su promesa no se
// resuelve nunca. isConnected() sí usa uno de los tipos con plazo, de modo que sirve de sondeo.
export async function walletAnswers(attempts = 3, wait = pause): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if ((await freighter.isConnected()).isConnected) return true;
    if (attempt + 1 < attempts) await wait(300);
  }
  return false;
}

export const wallet: Wallet = {
  async connect() {
    // requestAccess() abre la ventana de Freighter y espera a que la persona decida, así que no
    // puede llevar plazo propio. Se sondea en paralelo para poder avisar en lugar de dejar el
    // botón colgado: quien gane la carrera decide, y la concesión sigue siendo la que manda.
    const access = freighter.requestAccess();
    void access.catch(() => undefined);
    const answered = await Promise.race([access.then(() => true, () => true), walletAnswers()]);
    if (!answered) throw new Error(WALLET_ABSENT);
    const result = await access;
    if (result.error) throw new Error(explain(result.error));
    if (!result.address) throw new Error(WALLET_ABSENT);
    if (await this.network() !== Networks.TESTNET) throw new Error('Freighter está en otra red. Abre su selector de red, el icono del globo, y cambia a Testnet antes de conectar.');
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
