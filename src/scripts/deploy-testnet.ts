import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import { randomBytes } from 'node:crypto';
import { Address, Asset, Contract, Keypair, Operation, scValToNative, hash } from '@stellar/stellar-sdk';
import { StellarRpc } from '../packages/shared/src/stellar-rpc';
import { TESTNET, TESTNET_RPC, hex, sc } from '../packages/shared/src/stellar';

const envPath = '.env.testnet';
try { await access(envPath); } catch {
  const keys = ['ADMIN', 'REFEREE', 'DEMO_A', 'DEMO_B'].map(name => `ARENAPAY_${name}_SECRET=${Keypair.random().secret()}`);
  await writeFile(envPath, `${keys.join('\n')}\nARENAPAY_DEPLOY_SALT=${hex(randomBytes(32))}\n`, { flag: 'wx', mode: 0o600 });
}
loadEnvFile(envPath);
const admin = Keypair.fromSecret(process.env.ARENAPAY_ADMIN_SECRET!);
const referee = Keypair.fromSecret(process.env.ARENAPAY_REFEREE_SECRET!);
const rpc = new StellarRpc(TESTNET_RPC);
await rpc.assertTestnet();
const tokenId = Asset.native().contractId(TESTNET);
await mkdir('data/testnet', { recursive: true });
for (const secret of [process.env.ARENAPAY_ADMIN_SECRET!, process.env.ARENAPAY_DEMO_A_SECRET!, process.env.ARENAPAY_DEMO_B_SECRET!]) {
  const publicKey = Keypair.fromSecret(secret).publicKey();
  const existing = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`, { signal: AbortSignal.timeout(20_000) });
  if (existing.status === 404) {
    const funded = await fetch(`https://friendbot.stellar.org/?addr=${publicKey}`, { signal: AbortSignal.timeout(60_000) });
    if (!funded.ok) throw new Error(`Friendbot rechazó financiar ${publicKey}.`);
  } else if (!existing.ok) throw new Error('No se pudo comprobar la cuenta de Testnet.');
}
let deployment;
try { deployment = JSON.parse(await readFile('data/testnet/deployment.json', 'utf8')); } catch { /* First deploy. */ }
if (deployment) {
  const configured = scValToNative(await rpc.read(deployment.contractId, 'get_config', [], admin.publicKey()));
  if (configured.admin !== admin.publicKey() || hex(configured.referee) !== hex(referee.rawPublicKey()) || configured.token !== tokenId) throw new Error('El despliegue existente no coincide con las claves locales.');
  console.log(`Contrato existente verificado: ${deployment.contractId}`);
} else {
  const wasm = await readFile('target/wasm32v1-none/release/arena_escrow.wasm');
  const upload = await rpc.prepare(admin.publicKey(), Operation.uploadContractWasm({ wasm })); upload.sign(admin);
  const uploaded = await rpc.submit(upload); console.log(`WASM confirmado: ${uploaded.hash}`);
  const salt = Uint8Array.from(process.env.ARENAPAY_DEPLOY_SALT!.match(/../g)!, b => Number.parseInt(b, 16));
  const create = await rpc.prepare(admin.publicKey(), Operation.createCustomContract({ address: new Address(admin.publicKey()),
    wasmHash: hash(wasm), salt, constructorArgs: [sc.address(admin.publicKey()), sc.address(tokenId), sc.bytes(hex(referee.rawPublicKey()))] }));
  create.sign(admin); const result = await rpc.submit(create);
  if (!result.returnValue) throw new Error('Despliegue confirmado sin dirección de contrato.');
  const contractId = scValToNative(result.returnValue) as string;
  const configured = scValToNative(await rpc.read(contractId, 'get_config', [], admin.publicKey()));
  if (configured.admin !== admin.publicKey() || hex(configured.referee) !== hex(referee.rawPublicKey())) throw new Error('La inicialización del contrato no coincide.');
  deployment = { ready: true, network: 'testnet', rpcUrl: TESTNET_RPC, contractId, tokenId, adminPublicKey: admin.publicKey(),
    refereePublicKey: hex(referee.rawPublicKey()), deployTx: result.hash, wasmHash: hex(hash(wasm)), deployedAt: new Date().toISOString() };
  await writeFile('data/testnet/deployment.json', JSON.stringify(deployment, null, 2));
  console.log(`Contrato inicializado: ${contractId}`);
}
console.log(`Testnet: https://stellar.expert/explorer/testnet/contract/${deployment.contractId}`);
