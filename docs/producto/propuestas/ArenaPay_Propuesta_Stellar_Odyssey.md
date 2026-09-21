<!-- Converted from ArenaPay_Propuesta_Stellar_Odyssey.docx -->

# ArenaPay

# Propuesta de torneo verificable para agentes de IA

| ESTADO Propuesta de hackathon |  | RESPONSABLE Equipo ArenaPay |  | ACTUALIZADO 11 de septiembre de 2026 |
| --- | --- | --- | --- | --- |

| Autores | Equipo ArenaPay |
| --- | --- |
| Revisores | Jurado de Stellar Odyssey Perú |
| Documentos relacionados | README público, video demo y transacción en Stellar testnet |
| Alcance | MVP de torneo para agentes con simulación reproducible y premio liquidado por escrow. |

# 1. Resumen

ArenaPay es un torneo competitivo para agentes de inteligencia artificial. Dos agentes se inscriben con una billetera limitada por su propietario, compiten en una simulación determinista y el contrato de escrow en Soroban libera el premio al ganador. El resultado queda respaldado por un replay reproducible y un hash de estado final.

El MVP se concentra en una partida corta, un árbitro de confianza para la demo y liquidación en Stellar testnet. No intenta resolver préstamos, gobernanza, arbitraje descentralizado ni operación con dinero real durante la hackathon.

# 2. Objetivos y límites

| Objetivos | Fuera de alcance |
| --- | --- |
| Demostrar inscripción y distribución automática de premios en Soroban. | Préstamos, colateral y liquidaciones financieras. |
| Probar que la misma semilla e inputs producen el mismo resultado. | Consenso P2P global y árbitros sin permisos. |
| Permitir que un agente actúe solo dentro de un presupuesto definido. | Custodia de claves privadas por el servicio. |
| Entregar replay, hash y transacción verificable en testnet. | Uso de fondos reales o funcionalidades reguladas. |

# 3. Problema y oportunidad

Los agentes de IA pueden tomar decisiones y ejecutar flujos, pero todavía les faltan mecanismos simples para competir, pagar una inscripción y demostrar por qué recibieron un pago. Los juegos y simulaciones son un entorno tangible para resolver ese problema: el resultado debe ser verificable, el premio no puede depender de una decisión manual y el dueño del agente debe conservar control sobre el gasto.

ArenaPay separa el juego de la liquidación. La simulación ocurre fuera de cadena para mantener una experiencia rápida; Stellar registra únicamente los compromisos económicos, el hash de la evidencia y el pago final. La regla central es que ningún agente puede gastar por encima de la autorización configurada y ningún premio se liquida sin una evidencia de resultado asociada.

# 4. Arquitectura propuesta

| Agente A | Servicio de torneo | Agente B |
| --- | --- | --- |
| Política y presupuesto | Simulación determinista Replay y hash | Política y presupuesto |
| Wallet con límites | Contrato Soroban Escrow y liquidación | Wallet con límites |

Figura 1. Arquitectura del MVP de ArenaPay.

### Componentes principales

| Componente | Responsabilidad | Almacenamiento principal | Comportamiento ante fallo |
| --- | --- | --- | --- |
| Agente | Evalúa el estado del juego y emite inputs dentro de su presupuesto. | Estado local y clave delegada. | No puede enviar nuevos inputs; conserva el límite de gasto. |
| Simulador | Ejecuta física de punto fijo y genera replay y hash final. | Log efímero y archivo de replay. | Cancela la partida; el escrow no se liquida. |
| Árbitro demo | Valida el hash y firma el resultado que recibirá el contrato. | Clave de firma de testnet. | El contrato rechaza resultados sin firma válida. |
| Contrato Soroban | Bloquea buy-ins, registra resultado y distribuye el premio. | Estado on-chain en Stellar testnet. | Mantiene fondos bloqueados hasta cancelación o resultado válido. |
| Interfaz web | Muestra brackets, replay, hash y transacción verificable. | Consulta de contrato y API del simulador. | Muestra estado pendiente sin alterar fondos. |

# 5. Ciclo de una partida

1. El propietario configura un límite de gasto y registra su agente.

2. Cada agente deposita el buy-in en el contrato Soroban de testnet.

3. El servicio crea la partida, fija una semilla y publica sus reglas y versión de simulador.

4. Los agentes entregan inputs por tick; el simulador registra inputs y hashes de control.

5. Al terminar, el árbitro reproduce o valida la partida y firma el hash final junto al ganador.

6. El contrato verifica la firma, reparte el premio de forma atómica y emite un evento consultable.

7. La interfaz enlaza el replay, el hash, la firma y la transacción de liquidación.

# 6. Contrato y datos verificables

### Contrato principal

| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| match_id | bytes32 | Sí | Identificador único de la partida y del escrow. |
| player_a y player_b | address | Sí | Wallets autorizadas para inscribir agentes. |
| buy_in | u128 | Sí | Importe bloqueado por jugador en el token de testnet. |
| engine_version | string | Sí | Versión del simulador usada para reproducir el resultado. |
| seed_hash | bytes32 | Sí | Compromiso de semilla publicado antes de la partida. |
| final_state_hash | bytes32 | Sí | Hash del estado final validado por el árbitro. |
| winner | address | Sí | Dirección que recibe el premio al liquidar. |

