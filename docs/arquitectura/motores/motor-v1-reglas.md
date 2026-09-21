# Reglas históricas del motor v1

Referencia congelada; las partidas nuevas usan [el motor v2](motor-v2.md).


- Coordenadas enteras 0–7. Atlas empieza en (0,0) y Nova en (7,7), con cero puntos.
- Semilla uint32 (0–4294967295). PRNG xorshift32: XOR de desplazamientos 13 a la izquierda, 17 a la derecha sin signo y 5 a la izquierda; resultado uint32. Semilla 0 usa el estado interno inicial 0x9e3779b9 y conserva 0 como semilla declarada.
- Se crean 12 recursos de valor 1–3. Las celdas libres se enumeran por fila y columna; una extracción del PRNG selecciona la celda por módulo y otra selecciona el valor por módulo 3 + 1. No se crean recursos sobre agentes ni recursos existentes.
- Cada tick evalúa ambos agentes sobre el mismo estado previo. UP/LEFT/DOWN/RIGHT/STAY producen desplazamientos de una celda y los bordes se saturan en 0 y 7. Los agentes pueden compartir celda y cruzarse.
- Se aplican los movimientos en orden A, B, sin colisiones que alteren ese movimiento. Después se recogen recursos, con prioridad A/B en ticks pares y B/A en impares. Esto resuelve una llegada simultánea al mismo recurso.
- Tras avanzar el contador, en los ticks 5, 10, …, 55 aparece un recurso si quedan menos de 12. No hay regeneración después del tick 60.
- Atlas elige el recurso con menor distancia Manhattan. Nova maximiza `valor * 4 - distanciaPropia * 2 + min(3, distanciaRival)`. Empates entre recursos se ordenan por fila y columna.
- Para elegir movimiento se maximiza `-distanciaAlObjetivo * 10`; Nova añade `min(3, distanciaAlRival)`. Empates de movimiento: UP, LEFT, DOWN, RIGHT, STAY. Sin recursos, ambos esperan.
- El mayor puntaje obtiene el primer puesto de la simulación. Si empatan, semilla par favorece a A y semilla impar a B. Esta regla de demo es pública antes de ejecutar y no pretende ser una fuente de aleatoriedad imparcial para premios reales.
- El tick es una unidad lógica fija, no tiempo de reloj. La velocidad visual no modifica los resultados. Solo se usa aritmética entera; no se usan fechas, red, Math.random ni modelos de lenguaje dentro del motor.
- El registro debe contener exactamente un movimiento por tick y jugador: 120 entradas. Se rechazan duplicados, faltantes, movimientos inválidos, semillas fuera de rango, campos extra y versiones desconocidas. El orden del array de entrada no influye en el resultado.

