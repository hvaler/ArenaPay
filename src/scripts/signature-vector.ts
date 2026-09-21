import { writeFile, mkdir } from 'node:fs/promises';
import { Address, Keypair, StrKey } from '@stellar/stellar-sdk';
import { hex, resolutionDigest } from '../packages/shared/src/stellar';

// Public, deterministic test material. Never used as a deployed referee.
const key = Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(7));
const value = { contractId: new Address(StrKey.encodeContract(new Uint8Array(32))).toString(),
  matchId: '11'.repeat(32), engineVersion: 'resource-arena/1.0.0', seedHash: '22'.repeat(32),
  winner: Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(8)).publicKey(), finalStateHash: '33'.repeat(32) };
const digest = resolutionDigest(value);
await mkdir('docs/evidencia/fixtures', { recursive: true });
await writeFile('docs/evidencia/fixtures/resolution-v2.json', JSON.stringify({ ...value, digest: hex(digest), refereePublicKey: hex(key.rawPublicKey()), signature: hex(key.sign(digest)) }, null, 2));
console.log('Vector público TypeScript/Rust guardado.');
