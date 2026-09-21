# Próximos pasos de ArenaPay

Fecha de corte: 20 de septiembre de 2026.

Este documento conserva el estado del proyecto después de publicar el backend persistente. Sirve como checklist operativo para terminar la demostración, comprobar la recuperación del servicio y preparar una futura etapa de producción.

## Estado confirmado

- [x] Frontend operativo publicado en <https://arenapay.vercel.app/>.
- [x] Backend público publicado como Cloudflare Worker con almacenamiento persistente mediante Durable Object y SQLite.
- [x] Demo estática publicada en <https://hvaler.github.io/ArenaPay/>.
- [x] Contrato Soroban conservado sin cambios: `CDHPEYP7KEYYO3D6G44PK22MUNKF4ZBFHLOM6DUL2NOUKXNNTO4R4RID`.
- [x] Secretos de administración, árbitro y limitación de tráfico guardados fuera del repositorio.
- [x] Persistencia comprobada creando una partida en Testnet y consultándola después de volver a desplegar el Worker.
- [x] Validación técnica completada: 68 pruebas TypeScript, 8 escenarios locales, 1 escenario offline público, escenarios operativos en Vercel y Cloudflare, compilaciones y 16 pruebas Rust.
- [x] Proyecto entregado en Stellar Odyssey Perú 2026 con repositorio, despliegue, evidencia Testnet v2, demo y pitch públicos.
- [x] Rama `main` limpia, confirmada y sincronizada con GitHub al cerrar esta entrega.

La evidencia técnica del backend se encuentra en [public-backend-evidence.json](../evidencia/public-backend-evidence.json), la publicación más reciente en [publicacion-2026-09-14.md](../evidencia/publicacion-2026-09-14.md) y su arquitectura y operación están explicadas en [Cloudflare](../despliegue/cloudflare.md).

## Checklist pendiente, en orden recomendado

### 1. Ensayo público completo con Freighter — completado

- [x] Abrir <https://arenapay.vercel.app/> en Chrome con Freighter conectado a Testnet.
- [x] Crear una partida nueva con las direcciones públicas de Atlas y Nova.
- [x] Autorizar presupuesto y depositar 1 XLM de prueba con Atlas.
- [x] Cambiar a Nova y repetir autorización y depósito.
- [x] Ejecutar la simulación.
- [x] Verificar el replay y la firma del árbitro.
- [x] Cobrar el premio con la cuenta correspondiente.
- [x] Comparar el hash del replay con el resultado guardado en el contrato.
- [x] Guardar identificadores, enlaces de Stellar Expert, capturas y resultado final.

**Qué demuestra:** que el recorrido público funciona de principio a fin con dos cuentas distintas operadas por una persona, firmas reales de wallet, backend persistente y liquidación en Soroban Testnet. No sustituye una prueba posterior con dos participantes independientes.

### 2. Ensayo de vencimiento y devolución

- [ ] Crear una partida de prueba destinada a no completarse.
- [ ] Documentar su ledger de vencimiento.
- [ ] Esperar a que venza sin liquidarla.
- [ ] Ejecutar la devolución con Freighter.
- [ ] Confirmar en Testnet que el contrato devolvió los fondos según sus reglas.
- [ ] Guardar las transacciones y el saldo antes y después.

**Qué demuestra:** que los participantes pueden recuperar los fondos cuando una partida no llega a completarse. Este recorrido cubre el principal camino alternativo al pago del premio.

### 3. Grabación final de la demostración

