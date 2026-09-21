# Publicación de ArenaPay 0.2.0 — 21 de septiembre de 2026

Este registro documenta la publicación de la arquitectura multimotor y sus despliegues. No representa
una partida pagada nueva ni sustituye los recibos Testnet del índice de evidencia.

## Versión publicada

| Elemento | Identificador |
|---|---|
| Versión | `0.2.0` |
| Motor activo | `resource-arena/2.0.0` |
| Repositorio privado de desarrollo | `hvaler/ArenaPay-Dev` · `4d4c597` |
| Repositorio público | `hvaler/ArenaPay` · `931c243` |
| Etiqueta y release | [`v0.2.0`](https://github.com/hvaler/ArenaPay/releases/tag/v0.2.0) |
| GitHub Pages | `gh-pages` · `9b35529` |
| Cloudflare Worker | `05ce404a-c897-4b11-9d1b-756a6da33a88` |
| Vercel | [`2nwF3hKJVs8e1NuMRDQBZwMbN7R7`](https://vercel.com/hugovaler-7692s-projects/arenapay/2nwF3hKJVs8e1NuMRDQBZwMbN7R7) |

## Superficies públicas comprobadas

- [Aplicación operativa en Vercel](https://arenapay.vercel.app/): HTTP 200 y prueba de navegador superada.
- [Backend persistente en Cloudflare](https://arenapay.arenapay.workers.dev/): desplegado correctamente.
- [`/api/health`](https://arenapay.arenapay.workers.dev/api/health): `status: ok`, `mode: public`,
  `persistence: durable-object` y motor `resource-arena/2.0.0`.
- [`/api/testnet/config`](https://arenapay.arenapay.workers.dev/api/testnet/config): `ready: true`, red
  `testnet` y contrato `CDHPEYP7KEYYO3D6G44PK22MUNKF4ZBFHLOM6DUL2NOUKXNNTO4R4RID`.
- [Demo offline en GitHub Pages](https://hvaler.github.io/ArenaPay/): HTTP 200 y prueba de navegador
  superada.

## Contenido incorporado

- Interfaz común `GameEngine` y registro de motores por versión.
- Adaptadores congelados para `resource-arena/1.0.0` y `resource-arena/2.0.0`.
- Guía para registrar motores y documentación de juegos futuros.
- Presentación de [arquitectura y plataforma](https://youtu.be/4uiet8NSKwo), copia maestra,
  subtítulos, miniatura y guion.
- README, índices de documentación y material de entrega actualizados.

## Validación

- 68 pruebas TypeScript superadas.
- Comprobación de tipos y compilación Vite superadas.
- Validación previa de Wrangler superada con el Durable Object y los activos esperados.
- Prueba pública de navegador de GitHub Pages superada.
- Prueba operativa de navegador de Vercel y su backend persistente superada.

La advertencia de Vite sobre un fragmento superior a 500 kB es una mejora de rendimiento pendiente;
no impide compilar ni ejecutar la aplicación. El contrato Soroban no se volvió a desplegar para esta
versión: la separación del motor conserva el contrato y la evidencia histórica.
