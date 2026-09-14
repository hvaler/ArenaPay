# Validación de la experiencia guiada

## Ensayo manual con dos cuentas Freighter

Usar Chrome o Edge, la aplicación local y dos cuentas con XLM de Testnet. Nunca introducir semillas privadas en ArenaPay. Este ensayo todavía requiere firmas humanas; no debe confundirse con las pruebas automatizadas.

1. Pulsar **Nueva partida en Testnet**. Conectar Atlas, introducir ambas direcciones y crear la partida.
2. Desde Atlas, autorizar hasta 3 XLM adicionales y depositar 1 XLM de prueba. Esperar la confirmación 1/2.
3. Cambiar a Nova en Freighter y volver a conectar en la página. Autorizar su presupuesto y depositar 1 XLM. Esperar 2/2.
4. Ejecutar la simulación. No debe estar habilitada con financiación incompleta.
5. Pulsar **Verificar replay y firma**. Debe confirmar ambas comprobaciones sin afirmar que se ha pagado.
6. Pulsar **Cobrar premio en Testnet**, revisar y firmar en Freighter. Comprobar que el contrato confirma Settled.
7. Pulsar **Comprobar replay contra la cadena** y abrir la transacción. Anotar partida, ganador y recibo; comprobar 2 XLM de premio, separando comisiones.
8. Para una prueba distinta que se deje vencer, comprobar que aparece la devolución desde Created o Funded. No repetir depósitos en la partida ya liquidada.

Registrar por paso: resultado, hora, cuenta pública y error si lo hay. Si una solicitud tarda, consultar el estado antes de repetirla. La aplicación consulta cada 15 segundos y permite actualización manual. Una transacción pendiente no es una confirmación.

## Prueba de usabilidad pendiente con cinco personas

Sin explicar la interfaz, pedir a cada persona: identificar la siguiente acción, abrir una partida pagada, distinguir práctica de pago confirmado, verificar el replay y localizar la recuperación de depósitos.

Objetivos: al menos 4/5 identifican el siguiente paso sin ayuda; al menos 4/5 distinguen práctica y pago; abrir el recibo existente en menos de un minuto. Medir tiempo, errores y ayudas. Estos objetivos no son resultados obtenidos.

| Persona | Próxima acción sin ayuda | Distingue práctica/pago | Segundos hasta recibo | Obstáculo |
|---|---|---|---|---|
| 1 | Pendiente | Pendiente | — | — |
| 2 | Pendiente | Pendiente | — | — |
| 3 | Pendiente | Pendiente | — | — |
| 4 | Pendiente | Pendiente | — | — |
| 5 | Pendiente | Pendiente | — | — |
