import type { ChainMatch } from '../../../../packages/shared/src/stellar';

export function journeyStep(chain?: ChainMatch, hasReplay = false, verified = false) {
  if (!chain) return 0;
  if (chain.status === 'Settled') return 5;
  if (chain.status === 'Cancelled') return -1;
  if (chain.status === 'Created') return 1;
  if (!hasReplay) return 2;
  return verified ? 4 : 3;
}

export function Journey({ chain, hasReplay, verified }: { chain?: ChainMatch; hasReplay: boolean; verified: boolean }) {
  const current = journeyStep(chain, hasReplay, verified);
  const labels = ['Preparar', `Financiar ${Number(!!chain?.fundedA) + Number(!!chain?.fundedB)}/2`, 'Competir', 'Verificar', 'Cobrar'];
  return <nav className="journey" aria-label="Progreso de la partida Testnet"><ol>{labels.map((label, index) => <li key={index} className={current > index ? 'complete' : current === index ? 'current' : ''} aria-current={current === index ? 'step' : undefined}><span>{current > index ? '✓' : index + 1}</span>{label}</li>)}</ol>{current === -1 && <p>Partida cancelada. Consulta los depósitos devueltos.</p>}</nav>;
}
