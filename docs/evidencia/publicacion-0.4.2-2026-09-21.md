# Publicación de ArenaPay 0.4.2 — 21 de septiembre de 2026

## Motivo

Dos correcciones compatibles observadas al repetir el recorrido de la demo en un navegador distinto al de la grabación.

### Detección de Freighter en Edge

«Conectar Freighter» respondía «Instala Freighter en Chrome o Edge» con la extensión ya instalada. `isConnected()` de `@stellar/freighter-api` comprueba primero la marca `window.freighter` y, si todavía no existe, sondea el guion de contenido de la extensión y se rinde a los dos segundos. Edge inyecta ese guion más tarde que Chrome, así que una única consulta al pulsar el botón devolvía un falso negativo.

Ahora se sondea la marca durante tres segundos antes de preguntar a la biblioteca, cuya respuesta sigue siendo la que decide. Con la extensión presente la conexión sigue siendo inmediata; sin ella el mensaje tarda unos segundos más, pero es correcto.

### Raíz de la demo en GitHub Pages

`replaceMatchPath()` limpiaba la ruta hacia `/`, que en GitHub Pages queda fuera de `/ArenaPay/`. Crear una partida de práctica reescribía la dirección a la raíz del dominio y una recarga posterior abandonaba la demo. Las rutas de partida se resuelven ahora contra la base del build, de modo que la edición operativa sigue en la raíz del sitio y la demo permanece en su subdirectorio.

## Verificación

- `npm test`: 94 pruebas superadas, 5 nuevas para la detección de la wallet y la base de despliegue.
- Las pruebas nuevas fallan con el comportamiento anterior: se comprobó revirtiendo cada corrección.
- `npm run build:operational` y `npm run build:public`: compilaciones superadas con su base respectiva.
- Demo servida desde `/ArenaPay/`: crear una partida de práctica conserva el subdirectorio.
- Edición operativa servida en la raíz: `/match/<id>` carga la aplicación y conserva la dirección.

La detección de Freighter en Edge no se puede automatizar aquí porque depende de una extensión de navegador; se cubre con pruebas del tiempo de espera y debe confirmarse a mano en Edge y en Chrome.

## Despliegues

La versión se publica en el repositorio privado y en el clon público siguiendo la guía [de flujo de desarrollo y publicación](../guias/flujo-desarrollo-y-publicacion.md). Vercel y Cloudflare usan la compilación operativa; GitHub Pages mantiene la compilación pública con base relativa y necesita publicar de nuevo la rama `gh-pages` para recoger esta corrección.
