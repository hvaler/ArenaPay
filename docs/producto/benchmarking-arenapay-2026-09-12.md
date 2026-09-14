# Benchmarking de ArenaPay

**Fecha:** 12 de septiembre de 2026. **Comparación:** ArenaPay actual frente a la versión paralela ArenaPayGem, cuyo título es «ArenaPay - Torneo Verificable para Agentes de IA en Soroban».

## 1. Dictamen ejecutivo

Ambas versiones persiguen el mismo objetivo: competición de agentes, reproducción del resultado y liquidación mediante Soroban. La versión paralela destaca por explicar el proceso mediante cinco pasos y situar el escrow junto al tablero. Nuestro ArenaPay tiene una base más avanzada para demostrar depósitos, presupuesto y liquidación reales en Testnet, pero presenta esa capacidad en un panel demasiado separado de la experiencia principal.

**Recomendación: conservar la base de ArenaPay y trasladar a ella el recorrido guiado de ArenaPayGem.** No conviene sustituir la integración actual por la paralela: en el código revisado, sus acciones de depósito y liquidación están simuladas. El contrato Rust existe, pero la web no lo invoca mediante esas acciones.

El aprendizaje más valioso no es elegir entre una estética clara u oscura. Es hacer que el usuario entienda, en una sola vista, qué ha ocurrido, qué falta y qué prueba respalda cada estado.

## 2. Alcance y método

Se revisaron README, componentes de interfaz, adaptadores de wallet, motor, firma del árbitro, contrato y documentación de ambos proyectos. La identidad de la versión paralela se confirmó en su fichero local `C:\nexus\dev\ArenaPayGem\apps\web\index.html`. La evaluación visual utilizó las capturas locales de ArenaPayGem y `test-results/arenapay-desktop.png` de ArenaPay; esos archivos externos o generados no forman parte de este repositorio.

La apertura del navegador a localhost agotó el tiempo de espera. Los enlaces públicos declarados en el README tampoco pudieron abrirse con la herramienta web. Esto **no demuestra que los despliegues estén caídos**, ni permite asegurar que su contenido coincida con el código local. No se midieron velocidad, accesibilidad, comportamiento móvil ni conversión con usuarios. No se ejecutaron nuevas transacciones ni se repitieron las suites de pruebas para este informe.

Se distinguen tres niveles: **observado en código o captura**, **evidencia conservada de un ensayo anterior** y **pendiente de validar en vivo**. Las conclusiones se refieren a las versiones locales examinadas, no a una auditoría de seguridad ni a todo posible despliegue de cada proyecto.

## 3. Matriz comparativa

| Criterio | ArenaPayGem | ArenaPay actual | Implicación |
|---|---|---|---|
| Comprensión del recorrido | Cinco pasos visibles y una acción principal por etapa. | Práctica, evidencia y Testnet repartidos entre secciones. | Adoptar el recorrido guiado. |
| Identidad visual | Oscura, violeta y cian; estética de competición. | Clara, azul; presentación de laboratorio con más espacio y jerarquía. | Ambos estilos son coherentes; no hay evidencia de preferencia de usuarios. |
| Visibilidad del pago | Escrow al lado del tablero. | Panel Testnet debajo de la arena. | Subir premio, financiación y acción siguiente. |
| Exploración de partidas | Semilla y segundo participante fijados en App. | Semilla editable, importación y descarga de replay. | Mantener la capacidad de explorar y compartir. |
| Reproducción | Motor compartido y controles anterior/siguiente. | Motor compartido, velocidad, barra e importación con validación. | Aprovechar los pasos individuales sin perder validación. |
| Wallet y depósitos web | Adaptador de demostración; no envía las invocaciones a Soroban. | Freighter e integración RPC con comprobaciones de red y transacción. | Ventaja funcional de la base actual. |
| Presupuesto | Tarjeta informativa y rechazo simulado; gasto mostrado permanece en cero. | Autorización y gasto acumulado aplicados en contrato. | Conservar enforcement y mejorar su presentación. |
| Evidencia del resultado | Comparación con un hash del estado local/API presentado como hash del contrato. | Comparación con contrato y ensayo guardado con recibos distintos. | Etiquetar claramente reproducción local y confirmación en cadena. |
| Recuperación al vencer | Contrato cancela únicamente en Created. | Contrato permite recuperar depósitos también desde Funded al vencer. | Mantener recuperación cuando el árbitro no resuelve. |
| Persistencia | Mapas en memoria; pierde registros al reiniciar. | Archivos de partidas con escritura atómica. | Base actual más recuperable; aún no es almacenamiento distribuido. |
| Distribución | README ofrece GitHub Pages y Vercel; disponibilidad no verificada. | Entrega local, publicación pendiente. | Adoptar una demo pública accesible. |
| Pruebas | Siete casos Rust localizados, más pruebas TS y de interfaz; no ejecutados ahora. | Validación anterior documentada: 39 TS, 16 Rust y 5 navegador. | Comparar garantías y escenarios, no solo cantidades. |

