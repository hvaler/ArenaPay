# Revisión de SonarCloud

Consulta: 13 de septiembre de 2026. Proyecto confirmado por el conector: hvaler_ArenaPay, rama main. [Panel](https://sonarcloud.io/dashboard?id=hvaler_ArenaPay&branch=main). Alcance inicial: siete incidencias OPEN/CONFIRMED y cuatro archivos con duplicaciones. Durante el diagnóstico no se alteraron estados de incidencias; la remediación posterior cambió código y exclusiones de duplicación, pero no el contrato.

## Resultado inicial del control de calidad

Gate ERROR: fiabilidad C y seguridad C, ambas requieren A; duplicación en código nuevo 40,6 %, máximo 3 %. Mantenibilidad A y hotspots revisados 100 % pasan. La duplicación global es 17,5 %: es una métrica diferente a la de código nuevo.

El resultado del análisis estático no equivale a siete vulnerabilidades explotables. Se contrastó cada aviso con el contexto del archivo.

## Clasificación completa

| Clave / regla | Ubicación | Comprobación e impacto | Decisión |
|---|---|---|---|
| AaCXOnI5k0u9GTZlV9RF / S8707 | src/scripts/verify-testnet-events.ts:8 | El argumento CLI llega directamente a readFile. Una ruta absoluta o con .. permite leer un archivo accesible fuera de docs. JSON.parse y los campos posteriores limitan qué entrada puede completar el flujo. No se encontró un endpoint remoto que invoque este script. | Hallazgo de frontera de archivos válido en herramienta local. Proponer selector v1/v2 o directorio permitido con comprobación de ruta real, incluidos enlaces simbólicos. Pendiente. |
| AaCXOnI5k0u9GTZlV9RG / S8707 | src/scripts/verify-testnet-events.ts:19 | La misma ruta llega a writeFile después de verificar transacción/evento. Puede sobrescribir un JSON de evidencia válido fuera del directorio esperado con los permisos del proceso. No significa escritura arbitraria incondicional: exige superar consultas y asserts. | Restringir entrada y destino; separar lectura de actualización con salida explícita. No ejecutar una prueba destructiva sobre archivos ajenos. Pendiente. |
| AaCXKOJluNydAlqVvgYF / S9011 | src/apps/web/src/components/TestnetPanel.tsx:85 | El botón está dentro del formulario y debe enviarlo. Su comportamiento por defecto coincide con la intención actual. | Añadir type="submit" para expresar la intención; no cambiarlo a button sin sustituir el envío. Claridad preventiva, no fallo observado. Pendiente. |
| AaCXKOMquNydAlqVvgYG / S8786 | src/scripts/build-runbook.mjs:5 | El patrón de enlaces acepta nuevos "[" dentro de una etiqueta y reintenta ante entradas sin cierre. Prueba local con "[" repetido: 2.000 ≈0,89 ms; 4.000 ≈3,94 ms; 8.000 ≈15,10 ms. Indica crecimiento superlineal en esa entrada, no un benchmark general. El origen es un MD local, no una API pública. | Sustituir por análisis lineal o acotar entrada y probar casos malformados; conservar salida HTML del runbook. Pendiente. |
| AaCWFKSqHe7829VWFXfW / S2871 | src/packages/shared/src/hash.ts:8 | sort() ordena ordinalmente, tal como exige el protocolo. En Node, a,z,ä conserva ese orden ordinal; localeCompare con en produce a,ä,z. Cambiarlo alteraría el JSON canónico y potencialmente firmas/hashes. | No aplicar la sugerencia de localeCompare. Conservar semántica; proponer comparador ordinal explícito y vector con claves no ASCII. Justificar el aviso en Sonar tras revisión, no silenciarlo automáticamente. |
| AaCWFKUfHe7829VWFXfX / S7773 | src/packages/shared/src/stellar.ts:13 | parseInt sobre pares hexadecimales; el aviso pide usar Number.parseInt. | Mejora de estilo de bajo impacto; no se identificó cambio funcional necesario. Pendiente. |
| AaCWFKUoHe7829VWFXfY / S7773 | src/scripts/deploy-testnet.ts:38 | Misma preferencia de nombres al convertir bytes. | Mejora de estilo de bajo impacto. Pendiente; no requiere desplegar otro contrato. |

Ubicaciones referidas al árbol revisado antes de cambios documentales. Los dos flujos de ruta se comprobaron por trazado de código, sin intentar leer secretos ni sobrescribir archivos externos.

## Duplicación: causa comprobada

| Archivos | Medida observada | Tratamiento propuesto |
|---|---|---|
| docs/guias/runbook-pruebas-arenapay.html y src/apps/web/public/runbook-pruebas-arenapay.html | 136 líneas duplicadas en cada archivo; 100 % | Son salidas del mismo generador. Mantener MD como fuente única; estudiar exclusión únicamente de duplicación para esos artefactos, documentando regeneración. No excluir todo docs ni seguridad. |
| src/packages/shared/src/simulation-v1.ts y simulation.ts | 67 líneas en cada uno; tres bloques | v1: líneas 15/30/79, tamaños 14/35/18; v2: 17/32/87. Mantener aislamiento del verificador histórico. Una extracción compartida podría cambiar v1 sin querer; exigir vectores históricos si se aborda. |

Son 406 líneas contabilizadas entre cuatro archivos, no 406 líneas únicas que necesariamente puedan eliminarse. El aislamiento histórico es una decisión de compatibilidad, no prueba de que cualquier duplicación futura sea aceptable.

## Checklist de remediación separado

- [x] Restringir el verificador a v1/v2, hacerlo de solo lectura por defecto y exigir --update para escribir. Rechaza argumentos de ruta y comprueba redirecciones del archivo seleccionado.
- [x] Explicitar type="submit" en el formulario y comprobar su envío en navegador.
- [x] Sustituir el patrón superlineal por un recorrido lineal y regenerar el HTML sin diferencias.
- [x] Preservar orden ordinal con comparador explícito y vector de claves no ASCII.
- [x] Aplicar las dos mejoras Number.parseInt.
- [x] Excluir solo los dos HTML generados y el motor v1 congelado de la detección de duplicación mediante .sonarcloud.properties. Siguen dentro del análisis de incidencias.
- [x] Ejecutar 63 pruebas TypeScript, compilación, 8 escenarios de navegador, 16 pruebas Rust y verificar en Testnet los eventos v1/v2.
- [x] Consultar el nuevo análisis Cloud después de publicar el commit 9f68173.
- [x] Registrar qué condiciones del gate quedan realmente resueltas.

## Estado de la implementación local

La remediación local está completa. Se añadieron cuatro pruebas: límites de argumentos, actualización explícita, marcado inline y una entrada malformada de 50.000 caracteres. Windows sin privilegio de creación de enlaces omite solamente la construcción del enlace simbólico; la selección literal y el rechazo de rutas se prueban siempre.

El primer recorrido completo de navegador expuso una carrera de su propia prueba: la actualización automática consumía el error simulado antes del clic manual. Se sincronizó la expectativa con esa actualización y los ocho escenarios pasaron después. El contrato no cambió; las advertencias de eventos obsoletos de Rust permanecen por la decisión expresa de conservarlo.

## Resultado posterior a la remediación

SonarCloud terminó el análisis del commit `9f68173` con **gate OK**: seguridad A, fiabilidad A, mantenibilidad A, hotspots revisados 100 % y duplicación en código nuevo 0,0 %. La consulta de incidencias OPEN/CONFIRMED devolvió cero y la búsqueda de archivos duplicados devolvió cero.

La comprobación de GitHub terminó con éxito y comunicó cero incidencias nuevas. Este cierre se refiere al análisis estático y a sus condiciones configuradas; no convierte el MVP Testnet en un sistema aprobado para fondos reales.
