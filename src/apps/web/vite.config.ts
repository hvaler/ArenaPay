import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    proxy: { '/api': `http://127.0.0.1:${process.env.ARENAPAY_API_PORT ?? 4317}` },
    // Un túnel llega con su propio Host y Vite lo rechaza. Se autoriza uno solo, por sesión y
    // de forma explícita: un comodín de dominio ajeno reabriría el reenlace de DNS.
    allowedHosts: process.env.ARENAPAY_DEV_HOST ? [process.env.ARENAPAY_DEV_HOST] : [],
    // Workspace-wide defaults would expose private match files through /@fs/.
    fs: {
      allow: ['.', '../../packages/shared/src', '../../../docs', '../../../node_modules'].map(path => fileURLToPath(new URL(path, import.meta.url))),
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/data/**'],
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