## 4. Hallazgos que cambian la valoración

### A. El flujo web paralelo simula la liquidación

`DemoWalletAdapter.submitTransaction` de `ArenaPayGem/apps/web/src/lib/stellar.ts:60` devuelve siempre el mismo hash. Las funciones deposit y settleMatch construyen cadenas de demostración codificadas en base64, no invocaciones Soroban. Después, `ArenaPayGem/apps/web/src/App.tsx:156` cambia el estado a Settled y la tarjeta afirma que se han transferido fondos.

Ese hash coincide con el identificado como transacción de despliegue en su README. Por tanto, el enlace ofrecido por la web no acredita un pago de esa partida. El script e2e-demo también imprime la liquidación sin ejecutarla. Esto es una limitación concreta del recorrido revisado, no una afirmación de que el contrato nunca se haya utilizado por otros medios.

**Criterio de aceptación:** mostrar «premio pagado» únicamente tras confirmar la transacción correspondiente y relacionarla con la partida, ganador, importe y hash final.

### B. El límite de gasto paralelo es una demostración visual

El botón de presupuesto de `ArenaPayGem/apps/web/src/components/AgentAllowanceCard.tsx:11` activa un mensaje; no evalúa una operación contra una autorización. App mantiene spent en cero y el contrato revisado no incorpora un presupuesto acumulado.

Nuestra [autorización de presupuesto](../../src/contracts/arena_escrow/src/lib.rs) conserva lo gastado al renovar y lo comprueba al depositar. Sin embargo, **nuestro proyecto tampoco tiene una wallet delegada autónoma**: cada depósito requiere firma del participante. Hay que conservar esta precisión en el discurso de ambas versiones.

### C. Reproducir un hash no equivale a consultar la cadena

El verificador paralelo sí vuelve a ejecutar la simulación, lo cual aporta valor. Sin embargo, `contractHash` se recibe del estado de `ArenaPayGem/apps/web/src/App.tsx:256`, actualizado con el resultado del motor. No se obtiene mediante lectura del escrow en ese flujo. El mensaje de comparación con Stellar sobrestima la verificación realizada.

**Mejora de producto para ambos:** mostrar estados separados: «replay reproducido», «firma comprobada» y «resultado confirmado en Testnet», cada uno con su propia fuente.

### D. Hay una incompatibilidad de formato en la firma paralela

El árbitro TypeScript de `ArenaPayGem/services/match-engine/src/referee.ts:40` incorpora engineVersion como UTF-8 directo, mientras que su contrato Rust en `ArenaPayGem/contracts/arena_escrow/src/lib.rs:170` incorpora la serialización XDR. Los mensajes no tienen los mismos bytes. Además, el árbitro del fallback de navegador usa otro formato, con campos separados por dos puntos.

Esta discrepancia está identificada por lectura de código; no se ha ejecutado una prueba cruzada nueva. Antes de conectar ese flujo a Soroban necesita un vector común TypeScript/Rust. El prefijo ARENAPAY_V1 tampoco incluye red ni dirección de contrato: por sí solo no garantiza aislamiento entre despliegues. Nuestra [firma V2](../../src/contracts/arena_escrow/src/lib.rs) sí vincula ambos campos y dispone de [fixture compartida](../evidencia/fixtures/resolution-v2.json).

### E. La recuperación paralela deja fuera partidas completamente financiadas

`cancel_match` en `ArenaPayGem/contracts/arena_escrow/src/lib.rs:214` exige Created. Una partida Funded que no reciba resolución válida no dispone de devolución mediante esta función. El diagrama del README sugiere una cobertura mayor que la implementación. Nuestra cancelación contempla ese estado al vencer el plazo.

También conviene revisar en la versión paralela la creación sin autenticación ni configuración global de árbitro/token. Puede ser una decisión de apertura del protocolo, pero requiere que los participantes conozcan y acepten esos parámetros antes de depositar.

## 5. Qué hace mejor la versión paralela

- **Orienta al usuario:** el recorrido visible reduce la necesidad de leer instrucciones externas.
- **Acerca dinero y juego:** tablero y escrow se entienden como una misma operación.
- **Hace visible la protección presupuestaria:** es una idea fácil de enseñar a un jurado, aunque deba conectarse a comprobaciones reales.
- **Facilita una narración breve:** crear, financiar, competir y cobrar forman una secuencia demostrable.
- **Prepara material de presentación:** guía de integración, esquema de pitch, guion y capturas. La existencia de enlaces públicos plantea una mejor distribución, pendiente de verificar.

