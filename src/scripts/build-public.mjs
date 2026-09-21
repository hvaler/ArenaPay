import { build } from 'vite';
import { resolve } from 'node:path';
process.env.VITE_PUBLIC_DEMO = 'true';
await build({ configFile: resolve('src/apps/web/vite.config.ts'), base: './', build: { outDir: resolve('public-demo'), emptyOutDir: true } });
