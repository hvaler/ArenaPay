# Revisión integral de ArenaPay — 20 de septiembre de 2026

## Alcance

Revisión posterior a la entrega de Stellar Odyssey Perú 2026. Se contrastaron el árbol privado, los componentes TypeScript y Rust, las compilaciones web, el empaquetado de Cloudflare, la aplicación pública, la documentación vigente y la viabilidad de incorporar otros juegos. Esta revisión no sustituye una auditoría independiente de seguridad ni autoriza el uso de fondos reales.

## Resultado ejecutivo

ArenaPay está operativo y coherente con el alcance declarado de su MVP en Stellar Testnet. No se encontró un defecto funcional que invalide la entrega. El frontend público, el backend persistente, GitHub Pages, la evidencia Testnet v2, la demo y el pitch estaban accesibles durante la revisión.

La arquitectura permite reutilizar el contrato actual para otro juego que mantenga dos participantes, un único ganador, ejecución determinista y un hash final verificable. En la revisión se detectó que el código estaba acoplado al motor `resource-arena/2.0.0`; la frontera y el registro recomendados se implementaron el 21 de septiembre y quedaron documentados en [ADR-006](../adr/ADR-006-frontera-y-registro-de-motores.md).

## Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| Pruebas TypeScript | 67/67 correctas en 10 archivos |
| Tipos y compilación Vite | Correctos |
| Navegador local | 8/8 escenarios correctos |
| Contrato Soroban | 16/16 pruebas Rust correctas |
| Navegador contra Vercel | 1/1 escenario operativo correcto |
| Compilación pública, operativa y Vercel | Correctas |
| Empaquetado de Wrangler | `--dry-run` correcto; Durable Object y assets detectados |
| Dependencias de producción | `npm audit --omit=dev`: 0 vulnerabilidades conocidas |
| Aplicación Vercel | HTTP 200 |
| Worker Cloudflare | `status: ok`, persistencia `durable-object`, motor v2 |
| Configuración Testnet pública | `ready: true`; no expone claves secretas |
| GitHub Pages | HTTP 200 |
| Evidencia v2 manual | Stellar Expert HTTP 200 |
| Demo y pitch | Enlaces públicos accesibles |

La primera ejecución de Playwright dentro del entorno restringido no pudo consultar el perfil de Windows. Al ejecutar los servidores fuera de ese aislamiento, los ocho escenarios finalizaron correctamente. No fue un fallo del producto.

## Hallazgos

### Corregidos durante la revisión

1. El runbook desplegado enlazaba el archivo audiovisual mediante una ruta relativa válida en `docs/`, pero inexistente en la web publicada. Se sustituyó por el enlace público de GitHub y se regeneraron Markdown y HTML.
2. Los documentos de estado aún mostraban como pendiente el ensayo público con Freighter y no registraban la entrega final. Se actualizaron sin marcar como realizadas la devolución, la recuperación ni la prueba con dos personas independientes.

### Pendientes que no bloquean el MVP

| Prioridad | Hallazgo | Consecuencia | Acción propuesta |
|---|---|---|---|
| Media | `readRpcUrls` está vacío en la configuración desplegada | El código admite respaldo de lectura, pero la operación pública utiliza un solo RPC | Configurar y ensayar al menos un RPC Testnet alternativo; mantener escrituras en el principal |
| Media | No hay integración continua versionada en `.github/workflows` | Las comprobaciones dependen de ejecución manual | Añadir CI para pruebas, compilación y empaquetado sin secretos |
| Media | Falta el ensayo real de vencimiento y devolución | La ruta contractual está probada en Rust, pero no demostrada con Freighter | Completar el runbook de devolución en Testnet |
| Media | No se ha ensayado recuperación o restauración del almacenamiento | Persistencia comprobada no equivale a recuperación probada | Crear un simulacro controlado y registrar tiempos y resultados |
| Baja | Los bundles principales superan 500 kB minificados | Carga inicial mayor de la necesaria | Separar Stellar/Freighter y vistas secundarias mediante importación dinámica |
| Baja | Soroban advierte que `events().publish` está obsoleto | Deuda de mantenimiento, sin fallo actual | Migrar solo en una versión contractual futura revisada y redesplegada |
| Baja | `cargo fmt --check` propone cambios de formato extensos | Estilo Rust no normalizado | No reformatear el contrato congelado solo por estética; aplicarlo en la siguiente versión contractual |

