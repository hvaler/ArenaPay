# Configurar y publicar ArenaPay en Vercel

Estado actual: frontend operativo en <https://arenapay.vercel.app/>. Vercel sirve la SPA y reenvía `/api/*` al backend de Cloudflare.

## Responsabilidades

- Vercel publica los archivos de `public-operational/`.
- `config/vercel-operational.json` define el reenvío al Worker.
- Vercel no guarda las claves del administrador o árbitro.
- Cloudflare conserva la API, los secretos y las partidas.

## Configuración inicial

1. Crea o selecciona un proyecto llamado `arenapay` en Vercel.
2. Inicia sesión desde la raíz del repositorio:

   ```powershell
   npx vercel@59.16.0 login
   ```

3. Comprueba que `config/vercel-operational.json` apunta al Worker correcto.
4. No añadas secretos Stellar al proyecto. La SPA solo necesita rutas públicas.
5. Configura `arenapay.vercel.app` o el dominio elegido como dominio de producción.
6. Incluye ese origen en `ARENAPAY_ALLOWED_ORIGINS` de Cloudflare.

## Compilar

```powershell
npm ci
npm run build:vercel
```

El script compila la edición operativa en `public-operational/` y copia allí `vercel.json`. La web utiliza `/api`; Vercel aplica el reenvío sin exponer la URL del backend como una variable de compilación.

## Publicar

```powershell
npm run deploy:vercel
```

El comando realiza la compilación y un despliegue de producción del directorio `public-operational/` en el proyecto `arenapay`.

## Validar después de publicar

- [ ] La portada abre por HTTPS.
- [ ] <https://arenapay.vercel.app/api/health> devuelve `status: ok`, `mode: public` y `persistence: durable-object`.
- [ ] `/api/testnet/config` devuelve `ready: true` y no contiene secretos.
- [ ] **Nueva partida en Testnet** muestra el panel de Freighter.
- [ ] La consola del navegador no muestra errores de CORS.
- [ ] `npm run test:operational` supera el escenario público cuando se autoriza ejecutarlo.

## Actualizar o revertir

Para actualizar, vuelve a ejecutar `npm run deploy:vercel`. Vercel conserva despliegues anteriores; si la validación falla, selecciona el último despliegue correcto desde el panel y restáuralo como producción. Revertir la web no revierte operaciones ya confirmadas en Stellar ni datos del Durable Object.

## Fallos habituales

| Síntoma | Comprobación |
|---|---|
| La portada carga, pero `/api` devuelve 404 | Falta o no se copió `vercel.json` |
| Error 502 o timeout | Revisar salud y registros del Worker |
| CORS bloqueado | Añadir el origen exacto de Vercel en Cloudflare |
| La web muestra demo sin wallet | Se publicó `public-demo/` en lugar de `public-operational/` |

