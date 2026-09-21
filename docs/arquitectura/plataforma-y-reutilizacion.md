# ArenaPay como plataforma: reutilización y evolución

> Documento de análisis de evolución. El MVP y el contrato actual están implementados; los motores adicionales, agentes externos, salas y jugadores humanos descritos aquí permanecen en la hoja de ruta.
> Fecha: 13 de septiembre de 2026.

Para una explicación introductoria, una guía de prueba con dos dispositivos y una lista comparada
de juegos, consulta [Reutilizar ArenaPay en otros juegos y con jugadores humanos](reutilizacion-juegos-y-jugadores.md).
La secuencia de producto, los hitos y las posibles vías de financiación se mantienen por separado en
la [hoja de ruta posterior a la hackathon](../producto/roadmap-post-hackathon.md).

## Qué es ArenaPay realmente

Buscar en el contrato cualquier término del juego —tick, rejilla, recurso, movimiento, agente—
devuelve **cero resultados**. Lo que `src/contracts/arena_escrow/src/lib.rs` guarda por partida es esto,
y nada más:

```rust
pub struct MatchRecord {
    pub player_a: Address, pub player_b: Address, pub buy_in: i128,
    pub engine_version: String, pub seed_hash: BytesN<32>, pub timeout_ledger: u32,
    pub funded_a: bool, pub funded_b: bool, pub status: MatchStatus,
    pub winner: Option<Address>, pub final_state_hash: Option<BytesN<32>>,
}
```

`engine_version` es una cadena libre —el contrato solo exige entre 1 y 64 caracteres
(`lib.rs:114`)— y `final_state_hash` son 32 bytes opacos. Al contrato le da exactamente igual si esos
bytes resumen una rejilla de recursos, una partida de ajedrez o una carrera.

**Conclusión: ArenaPay no es un torneo de una arena 8×8. Es una capa de liquidación verificable para
juegos deterministas, y la arena es su demostración.** El juego es el enchufe, no el producto.

---

## Qué se reutiliza

### Sin tocar una línea

| Componente | Por qué es agnóstico |
|---|---|
| **El contrato entero** | No contiene ninguna referencia al juego |
| **El árbitro y la preimagen** | Firma red, contrato, partida, versión de motor, compromiso, ganador y hash. Ninguno es del juego |
| **El presupuesto autorizado** | Token, importe máximo y vigencia |
| **La salida anti-bloqueo** | `cancel_match` desde `Funded` |
| **El hash canónico** | JSON canónico con orden por unidad de código (`src/packages/shared/src/hash.ts`). Sirve para cualquier forma de estado |
| **La idea del replay** | El patrón compromiso → inputs → estado final → hash se conserva; el esquema actual fija motores y políticas de la arena |
| **La UX de verificación** | El recorrido «reejecútalo y compara el hash» se conserva; el verificador concreto debe cargar el motor correcto |

### Lo que se escribe por juego

Las reglas (`src/packages/shared/src/engines/resource-arena-v2.ts`), los tipos de movimiento y entrada, el renderizador
del tablero (`src/apps/web/src/components/Arena.tsx`) y las políticas. Es decir: el juego.

### Una propiedad que ya está resuelta

`engineVersion` viaja **dentro de la preimagen firmada**: `src/packages/shared/src/stellar.ts` la
incluye como `sc.text(...)`, y el contrato la incorpora al vector XDR que verifica
(`lib.rs:64`). Por tanto, si cada juego usa una versión única, **una firma emitida para uno no vale
para otro**, igual que no vale en otra red ni en otro despliegue. El protocolo ya aporta esa
separación; el registro de motores debe garantizar que dos juegos no reutilicen el mismo valor.

---

## Qué debe cumplir un juego nuevo

Aquí está el límite real, y conviene no minimizarlo:

- **Determinista.** Solo aritmética entera; sin `Math.random`, sin fechas, sin `Intl` ni
  `localeCompare`. Cualquiera de esas cosas rompe la reproducibilidad entre máquinas.
- **Isomorfo.** Idéntico en Node y en el navegador, sin `node:*`, porque el jurado reejecuta el mismo
  código en su equipo.
- **Acotado.** Número fijo de ticks, para que el vector de entradas tenga longitud conocida y la
  verificación termine siempre.
- **Dos jugadores, un ganador.** El contrato paga a una única dirección.

**Queda fuera** sin rediseño: tiempo real, física de coma flotante (salvo reescritura en punto fijo),
más de dos participantes, y empates con reparto del premio.

> Nota de disciplina: este repositorio confía en la revisión para mantener esas reglas. El proyecto
> gemelo ArenaPayOp va más lejos y las **impone con pruebas** que barren las fuentes y fallan si
> aparece cualquiera de esas construcciones. Para una plataforma con juegos de terceros, ese barrido
> automático deja de ser un lujo y pasa a ser imprescindible.

