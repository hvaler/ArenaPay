# ArenaPay: arquitectura y plataforma

Estado: **publicado el 21 de septiembre de 2026**. Duración final: **2:44**.

Publicación: <https://youtu.be/4uiet8NSKwo>.

Este pitch sustituye la estructura del vídeo publicado el 20 de septiembre. La primera versión
comprimía la misma navegación de la demo y no desarrollaba la arquitectura ni la evolución como
plataforma. La demo completa se conserva como prueba operativa.

## Diferencia deliberada

| Pieza | Pregunta que responde | Material principal |
|---|---|---|
| Demo completa | ¿Funciona el recorrido real? | Captura continua de ArenaPay, Freighter y Testnet |
| Arquitectura y plataforma | ¿Qué problema resuelve, cómo está construido y hasta dónde puede crecer? | Láminas, arquitectura, evidencia, motores y hoja de ruta |

## Guion por escenas

### 01 · El problema — 00:00 a 00:18

**Visual:** competición, resultado declarado por un operador y pago dependiente de confianza.

**Locución:**

> En una competición digital, el jugador suele confiar en que el organizador declare correctamente
> quién ganó y pague el premio. Aunque el juego sea transparente, el resultado económico continúa
> dependiendo de una autoridad que controla la evidencia y el pago.

### 02 · La propuesta — 00:18 a 00:38

**Visual:** juego, evidencia y pago como tres responsabilidades distintas.

**Locución:**

> ArenaPay separa esas responsabilidades. El juego produce un replay reproducible. Un verificador
> recalcula el resultado. Soroban protege las inscripciones y solo liquida el premio cuando recibe
> una resolución firmada que coincide con la partida. El resultado se demuestra antes de cobrarse.

### 03 · La arquitectura — 00:38 a 01:07

**Visual:** propietarios y wallets → motor fuera de cadena → replay y hash → árbitro → escrow Soroban.

**Locución:**

> Los participantes autorizan y depositan desde Freighter. La competición se ejecuta fuera de
> cadena para mantener velocidad y flexibilidad. El motor genera movimientos, ganador y hash final.
> El navegador puede reproducir exactamente esas entradas. El árbitro firma red, contrato, partida,
> versión de motor, compromiso, ganador y hash. Soroban verifica esa firma y paga; nunca necesita
> ejecutar el juego completo.

### 04 · El motor desacoplado — 01:07 a 01:34

**Visual:** registro central con `resource-arena/1.0.0`, `resource-arena/2.0.0` y futuros motores.

**Locución:**

> El juego es un componente intercambiable. ArenaPay dispone de una interfaz GameEngine y un
> registro por versión. La versión actual conserva la arena de Atlas y Nova; la histórica sigue
> disponible para verificar recibos anteriores. El mismo motor corre en Node y en el navegador,
> con reglas enteras y deterministas. Añadir otro juego no exige reescribir el escrow.

### 05 · Evidencia ejecutada — 01:34 a 01:58

**Visual:** fragmento corto de la aplicación y tarjeta con contrato, replay, hash y pago de 2 XLM de prueba.

**Locución:**

> El MVP ya completó el flujo en Stellar Testnet. Dos cuentas financiaron el escrow, Nova ganó una
> partida de sesenta ticks, el navegador reprodujo el replay y el contrato transfirió dos XLM de
> prueba. El repositorio conserva movimientos, recibos, transacciones, subtítulos y el hash del
> estado final para que la demostración no dependa únicamente del vídeo.

### 06 · Más que una arena — 01:58 a 02:23

**Visual:** Hex, Connect Four, damas, ajedrez y agentes de terceros conectados al mismo núcleo.

**Locución:**

> Sobre esta base pueden incorporarse Hex, Connect Four, damas, ajedrez o carreras de agentes. Los
> juegos deterministas de dos participantes y un ganador reutilizan el contrato actual. Cada motor
> aporta reglas, replay, verificador y tablero. El póker queda en otra categoría porque necesita
> cartas privadas, azar verificable, apuestas y varios participantes.

### 07 · Camino de producto — 02:23 a 02:42

**Visual:** enlaces de partida → segundo motor → SDK y sandbox → jugadores humanos → producción.

**Locución:**

