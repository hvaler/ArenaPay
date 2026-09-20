# Desarrollo privado y publicación de ArenaPay

Esta guía define dónde se trabaja y cómo se prepara una versión pública sin exponer el historial privado ni depender de comandos recordados de memoria.

## Qué repositorio se utiliza

| Repositorio o carpeta | Función | Trabajo habitual |
|---|---|---|
| `C:\nexus\dev\ArenaPay` | Clon privado de `hvaler/ArenaPay-Dev` | Código, pruebas, documentación y preparación de versiones |
| `C:\nexus\dev\ArenaPay-Public-Seed` | Clon público de `hvaler/ArenaPay` | Revisar y publicar una instantánea aprobada |
| `hvaler/ArenaPay` | Producto público | Versiones que pueden leer, clonar y desplegar terceros |
| rama `gh-pages` | Demo offline | Archivos compilados para GitHub Pages |

`ArenaPay-Dev` es la fuente de trabajo. `ArenaPay` contiene versiones públicas seleccionadas. Los dos repositorios tienen historiales distintos y no deben fusionarse.

## Flujo diario

1. Trabajar en `C:\nexus\dev\ArenaPay`.
2. Crear una rama corta cuando el cambio lo justifique, por ejemplo `feature/nuevo-juego` o `docs/guia-integracion`.
3. Implementar código y documentación juntos.
4. Ejecutar las comprobaciones adecuadas.
5. Revisar el diff, crear el commit y enviarlo a `origin`, que es `ArenaPay-Dev`.
6. Integrar en `main` privado cuando el cambio esté listo.

Los cambios privados no actualizan Vercel ni el repositorio público. Esto permite desarrollar varios commits y corregirlos antes de presentar una versión estable.

## Preparar una versión pública

La raíz privada tiene estos remotos:

```text
origin  https://github.com/hvaler/ArenaPay-Dev.git
public  https://github.com/hvaler/ArenaPay.git
```

El remoto `public` sirve para consultar y contrastar. No se debe ejecutar `git push public main` desde el repositorio privado: ese comando publicaría también su historial.

Con `main` privado limpio y probado, muestra primero el plan:

```powershell
node src/scripts/prepare-public-release.mjs
```

El script verifica repositorios, ramas, limpieza, sincronización con GitHub y patrones de claves privadas. Después enumera los archivos que cambiarían. Para preparar el clon público:

```powershell
node src/scripts/prepare-public-release.mjs --apply
```

Este segundo comando copia únicamente archivos versionados y deja los cambios sin commit en `ArenaPay-Public-Seed`. Nunca crea commits ni hace `push`.

## Checklist antes del push público

- [ ] `main` de `ArenaPay-Dev` está limpio y sincronizado con `origin/main`.
- [ ] La versión, el changelog y la documentación describen el resultado real.
- [ ] Las pruebas TypeScript, Rust y de navegador necesarias han pasado.
- [ ] El script de preparación no detecta claves, semillas secretas ni archivos reservados.
- [ ] Se revisaron `git diff --stat` y `git diff` dentro de `ArenaPay-Public-Seed`.
- [ ] El diff no contiene notas internas, datos personales innecesarios, `.env`, `.dev.vars` ni credenciales.
- [ ] El commit público resume una versión coherente, sin copiar el historial privado.
- [ ] El titular autorizó el `push` público y la creación de la versión o etiqueta.

Después de la autorización, el commit y el `push` se realizan desde `ArenaPay-Public-Seed`. Vercel observa `hvaler/ArenaPay` y despliega `main` con `npm run build:vercel`; el resultado debe aparecer en <https://arenapay.vercel.app/>.

GitHub Pages y Cloudflare tienen ciclos propios. La edición offline se compila y publica en `gh-pages`; el Worker se despliega de forma explícita cuando cambia el backend. Una publicación de Vercel no sustituye esas dos verificaciones.

## Skill de Codex

La skill `$arenapay-release` aplica este flujo. No es necesario conocer el número de versión. El uso habitual es:

```text
Usa $arenapay-release para preparar la próxima versión de ArenaPay.
```

La skill consulta la última etiqueta pública, compara los cambios y propone el número antes de modificarlo. También se puede indicar una versión concreta cuando ya se haya acordado, por ejemplo `0.2.0`.

ArenaPay sigue esta regla mientras sea anterior a `1.0.0`:

| Cambio publicado | Incremento habitual | Ejemplo desde `0.1.0` |
|---|---|---|
| Corrección compatible o ajuste documental que merece versión | parche | `0.1.1` |
| Funcionalidad nueva compatible | menor | `0.2.0` |
| Cambio incompatible durante el MVP | menor, explicado expresamente | `0.2.0` |
| Primera versión declarada estable para producción | mayor | `1.0.0` |

No todo commit privado necesita una versión pública. La skill puede recomendar acumular cambios si todavía no forman una entrega coherente. La versión propuesta se confirma junto con el diff antes de actualizar archivos, crear la etiqueta o publicar.

La skill prepara, compara y valida. Si no existe autorización previa para publicar, se detiene justo antes del commit público, el `push`, la etiqueta y los despliegues externos.

## Recuperación

Si la preparación no es correcta, descarta únicamente los cambios no confirmados del clon `ArenaPay-Public-Seed` después de revisar su ruta. El repositorio privado no se modifica durante la copia. Si un despliegue público falla, conserva el commit para diagnóstico y usa el mecanismo de restauración del proveedor descrito en las guías de [Vercel](../despliegue/vercel.md), [GitHub Pages](../despliegue/github-pages.md) y [Cloudflare](../despliegue/cloudflare.md).
