# Modelo de amenazas

Revisión: 14 de septiembre de 2026. Activos: depósitos de prueba, claves de participantes y árbitro, semilla/nonce privados, integridad del replay, disponibilidad de recuperación y credibilidad de la evidencia.

## Fronteras de confianza

Navegador → API local o Worker público → almacenamiento privado y árbitro → RPC → contrato. Freighter mantiene otra frontera: la aplicación solicita una firma y el propietario la autoriza. GitHub Pages no aloja motor ni secretos.

| Actor o fallo | Escenario | Control actual | Riesgo residual / siguiente control |
|---|---|---|---|
| Participante oportunista | Calcula el ganador antes de depositar | Compromiso v2 con nonce secreto y semilla oculta hasta replay | Filtración o colaboración del operador; estudiar aleatoriedad conjunta y abandono |
| Operador malicioso | Busca una semilla favorable o no publica resultados | Compromiso impide cambiar la semilla comprometida sin detección | No prueba selección imparcial; documentar política de creación y futuro protocolo de aleatoriedad |
| Árbitro comprometido | Firma un resultado falso a favor de un participante | Firma vinculada a red, contrato, partida y compromiso | El contrato puede aceptarlo; evaluar arbitraje múltiple o prueba/disputa antes de producción |
| Usuario con replay alterado | Cambia ganador, nonce o movimientos | Esquema, reproducción, compromiso y comparación con cadena | Un replay autoconsistente sin referencia externa no prueba autoría ni políticas |
| Cliente repetidor | Repite depósito o liquidación | Flags de financiación y estados terminales | Puede pagar comisiones por intentos; consultar antes de repetir |
| Atacante de API | Abusa de creación, ejecución o firma | Orígenes cerrados, límites por visitante, tope diario persistente y financiación comprobada | Sin identidad de usuario; memoria de límites temporales reiniciable y un único coordinador |
| Lectura de archivos privados | Accede a datos de partidas antes del replay | Exclusión Git, respuestas públicas filtradas y restricciones Vite | Acceso al disco o copias expuestas rompe el secreto; controlar permisos y respaldos |
| RPC caído o engañoso | Consulta falla o presenta datos incorrectos | Respaldo configurable solo para lecturas, comprobación de red, error explícito | No hay verificación criptográfica independiente de cada respuesta |
| Caída del servidor | Se pierde replay o nonce | Persistencia local; devolución tras vencimiento | No reconstruir un nonce perdido; restaurar copia íntegra o recuperar depósitos |
| Almacenamiento archivado | Getters dejan de ser accesibles | Almacenamiento persistente con extensión de TTL | La UI no automatiza restauración; ensayarla antes de producción |
| Dependencia o web comprometida | Presenta una petición de firma engañosa | Confirmación en wallet, entorno Testnet | La revisión de transacciones por el usuario no sustituye controles de suministro y despliegue |

## Lo que sigue abierto

Prioridad alta: autoridad del árbitro, selección de semilla por el operador y ausencia de autenticación multiusuario. Prioridad operativa: recuperación del estado, claves y errores ambiguos de envío. Los hallazgos de SonarCloud de la revisión anterior fueron corregidos y el gate quedó en verde; esto no sustituye una auditoría de seguridad.

Un reinicio de Testnet puede hacer que enlaces históricos dejen de consultar datos. Conservar recibos y versiones permite explicar el ensayo, pero no sustituye una consulta actual a cadena.

Referencias: [garantías](garantias-y-confianza.md), [SonarCloud](../auditorias/revision-sonarcloud.md), [servicio de partidas](../../src/services/match-engine/src/match-service.ts), [configuración Vite](../../src/apps/web/vite.config.ts), [operación](../guias/operacion-y-recuperacion.md).