> Los siguientes hitos son enlaces de partida para dos dispositivos, un segundo motor de referencia,
> un SDK con sandbox para agentes aportados por usuarios y, después, salas con jugadores humanos.
> Antes de Mainnet hacen falta auditoría, reducción de confianza y operación profesional.

### 08 · Cierre — 02:42 a 02:55

**Visual:** ArenaPay, lema, enlaces de demo, código y evidencia.

**Locución:**

> ArenaPay convierte una partida en evidencia verificable y esa evidencia en un pago protegido.
> La arena demuestra el MVP. La arquitectura permite construir la plataforma. El código, la demo y
> las transacciones están disponibles para comprobarlo.

## Material preparado

- [Vídeo maestro 1080p](../evidencia/media/pitch-v2/arenapay-arquitectura-stellar-es.mp4)
- [Láminas 1080p](../evidencia/media/pitch-v2/README.md)
- [Subtítulos en español](../evidencia/media/pitch-v2/arenapay-pitch-v2-es.srt)
- [Miniatura](../evidencia/media/pitch-v2/arenapay-arquitectura-thumbnail.png)
- [Diagrama detallado](../assets/arenapay-flujo-verificable.png)
- [Evidencia Testnet v2](../evidencia/README.md)

## Grabación de la voz

Grabar ocho archivos independientes permite corregir una escena sin repetir todo el pitch:

| Archivo | Duración objetivo |
|---|---:|
| `01-problema.wav` | 16–18 s |
| `02-propuesta.wav` | 18–20 s |
| `03-arquitectura.wav` | 27–29 s |
| `04-motores.wav` | 25–27 s |
| `05-evidencia.wav` | 22–24 s |
| `06-juegos.wav` | 23–25 s |
| `07-roadmap.wav` | 17–19 s |
| `08-cierre.wav` | 11–13 s |

Dejar aproximadamente medio segundo de silencio al principio y al final de cada archivo. Mantener
la misma distancia al micrófono y no acelerar para alcanzar el tiempo: las láminas pueden ajustarse
a la duración real de una locución clara.

## Montaje recomendado

- Usar las láminas 01–04 durante la explicación conceptual.
- Insertar entre 8 y 12 segundos de la demo real en la escena 05, sin repetir todo el flujo.
- Volver a las láminas 06–08 para juegos, hoja de ruta y cierre.
- Aplicar transiciones suaves de 250–350 ms; evitar animaciones decorativas.
- Mantener música opcional por debajo de −28 LUFS durante la voz.
- Publicar como un vídeo nuevo y sustituir únicamente el campo **Video Pitch URL**. La URL de la
  demo permanece igual.

## Publicación en YouTube

**Título:**

`ArenaPay — Arquitectura para competiciones verificables sobre Stellar`

**Descripción:**

> ArenaPay separa juego, evidencia y liquidación para convertir competiciones deterministas en
> resultados reproducibles y premios protegidos por Soroban. Este pitch presenta la arquitectura,
> el registro de motores, la evidencia ejecutada en Stellar Testnet y la evolución hacia nuevos
> juegos y agentes aportados por usuarios.
>
> Demo completa: https://youtu.be/LECz_vXmFi0
>
> Aplicación: https://arenapay.vercel.app/
>
> Código y documentación: https://github.com/hvaler/ArenaPay
>
> 00:00 El problema de confianza
> 00:18 La propuesta de ArenaPay
> 00:38 Arquitectura fuera y dentro de cadena
> 01:07 GameEngine y registro de motores
> 01:34 Evidencia real en Stellar Testnet
> 01:58 Hex, damas, ajedrez y otros juegos
> 02:23 Hoja de ruta
> 02:42 Del MVP a la plataforma

**Etiquetas:**

`ArenaPay, Stellar, Soroban, Stellar Testnet, GameEngine, blockchain gaming, verifiable gaming, deterministic games, replay verificable, smart contract escrow, autonomous agents, agentes autónomos, Hex, ajedrez, Gaming and Physics, Stellar Odyssey Perú`

Usar la categoría **Ciencia y tecnología**, idioma español, subtítulos manuales y licencia estándar
de YouTube. En la pantalla final debe enlazarse la demo completa, no la primera versión del pitch.
