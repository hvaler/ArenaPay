import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { scValToNative, nativeToScVal } from '@stellar/stellar-sdk/base';
import { StellarRpc } from '../packages/shared/src/stellar-rpc';
import { hex, sc, TESTNET_RPC } from '../packages/shared/src/stellar';
import { evidenceFile, evidenceOptions } from './evidence-options';
const options = evidenceOptions(process.argv.slice(2));
const evidencePath = await evidenceFile(options.version);
const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
const rpc = new StellarRpc(TESTNET_RPC); await rpc.assertTestnet();
const transaction = await rpc.server.getTransaction(evidence.receipts.settled);
assert.equal(transaction.status, 'SUCCESS');
const startLedger = transaction.status === 'SUCCESS' ? transaction.ledger : 0;
const result = await rpc.server.getEvents({ startLedger, filters: [{ type: 'contract', contractIds: [evidence.contractId],
  topics: [[nativeToScVal('settled', { type: 'symbol' }).toXDR('base64'), sc.bytes(evidence.chainMatchId).toXDR('base64')]] }], limit: 100 });
const settled = result.events.filter(event => event.txHash === evidence.receipts.settled && event.inSuccessfulContractCall);
assert.equal(settled.length, 1);
const [winner, finalHash] = scValToNative(settled[0].value);
assert.equal(winner, evidence.winner); assert.equal(hex(finalHash), evidence.finalStateHash);
if (options.update) {
  await evidenceFile(options.version); // Recheck before the optional write in this trusted local workspace.
  await writeFile(evidencePath, JSON.stringify({ ...evidence, settlementEventCount: 1, settlementLedger: settled[0].ledger, settlementEventId: settled[0].id }, null, 2));
}
console.log('Un único evento settled confirmado, con ganador y hash correctos.');
