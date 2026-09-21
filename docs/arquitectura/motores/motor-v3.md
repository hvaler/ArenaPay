# Motor `resource-arena/3.0.0`

Motor vigente para partidas nuevas desde el 21 de septiembre de 2026. Mantiene las reglas de [`resource-arena/2.0.0`](motor-v2.md) y cambia una sola: cómo se resuelve que los dos agentes pidan la misma casilla en el mismo tick.

## Qué cambió y por qué

En 2.0.0, si Atlas y Nova proponían entrar en la misma casilla, **no se movía ninguno**:

```ts
if (!sameCell(next.A, next.B)) {
  Object.assign(state.agents.A, next.A); Object.assign(state.agents.B, next.B);
}
```

La intención era correcta: dos agentes no pueden ocupar la misma casilla, y dejar avanzar solo a uno podría colocarlo sobre la casilla que el otro acababa de dejar. El problema es que la regla no tenía desempate. Las dos políticas son deterministas y solo leen el estado anterior al tick, así que, si el estado no cambiaba, al tick siguiente volvían a decidir lo mismo. La partida se detenía y ya no se reanudaba nunca.

El caso típico es un recurso equidistante entre ambos: cada uno avanza hacia él, chocan a dos casillas de distancia y se quedan ahí hasta el tick 60.

### Alcance medido

Sobre 200 semillas, comparando ambos motores con las mismas políticas:

| | Partidas con 10 o más ticks congelados | Ticks congelados de media | Puntos de media | Recursos sin recoger |
|---|---:|---:|---:|---:|
| `resource-arena/2.0.0` | **109 de 200** | 21,1 | 33,2 | 5,7 |
| `resource-arena/3.0.0` | **0 de 200** | 0,8 | 45,2 | 0,5 |

Una partida real de Testnet, la semilla `4214622373`, se detuvo en el tick 6 de 60 y terminó 6–3 con los doce recursos sobre el tablero. Con 3.0.0 esa misma semilla se mueve hasta el tick 58 y termina 21–19 sin recursos pendientes.

## La regla nueva

Cuando ambos piden la misma casilla, decide la **prioridad alternante por paridad del tick**, la misma que ya ordenaba la recogida de recursos: en los ticks pares entra A, en los impares entra B. El otro agente cede y conserva su casilla.

```ts
const order: Player[] = state.tick % 2 === 0 ? ['A', 'B'] : ['B', 'A'];
if (sameCell(next.A, next.B)) {
  const [entra, cede] = order;
  next[cede] = { ...state.agents[cede] };
  if (sameCell(next[entra], next[cede])) next[entra] = { ...state.agents[entra] };
}
```

La segunda comprobación cubre el caso de que quien cede ya estuviera quieto en la casilla disputada: entonces tampoco avanza el otro. Así se conserva la garantía que buscaba 2.0.0 —los agentes nunca se solapan— sin crear un punto muerto.

Un intercambio entre dos casillas distintas sigue permitido, como antes.

## Qué no cambió

- Rejilla de 8 × 8, 60 ticks, recursos de 1 a 3 puntos, doce iniciales y reaparición cada cinco ticks.
- Políticas `collector-v1` para Atlas y `tactician-v1` para Nova, sin cambios.
- Compromiso de semilla con nonce, formato de replay `resource-arena-replay/2`, hash del estado final y desempate del ganador por paridad de la semilla.
- El contrato Soroban, que es agnóstico al tablero y no se redesplegó.

## Compatibilidad

`resource-arena/2.0.0` queda registrado como **histórico**: no admite partidas nuevas y conserva sus reglas exactas, porque la evidencia publicada se verifica contra ellas. Los tres motores conviven en el registro y cada replay se verifica con el suyo, declarado en su propio `engineVersion`.

Una partida creada con 2.0.0 sigue verificando, y su recibo de Testnet sigue siendo válido: el bloqueo hacía la competición aburrida, no incorrecta. Las pruebas comprueban las dos cosas a la vez — que 3.0.0 no se congela y que la evidencia de 2.0.0 sigue validando.

Véanse también el [motor v2](motor-v2.md), las [reglas históricas v1](motor-v1-reglas.md) y el [protocolo y versionado](../protocolo-y-versionado.md).
