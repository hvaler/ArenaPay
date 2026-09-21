import { useCallback, useEffect, useRef, useState } from 'react';
import { Keypair, StrKey } from '@stellar/stellar-sdk/base';
import type { LocalMatch } from '../../../../packages/shared/src/contracts';
import { addressSchema, fromHex, resolutionDigest, sc, type ChainBudget, type ChainMatch, type Resolution, type TestnetConfig } from '../../../../packages/shared/src/stellar';
import { StellarRpc } from '../../../../packages/shared/src/stellar-rpc';
import { verifyReplay } from '../../../../packages/shared/src/simulation';
import { wallet, walletCall } from '../lib/stellar';
import { apiUrl, publicDemo } from '../lib/runtime';

interface Snapshot { local: LocalMatch; chain: ChainMatch; ledger: number; budgetA: ChainBudget | null; budgetB: ChainBudget | null }
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(apiUrl(`/testnet${path}`), body === undefined ? { signal: AbortSignal.timeout(120_000) } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000),
  });
  const value = await response.json() as T & { message?: string };
  if (!response.ok) throw new Error(value.message ?? 'No se pudo completar la operación Testnet.');
  return value;
}
const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-5)}`;
const xlm = (stroops: string) => (Number(stroops) / 1e7).toLocaleString('es', { maximumFractionDigits: 7 });

export function TestnetPanel({ match, onMatch, onSync, onChain, onProof, onRun, running, expanded, shareUrl }: { match?: LocalMatch; onMatch: (match: LocalMatch) => void; onSync: (match: LocalMatch) => void; onChain: (chain?: ChainMatch) => void; onProof: (ready: boolean) => void; onRun: () => Promise<void>; running: boolean; expanded: boolean; shareUrl?: string }) {
  const [config, setConfig] = useState<TestnetConfig>();
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [connected, setConnected] = useState('');
  const [playerA, setPlayerA] = useState(''); const [playerB, setPlayerB] = useState('');
  const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [transaction, setTransaction] = useState('');
  const [verified, setVerified] = useState(false);
  const [resolution, setResolution] = useState<Resolution>();
  const [updated, setUpdated] = useState('');
  const activeId = useRef(match?.matchId); activeId.current = match?.matchId;
  const onSyncRef = useRef(onSync); onSyncRef.current = onSync;
  const requestSequence = useRef(0);
  const refresh = useCallback(async () => {
    if (publicDemo) return;
    const sequence = ++requestSequence.current;
    const id = match?.matchId;
    const current = await api<TestnetConfig>('/config');
    let state: Snapshot | undefined;
    try { state = match?.testnet ? await api<Snapshot>(`/matches/${id}`) : undefined; }
    catch (error) { if (activeId.current === id && sequence === requestSequence.current) { setSnapshot(undefined); onChain(undefined); } throw error; }
    if (activeId.current !== id || sequence !== requestSequence.current) return;
    setError(''); setConfig(current); setSnapshot(state); onChain(state?.chain); if (state) onSyncRef.current(state.local); setUpdated(new Date().toLocaleTimeString('es'));
  }, [match?.matchId, onChain]);
  useEffect(() => {
    let active = true;
    const update = () => { void refresh().catch(e => { if (active) setError((e as Error).message); }); };
    update();
    const timer = window.setInterval(() => { if (!document.hidden && !busy && match?.testnet) update(); }, 5000);
    const visible = () => { if (!document.hidden && !busy && match?.testnet) update(); };
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; ++requestSequence.current; window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [refresh, busy]);
  useEffect(() => { setVerified(false); setResolution(undefined); setTransaction(''); setSnapshot(undefined); onProof(false); }, [match?.matchId, onProof]);
  async function action(name: string, run: () => Promise<void>) {
    setBusy(name); setError(''); try { await run(); } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }
  const chain = match?.testnet && snapshot?.local.matchId === match.matchId ? snapshot.chain : undefined;
  const isA = connected === chain?.playerA; const isB = connected === chain?.playerB;
  const budget = isA ? snapshot?.budgetA : isB ? snapshot?.budgetB : null;
  const deposited = isA ? chain?.fundedA : isB ? chain?.fundedB : false;
  const expired = !!chain && snapshot!.ledger >= chain.timeoutLedger;
  const budgetEnough = !!budget && !!chain && BigInt(budget.maximum) - BigInt(budget.spent) >= BigInt(chain.buyIn) && budget.expiresLedger > snapshot!.ledger;
  const call = async (method: string, args: ReturnType<typeof sc.text>[]) => {
    const result = await walletCall(new StellarRpc(config!.rpcUrl, config!.readRpcUrls), wallet, connected, config!.contractId!, method, args);
    setTransaction(result.hash); await refresh();
  };
  async function checkResolution() {
    if (!chain || !match?.replay || !config?.contractId) throw new Error('Carga una partida financiada y ejecuta la simulación.');
    if (!(await verifyReplay(match.replay, chain.seedHash)).valid) throw new Error('Evidencia inconsistente. Liquidación bloqueada.');
    const result = await api<Resolution>(`/matches/${match.matchId}/resolution`, {});
    const expectedWinner = match.replay.winner === 'A' ? chain.playerA : chain.playerB;
    if (result.contractId !== config.contractId || result.matchId !== match.testnet!.chainId || result.seedHash !== chain.seedHash || result.engineVersion !== chain.engineVersion || result.winner !== expectedWinner || result.finalStateHash !== match.replay.finalStateHash) throw new Error('La firma no corresponde a esta partida.');
    if (!Keypair.fromPublicKey(StrKey.encodeEd25519PublicKey(fromHex(config.refereePublicKey!))).verify(resolutionDigest(result), fromHex(result.signature))) throw new Error('Firma del árbitro inválida.');
    if (activeId.current !== match.matchId) throw new Error('La partida ha cambiado. Vuelve a verificar.');
    setResolution(result); onProof(true); return result;
  }
  if (publicDemo) return <section className="testnet-panel" aria-labelledby="testnet-title"><h2 id="testnet-title" tabIndex={-1}>Demo pública sin wallet</h2><p>Prueba la arena en este navegador o abre el recibo del ensayo pagado. No se crean depósitos ni se solicitan firmas en esta edición.</p><p>Para nuevas partidas con fondos de prueba, utiliza la aplicación con servidor y Freighter.</p></section>;
  return <section className="testnet-panel" aria-labelledby="testnet-title">
    <div className="testnet-header"><div><h2 id="testnet-title" tabIndex={-1}>Escrow en Stellar Testnet</h2><p>Inscripción de 1 XLM de prueba por agente. Premio total: 2 XLM de prueba.</p></div><button className="button secondary" disabled={!!busy} onClick={() => void action('Conectando', async () => { const address = await wallet.connect(); setConnected(address); if (!playerA) setPlayerA(address); })}>{connected ? `Freighter: ${short(connected)}` : 'Conectar Freighter'}</button></div>
    {!config?.ready && <p className="testnet-notice">{config?.reason ?? 'Consultando configuración de Testnet…'}</p>}
    {config?.ready && <>
      <p className="testnet-contract">Contrato: <a href={`https://stellar.expert/explorer/testnet/contract/${config.contractId}`} target="_blank" rel="noreferrer">{short(config.contractId!)}</a> <span>Solo Testnet · Firmas en tu wallet</span></p>
      {config.latestMatchId && !match?.testnet && <button className="button secondary" disabled={!!busy} onClick={() => void action('Cargando ensayo', async () => { onMatch(await api<LocalMatch>('/latest')); })}>Cargar ensayo verificado de Testnet</button>}
      {!match?.testnet && expanded && <form className="testnet-create" onSubmit={event => { event.preventDefault(); void action('Creando partida', async () => {
        addressSchema.parse(playerA); addressSchema.parse(playerB);
        const created = await api<LocalMatch>('/matches', { playerA, playerB, buyIn: '10000000' });
        onMatch(created); setTransaction(created.testnet?.createTx ?? '');
      }); }}><p>El servidor elige la semilla y la reserva hasta ejecutar la partida financiada. La semilla de práctica no se utiliza aquí.</p><label>Dirección de Atlas<input value={playerA} onChange={e => setPlayerA(e.target.value.trim())} required placeholder="G…" disabled={!!busy} /></label><label>Dirección de Nova<input value={playerB} onChange={e => setPlayerB(e.target.value.trim())} required placeholder="G…" disabled={!!busy} /></label><button type="submit" className="button primary" disabled={!!busy || !connected}>Crear partida en Testnet</button></form>}
      {shareUrl && <div className="share-match"><div><strong>Enlace de la partida</strong><p>Ábrelo en otro navegador o equipo para consultar el mismo estado persistente.</p></div><button className="button secondary" disabled={!!busy} onClick={() => void action('Copiando enlace', async () => { await navigator.clipboard.writeText(shareUrl); })}>Copiar enlace</button></div>}
      {chain && <p className="next-action" role="status">{chain.status === 'Cancelled' ? 'Cancelación confirmada: se han devuelto los depósitos recibidos.' : chain.status === 'Settled' ? 'Pago confirmado. Comprueba ahora el replay contra el contrato.' : expired ? 'Plazo vencido. Conecta una cuenta participante para recuperar los depósitos.' : chain.status === 'Created' ? 'Siguiente: cada participante autoriza su presupuesto y deposita 1 XLM de prueba.' : !match?.replay ? 'Financiación completa. Ejecuta la competición.' : resolution ? 'Replay y firma comprobados. Ya puedes solicitar el pago.' : 'Comprueba el replay y la firma antes de solicitar el pago.'}</p>}
      {chain && <div className="testnet-state"><div><strong>Estado confirmado: {chain.status}</strong><p>Atlas: {chain.fundedA ? 'depósito confirmado' : 'pendiente'} · Nova: {chain.fundedB ? 'depósito confirmado' : 'pendiente'}</p><p>Última consulta: {updated}. Sincronización cada 5 segundos.</p><p>Vencimiento: ledger {chain.timeoutLedger} · Actual: {snapshot!.ledger}</p>{budget && <p>Tu presupuesto: {xlm(budget.maximum)} XLM · Utilizado: {xlm(budget.spent)} XLM · Vigencia: ledger {budget.expiresLedger}</p>}<details className="budget-details" open><summary>Presupuestos de los participantes</summary>{[['Atlas', snapshot!.budgetA], ['Nova', snapshot!.budgetB]].map(([name, value]) => { const b = value as ChainBudget | null; const available = b ? BigInt(b.maximum) - BigInt(b.spent) : 0n; return <p key={String(name)}><strong>{String(name)}</strong>: {b ? `${xlm(b.spent)} XLM utilizados · ${b.expiresLedger <= snapshot!.ledger ? 'autorización vencida' : `${xlm(String(available > 0n ? available : 0n))} XLM disponibles`}` : 'sin autorización'}</p>; })}</details><p>Solo XLM de prueba en este contrato. Cada depósito requiere firma. Las comisiones no están incluidas; una devolución no restablece el presupuesto gastado.</p></div>
        <div className="testnet-actions"><button className="button secondary" disabled={!!busy} onClick={() => void action('Consultando', refresh)}>Actualizar estado</button>
          {(isA || isB) && !expired && chain.status === 'Created' && !deposited && <><button className="button secondary" disabled={!!busy} onClick={() => void action('Autorizando presupuesto', () => call('authorize_budget', [sc.address(connected), sc.amount(BigInt(budget?.spent ?? '0') + 30_000_000n), sc.u32(chain.timeoutLedger)]))}>Autorizar hasta 3 XLM adicionales</button><button className="button primary" disabled={!!busy || !budgetEnough} onClick={() => void action('Confirmando depósito', () => call('deposit', [sc.bytes(match!.testnet!.chainId), sc.address(connected)]))}>Depositar 1 XLM de prueba</button></>}
          {chain.status === 'Funded' && !expired && !match?.replay && <button className="button primary" disabled={!!busy || running} onClick={() => void onRun()}>Ejecutar simulación</button>}
          {match?.replay && chain.status === 'Funded' && !expired && <>
            <button className="button secondary" disabled={!!busy || running} onClick={() => void action('Comprobando replay y firma', async () => { await checkResolution(); })}>Verificar replay y firma</button>
            <button className="button primary" disabled={!!busy || running || !connected || !resolution} onClick={() => void action('Liquidando premio', async () => { const result = await checkResolution(); await call('settle_match', [sc.bytes(result.matchId), sc.address(result.winner), sc.bytes(result.finalStateHash), sc.bytes(result.signature)]); })}>Cobrar premio en Testnet</button>
          </>}
          {expired && (isA || isB) && (chain.status === 'Created' || chain.status === 'Funded') && <button className="button secondary" disabled={!!busy} onClick={() => void action('Devolviendo depósitos', () => call('cancel_match', [sc.bytes(match!.testnet!.chainId), sc.address(connected)]))}>Cancelar y devolver depósitos</button>}
          {chain.status === 'Settled' && <><strong className="chain-paid">Premio liquidado: {chain.winner === chain.playerA ? 'Atlas' : 'Nova'}</strong><button className="button secondary" disabled={!!busy || !match?.replay} onClick={() => void action('Verificando evidencia', async () => {
            const result = await verifyReplay(match!.replay!, chain.seedHash);
            const winner = result.winner === 'A' ? chain.playerA : chain.playerB;
            if (!result.valid || result.actualHash !== chain.finalStateHash || winner !== chain.winner) throw new Error('Evidencia inconsistente con el contrato.'); setVerified(true);
          })}>Comprobar replay contra la cadena</button></>}
        </div></div>}
      {resolution && <p className="verification success">Replay reproducido y firma del árbitro comprobada. El pago requiere confirmación en Testnet.</p>}
      {verified && <p className="verification success">Hash coincide 100% con el resultado del contrato.</p>}
      {(transaction || (match?.matchId === config.latestMatchId && config.latestSettlementTx)) && <a className="transaction-link" href={`https://stellar.expert/explorer/testnet/tx/${transaction || config.latestSettlementTx}`} target="_blank" rel="noreferrer">Ver transacción en Testnet</a>}
    </>}
    {busy && <p role="status">{busy}… Si se requiere tu firma, Freighter mostrará la solicitud.</p>}
    {error && <div className="error-box" role="alert">{error}<button className="button secondary" disabled={!!busy} onClick={() => void action('Reintentando consulta', refresh)}>Reintentar consulta</button></div>}
  </section>;
}
