# Verificación y corrección de los tres hallazgos externos

Fecha: 12 de septiembre de 2026. Repositorio: ArenaPay. Alcance: motor, replays, API, interfaz y adaptador RPC. El contrato Soroban no se modifica ni se vuelve a desplegar.

## 1. Compromiso de semilla enumerable — confirmado

Antes del cambio, el compromiso era SHA-256 del JSON canónico de versión y semilla uint32. No tenía nonce. Además, la semilla era elegida por el cliente y devuelta por la API antes de financiar. Por tanto, añadir un nonce al hash sin cambiar esas respuestas no habría impedido anticipar el resultado.

Las partidas nuevas usan `resource-arena/2.0.0` y calculan `SHA256(canonicalJson({ engineVersion, seed, nonce }))`. El nonce procede de 32 bytes aleatorios criptográficos y se codifica en hexadecimal minúsculo. El esquema v2 lo exige y la verificación lo utiliza para recalcular el compromiso. Un nonce ausente, mal formado o alterado no valida el replay.

Para Testnet, el servidor genera también la semilla mediante `randomInt(2^32)`. La creación acepta solo participantes e inscripción; rechaza `seed`. Se guarda la vinculación al contrato junto con el registro privado, antes de enviar la creación, para no abrir una ventana de ejecución por el endpoint local. La API publica el compromiso, pero omite semilla y nonce hasta que existe el replay. El motor exige ambos depósitos y plazo vigente antes de ejecutarlo. La práctica sigue admitiendo semillas elegidas y no promete secreto frente al usuario del navegador.

El registro conserva el nonce entre reinicios. La ejecución usa exactamente ese valor: si falta o no reproduce el compromiso guardado, falla sin sustituirlo. Solo el replay revela el nonce; no hay un campo adicional público fuera de él.

### Vía de archivos del servidor de desarrollo

Se comprobó con una partida desechable que Vite respondía 200 a `/@fs/.../data/matches/<id>.json`, exponiendo el nonce aunque la API lo ocultase. Se limitó el acceso de archivos de Vite a las carpetas necesarias para la web y se denegó `data`, además de mantener las exclusiones de credenciales. El escenario de navegador exige ahora 403 y ausencia del nonce en esa respuesta.

El directorio de ejecución debe seguir siendo privado, fuera de `public`, documentación y carpetas de código que se sirvan al navegador. El control de archivos del servidor de desarrollo no protege frente a una persona con acceso al disco del operador.

### Compatibilidad elegida

Se versionó el motor y el esquema; no se regeneró `docs/evidencia/fixtures/testnet-replay.json` ni se cambiaron los recibos históricos. `simulation-v1.ts` conserva el algoritmo anterior. `verifyReplay` y la reproducción visual seleccionan el motor según `engineVersion`. El esquema v1 permanece sin nonce; el esquema v2 lo exige. Cambiar la etiqueta de versión no permite validar contra un compromiso v2.

Las partidas v1 ya persistidas pueden completarse con su compromiso original; conservan su debilidad histórica y no deben anunciarse como protegidas por nonce. La API solo crea nuevas partidas v2. El guion de ensayo guardará futuras evidencias en archivos con sufijo `-v2`, sin sobrescribir el ejemplo histórico.

El digest XDR de liquidación, su separación por red/contrato y el contrato quedan intactos. La versión y el compromiso ya forman parte del digest: no hace falta cambiar su estructura para incorporar el nuevo valor.

Límite: el operador conoce la semilla y el árbitro sigue siendo de confianza. Esta corrección impide deducirla del compromiso público; no aporta aleatoriedad descentralizada ni neutralidad frente al operador.

## 2. Barrido de determinismo — faltaba y encontró errores

Se ejecutó el barrido antes de cambiar las reglas, sobre semillas 0–999 y 61 fotogramas por partida, incluido el inicial.

| Medida | Motor v1 anterior | Motor v2 corregido |
|---|---:|---:|
| Semillas | 1.000 | 1.000 |
| Hashes finales distintos | 1.000 | 1.000 |
| Fotogramas con agentes en la misma casilla | 19.820 | 0 |
| Victorias de Atlas | 420 | 434 |
| Victorias de Nova | 580 | 566 |

