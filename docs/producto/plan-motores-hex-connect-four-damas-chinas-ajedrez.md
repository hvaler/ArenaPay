# Plan de desarrollo de motores: Hex, Connect Four, Damas chinas y Ajedrez

Fecha: 21 de septiembre de 2026. Estado: **etapa común completada en 0.4.0; juegos todavía no implementados**.

Este plan convierte ArenaPay en una plataforma multimotor mediante cuatro juegos, en este orden:

1. **Hex**
2. **Connect Four**
3. **Damas chinas para dos jugadores**
4. **Ajedrez**

El orden es deliberado. Cada juego introduce una dificultad que el siguiente reutiliza: Hex prueba
la integración mínima sin empates; Connect Four obliga a modelar tablas; Damas chinas añade saltos
encadenados y partidas largas; Ajedrez reutiliza turnos, reloj, abandono y resultados no decisivos.

## Resultado que se busca

Al finalizar, ArenaPay debe poder crear una partida indicando su motor, ejecutar o recibir movimientos,
guardar un replay inmutable, reproducirlo en otro navegador, verificar su hash y liquidar o devolver
el escrow según el resultado. Los cuatro motores deben convivir con `resource-arena/1.0.0` y
`resource-arena/2.0.0`, que permanecen congelados.

La primera entrega de cada juego será **Testnet**. Mainnet y fondos reales continúan fuera del alcance
hasta completar los criterios de seguridad y producción.

## Decisiones comunes antes del primer juego

### C1 — Sobre de evidencia independiente del juego

El replay vigente contiene campos propios de la arena. Se añadirá un sobre genérico versionado que
incluya como mínimo:

- versión del protocolo de evidencia;
- identidad inmutable del motor;
- configuración pública de la partida;
- participantes y orden inicial;
- compromiso de la semilla cuando el motor use aleatoriedad;
- lista canónica de acciones;
- resultado y causa de terminación;
- hash del estado final;
- metadatos del artefacto exacto del motor.

Los replays históricos no se migran ni se reescriben. El verificador selecciona el esquema y el motor
por sus versiones.

### C2 — Catálogo de motores y presentación

La frontera `GameEngine` ya ejecuta, construye y verifica replays. Se ampliará con metadatos y una
frontera visual separada:

- nombre y versión del juego;
- esquema de configuración;
- capacidades: agentes, humanos, reloj, empate y secreto;
- renderizador del tablero;
- codificador y validador de acciones;
- resumen accesible del resultado.

Las reglas no deben entrar en React, el coordinador ni el contrato.

### C3 — Turnos y sesiones para dos personas

Cada partida tendrá una URL estable `/match/{id}`. El backend aceptará una acción únicamente del
participante cuyo turno esté activo y conservará un número de secuencia para rechazar duplicados o
acciones sobre estado antiguo. Las wallets firman la entrada, la delegación de sesión o ambas según
el modo elegido; nunca se comparte una clave privada.

Se implementarán reconexión, abandono, vencimiento y reloj del servidor. El reloj de la interfaz solo
representa el valor autoritativo del backend.

### C4 — Resultado más amplio que un ganador

El contrato actual liquida a una sola dirección. Antes de Connect Four se diseñará y probará una
versión de protocolo que represente:

- victoria de A o B;
- empate con devolución definida;
- abandono o tiempo agotado;
- cancelación antes del inicio.

La opción recomendada para el empate es devolver a cada participante su inscripción, descontando
solo los costes que se hayan comunicado antes de firmar. No se usará el vencimiento como sustituto de
una tabla legítima. Esta ampliación requiere ADR, pruebas Rust/TypeScript y un nuevo despliegue
Testnet; el contrato actual y sus recibos permanecen disponibles.

## Reglas de ingeniería para todos los motores

