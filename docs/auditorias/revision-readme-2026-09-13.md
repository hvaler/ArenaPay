# Revisión del repositorio y del README — 13 de septiembre de 2026

Este documento conserva la revisión inicial del commit `d7d542b` y registra al final las
verificaciones posteriores. Las cifras de cada bloque corresponden al momento indicado.

Se revisó el commit `d7d542b`: añade la evidencia automatizada v2 y MIT, cambia el ejemplo de la interfaz y permite seleccionar la evidencia en el comprobador de eventos. No modifica el contrato. El replay histórico v1 sigue conservado para regresiones.

Se encontró un escenario de navegador que todavía esperaba el recibo v1; se actualizó su fixture y la transacción esperada a v2. Los borradores de entrada `README-propuesta.md` y `encargo-readme.md` se fusionaron en el README el 13 de septiembre y se retiraron del repositorio: eran material de trabajo, no documentación.

## Cambios documentales

- README orientado al jurado siguiendo el orden solicitado: producto, evidencia, arquitectura, inicio, Freighter, pruebas, seguridad, alcance, límites, estructura, documentación y licencia.
- Referencia trasladada a `motor-v1-reglas.md`, `formato-evidencia.md` y `api.md`; mantenimiento y compilación a `../CONTRIBUTING.md`.
- `motor-v2.md` incorpora la explicación aportada, corrigiendo la afirmación no medida de enumeración «en milisegundos» y precisando la colisión con un agente bloqueado.
- El contrato autoriza a un participante a cancelar; no a cualquier tercero. La devolución depende de que el estado sea accesible y la red permita operar. El árbitro no necesita una cuenta financiada, pero no se afirma que su clave pública carezca de cuenta por definición.
- El ensayo Freighter v1 fue ejecutado por el usuario con dos cuentas; no se presenta como ensayo de dos personas ni como prueba manual v2. El ensayo v2 es automatizado.
- No se afirma que los replays sean inmutables ni que la firma demuestre la honestidad del árbitro. El contrato verifica la firma, no la simulación.

## Verificación realizada

- `npm test`: 59/59 pruebas TypeScript.
- `npm run build`: tipos y compilación correctos.
- `npm run test:e2e`: 8/8 escenarios, incluida lectura de Testnet y comprobación contra el contrato.
- `./src/scripts/cargo.ps1 -CargoArguments @('test','-p','arena_escrow')`: 16/16 pruebas Rust. Persisten advertencias sobre la API de publicación de eventos obsoleta; no se cambia el contrato para silenciarlas.
- Horizon confirmó la liquidación `deaa8c4292c7c9f55ab9d07b0ab5ec6abbde16af9e142aacb1cd169fd115989a`: exitosa, ledger 4643946, procesada el 12-sep-2026 a las 20:01:57 UTC.
- El WASM y el recibo de despliegue de la tabla se contrastaron con los metadatos públicos del despliegue local reutilizado. La captura `screenshots/evidencia-v2.png` procede del escenario de navegador contra la cadena de esta revisión.
- Revisión del árbol versionado: 82 rutas enumeradas; sin coincidencias de claves secretas Stellar, cabeceras de claves privadas ni los patrones de tokens comprobados en los archivos de texto revisados. No es una auditoría exhaustiva de credenciales ni del historial Git. Se revisó también que Freighter devuelve XDR firmado y no entrega la clave del usuario; el servicio sí conserva sus propias claves locales fuera de Git.

Los enlaces relativos de la documentación nueva se comprobaron contra los archivos locales y el README no contiene rutas locales de Windows. El README publicado se abrió en GitHub: el diagrama Mermaid terminó de renderizar y mostró todos los nodos y conexiones, además de la máquina de estados ASCII.

La primera comprobación de las demos mostró v2 en Pages y v1 en Vercel. Se publicó la compilación de `8d507d6` en ambas plataformas; ambas respondieron HTTP 200 y sirvieron el recibo v2. La rama de publicación quedó en `0f1011f`.

## Comprobación externa de la revisión inicial

El commit `8d507d6` obtuvo inicialmente una comprobación **SonarCloud Code Analysis** fallida. El resumen de GitHub señaló 40,6 % de duplicación en código nuevo (límite 3 %), calificación C de seguridad y C de fiabilidad (ambas exigían A). Estos resultados no equivalían a fallos de las suites ejecutadas, pero tampoco se consideraron resueltos por pasar dichas suites.

Los hallazgos se revisaron y corrigieron sin modificar el contrato. SonarCloud terminó el análisis de
`9f68173` con gate OK, calificaciones A, hotspots revisados 100 %, cero incidencias abiertas y 0,0 %
de duplicación en código nuevo. Consulta el [informe de remediación](revision-sonarcloud.md) y el
[panel externo](https://sonarcloud.io/dashboard?id=hvaler_ArenaPay&branch=main).

## Estado posterior de la entrega

- La suite creció a 64 pruebas TypeScript; mantiene el barrido determinista de 1.000 semillas.
- Los ocho escenarios de navegador pasan después de sincronizar explícitamente la simulación del
  fallo de RPC con la acción que la provoca.
- Se completó un [ensayo manual v2 con dos cuentas Freighter](../guias/ensayo-manual-freighter-v2.md): seis
  recibos, replay reproducido, firma validada y liquidación de 2 XLM de prueba a Nova. Una persona
  operó ambas cuentas.
- Vercel y GitHub Pages publican el runbook actualizado; las operaciones nuevas con Freighter siguen
  requiriendo la aplicación local mientras el perfil de servidor público permanezca sin implementar.

## Actualización posterior — 14 de septiembre de 2026

El último punto anterior describe el estado del 13 de septiembre y ya no está vigente. El backend
público se implementó como Cloudflare Worker con Durable Object SQLite; Vercel reenvía `/api/*` a
ese Worker y GitHub Pages conserva la edición offline. La validación posterior alcanzó 67 pruebas
TypeScript, 16 Rust, 8 escenarios locales, 1 escenario offline público y el escenario operativo
tanto en Vercel como en Cloudflare. Consulta la [evidencia de publicación](../evidencia/publicacion-2026-09-14.md).
