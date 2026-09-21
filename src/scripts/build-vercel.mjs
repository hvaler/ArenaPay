import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

delete process.env.VITE_API_BASE_URL;
await import('./build-operational.mjs');
await copyFile(resolve('config/vercel-operational.json'), resolve('public-operational/vercel.json'));
