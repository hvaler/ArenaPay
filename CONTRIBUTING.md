# Contribuir y mantener ArenaPay

## Configuración local

Los registros se guardan en `data/matches/` y sobreviven al reinicio del motor. La pantalla permite cargar el último ensayo confirmado desde el panel Testnet. Los replays descargados también pueden importarse. `ARENAPAY_API_PORT` y `REPLAY_DIR` se leen del entorno del proceso. El motor carga `.env.testnet` cuando existe; `.env` no se carga automáticamente.

## Compilar y desplegar el contrato

Herramientas verificadas: Rust/Cargo 1.98.1, SDK Soroban 27.0.6 y Stellar CLI 28.0.0. Testnet anunció protocolo 28 en la comprobación previa al despliegue.

```sh
rustup target add wasm32v1-none
cargo test -p arena_escrow
stellar contract build --package arena_escrow --optimize=false
npm run deploy:testnet
npm run rehearse:testnet
```

En este equipo Windows, Visual Studio necesita cargar sus bibliotecas antes de compilar; se incluyen estos ayudantes:

```powershell
npm run test:contract
./src/scripts/build-contract.ps1
```

El despliegue inicial genera `.env.testnet` con claves desechables de administrador, árbitro y dos cuentas de ensayo; está excluido de Git y nunca se devuelve por API. Friendbot aporta únicamente XLM de Testnet. El contrato se inicializa atómicamente en el despliegue y rechaza otras redes. La configuración pública queda en `data/testnet/deployment.json`. No elimines esos archivos si quieres conservar el despliegue y las cuentas del ensayo. El script verifica y reutiliza el contrato si la configuración ya existe.


## Verificar el proyecto

```sh
npm test
npm run build
npm run test:e2e
```

El último comando utiliza Google Chrome instalado y arranca ambos servicios si hace falta. Para Microsoft Edge, configura `PLAYWRIGHT_CHANNEL=msedge`. Las pruebas locales no mueven fondos; el caso que abre el ensayo Testnet consulta la red y se omite si ese ensayo no está configurado. En CI instala el navegador correspondiente antes de ejecutar.

`npm run build` comprueba TypeScript y genera la web en `src/apps/web/dist/`. Ese directorio necesita un servidor y una ruta `/api` hacia el motor para crear partidas; no es una entrega desplegada.

Cada push a `main` y cada pull request ejecutan la [integración continua](.github/workflows/ci.yml): `cargo test`, la compilación WASM de release para `wasm32v1-none`, `npm test` y `npm run build`. Un cambio no se integra con la CI en rojo. Los escenarios de Playwright no forman parte de ella y se siguen ejecutando en local.

Las acciones de GitHub van fijadas por SHA de commit, con la versión en un comentario. No las cambies por una etiqueta: Dependabot propone cada mes el SHA nuevo, y basta con revisar y aceptar su pull request.

Validación del 14 de septiembre de 2026: 67 pruebas TypeScript, 16 pruebas Rust, 8 escenarios locales y 1 escenario de la edición pública superados; tipos, compilación web y empaquetado del Worker correctos. El ensayo real comprueba presupuesto excedido, financiación, replay, firma, pago exacto, doble liquidación rechazada y un único evento `settled`. Las capturas de navegador se guardan en `test-results/`.


## Documentación y publicación

Edita `docs/guias/runbook-pruebas-arenapay.md` y ejecuta `npm run docs:runbook`. Se generan el HTML y las copias en `src/apps/web/public`. Ejecuta `npm run build:public` para preparar la demo estática en `public-demo/`; no contiene el motor ni realiza nuevas operaciones Testnet.

La rama `main` contiene el código. La rama `gh-pages` publica la edición offline compilada. Vercel publica la edición operativa y reenvía `/api/*` al Worker de Cloudflare. No incluyas `data/`, `.env.testnet` ni credenciales en la publicación. Mantén el directorio de ejecución fuera de las carpetas servidas por Vite.

El trabajo mantenido por el titular se realiza en el repositorio privado `ArenaPay-Dev`; las versiones seleccionadas se preparan como commits independientes en el repositorio público `ArenaPay`. No fusiones sus historiales ni envíes la rama privada al remoto público. Sigue la [guía de desarrollo y publicación](docs/guias/flujo-desarrollo-y-publicacion.md).

Las futuras evidencias del ensayo v2 se guardan en archivos con sufijo `-v2`; los vectores v1 permanecen como regresiones históricas. Antes de cambiar el ejemplo visible, actualiza también las referencias de pruebas y documentación.

La estructura vigente y el índice documental se describen en [`docs/README.md`](docs/README.md). Todo el código y las pruebas del producto viven en `src/`; la raíz conserva configuración, metadatos y archivos estándar del repositorio.
