# Locución en español para la demo completa de ArenaPay

Vídeo final: [copia MP4](../evidencia/media/arenapay-demo-testnet-es.mp4) · [YouTube](https://youtu.be/LECz_vXmFi0)<br>
Subtítulos: [arenapay-demo-testnet-es.srt](../evidencia/media/arenapay-demo-testnet-es.srt)<br>
Duración: 4:09<br>
Objetivo: grabar la voz por fragmentos y sincronizarla después, sin repetir la captura de pantalla.

## Cómo grabar

1. Crea la carpeta `C:\Users\hugo_\Videos\cursus\audio-es`.
2. Graba un archivo por bloque con el nombre indicado. La Grabadora de sonido de Windows es suficiente.
3. Mantén el mismo micrófono, distancia y volumen en todos los archivos.
4. Deja aproximadamente un segundo de silencio al principio y al final.
5. Habla con naturalidad y sin intentar encajar todavía en el tiempo exacto. Si te equivocas, repite únicamente ese bloque.
6. WAV a 48 kHz es preferible. También se aceptan M4A, MP3 o los archivos creados directamente por la Grabadora de sonido.
7. No añadas música, reducción de ruido ni normalización. Esos ajustes se harán durante el montaje.

## Fragmentos de voz

Los tiempos son ventanas de referencia. La narración puede terminar antes para dejar respirar la demostración.

### 01 — Presentación (`01-presentacion`)

**Ventana:** 00:00–00:16

> ArenaPay es una plataforma para competiciones verificables sobre Soroban. En esta demostración, Atlas y Nova compiten por recursos y el resultado puede reproducirse y comprobarse.

### 02 — Crear la partida (`02-crear-partida`)

**Ventana:** 00:16–00:34

> Creo una partida nueva en la red de pruebas de Stellar. El servidor elige una semilla secreta y publica su compromiso, evitando que los participantes conozcan el resultado antes de financiarla.

### 03 — Conectar la wallet (`03-conectar-wallet`)

**Ventana:** 00:34–00:52

> Conecto Freighter configurado en Testnet. Todo el recorrido utiliza XLM de prueba y cada operación que mueve fondos debe confirmarse en la wallet.

### 04 — Financiar el escrow (`04-financiar-escrow`)

**Ventana:** 00:52–01:29

> Los dos participantes autorizan sus presupuestos y depositan un XLM de prueba por persona. El contrato bloquea ambos depósitos como garantía, y la competición solo comienza cuando la financiación está completa.

### 05 — Ejecutar la competición (`05-ejecutar-competicion`)

**Ventana:** 01:29–01:49

> Con los dos depósitos confirmados, ejecuto la competición. Atlas prioriza los recursos cercanos y Nova combina el valor de cada recurso con la distancia.

### 06 — Replay determinista (`06-replay`)

**Ventana:** 01:49–02:35

> La simulación registra los movimientos de ambos agentes durante sesenta ticks. Las reglas y las políticas son deterministas: la misma semilla y las mismas entradas producen exactamente el mismo replay y el mismo resultado.

### 07 — Resultado y firma (`07-resultado-firma`)

**Ventana:** 02:35–03:05

> Nova consigue diecinueve puntos y Atlas consigue dieciséis. Antes del pago, el navegador vuelve a ejecutar el juego, verifica su hash y comprueba la firma del árbitro.

### 08 — Liquidar el premio (`08-liquidacion`)

**Ventana:** 03:05–03:34

> El contrato valida la firma y paga el premio a Nova. Quien solicita el pago no puede elegir al ganador. El contrato utiliza el ganador indicado en la resolución verificada.

### 09 — Comprobar en la cadena (`09-comprobacion-cadena`)

**Ventana:** 03:34–03:51

> Finalmente, comparo el replay con el contrato. El ganador y el hash coinciden al cien por cien, y la transacción de liquidación queda disponible en el explorador de Stellar Testnet.

### 10 — Exportar la evidencia (`10-exportar-json`)

**Ventana:** 03:53–04:09

> También puedo importar el replay, verificarlo de nuevo en el navegador y descargarlo como un archivo de datos JSON. Así, cualquier persona puede conservar la evidencia y volver a calcular el resultado.

## Montaje posterior

Cuando estén grabados los diez archivos:

1. Se limpiarán los silencios y el ruido constante sin alterar el timbre de la voz.
2. Cada fragmento se colocará dentro de su ventana y se ajustarán solo las pausas necesarias.
3. La voz se normalizará aproximadamente a `-16 LUFS`, con un limitador para evitar saturación.
4. El sonido original de la captura se mantendrá muy bajo si aporta contexto; si contiene avisos molestos, se silenciará.
5. Se exportará una nueva copia en MP4. El vídeo completo actual y todos los audios originales permanecerán intactos.

El resultado final y sus huellas SHA-256 están registrados en el [archivo audiovisual](../evidencia/media/README.md).

## Pronunciación sugerida

- ArenaPay: «Arena Pei».
- Soroban: «Sorobán».
- Stellar: «Stélar».
- Testnet: «Test-net».
- Freighter: «Fréiter».
- Replay: «ríplei».
- JSON: «yeison».
- XLM: «equis-ele-eme».
