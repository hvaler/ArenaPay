# Índice de evidencia por versión

Fecha de revisión: 21 de septiembre de 2026. Este índice distingue evidencia guardada, pruebas automatizadas, acciones humanas y publicaciones. Los commits indicados registran incorporación al repositorio, no necesariamente el código exacto ejecutado durante cada firma.

Contrato común Testnet: CDHPEYP7KEYYO3D6G44PK22MUNKF4ZBFHLOM6DUL2NOUKXNNTO4R4RID.

## Salto de 0.4.2 a 0.5.0 en las etiquetas públicas

Las etiquetas del repositorio público pasan de `v0.4.2` a `v0.5.0`. Las versiones **0.4.3** y **0.4.4** existieron: se desplegaron en Vercel y Cloudflare el 21 de septiembre de 2026 y quedan registradas en [su nota de publicación](publicacion-0.4.3-2026-09-21.md) y [la siguiente](publicacion-0.4.4-2026-09-21.md). Fueron dos iteraciones sobre la conexión con Freighter, la segunda corrigiendo a la primera, y se superaron antes de llegar al repositorio público; su contenido se publicó dentro de 0.5.0.

No se les asigna etiqueta pública porque ningún commit de ese repositorio declara esas versiones: una etiqueta apuntando al commit de 0.5.0 entregaría código distinto del que anuncia. El repositorio privado `ArenaPay-Dev` sí conserva `v0.4.3` y `v0.4.4` sobre los commits que realmente las contienen.

