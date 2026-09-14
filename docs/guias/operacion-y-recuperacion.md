# Operación y recuperación

Guía para el operador del MVP local. Para el recorrido normal con wallet utiliza el [runbook para principiantes](runbook-pruebas-arenapay.md).

## Antes de una sesión

1. Registrar commit, versión del motor, contrato, red Testnet y cuentas públicas.
2. Comprobar que el motor usa una única instancia y conserva su directorio de datos.
3. Proteger claves y copias privadas. Los JSON de partidas pendientes contienen semilla y nonce: no publicarlos ni adjuntarlos a incidencias.
4. Comprobar fondos de prueba para inscripciones y comisiones.
5. Consultar el estado actual y su ledger antes de habilitar una acción. Una pantalla antigua no es confirmación actual.

## Si algo falla

| Situación | Pasos | Cuándo se considera resuelto |
|---|---|---|
| No responde ningún RPC | Leer los endpoints indicados; revisar conexión/configuración; repetir solo la consulta | Estado y ledger vuelven a consultarse correctamente |
| Depósito o cobro queda pendiente | Guardar hash de la transacción si está disponible; consultar ese mismo hash y la partida; no crear otra operación para “probar” | Recibo exitoso/fallido y estado de partida reconciliados |
| Error de transporte durante envío | El cliente conserva el hash calculado antes de enviar y consulta ese mismo hash; no debe construir ni reenviar otra operación | Se confirma éxito/fallo o queda un error explícito de envío ambiguo con el hash |
| Motor se reinicia | Reiniciar con el mismo directorio de datos; cargar la misma partida y comparar contrato/ID/compromiso | Se recupera el registro original sin crear otra partida |
| Se pierde nonce o registro privado | Restaurar copia íntegra; si no existe, no inventar nonce ni editar compromiso | Se recupera el original o se completa devolución al vencer |
| Replay no coincide con cadena | Guardar replay público y recibos, versión y hashes; detener la liquidación y revisar motor/partida | Discrepancia explicada y verificación repetida con datos correctos |
| Partida vence | Conectar un participante; actualizar estado; solicitar devolución desde Created o Funded | Cancelled y depósitos devueltos a sus propietarios |
| Estado archivado | Identificar entradas afectadas y simular recuperación con herramientas Stellar; revisar coste y firmar operación de restauración cuando corresponda | Entradas accesibles y consulta/operación original funciona |
| Clave de árbitro comprometida | Detener creación y firma del servicio; inventariar partidas; informar a participantes | Plan de recuperación documentado y probado antes de reabrir |

El contrato actual no ofrece una rotación de árbitro en caliente. No prometer que detener el servidor elimina firmas ya emitidas o impide a un atacante que tenga la clave firmar otras resoluciones.

## Envío y consulta no son lo mismo

El [adaptador RPC](../../src/packages/shared/src/stellar-rpc.ts) calcula el hash antes de enviar y envía una sola vez al principal. Después consulta ese hash tanto si recibe una aceptación como si sendTransaction lanza una excepción de transporte. Un resultado SUCCESS o FAILED cierra la incertidumbre; tras 45 consultas sin resultado devuelve “Envío ambiguo; confirmación pendiente” con el hash.

La reconciliación permanece en el RPC principal. Los respaldos configurados se usan para lecturas ordinarias de estado, pero nunca reciben la transacción firmada. La implementación tiene pruebas para respuesta perdida seguida de éxito y para 45 resultados NOT_FOUND sin reenvío.

Reenviar exactamente la misma transacción firmada no crea por sí solo otro premio: el contrato también impide liquidación doble. El peligro operativo es reconstruir operaciones sin conocer el estado, consumir comisiones y producir resultados ambiguos. No cambiar la política de escrituras durante una incidencia.

La documentación oficial distingue [enviar una transacción](https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/sendTransaction) de confirmar su resultado. El [archivado persistente](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/state-archival) requiere restauración para volver a acceder a entradas archivadas. La UI de este MVP no automatiza ese procedimiento.

## Registro mínimo de una incidencia

Guardar fecha UTC, commit, versión, ID local y de cadena, contrato, cuenta pública, hash de transacción, endpoint sin credenciales, último ledger, estado esperado/observado, acción realizada y evidencia del cierre. Nunca pegar claves privadas, frases de recuperación ni datos privados de partidas aún no reveladas.

Pendiente de ensayo integrado: restauración completa desde copia, archivado/restauración y pérdida controlada de una respuesta real de Testnet. La respuesta perdida ya está cubierta con un RPC simulado; eso no acredita todavía el ensayo de infraestructura.
