# ADR-002: Replay determinista y versionado

## Estado

Aceptada el 12 de septiembre de 2026.

## Contexto

Un hash final solo es útil si un tercero puede reconstruir el mismo estado con las mismas reglas. Los cambios del motor tampoco deben invalidar la capacidad de verificar partidas históricas.

## Decisión

Cada replay incluye una versión de motor, entradas completas, semilla y nonce revelados, ganador y hash final. El verificador selecciona la implementación mediante `engineVersion`; las versiones antiguas se conservan con sus vectores.

## Consecuencias

- Navegador y servidor deben ejecutar reglas idénticas.
- Todo cambio semántico crea otra versión.
- Los fixtures históricos no se sobrescriben.
- Los motores futuros necesitan un registro inmutable de artefactos.

## Referencias

- [Protocolo y versionado](../arquitectura/protocolo-y-versionado.md)
- [Motor v2](../arquitectura/motores/motor-v2.md)
- [Formato de evidencia](../arquitectura/formato-evidencia.md)

