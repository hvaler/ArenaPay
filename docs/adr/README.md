# Decisiones de arquitectura

Los ADR registran decisiones que afectan a varias partes del proyecto. Una decisión aceptada se conserva aunque posteriormente sea sustituida; el nuevo ADR debe enlazar al anterior.

| ADR | Estado | Decisión |
|---|---|---|
| [001](ADR-001-motor-off-chain-y-escrow-soroban.md) | Aceptada | Ejecutar el juego fuera de cadena y custodiar fondos en Soroban |
| [002](ADR-002-replay-determinista-y-versionado.md) | Aceptada | Verificar resultados mediante replays y motores versionados |
| [003](ADR-003-backend-publico-cloudflare.md) | Aceptada | Publicar el coordinador persistente en Cloudflare |
| [004](ADR-004-posicionamiento-de-plataforma.md) | Aceptada | Describir ArenaPay como plataforma de competiciones verificables |
| [005](ADR-005-estructura-src-y-docs.md) | Aceptada | Agrupar código en `src/` y documentación por función en `docs/` |
| [006](ADR-006-frontera-y-registro-de-motores.md) | Aceptada | Separar las reglas mediante una interfaz y un registro de motores |
| [007](ADR-007-evidencia-resultados-y-compatibilidad.md) | Aceptada | Generalizar evidencia y resultados sin reescribir replays históricos |
