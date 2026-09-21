# Plataforma multimotor: etapa común antes de Hex

Fecha: 21 de septiembre de 2026. Estado: **implementada en desarrollo**.

Esta etapa prepara ArenaPay para incorporar Hex sin alterar los motores ni los replays publicados de
la arena de recursos. Separa las responsabilidades del juego, la presentación, la coordinación y la
evidencia, y permite consultar una misma partida desde dos navegadores mediante una URL estable.

## Componentes incorporados

| Capacidad | Implementación | Resultado |
|---|---|---|
| Evidencia genérica | `replay-envelope.ts` | Sobre `arenapay-evidence/1.0.0` con configuración, acciones, resultado y hash final |
| Compatibilidad | Adaptador `replayOutcome` | Los replays v1/v2 siguen verificándose sin migración ni reescritura |
| Catálogo de motores | `GameEngineDescriptor` y `GET /api/games` | La plataforma descubre identidad, capacidades, formato de replay y renderizador |
| Presentación separada | Registro web `games/presentations.tsx` | Las reglas no importan React; una versión de motor selecciona su renderizador |
| URL de partida | `/match/{UUID}` | Un enlace abre directamente la partida persistida |
| Sincronización | Revisión creciente y consulta cada 5 segundos | Otra pestaña, navegador u ordenador recibe cambios y el replay terminado |
| Resultado común | `win | draw | cancelled` | Victoria, empate y cancelación se representan con causas explícitas |

## Formato de evidencia

Los motores nuevos producirán un sobre con `evidenceVersion`, `gameId`, `engineVersion`, `matchId`,
configuración pública, acciones canónicas, resultado y `finalStateHash`. Semilla y compromiso son
opcionales como pareja para juegos que utilicen aleatoriedad.

El sobre tiene límites y validación estricta. `resource-arena/1.0.0` y
`resource-arena/2.0.0` conservan sus esquemas originales, compromisos y hashes. El adaptador común
traduce su campo histórico `winner` a una victoria por reglas sin cambiar el archivo.

## Enlace y sincronización

Al crear o cargar una partida Testnet, la aplicación cambia la dirección a `/match/{id}` y muestra
un botón para copiarla. Vercel y Cloudflare resuelven esa ruta hacia la aplicación, que extrae el ID,
consulta el backend y carga el estado persistente.

Cada modificación incrementa `revision` y actualiza `updatedAt`. La web consulta cada cinco segundos
mientras está visible y también al recuperar el foco. Si otra sesión ejecuta la partida, el replay y
el resultado aparecen en la primera sin recargar la página. Este mecanismo prioriza simplicidad y
recuperación; WebSocket o Server-Sent Events quedan como optimización posterior.

## Reglas y renderizadores

`GameEngine` contiene reglas, construcción y verificación de replay. Su descriptor declara
`gameId`, `rendererId`, formato y capacidades. La web mantiene un registro independiente de
presentaciones. Las dos versiones históricas usan el mismo tablero visual y reglas distintas.

Para añadir Hex se registrarán `hex/1.0.0` y su renderizador `hex`. El coordinador no deberá contener
condiciones específicas de Hex.

## Resultado y contrato

La plataforma modela victoria por reglas, abandono, tiempo o adjudicación; empate por reglas,
acuerdo, repetición, límite, ahogado o material insuficiente; y cancelación por vencimiento,
participante, operador o financiación.

El contrato Soroban publicado continúa liquidando una victoria a una única dirección. No se simula
una devolución por empate con ese contrato. Antes de Connect Four se deberá desplegar una versión
contractual que defina la devolución de una tabla, manteniendo disponible el contrato histórico y
sus recibos.

## Compatibilidad verificada

- Los motores `resource-arena/1.0.0` y `resource-arena/2.0.0` permanecen registrados.
- Los fixtures históricos conservan sus formatos y se verifican con sus motores originales.
- La prueba del backend comprueba revisión y resultado al completar una partida.
- La prueba de navegador abre una URL estable y recibe un replay producido desde otra sesión.

## Trabajo que queda para Hex

Esta etapa no implementa todavía selección de juego, acciones firmadas por turno ni reglas de Hex.
Esas capacidades forman el siguiente incremento. El enlace compartido sincroniza el estado actual
de una partida ejecutada por el coordinador; los movimientos humanos interactivos requerirán número
de secuencia, control de turno y rechazo de acciones antiguas.

Consulta también el [plan de motores](../producto/plan-motores-hex-connect-four-damas-chinas-ajedrez.md),
la [guía de registro](../guias/registrar-un-motor.md) y el
[ADR-007](../adr/ADR-007-evidencia-resultados-y-compatibilidad.md).
