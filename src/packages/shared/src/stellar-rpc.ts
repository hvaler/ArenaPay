import { Account, Contract, Networks, TransactionBuilder, type Transaction, type xdr } from '@stellar/stellar-sdk/base';
import * as rpc from '@stellar/stellar-sdk/rpc';

export class RpcReadError extends Error {}

export class StellarRpc {
  readonly server: rpc.Server;
  private readonly readers: { url: string; server: rpc.Server }[];
  constructor(readonly url: string, readFallbackUrls: readonly string[] = []) {
    this.readers = [...new Set([url, ...readFallbackUrls])].map(endpoint => {
      const parsed = new URL(endpoint);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('El RPC de Testnet debe usar HTTPS sin credenciales en la dirección.');
      return { url: `${parsed.origin}${parsed.pathname}`, server: new rpc.Server(endpoint, { timeout: 20_000 }) };
    });
    this.server = this.readers[0].server;
  }
  private async readWithFallback<T>(operation: (server: rpc.Server) => Promise<T>): Promise<T> {
    const attempted: string[] = [];
    for (const endpoint of this.readers) {
      attempted.push(endpoint.url);
      try {
        if ((await endpoint.server.getNetwork()).passphrase !== Networks.TESTNET) throw new Error('Red incorrecta.');
        return await operation(endpoint.server);
      } catch { /* Only reads can advance to the next endpoint. */ }
    }
    throw new RpcReadError(`No se pudo confirmar el estado en Testnet. RPC consultados: ${attempted.join(', ')}. Reintenta la consulta; no repitas el pago.`);
  }
  async latestLedger() {
    return this.readWithFallback(server => server.getLatestLedger());
  }
  async assertTestnet() {
    if ((await this.server.getNetwork()).passphrase !== Networks.TESTNET) throw new Error('Se rechazó una red diferente a Stellar Testnet.');
  }
  async read(contractId: string, method: string, args: xdr.ScVal[], source: string): Promise<xdr.ScVal> {
    const transaction = new TransactionBuilder(new Account(source, '0'), { fee: '100', networkPassphrase: Networks.TESTNET })
      .addOperation(new Contract(contractId).call(method, ...args)).setTimeout(60).build();
    return this.readWithFallback(async server => {
      const simulation = await server.simulateTransaction(transaction);
      if (!rpc.Api.isSimulationSuccess(simulation) || !simulation.result) throw new Error(`No se pudo consultar ${method}.`);
      return simulation.result.retval;
    });
  }
  async prepare(source: string, operation: xdr.Operation): Promise<Transaction> {
    await this.assertTestnet();
    const account = await this.server.getAccount(source);
    const transaction = new TransactionBuilder(account, { fee: '1000', networkPassphrase: Networks.TESTNET }).addOperation(operation).setTimeout(180).build();
    const simulation = await this.server.simulateTransaction(transaction);
    if (!rpc.Api.isSimulationSuccess(simulation)) throw new Error(`Simulación de contrato rechazada: ${rpc.Api.isSimulationError(simulation) ? simulation.error : 'restauración de almacenamiento requerida'}`);
    return rpc.assembleTransaction(transaction, simulation).build();
  }
  async submit(transaction: Transaction): Promise<{ hash: string; returnValue?: xdr.ScVal }> {
    await this.assertTestnet();
    const expectedHash = Array.from(transaction.hash(), byte => byte.toString(16).padStart(2, '0')).join('');
    let ambiguousSend = false;
    let sent: Awaited<ReturnType<rpc.Server['sendTransaction']>> | undefined;
    try {
      sent = await this.server.sendTransaction(transaction);
    } catch {
      ambiguousSend = true;
    }
    if (sent?.status === 'ERROR') throw new Error(`Transacción rechazada (${expectedHash}).`);
    if (sent?.status === 'TRY_AGAIN_LATER') throw new Error(`RPC ocupado. Consulta ${expectedHash} antes de reintentar.`);
    for (let attempt = 0; attempt < 45; attempt++) {
      let result: Awaited<ReturnType<rpc.Server['getTransaction']>> | undefined;
      try {
        result = await this.server.getTransaction(expectedHash);
      } catch {
        // The primary may recover while the signed transaction is already in flight.
      }
      if (result?.status === rpc.Api.GetTransactionStatus.SUCCESS) return { hash: expectedHash, returnValue: result.returnValue };
      if (result?.status === rpc.Api.GetTransactionStatus.FAILED) throw new Error(`Transacción fallida (${expectedHash}).`);
      if (attempt < 44) await new Promise(resolve => setTimeout(resolve, 1500));
    }
    throw new Error(`${ambiguousSend ? 'Envío ambiguo; ' : ''}confirmación pendiente (${expectedHash}). Consulta el estado antes de repetir.`);
  }
}
