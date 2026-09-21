# Publicación de ArenaPay 0.3.0 — 21 de septiembre de 2026

Este registro documenta la publicación de la base común multimotor previa a Hex. No representa una
partida pagada nueva ni sustituye los recibos Testnet ya conservados.

## Identificadores

| Elemento | Identificador |
|---|---|
| Versión | `0.3.0` |
| Motores preservados | `resource-arena/1.0.0` y `resource-arena/2.0.0` |
| Repositorio privado | `hvaler/ArenaPay-Dev` · `5826ce4` |
| Repositorio público | `hvaler/ArenaPay` · `133a15d` |
| Etiqueta y release | [`v0.3.0`](https://github.com/hvaler/ArenaPay/releases/tag/v0.3.0) |
| GitHub Pages | `gh-pages` · `fb2f35d` |
| Cloudflare Worker | `6b2f16a6-e91d-4854-b075-c6ac95ce58a7` |
| Vercel | `arenapay.vercel.app` · activo `index-CqkGTd02.js` comprobado |

## Contenido publicado

- Sobre de evidencia `arenapay-evidence/1.0.0` para motores nuevos.
- Resultados explícitos `win`, `draw` y `cancelled` con causa de terminación.
- Catálogo `GET /api/games` con metadatos y capacidades.
- Registro de renderizadores separado de las reglas.
- URL `/match/{id}` para abrir una partida persistida.
- Revisión de estado y sincronización entre navegadores cada cinco segundos y al recuperar el foco.
- Compatibilidad sin reescritura de los replays históricos.
- ADR-007, guía de registro y plan de motores actualizados.

## Superficies comprobadas

- [Vercel](https://arenapay.vercel.app/): HTTP 200 y activo operativo 0.3.0.
- [Cloudflare](https://arenapay.arenapay.workers.dev/): Worker desplegado conservando el Durable Object.
- `/api/health` en ambos dominios: `status: ok`, `mode: public` y
  `persistence: durable-object`.
- `/api/games` en ambos dominios: catálogo con los motores v1 y v2 y el renderizador común.
- `/match/{id}` en ambos dominios: HTTP 200 y entrega de la aplicación.
- [GitHub Pages](https://hvaler.github.io/ArenaPay/): HTTP 200 y activo offline
  `index-wXv6PHM9.js`.

## Validación

- 78 pruebas TypeScript superadas en los repositorios privado y público.
- Comprobación de tipos y compilaciones normal, pública y operativa superadas.
- Ocho recorridos E2E locales superados, incluida la URL compartida y la recepción de un replay
  actualizado desde otra sesión.
- Prueba operativa pública de Vercel y Cloudflare superada.
- Un recorrido dependiente del RPC público de Stellar no pudo confirmar el ensayo histórico en 45
  segundos. La interfaz mostró el error, enumeró el RPC consultado y bloqueó cualquier afirmación de
  pago. No se modificó el contrato ni la evidencia histórica.

La advertencia de Vite sobre el tamaño del paquete principal continúa como mejora de rendimiento y
no impide la compilación o ejecución.
