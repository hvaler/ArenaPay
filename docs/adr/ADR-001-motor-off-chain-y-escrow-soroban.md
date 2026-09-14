# ADR-001: Motor fuera de cadena y escrow en Soroban

## Estado

Aceptada el 11 de septiembre de 2026.

## Contexto

Ejecutar cada movimiento dentro del contrato elevaría coste, latencia y complejidad. Sin embargo, dejar también el dinero fuera de cadena obligaría a confiar por completo en el operador.

## Decisión

El motor se ejecuta fuera de cadena. Soroban conserva los depósitos, el compromiso, la versión del motor, el ganador y el hash final. El contrato paga solamente una resolución con firma válida del árbitro.

## Consecuencias

- La partida es rápida y el contrato permanece pequeño.
- El replay puede revisarse sin ejecutar el juego en Soroban.
- El árbitro sigue siendo una dependencia de confianza.
- Un participante puede recuperar depósitos al vencer el plazo.

## Alternativas consideradas

- Ejecutar el motor completo en cadena: descartado para el MVP por coste y complejidad.
- Custodia totalmente centralizada: válida como adaptación futura, pero ofrece menos garantías públicas.

## Referencias

- [Arquitectura principal](../arquitectura/analisis-y-decisiones.md)
- [Invariantes del escrow](../seguridad/invariantes-del-escrow.md)

