# Documentación de ArenaPay

Este índice organiza la documentación técnica, operativa y de producto. El [README principal](../README.md) ofrece la presentación breve; aquí se encuentra el detalle para comprender, probar, desplegar y mantener el proyecto.

## Empezar

1. Lee el [resumen del proyecto](../README.md#resumen-del-proyecto).
2. Elige un [modo de prueba](guias/modos-de-prueba.md).
3. Sigue el [runbook desde cero](guias/runbook-pruebas-arenapay.md) si vas a utilizar Freighter.
4. Consulta el [glosario](glosario/README.md) cuando aparezca un término nuevo.

## Arquitectura

- [Visión general del sistema vigente](arquitectura/vision-general.md)
- [Flujo visual del checkpoint y FigJam](arquitectura/flujo-checkpoint-stellar-odyssey.md)
- [Análisis y decisiones](arquitectura/analisis-y-decisiones.md)
- [ArenaPay como plataforma](arquitectura/plataforma-y-reutilizacion.md)
- [Etapa común de la plataforma multimotor](arquitectura/plataforma-multimotor-etapa-comun.md)
- [Reutilización con juegos y jugadores](arquitectura/reutilizacion-juegos-y-jugadores.md)
- [Protocolo y versionado](arquitectura/protocolo-y-versionado.md)
- [Formato de evidencia y firmas](arquitectura/formato-evidencia.md)
- [Motor actual `resource-arena/2.0.0`](arquitectura/motores/motor-v2.md)
- [Motor histórico `resource-arena/1.0.0`](arquitectura/motores/motor-v1-reglas.md)
- [Cómo crear y registrar un motor](guias/registrar-un-motor.md)

## Decisiones de arquitectura

- [Índice de ADR](adr/README.md)
- [ADR-001: motor fuera de cadena y escrow en Soroban](adr/ADR-001-motor-off-chain-y-escrow-soroban.md)
- [ADR-002: replay determinista y versionado](adr/ADR-002-replay-determinista-y-versionado.md)
- [ADR-003: backend público en Cloudflare](adr/ADR-003-backend-publico-cloudflare.md)
- [ADR-004: posicionamiento como plataforma](adr/ADR-004-posicionamiento-de-plataforma.md)
- [ADR-005: estructura del repositorio](adr/ADR-005-estructura-src-y-docs.md)
- [ADR-006: frontera y registro de motores](adr/ADR-006-frontera-y-registro-de-motores.md)
- [ADR-007: evidencia, resultados y compatibilidad](adr/ADR-007-evidencia-resultados-y-compatibilidad.md)

## Guías de uso y prueba

- [Modos de prueba](guias/modos-de-prueba.md)
- [Configuración local](guias/configuracion-local.md)
- [Runbook de pruebas desde cero](guias/runbook-pruebas-arenapay.md) · [versión HTML](guias/runbook-pruebas-arenapay.html)
- [Ensayo manual actual con Freighter](guias/ensayo-manual-freighter-v2.md)
- [Ensayo manual histórico](guias/ensayo-manual-freighter.md)
- [Validación guiada](guias/validacion-guiada.md)
- [Operación y recuperación](guias/operacion-y-recuperacion.md)
- [Desarrollo privado y publicación](guias/flujo-desarrollo-y-publicacion.md)
- [Registrar un motor nuevo](guias/registrar-un-motor.md)
- [Guion de la demostración](guias/demo-script.md)
- [Guion de vídeo público](guias/guion-demo-publica.md)
- [Grabación completa de la demo Testnet: checklist y narración](guias/grabacion-demo-testnet.md) · [versión para imprimir](guias/grabacion-demo-testnet.html)
- [Locución en español para la demo Testnet](guias/locucion-demo-testnet.md) · [versión para imprimir](guias/locucion-demo-testnet.html)
- [Montaje, publicación y metadatos del pitch](guias/montaje-pitch-youtube.md)
- [Pitch v2: arquitectura, motores, juegos y hoja de ruta](guias/pitch-v2-arquitectura.md)

## Despliegue

- [Visión general y decisiones de despliegue](despliegue/README.md)
- [Cloudflare Worker y Durable Object](despliegue/cloudflare.md)
- [Frontend operativo en Vercel](despliegue/vercel.md)
- [Demo offline en GitHub Pages](despliegue/github-pages.md)

## Seguridad y producción

- [Garantías y dependencias de confianza](seguridad/garantias-y-confianza.md)
- [Modelo de amenazas](seguridad/modelo-de-amenazas.md)
- [Invariantes del escrow](seguridad/invariantes-del-escrow.md)
- [Auditoría y correcciones](seguridad/auditoria-correcciones-2026-09-12.md)
- [Criterios para producción](seguridad/criterios-para-produccion.md)

## Evidencia

- [Índice de evidencia](evidencia/README.md)
- [Confirmación de entrega en Stellar Odyssey Perú 2026](evidencia/entrega-stellar-odyssey-2026-09-20.md)
- [Publicación verificada del 14 de septiembre](evidencia/publicacion-2026-09-14.md)
- [Publicación 0.3.0 y base multimotor del 21 de septiembre](evidencia/publicacion-0.3.0-2026-09-21.md)
- [Ensayo automatizado v2](evidencia/testnet-evidence-v2.json)
- [Ensayo manual v2](evidencia/testnet-evidence-v2-manual.json)
- [Persistencia del backend público](evidencia/public-backend-evidence.json)
- [Fixtures y replays](evidencia/fixtures/)
- [Capturas](evidencia/screenshots/)
- [Archivo audiovisual y huellas SHA-256](evidencia/media/README.md)
- [Demo final en YouTube](https://youtu.be/LECz_vXmFi0) · [copia MP4](evidencia/media/arenapay-demo-testnet-es.mp4) · [subtítulos](evidencia/media/arenapay-demo-testnet-es.srt)
- [Arquitectura y plataforma en YouTube](https://youtu.be/4uiet8NSKwo) · [copia MP4](evidencia/media/pitch-v2/arenapay-arquitectura-stellar-es.mp4) · [subtítulos](evidencia/media/pitch-v2/arenapay-pitch-v2-es.srt)
- [Diagrama estable en PNG](assets/arenapay-flujo-verificable.png) · [FigJam editable](https://www.figma.com/board/CgZaKh4wtUQk1PC4J7BfuX/ArenaPay-%E2%80%94-Flujo-verificable-en-Stellar-Testnet?node-id=9-86)
- [Vídeo histórico](evidencia/media/arenapay-demo.webm)

## Producto y evolución

- [Estado y límites del MVP](producto/estado-y-limites.md)
- [Próximos pasos](producto/proximos-pasos.md)
- [Roadmap posterior a la hackathon y financiación](producto/roadmap-post-hackathon.md)
- [Plan de motores: Hex, Connect Four, Damas chinas y Ajedrez](producto/plan-motores-hex-connect-four-damas-chinas-ajedrez.md)
- [Registro en Stellar Odyssey](producto/registro-stellar-odyssey.md)
- [Benchmarking](producto/benchmarking-arenapay-2026-09-12.md)
- [Entrega de benchmarking](producto/entrega-benchmarking.md)
- [Propuestas históricas](producto/propuestas/)

## Auditorías y checklists

- [Revisión integral posterior a la entrega](auditorias/revision-integral-2026-09-20.md)
- [Revisión del README](auditorias/revision-readme-2026-09-13.md)
- [Revisión profunda de documentación](auditorias/revision-documentacion-2026-09-14.md)
- [Revisión de SonarCloud](auditorias/revision-sonarcloud.md)
- [Checklist de documentación y arquitectura](checklists/documentacion.md)

## Referencia

- [API](referencia/api.md)
- [Licencia, copyright y opciones de protección](referencia/licencia-y-derechos.md)
- [Mantenimiento de la documentación](referencia/mantenimiento-documentacion.md)
- [Glosario](glosario/README.md)
- [Guía de contribución](../CONTRIBUTING.md)

## Regla de mantenimiento

Cuando se mueva, añada o retire un documento, debe actualizarse este índice. Los documentos históricos conservan las afirmaciones y rutas de su momento; el estado vigente se consulta en el README, el checklist y `producto/estado-y-limites.md`.
