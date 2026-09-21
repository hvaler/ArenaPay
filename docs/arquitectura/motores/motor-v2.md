# Motor `resource-arena/2.0.0`

> **Motor retirado el 21 de septiembre de 2026.** Las partidas nuevas usan
> [`resource-arena/3.0.0`](motor-v3.md), que corrige un empate de casilla capaz de detener la
> competición hasta el final. Este motor sigue registrado como histórico y con sus reglas intactas:
> la evidencia publicada se verifica contra ellas y continúa siendo válida.

Motor de simulación de las partidas creadas hasta el 21 de septiembre de 2026. Sus reglas viven en
[`src/packages/shared/src/engines/resource-arena-v2.ts`](../../../src/packages/shared/src/engines/resource-arena-v2.ts) y se ejecutan sin cambios
en Node y en el navegador, que es lo que permite al jurado reproducir una partida en su propia
máquina y obtener el mismo hash.

La interfaz común y el registro están en [`game-engine.ts`](../../../src/packages/shared/src/game-engine.ts);
[`simulation.ts`](../../../src/packages/shared/src/simulation.ts) conserva la API anterior como
fachada. La decisión se documenta en [ADR-006](../../adr/ADR-006-frontera-y-registro-de-motores.md).

La v2 nació de [tres hallazgos de auditoría](../../seguridad/auditoria-correcciones-2026-09-12.md). No es una
versión con funcionalidad nueva: **es la corrección de tres defectos** del motor anterior, que se
conserva congelado en [`simulation-v1.ts`](../../../src/packages/shared/src/simulation-v1.ts).

---

## Qué simula el motor

Una **carrera de recolección sobre una rejilla, sin combate**. Dos agentes recorren un tablero de
8 × 8 recogiendo recursos durante 60 ticks, y gana quien más puntos acumula. No hay ataques, ni
vida, ni forma alguna de que un agente dañe al otro: la única línea de todo el motor que modifica
un marcador es la que recoge un recurso.

```ts
state.agents[player].score += state.resources.splice(index, 1)[0].value;
```

### El tablero

- Coordenadas enteras 0–7. **Atlas (A)** arranca en (0,0), **Nova (B)** en (7,7), ambos a cero.
- 12 recursos iniciales de valor 1, 2 o 3. Tanto la casilla como el valor salen del PRNG
  (`free[random() % free.length]` y `1 + random() % 3`), y nunca aparecen bajo un agente ni sobre
  otro recurso.
- Distancias Manhattan en todas partes. Movimientos `UP` / `DOWN` / `LEFT` / `RIGHT` / `STAY`, con
  saturación en los bordes: empujar contra un muro equivale a quedarse quieto.
- La reposición —un recurso tras los ticks 5, 10, … 55, y solo si quedan menos de 12— no compensa
  las recolecciones. **La arena se vacía a medida que avanza la partida**, y eso es lo que da
  tensión al final.

### Qué ocurre en un tick

`step()` hace exactamente cinco cosas, siempre en este orden:

1. **Propone** los dos destinos, ambos calculados sobre el mismo estado previo.
2. **Los resuelve a la vez**, con la regla de colisión de la sección 2.
3. **Recoge**: cada agente que esté sobre un recurso lo suma y el recurso desaparece.
4. **Incrementa** el tick.
5. **Repone**, si toca.

### Las dos políticas

Son heurísticas deterministas de una línea. No hay búsqueda ni planificación: ambas eligen primero
un objetivo y luego el movimiento que más las acerca a él.

| Agente | Política | Utilidad de un recurso `r` |
|---|---|---|
| Atlas | `collector-v1` | `-distance(position, r)` |
| Nova | `tactician-v1` | `r.value * 4 - distance(position, r) * 2 + Math.min(3, distance(rival, r))` |

Atlas es codicioso puro: va al recurso más cercano e ignora tanto su valor como al rival. Nova
pondera, y los coeficientes se leen así: **un punto de valor compensa dos casillas de distancia**
(4 ÷ 2), de modo que un recurso de valor 3 merece la pena aunque esté cuatro casillas más lejos que
uno de valor 1.