## Estado del árbol de trabajo

Los cambios de esta revisión afectan únicamente documentación y sus salidas generadas. Hay tres archivos ajenos a ArenaPay sin versionar en la raíz (`Guia_Completa_Clean_Architecture_CSharp.docx`, `Guia_Contratos_Clean_Architecture_CSharp.docx` y `crear_guia_clean_architecture.py`). No se modificaron ni se incorporaron a la entrega. Conviene moverlos a su proyecto correspondiente o decidir expresamente si deben ignorarse.

## Incorporar otro juego

### Lo que se conserva

- Contrato Soroban, depósitos, presupuesto, cancelación y pago único.
- Firma del árbitro vinculada a red, contrato, partida, versión del motor, compromiso, ganador y hash.
- Backend persistente, integración Freighter, reconciliación de escrituras y lecturas RPC.
- Patrón de replay, serialización canónica, verificación y recorrido de interfaz.

### Lo que debe desacoplarse primero

`ENGINE_VERSION`, `replaySchema`, políticas, estado de arena, ejecución y renderizado están ligados al juego actual. El segundo motor necesita un registro similar a:

```ts
interface GameEngine<State, Move, Replay> {
  id: string;
  create(seed: number, nonce: string): State;
  apply(state: State, move: Move): State;
  isFinished(state: State): boolean;
  winner(state: State): 'A' | 'B';
  buildReplay(state: State): Replay;
  verifyReplay(replay: Replay): boolean;
}
```

Cada motor debe tener identificador único, esquema propio, replay versionado, verificador, renderizador y barrido de determinismo. Los replays históricos del motor de arena deben seguir verificándose con su implementación exacta.

## Comparación de los juegos propuestos

| Juego | Encaje con el contrato actual | Complejidad | Decisión |
|---|---|---:|---|
| Póker | Bajo | Muy alta | No usar como segundo juego. Exige barajado verificable, cartas privadas, apuestas laterales, abandonos, varios participantes y reparto de botes. Una versión seria requiere un protocolo criptográfico y cambios contractuales. |
| Ajedrez | Alto para dos jugadores | Alta | Viable después de crear salas y turnos. Debe resolver tablas, reloj, abandono, repetición, promoción y versión exacta de reglas. Es el candidato con mayor reconocimiento público. |
| Damas chinas, dos jugadores | Alto | Media | Viable con el contrato actual: información pública, sin azar y un ganador. Hay que fijar tablero, saltos, bloqueo y límite de turnos. Para 3–6 jugadores sí habría que rediseñar el contrato. |

Entre estas tres opciones, **damas chinas para dos jugadores** es el camino técnico más directo. **Ajedrez** ofrece una demostración más reconocible, pero debe llegar después de estabilizar la infraestructura de turnos. **Póker** debe quedar para una fase futura específica de juegos con información oculta.

## Secuencia recomendada

1. Añadir rutas compartibles por partida y probar dos dispositivos.
2. **Completado el 21-sep-2026:** definir `GameEngine` y un registro de motores sin alterar el contrato.
3. Implementar un motor pequeño de referencia —Hex o Connect Four siguen siendo mejores para validar el registro—.
4. Si se elige entre los tres juegos planteados, implementar damas chinas para dos jugadores.
5. Añadir salas, turnos, reloj, reconexión y abandono.
6. Incorporar ajedrez con una política explícita para tablas.
7. Evaluar póker únicamente con un diseño separado de privacidad, azar verificable y múltiples participantes.

## Veredicto

El repositorio está en buen estado para conservar la entrega de la hackatón y comenzar una etapa posterior. La frontera multimotor ya existe; la siguiente ampliación debe registrarse como un adaptador y no escribirse directamente dentro de `simulation.ts`. El contrato actual puede mantenerse para damas chinas de dos jugadores y ajedrez siempre que cada partida termine con un único ganador; póker no cabe honestamente en ese alcance sin un rediseño importante.
