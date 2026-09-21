import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, LEGACY_ENGINE_VERSION } from '../../../../packages/shared/src/contracts';
import { getGamePresentation } from './presentations';

describe('game presentation registry', () => {
  it('keeps historical and current arena engines on the same isolated renderer', () => {
    expect(getGamePresentation(ENGINE_VERSION).rendererId).toBe('resource-arena');
    expect(getGamePresentation(LEGACY_ENGINE_VERSION)).toBe(getGamePresentation(ENGINE_VERSION));
  });

  it('fails closed when a motor has no presentation', () => {
    expect(() => getGamePresentation('hex/1.0.0')).toThrow('renderizador');
  });
});
