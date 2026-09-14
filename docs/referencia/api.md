# API local y pública

Revisión: 14 de septiembre de 2026. ArenaPay ofrece el mismo flujo Testnet mediante dos implementaciones: un servidor Node para desarrollo y un Cloudflare Worker para la web pública.

## Perfiles

| Perfil | Inicio | Persistencia | Práctica por API |
|---|---|---|---|
| Node local | `npm run dev` | Archivos en `data/matches/` | Sí |
| Cloudflare público | Desplegado mediante Wrangler | Durable Object SQLite | No; la práctica vive en el navegador |

`GET /api/health` identifica el perfil. El Worker responde con `mode: public` y `persistence: durable-object`; Node responde con `persistence: filesystem` y modo `local` o `public` según su configuración.

## Práctica local

Estas rutas solo existen en el perfil Node no público.

| Método | Ruta | Resultado |
|---|---|---|
| `POST` | `/api/matches` | Crea una práctica con `{ "seed": 2026 }`; responde 201 |
| `GET` | `/api/matches/:id` | Devuelve la partida y el replay cuando existe |
| `POST` | `/api/matches/:id/run` | Ejecuta una sola vez |
| `GET` | `/api/matches/:id/replay` | Descarga el JSON; responde 409 antes de ejecutar |

La escritura local utiliza un archivo temporal y un renombrado antes de responder. El bloqueo de ejecución concurrente vive en el proceso: no se deben iniciar varias instancias sobre la misma carpeta.

## Testnet

| Método | Ruta | Autorización en API | Resultado |
|---|---|---|---|
| `GET` | `/api/testnet/config` | Ninguna | Configuración pública y disponibilidad |
| `GET` | `/api/testnet/latest` | Ninguna | Última partida conocida, si existe |
| `POST` | `/api/testnet/matches` | Límites de tráfico públicos | Crea contrato y registro privado |
| `GET` | `/api/testnet/matches/:id` | Ninguna | Estado combinado del registro y del contrato |
| `POST` | `/api/testnet/matches/:id/run` | Financiación y plazo comprobados | Ejecuta y revela el replay |
| `POST` | `/api/testnet/matches/:id/resolution` | Replay, financiación y plazo comprobados | Devuelve resolución firmada |

### Crear una partida

```json
{
  "playerA": "G...",
  "playerB": "G...",
  "buyIn": "10000000"
}
```

`buyIn` se expresa en stroops: `10000000` equivale a 1 XLM. El máximo aceptado por el MVP es 10 XLM. Las direcciones deben ser cuentas Stellar distintas. El cuerpo no admite `seed`: el servidor genera semilla y nonce y solo publica el compromiso.

La respuesta pública puede contener ID local, ID de cadena, contrato, versión, compromiso, estado y recibo de creación. No contiene semilla ni nonce hasta que existe el replay.

### Ejecutar y solicitar resolución

`run` no requiere cuerpo. Antes de ejecutar, el servidor consulta el contrato y exige estado `Funded` y un ledger anterior al vencimiento. Una segunda ejecución responde como conflicto y no crea otro replay.

`resolution` tampoco requiere cuerpo. El servidor reproduce el replay guardado, contrasta compromiso y estado contractual y firma la preimagen de resolución. La resolución no mueve fondos: el navegador todavía debe construir la operación `settle_match` y el participante debe aprobarla en Freighter.

## Códigos de respuesta

| Código | Significado habitual |
|---|---|
| 200 | Consulta, ejecución o resolución correcta |
| 201 | Partida creada |
| 400 | Cuerpo, dirección, importe o identificador inválido |
| 403 | Origen no permitido en el perfil público |
| 404 | Ruta o partida desconocida; también rutas de práctica en el Worker |
| 409 | Estado incompatible, ejecución repetida o financiación incompleta |
| 413 | Cuerpo superior al límite de 16 KiB del Worker público |
| 429 | Límite por visitante o tope diario alcanzado |
| 502 | Fallaron todos los RPC de lectura |
| 503 | Configuración Testnet ausente o incompatible |
| 500 | Fallo interno no clasificado |

Los errores se devuelven como JSON con `message`. Si fallan todos los RPC de lectura, el mensaje enumera los endpoints probados sin sus parámetros de consulta.

## Lecturas, preparación y envío

Las lecturas prueban primero el RPC principal y después los respaldos configurados mediante `ARENAPAY_READ_RPC_URLS` o `readRpcUrls`. Cada endpoint debe responder como Testnet.

La preparación y el envío permanecen en el RPC principal. Una transacción firmada se envía una vez; después se consulta el mismo hash hasta obtener éxito, fallo o un resultado explícitamente ambiguo. Los respaldos nunca se usan para reenviar escrituras.

## Controles del Worker

- Lista de orígenes mediante `ARENAPAY_ALLOWED_ORIGINS`.
- Máximo diario persistente de partidas mediante `ARENAPAY_DAILY_MATCH_LIMIT`.
- Límites por visitante para solicitudes, creación, ejecución y resolución.
- Un único coordinador para serializar cambios.
- Claves de administrador, árbitro y sal almacenadas como secretos de Cloudflare.
- Respuestas filtradas mediante el esquema público de partida.

Estos controles reducen abuso casual. No son autenticación de usuarios ni una garantía de disponibilidad.

## Qué nunca debe enviar un cliente

- Claves secretas que empiecen por `S`.
- Frases de recuperación o contraseña de Freighter.
- Semilla o nonce de una partida Testnet pendiente.
- Una resolución inventada o un replay modificado.

Consulta la [visión general](../arquitectura/vision-general.md), el [backend de Cloudflare](../despliegue/cloudflare.md) y la [operación ante fallos](../guias/operacion-y-recuperacion.md).
