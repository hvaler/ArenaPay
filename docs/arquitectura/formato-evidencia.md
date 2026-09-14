# Formato de evidencia, hashes y firma

En v2 el replay exige un nonce criptográfico de 32 bytes (64 caracteres hexadecimales minúsculos) y el compromiso es `SHA256(canonicalJson({ engineVersion, seed, nonce }))`. La versión selecciona el motor de reproducción; el formato v1 se conserva para evidencia histórica.


En v1, `seedHash = SHA256(canonicalJson({ engineVersion, seed }))` se publicaba en la creación; es enumerable y se conserva únicamente por compatibilidad histórica. `finalStateHash = SHA256(canonicalJson(estadoFinal))`. El estado incluye versión, semilla, estado del PRNG, tick, ambos agentes y recursos restantes.

La serialización ordena claves por valor ordinal UTF-16, conserva el orden de arrays y usa JSON sin espacios codificado UTF-8. Solo admite null, booleanos, strings, enteros seguros, arrays densos y objetos JSON. No depende del locale. El hash usa Web Crypto en los dos entornos.

Vector de regresión de esta versión: semilla `2026`, Atlas `16` puntos, Nova `27` puntos y hash final `1f167557b9f13e95e9e5c2370bd10cc4e86cb8e079bc9374f28684c5edaf6161`. Está fijado en una prueba para detectar cambios accidentales de reglas.

El replay histórico v1 incluye `matchId`, `engineVersion`, `seed`, `seedHash`, `policies`, `inputs`, `winner` y `finalStateHash`. Al verificar, se validan el formato, la versión, el compromiso, el ganador y el hash recalculados. Para partidas de la sesión se compara también con el compromiso recibido al crearlas.

**La verificación local de un archivo importado no acredita su autoría ni liquidación.** El panel Testnet realiza una comprobación adicional contra el ganador y el hash almacenados en el contrato. El hash final cubre el estado final, no todo el archivo. La versión fija las políticas de generación, pero el verificador reproduce los inputs aportados.

La firma de resolución es Ed25519 sobre SHA-256 de un vector XDR ScVal con ocho elementos: símbolo `ARENAPAY_V2`, hash de la passphrase de red, dirección del contrato, ID bytes32, versión del motor, compromiso de semilla, dirección ganadora y hash final. El [vector de prueba compartido](../evidencia/fixtures/resolution-v2.json) se verifica tanto en Rust como en TypeScript. El ID on-chain es SHA-256 UTF-8 de `ARENAPAY_MATCH_V1:` seguido del UUID local. Se sustituyó la concatenación del plan inicial para delimitar los campos e incluir red y contrato.

