import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { Contract, Keypair, scValToNative } from '@stellar/stellar-sdk/base';
import { ENGINE_VERSION } from '../../../packages/shared/src/contracts';
import { decodeMatch, hex, onChainId, sc, TESTNET_RPC, type ChainBudget, type TestnetConfig } from '../../../packages/shared/src/stellar';
import { StellarRpc } from '../../../packages/shared/src/stellar-rpc';
import { MatchError, MatchService } from './match-service';
import { signResult } from './referee';

export class TestnetService {
  private creating = false;
  constructor(private matches: MatchService) {}
  async configuration(): Promise<TestnetConfig> {
    if (!process.env.ARENAPAY_ADMIN_SECRET && existsSync('.env.testnet')) loadEnvFile('.env.testnet');
    let data: TestnetConfig;
    const deploymentFile = process.env.ARENAPAY_DEPLOYMENT_FILE ?? 'data/testnet/deployment.json';
    try { data = JSON.parse(await readFile(deploymentFile, 'utf8')); }
    catch { return { ready: false, network: 'testnet', rpcUrl: TESTNET_RPC, reason: process.env.ARENAPAY_PUBLIC_MODE === 'true' ? 'El servicio de Testnet no está disponible temporalmente.' : 'Contrato de Testnet aún no desplegado. Ejecuta npm run deploy:testnet.' }; }
    const ready = Boolean(process.env.ARENAPAY_ADMIN_SECRET && process.env.ARENAPAY_REFEREE_SECRET);
    const readRpcUrls = process.env.ARENAPAY_READ_RPC_URLS?.split(',').map(url => url.trim()).filter(Boolean) ?? data.readRpcUrls ?? [];
    return { ready, network: 'testnet', rpcUrl: process.env.ARENAPAY_RPC_URL ?? data.rpcUrl, readRpcUrls, contractId: data.contractId, tokenId: data.tokenId,
      refereePublicKey: data.refereePublicKey, adminPublicKey: data.adminPublicKey,
      latestMatchId: data.latestMatchId, latestSettlementTx: data.latestSettlementTx,
      reason: ready ? undefined : process.env.ARENAPAY_PUBLIC_MODE === 'true' ? 'El servicio de Testnet no está disponible temporalmente.' : 'Reinicia el motor para cargar la configuración local de Testnet.' };
  }
  private async context() {
    const config = await this.configuration();
    if (!config.ready || !config.contractId || !config.adminPublicKey) throw new MatchError(503, config.reason ?? 'Testnet no configurada.');
    const rpc = new StellarRpc(config.rpcUrl, config.readRpcUrls);
    const actual = scValToNative(await rpc.read(config.contractId, 'get_config', [], config.adminPublicKey));
    if (actual.admin !== config.adminPublicKey || actual.token !== config.tokenId || hex(actual.referee) !== config.refereePublicKey
      || Keypair.fromSecret(process.env.ARENAPAY_ADMIN_SECRET!).publicKey() !== config.adminPublicKey
      || hex(Keypair.fromSecret(process.env.ARENAPAY_REFEREE_SECRET!).rawPublicKey()) !== config.refereePublicKey) throw new MatchError(503, 'La configuración no coincide con el contrato.');
    return { config, rpc, contractId: config.contractId, source: config.adminPublicKey };
  }
  async create(playerA: string, playerB: string, buyIn: string) {
    if (this.creating) throw new MatchError(409, 'Hay una creación en curso. Espera su confirmación.');
    if (playerA === playerB) throw new MatchError(400, 'Los participantes deben ser diferentes.');
    this.creating = true;
    try {
      const { rpc, contractId } = await this.context();
      const local = await this.matches.createTestnet(contractId);
      const chainId = onChainId(local.matchId);
      // Binding is persisted before the transaction: the local run endpoint cannot bypass funding.
      const bound = local;
      const ledger = await rpc.latestLedger();
      const operation = new Contract(contractId).call('create_match', sc.bytes(chainId), sc.address(playerA), sc.address(playerB),
        sc.amount(buyIn), sc.text(ENGINE_VERSION), sc.bytes(local.seedHash), sc.u32(ledger.sequence + 720));
      const key = Keypair.fromSecret(process.env.ARENAPAY_ADMIN_SECRET!);
      const tx = await rpc.prepare(key.publicKey(), operation); tx.sign(key);
      const sent = await rpc.submit(tx);
      return { ...bound, testnet: { ...bound.testnet!, createTx: sent.hash } };
    } finally { this.creating = false; }
  }
  async state(localId: string) {
    const local = await this.matches.get(localId);
    const { rpc, contractId, source } = await this.context();
    if (local.testnet?.contractId !== contractId) throw new MatchError(409, 'Esta partida no pertenece al contrato configurado.');
    const chain = decodeMatch(await rpc.read(contractId, 'get_match', [sc.bytes(local.testnet.chainId)], source));
    const budget = async (player: string): Promise<ChainBudget | null> => {
      const value = scValToNative(await rpc.read(contractId, 'get_budget', [sc.address(player)], source));
      return value ? { maximum: String(value.maximum), spent: String(value.spent), expiresLedger: value.expires_ledger } : null;
    };
    const [budgetA, budgetB, ledger] = await Promise.all([budget(chain.playerA), budget(chain.playerB), rpc.latestLedger()]);
    return { local, chain, budgetA, budgetB, ledger: ledger.sequence };
  }
  async run(localId: string) {
    const { local, chain, ledger } = await this.state(localId);
    if (chain.status !== 'Funded' || ledger >= chain.timeoutLedger) throw new MatchError(409, 'La partida necesita dos depósitos confirmados y un plazo vigente.');
    return local.replay ? local : this.matches.run(localId, local.testnet);
  }
  async resolution(localId: string) {
    const { local, chain, ledger } = await this.state(localId);
    if (!local.replay) throw new MatchError(409, 'Ejecuta la partida antes de solicitar la firma.');
    return signResult(process.env.ARENAPAY_REFEREE_SECRET!, local.testnet!.contractId, local.replay, chain, ledger);
  }
}
