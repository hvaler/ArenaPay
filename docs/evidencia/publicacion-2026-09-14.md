# Primera publicación consolidada — 14 de septiembre de 2026

Este registro identifica la creación del repositorio público limpio y la continuidad de sus despliegues. No representa una nueva partida pagada.

## Repositorios

| Destino | Estado |
|---|---|
| `hvaler/ArenaPay-Dev` | Privado; conserva el historial de desarrollo |
| `hvaler/ArenaPay` | Público; `main` contiene un único commit raíz de la primera versión consolidada |
| Rama `gh-pages` pública | Un único commit raíz de despliegue: `4102079` |
| Licencia pública | `AGPL-3.0-only`, con opción comercial mediante acuerdo escrito |

El repositorio público se generó como una instantánea de los archivos versionados. No contiene el historial Git del repositorio privado, claves de servicio, archivos `.env`, `.dev.vars`, almacenamiento del Worker ni datos locales de partidas.

## Despliegues

| Elemento | Identificador |
|---|---|
| Cloudflare Worker | `aebfb1c4-4d40-4a55-8726-254bba2426c6` |
| Vercel | `dpl_CvuFKdfK4DMbCC77S4wv9zuEvruQ` |
| Motor | `resource-arena/2.0.0` |

- <https://arenapay.vercel.app/>: HTTP 200.
- <https://arenapay.arenapay.workers.dev/>: HTTP 200.
- <https://arenapay.arenapay.workers.dev/api/health>: HTTP 200.
- <https://hvaler.github.io/ArenaPay/>: estado `built` y HTTP 200.

Vercel fue desplegado correctamente mediante CLI. La conexión automática entre el proyecto Vercel y el nuevo repositorio requiere añadir primero la conexión de inicio de sesión con GitHub en la cuenta de Vercel; esta asociación no afecta al despliegue activo.

## Validación asociada

- 67 pruebas TypeScript superadas.
- Compilación TypeScript y Vite superada.
- 8 escenarios locales de navegador superados.
- GitHub reconoció la licencia AGPL del repositorio.
- La aplicación publicada incluye un enlace visible al código fuente.
- El contrato Soroban y su despliegue no se modificaron.

El escenario de navegador y las comprobaciones públicas no crean depósitos ni mueven XLM de prueba. La evidencia de liquidaciones anteriores permanece en el [índice de evidencia](README.md).
