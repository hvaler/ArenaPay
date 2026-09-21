# Configurar y publicar ArenaPay en Vercel

Estado actual: frontend operativo en <https://arenapay.vercel.app/>. Vercel sirve la SPA y reenvía `/api/*` al backend de Cloudflare.

## Responsabilidades

- Vercel publica los archivos de `public-operational/`.
- `vercel.json` define el reenvío al Worker cuando Vercel compila desde la raíz del repositorio.
- `config/vercel-operational.json` conserva la misma regla para la publicación directa del directorio compilado.
- Vercel no guarda las claves del administrador o árbitro.
- Cloudflare conserva la API, los secretos y las partidas.

## Configuración inicial

1. Crea o selecciona un proyecto llamado `arenapay` en Vercel.
2. En **Account Settings > Authentication**, conecta Google y GitHub como métodos de acceso a la misma cuenta. El perfil GitHub actual es `hvaler`; no documentes el correo de acceso ni otros datos personales.
3. Instala el GitHub App de Vercel para la cuenta `hvaler` y conecta `hvaler/ArenaPay` al proyecto. El repositorio privado `ArenaPay-Dev` no es el origen del despliegue público.
4. Configura la rama de producción `main`, el comando `npm run build:vercel` y el directorio de salida `public-operational`.
5. Inicia sesión desde la raíz del repositorio cuando necesites operar con la CLI:

   ```powershell
   npx vercel@59.16.0 login
   ```

6. Comprueba que `vercel.json` y `config/vercel-operational.json` apuntan al mismo Worker.
7. No añadas secretos Stellar al proyecto. La SPA solo necesita rutas públicas.
8. Configura `arenapay.vercel.app` o el dominio elegido como dominio de producción.
9. Incluye ese origen en `ARENAPAY_ALLOWED_ORIGINS` de Cloudflare.

La conexión Git quedó verificada el 14 de septiembre de 2026 con `hvaler/ArenaPay`, proveedor `github`, rama `main`, comando de compilación `npm run build:vercel` y salida `public-operational`.

## Compilar

```powershell
npm ci
npm run build:vercel
```

El script compila la edición operativa en `public-operational/` y copia allí la configuración para una publicación estática directa. En el despliegue normal desde la raíz, Vercel usa el `vercel.json` raíz y publica `public-operational/` como directorio de salida. La web utiliza `/api`; Vercel aplica el reenvío sin exponer la URL del backend como una variable de compilación.

## Publicar

Un `push` aprobado a `main` de `hvaler/ArenaPay` inicia el despliegue automático. El flujo entre el repositorio privado y el público se describe en [Desarrollo privado y publicación](../guias/flujo-desarrollo-y-publicacion.md).

Para una publicación manual o una recuperación controlada:

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