Las capturas también muestran oportunidades de pulido: etiquetas XLM/TEST/tokens inconsistentes, texto técnico de infraestructura en la cabecera y un botón final sin texto cuando se completan las etapas. El CSS adapta las columnas, pero la cabecera y el indicador de pasos necesitan comprobación móvil; no se afirma un fallo responsive sin medirlo.

## 6. Qué debe mejorar nuestro ArenaPay

Nuestra evidencia técnica no se comunica con suficiente rapidez. La primera pantalla enfatiza la práctica local y el panel Testnet queda abajo. Un visitante puede concluir que solo hay una simulación aunque exista un ensayo liquidado.

Propuesta de experiencia:

1. Ofrecer dos entradas explícitas: **Probar la arena** y **Ver una partida pagada en Testnet**.
2. Para una nueva partida Testnet, usar un recorrido único: **Preparar → Financiar 0/2 → Competir → Verificar → Cobrar**.
3. Mostrar junto al tablero el premio, participantes financiados, presupuesto restante y siguiente acción.
4. Actualizar el progreso a partir del estado confirmado del contrato, incluyendo espera, error y recuperación.
5. Mantener hashes y datos extensos desplegables; dejar visibles las conclusiones y sus enlaces de prueba.

La estética actual puede mantenerse. El cambio de mayor valor está en la organización del flujo. Ambos proyectos usan políticas programadas deterministas; no se ha demostrado aquí un torneo abierto de agentes externos o modelos generativos. También ambos confían en un árbitro: el replay permite comprobar su resultado, pero no elimina por sí mismo esa confianza.

## 7. Prioridades y validación propuesta

| Prioridad | Acción | Resultado verificable | Esfuerzo relativo |
|---|---|---|---|
| P0 | Incorporar recorrido guiado sobre nuestra integración. | No avanza a financiación o pago confirmado por un cambio local de pantalla. | Medio |
| P0 | Hacer visible el ensayo existente sin wallet. | El visitante abre replay, ganador y recibo de pago desde la primera pantalla. | Bajo |
| P0 | Unificar etiquetas de evidencia y unidades. | Ninguna simulación se presenta como transferencia; todos los importes identifican XLM de prueba. | Bajo |
| P1 | Mostrar presupuesto y recuperación junto al escrow. | Se ve disponible/gastado, plazo y acción de devolución cuando corresponde. | Medio |
| P1 | Ensayar con dos cuentas Freighter. | Crear, autorizar, depositar, verificar y liquidar con firmas reales de ambas cuentas. | Medio |
| P1 | Publicar una demo y preparar vídeo breve. | Un evaluador externo accede y consulta evidencia sin instalación local. | Medio |
| P2 | Validar móvil, teclado y estados de error. | Recorrido completo a 390 px, controles accesibles y recuperación clara ante desconexión. | Medio |

Los esfuerzos son orientativos, no compromisos de calendario. Para medir el resultado, propongo una prueba con cinco personas ajenas al proyecto: al menos cuatro deben identificar el siguiente paso sin ayuda y distinguir simulación de pago confirmado. Medir también el tiempo hasta abrir el recibo de un ensayo existente, con objetivo inicial inferior a un minuto. Son objetivos futuros, no métricas observadas.

## 8. Evidencia de nuestra base y límites pendientes

El [registro del ensayo](../evidencia/testnet-evidence.json) conserva dos depósitos de 1 XLM de prueba, pago de 2 XLM, saldos antes/después, rechazo de presupuesto excedido, rechazo de doble liquidación y un evento settled. Su fecha es 11 de septiembre a las 22:34 UTC, ya 12 de septiembre en Madrid. [Recibo de liquidación](https://stellar.expert/explorer/testnet/tx/743e702483496008c7cfbf19f3b319877fab4cd593459a7d7528e96dfceac318).

Este informe reutiliza esa evidencia anterior; no vuelve a certificar el estado actual de Testnet. Tampoco equipara el ensayo automatizado a la experiencia manual completa con Freighter. Siguen pendientes esa validación con dos cuentas, la publicación y la operación robusta. La persistencia local y el árbitro único son adecuados para la demostración delimitada, pero no acreditan preparación para producción.

**Decisión propuesta:** integrar las mejores ideas de presentación de ArenaPayGem en ArenaPay y validar la mejora con usuarios. Mantener como criterio de producto que cada afirmación de financiación, protección o pago tenga una comprobación correspondiente.
