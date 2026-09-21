import { Keypair } from '@stellar/stellar-sdk/base';
import { type Replay } from '../../../packages/shared/src/contracts';
import { hex, onChainId, resolutionDigest, type ChainMatch, type Resolution } from '../../../packages/shared/src/stellar';
import { verifyReplay } from '../../../packages/shared/src/simulation';

export async function signResult(secret: string, contractId: string, localReplay: Replay, chain: ChainMatch, ledger: number): Promise<Resolution> {
  if (chain.status !== 'Funded' || !chain.fundedA || !chain.fundedB) throw new Error('La cadena no confirma los dos depósitos.');
  if (ledger >= chain.timeoutLedger) throw new Error('La partida ha vencido. Solicita la devolución.');
  if (localReplay.engineVersion !== chain.engineVersion) throw new Error('Versión de motor incompatible.');
  if (!(await verifyReplay(localReplay, chain.seedHash)).valid) throw new Error('El replay no coincide con el compromiso del contrato.');
  const value = { contractId, matchId: onChainId(localReplay.matchId), engineVersion: chain.engineVersion, seedHash: chain.seedHash,
    winner: localReplay.winner === 'A' ? chain.playerA : chain.playerB, finalStateHash: localReplay.finalStateHash };
  return { ...value, signature: hex(Keypair.fromSecret(secret).sign(resolutionDigest(value))) };
}
