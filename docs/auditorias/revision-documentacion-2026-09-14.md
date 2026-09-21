# Revisión profunda de documentación — 14 de septiembre de 2026

## Alcance

Se revisaron README, contribución y todos los documentos Markdown vigentes, históricos y futuros. Las afirmaciones operativas se contrastaron con el código, `package.json`, Wrangler, la configuración de Vercel, el descriptor Testnet y las pruebas existentes. No se modificó el contrato ni la lógica del producto.

## Hallazgos corregidos

| Prioridad | Hallazgo | Corrección |
|---|---|---|
| Alta | El documento general de despliegue mezclaba bloqueantes anteriores con la arquitectura ya publicada | Sustituido por el mapa vigente de Vercel, Cloudflare y GitHub Pages, su orden de publicación y recuperación |
| Alta | El modelo de amenazas describía la API como local y sin cuotas | Actualizado con Durable Object, orígenes, límites, tope diario y riesgo residual de falta de identidad |
| Alta | `test:operational` se describía como capaz de crear una partida Testnet | Corregido: comprueba configuración y separación de práctica; no mueve fondos |
| Media | Faltaba una vista única del sistema implementado | Añadida la visión general con componentes, secuencia, estados, confianza y límites |
| Media | La referencia API no explicaba perfiles, cuerpos, códigos ni diferencia entre resolución y pago | Ampliada y contrastada con ambas implementaciones |
| Media | Una auditoría histórica terminaba afirmando que el backend público no existía | Conservado el texto histórico y añadida una actualización fechada |
| Media | El README atribuía gasto y cobro directamente a los agentes y afirmaba que el árbitro no tenía cuenta | Precisado el papel de participantes, wallet y clave Ed25519 |
| Baja | La decisión de plataforma contenía título y secciones anteriores | Sincronizada con la descripción, título y estructura vigentes |
| Baja | No existía una política de mantenimiento documental | Añadidas reglas para documentos vigentes, ADR, auditorías, evidencia y propuestas |

## Documentos añadidos

- [Visión general de la arquitectura](../arquitectura/vision-general.md).
- [Mantenimiento de la documentación](../referencia/mantenimiento-documentacion.md).
- [Evidencia de publicación del 14 de septiembre](../evidencia/publicacion-2026-09-14.md).

## Comprobaciones externas

Se abrieron las referencias oficiales utilizadas para configuración de contratos Stellar, `sendTransaction`, archivado de estado, conexión Freighter a Testnet, importación de wallet, despliegue de Vercel, GitHub Pages y validación Fastify. Las direcciones consultadas respondieron y mantuvieron el tema citado. Los recibos de Testnet se conservan como evidencia fechada; esta revisión no los presenta como operaciones nuevas.

## Reglas aplicadas

- Los documentos históricos conservan cifras y conclusiones de su fecha.
- El estado vigente apunta al README, la visión general, estado y límites, despliegue y próximos pasos.
- Una prueba de carga o configuración no se presenta como liquidación pagada.
- Semilla y nonce pendientes, secretos del servicio y material de wallet quedan fuera de la documentación.
- Las rutas de código vigentes evitan números de línea para reducir referencias frágiles.

## Validación

- Enlaces locales y anclas comprobados en 52 documentos Markdown.
- Rutas de código y configuración contrastadas.
- Runbook regenerado y sincronizado con la web.
- 67 pruebas TypeScript, compilación, empaquetado de Wrangler y 8 escenarios locales de navegador superados después de las correcciones documentales.

Las cifras concretas de la ejecución final se registran en el checklist y en el commit que incorpora esta revisión.
