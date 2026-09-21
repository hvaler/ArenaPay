# ADR-005: Estructura `src/` y documentación agrupada

## Estado

Aceptada el 14 de septiembre de 2026.

## Contexto

El código estaba repartido entre seis carpetas de nivel superior y la documentación compartía una única carpeta con guías, análisis, auditorías y evidencias. Esto dificultaba localizar responsabilidades y mantener enlaces.

## Decisión

Agrupar aplicaciones, paquetes, servicios, contrato, scripts y pruebas bajo `src/`. Organizar `docs/` por arquitectura, ADR, auditorías, checklists, despliegue, evidencia, glosario, guías, producto, referencia y seguridad. Mantener en la raíz únicamente archivos estándar del repositorio y configuración de herramientas.

## Consecuencias

- La raíz muestra con claridad producto, configuración, documentación y código.
- Las herramientas necesitan rutas actualizadas.
- Cada documento debe incluirse en `docs/README.md`.
- Los artefactos generados y secretos continúan fuera de Git.

## Referencias

- [Índice de documentación](../README.md)
- [Guía de contribución](../../CONTRIBUTING.md)