La primera superposición anterior apareció con semilla 0, tick 16. El código original permitía compartir casillas y solo alternaba quién recogía el recurso. No se encontró el plegado XOR descrito en la otra implementación: aquí el estado inicial era directamente la semilla. Sí existía otra colisión fuera de 0–999: la semilla 0 sustituía su estado por `0x9e3779b9`, por lo que ambas generaban la misma arena. El hash final incluía la semilla declarada y podía ocultar esa igualdad de arenas.

V2 usa Mulberry32 sin sustituir el cero. Los destinos se calculan desde el mismo estado previo; si coinciden, ambos jugadores se quedan en sus posiciones anteriores. Si son distintos, ambos movimientos se aplican. Se permiten intercambios de casilla, porque dejan posiciones finales distintas. El contrato no interviene en estas reglas.

La prueba permanente de 1.000 semillas comprueba:

- Verificación del propio hash, ganador y compromiso del replay.
- Ausencia de hashes finales repetidos y de arenas iniciales repetidas, sin depender del campo `seed` para diferenciarlas.
- Coordenadas enteras dentro de la rejilla en todos los ticks.
- Ausencia de casillas compartidas en todos los ticks.
- Al menos una victoria de cada política.

También hay regresiones específicas para cero frente al antiguo valor de sustitución, extremos de uint32, destinos en conflicto y un jugador inmóvil. El barrido no demuestra ausencia de errores en las 2^32 semillas ni igualdad estadística entre políticas.

## 3. Respaldo de RPC de lectura — faltaba

`StellarRpc` acepta una lista de respaldos exclusivamente para `read()` y `latestLedger()`. Prueba el principal primero y solo pasa al siguiente si falla. Cada endpoint debe responder con la passphrase de Testnet. Los getters de contrato y presupuesto y la consulta de ledger del servicio utilizan este recorrido.

Configuración: `ARENAPAY_READ_RPC_URLS`, con URLs HTTPS separadas por comas. Si la variable no está definida se admite `readRpcUrls` en `data/testnet/deployment.json`. Por defecto la lista está vacía: no se ha elegido ni activado un proveedor externo en nombre del usuario. Los fallos de respaldo se probaron con servidores simulados; el escenario de navegador siguió consultando el ensayo real con la configuración local.

Si todos fallan, se lanza un error de lectura que enumera los endpoints probados, sin parámetros de consulta. La API conserva ese mensaje con HTTP 502 y la interfaz descarta la instantánea anterior, muestra el error y permite reintentar la consulta. No presenta el estado anterior como permiso para ejecutar o cobrar.

`prepare()` y `submit()` no se cambiaron. Se conserva un único envío al principal y la consulta posterior por hash. Las pruebas comprueban que los respaldos no reciben escrituras ni ante éxito, fallo de preparación o pérdida de respuesta del envío. No se añadió una política nueva de reconciliación de envíos ambiguos.

## Validación y decisiones de alcance

- `npm run check`: 59 pruebas TypeScript superadas (las 42 anteriores, adaptadas donde cambió la versión, más 17 nuevas), comprobación de tipos y compilación correctas.
- `npm run test:e2e`: 8 escenarios de navegador, incluida la consulta del ensayo real en Testnet, la evidencia histórica sin API, el nonce del replay nuevo, el bloqueo de lectura de archivos privados y los errores de RPC.
- `npm run build:public` y el escenario adicional de `playwright.public.config.ts`: compilación y prueba de la demo sin servidor superadas. El primer intento encontró `spawn EPERM` al guardar el vídeo; la repetición con permiso de ejecución terminó correctamente.
- Se preservan el contrato, el vector de firma, la evidencia y el replay históricos; no se hizo una nueva liquidación ni se solicitaron firmas Freighter para esta revisión.
- La compilación avisa del tamaño del paquete de integración Testnet. No impide compilar y no se modificó la distribución de paquetes por quedar fuera de estos hallazgos.
- No se repitieron las pruebas Rust porque no cambió el contrato. No se publicaron estos cambios en GitHub Pages ni Vercel durante esta revisión.

El README y el runbook Markdown/HTML se actualizaron para distinguir la semilla reservada de Testnet de la semilla elegida de práctica y del ensayo histórico de semilla 2026.
