# Invariantes del escrow

Una invariante es una regla que debe mantenerse incluso si un participante insiste, se equivoca o falla una transferencia. Estas reglas describen el contrato existente, que no se modifica en esta revisión.

Fuente: [implementación Rust](../../src/contracts/arena_escrow/src/lib.rs). Pruebas: [test.rs](../../src/contracts/arena_escrow/src/test.rs).

| Regla | Prueba concreta |
|---|---|
| Solo el administrador crea; cada jugador autoriza su presupuesto y depósito | requires_real_authorization_for_admin_player_and_budget |
| Cada operación consume solo la autoridad esperada: la firma del depósito cubre la transferencia exacta del token, la liquidación no pide firma de nadie y la devolución solo la del participante que la solicita | each_entry_point_consumes_only_the_expected_authority |
| No se aceptan participantes iguales, importe inválido o vencimiento inválido | rejects_invalid_creation_parameters |
| Una inscripción por participante; no se admiten terceros ni IDs repetidos | rejects_duplicate_or_unrelated_deposits_and_ids |
| Un solo depósito no permite pagar el premio | does_not_settle_with_one_deposit |
| El presupuesto debe existir, estar vigente y cubrir el gasto acumulado | budget_expiry_and_missing_budget_prevent_deposits; enforces_budget_without_spending_on_failure |
| Fallo del token revierte depósito y consumo de presupuesto | token_failure_rolls_back_budget_and_deposit |
| Firma inválida, ganador ajeno o hash modificado no autorizan pago | rejects_invalid_signature_without_moving_funds; rejects_other_winner_and_mutated_final_hash |
| La firma no se reutiliza en otro contrato | prevents_signature_reuse_between_contracts |
| Premio exacto, una sola liquidación y evento de evidencia | pays_exactly_once_and_emits_evidence |
| Vencimiento permite devolver solamente los depósitos recibidos | refunds_exactly_the_received_deposits_after_timeout |
| Funded vencido no liquida; Settled no cancela | expired_funded_match_cannot_settle_and_settled_match_cannot_cancel |
| Rust y TypeScript construyen el mismo digest | matches_typescript_xdr_and_signature_vector |
| Despliegue restringido a Testnet | refuses_deployment_on_other_networks |
| Lectura ejecutada en contrato extiende TTL persistente | reads_extend_persistent_match_ttl |

## Estados y conservación de fondos

Created recibe cero, una o dos inscripciones; al completar ambas pasa a Funded. Funded puede pasar a Settled antes de vencer, con firma válida, pagando dos veces la inscripción al ganador. Created o Funded pueden pasar a Cancelled desde el vencimiento, con autorización de un participante.

Para cada partida, la suma de depósitos efectivamente recibidos debe coincidir con lo retenido más lo devuelto o liquidado. Las comisiones de red son externas a esta igualdad. No confundir el saldo total del contrato, que puede contener varias partidas o transferencias ajenas, con el saldo atribuible a una partida.

Cancelar no devuelve comisiones y no repone presupuesto gastado. Tampoco funciona de forma automática al llegar la hora: alguien autorizado debe enviar la operación. El vencimiento se mide en ledgers, no en minutos fijos.

La extensión de TTL comprobada por Rust no implica que simular un getter por RPC escriba esa extensión en cadena. Las 17 pruebas cubren casos concretos; no son una demostración formal ni una auditoría independiente.

Cada rechazo se comprueba por su código exacto. Una firma inválida y una autorización ausente llegan al llamante con el mismo error del host, `Error(Context, InvalidAction)`, por lo que esas pruebas comprueban además que no se movieron fondos. Un depósito sin saldo devuelve `Error(Contract, #10)`, que es el `BalanceError` del token y coincide en número con `Error::Expired` del escrow: el código de un depósito fallido no debe interpretarse como propio del contrato.
