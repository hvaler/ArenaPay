import { useCallback, useEffect, useRef, useState } from 'react';
import { ENGINE_VERSION, PRODUCT_STATEMENT, TICKS, replaySchema, type LocalMatch, type Replay } from '../../../packages/shared/src/contracts';
import { initialState, runSimulation, verifyReplay } from '../../../packages/shared/src/simulation';
import { GameBoard, getGamePresentation } from './games/presentations';
import { matchApi } from './lib/api';
import { operationalPublic, publicDemo } from './lib/runtime';
import { Journey } from './components/Journey';
import { TestnetPanel } from './components/TestnetPanel';
// Evidencia del motor vigente (v2). El ensayo v1 se conserva en docs/evidencia/fixtures/testnet-replay.json
// como vector de regresion historico: src/packages/shared/test/simulation.test.ts comprueba que el
// motor congelado sigue reproduciendo sus hashes.
import evidence from '../../../../docs/evidencia/testnet-evidence-v2.json';
import exampleReplay from '../../../../docs/evidencia/fixtures/testnet-replay-v2.json';
import type { ChainMatch } from '../../../packages/shared/src/stellar';
import { absoluteMatchUrl, matchIdFromPath, replaceMatchPath } from './lib/match-url';

type Verification = 'idle' | 'checking' | 'valid' | 'invalid';
const agentName = (player: 'A' | 'B') => player === 'A' ? 'Atlas' : 'Nova';