| Evidencia | Versión | Registro / incorporación | Qué acredita |
|---|---|---|---|
| [Preparación de Freighter y Friendbot](../guias/fondear-freighter-testnet.md) y [ayuda en la aplicación](publicacion-0.5.0-2026-09-21.md) | 0.5.0 | Publicada 21-sep-2026 | Cuenta Testnet financiada con 10.000 XLM de prueba, comprobación de saldo y preparación explicada dentro del panel de Testnet |
| [Publicación 0.4.0 — 21-sep-2026](publicacion-0.4.0-2026-09-21.md) | Plataforma multimotor | `main` 26b8727 · `gh-pages` 1741776 | Selección de motores activos, preservación histórica y protocolo común de turnos |
| [Ensayo manual Freighter v2](../guias/ensayo-manual-freighter-v2.md), [datos](testnet-evidence-v2-manual.json) y [replay](fixtures/testnet-replay-v2-manual.json) | resource-arena/2.0.0 | Código ejecutado ce198d7 | Dos cuentas Freighter, nonce, seis recibos, pago y comparación con cadena; una persona operó ambas cuentas |
| [Ensayo automatizado v2](testnet-evidence-v2.json) y [replay](fixtures/testnet-replay-v2.json) | resource-arena/2.0.0 | d7d542b | Depósitos, premio, saldos y comprobaciones del script; no firmas manuales Freighter |
| [Ensayo manual Freighter](../guias/ensayo-manual-freighter.md) | resource-arena/1.0.0 | eae261a | Un usuario operó dos cuentas, depositó, verificó y cobró; no son dos participantes humanos independientes |
| [Ensayo automatizado histórico](testnet-evidence.json) y [replay](fixtures/testnet-replay.json) | resource-arena/1.0.0 | Evidencia histórica conservada | Recorrido del script anterior; compromiso sin nonce |
| [Vector de firma](fixtures/resolution-v2.json) | Dominio de firma ARENAPAY_V2 | Vector compartido Rust/TS | Mismos campos XDR, digest y firma; no representa por sí solo un pago |
| [Revisión y pruebas](../auditorias/revision-readme-2026-09-13.md) | Fuente revisada 8d507d6 | Registro posterior 0b33b00 | 59 pruebas TS, 16 Rust, 8 navegador y compilación registradas |
| [Captura v2](screenshots/evidencia-v2.png) | resource-arena/2.0.0 | 8d507d6 | Pantalla de liquidación y comparación con contrato |
| [Demo final](media/arenapay-demo-testnet-es.mp4), [subtítulos](media/arenapay-demo-testnet-es.srt) y [YouTube](https://youtu.be/LECz_vXmFi0) | Entrega audiovisual 20-sep-2026 | [Índice audiovisual](media/README.md) | Recorrido completo narrado; complementa, pero no sustituye, los recibos y replays |
| [Arquitectura y plataforma](media/pitch-v2/arenapay-arquitectura-stellar-es.mp4), [subtítulos](media/pitch-v2/arenapay-pitch-v2-es.srt), [miniatura](media/pitch-v2/arenapay-arquitectura-thumbnail.png) y [YouTube](https://youtu.be/4uiet8NSKwo) | Publicación 21-sep-2026 | [Guion y ficha](../guias/pitch-v2-arquitectura.md) | Presentación de 2:44 sobre arquitectura, motores, juegos y hoja de ruta |
| [Presentación inicial](media/arenapay-pitch-es.mp4), [subtítulos](media/arenapay-pitch-es.srt), [miniatura](media/arenapay-pitch-thumbnail.png) y [YouTube](https://youtu.be/thcnJ7IS7fE) | Entrega audiovisual 20-sep-2026 | [Índice audiovisual](media/README.md) | Pieza histórica de 2:44 utilizada en la entrega original |
| [Diagrama de flujo](../arquitectura/flujo-checkpoint-stellar-odyssey.md), [PNG](../assets/arenapay-flujo-verificable.png) y [FigJam](https://www.figma.com/board/CgZaKh4wtUQk1PC4J7BfuX/ArenaPay-%E2%80%94-Flujo-verificable-en-Stellar-Testnet?node-id=9-86) | Arquitectura visual 20-sep-2026 | Repositorio y FigJam | Preparación, motor, replay, verificación y liquidación |
| [Confirmación de entrega](entrega-stellar-odyssey-2026-09-20.md) y [captura](screenshots/entrega-stellar-odyssey-2026-09-20.png) | Stellar Odyssey Perú 2026 | Plataforma de Stellar Build Perú, 20-sep-2026 | Proyecto entregado con repositorio, despliegue, demo, pitch y evidencia Testnet v2 |
| [Vídeo anterior](media/arenapay-demo.webm) | Demo anterior | Archivo histórico | Presentación anterior conservada para trazabilidad |
| [Publicación 0.2.0 — 21-sep-2026](publicacion-2026-09-21.md) | resource-arena/2.0.0 | `main` 931c243 · `gh-pages` 9b35529 | Release, despliegues y pruebas públicas de la arquitectura multimotor |
| [Publicación 14-sep-2026](publicacion-2026-09-14.md) | resource-arena/2.0.0 | `main` 39ac664 · `gh-pages` 4068b3a | Versiones y pruebas públicas; no representa un pago nuevo |

## Recibos principales

- V2 manual: [b8f1d444402c4bcb976126b8e144eabde40b6e5dc8fb173f0a63ed178e43b448](https://stellar.expert/explorer/testnet/tx/b8f1d444402c4bcb976126b8e144eabde40b6e5dc8fb173f0a63ed178e43b448). Ledger 4655945; Nova; transferencia registrada de 2 XLM de prueba. Hash final: 15264d98af8c124dd5f1ef889f579a0e36fff2325e7b3f9951d97dd368e67317.
- V2 automatizado: [deaa8c4292c7c9f55ab9d07b0ab5ec6abbde16af9e142aacb1cd169fd115989a](https://stellar.expert/explorer/testnet/tx/deaa8c4292c7c9f55ab9d07b0ab5ec6abbde16af9e142aacb1cd169fd115989a). Ledger 4643946; Nova; 2 XLM de prueba. Hash final: d5fe79f1fe86973bce11ca65d8448896497a9255be7159eb4798392ffa2fbd9b.
- V1 manual: [2b9577790a54d67d799feaa4c2b610956521eea7f6bfa09437715260a89d6b21](https://stellar.expert/explorer/testnet/tx/2b9577790a54d67d799feaa4c2b610956521eea7f6bfa09437715260a89d6b21). Ledger 4640560; Nova, 27 frente a 16 puntos; hash final 1f167557b9f13e95e9e5c2370bd10cc4e86cb8e079bc9374f28684c5edaf6161.
- V1 automatizado: [743e702483496008c7cfbf19f3b319877fab4cd593459a7d7528e96dfceac318](https://stellar.expert/explorer/testnet/tx/743e702483496008c7cfbf19f3b319877fab4cd593459a7d7528e96dfceac318).

El hash v1 manual completo figura en el registro del ensayo. La revisión de README ya contrastó los recibos principales; crear este índice no constituye una nueva consulta de todos los pagos.

## Cómo añadir un ensayo

Registrar fecha UTC, commit ejecutado, versión del motor, contrato/WASM, IDs local y de cadena, recibos, replay revelado, tipo de firma, resultados observados y pruebas omitidas. Separar datos observados de inferencias. No publicar registros privados de partidas pendientes.

- [x] Ensayo manual v2 con ambas cuentas Freighter, replay y pago contrastados.
- [x] Demo final publicada, archivada con subtítulos y enlazada desde la documentación. Los recibos y replays mantienen su identidad propia.
- [ ] Pendiente: ensayo documentado de devolución con Freighter.
- [ ] Pendiente: recuperación tras archivado y caída con envío ambiguo.
