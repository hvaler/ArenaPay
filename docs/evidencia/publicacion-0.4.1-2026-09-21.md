# Publicación de ArenaPay 0.4.1 — 21 de septiembre de 2026

## Motivo

Corrección compatible del enlace compartido de partidas. El activo operativo de Vercel y Cloudflare se sirve en la raíz y ahora genera referencias absolutas a sus recursos. Así, una URL como `/match/<id>` puede cargar la aplicación antes de solicitar la partida persistida.

## Verificación

- `npm test`: 89 pruebas superadas.
- `npm run build:operational`: compilación operativa superada.
- La compilación contiene `/assets/...` en `public-operational/index.html`.
- El replay conserva 60 ticks; a velocidad 1× dura aproximadamente 16,8 segundos y a 4× aproximadamente 4,2 segundos.
- Se debe comprobar después del despliegue que una URL `/match/<id>` muestra la partida y no una pantalla vacía.

## Despliegues

La versión se publica en el repositorio privado y en el clon público siguiendo la guía [de flujo de desarrollo y publicación](../guias/flujo-desarrollo-y-publicacion.md). Vercel y Cloudflare usan la compilación operativa; GitHub Pages mantiene la compilación pública con base relativa.
