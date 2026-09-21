# Publicación de ArenaPay 0.5.0 — 21 de septiembre de 2026

## Motivo

La aplicación no explicaba en ninguna parte lo que hay que preparar antes de conectar una wallet. Un recorrido real se atascó por dos causas encadenadas: Freighter estaba en Mainnet en lugar de Testnet, y la cuenta no tenía XLM de prueba. Ninguna de las dos cosas se observa desde la página, y la guía que las explicaba existía solo en la copia local de trabajo: nunca se había confirmado en el repositorio, así que no estaba publicada ni enlazada desde ningún sitio.

## Cambios

### Preparación visible antes de conectar

El panel de Testnet incorpora un bloque de preparación con los tres pasos: seleccionar Testnet en el selector de red de Freighter, conseguir XLM de prueba con Friendbot desde Stellar Lab y comprobar el saldo. Queda abierto mientras no hay wallet conectada y se pliega en cuanto la hay, de modo que no estorba en los recorridos siguientes. Se muestra aunque la configuración de Testnet todavía no esté disponible, porque preparar la wallet no depende del servidor.

El aviso de red equivocada deja de limitarse a pedir Testnet y dice dónde se cambia.

### La guía de preparación se publica

`docs/guias/fondear-freighter-testnet.md` entra en el repositorio y se publica como página junto a la aplicación, igual que el runbook. El generador de guías deja de estar fijado a un único documento y recibe la lista de los que hay que publicar.

## Verificación

- `npm test`: 97 pruebas superadas.
- `npx playwright test`: 11 pruebas de navegador superadas, una nueva sobre el bloque de preparación y sus enlaces.
- El bloque se comprobó en el navegador: abierto sin wallet conectada, con los enlaces a Stellar Lab y a la guía publicada.
- La guía se sirve en `/guia-freighter-testnet.html` con el mismo diseño que el runbook, y su Markdown queda descargable.

## Despliegues

La versión se publica en el repositorio privado y en el clon público siguiendo la guía [de flujo de desarrollo y publicación](../guias/flujo-desarrollo-y-publicacion.md). Vercel y Cloudflare usan la compilación operativa; GitHub Pages mantiene la compilación pública.
