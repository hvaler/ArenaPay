# ADR-006: separar los motores mediante una frontera y un registro

- Estado: Aceptada
- Fecha: 21 de septiembre de 2026

## Contexto

La primera versión de ArenaPay reunía en `simulation.ts` las reglas de la arena, la selección entre
los motores v1 y v2 y la API que consumen la web y el backend. Ese diseño conservaba los replays
históricos, pero obligaba a modificar un archivo central para añadir cada juego o versión.

El contrato Soroban ya es agnóstico al juego: firma y almacena `engineVersion`, el ganador y el hash
final. La aplicación necesitaba la misma frontera explícita.

## Decisión

Se introduce `GameEngine`, un contrato TypeScript para iniciar, ejecutar, comprometer, construir y
verificar una competición determinista. Un registro resuelve el adaptador exclusivamente mediante
su versión inmutable.

Las reglas vigentes viven en `engines/resource-arena-v2.ts`. El adaptador
`engines/resource-arena.ts` registra v1 y v2. `simulation.ts` queda como fachada de compatibilidad
para los consumidores actuales; no contendrá reglas nuevas.

El coordinador de partidas utiliza el registro tanto al crear como al completar una partida. Por
ello, una versión histórica se ejecuta con su propio adaptador y ya no mediante una condición
incorporada al coordinador.

## Consecuencias

- Los JSON, hashes y versiones `resource-arena/1.0.0` y `resource-arena/2.0.0` no cambian.
- Añadir otro motor exige registrar un adaptador con una versión única y aportar su esquema y
  representación visual.
- El esquema general de replay todavía modela la arena actual. El segundo juego deberá generalizar
  el sobre de evidencia antes de exponer sus movimientos en la misma interfaz.
- El contrato Soroban no necesita modificaciones mientras sigan existiendo dos participantes y un
  único ganador.

## Alternativas descartadas

- Añadir otro `if/else` en `simulation.ts`: aumenta el acoplamiento y facilita ejecutar una versión
  equivocada.
- Sustituir el motor actual: invalidaría pruebas y evidencia histórica.
- Cambiar el contrato antes de tener un segundo juego: la versión y el hash opaco ya proporcionan
  la separación necesaria.