### Garantías del contrato

El contrato solo acepta una liquidación cuando ambos buy-ins están bloqueados y la firma corresponde al árbitro configurado para la partida.

match_id es único. Cada match transita de creado a financiado, resuelto o cancelado; no admite una segunda liquidación.

Se capturan engine_version, seed_hash y final_state_hash para que cualquier demo posterior pueda identificar la evidencia correcta.

El contrato es la fuente de verdad para los fondos y el ganador liquidado. El replay es la evidencia externa que explica el resultado.

La interfaz y el contrato se publicarán junto con el repositorio del equipo antes del Demo Day.

Referencia: README del repositorio público de ArenaPay.

# 7. Consistencia y replay

La determinación de ganador no se calcula on-chain. Para la hackathon, un árbitro de testnet firma el resultado. Esta decisión reduce alcance sin ocultar el trade-off: una versión posterior puede reemplazar el árbitro por un conjunto de validadores con stake, ventanas de disputa y slashing.

| Escenario | Comportamiento esperado | Motivo |
| --- | --- | --- |
| Resultado repetido | El contrato rechaza una segunda liquidación para el mismo match_id. | Evita doble pago. |
| Falla de simulación | La partida se cancela y cada buy-in puede devolverse según el timeout. | No existe ganador sin evidencia. |
| Firma inválida | La transacción revierte sin mover el premio. | El escrow exige autorización verificable. |
| Cambio de versión | La partida conserva engine_version y no mezcla reglas durante el juego. | Permite replay coherente. |

# 8. Seguridad y privacidad

Cada agente opera con una autorización limitada: el propietario define token, importe máximo, torneo permitido y vigencia. La interfaz nunca necesita guardar la clave privada principal del usuario.

El MVP registra solo direcciones de testnet, identificadores de partida, hashes y métricas técnicas. No requiere datos personales ni perfiles de jugadores.

La clave del árbitro se mantiene fuera del repositorio y se carga mediante variables de entorno locales. No se entrega en la demo ni se registra en logs.

Las funciones administrativas se restringen a crear torneos de testnet y cancelar partidas sin resultado. Ninguna función permite retirar buy-ins de forma arbitraria.

Los replays pueden alojarse fuera de cadena; el contrato conserva el hash que permite detectar cambios. Los datos de testnet se consideran demostrativos y no financieros.

# 9. Preparación para la demo

| Señal | Objetivo o alerta | Responsable | Condición de salida |
| --- | --- | --- | --- |
| Inscripción | 2 de 2 buy-ins confirmados en testnet. | Equipo ArenaPay | Obligatoria |
| Reproducibilidad | Replay reejecutado con el mismo hash final. | Equipo ArenaPay | Obligatoria |
| Liquidación | Premio distribuido en una transacción verificable. | Equipo ArenaPay | Obligatoria |
| Límites del agente | Intento fuera de presupuesto rechazado. | Equipo ArenaPay | Recomendada |
| Video demo | Flujo completo explicado en menos de 3 minutos. | Equipo ArenaPay | Obligatoria |
|  |  |  |  |

# 10. Alternativas evaluadas

| Alternativa | Por qué se consideró | Por qué no se eligió para el MVP |
| --- | --- | --- |
| Juego y consenso enteramente on-chain | Máxima verificabilidad. | No alcanza la velocidad ni simplicidad necesarias para una partida interactiva. |
| Servidor central sin escrow | Implementación rápida. | No prueba el valor diferencial de Stellar ni elimina confianza en el operador. |
| Lending colateralizado | Añade un componente financiero novedoso. | Amplía riesgo, complejidad y ambigüedad regulatoria sin fortalecer la demo principal. |
| Red P2P de árbitros | Reduce dependencia de un árbitro. | Requiere defensa Sybil, consenso y disputas que exceden una semana de construcción. |

# 11. Preguntas abiertas

¿Qué token de testnet se usará como buy-in y premio durante la demostración?

¿Qué juego mínimo comunica mejor estrategia y reproducibilidad en menos de tres minutos?

¿Qué esquema de árbitros y disputa será apropiado después del MVP centralizado?

¿Cómo se convertirán los límites de gasto del propietario en una cuenta o autorización programable de producción?

# 12. Decisión y próximos pasos

Se recomienda construir ArenaPay como una prueba clara de competencia entre agentes con pagos verificables: torneo de dos participantes, simulación determinista, árbitro de demo y escrow Soroban en Stellar testnet. El primer hito es una partida reproducible; el segundo, la inscripción y liquidación on-chain; el tercero, el video de tres minutos con hash, replay y transacción. Solo después de validar este flujo deben evaluarse árbitros descentralizados, reputación o lending.

| Hito | Entregable | Criterio de salida |
| --- | --- | --- |
| M1 | Simulador de dos agentes con semilla e inputs registrados. | Dos ejecuciones producen el mismo hash final. |
| M2 | Contrato Soroban de escrow en testnet. | Buy-ins se bloquean y el premio se liquida atómicamente. |
| M3 | Árbitro y visor de replay. | La firma válida se vincula a un match_id y un hash final. |
| M4 | README, video y demo final. | Jurado puede verificar la transacción y entender el flujo en tres minutos. |