- [x] Preparar Chrome, Freighter, las dos cuentas y una partida nueva.
- [x] Grabar el recorrido operativo.
- [x] Mostrar las confirmaciones de Freighter sin revelar claves privadas ni frases de recuperación.
- [x] Mostrar el replay, el ganador, la liquidación y la transacción en Stellar Expert.
- [x] Añadir narración y subtítulos en español.
- [x] Publicar la [demo completa](https://youtu.be/LECz_vXmFi0) y archivarla en el [repositorio](../evidencia/media/README.md).
- [x] Publicar una [presentación independiente de arquitectura y plataforma](https://youtu.be/4uiet8NSKwo) de menos de tres minutos.

**Qué demuestra:** convierte la evidencia técnica en una demostración comprensible y revisable por terceros.

### 4. Simulacro de recuperación

- [ ] Exportar o respaldar los datos persistentes siguiendo el runbook.
- [ ] Simular una incidencia controlada en un entorno de ensayo.
- [ ] Restaurar el servicio y comprobar una partida conocida.
- [ ] Verificar que semilla, nonce, replay y estado del contrato siguen siendo coherentes.
- [ ] Registrar tiempos, responsables, comandos y resultado.

**Qué demuestra:** que la persistencia no depende solamente de que el servicio nunca falle y que existe un procedimiento verificable para recuperar la operación.

### 5. Monitorización y alertas

- [ ] Vigilar disponibilidad de `/api/health` y `/api/testnet/config`.
- [ ] Registrar errores del Worker y fallos de acceso a Stellar RPC.
- [ ] Crear alertas por tasa de error, caídas y consumo anómalo.
- [ ] Definir a quién se avisa y qué pasos debe seguir.
- [ ] Evitar que los registros contengan secretos, firmas sensibles o material privado.

**Qué aporta:** permite detectar problemas antes de que los usuarios encuentren una pantalla ambigua o una operación quede sin reconciliar.

### 6. Despliegues automatizados

- [ ] Configurar integración continua para ejecutar pruebas y compilación en cada cambio.
- [ ] Automatizar el despliegue del Worker y de Vercel solamente después de superar las validaciones.
- [ ] Mantener los secretos en los proveedores de despliegue.
- [ ] Añadir comprobaciones posteriores al despliegue y una ruta de reversión.
- [ ] Conservar GitHub Pages como demostración estática separada.

**Qué aporta:** reduce errores manuales y hace repetible la publicación de una versión conocida del frontend y el backend.

### 7. Preparación para fondos reales

- [ ] Resolver todos los criterios de [criterios-para-produccion.md](../seguridad/criterios-para-produccion.md).
- [ ] Obtener una auditoría independiente del contrato, backend y flujo de firmas.
- [ ] Definir gestión segura y rotación de las claves de administración y árbitro.
- [ ] Diseñar alta disponibilidad, copias de seguridad y recuperación probada.
- [ ] Revisar límites económicos, abuso, privacidad, cumplimiento y respuesta ante incidentes.
- [ ] Ejecutar una fase piloto con límites estrictos antes de considerar Mainnet.

**Qué significa:** el sistema actual es una demostración funcional en Testnet. El paso a fondos reales exige evidencias adicionales y una decisión explícita de riesgo.

## Próxima acción

La siguiente tarea útil es completar y documentar el **ensayo de vencimiento y devolución con Freighter**. Las firmas deben aprobarse en la extensión del usuario; ArenaPay solo necesita las direcciones públicas y nunca debe solicitar una clave secreta o frase de recuperación.

## Trabajo reservado para después de la hackathon

Estas tareas se documentan ahora para no perder la visión, pero no deben competir con el cierre y la estabilidad del MVP:

- [ ] Añadir enlaces compartibles para abrir una partida concreta desde dos dispositivos.
- [ ] Ejecutar un ensayo con dos propietarios independientes, cada uno con su wallet y equipo.
- [x] Crear una interfaz común y un registro de motores ([ADR-006](../adr/ADR-006-frontera-y-registro-de-motores.md)).
- [ ] Implementar Hex o Connect Four como segundo juego.
- [ ] Diseñar un SDK y un sandbox para agentes aportados por terceros.
- [ ] Incorporar salas y movimientos de jugadores humanos por turnos.
- [ ] Evaluar ajedrez después de resolver reloj, reconexión, abandono y tablas.
- [ ] Realizar pilotos y recopilar métricas de uso, repetición y coste.
- [ ] Preparar solicitudes de grants, patrocinios o inversión vinculadas a hitos verificables.

La planificación completa se encuentra en [Hoja de ruta de ArenaPay después de la hackathon](roadmap-post-hackathon.md). El análisis técnico y el catálogo de juegos están en [Reutilizar ArenaPay en otros juegos y con jugadores humanos](../arquitectura/reutilizacion-juegos-y-jugadores.md).
