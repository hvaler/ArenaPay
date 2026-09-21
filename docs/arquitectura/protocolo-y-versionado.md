# Protocolo y versionado

El contrato y el motor tienen ciclos de versión distintos. Un cambio del juego puede requerir otro verificador sin cambiar el contrato; una transacción histórica nunca se reescribe para parecer evidencia de la versión nueva.

## Contrato de compatibilidad

| Elemento | v1 histórica | v2 actual |
|---|---|---|
| engineVersion | resource-arena/1.0.0 | resource-arena/2.0.0 |
| Compromiso | SHA-256 de JSON canónico con versión y seed | Añade nonce secreto de 32 bytes |
| Replay | Sin nonce | Nonce obligatorio, 64 caracteres hexadecimales minúsculos |
| Reproducción | Motor v1 congelado | PRNG y resolución de movimientos corregidos |
| Uso | Leer y comprobar evidencia histórica | Crear partidas nuevas |

La semilla sigue siendo un entero sin signo de 32 bits. El nonce se guarda antes de publicar el compromiso y se revela con el replay. El servicio no debe regenerarlo al reiniciarse. [Servicio](../../src/services/match-engine/src/match-service.ts).

## Identidad y firma

El ID de cadena se deriva del UUID local con el prefijo ARENAPAY_MATCH_V1. La resolución firmada utiliza el dominio ARENAPAY_V2 y ocho campos XDR: dominio, hash de red, contrato, partida, versión de motor, compromiso, ganador y hash final. Estos nombres de dominio no son una instrucción para reproducir con el motor v1 o v2: manda engineVersion.

La definición exacta y el vector entre lenguajes están en [formato de evidencia](formato-evidencia.md). Las claves de objetos se ordenan ordinalmente; no usar ordenación dependiente del idioma. Los arrays conservan su orden y los números deben ser enteros seguros.

## Procedimiento ante un cambio

1. Determinar si cambia el estado final, las reglas, serialización, inputs o compromiso.
2. Si cambia el significado de una partida, introducir una versión explícita y mantener el verificador histórico.
3. Añadir vectores que comprueben versiones antiguas y nuevas, además de errores de versión desconocida.
4. No sobrescribir fixtures ni recibos históricos; añadir archivos y registrar procedencia.
5. Generar nueva evidencia Testnet para la nueva versión y marcar si fue manual o automatizada.
6. Publicar juntos el motor/verificador compatible y los datos de demo correspondientes.
7. Registrar commit fuente, contrato y hash WASM por separado.

Un nonce diferente cambia el compromiso; no necesariamente cambia el hash final, porque el nonce no determina los movimientos ni forma parte del estado final. La unicidad observada entre 1.000 semillas no equivale a unicidad entre todos los archivos replay.

Referencias: [esquemas](../../src/packages/shared/src/contracts.ts), [motor v2](motores/motor-v2.md), [índice de evidencia](../evidencia/README.md).
