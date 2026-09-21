import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, LEGACY_ENGINE_VERSION } from '../../../../packages/shared/src/contracts';
import { getGamePresentation } from './presentations';
import { registeredEngineDescriptors } from '../../../../packages/shared/src/game-engine';
import '../../../../packages/shared/src/engines/resource-arena';

describe('game presentation registry', () => {
  it('keeps historical and current arena engines on the same isolated renderer', () => {
    expect(getGamePresentation(ENGINE_VERSION).rendererId).toBe('resource-arena');
    expect(getGamePresentation(LEGACY_ENGINE_VERSION)).toBe(getGamePresentation(ENGINE_VERSION));
  });

  it('fails closed when a motor has no presentation', () => {
    expect(() => getGamePresentation('hex/1.0.0')).toThrow('renderizador');
  });
});

// Una evidencia creada con un motor retirado se sigue abriendo desde la aplicación, así que
// todas las versiones registradas necesitan renderizador, no solo la vigente.
it('renders every registered engine, including the retired ones', () => {
  for (const engine of registeredEngineDescriptors()) {
    expect(getGamePresentation(engine.engineVersion).rendererId).toBe(engine.rendererId);
  }
});
