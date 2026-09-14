# Configuración local de ArenaPay

## Requisitos

- Node.js 22.12 o posterior.
- npm.
- Google Chrome o Microsoft Edge para los ensayos con Freighter.
- Rust, el objetivo `wasm32v1-none`, Stellar CLI y herramientas C++ de Visual Studio únicamente para compilar o probar el contrato en Windows.

## Instalar y arrancar

```powershell
git clone https://github.com/hvaler/ArenaPay.git
Set-Location ArenaPay
npm ci
npm run dev
```

La web queda en <http://127.0.0.1:5173> y el motor local en <http://127.0.0.1:4317/api/health>.

## Archivos locales sensibles

- `.env.testnet`: claves desechables de servicio y ensayo para Testnet.
- `.dev.vars`: secretos utilizados por Wrangler en desarrollo local.
- `data/`: despliegue local y partidas del motor Node.

Los tres están excluidos de Git. No copies sus valores al README, incidencias, capturas o mensajes.

## Preparar Testnet local

```powershell
npm run deploy:testnet
npm run rehearse:testnet
```

El primer comando crea claves desechables si no existen, solicita XLM de prueba y despliega o verifica el contrato. El segundo ejecuta un ensayo automatizado y actualiza la evidencia v2. No ejecutes ninguno si solo quieres usar la práctica local.

## Verificar

```powershell
npm test
npm run build
npm run test:e2e
npm run test:contract
```

En Windows también están disponibles `src/scripts/cargo.ps1` y `src/scripts/build-contract.ps1` para cargar las herramientas de Visual Studio antes de invocar Cargo o Stellar CLI.

## Detener

Pulsa `Ctrl+C` en la terminal que ejecuta `npm run dev`. Las partidas locales guardadas en `data/matches/` permanecen para el siguiente arranque.

