import { describe, expect, it } from 'vitest';
import { canonicalJson, sha256Hex } from '../src/hash';

describe('canonical JSON and SHA-256', () => {
  it('sorts nested keys in ordinal order and preserves array order', () => {
    expect(canonicalJson({ z: [3, { b: 2, a: 1 }], a: null })).toBe('{"a":null,"z":[3,{"a":1,"b":2}]}');
    expect(canonicalJson({ a: 2, Z: 1 })).toBe('{"Z":1,"a":2}');
    expect(canonicalJson({ 'ä': 3, z: 2, a: 1 })).toBe('{"a":1,"z":2,"ä":3}');
  });
  it('matches the published SHA-256 abc vector', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it.each([undefined, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1, 1n, new Date(), [undefined], Array(1)])('rejects noncanonical values (%s)', value => {
    expect(() => canonicalJson(value)).toThrow();
  });
});
