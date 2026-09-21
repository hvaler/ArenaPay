import { build } from 'vite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const remoteApi = process.env.VITE_API_BASE_URL?.trim();
if (process.argv.includes('--require-api') && (!remoteApi || !remoteApi.startsWith('https://'))) {
  throw new Error('La edición operativa remota exige VITE_API_BASE_URL con HTTPS.');
}
process.env.VITE_PUBLIC_DEMO = 'false';
process.env.VITE_OPERATIONAL_PUBLIC = 'true';
// Las ediciones operativas (Vercel y Cloudflare) se sirven en la raíz y enrutan /match/:id.
// Con base relativa, un enlace compartido resolvería ./assets en /match/assets y la página
// quedaría en blanco. La base absoluta funciona a cualquier profundidad de ruta.
await build({ configFile: resolve('src/apps/web/vite.config.ts'), base: '/', build: { outDir: resolve('public-operational'), emptyOutDir: true } });

// Guarda de regresión: una base relativa haría que /match/:id pidiese /match/assets y el enlace
// compartido abriría una página en blanco. Falla aquí antes de publicar, no en producción.
const emitted = await readFile(resolve('public-operational/index.html'), 'utf8');
if (/(?:src|href)="\.\//.test(emitted)) {
  throw new Error('La edición operativa se sirve en la raíz: index.html debe referenciar /assets, no ./assets.');
}