Los empates entre recursos se rompen por `(y, x)`, y el movimiento se elige recorriendo
`UP, LEFT, DOWN, RIGHT, STAY` y quedándose con el primero de puntuación máxima. Nada depende del
orden de iteración de un objeto ni de que `sort` sea estable.

Conviene no sobreinterpretar el término de rival en la elección de movimiento: la distancia al
objetivo pesa ×10 y la bonificación por alejarse del rival está saturada en 3, así que **nunca
cambia un movimiento de Nova, solo desempata** entre movimientos equidistantes del objetivo.

### El motor no conoce las políticas

`runSimulation` no llama a `chooseMove` ni una sola vez: recibe 120 movimientos ya grabados y los
puntúa. `chooseMove` lo usa únicamente `buildReplay`, al generar la partida.

| Función | Qué hace |
|---|---|
| `runSimulation(seed, inputs)` | Reconstruye la arena desde la semilla, exige exactamente 120 entradas sin duplicados y devuelve `{ state, frames, winner }`. `frames` son 61 instantáneas —la inicial más una por tick— y es lo que alimenta el reproductor de la web. |
| `buildReplay(matchId, seed, nonce)` | Recorre los 60 ticks consultando a cada política, y después **vuelve a simular** con `runSimulation` sobre los movimientos que acaba de grabar, para comprobar que el registro reproduce el resultado antes de firmarlo. |
| `verifyReplay(raw, expectedSeedHash?)` | Revalida el esquema, reejecuta y comprueba cuatro cosas: el hash del estado final, el ganador, el compromiso de semilla y —si se le pasa— que ese compromiso sea el registrado en cadena. |

Esa separación es la que sostiene la frase «torneo para agentes». Hoy las dos políticas son
heurísticas triviales, pero el motor puntuaría exactamente igual una lista de movimientos producida
por un modelo, por un humano o por cualquier otro programa. El motor no es el jugador: es el
**reglamento reproducible** contra el que cualquiera puede comprobar una partida ajena.

---

## 1. El generador pseudoaleatorio

**El problema en v1.** El estado inicial del PRNG era la semilla, salvo cuando la semilla era cero:

```ts
// simulation-v1.ts
rng: seed || 0x9e3779b9
```

Como `0` es un valor *falsy* en JavaScript, la semilla 0 se sustituía por `0x9e3779b9`. **Dos
semillas distintas producían exactamente la misma arena.** Y el hash final incluía la semilla
*declarada*, así que podía ocultar esa igualdad: dos partidas idénticas con hashes distintos.

**La corrección en v2.** Mulberry32, con el estado inicial igual a la semilla, el cero incluido:

```ts
// simulation.ts
rng: seed
// ...
function random(state: ArenaState): number {
  // Full 32-bit state, including zero; no fallback that aliases another seed.
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let n = state.rng;
  n = Math.imul(n ^ (n >>> 15), n | 1);
  n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
  return (n ^ (n >>> 14)) >>> 0;
}
```

El algoritmo anterior era xorshift32 (`n ^= n << 13; n ^= n >>> 17; n ^= n << 5`). Ambos son
deterministas y trabajan en uint32; ninguno es un generador criptográfico. La confidencialidad del
resultado no descansa en el PRNG, sino en que la semilla quede reservada y en el nonce.

---

## 2. La superposición de agentes

**El problema en v1.** Cada movimiento se aplicaba por separado, en orden A y luego B:

```ts
// simulation-v1.ts
for (const input of [...inputs].sort((a, b) => a.player < b.player ? -1 : 1)) {
  Object.assign(state.agents[input.player], destination(state.agents[input.player], input.move));
}
// Movement is simultaneous; collection priority alternates to resolve shared cells.
```

Aunque las decisiones partían del mismo estado previo, faltaba una regla de exclusión: **los dos agentes podían acabar en la misma
celda**, y lo único que se alternaba era quién recogía el recurso. La primera superposición aparecía
con la semilla 0 en el tick 16.