- Identidad inmutable con formato `<juego>/<major.minor.patch>`.
- Enteros, orden total explícito y serialización canónica.
- Ningún uso de reloj local, red, configuración regional o `Math.random` dentro del motor.
- La semilla solo resuelve decisiones previamente documentadas; no corrige reglas ambiguas.
- Validación estricta antes de reproducir cualquier acción.
- Límite de acciones, tamaño de replay, CPU y memoria.
- Vector de regresión estable por cada causa de terminación.
- Pruebas unitarias, de propiedades, diferenciales y de navegador.
- Barrido automático de partidas de agentes para detectar bloqueos, estados imposibles y sesgos.
- Accesibilidad por teclado, texto alternativo del tablero y estado comprensible sin depender del color.

## Etapa 0 — Preparar la plataforma multimotor

**Duración orientativa:** 3–5 semanas para una persona.

### Entregables

- [x] Sobre genérico de evidencia y compatibilidad con replays v1/v2.
- [x] Catálogo de motores con metadatos y carga de renderizadores.
- [x] Selección de juego al crear una partida.
- [x] URL estable por partida, lectura por identificador y sincronización de dos navegadores.
- [x] Protocolo de estado por turnos con secuencia, control de concurrencia e idempotencia.
- [x] Especificación de resultado `win | draw | cancelled`.
- [x] ADR para resultados, devolución y compatibilidad contractual.
- [x] Plantilla de pruebas y documentación para un motor nuevo.

La base implementada se describe en [Plataforma multimotor: etapa común](../arquitectura/plataforma-multimotor-etapa-comun.md).
La selección atraviesa navegador, API y contrato. El protocolo compartido ya define la transición
autoritaria. Hex completará su enlace a persistencia, rutas firmadas y controles humanos; ese trabajo
forma parte de la Etapa 1 porque todavía no existe un motor activo por turnos.

### Criterio de salida

La arena actual sigue pasando todos sus vectores; un motor de prueba mínimo puede registrarse sin
añadir condicionales del juego en el coordinador; dos navegadores abren la misma partida por URL.

## Etapa 1 — Hex

**Identidad propuesta:** `hex/1.0.0`  
**Duración orientativa:** 3–4 semanas.

Hex es el primer motor porque siempre existe un ganador y toda la información es pública. Permite
validar la arquitectura antes de introducir empates o reglas extensas.

### Alcance inicial

- Tablero fijo de 9 × 9 para mantener partidas y replays acotados.
- Dos colores; A conecta norte-sur y B conecta oeste-este.
- Una acción coloca una piedra propia en una celda vacía.
- Alternancia estricta; el participante inicial forma parte de la configuración firmada.
- Victoria mediante conectividad entre los dos lados asignados.
- Sin regla de intercambio en `1.0.0`; se evaluará como versión posterior para reducir la ventaja de
  apertura.
- Dos agentes básicos deterministas y modo humano para dos navegadores.

### Trabajo técnico

- Estado compacto del tablero y búsqueda de conectividad reproducible.
- Esquema `HexMove`, replay y verificador.
- Renderizador hexagonal adaptable y controles accesibles.
- Agentes de referencia: conexión más corta y bloqueo/conexión ponderados.
- Vectores: victoria de cada lado, movimiento repetido, turno incorrecto, tablero completo y replay
  alterado.
- Partida Testnet completa con dos wallets y evidencia publicada.

### Criterio de salida

Dos personas o dos agentes completan Hex desde dispositivos distintos; un tercero reproduce la
partida, obtiene el mismo ganador y el escrow paga mediante la capa común.

## Etapa 2 — Connect Four

**Identidad propuesta:** `connect-four/1.0.0`  
**Duración orientativa:** 3–5 semanas, además del protocolo de empate de C4.

### Alcance inicial

- Tablero estándar de 7 columnas × 6 filas.
- Una acción elige columna; la ficha ocupa la posición libre inferior.
- Gana la primera línea horizontal, vertical o diagonal de cuatro fichas.
- El turno inicial queda registrado y puede alternarse en una serie.
- Tablero lleno sin línea ganadora produce `draw`; no se inventa un ganador por puntuación.
- Agentes deterministas básico, táctico y de búsqueda limitada; modo humano reutiliza las salas de Hex.

