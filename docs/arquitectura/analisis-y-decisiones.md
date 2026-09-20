# Análisis de documentos y primera entrega de ArenaPay

> **Registro histórico.** Este documento conserva la primera revisión y sus carencias originales. No debe usarse como estado vigente. Consulta la [visión general](vision-general.md), el [estado del MVP](../producto/estado-y-limites.md) y el [índice de evidencia](../evidencia/README.md).

**Actualización del 20 de septiembre de 2026:** ya están implementados el escrow Soroban, los presupuestos, el árbitro Ed25519, Freighter, el nonce v2, los respaldos de lectura y el backend persistente. Vercel, Cloudflare y GitHub Pages están publicados. Se completó un ensayo manual v2 con dos cuentas operadas por una persona, y la demo final y el pitch quedaron publicados y archivados con subtítulos. Siguen pendientes una devolución manual, recuperación integrada y una prueba con participantes independientes. La tabla siguiente conserva deliberadamente el estado de la primera entrega.

Se revisaron `ArenaPay_Propuesta_Stellar_Odyssey.docx`, su conversión Markdown y `2026-09-11-arenapay-mvp.md`. La propuesta Word y el Markdown contienen el mismo alcance funcional. El directorio inicial contenía únicamente estos tres documentos, sin código ni repositorio Git.

La propuesta es viable si se entrega por hitos: primero una partida reproducible, después el escrow y finalmente la demo con evidencia en Testnet. Esta primera implementación completa M1 y adelanta el visor de replay de M3. No representa la entrega completa del MVP de hackathon.

## Requisitos y estado

| Requisito | Estado de esta entrega |
| --- | --- |
| Dos agentes autónomos con políticas diferentes | Implementado: Atlas recolector y Nova táctico, sin llamadas a un LLM |
| Semilla, reglas versionadas, inputs completos y hash final | Implementado |
| Replay reproducible en el navegador | Implementado; comparación local de semilla, resultado y SHA-256 |
| Persistencia y descarga de evidencia | Implementado: JSON atómico por partida en disco |
| Crear partida, ejecutar y consultar API | Implementado con estados locales Ready y Completed |
| Contrato Soroban con estados Created, Funded, Settled, Cancelled | Pendiente; tipos reservados, sin contrato desplegado |
| Dos buy-ins y pago atómico | Pendiente |
| Árbitro y firma Ed25519 | Pendiente |
| Wallet con autorización limitada y rechazo de sobrepresupuesto | Pendiente |
| Transacción y comparación con hash on-chain | Pendiente |
| Video y repositorio público | Pendiente |

## Decisiones sobre contradicciones del plan

1. **Juego:** el plan menciona disparar, pero su interfaz solo permite UP, DOWN, LEFT, RIGHT y STAY. Se implementa recolección de recursos con esas cinco acciones. Atlas prioriza cercanía; Nova puntúa valor, distancia propia y separación del rival. No se introduce combate implícito ni una acción FIRE sin especificar.
2. **Hash compartido:** el ejemplo importa `node:crypto` en un paquete usado por el navegador. Se usa Web Crypto en ambos entornos. La API es asíncrona y todas las llamadas esperan el resultado.
3. **Serialización:** se sustituye `localeCompare` por orden ordinal de claves. Se rechazan valores no JSON, números no enteros o fuera del rango seguro, objetos especiales y elementos indefinidos.
4. **Inputs:** no se filtran o ignoran silenciosamente movimientos inválidos. Deben existir exactamente 120, uno por jugador y tick. Se rechazan duplicados, versiones desconocidas y propiedades adicionales.
5. **Estados y fondos:** una ejecución local usa Ready/Completed. No se marcan depósitos ficticios como Funded ni una simulación como Settled. La pantalla habla de primer puesto en simulación y no muestra premio liquidado.
6. **Verificación:** antes del despliegue solo se puede afirmar reproducibilidad local. Un archivo importado puede ser internamente consistente sin ser auténtico. No se muestra «Hash coincide 100%» respecto a una blockchain que aún no existe.
7. **Persistencia:** se prefiere archivo JSON con escritura temporal y renombrado a un Map que pierda evidencia al reiniciar. La ejecución está bloqueada por partida dentro de un único proceso.
8. **Herramientas:** se usa npm workspaces con lockfile porque Node y npm ya estaban disponibles. Se conserva la separación React/Vite, Fastify y TypeScript prevista. No se inicializa Git ni se crean commits de forma implícita.

## Aspectos que deben cerrarse al construir Soroban

- Seleccionar token de Testnet y unidades decimales; usar importes enteros positivos dentro de i128 y comprobar desbordamiento al duplicar el buy-in.
- Unificar el API de creación: los ejemplos alternan entre token/árbitro por partida y configuración global con `initialize`.
- Definir creador autorizado, inicialización atómica y políticas de administración antes de publicar el contrato.
- Añadir `timeout_ledger` a todos los ejemplos y probar devolución de cero, uno y dos depósitos. No permitir liquidación y cancelación incompatibles.
- La firma debe enlazar el resultado con la red, contrato y partida para evitar reutilización entre despliegues. El prefijo ARENAPAY_V1 del plan separa protocolos, pero no redes ni instancias del mismo protocolo.
- Congelar una codificación inequívoca del mensaje firmado y añadir vectores comunes en TypeScript y Rust. El UUID de la demo local no sustituye directamente los bytes32 del contrato.
- La clave del árbitro debe ser pública Ed25519 de 32 bytes en el contrato y la dirección ganadora debe codificarse en XDR. No confundir una dirección G... con los bytes de una clave sin conversión explícita.
- TTL de registros y configuración; autenticación de ambos participantes; liquidación única; firma inválida; ganador externo; timeout; saldos finales y eventos requieren pruebas reales de contrato.
- Añadir wallet sin custodia, límites de autorización efectivos y consulta de estado RPC. No debe existir una ruta HTTP que declare fondos confirmados por petición del cliente.

## Diseño de interfaz

Se eligió una mesa de torneo clara donde el tablero es el foco visual y la evidencia acompaña cada partida. La interfaz no necesita imágenes externas ni fuentes descargadas.

- Paleta: fondo #F4F6FB, papel #FFFFFF, texto #1C2944, Atlas #203AD0, Nova #BD493A y recursos #FFE1A0.
- Tipografía: Segoe UI Variable/Segoe UI, con título de 31–46 px, títulos de panel de 18 px y controles de lectura compacta.
- Composición: cabecera, introducción, tablero y marcadores a la izquierda, configuración/evidencia a la derecha; una columna en móvil.
- El color identifica agentes y recursos. Los números 1–3 corresponden a los pasos de evidencia, y 01–03 a hitos reales.
- Se descartaron saldos decorativos, transacciones inventadas y una conexión de wallet que no funcionara. Los controles disponibles ejecutan acciones locales reales.

## Límites operativos

Esta API está pensada para un solo proceso local, ligado a 127.0.0.1. No tiene autenticación, cuotas, distribución entre instancias ni almacenamiento transaccional compartido. Antes de exponerla públicamente hacen falta esos controles. La seguridad económica dependerá del contrato aún pendiente. Los agentes son políticas deterministas de demostración, no modelos de lenguaje conectados en tiempo real.

## Referencias técnicas consultadas

- [Vite 8 y requisitos de Node](https://vite.dev/blog/announcing-vite8).
- [Validación y serialización de Fastify](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/).

Las versiones efectivamente instaladas están fijadas en `package-lock.json`; la validación final se registra en el README.
