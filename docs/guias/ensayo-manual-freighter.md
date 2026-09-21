# Ensayo manual completado con Freighter

El 12 de septiembre de 2026 el usuario completó en la aplicación local las autorizaciones y depósitos de Atlas y Nova, la ejecución de la partida, la verificación del replay y firma, y la liquidación del premio. Las capturas de la sesión muestran también la comparación satisfactoria del replay contra la cadena.

- Partida local: `783ac81b-f929-4ba5-b3a9-d6df36120528`.
- Partida en contrato: `785730a55e8ec10aef7e41113626dab69d906b70b9b7349d3217ada8a58e4fbf`.
- Contrato: `CDHPEYP7KEYYO3D6G44PK22MUNKF4ZBFHLOM6DUL2NOUKXNNTO4R4RID`.
- Atlas: `GAARLVPR7GF6J72HMGII7Y6PKFOK35HPKZ7WRBJBPWASLSBTSUXSHIQZ`.
- Nova: `GBJGSL3A65PK6W3UC5SQQCRC3EPSHODI7QWW4UY5CW7M4VR2ITRGY2N7`.
- Semilla: 2026. Resultado mostrado: Atlas 16, Nova 27.
- Hash final: `1f167557b9f13e95e9e5c2370bd10cc4e86cb8e079bc9374f28684c5edaf6161`.
- Ambos depósitos confirmados: 1 XLM de prueba por participante. Estado consultado: Settled; ganador: Nova. Premio del contrato: 2 XLM de prueba.

[Recibo de liquidación en Stellar Expert](https://stellar.expert/explorer/testnet/tx/2b9577790a54d67d799feaa4c2b610956521eea7f6bfa09437715260a89d6b21).

Horizon confirmó la transacción como exitosa, ledger 4640560, fecha `2026-09-12T15:19:47Z` (17:19:47 en Madrid), cuenta emisora Nova y comisión de 25690 stroops (0,002569 XLM). La consulta del contrato mediante el servicio local confirmó ambos depósitos, el estado Settled, el ganador y el hash final. No se reconstruyeron los saldos anteriores de este ensayo.

El ensayo manual queda completado. No se afirma haber grabado sus firmas: el vídeo anterior corresponde a la demo pública. La prueba de usabilidad con cinco personas sigue pendiente.

Observación de interfaz: tras liquidar, permanece un mensaje anterior «El pago requiere confirmación», aunque el estado superior ya indica Settled. Pendiente de corregir ese texto desactualizado.
