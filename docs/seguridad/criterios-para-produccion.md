# Criterios para producción

Estado: **no aprobado para producción**. Esta es una lista de decisiones y pruebas futuras, no una promesa de despliegue. El contrato actual sigue restringido a Testnet y permanece intacto.

| Prioridad | Criterio de salida | Evidencia exigida | Responsable propuesto |
|---|---|---|---|
| Alta | Definir confianza y selección de aleatoriedad | Decisión de arquitectura con ataques de selección y abandono evaluados | Arquitectura/producto |
| Alta | Resolver autoridad de árbitro y gestión de claves | Modelo de custodia, incidentes, rotación/migración y ensayo de compromiso | Seguridad/operación |
| Alta | Auditar una versión congelada | Auditoría independiente con commit/WASM y hallazgos cerrados o aceptados con motivo | Seguridad |
| Alta | Resolver hallazgos relevantes de SonarCloud | Correcciones verificadas y decisiones justificadas; nueva lectura del gate | Desarrollo |
| Alta | Proteger cualquier API pública | Autenticación, autorización, límites y pruebas de abuso/concurrencia | Backend |
| Alta | Reconciliar envíos ambiguos | Prueba unitaria completada; falta ensayo integrado de respuesta perdida, seguimiento por hash y ausencia de reenvíos automáticos | Backend |
| Media | Recuperar datos y estado de cadena | Restauración de copia, fallo de proceso, TTL y archivado ensayados | Operación |
| Media | Observar el servicio | Alertas con responsable, panel de partidas pendientes y procedimiento de respuesta | Operación |
| Media | Publicar artefactos identificables | Commit, versión, lockfile, WASM y configuración pública vinculados | Entrega |
| Media | Validar experiencia de participantes | Ensayo v2 con dos cuentas Freighter, vídeo y devolución guiada | Producto/QA |
| Alta antes de fondos reales | Acordar reglas económicas y obligaciones aplicables | Revisión especializada según mercado, custodia y funcionamiento definitivos | Producto y asesoría |

## Checklist de decisión

- [ ] Todos los criterios altos tienen evidencia revisada.
- [ ] Se ha definido qué significa “agente autónomo” y qué acciones siguen requiriendo al propietario.
- [ ] Existe presupuesto operativo para comisiones, almacenamiento y recuperación.
- [ ] Se han documentado disponibilidad esperada y pérdida de datos tolerable con ensayos.
- [ ] Una revisión separada autoriza cualquier cambio de red o contrato.
- [ ] Se ha realizado la revisión final del [modelo de amenazas](modelo-de-amenazas.md).

La suite actual y un pago exitoso prueban comportamientos del MVP. No sustituyen estas condiciones. Consultar [estado y límites](../producto/estado-y-limites.md) para evitar presentar trabajo futuro como implementado.
