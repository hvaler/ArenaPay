# Estado y límites del MVP

Revisión: 14 de septiembre de 2026.

- El MVP ya cubre práctica determinista, replay reproducible, escrow Soroban en Testnet, presupuestos, firma del árbitro, integración con Freighter y comparación del resultado contra el contrato.
- El repositorio y la demo están publicados. Hay ensayos manuales v1 y v2 con dos cuentas Freighter operadas por el usuario, además de un ensayo automatizado v2 con cuentas desechables del script. El manual v2 confirma seis operaciones y una transferencia de 2 XLM de prueba a Nova. El vídeo disponible muestra una demo anterior; siguen pendientes una grabación continua de las firmas v2, una devolución manual y la validación guiada con usuarios.
- Contrato: `Created → Funded → Settled`; `Created` y `Funded` pueden pasar a `Cancelled` al vencer. Estados locales independientes: `Ready → Completed`.
- Configuración, presupuestos y partidas usan almacenamiento persistente con extensión de TTL. Las simulaciones RPC de getters no escriben extensiones en cadena. Tras archivado sería necesaria una restauración; la interfaz todavía no la automatiza.
- El árbitro y el creador de partidas son de confianza. La API local no debe publicarse tal cual. La edición pública usa un único Durable Object, almacenamiento persistente, superficie reducida, lista de orígenes y límites de tráfico; sigue sin autenticación multiusuario y solo opera en Testnet.
- Las lecturas prueban primero el RPC principal y después los respaldos de `ARENAPAY_READ_RPC_URLS` (lista HTTPS separada por comas), o `readRpcUrls` en la configuración del despliegue si esa variable no está definida. Por defecto no hay respaldos configurados. Se comprueba Testnet en cada endpoint. Si todos fallan, la API devuelve 502 y la pantalla enumera los endpoints probados; descarta el estado anterior como autorización para actuar. `prepare()` y `submit()` permanecen en el RPC principal, sin reenvíos a respaldos.
- Los secretos de servicio de Testnet se cargan en Cloudflare y nunca se incluyen en documentos, respuestas ni archivos compilados. Disputas descentralizadas, lending y fondos reales quedan fuera de alcance.
- La reutilización multimotor, los enlaces de partida, los agentes externos y el juego humano están documentados como evolución posterior a la hackathon; no forman parte del MVP actual. Véanse [la guía de reutilización](../arquitectura/reutilizacion-juegos-y-jugadores.md) y [la hoja de ruta](roadmap-post-hackathon.md).

Consulta [el análisis y las decisiones](../arquitectura/analisis-y-decisiones.md) para las discrepancias detectadas y las condiciones del siguiente hito.

