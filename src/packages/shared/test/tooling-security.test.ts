import { mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evidenceFile, evidenceOptions } from '../../../scripts/evidence-options';
import { renderInline } from '../../../scripts/runbook-inline.mjs';

describe('local evidence verifier boundaries', () => {
  it('accepts only named evidence versions and an explicit update flag', () => {
    expect(evidenceOptions([])).toEqual({ version: 'v1', update: false });
    expect(evidenceOptions(['v2', '--update'])).toEqual({ version: 'v2', update: true });
    expect(() => evidenceOptions(['../secret.json'])).toThrow('No se admiten rutas');
    expect(() => evidenceOptions(['v1', '--update', '../secret.json'])).toThrow('No se admiten rutas');
  });

  it('rejects a selected evidence file redirected through a symbolic link', async () => {
    const root = await mkdtemp(join(tmpdir(), 'arenapay-evidence-'));
    await mkdir(join(root, 'docs'));
    const outside = join(root, 'outside.json');
    await writeFile(outside, '{}');
    try {
      await symlink(outside, join(root, 'docs', 'testnet-evidence.json'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') return;
      throw error;
    }
    await expect(evidenceFile('v1', pathToFileURL(`${root}/`))).rejects.toThrow('enlaces simbólicos');
  });
});

describe('runbook inline renderer', () => {
  it('renders supported inline markup and escapes untrusted characters', () => {
    expect(renderInline('**Hola** [sitio](https://example.com) `x<y` &'))
      .toBe('<strong>Hola</strong> <a href="https://example.com">sitio</a> <code>x&lt;y</code> &amp;');
  });

  it('handles a long malformed link opener without changing it', () => {
    const malformed = '['.repeat(50_000);
    expect(renderInline(malformed)).toBe(malformed);
  });
});
