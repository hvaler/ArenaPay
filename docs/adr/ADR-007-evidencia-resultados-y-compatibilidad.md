# ADR-007: generalizar evidencia y resultados sin reescribir replays históricos

Fecha: 21 de septiembre de 2026. Estado: **Aceptada**.

## Contexto

Los replays de la arena codifican campos propios del primer juego y expresan únicamente un ganador.
Hex, Connect Four, Damas chinas y Ajedrez necesitan configuraciones, acciones y causas de terminación
distintas. Los recibos ya publicados deben seguir siendo reproducibles con las reglas originales.

## Decisión

Los motores nuevos usarán el sobre `arenapay-evidence/1.0.0`, identificado de forma independiente a
la versión del motor. El resultado será una unión explícita `win | draw | cancelled` con una causa de
terminación. El registro de motores publicará metadatos y enlazará cada versión inmutable con un
renderizador independiente.

Los replays `resource-arena/1.0.0` y `resource-arena/2.0.0` no se migran. Un adaptador interpreta su
campo `winner` como victoria por reglas. Sus esquemas, bytes, compromisos y hashes permanecen
inalterados.

La aplicación podrá compartir `/match/{id}`. El backend añadirá `revision` y `updatedAt` a los
registros nuevos para detectar cambios entre navegadores; los registros antiguos sin esos campos se
interpretan como revisión cero.

## Consecuencias

- Un juego nuevo puede expresar su evidencia sin añadir campos a los replays históricos.
- Reglas y presentación evolucionan con identidades separadas.
- Una misma partida puede recuperarse y observarse desde varias sesiones.
- El contrato vigente solo puede pagar una victoria. El soporte de empate exige una versión nueva
  del protocolo contractual y una política explícita de devolución.
- La consulta periódica de cinco segundos es coherente y recuperable, aunque no ofrece la latencia de
  una conexión en tiempo real.

## Alternativas descartadas

- Reescribir todos los replays al formato nuevo: invalidaría evidencia y hashes publicados.
- Añadir campos opcionales indefinidamente al esquema de la arena: acoplaría todos los juegos al MVP.
- Interpretar un empate como vencimiento: confundiría una terminación legítima con un fallo operativo.

## Referencias

- [Etapa común multimotor](../arquitectura/plataforma-multimotor-etapa-comun.md)
- [ADR-002: replay determinista y versionado](ADR-002-replay-determinista-y-versionado.md)
- [ADR-006: frontera y registro de motores](ADR-006-frontera-y-registro-de-motores.md)