---

## Centralización

### Dos niveles de aislamiento

El camino funcional más barato es usar el mismo contrato y asignar un `engine_version` distinto a
cada juego. El contrato ya guarda esa versión por partida y la firma la cubre. Esto comparte admin,
árbitro, token y presupuesto entre juegos.

Si se busca aislamiento operativo, se puede desplegar **el mismo wasm una vez por juego**. No
requiere tocar Rust. Cada despliegue tiene su `contractId`, y como la firma cubre la dirección del
contrato, una resolución no cruza entre despliegues.

La alternativa —un registro de juegos dentro del contrato— choca con que `Config` se escribe solo en
`__constructor` y no hay ningún *setter*: sería un rediseño, no una ampliación.

Recomendación: **una clave de árbitro por juego**. Un árbitro multi-juego es un objetivo mucho más
goloso, y no es rotable sin redesplegar.

### El problema que solo aparece al centralizar

Hoy la verificabilidad se apoya en algo que no se suele enunciar: **el motor viaja en el mismo bundle
que el jurado descarga**. Verifica con el código que tiene delante, y por eso la comprobación
significa algo.

En un servicio genérico la pregunta pasa a ser *«¿con qué código estoy verificando?»*. La aplicación
resuelve ahora cada versión mediante el registro de `game-engine.ts`; v1 y v2 tienen adaptadores
separados y `simulation.ts` es solo una fachada compatible. Esto elimina el antiguo `if/else`, pero
el siguiente juego aún debe generalizar el esquema de evidencia, hoy específico de la arena.

La salida honesta es **direccionar el motor por contenido**: usar como `engine_version` un SHA-256
hexadecimal del paquete del motor, incluir el mismo valor en el replay y resolverlo desde un registro
de artefactos. Sus 64 caracteres caben en el límite actual y ya quedan firmados, por lo que esta
variante no requiere cambiar el contrato. Mantener además un nombre legible y un hash como campos
separados sí exigiría ampliar el protocolo.

---

## Jugadores humanos

### Atlas y Nova no sustituyen a nadie

Son dos políticas heurísticas deterministas y públicas. Y hay un matiz que cambia la
lectura del producto: **los humanos del flujo actual son propietarios, no jugadores**. Autorizan un
presupuesto y depositan la inscripción; inscriben y financian a su agente. El ensayo con dos cuentas Freighter
son dos propietarios enfrentando a dos programas.

### Por qué hacer jugar a personas cuesta más de lo que parece

El motor lo aceptaría —`runSimulation` puntúa 120 movimientos vengan de donde vengan—, pero falta
bastante más que una interfaz:

1. **No existe el envío de un movimiento.** `buildReplay` genera los 120 en un bucle síncrono: no hay
   turno, ni espera, ni tiempo límite.
2. **La simultaneidad se rompe.** Ambas políticas leen el mismo estado previo; con personas, quien
   envía segundo ve el movimiento del primero. Haría falta compromiso y revelación **por tick,
   sesenta veces**.
3. **Ni siquiera humano contra bot sería justo.** Las políticas son públicas y deterministas, así que
   el humano puede calcular exactamente qué hará el rival antes de decidir. Eso no es una partida, es
   un solitario.
4. **El compromiso de semilla cambia de significado.** Para jugar hay que ver la arena, luego la
   semilla se revela en el tick 0. El compromiso seguiría impidiendo que el operador cambiase la
   arena a posteriori, pero dejaría de ocultar nada a los jugadores.
5. **Las desconexiones** necesitan un movimiento por defecto, determinista y registrado en el replay.

### La conclusión

El diseño actual **ya es la solución al problema de la simultaneidad**: al hacer que los competidores
sean código entregado antes de empezar, no queda nada que ocultar en cada tick, y por eso la partida
entera se reproduce de un tirón. Poner personas a jugar tira justo esa propiedad por la borda.

La evolución natural no es «que jueguen personas», es **«que las personas presenten su propio
agente»**. El motor ya está listo: puntúa cualquier vector de entradas, venga de donde venga.

---

## Escalera de lo factible

Ordenada por coste creciente. Cada peldaño es independiente: se puede parar en cualquiera.

| Paso | Qué exige | Toca el contrato |
|---|---|---|
| **Un segundo juego** sobre el contrato actual | Escribir las reglas, los tipos y el tablero | No |
| **Varios juegos en paralelo** | Versiones únicas en un contrato compartido, o un despliegue por juego para aislar árbitros y presupuestos | No |
| **Agentes de terceros** | Ejecutar código ajeno de forma determinista y con límites de recursos. **La pieza grande** | No |
| **Verificación centralizada** | Motor direccionado por contenido mediante `engine_version`, replay y registro de artefactos | No; sí si se separan nombre y hash |
| **Humano contra bot** | Envío de movimientos, tiempo límite, y asumir la asimetría de información | No |
| **Humano contra humano** | Compromiso y revelación por tick, política de desconexión | No |
| **Más de dos jugadores, o empate repartido** | Rediseño del reparto del premio | Sí |

