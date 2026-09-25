# Archivo audiovisual de ArenaPay

Revisión: 21 de septiembre de 2026.

Esta carpeta conserva los entregables audiovisuales finales y sus subtítulos. Las copias locales permiten auditar y preservar la entrega; YouTube ofrece una reproducción accesible para el jurado y visitantes. Los vídeos explican el recorrido observado, mientras que los recibos, replays y hashes del [índice de evidencia](../README.md) siguen siendo la fuente verificable de las operaciones en Testnet.

## Entregables finales

| Entregable | Copia en el repositorio | Publicación | Duración | Uso |
|---|---|---|---:|---|
| Demo completa en español | [MP4](arenapay-demo-testnet-es.mp4) · [subtítulos SRT](arenapay-demo-testnet-es.srt) | [YouTube](https://youtu.be/LECz_vXmFi0) | 4:09 | Campo **Video Demo URL** y recorrido completo de la aplicación |
| Arquitectura y plataforma | [MP4](pitch-v2/arenapay-arquitectura-stellar-es.mp4) · [subtítulos SRT](pitch-v2/arenapay-pitch-v2-es.srt) | [YouTube](https://youtu.be/4uiet8NSKwo) | 2:44 | Presentación recomendada: arquitectura, motores, juegos y hoja de ruta |
| Miniatura de arquitectura | [PNG](pitch-v2/arenapay-arquitectura-thumbnail.png) | Usada en YouTube | 1920 × 1080 | Identidad visual de la presentación recomendada |
| Presentación inicial | [MP4](arenapay-pitch-es.mp4) · [subtítulos SRT](arenapay-pitch-es.srt) · [miniatura](arenapay-pitch-thumbnail.png) | YouTube `thcnJ7IS7fE`, ya no público | 2:44 | Pieza histórica utilizada en la entrega inicial |
| Competición con el motor 3.0.0 | [MP4](arenapay-competicion-v3-es.mp4) | Sin publicar | 0:20 | Sustituye el fragmento de competición de la demo, grabado con el motor que ya corrige el bloqueo |

## Presentación de arquitectura publicada

La primera presentación comprimía las mismas escenas que la demo y no dedicaba tiempo suficiente
a la arquitectura, el registro de motores ni la evolución hacia otros juegos. Se conserva porque es
la pieza presentada originalmente. La nueva presentación está publicada y claramente diferenciada:

- [Guion y ficha de publicación](../../guias/pitch-v2-arquitectura.md).
- [Storyboard y ocho láminas 1080p](pitch-v2/README.md).
- [Vídeo maestro](pitch-v2/arenapay-arquitectura-stellar-es.mp4).
- [Subtítulos en español](pitch-v2/arenapay-pitch-v2-es.srt).
- [Publicación en YouTube](https://youtu.be/4uiet8NSKwo).

La demo completa continúa siendo la prueba operativa; esta pieza explica el diseño y la evolución
del producto.

## Material histórico

- [arenapay-demo.webm](arenapay-demo.webm) es una captura anterior sin la narración y el cierre audiovisual de la entrega final. Se conserva para mantener la trazabilidad, pero ya no es el vídeo recomendado.

## Diagrama de apoyo

- [Flujo verificable de ArenaPay](../../arquitectura/flujo-checkpoint-stellar-odyssey.md): explicación, diagrama Mermaid y enlace al FigJam editable.
- [Captura PNG del diagrama](../../assets/arenapay-flujo-verificable.png): copia estable para el repositorio y los visores que no abren FigJam.
- [FigJam editable](https://www.figma.com/board/CgZaKh4wtUQk1PC4J7BfuX/ArenaPay-%E2%80%94-Flujo-verificable-en-Stellar-Testnet?node-id=9-86): versión visual compartida para el checkpoint.

## Integridad de los archivos

Algoritmo: SHA-256.

| Archivo | SHA-256 |
|---|---|
| `arenapay-demo-testnet-es.mp4` | `e09d0dedb1b0f19adc3c43816b806b1eba71f44cea0f54c719b365b4329a29e3` |
| `arenapay-demo-testnet-es.srt` | `0706f40c120bd6f5999adb833e7333dc7beaf8bf7cb527dfd502104a6f362be8` |
| `arenapay-pitch-es.mp4` | `902e48e255c44c3dfde7d70ba2a0331d64252ebe710d21d44a4cca95120dfc61` |
| `arenapay-pitch-es.srt` | `fcd8f6e42fcba58847320753fdbeb02cf1aa17d80e34cb53f5d0adf06b83d88c` |
| `arenapay-pitch-thumbnail.png` | `8c345b6cc4b9a4ca7534b7d0e6eb8f75582e4463970c50dded68cf54f05336d6` |
| `pitch-v2/arenapay-arquitectura-stellar-es.mp4` | `96f1ad061440f2ca2d74b821a81969fc7845d7b484108d12d58fa6cfe678d8c2` |
| `pitch-v2/arenapay-pitch-v2-es.srt` | `13090f2e9d734b2b0fe85fdbf08604f336b14511659d315d8fa34a54ab23558e` |
| `pitch-v2/arenapay-arquitectura-thumbnail.png` | `ba38e65ea92b2dbb7198400d911c4bcadf671f6c3ac465b1f2b6ff9f42a4e0a8` |
| `arenapay-demo.webm` | `bbfa0a0d8487f1c8cba55f9417a0061e6ab858d938ba10555c6e4a717457bce6` |
| `arenapay-competicion-v3-es.mp4` | `b889b2cf1527ad72ce5b7fc78cf654c32999397aee0b2024fe0aaa6fca74e762` |

Para volver a comprobar una huella en PowerShell:

```powershell
Get-FileHash docs/evidencia/media/arenapay-demo-testnet-es.mp4 -Algorithm SHA256
```

La publicación en YouTube puede ser recodificada por la plataforma. Las huellas anteriores corresponden a las copias maestras incluidas en este repositorio.

## Fragmento de competición con el motor 3.0.0

La demo publicada se grabó con `resource-arena/2.0.0`, que podía detener la competición cuando los dos agentes pedían la misma casilla. La partida que aparece en ese vídeo no quedó afectada —se movió hasta el tick 52 de 60— y el recorrido completo sigue siendo válido y reproducible. Aun así, el fragmento de competición se regrabó con el motor vigente para que muestre una arena disputada de principio a fin.

| Dato | Valor |
|---|---|
| Archivo | [`arenapay-competicion-v3-es.mp4`](arenapay-competicion-v3-es.mp4) · 1280 × 900 · 20 s, sin audio |
| Motor | `resource-arena/3.0.0` |
| Semilla | `2042`, fijada antes de ejecutar |
| Resultado | Atlas 27 · Nova 25, tick 60 de 60 |
| Tablero final | Sin recursos pendientes |

Se grabó sobre <https://arenapay.vercel.app/> con una partida de práctica. La práctica se ejecuta en el navegador con el mismo motor que una partida financiada, así que el tablero es idéntico; lo que no aparece son las firmas de Freighter, que pertenecen a los pasos anteriores del recorrido.

Para volver a grabarlo:

```powershell
npm run media:arena-clip
```

El guion acepta `--seed`, `--url`, `--out` y `--name`. Deja un `.webm` y, si hay `ffmpeg` disponible, el `.mp4` ya recortado. Elegir otra semilla cambia la partida: conviene comprobar antes que no se congela y que el marcador queda reñido.
