# Índice de evidencia por versión

Fecha de revisión: 14 de septiembre de 2026. Este índice distingue evidencia guardada, pruebas automatizadas, acciones humanas y publicaciones. Los commits indicados registran incorporación al repositorio, no necesariamente el código exacto ejecutado durante cada firma.

Contrato común Testnet: CDHPEYP7KEYYO3D6G44PK22MUNKF4ZBFHLOM6DUL2NOUKXNNTO4R4RID.

| Evidencia | Versión | Registro / incorporación | Qué acredita |
|---|---|---|---|
| [Ensayo manual Freighter v2](../guias/ensayo-manual-freighter-v2.md), [datos](testnet-evidence-v2-manual.json) y [replay](fixtures/testnet-replay-v2-manual.json) | resource-arena/2.0.0 | Código ejecutado ce198d7 | Dos cuentas Freighter, nonce, seis recibos, pago y comparación con cadena; una persona operó ambas cuentas |
| [Ensayo automatizado v2](testnet-evidence-v2.json) y [replay](fixtures/testnet-replay-v2.json) | resource-arena/2.0.0 | d7d542b | Depósitos, premio, saldos y comprobaciones del script; no firmas manuales Freighter |
| [Ensayo manual Freighter](../guias/ensayo-manual-freighter.md) | resource-arena/1.0.0 | eae261a | Un usuario operó dos cuentas, depositó, verificó y cobró; no son dos participantes humanos independientes |
| [Ensayo automatizado histórico](testnet-evidence.json) y [replay](fixtures/testnet-replay.json) | resource-arena/1.0.0 | Evidencia histórica conservada | Recorrido del script anterior; compromiso sin nonce |
| [Vector de firma](fixtures/resolution-v2.json) | Dominio de firma ARENAPAY_V2 | Vector compartido Rust/TS | Mismos campos XDR, digest y firma; no representa por sí solo un pago |
| [Revisión y pruebas](../auditorias/revision-readme-2026-09-13.md) | Fuente revisada 8d507d6 | Registro posterior 0b33b00 | 59 pruebas TS, 16 Rust, 8 navegador y compilación registradas |
| [Captura v2](screenshots/evidencia-v2.png) | resource-arena/2.0.0 | 8d507d6 | Pantalla de liquidación y comparación con contrato |
| [Vídeo anterior](media/arenapay-demo.webm) | Demo anterior | Archivo histórico | Presentación anterior; no grabación nueva de firmas v2 |
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
- [ ] Pendiente: vídeo continuo del recorrido v2 con ambas firmas.
- [ ] Pendiente: ensayo documentado de devolución con Freighter.
- [ ] Pendiente: recuperación tras archivado y caída con envío ambiguo.
