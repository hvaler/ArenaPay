# Publicación de ArenaPay 0.4.4 — 21 de septiembre de 2026

## Motivo

Corrige un fallo introducido en 0.4.3 y mejora el aviso cuando Freighter no responde. Observado al probar la conexión en Microsoft Edge y Brave; en Chrome y Firefox la conexión funcionaba.

## El fallo de 0.4.3

La versión 0.4.3 pasó a llamar directamente a `requestAccess()`. Al revisar el paquete compilado de `@stellar/freighter-api` se comprobó que la biblioteca **solo pone plazo a dos de sus mensajes**, `REQUEST_CONNECTION_STATUS` y `REQUEST_PUBLIC_KEY`:

```js
r.type!==e.REQUEST_CONNECTION_STATUS && r.type!==e.REQUEST_PUBLIC_KEY || (n=setTimeout(...,2e3))
```

`requestAccess()` envía `REQUEST_ACCESS`, que no está en esa lista. Si la extensión no contesta, su promesa no se resuelve nunca. Como el panel marca el botón como ocupado mientras espera, en Edge y Brave quedaba bloqueado en «Conectando» sin mensaje alguno, en lugar del aviso equivocado de las versiones anteriores.

## Corrección

`requestAccess()` abre la ventana de Freighter y espera a que la persona decida, así que no puede llevar plazo propio: una firma legítima puede tardar. En paralelo se sondea con `isConnected()`, que sí usa un tipo de mensaje con plazo, y gana quien responda primero. Si el sondeo agota sus tres intentos sin respuesta y la concesión sigue pendiente, se avisa; si la extensión responde, se espera la decisión el tiempo que haga falta.

El aviso deja de afirmar que la extensión no está instalada, porque no es lo que se puede comprobar. Ahora enumera las causas reales: extensión ausente, bloqueada o sin permiso para este sitio. En Edge y Brave el acceso por sitio suele quedar en «al hacer clic», y entonces el guion de contenido no se inyecta y nada responde.

## Verificación

- `npm test`: 97 pruebas superadas.
- Seis pruebas cubren la conexión: concesión sin consultar `window.freighter`, extensión que nunca responde, aprobación lenta con sondeo favorable, rechazo explícito, red distinta de Testnet y reintento del sondeo.
- La prueba de la extensión que nunca responde falla con el código de 0.4.3: se comprobó revirtiendo la corrección, y agota el plazo de la prueba a los cinco segundos.
- `npx playwright test`: 10 pruebas de navegador superadas.

Esta corrección evita el bloqueo y explica mejor el fallo, pero **no se ha podido confirmar que Freighter conecte en Edge y Brave**: depende de una extensión de navegador que no se puede instalar en el entorno de pruebas. Para identificar la causa en esos navegadores se conserva un diagnóstico que habla el mismo protocolo que la biblioteca, en [la guía de operación y recuperación](../guias/operacion-y-recuperacion.md).

## Despliegues

La versión se publica en el repositorio privado y en el clon público siguiendo la guía [de flujo de desarrollo y publicación](../guias/flujo-desarrollo-y-publicacion.md).
