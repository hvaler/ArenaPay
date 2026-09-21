import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './src/tests/public', outputDir: './public-test-results', workers: 1,
  use: { baseURL: process.env.PUBLIC_DEMO_URL ?? 'http://127.0.0.1:5180', channel: 'chrome', viewport: { width: 1440, height: 1000 }, video: { mode: 'on', size: { width: 1440, height: 1000 } } },
  webServer: process.env.PUBLIC_DEMO_URL ? undefined : { command: 'npx vite preview --config src/apps/web/vite.config.ts --outDir ../../../public-demo --port 5180 --host 127.0.0.1 --strictPort', url: 'http://127.0.0.1:5180', reuseExistingServer: !process.env.CI },
});
