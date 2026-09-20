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
- Pitch: <https://youtu.be/thcnJ7IS7fE>
- FigJam del flujo, enfocado en la lámina final: <https://www.figma.com/board/CgZaKh4wtUQk1PC4J7BfuX/ArenaPay-%E2%80%94-Flujo-verificable-en-Stellar-Testnet?node-id=9-86>

## Uso en el checkpoint

El FigJam debe compartirse como **Cualquier persona con el enlace puede ver**. En el campo **Repositorio base** se utiliza `https://github.com/hvaler/ArenaPay`. Debe indicarse que el proyecto ya existía antes del evento, porque el repositorio y las primeras versiones de ArenaPay preceden a la participación actual.
