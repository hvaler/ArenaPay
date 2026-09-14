# Configurar y publicar la demo en GitHub Pages

Estado actual: demo offline en <https://hvaler.github.io/ArenaPay/> mediante la rama `gh-pages`.

## Alcance

GitHub Pages solo sirve archivos estáticos. Esta edición permite práctica local, importación de replay y consulta de evidencia publicada. No contiene secretos, backend, Freighter ni creación de partidas Testnet.

## Configuración inicial del repositorio

1. Abre **Settings → Pages** en GitHub.
2. Selecciona **Deploy from a branch**.
3. Elige la rama `gh-pages` y la carpeta `/ (root)`.
4. Guarda y espera a que GitHub publique la URL.
5. Conserva `.nojekyll` en la raíz de la rama para servir los activos compilados sin procesamiento Jekyll.

## Preparar un worktree de publicación

Desde la raíz de ArenaPay:

```powershell
git fetch origin gh-pages
git worktree add .publish/arenapay gh-pages
```

La carpeta `.publish/` está ignorada por la rama principal. El worktree mantiene la publicación separada del código fuente.

## Compilar la demo offline

```powershell
npm ci
npm run docs:runbook
npm run build:public
```

El resultado queda en `public-demo/`. Antes de copiarlo, confirma que no contiene `.env`, `.dev.vars`, `data/` ni cadenas secretas de Stellar.

## Publicar una actualización

1. Copia el contenido generado de `public-demo/` a `.publish/arenapay/`, sustituyendo los archivos públicos anteriores.
2. Desde la raíz, revisa y publica:

   ```powershell
   git -C .publish/arenapay status --short
   git -C .publish/arenapay add -A
   git -C .publish/arenapay commit -m "deploy: refresh offline demo"
   git -C .publish/arenapay push origin gh-pages
   ```

3. Espera a que GitHub Pages termine la publicación.

No copies la carpeta `.git` ni la elimines. Si el worktree ya existe, no vuelvas a ejecutar `git worktree add`.

## Validar

```powershell
$env:PUBLIC_DEMO_URL='https://hvaler.github.io/ArenaPay/'
npm run build:public
npx playwright test --config playwright.public.config.ts
```

Además, comprueba manualmente:

- [ ] La práctica crea y ejecuta una partida.
- [ ] La página no solicita Freighter.
- [ ] No se realizan peticiones a `/api`.
- [ ] El runbook HTML y Markdown se descargan.
- [ ] Los enlaces y activos funcionan bajo `/ArenaPay/`.

## Recuperación

La rama `gh-pages` conserva su historial. Si una publicación falla, revierte el commit de despliegue en esa rama y vuelve a enviarla. Esta acción solo cambia la demo estática; no afecta al backend, Vercel o Stellar.

