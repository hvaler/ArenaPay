import { describe, expect, it } from 'vitest';
import { matchIdFromPath, matchPathFor } from './match-url';

const id = '00000000-0000-4000-8000-000000000001';

describe('stable match URLs', () => {
  it('builds and parses a canonical path', () => {
    expect(matchPathFor(id.toUpperCase())).toBe(`/match/${id}`);
    expect(matchIdFromPath(`/match/${id}`)).toBe(id);
    expect(matchIdFromPath(`/match/${id}/`)).toBe(id);
  });

  it('rejects malformed or unsupported paths', () => {
    expect(matchIdFromPath('/')).toBeUndefined();
    expect(matchIdFromPath('/matches/anything')).toBeUndefined();
    expect(() => matchPathFor('not-a-uuid')).toThrow('inválido');
  });
});
