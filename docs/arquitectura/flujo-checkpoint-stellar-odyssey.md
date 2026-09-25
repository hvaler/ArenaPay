# Flujo de ArenaPay para el checkpoint de Stellar Odyssey

Este esquema resume el recorrido que se construye y demuestra en ArenaPay. La partida se prepara y financia con firmas de Freighter, se ejecuta fuera de la cadena de forma determinista y se liquida mediante el contrato Soroban después de verificar el replay, el hash y la firma del árbitro.

![Flujo verificable de ArenaPay](../assets/arenapay-flujo-verificable.png)

La lámina de presentación utiliza un formato compacto para que un visitante pueda leerla completa en una pantalla de portátil. Las tres filas representan preparación, competición y liquidación; la franja inferior enumera las pruebas que produce la demostración.

```mermaid
flowchart TD
    start(["ArenaPay"])

    subgraph prepare ["01 · Preparar y financiar"]
        createMatch["Crear partida"]
        commitment["Publicar compromiso"]
        authorize["Firmar con Freighter"]
        escrow["Depositar 1 XLM cada uno"]
        funded{"Escrow financiado?"}
        waitDeposit["Esperar segundo depósito"]

        createMatch --> commitment
        commitment --> authorize
        authorize --> escrow
        escrow --> funded
        funded -->|"No"| waitDeposit
    end

    subgraph compete ["02 · Competir y registrar"]
        runMatch["Ejecutar simulación"]
        storeReplay[("Guardar replay y nonce")]
        signResult["Firmar resolución"]

        runMatch --> storeReplay
        storeReplay --> signResult
    end

    subgraph verify ["03 · Verificar y liquidar"]
        reproduce["Reproducir 60 ticks"]
        checkProof{"Hash y firma coinciden?"}
        blocked["Bloquear pago y revisar"]
        settle["Liquidar en Soroban"]
        payout["Pagar 2 XLM al ganador"]
        evidence[/"Exportar evidencia JSON"/]

        reproduce --> checkProof
        checkProof -->|"No"| blocked
        checkProof ==>|"Sí"| settle
        settle --> payout
        payout --> evidence
    end

    done(["Resultado demostrable"])

    start --> createMatch
    funded ==>|"Sí"| runMatch
    signResult --> reproduce
    evidence --> done

    style prepare fill:#C2E5FF,stroke:#3DADFF
    style compete fill:#DCCCFF,stroke:#874FFF
    style verify fill:#CDF4D3,stroke:#66D575
    style funded fill:#FFECBD,stroke:#FFC943
    style checkProof fill:#FFECBD,stroke:#FFC943
    style waitDeposit fill:#FFECBD,stroke:#FFC943
    style blocked fill:#FFCDC2,stroke:#FF7556
    style payout fill:#CDF4D3,stroke:#66D575
```

## Enlaces de referencia

- Aplicación: <https://arenapay.vercel.app/>
- Repositorio público: <https://github.com/hvaler/ArenaPay>
- Demostración completa: <https://youtu.be/LECz_vXmFi0>
- Pitch: <https://youtu.be/4uiet8NSKwo>. La presentación inicial, `thcnJ7IS7fE`, ya no es pública; su copia está en el [archivo audiovisual](../evidencia/media/README.md).
- FigJam del flujo, enfocado en la lámina final: <https://www.figma.com/board/CgZaKh4wtUQk1PC4J7BfuX/ArenaPay-%E2%80%94-Flujo-verificable-en-Stellar-Testnet?node-id=9-86>

## Uso en el checkpoint

El FigJam debe compartirse como **Cualquier persona con el enlace puede ver**. En el campo **Repositorio base** se utiliza `https://github.com/hvaler/ArenaPay`. En el checkpoint se dejó sin marcar la casilla **Este proyecto ya existía antes del evento**, porque ArenaPay se creó para esta hackatón, después de conocer la convocatoria. Aun así, parte del código se escribió antes de que se abriera la ventana de desarrollo el 19 de septiembre a las 09:00. Por eso el [README](../../README.md#qué-se-construyó-durante-stellar-odyssey-perú-2026) declara el commit base `800328b`, etiquetado `v0.1.0`, y separa lo construido desde entonces. Esa declaración es la vigente.
