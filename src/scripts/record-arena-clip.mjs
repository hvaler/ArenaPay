// Graba el fragmento de competición sobre la aplicación desplegada y con el motor vigente.
// No firma nada en Testnet: la práctica se ejecuta en el navegador con exactamente el mismo motor,
// así que el tablero que se ve es el que produce una partida financiada.
//
//   node src/scripts/record-arena-clip.mjs [--seed 2042] [--url https://arenapay.vercel.app/]
//                                          [--out docs/evidencia/media] [--name arenapay-competicion-v3-es]
//
// Deja un .webm en --out. Si ffmpeg está disponible, produce además el .mp4 recortado.
import { chromium } from '@playwright/test';
import { execFile } from 'node:child_process';
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const valor = (nombre, porDefecto) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : porDefecto;
};

const semilla = valor('seed', '2042');
const url = valor('url', 'https://arenapay.vercel.app/');
const salida = resolve(valor('out', 'docs/evidencia/media'));
const nombre = valor('name', 'arenapay-competicion-v3-es');

await mkdir(salida, { recursive: true });
const navegador = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' });
const contexto = await navegador.newContext({
  viewport: { width: 1280, height: 900 },
  recordVideo: { dir: salida, size: { width: 1280, height: 900 } },
});
const inicio = Date.now();
const page = await contexto.newPage();
await page.goto(url, { waitUntil: 'networkidle' });

await page.locator('#seed').fill(semilla);
await page.getByRole('button', { name: /Crear (nueva )?partida de práctica/ }).click();
await page.getByRole('button', { name: 'Ejecutar simulación' }).waitFor({ state: 'visible' });

// Encuadrar el panel de la arena: marcador, tablero y controles del replay.
await page.evaluate(() => {
  const panel = document.querySelector('.match-panel');
  if (panel) window.scrollTo({ top: panel.getBoundingClientRect().top + window.scrollY - 44, behavior: 'instant' });
});
await page.waitForTimeout(900);

// El recorte empieza poco antes de la ejecución: lo anterior es preparación, no competición.
const desde = Math.max(0, (Date.now() - inicio) / 1000 - 0.55);
await page.getByRole('button', { name: 'Ejecutar simulación' }).click();
await page.locator('#timeline').waitFor({ state: 'visible' });
await page.waitForFunction(() => document.querySelector('#timeline')?.value === '60', null, { timeout: 120_000 });
await page.waitForTimeout(2600);

const resumen = await page.evaluate(() => {
  const texto = document.body.innerText;
  const capturar = expresion => (texto.match(expresion) ?? [null])[0];
  return {
    motor: capturar(/resource-arena\/\d+\.\d+\.\d+/),
    tick: capturar(/Tick \d+ \/ \d+/),
    resultado: capturar(/Simulación terminada:[^\n]*/),
  };
});

await contexto.close();
await navegador.close();

const grabado = (await readdir(salida)).find(archivo => archivo.endsWith('.webm') && archivo.startsWith('page@'));
const webm = join(salida, `${nombre}.webm`);
await rename(join(salida, grabado), webm);

let mp4;
try {
  mp4 = join(salida, `${nombre}.mp4`);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', desde.toFixed(2), '-i', webm,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
  await rm(webm);
} catch {
  mp4 = undefined;
  console.warn('ffmpeg no disponible: se conserva el .webm sin recortar.');
}

console.log(JSON.stringify({ semilla: Number(semilla), url, archivo: mp4 ?? webm, ...resumen }, null, 2));
