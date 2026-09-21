# Mantenimiento de la documentación

Esta guía evita que una decisión antigua se presente como estado actual y que un cambio de ruta rompa el material publicado.

## Tipos de documento

| Tipo | Regla de actualización |
|---|---|
| Vigente | Debe coincidir con `main`, las URL públicas y la última validación |
| ADR | Se conserva; una decisión nueva sustituye a la anterior mediante otro ADR |
| Auditoría | Conserva alcance, commit y fecha; las novedades se añaden en una sección posterior |
| Evidencia | No se reescribe para aparentar una ejecución nueva; se añade otro registro |
| Propuesta histórica | No se actualiza con la implementación; debe estar identificada como propuesta |

Son documentos vigentes el README, el índice de `docs/`, la visión general, las guías, despliegue, referencia, seguridad, estado y próximos pasos.

## Al cambiar código o estructura

1. Actualizar rutas en README, `docs/README.md`, guías, ADR y configuración de herramientas.
2. Regenerar el runbook con `npm run docs:runbook` si cambió su Markdown.
3. Comprobar enlaces locales, incluidas anclas.
4. Contrastar cifras de pruebas y versiones con la ejecución real.
5. Revisar que ninguna afirmación histórica se haya convertido accidentalmente en promesa vigente.
6. Comprobar que no se versionan secretos, datos privados pendientes ni resultados de compilación.

## Al publicar

Registrar fecha UTC, commit de `main`, commit de `gh-pages`, versión del Worker, despliegue de Vercel, URL y resultado de las pruebas públicas. Si solo se comprobó carga o configuración, no describirlo como partida pagada completa.

## Enlaces

- Usar rutas relativas para archivos del repositorio.
- Usar enlaces permanentes de GitHub cuando un runbook publicado deba funcionar fuera del repositorio.
- Evitar números de línea en documentos vigentes: cambian con facilidad.
- Para recibos, enlazar la transacción Testnet exacta y conservar también su hash como texto.

## Cifras y fechas

Las cifras antiguas permanecen dentro de auditorías fechadas. El README y el checklist deben mostrar la última suite completada. Una fecha de revisión indica cuándo se contrastó el documento; no implica que todos los servicios externos hayan sido auditados ese día.

## Seguridad editorial

Nunca copiar claves secretas, frases de recuperación, `.env.testnet`, `.dev.vars`, contenido privado del Durable Object ni semilla/nonce de una partida pendiente. Las direcciones públicas, IDs de contrato, hashes y recibos Testnet sí pueden formar parte de la evidencia.

## Checklist breve

- [ ] El documento indica si es vigente, histórico o futuro.
- [ ] Las rutas y anclas existen.
- [ ] Las cifras tienen fecha o ejecución asociada.
- [ ] Las funciones descritas existen en la edición indicada.
- [ ] Los límites y dependencias de confianza están expresados.
- [ ] No contiene secretos ni sugiere pegarlos en la aplicación.
- [ ] `docs/README.md` enlaza cualquier documento nuevo.
