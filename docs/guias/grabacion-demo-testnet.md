# ArenaPay — Guía para grabar la demo completa

Preparada el 19 de septiembre de 2026. Grabación prevista: 20 de septiembre. Red: Stellar Testnet.

Objetivo: grabar una partida nueva desde su creación hasta el pago y la comprobación final. Primero grabaremos la pantalla; después añadiremos la narración. No hace falta hablar durante la captura. Esta guía no acredita una nueva prueba: las casillas se completan al realizarla.

## Resultado publicado

La grabación final se completó el 20 de septiembre de 2026 y se conserva junto con sus subtítulos:

- [Ver la demo completa en YouTube](https://youtu.be/LECz_vXmFi0).
- [Copia MP4 en el repositorio](../evidencia/media/arenapay-demo-testnet-es.mp4).
- [Subtítulos SRT](../evidencia/media/arenapay-demo-testnet-es.srt).
- [Índice audiovisual y huellas SHA-256](../evidencia/media/README.md).

El checklist siguiente se conserva como runbook para repetir la grabación. Los recibos y replays del [índice de evidencia](../evidencia/README.md) son la referencia para contrastar las operaciones mostradas.

## 1. Preparación antes de grabar

- [ ] Abrir Chrome y ArenaPay en la versión operativa: https://arenapay.vercel.app/ . Si se utiliza la versión local, comprobar antes que el servidor y la web están funcionando.
- [ ] Confirmar que aparece «Nueva partida en Testnet». Si aparece «Demo pública sin wallet», usar la versión operativa; la demo de GitHub Pages no sirve para nuevas firmas.
- [ ] Abrir Freighter, desbloquearla y seleccionar Testnet.
- [ ] Comprobar que las dos cuentas siguientes están disponibles y tienen XLM de prueba suficientes para el depósito y las comisiones.
- [ ] Seleccionar Atlas como cuenta activa.
- [ ] Cerrar notificaciones y ventanas que tapen la aplicación. No abrir claves privadas, frase de recuperación ni contraseñas durante la grabación.
- [ ] Hacer una captura de prueba de unos segundos y reproducirla: deben verse tanto ArenaPay como las ventanas de Freighter. Capturar solo una pestaña puede omitir la extensión.
- [ ] Preparar una carpeta para el vídeo, el replay JSON y el enlace de la transacción final.

Atlas — cuenta A, termina en SHIQZ:

```text
GAARLVPR7GF6J72HMGII7Y6PKFOK35HPKZ7WRBJBPWASLSBTSUXSHIQZ
```

Nova — cuenta B, termina en GY2N7:

```text
GBJGSL3A65PK6W3UC5SQQCRC3EPSHODI7QWW4UY5CW7M4VR2ITRGY2N7
```

Son direcciones públicas de las cuentas del ensayo anterior. Comprueba que coincidan con las cuentas seleccionadas en Freighter.

## 2. Iniciar la grabación

- [ ] Iniciar la captura de pantalla sin narración.
- [ ] Mostrar la portada de ArenaPay durante unos segundos.

Audio posterior: «ArenaPay es una demo de competiciones entre agentes autónomos, con resultados reproducibles y premios mediante contratos Soroban en Stellar Testnet. En esta prueba manejo las dos cuentas participantes».

## 3. Crear una partida nueva

- [ ] Pulsar «Nueva partida en Testnet».
- [ ] En «Escrow en Stellar Testnet», pulsar «Conectar Freighter»; si ya aparece una dirección, pulsar ese botón para actualizar la cuenta conectada.
- [ ] Aceptar el permiso de conexión si Freighter lo solicita. Comprobar que la cuenta sea Atlas, terminada en SHIQZ.
- [ ] Rellenar «Dirección de Atlas» y «Dirección de Nova» con las direcciones del apartado 1.
- [ ] Pulsar «Crear partida en Testnet» una sola vez y esperar.
- [ ] Confirmar «Estado confirmado: Created», con Atlas y Nova pendientes.

Qué significa: la partida existe en el contrato y espera los depósitos. El servidor tramita la creación; no requiere una firma del participante. El tablero puede aparecer vacío mientras la semilla está reservada.

Audio posterior: «La partida se crea con un compromiso de la semilla. La semilla y su nonce permanecen reservados hasta ejecutar la competición financiada».

## 4. Autorizar y depositar con Atlas

- [ ] Confirmar que ArenaPay muestra la cuenta de Atlas, terminada en SHIQZ.
- [ ] Si falta presupuesto vigente, pulsar «Autorizar hasta 3 XLM adicionales».
- [ ] Revisar la solicitud en Freighter, comprobar Testnet y firmar. Esperar a que termine.
- [ ] Pulsar «Depositar 1 XLM de prueba».
- [ ] Revisar y firmar esta segunda operación en Freighter.
- [ ] Esperar a «Atlas: depósito confirmado». Nova debe seguir pendiente.

Qué significa: autorizar establece un límite; no transfiere tres XLM. El depósito transfiere un XLM de prueba al contrato y necesita su propia firma. Si ya hay presupuesto suficiente y vigente, se puede depositar sin renovar la autorización.

Audio posterior: «Atlas autoriza su presupuesto y firma un depósito de un XLM de prueba. La autorización y el depósito son operaciones distintas».

## 5. Cambiar a Nova y depositar

- [ ] Abrir Freighter y seleccionar Nova en el selector de cuentas: termina en GY2N7.
- [ ] Volver a la misma partida de ArenaPay, sin crear otra.
- [ ] Pulsar el botón «Freighter: …» para actualizar la cuenta conectada.
- [ ] Confirmar que ArenaPay muestra GBJGSL…GY2N7 antes de firmar.
- [ ] Si falta presupuesto vigente, pulsar «Autorizar hasta 3 XLM adicionales», firmar con Nova y esperar.
- [ ] Pulsar «Depositar 1 XLM de prueba», firmar con Nova y esperar.
- [ ] Confirmar «Estado confirmado: Funded» y depósito confirmado para ambos participantes.

Qué significa: el contrato ya custodia las dos inscripciones, con un premio total de dos XLM de prueba. No ejecutar la competición hasta ver ambos depósitos confirmados.

Audio posterior: «Nova deposita su XLM. Con los dos depósitos confirmados, la partida queda financiada».

## 6. Ejecutar y mostrar la competición

- [ ] Pulsar «Ejecutar simulación» y esperar al resultado.
- [ ] Mostrar el marcador y anotar el ganador real. No dar por hecho que ganará Nova.
- [ ] Llevar el control del replay al inicio si hace falta y pulsar ▶ para mostrar los movimientos.
- [ ] Dejar visible el resultado final unos segundos.

Qué significa: Atlas y Nova son políticas deterministas que compiten fuera de la cadena. La semilla y el nonce se revelan con el replay. La simulación terminada todavía no equivale a un premio pagado.

Audio posterior: «Los agentes compiten con estrategias deterministas. El replay registra sus movimientos y permite reproducir el resultado».

## 7. Verificar replay y firma

- [ ] Pulsar «Verificar replay y firma».
- [ ] Esperar al mensaje «Replay y firma comprobados. Ya puedes solicitar el pago».
- [ ] Confirmar que se habilita «Cobrar premio en Testnet».

Qué significa: el navegador reproduce el resultado y comprueba la firma del árbitro. Este paso no requiere una firma del usuario en Freighter. El árbitro sigue siendo una dependencia de confianza; el contrato no ejecuta el juego completo.

Audio posterior: «El navegador reproduce la partida y comprueba la firma del árbitro antes de solicitar la liquidación».

## 8. Liquidar el premio

- [ ] Mantener Nova conectada; puede solicitar la liquidación aunque gane Atlas. El resultado validado determina quién recibe el premio.
- [ ] Pulsar «Cobrar premio en Testnet» una sola vez.
- [ ] Revisar y firmar la operación en Freighter.
- [ ] Esperar a «Estado confirmado: Settled».
- [ ] Confirmar «Premio liquidado: Atlas» o «Premio liquidado: Nova», según el resultado.

Qué significa: el contrato ha liquidado el premio al ganador. La cuenta que envía la solicitud no elige al destinatario.

Audio posterior: «El contrato valida la resolución firmada por el árbitro y liquida el premio al ganador».

## 9. Comparar con la cadena

- [ ] Pulsar «Comprobar replay contra la cadena».
- [ ] Esperar a «Hash coincide 100% con el resultado del contrato».
- [ ] Mantener visibles el ganador, el estado Settled y el mensaje de coincidencia unos segundos.

Qué significa: el ganador y el hash del replay reproducido coinciden con el registro consultado en el contrato. Un hash es una huella digital de los datos.

Audio posterior: «El resultado reproducido coincide con el ganador y el hash registrados en el contrato».

## 10. Mostrar el recibo y guardar la prueba

- [ ] Pulsar «Ver transacción en Testnet» después de la liquidación.
- [ ] Mostrar en el explorador el estado exitoso y la operación settle_match.
- [ ] Copiar la URL de esta nueva transacción. No usar por error el recibo de un depósito o el de una partida anterior.
- [ ] Volver a ArenaPay y bajar hasta «Prueba de la partida».
- [ ] Pulsar «Verificar reproducibilidad» y esperar a que la comprobación termine.
- [ ] Desplazarse un poco más hacia abajo: «Descargar JSON» está debajo del botón de verificación y puede quedar fuera de la pantalla.
- [ ] Pulsar «Descargar JSON» para guardar el replay.
- [ ] Detener la grabación y reproducir el archivo para comprobar que se ha guardado correctamente.

Audio posterior: «Hemos completado el recorrido: creación, dos depósitos, competición, verificación y liquidación del premio en Stellar Testnet».

## 11. Edición, audio y entrega posterior

- [ ] Conservar la grabación original completa.
- [ ] Recortar las esperas largas manteniendo el orden de las acciones y sus confirmaciones. No presentar una partida anterior como si fuera nueva.
- [ ] Grabar la narración de los apartados anteriores y ajustarla a las imágenes. Adaptar el texto si se omitió alguna autorización porque ya estaba vigente.
- [ ] Revisar que se lean los botones, el resultado y el recibo. Priorizar claridad sobre una duración exacta.
- [ ] Subir el vídeo demo y comprobar que el enlace puede abrirse sin permisos especiales.
- [ ] Pegar el enlace en «Video Demo URL» del formulario y la nueva transacción en «Evidencia on-chain».

Según el formulario mostrado, el vídeo demo no tiene límite de duración; el pitch opcional tiene un máximo de tres minutos. El pitch se prepara por separado.

## Si algo no coincide

- Si la operación tarda, esperar o pulsar «Actualizar estado». No repetir firmas a ciegas.
- Si ArenaPay sigue mostrando Atlas después de cambiar a Nova, pulsar otra vez el botón de conexión y comprobar la dirección antes de depositar.
- Si aparece un error, conservar el mensaje y revisar el estado antes de continuar.
- Si vence el plazo, no seguir con el cobro. Consultar la guía de recuperación y el botón «Cancelar y devolver depósitos» cuando esté disponible.
- Si no aparece «Nueva partida en Testnet» o el servidor no está listo, resolverlo antes de iniciar la grabación principal.

## Registro de la grabación

Fecha y hora: __________________________________________________

Dirección de la aplicación utilizada: ______________________________

Marcador Atlas / Nova: ___________________________________________

Ganador: _______________________________________________________

URL de la transacción final: ______________________________________

________________________________________________________________

Archivo del vídeo original: _______________________________________

Archivo del replay JSON: _________________________________________

URL del vídeo publicado: https://youtu.be/LECz_vXmFi0

Notas: _________________________________________________________

________________________________________________________________

Referencia: [runbook de pruebas](runbook-pruebas-arenapay.md) y [ensayo manual anterior](ensayo-manual-freighter-v2.md). [Versión HTML para imprimir](grabacion-demo-testnet.html). Para añadir la voz al montaje final, sigue el [guion de locución en español](locucion-demo-testnet.md).
