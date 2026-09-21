import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['src/packages/**/*.test.ts', 'src/services/**/*.test.ts', 'src/apps/**/*.test.ts'] } });
