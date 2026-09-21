# Publicación de ArenaPay 0.4.0 — 21 de septiembre de 2026

Este registro documenta la selección explícita de motores y la base común para juegos por turnos.
No incorpora todavía Hex ni representa una nueva partida pagada en Stellar Testnet.

## Identificadores

| Elemento | Identificador |
|---|---|
| Versión | `0.4.0` |
| Motor activo | `resource-arena/2.0.0` |
| Motor histórico preservado | `resource-arena/1.0.0` |
| Repositorio privado | `hvaler/ArenaPay-Dev` · `1478951` |
| Repositorio público | `hvaler/ArenaPay` · `26b8727` |
| Etiqueta y release | [`v0.4.0`](https://github.com/hvaler/ArenaPay/releases/tag/v0.4.0) |
| GitHub Pages | `gh-pages` · `87f7b12` · publicación mediante `deploy-pages.yml` |
| Cloudflare Worker | `e03bc322-7d8d-4e04-abb5-4e6ad584bd58` |
| Vercel | `arenapay.vercel.app` · activo `index-2_wCmz2f.js` comprobado |

## Contenido publicado

- Selector de juego en la práctica del navegador y en la creación Testnet.
- `engineVersion` opcional en las rutas de creación para conservar clientes anteriores.
- Ciclo `active | historical`: solo los motores activos crean partidas nuevas; los históricos siguen
  disponibles para verificar evidencia.
- Protocolo de turnos con participantes, turno activo, secuencia, revisión e identificador idempotente.
- Rechazo de movimientos antiguos, jugadores ajenos, acciones fuera de turno y reutilización conflictiva
  de un identificador.
- Límite de 16 KiB medido en bytes sobre la representación canónica de cada acción.
- Punto opcional `GameEngine.turnProtocol` para que Hex añada reglas sin acoplarlas al coordinador.
- Guía de motores, API y plan de Hex, Connect Four, Damas chinas y Ajedrez actualizados.

## Superficies comprobadas

- [Vercel](https://arenapay.vercel.app/): HTTP 200; activo operativo 0.4.0.
- [Cloudflare](https://arenapay.arenapay.workers.dev/): despliegue confirmado conservando el Durable Object.
- `/api/health` en Vercel y Cloudflare: HTTP 200, `mode: public` y `persistence: durable-object`.
- `/api/games` en ambos dominios: v1 con `lifecycle: historical` y v2 con `lifecycle: active`.
- [GitHub Pages](https://hvaler.github.io/ArenaPay/): rama `gh-pages` actualizada con la edición offline 0.4.0; la ejecución enlazada registra su despliegue.

## Validación

- 89 pruebas TypeScript superadas en los repositorios privado y público.
- 16 pruebas Rust superadas; las advertencias existentes de eventos Soroban obsoletos no cambian el
  resultado.
- Comprobación de tipos y compilaciones normal, pública y operativa superadas.
- Ocho de nueve recorridos E2E locales superados. El recorrido restante depende del RPC público de
  Stellar y no encontró el estado histórico `Settled` dentro de 45 segundos; no falló una regla nueva.
- La prueba operativa contra la compilación 0.4.0 local superó el flujo completo.
- La prueba offline completó todas sus aserciones y generó sus capturas; Playwright terminó con
  `browserContext.close: spawn EPERM` al intentar cerrar el proceso de vídeo en Windows.
- El navegador automatizado del entorno negó acceso directo a Vercel con `ERR_NETWORK_ACCESS_DENIED`.
  La verificación HTTP independiente confirmó aplicación, salud y catálogo en los dominios públicos.

Vite mantiene la advertencia conocida sobre el tamaño del paquete principal. Es una mejora de
rendimiento pendiente y no impide compilar o ejecutar esta versión.
