# Selección de motores y protocolo común de turnos

Fecha: 21 de septiembre de 2026. Estado: **incorporado en ArenaPay 0.4.0 como base previa a Hex**.

ArenaPay permite elegir el motor al crear una partida y dispone de un protocolo común para aplicar
acciones por turnos con control de concurrencia. La arena de recursos continúa siendo el único juego
activo; sus versiones publicadas y sus replays no se modifican.

## Selección de juego

`GET /api/games` devuelve motores activos e históricos. El campo `lifecycle` distingue los que admiten
partidas nuevas de los que solo se conservan para reproducir evidencia antigua. La interfaz muestra
únicamente motores activos en los formularios de práctica y Testnet.

Las rutas de creación aceptan `engineVersion`. El campo es opcional para mantener compatibles los
clientes anteriores y, cuando falta, se usa el motor activo predeterminado. Una versión desconocida o
histórica se rechaza antes de crear registros o contratos.

## Frontera para motores interactivos

Un motor por turnos incorpora opcionalmente `turnProtocol` en `GameEngine`:

- `createState` crea el estado inicial desde configuración pública;
- `parseAction` valida y normaliza una acción sin confiar en el cliente;
- `applyAction` ejecuta la regla y declara el siguiente participante o un resultado final.

El coordinador conserva orden, participantes e idempotencia. Las reglas de Hex, Connect Four, Damas
chinas o Ajedrez permanecen dentro de sus adaptadores.

## Solicitud de acción

```json
{
  "actionId": "d94c185d-9d6c-43db-8786-622720ddc89a",
  "expectedRevision": 7,
  "expectedSequence": 12,
  "player": "G...",
  "action": { "row": 3, "column": 4 }
}
```

`expectedRevision` protege el registro persistido y `expectedSequence` protege el orden de movimientos.
El servidor acepta únicamente al participante activo. Una acción admitida incrementa la secuencia y se
guarda con su fecha autoritativa.

`actionId` permite reintentar una solicitud cuya respuesta se perdió. El mismo identificador y contenido
devuelve el resultado previo; reutilizarlo con otro jugador o contenido produce conflicto. Cada acción
serializada canónicamente tiene un máximo de 16 KiB.

## Errores del protocolo

| Código | Caso |
|---|---|
| 400 | Sesión, transición o acción no válida |
| 403 | El participante no pertenece a la partida |
| 409 | Revisión, secuencia o turno antiguo; partida terminada; `actionId` reutilizado |
| 413 | Acción superior a 16 KiB |

## Alcance de esta entrega

La selección ya atraviesa navegador, API Node, Worker y creación del contrato Testnet. El protocolo de
turnos y su punto de extensión están probados en el paquete compartido. La arena actual no declara
turnos porque se ejecuta completa mediante agentes.

Hex añadirá el primer `turnProtocol`, persistirá la sesión y expondrá la ruta de acciones. En esa etapa
se incorporarán autenticación o delegación de cada jugador, firma de acciones, abandono, reconexión y
reloj. Publicar una ruta que no pudiera usar ningún motor activo añadiría superficie sin aportar una
partida funcional, por eso ese enlace se completa junto con `hex/1.0.0`.

Consulta la [guía para registrar motores](../guias/registrar-un-motor.md), el
[plan de juegos](../producto/plan-motores-hex-connect-four-damas-chinas-ajedrez.md) y la
[referencia de la API](../referencia/api.md).