**La corrección en v2.** Los dos destinos se calculan sobre el mismo estado previo y se resuelven a
la vez:

```ts
// simulation.ts
const next = { A: { ...state.agents.A }, B: { ...state.agents.B } };
for (const input of inputs) Object.assign(next[input.player], destination(state.agents[input.player], input.move));
// Resolve both proposals atomically. If they target one cell, both stay;
// allowing just one to move could put it on the blocked player's old cell.
// Swaps between two distinct cells are allowed.
if (!sameCell(next.A, next.B)) {
  Object.assign(state.agents.A, next.A); Object.assign(state.agents.B, next.B);
}
```

El detalle fino está en el comentario del código: **si los dos apuntan a la misma casilla, ninguno
se mueve**. Dejar avanzar solo a uno podría colocarlo sobre la celda que el otro conserva al quedar bloqueado. Los intercambios de posición sí se
permiten, porque terminan en celdas distintas.

---

## 3. El compromiso de semilla

**El problema en v1.** El compromiso era el hash de la versión y la semilla, sin sal:

```ts
// simulation-v1.ts
sha256Hex(canonicalJson({ engineVersion, seed }))
```

La semilla es un `uint32`, así que bastaba probar valores hasta dar con el hash publicado:
**el compromiso podía enumerarse sobre un espacio de 2³² semillas; no se ha medido aquí el tiempo necesario**. Y agravándolo, la semilla la elegía el cliente y
la API la devolvía antes de financiar la partida.

**La corrección en v2.** Se añade un nonce aleatorio criptográfico de 32 bytes:

```ts
// simulation.ts
export function createNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}

export async function seedCommitment(seed: number, nonce: string): Promise<string> {
  seedSchema.parse(seed);
  nonceSchema.parse(nonce);
  return sha256Hex(canonicalJson({ engineVersion: ENGINE_VERSION, seed, nonce }));
}
```

El nonce son 64 caracteres hexadecimales en minúsculas, y el esquema lo exige
(`/^[a-f0-9]{64}$/`). Un nonce ausente, mal formado o alterado invalida el replay.

**Pero el nonce solo no bastaba.** El arreglo incluyó tres cambios más en el flujo:

- En Testnet **el servidor genera la semilla** con `randomInt(2^32)`. La creación acepta solo
  participantes e inscripción, y **rechaza** el campo `seed`.
- La API publica el compromiso, pero **oculta semilla y nonce** hasta que existe el replay.
- El motor exige ambos depósitos confirmados y plazo vigente antes de ejecutar.

Hubo además un cuarto hallazgo relacionado: el servidor de desarrollo de Vite servía
`/@fs/.../data/matches/<id>.json`, **exponiendo el nonce aunque la API lo ocultara**. Se restringió
`fs.allow` y se denegó `data/`, con un escenario de navegador que exige un 403.

En la práctica local se sigue admitiendo una semilla elegida, y ahí **no se promete secreto** frente
a quien usa el navegador.

---

## Lo que no cambió

Se conservan estas reglas; el PRNG y la resolución de colisiones sí cambiaron:

- Rejilla 8 × 8, coordenadas enteras 0–7. Atlas empieza en (0,0) y Nova en (7,7), con cero puntos.
- 60 ticks. El tick es una unidad lógica; la velocidad de reproducción no altera el resultado.
- 12 recursos de valor 1–3. Reposición en los ticks 5, 10, … 55 si quedan menos de 12.
- Movimientos `UP` / `DOWN` / `LEFT` / `RIGHT` / `STAY`, con saturación en los bordes.
- Recolección con prioridad alternada: A/B en ticks pares, B/A en impares. En v1 resolvía la
  llegada simultánea a un mismo recurso, porque los agentes podían superponerse. **En v2 ya no
  altera ningún resultado**: la regla de colisión garantiza que nunca comparten casilla y cada
  casilla tiene como mucho un recurso, así que cada agente encuentra uno distinto o ninguno. Es un
  vestigio inofensivo, no una regla activa.