El peldaño de los agentes de terceros es el que convierte el proyecto en lo que promete su frase de
producto, y también el más difícil de todos: aislar código ajeno garantizando que sigue siendo
determinista y que no agota recursos es un problema por derecho propio.

---

## Decisión adoptada: cómo se presenta el proyecto

El 13 de septiembre de 2026 se adoptó el reencuadre híbrido y se registró en
[ADR-004](../adr/ADR-004-posicionamiento-de-plataforma.md). El cambio afecta a la descripción y la
navegación documental; no modifica contrato, hashes, replay ni evidencia histórica.

### Las tres redacciones

**A. La descripción original.** Conservada en las propuestas históricas.

> ArenaPay es un torneo verificable para agentes de IA: compiten de forma autónoma, el replay
> demuestra el resultado y Soroban liquida el premio automáticamente.

**B. El reencuadre completo.**

> ArenaPay es una capa de liquidación verificable para competiciones deterministas: el replay
> demuestra el resultado y Soroban retiene las inscripciones y paga al ganador.

**C. Plataforma con una demostración concreta** — decisión adoptada.

> ArenaPay es una plataforma para competiciones verificables sobre Soroban: registra un replay
> reproducible, protege las inscripciones en escrow y liquida el premio mediante una resolución
> firmada. Su MVP enfrenta a Atlas y Nova, dos agentes deterministas.

### Motivo de la decisión

Dos razones concretas, no de gusto.

**La primera: el posicionamiento anterior necesitaba una disculpa en el segundo párrafo.** La primera
viñeta de «Qué NO es» tenía que aclarar que *«los agentes no son modelos de lenguaje»*. Una frase de
producto que obliga a desdecirse acto seguido trabaja en contra del proyecto ante un jurado técnico.

**La segunda: la afirmación de capa de liquidación es la que está verificada.** El contrato no
contiene ninguna referencia al juego, `engine_version` es una cadena libre y la firma ata red,
contrato y versión de motor. Eso se demuestra en diez segundos delante de quien sea. «Agentes de IA»
no se puede demostrar, porque no lo son.

La C conserva lo que la B perdería: un jurado recuerda dos agentes en una rejilla, no una
abstracción. Y toda la evidencia, la demo y el vídeo están construidos sobre esa arena.

**El criterio que decide** es la lista de tracks. Si hay uno de infraestructura, pagos o contratos
inteligentes, la C o la B encajan mucho mejor que la A en una hackathon de Stellar. Si el track
premia explícitamente la IA, la A tiene sentido —a condición de sostener la aclaración con
naturalidad.

### Superficie actualizada

La frase **no es solo texto del README: vive en código y se renderiza en la web**.

| Fichero | Qué es |
|---|---|
| `src/packages/shared/src/contracts.ts` | La constante `PRODUCT_STATEMENT`, fuente de verdad de la web |
| `src/apps/web/src/App.tsx` | Renderiza la frase y el recorrido de producto |
| `README.md` | Resumen manual para GitHub |
| `docs/guias/demo-script.md` | Primera línea del guion |
| `src/apps/web/index.html` | Título «ArenaPay — Competiciones verificables» |
| `README.md`, «Resumen del proyecto» y «Qué NO es» | Alcance y límites de la presentación |

Las dos propuestas originales (`2026-09-11-arenapay-mvp.md` y `ArenaPay_Propuesta_Stellar_Odyssey.md`)
**no se tocan**: son documentos históricos de entrada.

### Qué NO cambia

Conviene decirlo para dimensionar el riesgo: **nada de lo verificable**. El contrato desplegado, los
hashes, la evidencia del ensayo v2, la preimagen y las pruebas siguen exactamente igual. Es un cambio
de narrativa sobre un sistema que no se mueve.

### El coste real, y la ventana

Cambiar la constante cambia el bundle, por lo que las ediciones públicas deben recompilarse y
republicarse. La primera línea del guion del vídeo también se actualizó antes de la grabación final.

---

## Referencias

- [`src/contracts/arena_escrow/src/lib.rs`](../../src/contracts/arena_escrow/src/lib.rs) — el contrato agnóstico
- [`src/packages/shared/src/stellar.ts`](../../src/packages/shared/src/stellar.ts) — la preimagen que ata red,
  contrato y versión de motor
- [Motor `resource-arena/3.0.0`](motores/motor-v3.md) — qué simula el juego actual, por qué es determinista y qué empate corrigió
- [Formato de evidencia y firmas](formato-evidencia.md) — el vector XDR exacto
- [Despliegue público](../despliegue/README.md) — cómo llegar a una URL operativa
