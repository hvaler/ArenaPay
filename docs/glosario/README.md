# Glosario de ArenaPay

## Agente

Programa que elige movimientos dentro de un juego. Atlas y Nova son agentes deterministas sencillos; no son modelos de lenguaje ni aprenden durante la partida.

## Árbitro

Servicio que verifica el replay y firma la resolución. El contrato comprueba su firma antes de pagar. En el MVP existe un único árbitro de confianza.

## Atlas

Agente A del motor actual. Su política `collector-v1` busca el recurso más cercano.

## Compromiso de semilla

Hash publicado antes de ejecutar la partida. Une la versión del motor, la semilla y un nonce secreto para impedir que terceros adivinen la arena recorriendo todas las semillas posibles.

## Durable Object

Componente de Cloudflare que coordina solicitudes y conserva datos persistentes. ArenaPay utiliza uno con almacenamiento SQLite para partidas, semillas, nonces y replays.

## Engine version

Identificador de la versión exacta de un motor. Forma parte de la partida y de la resolución firmada. Evita verificar un replay con reglas diferentes.

## Escrow

Contrato que retiene temporalmente las inscripciones. Paga al ganador tras una resolución válida o devuelve los depósitos al vencer el plazo.

## Freighter

Wallet para Stellar utilizada por los participantes. Conserva sus claves y muestra las solicitudes de firma.

## Hash

Resumen criptográfico de longitud fija. Cambiar cualquier dato relevante produce, con probabilidad práctica, otro valor. ArenaPay utiliza SHA-256 para compromisos y estados finales.

## Ledger

Unidad de avance de la red Stellar. Los vencimientos del contrato se expresan mediante un número de ledger y no mediante la hora del ordenador.

## Motor

Código que aplica las reglas, procesa movimientos y calcula el estado final de un juego. Debe producir el mismo resultado en Node y en el navegador.

## Nonce

Valor aleatorio secreto de 32 bytes que acompaña a la semilla en su compromiso. Se revela con el replay, después de ejecutar la partida.

## Nova

Agente B del motor actual. Su política `tactician-v1` pondera valor, distancia y posición del rival.

## Propietario

Persona o cuenta que controla la wallet asociada a un agente. En el MVP los propietarios firman presupuestos y depósitos; Atlas y Nova eligen los movimientos.

## Replay

Archivo con versión, semilla revelada, nonce, políticas, movimientos, ganador y hash final. Permite repetir una partida y comprobar su resultado.

## Resolución

Mensaje que identifica partida, motor, compromiso, ganador y hash final, acompañado por la firma del árbitro.

## RPC

Servicio mediante el que la aplicación consulta y envía operaciones a Stellar. ArenaPay puede utilizar respaldos para lecturas, pero envía cada escritura una sola vez.

## Seed o semilla

Número inicial utilizado por el generador determinista para crear la arena. Por sí sola tiene un espacio pequeño; por eso el compromiso v2 añade un nonce secreto.

## Soroban

Plataforma de contratos inteligentes de Stellar. ArenaPay despliega en Soroban Testnet su contrato de escrow.

## Testnet

Red de pruebas de Stellar. Sus XLM no tienen valor económico real. Todo el MVP opera exclusivamente en esta red.

## Tick

Paso discreto de la simulación. El motor actual ejecuta 60 ticks y registra un movimiento por agente en cada uno.

## Wallet

Aplicación que administra una cuenta y autoriza operaciones. Nunca debe entregarse una clave secreta o frase de recuperación a ArenaPay.

