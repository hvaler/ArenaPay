# Garantías y confianza

Revisión: 14 de septiembre de 2026. Alcance: motor v2, backend público y contrato Testnet actual. Esta descripción se apoya en el código y las pruebas; no es una auditoría independiente.

## Para quien empieza

El escrow es una caja con reglas: recibe las inscripciones y permite pagar o devolverlas bajo condiciones concretas. El replay es la receta para repetir la partida. El árbitro firma una resolución. Son tres comprobaciones diferentes.

| Comprobación | Qué acredita | Qué no acredita |
|---|---|---|
| Reproducir un JSON | Los movimientos aportados producen ese ganador y estado final | Quién creó el archivo, si siguió las políticas declaradas o si hubo pago |
| Verificar la firma | La clave del árbitro autorizó esos campos | Honestidad del árbitro |
| Comparar con el contrato | Ganador y hash coinciden con el registro consultado | Que el contrato haya ejecutado el juego |
| Transacción exitosa y evento | La operación fue aceptada; el evento identifica la liquidación | Por sí solos, el saldo neto del ganador tras comisiones |
| Saldos antes/después | Cambios observados entre dos consultas | Atribución exclusiva si hubo otras operaciones simultáneas |

## Quién controla qué

- El participante firma sus autorizaciones y depósitos con Freighter. Autorizar presupuesto no realiza el depósito ni elimina la firma de cada depósito.
- El administrador crea las partidas. El operador del servidor conoce semilla y nonce antes de publicar el replay.
- El árbitro puede autorizar un ganador participante y un hash. El contrato comprueba su firma, no la corrección de ese resultado.
- El contrato controla las salidas del escrow: liquidación única o devolución de depósitos recibidos al vencer.
- El RPC comunica el estado de la red. Usar respaldos mejora disponibilidad, pero no es un consenso independiente entre proveedores.

El nonce aleatorio de 32 bytes impide buscar la semilla a partir del compromiso mediante la enumeración del espacio de 32 bits, si permanece secreto. No impide que el operador seleccione semillas favorables, comparta información o retenga resultados.

## Límites de la evidencia

El hash final cubre el estado final, no todos los bytes del replay. El verificador reproduce los inputs entregados; no vuelve a exigir que cada movimiento sea la decisión de la política anunciada. Dos recorridos que alcanzan el mismo estado pueden compartir ese hash sin romper SHA-256.

La demostración de 1.000 semillas cubre esa muestra y sus invariantes; no demuestra equidad estadística universal. Atlas y Nova son programas deterministas, no modelos de lenguaje.

Fuentes: [motor y verificador](../../src/packages/shared/src/simulation.ts), [esquemas](../../src/packages/shared/src/contracts.ts), [contrato](../../src/contracts/arena_escrow/src/lib.rs), [firma](../arquitectura/formato-evidencia.md), [amenazas](modelo-de-amenazas.md).
