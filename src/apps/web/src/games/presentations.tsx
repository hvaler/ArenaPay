import type { ComponentType } from 'react';
import { ARENA_V2_ENGINE_VERSION, ENGINE_VERSION, LEGACY_ENGINE_VERSION, type ArenaState } from '../../../../packages/shared/src/contracts';
import { Arena } from '../components/Arena';

export interface GamePresentation<TState = unknown> {
  readonly rendererId: string;
  readonly title: string;
  readonly kicker: string;
  readonly sizeLabel: string;
  readonly Renderer: ComponentType<{ state: TState }>;
}

const resourceArena: GamePresentation<ArenaState> = {
  rendererId: 'resource-arena', title: 'Arena de recursos', kicker: 'Recolección de recursos',
  sizeLabel: '8 × 8', Renderer: Arena,
};

// Cada versión del motor necesita su entrada, también las retiradas: una evidencia antigua se
// sigue abriendo y debe dibujarse con el mismo tablero.
const presentations = new Map<string, GamePresentation<any>>([
  [LEGACY_ENGINE_VERSION, resourceArena],
  [ARENA_V2_ENGINE_VERSION, resourceArena],
  [ENGINE_VERSION, resourceArena],
]);

export function getGamePresentation(version: string): GamePresentation<any> {
  const presentation = presentations.get(version);
  if (!presentation) throw new Error('El motor no tiene un renderizador registrado.');
  return presentation;
}

export function GameBoard({ engineVersion, state }: { engineVersion: string; state: unknown }) {
  const { Renderer } = getGamePresentation(engineVersion);
  return <Renderer state={state} />;
}
