import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/operational', outputDir: './operational-test-results', workers: 1,
  use: { baseURL: process.env.PUBLIC_OPERATIONAL_URL ?? 'https://arenapay.vercel.app', channel: 'chrome', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
});
