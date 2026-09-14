import { buildApp } from './app';
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';

if (existsSync('.env.testnet')) loadEnvFile('.env.testnet');

const app = buildApp();
const port = Number(process.env.PORT ?? process.env.ARENAPAY_API_PORT ?? 4317);
const host = process.env.ARENAPAY_API_HOST ?? (process.env.ARENAPAY_PUBLIC_MODE === 'true' ? '0.0.0.0' : '127.0.0.1');
try {
  await app.listen({ host, port });
  console.log(`ArenaPay engine: http://${host}:${port}`);
} catch (error) {
  console.error('No se pudo iniciar el motor de ArenaPay.', error);
  process.exitCode = 1;
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void app.close(); });
