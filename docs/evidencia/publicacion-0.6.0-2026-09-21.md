# Publicación de ArenaPay 0.6.0 — 21 de septiembre de 2026

## Motivo

Una partida real de Testnet terminó 6–3 con los doce recursos todavía sobre el tablero. Al reproducir su replay se comprobó que los dos agentes habían dejado de moverse en el **tick 6 de 60**: el 90 % de la competición transcurrió con el tablero congelado.

## La causa

En `resource-arena/2.0.0`, cuando Atlas y Nova proponían entrar en la misma casilla, no se movía ninguno:

```ts
if (!sameCell(next.A, next.B)) {
  Object.assign(state.agents.A, next.A); Object.assign(state.agents.B, next.B);
}
```

La intención era correcta —dos agentes no pueden compartir casilla— pero la regla no tenía desempate. Las políticas son deterministas y solo leen el estado anterior al tick, de modo que, si el estado no cambiaba, al tick siguiente repetían la decisión. El bloqueo era permanente. El caso típico es un recurso equidistante: ambos avanzan hacia él, chocan a dos casillas y ahí se quedan.

`resource-arena/1.0.0` no tenía este problema porque aplicaba siempre los dos movimientos y solo alternaba la prioridad de recogida. El bloqueo lo introdujo la regla de no solapamiento de 2.0.0.

### Alcance medido

Barrido de 200 semillas con las mismas políticas:

| Motor | Partidas con 10 o más ticks congelados | Ticks congelados de media | Puntos de media | Recursos sin recoger |
|---|---:|---:|---:|---:|
| `resource-arena/2.0.0` | **109 de 200** | 21,1 | 33,2 | 5,7 |
| `resource-arena/3.0.0` | **0 de 200** | 0,8 | 45,2 | 0,5 |

La semilla `4214622373` de la partida observada pasa de detenerse en el tick 6 y terminar 6–3, a moverse hasta el tick 58 y terminar 21–19 sin recursos pendientes.

## Corrección

Motor nuevo `resource-arena/3.0.0`, idéntico a 2.0.0 salvo en el desempate. Cuando ambos piden la misma casilla decide la **prioridad alternante por paridad del tick**, la misma que ya ordenaba la recogida de recursos: en los ticks pares entra A, en los impares B, y el otro cede conservando su casilla. Si quien cede ya estaba quieto en la casilla disputada, el otro tampoco avanza, de modo que se mantiene la garantía de que los agentes nunca se solapan.

`resource-arena/2.0.0` queda registrado como **histórico**, con sus reglas intactas y sin admitir partidas nuevas. Detalle en [el documento del motor](../arquitectura/motores/motor-v3.md).

## Compatibilidad de la evidencia

Las partidas anteriores siguen siendo válidas y verificables. Se comprobó explícitamente que los tres replays publicados continúan validando contra su propio motor:

| Replay | Motor | Resultado |
|---|---|---|
| `testnet-replay.json` | `resource-arena/1.0.0` | válido |
| `testnet-replay-v2.json` | `resource-arena/2.0.0` | válido |
| `testnet-replay-v2-manual.json` | `resource-arena/2.0.0` | válido |

El vídeo de demostración conserva su valor: muestra un recorrido real de creación, financiación, competición, verificación y liquidación que sigue siendo reproducible. Su partida se ejecutó con 2.0.0, que ahora es histórico; el ensayo manual asociado se movió hasta el tick 52 de 60, así que la competición que se ve en pantalla no está afectada por el bloqueo. Una partida nueva grabada hoy usaría 3.0.0 y mostraría un tablero más disputado.

## Verificación

- `npm test`: 102 pruebas superadas.
- `npx playwright test`: 11 pruebas de navegador superadas.
- Pruebas nuevas: el motor retirado se congela en la semilla observada y el vigente no; ninguna de cinco semillas dispares se congela; la evidencia de 2.0.0 sigue validando; 2.0.0 rechaza partidas nuevas; toda versión registrada tiene renderizador.
- La prueba de casilla disputada afirma ahora el comportamiento de los dos motores a la vez, para que 2.0.0 no pueda cambiar sin que se note.

## Despliegues

La versión se publica en el repositorio privado y en el clon público siguiendo la guía [de flujo de desarrollo y publicación](../guias/flujo-desarrollo-y-publicacion.md). Vercel y Cloudflare usan la compilación operativa; GitHub Pages mantiene la compilación pública.
