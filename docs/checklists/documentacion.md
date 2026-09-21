# Checklist de arquitectura y documentación

Fecha: 13 de septiembre de 2026. Alcance: documentar y contrastar el MVP Testnet; conservar el contrato y la evidencia histórica.

- [x] Revisar los siete hallazgos abiertos y cuatro archivos duplicados: [SonarCloud](../auditorias/revision-sonarcloud.md).
- [x] Explicar [garantías y dependencias de confianza](../seguridad/garantias-y-confianza.md).
- [x] Documentar [amenazas y riesgos residuales](../seguridad/modelo-de-amenazas.md).
- [x] Vincular [invariantes del escrow](../seguridad/invariantes-del-escrow.md) con las 16 pruebas Rust.
- [x] Preparar procedimientos de [operación y recuperación](../guias/operacion-y-recuperacion.md).
- [x] Documentar [protocolo y versionado](../arquitectura/protocolo-y-versionado.md).
- [x] Definir [criterios verificables para producción](../seguridad/criterios-para-produccion.md).
- [x] Indexar [evidencia por versión y tipo de ensayo](../evidencia/README.md).
- [x] Integrar garantías y referencias esenciales en el [README](../../README.md).
- [x] Validar 82 enlaces locales en 10 documentos, sin destinos ausentes, y correspondencia con los 16 nombres de pruebas Rust.

Completar una revisión documental no equivale a corregir todos los riesgos identificados ni a aprobar producción. Los pendientes técnicos se mantendrán separados.

## Validación y decisiones de esta entrega

Cambios únicamente documentales: nueve documentos nuevos y ampliación del README. Se contrastaron fuentes, fixtures, pruebas existentes y resultados actuales del conector SonarCloud. Se reprodujo localmente el crecimiento del patrón del generador y la diferencia entre orden ordinal y orden por idioma. La revisión de espacios de Git no encontró errores.

No se repitió la suite funcional porque no se modificaron fuentes, reglas, dependencias ni configuración. El resultado previo de 59 TS, 16 Rust y 8 navegador permanece identificado como anterior en el [registro de revisión](../auditorias/revision-readme-2026-09-13.md).

El contrato y los replays históricos se conservan intactos. Los dos borradores del usuario se
integraron en el README y se retiraron después de la fusión. Los documentos se integran en el
repositorio; no se ha desplegado una nueva interfaz web ni convertido estas nuevas guías a HTML en
esta entrega. El runbook MD/HTML ya existente conserva su publicación.

## Revisión de plataforma, despliegue y README

- [x] Actualizar el README a 64 pruebas TypeScript y enlazar el ensayo manual v2 sin mezclarlo con el automatizado.
- [x] Sustituir la promesa de replay inmutable por replay verificable.
- [x] Separar contrato agnóstico, esquema específico y registro de motores en el análisis de reutilización.
- [x] Documentar que un SHA-256 hexadecimal cabe en `engine_version` sin cambiar el contrato.
- [x] Corregir el límite temporal actual de Vercel y mantener la persistencia como bloqueo principal.
- [x] Exigir un descriptor de despliegue saneado y mantener fuera de Git las URL de RPC con credenciales.
- [x] Añadir la receta de Cloudflare Tunnel para PowerShell y conservar un único hostname autorizado.
- [x] Sincronizar con el reloj del navegador el escenario de fallo RPC que era inestable.
- [x] Validar 64 pruebas TypeScript, compilación, 8 escenarios de navegador y 16 pruebas Rust.

## Backend público persistente — 13 de septiembre de 2026

- [x] Separar la práctica local de las llamadas Testnet para que la práctica pública no escriba en el servidor.
- [x] Implementar un Worker con un único Durable Object y almacenamiento SQLite persistente.
- [x] Guardar admin, árbitro y sal del limitador como secretos de Cloudflare.
- [x] Mantener semilla y nonce ocultos hasta que exista el replay.
- [x] Bloquear rutas de práctica, restringir orígenes y aplicar límites de tráfico y tope diario.
- [x] Publicar la edición operativa en Cloudflare y conectar Vercel mediante `/api/*`.
- [x] Crear una partida Testnet, redesplegar y confirmar que sobrevivió sin revelar secretos.
- [x] Validar 67 pruebas TypeScript, compilación, 8 escenarios locales, 1 escenario público y 16 pruebas Rust.
- [x] Documentar arquitectura, despliegue, recuperación y evidencia pública.

## Reorganización y presentación — 14 de septiembre de 2026

- [x] Presentar ArenaPay como plataforma y añadir un resumen de proyecto comprensible.
- [x] Agrupar la documentación por arquitectura, ADR, auditorías, despliegue, evidencia, guías, glosario, producto, referencia y seguridad.
- [x] Crear un índice central en [`docs/README.md`](../README.md) y reparar todos los enlaces locales.
- [x] Mover el código, las pruebas, el contrato y los scripts de producto bajo `src/`.
- [x] Documentar desde cero Cloudflare, Vercel y GitHub Pages.
- [x] Explicar los modos offline, local, documental, operativo, con dos navegadores y automatizado.
- [x] Conservar sin cambios la implementación de `arena_escrow`; solo se actualizó la ruta de un fixture de prueba.
- [x] Validar 67 pruebas TypeScript, 16 Rust, 8 escenarios locales, 1 escenario público, tres compilaciones web y el empaquetado del Worker.

## Revisión documental profunda — 14 de septiembre de 2026