### Trabajo técnico

- Detección completa de líneas y empate.
- Replay con columna y posición resultante validada por el motor.
- Integración real de devolución por empate en Testnet.
- Renderizador con animación visual que no altere el orden lógico.
- Pruebas de amenazas horizontales, verticales, ambas diagonales, columna llena, doble victoria
  imposible y 42 acciones sin ganador.
- Pruebas diferenciales contra una implementación de referencia pequeña e independiente.

### Criterio de salida

Se demuestran en Testnet una victoria y un empate. Ambos resultados se reproducen; la victoria paga
al ganador y el empate devuelve correctamente las inscripciones.

## Etapa 3 — Damas chinas para dos

**Identidad propuesta:** `chinese-checkers-2p/1.0.0`  
**Duración orientativa:** 5–7 semanas.

El nombre identifica expresamente la variante de dos jugadores. No es damas inglesas ni la modalidad
de tres a seis participantes.

### Alcance inicial recomendado

- Tablero de estrella tradicional de 121 posiciones válidas.
- Diez piezas por participante en triángulos opuestos.
- Una acción es un paso adyacente o una secuencia completa de saltos.
- Los saltos no capturan piezas y una ruta no puede visitar dos veces la misma posición.
- Gana quien ocupa con sus diez piezas el campamento objetivo.
- Al entrar en el campamento objetivo una pieza puede moverse dentro de él, pero no abandonarlo.
- Límite de acciones y reloj para impedir partidas indefinidas.

### Decisión de reglas obligatoria

Antes de programar se publicará un reglamento de una página que resuelva bloqueo del campamento,
repetición y fin por límite. La recomendación es declarar **empate con devolución** cuando se alcanza
el límite sin objetivo completo. No se adjudicará por una métrica de distancia presentada como si
fuera la regla tradicional.

### Trabajo técnico

- Modelo de coordenadas y lista fija de las 121 posiciones.
- Generación y validación de rutas de salto encadenadas.
- Rechazo de rutas con destino ocupado, salto sin pieza intermedia o ciclo.
- Detección de objetivo, repetición y límite.
- Renderizador con selección de ruta y previsualización antes de confirmar.
- Agentes deterministas de avance y búsqueda acotada.
- Pruebas de pasos, saltos simples y múltiples, bordes, campamentos, ciclos y replays grandes.
- Medición de tamaño, tiempo de verificación y duración de partidas.

### Criterio de salida

Una victoria y un empate por límite se reproducen dentro de los presupuestos definidos. El tablero
es utilizable en escritorio y móvil, y el replay no supera el límite público establecido.

## Etapa 4 — Ajedrez

**Identidad propuesta:** `chess/1.0.0`  
**Duración orientativa:** 7–10 semanas.

Ajedrez se implementa al final porque combina reglas extensas, relojes, abandono y varias clases de
tablas. No se escribirán las reglas completas desde cero sin comparar una biblioteca madura y su
licencia con los requisitos de distribución de ArenaPay.

### Alcance inicial

- Posición inicial estándar y partidas de dos personas.
- Acciones canónicas en coordenadas de origen/destino y promoción; SAN se deriva para presentación.
- Enroque, captura al paso, promoción, jaque, mate y ahogado.
- Abandono y tiempo agotado como causas firmadas de terminación.
- Tablas por ahogado, material insuficiente, repetición y regla de movimientos sin captura ni peón,
  definidas exactamente en el reglamento de `chess/1.0.0`.
- FEN para instantáneas y PGN como exportación; el replay canónico conserva las acciones propias del
  protocolo, no depende de analizar texto PGN.
- Sin motor de fuerza competitivo en la primera entrega. Los agentes de ajedrez y la integración UCI
  se planifican después de validar el modo humano.

