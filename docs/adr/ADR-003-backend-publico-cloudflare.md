# ADR-003: Backend público persistente en Cloudflare

## Estado

Aceptada el 13 de septiembre de 2026.

## Contexto

Crear una partida y ejecutar su replay están separados por firmas humanas. Un sistema de archivos efímero puede perder la semilla y el nonce durante esa espera y dejar la partida sin resolución reproducible.

## Decisión

Publicar la API mediante un Cloudflare Worker y coordinar las partidas en un único Durable Object con SQLite. Vercel sirve el frontend operativo y reenvía `/api/*` al Worker. GitHub Pages conserva la demo offline.

## Consecuencias

- Las partidas sobreviven a reinicios y despliegues del Worker.
- Semilla y nonce se mantienen privados hasta el replay.
- Existe dependencia operativa de Cloudflare y de un único coordinador.
- La cadena sigue siendo la fuente de verdad económica.

## Referencias

- [Configuración de Cloudflare](../despliegue/cloudflare.md)
- [Evidencia de persistencia](../evidencia/public-backend-evidence.json)

