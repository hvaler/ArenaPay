import { build } from 'vite';
import { resolve } from 'node:path';

const remoteApi = process.env.VITE_API_BASE_URL?.trim();
if (process.argv.includes('--require-api') && (!remoteApi || !remoteApi.startsWith('https://'))) {
  throw new Error('La edición operativa remota exige VITE_API_BASE_URL con HTTPS.');
}
process.env.VITE_PUBLIC_DEMO = 'false';
process.env.VITE_OPERATIONAL_PUBLIC = 'true';
await build({ configFile: resolve('src/apps/web/vite.config.ts'), base: './', build: { outDir: resolve('public-operational'), emptyOutDir: true } });
