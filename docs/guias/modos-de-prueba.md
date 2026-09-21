# Modos de probar ArenaPay

## Elegir un modo

| Objetivo | Dirección o comando | Wallet | Escribe en Testnet |
|---|---|---|---|
| Explorar sin instalar | <https://hvaler.github.io/ArenaPay/> | No | No |
| Usar práctica local | `npm run dev` y <http://127.0.0.1:5173> | No | No |
| Revisar evidencia pagada | Botón **Ver una partida pagada en Testnet** | No | No |
| Crear una partida pública | <https://arenapay.vercel.app/> | Sí, Freighter en Testnet | Sí |
| Probar dos wallets | Vercel en Chrome y Edge, o en dos equipos | Dos cuentas | Sí |
| Ejecutar pruebas automáticas | `npm test` y `npm run test:e2e` | No | No |
| Probar el contrato | `npm run test:contract` | No | No |

## 1. Demo offline de GitHub Pages

Permite crear una práctica, ejecutar el motor, mover el replay y revisar el ensayo ya publicado. No contiene backend, no conecta Freighter y no crea depósitos.

## 2. Práctica local

Instala las dependencias, ejecuta `npm run dev`, crea una semilla y pulsa **Crear partida** y **Ejecutar simulación**. Este modo guarda la práctica en el navegador y sirve para comprender Atlas, Nova y el replay.

## 3. Evidencia pagada existente

En cualquier edición pulsa **Ver una partida pagada en Testnet**. La interfaz carga un replay histórico y permite verificarlo. Abrir el recibo de Stellar Expert confirma la operación ya realizada; el botón no crea otra transacción.

## 4. Partida pública nueva con Freighter

Abre Vercel en Chrome o Edge, selecciona **Nueva partida en Testnet**, conecta Freighter en Testnet y sigue el recorrido: crear, autorizar, depositar con ambas cuentas, competir, verificar y cobrar. Utiliza XLM de prueba.

La guía detallada está en el [runbook](runbook-pruebas-arenapay.md).

## 5. Dos navegadores o equipos

La persona de Atlas crea la partida. La persona de Nova abre la misma aplicación y carga la partida más reciente. Cada una firma únicamente con su wallet. Este modo funciona para una prueba coordinada con una sola partida activa; todavía no existe un enlace público por identificador.

Prueba al menos:

1. Chrome con Atlas y Edge con Nova en el mismo equipo.
2. Dos equipos en la misma red.
3. Dos equipos en redes distintas.
4. Recargar ambos navegadores entre los depósitos.
5. Confirmar que los dos muestran el mismo estado tras actualizar.

Atlas y Nova siguen eligiendo los movimientos. Dos humanos controlan las wallets, no las decisiones del tablero.

## 6. Pruebas automáticas

`npm test` comprueba motor, hashes, RPC, API y componentes. `npm run test:e2e` ejecuta ocho recorridos locales en navegador. `npm run test:operational` abre la edición pública, comprueba su configuración Testnet y verifica que la práctica no llama a la API. Ese escenario no crea, financia ni liquida una partida Testnet.

## 7. Contrato

`npm run test:contract` ejecuta los escenarios Rust sin fondos reales. Comprueba autorización, presupuestos, depósitos, firmas, liquidación única, vencimiento y devolución.

## Seguridad durante las pruebas

- Confirma que Freighter indica **Testnet**.
- No pegues claves que empiecen por `S` ni frases de recuperación en ArenaPay.
- Revisa dirección, red y método antes de firmar.
- Cierra cualquier túnel temporal al terminar.
- Guarda los recibos públicos; no guardes secretos en las evidencias.
