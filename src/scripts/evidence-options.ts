import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export function evidenceOptions(args: readonly string[]) {
  const [version = 'v1', flag, ...extra] = args;
  if ((version !== 'v1' && version !== 'v2') || (flag !== undefined && flag !== '--update') || extra.length) {
    throw new Error('Uso: verify-testnet-events.ts [v1|v2] [--update]. No se admiten rutas.');
  }
  return { version, update: flag === '--update' } as const;
}

export async function evidenceFile(version: 'v1' | 'v2', root = new URL('../../', import.meta.url)) {
  // Select literal files, never construct a filename from a CLI argument.
  const target = version === 'v2' ? new URL('docs/evidencia/testnet-evidence-v2.json', root) : new URL('docs/evidencia/testnet-evidence.json', root);
  const expected = fileURLToPath(target);
  if (await realpath(expected) !== expected) throw new Error('La evidencia no puede atravesar enlaces simbólicos ni directorios redirigidos.');
  return target;
}