export default function App() {
  const [seed, setSeed] = useState('2026');
  const [match, setMatch] = useState<LocalMatch>();
  const [replay, setReplay] = useState<Replay>();
  const [frames, setFrames] = useState(() => [initialState(2026)]);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState<Verification>('idle');
  const [imported, setImported] = useState(false);
  const [historical, setHistorical] = useState(false);
  const [proofReady, setProofReady] = useState(false);
  const [testnetMode, setTestnetMode] = useState(false);
  const [chain, setChain] = useState<ChainMatch>();
  const fileInput = useRef<HTMLInputElement>(null);
  const matchRef = useRef(match); matchRef.current = match;
  const state = frames[Math.min(tick, frames.length - 1)];
  const engineVersion = replay?.engineVersion ?? match?.engineVersion ?? ENGINE_VERSION;
  const presentation = getGamePresentation(engineVersion);
  const finished = Boolean(replay) && tick === TICKS;
  const inFlight = busy || verification === 'checking';

  const loadReplay = useCallback((value: Replay) => {
    const parsed = replaySchema.parse(value);
    const result = runSimulation(parsed.seed, parsed.inputs, parsed.engineVersion);
    setReplay(parsed); setFrames(result.frames); setTick(0); setVerification('idle');
  }, []);

  const acceptTestnetMatch = useCallback((created: LocalMatch) => {
    setChain(undefined); setHistorical(false); setTestnetMode(true); setProofReady(false); setMatch(created);
    replaceMatchPath(created.matchId);
    if (created.seed !== undefined) setSeed(String(created.seed));
    if (created.replay) loadReplay(created.replay);
    else { setReplay(undefined); const preview = initialState(created.seed ?? 2026); if (created.seed === undefined) preview.resources = []; setFrames([preview]); }
    setTick(0); setPlaying(false); setVerification('idle'); setImported(false);
  }, [loadReplay]);

  const syncTestnetMatch = useCallback((updated: LocalMatch) => {
    const current = matchRef.current;
    if (current?.matchId !== updated.matchId) return;
    const changed = (updated.revision ?? 0) > (current.revision ?? 0)
      || updated.status !== current.status || Boolean(updated.replay) !== Boolean(current.replay);
    if (!changed) return;
    matchRef.current = updated; setMatch(updated);
    if (updated.replay && !current.replay) { loadReplay(updated.replay); setPlaying(false); }
  }, [loadReplay]);

  useEffect(() => {
    if (publicDemo) return;
    const id = matchIdFromPath(window.location.pathname);
    if (!id) return;
    let active = true;
    setBusy(true); setError('');
    void matchApi.get(id, true).then(value => { if (active) acceptTestnetMatch(value); })
      .catch(error => { if (active) setError(`No se pudo abrir la partida compartida: ${(error as Error).message}`); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [acceptTestnetMatch]);

  useEffect(() => {
    if (!playing || !replay) return;
    if (tick >= TICKS) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setTick(current => Math.min(TICKS, current + 1)), 280 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, tick, replay, speed]);

  useEffect(() => {
    if (!testnetMode) return;
    const target = document.getElementById('testnet-title');
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [testnetMode]);

  async function createMatch() {
    if (!/^\d+$/.test(seed) || !Number.isSafeInteger(Number(seed)) || Number(seed) > 0xffffffff) {
      setError('Escribe una semilla entera entre 0 y 4294967295.'); return;
    }
    setBusy(true); setError(''); setPlaying(false);
    try {
      const created = await matchApi.create(Number(seed)); replaceMatchPath();
      setChain(undefined); setHistorical(false); setTestnetMode(false); setProofReady(false); setMatch(created); setReplay(undefined); setImported(false); setFrames([initialState(created.seed ?? 2026)]); setTick(0); setVerification('idle');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function runMatch() {
    if (!match) return;
    setBusy(true); setError('');
    try {
      // Read first so a retry can recover a run whose HTTP response was lost.
      const current = await matchApi.get(match.matchId, !!match.testnet);
      const result = current.replay ? current : await matchApi.run(match.matchId, !!match.testnet);
      if (!result.replay) throw new Error('El motor no devolvió el replay. Reintenta la ejecución.');
      loadReplay(result.replay); setMatch(result); setPlaying(true);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function verify() {
    if (!replay) return;
    setVerification('checking'); setError('');
    try {
      const result = await verifyReplay(replay, match?.seedHash);
      setVerification(result.valid ? 'valid' : 'invalid');
    } catch { setVerification('invalid'); }
  }

  function download() {
    if (!replay) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(replay, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `arenapay-${replay.matchId}.json`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importReplay(file?: File) {
    if (!file) return;
    setBusy(true); setError(''); setPlaying(false);
    try {
      if (file.size > 100_000) throw new Error('El replay supera el límite de 100 KB.');
      const parsed = replaySchema.parse(JSON.parse(await file.text()));
      setChain(undefined); setHistorical(false); setTestnetMode(false); setProofReady(false); loadReplay(parsed); setMatch(undefined); setImported(true); setSeed(String(parsed.seed));
    } catch { setError('No se pudo importar: usa un replay JSON de ArenaPay v1 o v2 de menos de 100 KB.'); }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  }

  return <div className="app-shell">
    <a className="skip-link" href="#workspace">Saltar a la arena</a>
    <header className="site-header">
      <a className="brand" href="./" aria-label="ArenaPay, inicio"><span className="brand-mark">A</span>ArenaPay<span className="brand-lab">Lab</span></a>
      <nav aria-label="Navegación principal"><a className="active" href="#arena">Arena</a><a href="#evidence">Evidencia</a><a href="#roadmap">Proyecto</a></nav>
      <span className="mode-pill"><span />{match?.testnet || testnetMode ? 'Stellar Testnet' : publicDemo ? 'Demo sin wallet' : operationalPublic ? 'Stellar Testnet' : 'Desarrollo local'}</span>
    </header>

    <main id="arena">
      <section className="intro">
        <div><p className="edition">Laboratorio de agentes autónomos</p><h1>La estrategia se juega.<br />El resultado se demuestra.</h1><p className="intro-copy">Dos agentes. Una arena. Cada movimiento queda registrado para que puedas volver a comprobarlo.</p></div>
        <div className="intro-note"><span className="orbit-icon" aria-hidden="true">↗</span><p>Primero, evidencia.<br /><strong>Después, liquidación.</strong></p><span>{publicDemo ? 'Ensayo documentado en Stellar Testnet' : 'Soroban Testnet · Integración disponible'}</span></div>
      </section>

      <div className="entry-actions">
        <button className="button secondary" onClick={() => { setTestnetMode(false); document.getElementById('seed')?.focus(); }}>Probar la arena</button>
        {!publicDemo && <button className="button primary" onClick={() => setTestnetMode(true)}>Nueva partida en Testnet</button>}
        <button className={`button ${publicDemo ? 'primary' : 'secondary'}`} disabled={inFlight} onClick={() => { loadReplay(replaySchema.parse(exampleReplay)); setMatch(undefined); setChain(undefined); setImported(true); setHistorical(true); setTestnetMode(false); setPlaying(false); setProofReady(false); setTick(TICKS); }}>Ver una partida pagada en Testnet</button>
      </div>
      {historical && <section className="recorded-proof" aria-label="Ensayo documentado">
        <div><strong>Nova recibió 2 XLM de prueba</strong><p>Ensayo del 12 de septiembre de 2026. Evidencia guardada; consulta el recibo para comprobar la operación en Stellar.</p></div>
        <a className="button secondary" href={`https://stellar.expert/explorer/testnet/tx/${evidence.receipts.settled}`} target="_blank" rel="noreferrer">Abrir recibo de pago</a>
        <a className="button secondary" href="#evidence">Reproducir la evidencia</a>
      </section>}
      {(testnetMode || match?.testnet) && <Journey chain={chain} hasReplay={!!match?.replay} verified={proofReady} />}
      <div className="workspace" id="workspace">
        <section className="match-panel" aria-labelledby="match-heading">
          <div className="panel-heading"><div><span className="section-kicker">{presentation.kicker}</span><h2 id="match-heading">{match?.testnet ? `${presentation.title} en Testnet` : historical ? 'Replay del ensayo' : presentation.title} <span className="small-tag">{presentation.sizeLabel}</span></h2></div><span className={`match-status ${playing ? 'live' : ''}`}><i />{playing ? 'Reproduciendo' : finished ? 'Replay completo' : replay ? 'Replay listo' : match ? 'Lista para ejecutar' : 'Vista previa'}</span></div>

          <div className="scoreboard">
            <div className="agent"><span className="agent-avatar atlas">A</span><div><h3>Atlas</h3><p>Recolector · Cercanía primero</p></div><strong aria-label={`Atlas: ${state.agents.A.score} puntos`}>{state.agents.A.score}<small>pts</small></strong></div>
            <span className="versus">vs</span>
            <div className="agent"><span className="agent-avatar nova">B</span><div><h3>Nova</h3><p>Táctico · Valor y distancia</p></div><strong aria-label={`Nova: ${state.agents.B.score} puntos`}>{state.agents.B.score}<small>pts</small></strong></div>
          </div>

          <div className="field-wrap"><div className="field-coordinates" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <span key={i}>{i + 1}</span>)}</div><GameBoard engineVersion={engineVersion} state={state} /><div className="field-legend"><span><i className="resource-dot" />Recurso de 1–3 puntos</span><span>60 ticks · Reglas fijas</span></div></div>

          <div className="replay-controls"><button className="play-button" aria-label="Tick anterior" disabled={!replay || inFlight || tick === 0} onClick={() => { setPlaying(false); setTick(t => Math.max(0, t - 1)); }}>‹</button><button className="play-button" aria-label={playing ? 'Pausar replay' : 'Reproducir replay'} disabled={!replay || inFlight} onClick={() => { if (tick >= TICKS) setTick(0); setPlaying(!playing); }}>{playing ? 'Ⅱ' : '▶'}</button><div className="timeline"><label htmlFor="timeline">Replay <span>Tick <b>{String(tick).padStart(2, '0')}</b> / {TICKS}</span></label><input id="timeline" aria-label="Tick del replay" type="range" min="0" max={TICKS} value={tick} disabled={!replay || inFlight} onChange={e => { setPlaying(false); setTick(Number(e.target.value)); }} /></div><select aria-label="Velocidad del replay" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select><button className="play-button" aria-label="Tick siguiente" disabled={!replay || inFlight || tick === TICKS} onClick={() => { setPlaying(false); setTick(t => Math.min(TICKS, t + 1)); }}>›</button></div>
          {finished && <p className="simulation-result">{verification === 'invalid' ? 'Evidencia inconsistente: revisa el archivo importado.' : `Simulación terminada: ${agentName(runSimulation(replay!.seed, replay!.inputs, replay!.engineVersion).winner)} obtiene el primer puesto.`} <span>{match?.testnet && chain?.status === 'Settled' ? 'Premio confirmado en Testnet.' : historical ? 'Pago documentado en el recibo del ensayo.' : 'Sin premio liquidado.'}</span></p>}
        </section>

        <aside className={`side-panel ${testnetMode || match?.testnet ? 'testnet-active' : historical ? 'history-active' : 'practice-active'}`}>
          <TestnetPanel match={match} onChain={setChain} onProof={setProofReady} onRun={runMatch} running={inFlight} expanded={testnetMode} onMatch={acceptTestnetMatch} onSync={syncTestnetMatch} shareUrl={match?.testnet ? absoluteMatchUrl(match.matchId) : undefined} />
          <section className="setup" aria-labelledby="setup-heading"><h2 id="setup-heading">Tu próxima partida</h2><p>Cambia la semilla para explorar otra arena. Las estrategias se mantienen.</p>
            <form onSubmit={event => { event.preventDefault(); void createMatch(); }}><label htmlFor="seed">Semilla de la arena</label><div className="seed-control"><span aria-hidden="true">#</span><input id="seed" inputMode="numeric" value={seed} maxLength={10} disabled={inFlight} onChange={event => setSeed(event.target.value)} /><button type="button" aria-label="Generar otra semilla" disabled={inFlight} onClick={() => setSeed(String(crypto.getRandomValues(new Uint32Array(1))[0]))}>⤨</button></div>
              <button className={match && !replay ? 'button secondary full' : 'button primary full'} type="submit" disabled={inFlight}>{busy ? 'Preparando…' : match || replay ? 'Crear nueva partida de práctica' : 'Crear partida de práctica'}<span aria-hidden="true">＋</span></button>
            </form>
            {match && !match.testnet && !replay && <button className="button primary full run-button" disabled={inFlight || (!!match.testnet && chain?.status !== 'Funded')} onClick={() => void runMatch()}>Ejecutar simulación <span aria-hidden="true">▶</span></button>}
            <p className="local-note">{publicDemo ? 'Práctica sin fondos. Descarga el replay para conservarlo al cerrar la página.' : 'La práctica se ejecuta en tu navegador. Para depósitos, utiliza el panel Testnet.'}</p>
          </section>

          <section className="evidence" id="evidence" aria-labelledby="evidence-heading"><div className="evidence-title"><h2 id="evidence-heading">Prueba de la partida</h2><span aria-hidden="true">◇</span></div>
            <ol className="evidence-steps"><li className={match || replay ? 'done' : ''}><span className="step-dot">{match || replay ? '✓' : '1'}</span><div><strong>Semilla comprometida</strong><p>{imported ? 'Compromiso del archivo importado' : match ? match.seed === undefined ? 'Semilla reservada hasta ejecutar; compromiso publicado' : `Semilla ${match.seed} fijada antes de ejecutar` : 'Se publica al crear la partida'}</p></div></li><li className={replay ? 'done' : ''}><span className="step-dot">{replay ? '✓' : '2'}</span><div><strong>Movimientos registrados</strong><p>{replay ? '120 inputs · 60 ticks · 2 agentes' : 'Registro completo de ambos agentes'}</p></div></li><li className={verification === 'valid' ? 'done' : ''}><span className="step-dot">{verification === 'valid' ? '✓' : '3'}</span><div><strong>Replay reproducible</strong><p>{verification === 'valid' ? 'Comprobado en este navegador' : 'Vuelve a calcular el resultado'}</p></div></li></ol>
            {(match || replay) && <details className="hash-details"><summary>Ver identificadores y hashes</summary><dl><dt>Partida</dt><dd>{match?.matchId ?? replay?.matchId}</dd><dt>Compromiso de semilla</dt><dd>{match?.seedHash ?? replay?.seedHash}</dd><dt>Hash del estado final</dt><dd>{replay?.finalStateHash ?? 'Pendiente de simulación'}</dd><dt>Motor</dt><dd>{replay?.engineVersion ?? match?.engineVersion ?? ENGINE_VERSION}</dd></dl></details>}
            <button className="button secondary full" disabled={!replay || inFlight} onClick={() => void verify()}>{verification === 'checking' ? 'Verificando…' : 'Verificar reproducibilidad'}<span aria-hidden="true">✓</span></button>
            <div aria-live="polite">{verification === 'valid' && <p className="verification success">Replay verificado localmente.<span>El hash y el resultado coinciden. {historical ? 'El replay coincide. El recibo acredita el pago del ensayo guardado.' : imported ? 'El archivo no tiene autenticidad acreditada.' : match?.testnet ? 'Consulta también la evidencia del contrato en el panel Testnet.' : 'Esta práctica no mueve fondos.'}</span></p>}{verification === 'invalid' && <p className="verification failure">Evidencia inconsistente.<span>El resultado, la semilla o el hash no coinciden.</span></p>}</div>
            <div className="file-actions"><button disabled={!replay || inFlight} onClick={download}>↓ Descargar JSON</button><button disabled={inFlight} onClick={() => fileInput.current?.click()}>↑ Importar replay</button><input ref={fileInput} type="file" accept=".json,application/json" aria-label="Archivo de replay" hidden onChange={event => void importReplay(event.target.files?.[0])} /></div>
          </section>
          {error && <div className="error-box" role="alert">{error}</div>}
          <div className="settlement-note"><span aria-hidden="true">◎</span><div><strong>Liquidación en Stellar</strong><p>Usa el panel de Testnet para inscribir agentes y liquidar con la firma del árbitro.</p></div></div>
        </aside>
      </div>


      <section className="project-strip" id="roadmap"><div><h2>De la partida al premio verificable.</h2><p>{PRODUCT_STATEMENT}</p><p className="scope-note">Práctica local y operaciones firmadas en Stellar Testnet.</p></div><ol><li className="current"><span>01</span><strong>Simulación y replay</strong><small>Disponible</small></li><li className="current"><span>02</span><strong>Escrow Soroban</strong><small>Flujo Testnet</small></li><li><span>03</span><strong>Demo final</strong><small>Preparación de evidencia</small></li></ol></section>
    </main>
    <footer><span>ArenaPay <span className="footer-slash">/</span> Construido para hacer verificable la competencia.</span><span><a href="./runbook-pruebas-arenapay.html">Guía de pruebas</a><span className="footer-slash">/</span><a href="https://github.com/hvaler/ArenaPay">Código AGPL</a></span><span>Stellar Odyssey · MVP 0.1</span></footer>
  </div>;
}
