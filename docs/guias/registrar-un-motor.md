# Registrar un motor nuevo en ArenaPay

Fecha: 21 de septiembre de 2026.

Esta guía explica cómo añadir una versión de reglas o un juego determinista sin acoplarlo al
coordinador, al árbitro ni al contrato Soroban. Complementa la decisión registrada en
[ADR-006](../adr/ADR-006-frontera-y-registro-de-motores.md).

## Qué existe actualmente

La plataforma separa tres piezas:

| Pieza | Ruta | Responsabilidad |
|---|---|---|
| Contrato común | `src/packages/shared/src/game-engine.ts` | Define las operaciones que debe ofrecer un motor y mantiene el registro por versión |
| Adaptador de la arena | `src/packages/shared/src/engines/resource-arena.ts` | Registra `resource-arena/1.0.0` y `resource-arena/2.0.0` |
| Reglas vigentes | `src/packages/shared/src/engines/resource-arena-v2.ts` | Ejecuta la rejilla, genera movimientos y verifica su replay |

`src/packages/shared/src/simulation.ts` es una fachada de compatibilidad para la web y los
consumidores existentes. No deben añadirse reglas nuevas allí.

## Dos clases de ampliación

### Nueva versión del mismo juego

Se crea cuando cambia una regla capaz de alterar movimientos, estado, ganador, compromiso o hash.
Debe usar otra versión, por ejemplo `resource-arena/3.0.0`. Los motores anteriores permanecen
congelados para reproducir evidencia histórica.

### Juego diferente

Debe usar una identidad propia, por ejemplo `hex/1.0.0`. Además del adaptador necesita nuevos tipos,
esquema de replay, representación visual y pruebas. El sobre de evidencia actual está tipado para la
arena; por tanto, el primer juego nuevo debe generalizar ese sobre en `contracts.ts` sin modificar
los formatos v1 y v2 existentes.

## Contrato que debe implementar

Cada adaptador implementa `GameEngine`:

```ts
export interface GameEngine<TReplay, TState, TInput, TWinner> {
  readonly version: string;
  readonly requiresSecret: boolean;
  initialState(seed: number): TState;
  run(seed: number, inputs: readonly TInput[]): EngineRun<TState, TWinner>;
  createSecret(): string | undefined;
  seedCommitment(seed: number, secret?: string): Promise<string>;
  buildReplay(matchId: string, seed: number, secret?: string): Promise<TReplay>;
  verifyReplay(raw: unknown, expectedSeedHash?: string): Promise<EngineVerification<TState, TWinner>>;
}
```

El adaptador debe validar el replay antes de ejecutarlo. El registro no confía en los datos ni
intenta interpretar movimientos de un juego concreto.

## Pasos para añadirlo

1. **Asignar una versión inmutable.** No reutilizar una identidad publicada, aunque el cambio parezca pequeño.
2. **Definir estado, entradas y replay.** Usar esquemas estrictos y conservar los esquemas históricos sin cambios.
3. **Implementar reglas deterministas.** Usar enteros y un orden explícito. No usar `Math.random`, reloj, configuración regional ni red.
4. **Implementar el adaptador.** Crear el archivo en `src/packages/shared/src/engines/` y cumplir `GameEngine`.
5. **Registrar una sola vez.** Importar `registerGameEngine` y registrar el adaptador junto con su versión.
6. **Integrar persistencia y API.** Permitir que la partida conserve la versión seleccionada; nunca inferirla del contenido del replay.
7. **Añadir el renderizador.** La web debe elegir tablero, controles y longitud de reproducción mediante la identidad del juego.
8. **Crear vectores de regresión.** Guardar al menos un replay estable con compromiso, ganador y hash final conocidos.
9. **Probar versiones incompatibles.** Rechazar versiones desconocidas, campos extra, entradas incompletas y replays modificados.
10. **Documentar las reglas.** Añadir el motor a `docs/arquitectura/motores/`, a este índice y a la matriz de juegos.

Ejemplo mínimo de registro:

```ts
export const hexV1: GameEngine<HexReplay, HexState, HexMove, HexPlayer> = {
  version: 'hex/1.0.0',
  requiresSecret: true,
  initialState,
  run,
  createSecret,
  seedCommitment,
  buildReplay,
  verifyReplay,
};

registerGameEngine(hexV1);
```

## Reglas de compatibilidad

- No editar `simulation-v1.ts`: reproduce recibos históricos.
- No cambiar las reglas de `resource-arena-v2.ts` manteniendo su versión actual.
- La versión del replay debe coincidir con la almacenada por la partida y con la incluida en la firma.
- Un cambio de renderizado que no altera el estado puede conservar versión; un cambio de reglas debe crear otra.
- El contrato actual admite dos participantes y paga a un único ganador. Empates repartidos o más jugadores requieren otro contrato.

## Comprobación antes de integrar

```sh
npm test
npm run build
npm run build:public
npm run build:operational
npm run test:e2e
```

Además deben compararse los vectores históricos v1 y v2. Un motor nuevo no puede cambiar sus hashes,
ganadores ni compromisos.

## Orden recomendado para el segundo juego

Hex o Connect Four son las mejores primeras pruebas: dos participantes, información pública y reglas
acotadas. Ajedrez requiere resolver tablas, reloj y abandono. Póker necesita privacidad, azar
verificable, apuestas y varios participantes, por lo que no debe tratarse como un simple adaptador.
