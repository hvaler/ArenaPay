# Entrega de las mejoras del benchmarking

12 de septiembre de 2026.

## Publicaciones comprobadas

- GitHub Pages: https://hvaler.github.io/ArenaPay/
- Vercel: https://arenapay.vercel.app/
- Repositorio de código fuente: https://github.com/hvaler/ArenaPay (rama main).
- Distribución estática: https://github.com/hvaler/ArenaPay/tree/gh-pages.

Ambas publicaciones ejecutan prácticas en el navegador, permiten importar y descargar replays y muestran el ensayo histórico con su recibo. No solicitan firmas, no crean depósitos y no incluyen servidor ni claves. La versión local conserva el flujo Testnet con Freighter. La versión paralela ArenaPayAtg permanece intacta.

## Mejoras entregadas

| Recomendación | Entrega |
|---|---|
| Dos entradas claras | Probar la arena y ver una partida pagada desde la cabecera. La versión local añade nueva partida Testnet. |
| Recorrido único | Preparar, financiar 0/2, competir, verificar y cobrar. El progreso usa el estado confirmado del contrato. |
| Dinero junto al tablero | Escrow situado en la columna de la arena; orden de paneles cambia entre práctica, histórico y Testnet. |
| Presupuesto visible | Gasto utilizado, disponible y vigencia de Atlas y Nova. Explicación de comisiones y presupuesto acumulado. |
| Estados y recuperación | Consulta cada 15 segundos mientras la pestaña está visible, actualización manual, reintento de consulta y guía al vencer. |
| Evidencia separada | Replay local, firma comprobada y pago confirmado tienen mensajes distintos. El ensayo guardado se identifica como histórico. |
| Navegación del replay | Pasos anterior/siguiente, barra y velocidad; controles con nombres accesibles y foco visible. |
| Móvil y teclado | Comprobados a 390 px; activación por teclado y ausencia de desbordamiento horizontal en los escenarios probados. |
| Publicación | Demo estática en GitHub Pages y Vercel, con recorrido completo probado en ambas URLs. |
| Vídeo | docs/evidencia/media/arenapay-demo.webm: captura sin locución del recorrido público. Guion en docs/guias/guion-demo-publica.md. |

## Validación realizada

- 42 pruebas TypeScript superadas; tipos y compilación correctos.
- Ocho escenarios de navegador local comprobados: cinco existentes y tres del recorrido guiado. Los tres últimos se ejecutaron de nuevo después de añadir el escenario de financiación y vencimiento.
- Demo estática comprobada localmente y luego en cada publicación: recibo histórico, reproducción, práctica completa, descarga, móvil y ausencia de peticiones a /api.
- La consulta del ensayo real ya existente en Testnet volvió a pasar. No se ha creado un nuevo pago en este trabajo.
- El contrato no se modificó; no se repitieron sus 16 pruebas previamente superadas.
- El paquete local de integración Stellar mantiene un aviso de tamaño de compilación. No impide compilar ni ejecutar; la versión pública elimina las operaciones de wallet.

## Pendiente de participación humana

**Ensayo manual con dos cuentas Freighter: completado posteriormente el 12 de septiembre de 2026.** El usuario firmó con ambas cuentas y liquidó el premio. Recibo y comprobaciones en [ensayo-manual-freighter.md](../guias/ensayo-manual-freighter.md).

**Prueba con cinco personas:** protocolo y tabla de recogida preparados en el mismo documento. No se han inventado participantes, tiempos ni métricas de comprensión.

La publicación, los cambios de producto y el ensayo manual están entregados. La prueba de usabilidad con cinco personas continúa abierta.

## Reproducir la entrega

`npm run build:public` genera public-demo con rutas relativas para GitHub Pages y Vercel. Los archivos de distribución se conservan en .publish/arenapay, una copia independiente de la rama gh-pages que solo contiene activos públicos compilados. El código completo se versiona desde la raíz del proyecto en main y se respalda en GitHub. Las claves, data, dependencias y archivos temporales no se publican.

Para validar la edición pública: `npx playwright test --config playwright.public.config.ts`. Con PUBLIC_DEMO_URL puede ejecutarse el mismo recorrido contra cualquiera de las URLs publicadas. La grabación utiliza el codificador de Playwright y puede requerir permiso para iniciar ese proceso en un entorno restringido.

Referencias de despliegue consultadas: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) y [Vercel CLI](https://vercel.com/docs/cli/deploy).
