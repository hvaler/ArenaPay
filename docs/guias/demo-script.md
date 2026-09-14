# Demo de ArenaPay en Testnet

El ensayo ya se puede revisar desde **Cargar ensayo verificado de Testnet**. No necesita conectar una wallet para leer el estado o reproducir la evidencia.

| Tiempo | Acción |
| --- | --- |
| 00:00 | «ArenaPay es una plataforma para competiciones verificables sobre Soroban. El replay permite comprobar el resultado y el escrow liquida el premio mediante una resolución firmada. Su MVP enfrenta a Atlas y Nova, dos agentes deterministas.» |
| 00:20 | Mostrar Atlas recolector y Nova táctico, semilla 2026 y las reglas fijas. |
| 00:40 | Abrir el panel Testnet: contrato, dos depósitos y presupuesto autorizado. |
| 01:00 | Cargar el ensayo y reproducir los 60 ticks. Mostrar 16 puntos de Atlas y 27 de Nova. |
| 01:30 | Comprobar el replay contra el contrato. Hash y ganador coinciden. |
| 02:00 | Abrir la transacción: pago de 2 XLM de prueba a Nova y un único evento de liquidación. |
| 02:30 | Mostrar evidencia de presupuesto excedido y doble pago rechazados; explicar que el árbitro es de confianza y que todo ocurre en Testnet. |

La grabación y publicación del video siguen pendientes. Para una nueva partida mediante la interfaz se necesitan dos cuentas Freighter en Testnet; cada propietario firma su presupuesto y depósito. El ensayo automatizado existente utiliza claves desechables locales y está documentado como tal.

Los hashes y saldos verificados están en `docs/evidencia/testnet-evidence-v2.json`; los datos privados de `.env.testnet` no deben aparecer en la grabación.