- [x] Contrastar las descripciones vigentes con rutas, endpoints, esquemas, límites y configuración reales.
- [x] Sustituir el plan antiguo de despliegue por la arquitectura efectivamente publicada.
- [x] Corregir el modelo de amenazas para incluir el Worker público y sus controles actuales.
- [x] Corregir la descripción de `test:operational`: valida configuración y práctica, sin crear pagos.
- [x] Añadir una visión general vigente con componentes, secuencia, estados y límites.
- [x] Ampliar la referencia de API con perfiles, cuerpos, códigos, seguridad y política RPC.
- [x] Añadir reglas de mantenimiento para documentos vigentes, ADR, auditorías y evidencias históricas.
- [x] Registrar commits y versiones de la publicación del 14 de septiembre sin presentarla como pago.
- [x] Actualizar índices, estado, próximos pasos y referencias cruzadas.
- [x] Validar enlaces y anclas en 52 documentos, 67 pruebas TypeScript, compilación, Wrangler y 8 escenarios locales.

## Presentación final — 20 de septiembre de 2026

- [x] Archivar la demo completa y sus subtítulos en `docs/evidencia/media/`.
- [x] Publicar y enlazar la [demo completa](https://youtu.be/LECz_vXmFi0).
- [x] Archivar el pitch, sus subtítulos y su miniatura.
- [x] Publicar y enlazar la [presentación de arquitectura](https://youtu.be/4uiet8NSKwo), con duración inferior a tres minutos; conservar la primera versión como material histórico.
- [x] Conservar el diagrama profesional como [PNG](../assets/arenapay-flujo-verificable.png), [documento de arquitectura](../arquitectura/flujo-checkpoint-stellar-odyssey.md) y [FigJam editable](https://www.figma.com/board/CgZaKh4wtUQk1PC4J7BfuX/ArenaPay-%E2%80%94-Flujo-verificable-en-Stellar-Testnet?node-id=9-86).
- [x] Registrar las huellas SHA-256 y distinguir los entregables finales del vídeo histórico.
- [x] Referenciar los entregables desde README, índices, guías, estado del MVP y registro de candidatura.
- [x] Enviar el checkpoint y la entrega final de Stellar Odyssey Perú 2026, y archivar su [confirmación](../evidencia/entrega-stellar-odyssey-2026-09-20.md).

## Pendientes técnicos y de ensayo

El orden y el significado de las tareas restantes se mantienen en [Próximos pasos de ArenaPay](../producto/proximos-pasos.md).

- [x] Implementar y validar localmente las remediaciones del [checklist de SonarCloud](../auditorias/revision-sonarcloud.md#checklist-de-remediación-separado): 63 TS, compilación, 8 navegador, 16 Rust y eventos v1/v2.
- [x] Confirmar el análisis de SonarCloud del commit 9f68173: gate OK, calificaciones A, cero incidencias abiertas y 0,0 % de duplicación.
- [x] Reconciliar una respuesta de envío perdida por el hash calculado, sin reenvío, con pruebas de éxito posterior y 45 consultas sin confirmación.
- [x] Completar el ensayo manual v2 con dos cuentas Freighter, seis recibos y comparación final contra el contrato.
- [x] Grabar, editar, subtitular y publicar la demo final del recorrido Testnet.
- [ ] Completar una devolución por vencimiento con Freighter.
- [ ] Ensayar restauración de datos, archivado y pérdida controlada de respuesta en Testnet; la simulación unitaria del último caso ya está completada.
- [ ] Resolver los criterios de producción antes de cualquier uso con fondos reales.

## Presentación y derechos — 14 de septiembre de 2026

- [x] Centrar la cabecera del README y reutilizar el símbolo vectorial de ArenaPay.
- [x] Añadir badges de versiones, red, pruebas, issues, actividad y licencia con datos reales.
- [x] Identificar a Hugo Carlos Valer Rojas como titular del copyright y en los metadatos del paquete.
- [x] Revisar el alcance de MIT y documentar MIT, AGPL, licencia propietaria y licencia dual.
- [x] Adoptar AGPL-3.0-only con opción de licencia comercial para la primera publicación consolidada.
- [ ] Definir un acuerdo de contribución antes de aceptar aportes externos importantes.

## Flujo privado y publicación — 14 de septiembre de 2026

- [x] Mantener `ArenaPay-Dev` como repositorio privado de trabajo y `ArenaPay` como repositorio público de versiones.
- [x] Conectar el acceso GitHub `hvaler` a la cuenta Vercel del titular sin publicar su correo de acceso.
- [x] Conectar `hvaler/ArenaPay`, rama `main`, al proyecto Vercel `arenapay`.
- [x] Configurar la compilación automática con `npm run build:vercel` y salida `public-operational`.
- [x] Documentar un proceso que no mezcle ni exponga el historial privado.
- [x] Añadir una preparación reproducible que revisa repositorios, estado y patrones de secretos sin hacer commit ni push.
- [x] Crear la skill `$arenapay-release` para aplicar el proceso en sesiones posteriores.

## Visión posterior a la hackathon

- [x] Documentar qué componentes se reutilizan al incorporar otro juego.
- [x] Aclarar la diferencia entre propietarios de agentes y jugadores humanos.
- [x] Describir el ensayo posible con dos navegadores u ordenadores y su límite actual de “última partida”.
- [x] Comparar juegos candidatos, incluidos ajedrez y damas chinas.
- [x] Separar el trabajo futuro del alcance demostrado por el MVP.
- [x] Crear una hoja de ruta por fases con criterios de salida.
- [x] Registrar opciones de financiación no dilutiva, pilotos e inversión sin afirmar convocatorias vigentes.
- [ ] Revisar y priorizar la hoja de ruta con los comentarios recibidos al terminar la hackathon.