### Trabajo técnico

- Evaluar biblioteca de reglas, licencia, mantenimiento, determinismo y compatibilidad navegador/Node.
- Encapsularla detrás de `GameEngine`; ningún tipo de la biblioteca cruza la frontera pública.
- Definir reloj autoritativo y tolerancia de red sin usar marcas temporales del cliente para decidir.
- Registrar ofertas y aceptación de tablas sin permitir que una interfaz falsifique el resultado.
- Renderizador accesible con historial, orientación y promoción.
- Vectores por cada movimiento especial y causa de terminación.
- Comparación de partidas con una segunda implementación o corpus público de posiciones legales.
- Pruebas adversariales de replays ilegales, posiciones manipuladas y desincronización del reloj.

### Criterio de salida

Dos jugadores completan una partida decisiva y una partida en tablas desde equipos distintos. Ambas
se exportan, reproducen y contrastan; el contrato paga o devuelve según el resultado firmado.

## Calendario orientativo

La estimación supone una persona desarrollando, documentando y probando. No incluye auditoría externa.

| Bloque | Semanas | Acumulado |
|---|---:|---:|
| Plataforma multimotor y turnos | 3–5 | 3–5 |
| Hex | 3–4 | 6–9 |
| Resultado y devolución por empate | 2–3 | 8–12 |
| Connect Four | 3–5 | 11–17 |
| Damas chinas para dos | 5–7 | 16–24 |
| Ajedrez | 7–10 | 23–34 |
| Endurecimiento conjunto y piloto | 3–5 | 26–39 |

Con dos personas, una puede concentrarse en motores y pruebas y otra en plataforma, interfaz y
operación. La duración no se divide automáticamente por dos porque reglamentos, integración y
revisión siguen siendo secuenciales.

## Hitos publicables

| Hito | Demostración | Evidencia mínima |
|---|---|---|
| M0 | Catálogo multimotor y URL de partida | ADR, API, dos navegadores y arena histórica intacta |
| M1 | Hex completo | Replay, vectores, prueba Testnet y vídeo corto |
| M2 | Connect Four con tabla | Victoria, devolución por empate y recibos Testnet |
| M3 | Damas chinas 2P | Saltos múltiples, límite, rendimiento y replay descargable |
| M4 | Ajedrez humano | Mate, tablas, reloj y exportación PGN |
| M5 | Piloto multimotor | Usuarios externos, métricas, incidencias y coste por partida |

Cada hito se publica con una etiqueta, artefacto exacto del motor, matriz de compatibilidad, evidencia
y procedimiento de restauración. Un vídeo ayuda a entenderlo, pero no reemplaza replays, hashes ni
recibos.

## Trabajo que no debe mezclarse con estos cuatro motores

- Mainnet o fondos reales.
- Póker, cartas privadas o azar verificable.
- Más de dos participantes.
- Marketplace abierto de motores.
- Ejecución de código de terceros sin sandbox.
- Sustitución del árbitro por consenso o múltiples verificadores.

Estas capacidades requieren amenazas y contratos distintos. Separarlas mantiene comprobable el
avance de cada juego.

## Próxima acción concreta

Crear el backlog de la Etapa 0 y un ADR del sobre genérico de evidencia. Después implementar un
prototipo local de `hex/1.0.0` con estado, movimientos y conectividad, todavía sin tocar el contrato.
Cuando sus vectores sean estables se integra en API, interfaz y Testnet.

## Documentos relacionados

- [Registrar un motor nuevo](../guias/registrar-un-motor.md)
- [ADR-006: frontera y registro de motores](../adr/ADR-006-frontera-y-registro-de-motores.md)
- [Reutilización en otros juegos](../arquitectura/reutilizacion-juegos-y-jugadores.md)
- [Hoja de ruta posterior a la hackathon](roadmap-post-hackathon.md)
- [Criterios para producción](../seguridad/criterios-para-produccion.md)
