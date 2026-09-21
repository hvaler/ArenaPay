import { loadEnvFile } from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { Contract, Keypair, scValToNative } from '@stellar/stellar-sdk/base';
import { StellarRpc } from '../packages/shared/src/stellar-rpc';
import { sc, type TestnetConfig } from '../packages/shared/src/stellar';
import { verifyReplay } from '../packages/shared/src/simulation';
import { MatchService } from '../services/match-engine/src/match-service';
import { TestnetService } from '../services/match-engine/src/testnet-service';

loadEnvFile('.env.testnet');
const deployment: TestnetConfig = JSON.parse(await readFile('data/testnet/deployment.json', 'utf8'));
const rpc = new StellarRpc(deployment.rpcUrl);
await rpc.assertTestnet();
const admin = Keypair.fromSecret(process.env.ARENAPAY_ADMIN_SECRET!);
const a = Keypair.fromSecret(process.env.ARENAPAY_DEMO_A_SECRET!);
const b = Keypair.fromSecret(process.env.ARENAPAY_DEMO_B_SECRET!);
const matches = new MatchService(); const service = new TestnetService(matches);
const match = await service.create(a.publicKey(), b.publicKey(), '10000000');
const chainId = match.testnet!.chainId;
console.log(`Partida creada: ${match.matchId}`);
const call = async (key: Keypair, method: string, args: ReturnType<typeof sc.text>[]) => {
  const transaction = await rpc.prepare(key.publicKey(), new Contract(deployment.contractId!).call(method, ...args));
  transaction.sign(key); return rpc.submit(transaction);
};
const initial = await service.state(match.matchId);
const capA = BigInt(initial.budgetA?.spent ?? '0');
await call(a, 'authorize_budget', [sc.address(a.publicKey()), sc.amount(capA), sc.u32(initial.chain.timeoutLedger)]);
await assert.rejects(() => rpc.prepare(a.publicKey(), new Contract(deployment.contractId!).call('deposit', sc.bytes(chainId), sc.address(a.publicKey()))));
assert.equal((await service.state(match.matchId)).chain.fundedA, false);
console.log('Presupuesto excedido: depósito rechazado sin mover fondos.');
const receipts: Record<string, string> = { created: match.testnet!.createTx! };
for (const key of [a, b]) {
  const state = await service.state(match.matchId);
  const spent = key === a ? state.budgetA?.spent : state.budgetB?.spent;
  await call(key, 'authorize_budget', [sc.address(key.publicKey()), sc.amount(BigInt(spent ?? '0') + 30_000_000n), sc.u32(state.chain.timeoutLedger)]);
  const deposit = await call(key, 'deposit', [sc.bytes(chainId), sc.address(key.publicKey())]);
  receipts[key === a ? 'depositA' : 'depositB'] = deposit.hash;
}
const funded = await service.state(match.matchId); assert.equal(funded.chain.status, 'Funded');
const completed = await service.run(match.matchId);
assert.equal((await verifyReplay(completed.replay!, funded.chain.seedHash)).valid, true);
const resolution = await service.resolution(match.matchId);
const tokenBalance = async (address: string) => BigInt(scValToNative(await rpc.read(deployment.tokenId!, 'balance', [sc.address(address)], admin.publicKey())));
const before = await tokenBalance(resolution.winner);
const escrowBefore = await tokenBalance(deployment.contractId!);
const settled = await call(admin, 'settle_match', [sc.bytes(chainId), sc.address(resolution.winner), sc.bytes(resolution.finalStateHash), sc.bytes(resolution.signature)]);
receipts.settled = settled.hash;
const after = await tokenBalance(resolution.winner);
const escrowAfter = await tokenBalance(deployment.contractId!);
assert.equal(after - before, 20_000_000n); assert.equal(escrowBefore - escrowAfter, 20_000_000n);
const final = await service.state(match.matchId);
assert.equal(final.chain.status, 'Settled'); assert.equal(final.chain.finalStateHash, completed.replay!.finalStateHash);
assert.equal(final.chain.winner, resolution.winner);
await assert.rejects(() => rpc.prepare(admin.publicKey(), new Contract(deployment.contractId!).call('settle_match', sc.bytes(chainId), sc.address(resolution.winner), sc.bytes(resolution.finalStateHash), sc.bytes(resolution.signature))));
const evidence = { network: 'testnet', contractId: deployment.contractId, tokenId: deployment.tokenId, localMatchId: match.matchId,
  chainMatchId: chainId, finalStateHash: final.chain.finalStateHash, winner: final.chain.winner, payoutStroops: String(after - before),
  winnerBalanceBefore: String(before), winnerBalanceAfter: String(after), escrowBalanceBefore: String(escrowBefore), escrowBalanceAfter: String(escrowAfter),
  budgetExceededRejected: true, duplicateSettlementRejected: true, receipts, verifiedAt: new Date().toISOString() };
// Preserve the historical v1 receipt and replay used by the public demo.
await writeFile('docs/evidencia/testnet-evidence-v2.json', JSON.stringify(evidence, null, 2));
await writeFile('docs/evidencia/fixtures/testnet-replay-v2.json', JSON.stringify(completed.replay, null, 2));
await writeFile('data/testnet/deployment.json', JSON.stringify({ ...deployment, latestMatchId: match.matchId, latestSettlementTx: settled.hash }, null, 2));
console.log(`Premio de 2 XLM de prueba confirmado: https://stellar.expert/explorer/testnet/tx/${settled.hash}`);
console.log(`Replay y contrato coinciden: ${final.chain.finalStateHash}`);
