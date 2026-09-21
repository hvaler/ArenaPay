import { describe, expect, it } from 'vitest';
import { absoluteMatchUrl, matchIdFromPath, matchPathFor } from './match-url';

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

// import.meta.env.BASE_URL es '/' en la edición operativa y './' en la demo de GitHub Pages.
// Vitest compila con la base operativa, así que aquí se cubre la raíz; el caso del subdirectorio
// se comprueba resolviendo una base relativa contra la dirección de la demo.
describe('match URLs respect the deployment base', () => {
  it('keeps the operational edition at the site root', () => {
    expect(absoluteMatchUrl(id, 'https://arenapay.vercel.app/')).toBe(`https://arenapay.vercel.app/match/${id}`);
    expect(absoluteMatchUrl(id, `https://arenapay.vercel.app/match/${id}`)).toBe(`https://arenapay.vercel.app/match/${id}`);
  });

  it('never resolves the demo root outside its subdirectory', () => {
    const demoRoot = new URL('./', 'https://hvaler.github.io/ArenaPay/');
    expect(demoRoot.pathname).toBe('/ArenaPay/');
    expect(new URL(matchPathFor(id).slice(1), demoRoot).pathname).toBe(`/ArenaPay/match/${id}`);
  });
});
