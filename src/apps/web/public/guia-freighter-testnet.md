# Fondear Freighter con XLM de prueba

Esta guía recoge el procedimiento usado el 21 de septiembre de 2026 para preparar una cuenta de Freighter antes de probar ArenaPay en Stellar Testnet.

## 1. Seleccionar Testnet

1. Abre Freighter.
2. Abre el selector de red y selecciona **Testnet**.
3. Abre la cuenta que vas a usar en ArenaPay.

ArenaPay necesita la dirección pública de la cuenta, que comienza por `G`. No se necesita ni se debe copiar la clave secreta, que comienza por `S`.

## 2. Copiar la dirección correcta

1. En Freighter, copia la dirección pública completa.
2. Comprueba que la cuenta activa de Freighter y la dirección que vas a financiar son la misma.

Durante el ensayo se financió primero una cuenta distinta. Stellar Lab confirmó la operación, pero Freighter continuó mostrando saldo cero porque estaba seleccionada otra dirección. La solución fue volver a copiar la dirección de la cuenta activa y repetir la financiación.

## 3. Solicitar XLM a Friendbot

1. Abre [Stellar Lab](https://lab.stellar.org/) y confirma que la red superior es **Testnet**.
2. En el menú izquierdo, abre **Account → Fund account**.
3. Pega la dirección pública de Freighter en **Public key or contract id**.
4. Pulsa **Get lumens** o **Fund account with Friendbot**.
5. Espera el aviso `XLM has been successfully funded`.

Friendbot entrega XLM ficticios para pruebas. La operación realizada mostró una financiación de **10.000 XLM** en Testnet.

## 4. Actualizar Freighter

1. Cierra el panel de Freighter.
2. Ábrelo de nuevo manteniendo seleccionada la red Testnet.
3. Comprueba que aparece **Stellar Lumens: 10,000**.

El valor fiat superior puede seguir mostrando `$0.00`: los XLM de Testnet no tienen valor económico. El saldo que importa para la prueba es el número de XLM.

## 5. Conectar ArenaPay

1. Abre [ArenaPay](https://arenapay.vercel.app/).
2. Selecciona **Nueva partida en Testnet**.
3. Pulsa **Conectar Freighter**.
4. Aprueba la conexión en la wallet.
5. Comprueba que la dirección abreviada coincide con la cuenta financiada.

Cada operación que mueve fondos requiere una confirmación explícita en Freighter. El MVP utiliza exclusivamente Testnet y XLM de prueba.

## Incidencias y comprobaciones

- Si Freighter muestra `$0.00` pero aparece `Stellar Lumens: 10,000`, la cuenta está correctamente preparada.
- Si aparece saldo cero, compara la dirección completa del campo de Stellar Lab con la cuenta activa de Freighter antes de volver a solicitar fondos.
- Friendbot puede limitar solicitudes repetidas; no es necesario solicitar fondos varias veces a la misma cuenta.
- No introducir claves secretas ni frases de recuperación en Stellar Lab, ArenaPay, capturas ni documentación.

Véanse también el [runbook de pruebas](runbook-pruebas-arenapay.md), el [ensayo manual con Freighter](ensayo-manual-freighter-v2.md) y la [guía de modos de prueba](modos-de-prueba.md).