- Políticas `collector-v1` (Atlas) y `tactician-v1` (Nova). Son **heurísticas deterministas**, no
  modelos de lenguaje.
- Desempate por paridad de la semilla. Es una regla de demo, pública antes de ejecutar, y no
  pretende ser una fuente de aleatoriedad imparcial para premios reales.
- Solo aritmética entera. Sin fechas, sin red, sin `Math.random`.
- El registro debe contener exactamente un movimiento por tick y jugador: 120 entradas. El orden
  del array de entrada no influye en el resultado.

**Consecuencia importante:** al cambiar el PRNG y la regla de colisión, **v2 puede producir
marcadores distintos de v1 para la misma semilla**. No es un fallo; son motores distintos.

---

## Convivencia con v1

v1 no se borró. El registro selecciona su adaptador por la versión declarada, no por configuración:

```ts
export function getGameEngine(version: string) {
  const engine = engines.get(version);
  if (!engine) throw new Error('Versión de motor desconocida.');
  return engine;
}
```

Los esquemas lo refuerzan: el de v2 **exige** `nonce` y el de v1 **no lo admite**. Cambiar la
etiqueta de versión de un replay antiguo no sirve para validarlo contra un compromiso v2.

Las partidas v1 ya persistidas pueden completarse con sus reglas originales, pero **conservan la
debilidad del compromiso enumerable y no deben anunciarse como protegidas por nonce**. La API no
crea partidas v1 nuevas.

El replay histórico v1 se conserva en
[`docs/evidencia/fixtures/testnet-replay.json`](../../evidencia/fixtures/testnet-replay.json) como vector de regresión:
`src/packages/shared/test/simulation.test.ts` comprueba que el motor congelado sigue reproduciendo sus
hashes.

---

## Qué no resuelve la v2

Por si alguien lee esto esperando más de lo que hay:

- **El operador conoce la semilla.** El nonce impide enumerar el compromiso desde fuera, pero no
  aporta aleatoriedad descentralizada ni neutralidad frente a quien opera el servidor.
- **El PRNG no es criptográfico.** Es determinista y reproducible, que es lo que se necesita; no
  sirve como fuente de entropía.
- **El barrido de 1 000 semillas no demuestra ausencia de errores** en las 2³² posibles, ni
  igualdad estadística entre las dos políticas.

---

## Verificación

La suite permanente ejecuta 1 000 semillas y comprueba, en cada una:

- Que el replay verifica su propio hash, ganador y compromiso.
- Que no hay hashes finales repetidos ni arenas iniciales repetidas, **sin apoyarse en el campo
  `seed`** para distinguirlas.
- Que todas las coordenadas son enteras y están dentro de la rejilla en todos los ticks.
- Que **no hay casillas compartidas** en ningún tick.
- Que cada política gana al menos una vez.

Hay además regresiones específicas para la semilla cero frente al antiguo valor de sustitución, los
extremos del `uint32`, destinos en conflicto y un jugador inmóvil.

```sh
npm test    # incluye el barrido; el caso de 1 000 semillas tiene 60 s de timeout
```

---

## Referencias

- [Auditoría y correcciones del 12-sep-2026](../../seguridad/auditoria-correcciones-2026-09-12.md) — los tres
  hallazgos, con la tabla cuantitativa del barrido de determinismo.
- [`src/packages/shared/src/engines/resource-arena-v2.ts`](../../../src/packages/shared/src/engines/resource-arena-v2.ts) — reglas del motor v2.
- [`src/packages/shared/src/simulation.ts`](../../../src/packages/shared/src/simulation.ts) — fachada compatible.
- [`src/packages/shared/src/simulation-v1.ts`](../../../src/packages/shared/src/simulation-v1.ts) — motor
  congelado.
- [Análisis y decisiones](../analisis-y-decisiones.md) — las contradicciones detectadas en la propuesta
  original y cómo se resolvieron.
