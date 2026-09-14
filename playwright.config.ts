import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './src/tests/e2e', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5174', channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome', trace: 'retain-on-failure' },
  webServer: [
    { command: 'npm run dev:engine', url: 'http://127.0.0.1:4317/api/health', reuseExistingServer: !process.env.CI, timeout: 60_000 },
    { command: 'npm run dev:web -- --host 127.0.0.1 --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI, timeout: 60_000 },
  ],
});
