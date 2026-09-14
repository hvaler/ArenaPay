import { Address, Networks, hash, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk/base';
import { z } from 'zod';
import type { MatchStatus } from './contracts';

export const TESTNET = Networks.TESTNET;
export const TESTNET_RPC = 'https://soroban-testnet.stellar.org';
export const STROOPS = 10_000_000n;
export const addressSchema = z.string().refine(value => { try { new Address(value); return true; } catch { return false; } }, 'Dirección Stellar inválida');
export const hex32Schema = z.string().regex(/^[0-9a-f]{64}$/);
export const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export function fromHex(value: string): Uint8Array {
  if (!/^(?:[a-f0-9]{2})+$/i.test(value)) throw new Error('Bytes hexadecimales inválidos.');
  return Uint8Array.from(value.match(/../g)!, pair => Number.parseInt(pair, 16));
}
export const sc = {
  bytes: (value: string) => nativeToScVal(fromHex(value)),
  address: (value: string) => new Address(value).toScVal(),
  u32: (value: number) => nativeToScVal(value, { type: 'u32' }),
  amount: (value: string | bigint) => nativeToScVal(BigInt(value), { type: 'i128' }),
  text: (value: string) => nativeToScVal(value, { type: 'string' }),
};
export interface Resolution {
  contractId: string; matchId: string; engineVersion: string; seedHash: string;
  winner: string; finalStateHash: string; signature: string;
}
export function resolutionDigest(value: Omit<Resolution, 'signature'>, network = TESTNET): Uint8Array {
  hex32Schema.parse(value.matchId); hex32Schema.parse(value.seedHash); hex32Schema.parse(value.finalStateHash);
  return hash(xdr.ScVal.scvVec([
    nativeToScVal('ARENAPAY_V2', { type: 'symbol' }), nativeToScVal(hash(new TextEncoder().encode(network))),
    sc.address(value.contractId), sc.bytes(value.matchId), sc.text(value.engineVersion), sc.bytes(value.seedHash),
    sc.address(value.winner), sc.bytes(value.finalStateHash),
  ]).toXDR());
}
export function onChainId(localId: string): string { return hex(hash(new TextEncoder().encode(`ARENAPAY_MATCH_V1:${localId}`))); }

export interface ChainMatch {
  playerA: string; playerB: string; buyIn: string; engineVersion: string; seedHash: string;
  timeoutLedger: number; fundedA: boolean; fundedB: boolean; status: MatchStatus;
  winner?: string; finalStateHash?: string;
}
export interface ChainBudget { maximum: string; spent: string; expiresLedger: number }
export interface TestnetConfig {
  ready: boolean; network: 'testnet'; contractId?: string; tokenId?: string; refereePublicKey?: string;
  adminPublicKey?: string; rpcUrl: string; readRpcUrls?: string[]; reason?: string;
  latestMatchId?: string; latestSettlementTx?: string;
}
export function decodeMatch(value: xdr.ScVal): ChainMatch {
  const record = scValToNative(value);
  const status = z.enum(['Created', 'Funded', 'Settled', 'Cancelled']).parse(Array.isArray(record.status) ? record.status[0] : record.status);
  return { playerA: record.player_a, playerB: record.player_b, buyIn: String(record.buy_in), engineVersion: record.engine_version,
    seedHash: hex(record.seed_hash), timeoutLedger: record.timeout_ledger, fundedA: record.funded_a, fundedB: record.funded_b,
    status, winner: record.winner ?? undefined, finalStateHash: record.final_state_hash ? hex(record.final_state_hash) : undefined };
}
