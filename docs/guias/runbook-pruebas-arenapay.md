# Runbook de pruebas de ArenaPay desde cero

Versión 1.1 · 12 de septiembre de 2026 · Red de pruebas Stellar Testnet.

Esta guía explica cómo preparar dos cuentas, inscribir a los agentes Atlas y Nova, ejecutar una competición y comprobar que el ganador recibe su premio. Está pensada para una persona sin experiencia con wallets ni contratos. Puedes manejar las dos cuentas tú mismo; no necesitas dos personas ni dos ordenadores.

El objetivo es terminar con tres pruebas: ambos depósitos confirmados, un replay que reproduce el resultado y un recibo de liquidación exitoso en Testnet. Una animación terminada o un botón pulsado no demuestran por sí solos que se haya pagado.

La guía incorpora las correcciones del motor v2 del 12 de septiembre. El ensayo pagado de la sección 12 pertenece al motor v1 y se conserva como evidencia histórica. Los nombres de Freighter pueden cambiar en versiones posteriores. Si una pantalla no coincide, detente en ese paso y comprueba la diferencia antes de firmar.

## 1 Elegir la prueba que quieres hacer

| Modalidad | Dónde se hace | Necesita Freighter | Qué demuestra |
|---|---|---|---|
| Práctica sin fondos | Web pública o aplicación local | No | Los agentes compiten y su resultado puede reproducirse. |
| Consultar un ensayo pagado | Web pública o aplicación local | No | Permite revisar el replay y el recibo de una operación anterior. |
| Crear una partida con pago nuevo | Aplicación local con servidor | Sí, con dos cuentas | Depósitos, autorización de presupuesto y liquidación nuevos en Testnet. |

La web pública de esta versión no crea depósitos ni pide firmas. No intentes completar allí la prueba de pago nuevo.

- [Demo en Vercel](https://arenapay.vercel.app/).
- [Demo en GitHub Pages](https://hvaler.github.io/ArenaPay/).
- [Aplicación local para operaciones nuevas](http://127.0.0.1:5173).
- [Código fuente en GitHub](https://github.com/hvaler/ArenaPay).

Para recorrer una práctica: pulsa «Probar la arena», crea la partida, ejecuta la simulación y pulsa «Verificar reproducibilidad». Para revisar un pago anterior: pulsa «Ver una partida pagada en Testnet» y abre su recibo. Ninguna de estas acciones realiza un pago nuevo.

## 2 Entender las palabras que verás

| Término | Significado sencillo |
|---|---|
| Wallet | Aplicación que guarda las credenciales de tus cuentas y te permite autorizar operaciones. En esta guía usamos Freighter. |
| Cuenta | Identidad en Stellar. Atlas y Nova necesitan cuentas distintas. Una wallet puede contener varias. |
| Public Key | Dirección pública de la cuenta, que empieza por G. Sirve para identificarla y recibir fondos. Se puede compartir. |
| Secret Key | Clave privada que empieza por S. Permite controlar la cuenta. Se usa al importar en Freighter, nunca en los formularios de ArenaPay. |
| Contraseña de Freighter | Contraseña que elegiste para desbloquear la extensión. No es la Secret Key ni tu contraseña de Google. |
| Frase de recuperación | Conjunto de palabras para recuperar una wallet. No es lo mismo que una Secret Key individual. No pegues una clave S en un formulario de 12 o 24 palabras. |
| Testnet | Red de pruebas. Sus XLM no tienen valor monetario. Mainnet es una red distinta y no se usa en este procedimiento. |
| Firma | Confirmación criptográfica de una operación. Para ti consiste en revisar la solicitud y aceptarla en Freighter. |
| Contrato o escrow | Programa que retiene las dos inscripciones y aplica las reglas para pagar o devolver los depósitos. |
| Soroban | Plataforma de contratos de Stellar donde funciona el escrow de ArenaPay. |
| Presupuesto | Límite autorizado para inscripciones en este contrato. Autorizar un máximo no significa transferirlo inmediatamente. |
| Replay | Archivo con la semilla, el nonce en v2 y los movimientos de la partida. Permite repetir el cálculo y comprobar el resultado. |
| Semilla | Número que fija las condiciones iniciales de la arena. Con las mismas reglas y movimientos, el resultado se repite. |
| Nonce | Número secreto aleatorio de 32 bytes que evita adivinar la semilla comparando su compromiso. Se revela dentro del replay. |
| Hash | Huella digital de los datos. Sirve para detectar cambios; por sí sola no demuestra que haya ocurrido un pago. |
| Árbitro | Servicio que comprueba el resultado y lo firma. El contrato confía en la firma del árbitro configurado. |
| Ledger | Un registro numerado de la red. La partida vence al alcanzar un número concreto; no es una hora del reloj. |
| Comisión | Coste de procesar una transacción. En esta prueba se paga con XLM de Testnet y es independiente del premio. |

Atlas y Nova usan estrategias programadas y deterministas. Sus movimientos son automáticos, pero los depósitos siguen requiriendo tu firma. Esta versión no es una wallet que gaste autónomamente ni una verificación sin árbitro.

## 3 Preparar los datos y el equipo

Necesitas Chrome o Edge con Freighter, dos cuentas distintas con XLM de Testnet y la aplicación local funcionando. La extensión se utiliza en el navegador normal, no dentro del navegador integrado de Codex.

En nuestro ensayo teníamos un archivo privado con cuatro cuentas. Su nombre y ubicación no son un requisito del producto. Conserva tus credenciales en un lugar seguro y no las añadas al repositorio, al runbook, al vídeo ni al chat.

| Etiqueta del archivo de cuentas | Uso en la prueba | Acción del participante |
|---|---|---|
| Player A | Atlas | Importar en Freighter si falta y usar su dirección pública en ArenaPay. |
| Player B | Nova | Importar en Freighter si falta y usar su dirección pública en ArenaPay. |
| Referee | Árbitro | No importarlo para jugar. Lo configura el servicio. |
| Admin | Administrador | No importarlo para jugar. El servicio lo utiliza para crear partidas. |

No es necesario reutilizar las cuentas del ejemplo: puedes usar otras dos cuentas Testnet. Escribe siempre las direcciones de las cuentas que realmente puedes seleccionar y firmar en Freighter.

### Si la aplicación local no abre

En nuestro equipo el proyecto está en `C:\nexus\dev\ArenaPay`. Abre una terminal en esa carpeta y ejecuta:

```sh
npm run dev
```

Mantén esa terminal abierta. Inicia la web y el motor que prepara las partidas. Después abre `http://127.0.0.1:5173`. La dirección 127.0.0.1 significa «este ordenador»; no es una página pública.

Si acabas de descargar el repositorio en otro ordenador, primero necesitas Node.js compatible con el README y ejecutar `npm ci`. Eso instala dependencias, pero no recupera las claves ni la configuración privada de Testnet: deliberadamente no están en GitHub. Si el panel dice que Testnet no está configurada, pide al responsable del proyecto que prepare el despliegue siguiendo el README. No ejecutes scripts de despliegue a ciegas ni copies claves al navegador.

## 4 Configurar Freighter una sola vez

### Paso 1 Abrir o instalar Freighter

Acción: en Chrome, pulsa el icono de extensiones y busca Freighter. Si no está instalado, obtén la extensión desde [la web oficial de Freighter](https://www.freighter.app/). Si aparece una bienvenida, completa la configuración de la wallet, establece una contraseña y conserva la recuperación que te indique.

Qué significa: preparas el contenedor de tus cuentas. Configurar una wallet no importa automáticamente Player A y Player B.

Resultado esperado: puedes abrir Freighter y ver una cuenta. En nuestro caso apareció «Account 1». Un saldo visible no demuestra que sea la cuenta correcta.

### Paso 2 Comprobar si Atlas y Nova ya están

Acción: pulsa el nombre de la cuenta y abre el selector «Wallets». Selecciona cada cuenta y usa el icono de copiar dirección. Compara la dirección pública completa con Player A y Player B de tus datos.

Qué significa: identificas la cuenta por su dirección, no por un nombre que puede cambiar. «Account 1» podría ser cualquier cuenta.

Resultado esperado: si coincide con Player A, esa cuenta es Atlas; si coincide con Player B, es Nova. No importes otra vez una cuenta que ya tienes. En nuestro ensayo la primera Account 1 no coincidía y la conservamos.

### Paso 3 Importar Atlas si falta

Acción: en «Wallets», pulsa «Add wallet» y después «Import a Stellar secret key». Copia la Secret Key de Player A y pégala solo en ese formulario de Freighter. Introduce la contraseña de la extensión cuando la solicite. Si puedes nombrarla, escribe Atlas.

Qué significa: Freighter podrá firmar con esa cuenta. No estás enviando una inscripción ni pagando el premio.

La casilla «I’m aware Freighter can’t recover the imported secret key» significa que debes conservar tú esa clave. Márcala después de asegurarte de que tienes una copia segura. No des por hecho que la frase de recuperación de la wallet recuperará también una clave importada individualmente.

Resultado esperado: aparece una cuenta cuya dirección pública coincide exactamente con Player A. No grabes ni compartas la pantalla mientras se vea la Secret Key.

### Paso 4 Importar Nova si falta

Repite el paso anterior usando exclusivamente la Secret Key de Player B. Ponle Nova si puedes y comprueba su dirección pública. No utilices la misma cuenta para ambos agentes.

Resultado esperado: puedes alternar entre Atlas y Nova en el selector. Las dos direcciones son distintas.

### Paso 5 Seleccionar Testnet y comprobar el saldo

Acción: en la pantalla principal de Freighter, pulsa el icono del globo y elige Testnet. Debe aparecer marcada. Revisa el saldo de ambas cuentas en esa red.

Qué significa: trabajarás con fondos de prueba. La misma dirección puede tener diferente saldo según la red seleccionada. Ver «$0.00» no significa necesariamente que no tengas XLM de Testnet: mira la cantidad de Stellar Lumens.

Resultado esperado: Testnet seleccionada y saldo suficiente para 1 XLM de inscripción, las comisiones y la reserva que exige la red. Si la cuenta no está financiada, utiliza Friendbot mediante la opción de financiación Testnet de Freighter o la [guía oficial de Stellar](https://developers.stellar.org/docs/build/guides/freighter/connect-testnet). No compres XLM reales para esta prueba.

## 5 Crear una partida nueva con pago

No recargues la página ni crees otra partida a mitad del recorrido. La pantalla no ofrece todavía una lista general para reabrir cualquier partida: si pierdes la vista, conserva el identificador y consulta al responsable antes de repetir operaciones.

### Paso 6 Conectar Atlas a ArenaPay

Acción: selecciona Atlas en Freighter. Abre la aplicación local, pulsa «Nueva partida en Testnet» y luego «Conectar Freighter» en el panel de escrow.

En la solicitud de conexión comprueba el sitio 127.0.0.1, la dirección de Atlas y la red Test Net. Pulsa Connect si coinciden.

Qué significa: autorizas a la aplicación a consultar la cuenta y solicitar firmas. Conectar no transfiere fondos ni entrega la clave privada.

Resultado esperado: el botón de ArenaPay muestra «Freighter» y la dirección abreviada de Atlas. Si sigue mostrando otra cuenta, no continúes con un depósito.

### Paso 7 Introducir las direcciones y crear la partida

Acción: pulsa «Nueva partida en Testnet», el tercer botón bajo el título de la web local. No lo confundas con «Crear partida» de la práctica ni con «Cargar ensayo verificado de Testnet», que abre un ensayo anterior.

En «Dirección de Atlas» introduce la Public Key de Player A; en «Dirección de Nova», la Public Key de Player B. Usa direcciones completas que empiecen por G, nunca claves S. En las partidas nuevas el servidor elige la semilla y la mantiene reservada hasta ejecutar. La semilla del formulario de práctica no se utiliza aquí. Para revisar el ejemplo antiguo de semilla 2026, abre el ensayo histórico. Pulsa «Crear partida en Testnet» una sola vez y espera.

Qué significa: el servicio registra participantes, inscripción, compromiso de semilla y plazo en el contrato. En esta versión la creación la firma el administrador del servicio; todavía no retira las inscripciones de los jugadores.

Resultado esperado: «Estado confirmado: Created», Atlas pendiente y Nova pendiente. Guarda el identificador que aparece en «Ver identificadores y hashes» y el contrato indicado en el panel.

## 6 Autorizar y depositar las inscripciones

### Paso 8 Autorizar el presupuesto de Atlas

Acción: con Atlas conectado, pulsa «Autorizar hasta 3 XLM adicionales». Revisa y confirma la solicitud en Freighter en Testnet.

Qué significa: estableces capacidad de gasto para futuras inscripciones en este contrato. No depositas 3 XLM al pulsar este botón. La autorización tiene vencimiento y la transacción puede cobrar comisión.

Resultado esperado: aparece presupuesto autorizado y se habilita el depósito. El límite es acumulativo: renovar no borra el gasto anterior. Si ya hiciste pruebas, los números pueden ser distintos de los de la primera partida.

### Paso 9 Depositar la inscripción de Atlas

Acción: pulsa «Depositar 1 XLM de prueba» y confirma la solicitud en Freighter. Espera la confirmación; puedes pulsar «Actualizar estado».

Qué significa: ahora sí se transfiere 1 XLM desde Atlas al escrow. El dinero queda retenido para la partida. El presupuesto cubre la inscripción, no las comisiones.

Resultado esperado: «Atlas: depósito confirmado», Nova pendiente y estado Created. Si era la primera autorización de 3 XLM, Atlas muestra 1 XLM utilizado y 2 disponibles. Created con un solo depósito es normal.

### Paso 10 Cambiar a Nova y volver a conectar

Acción: abre Freighter, selecciona Nova y vuelve a ArenaPay. Pulsa el botón que todavía muestra la dirección de Atlas. Acepta la conexión de Nova si se solicita y comprueba que la dirección mostrada cambia.

Qué significa: cambiar la cuenta en la extensión no basta para dar por hecho que la aplicación usa la nueva. Volver a conectar evita firmar con el participante equivocado.

Resultado esperado: ArenaPay muestra la dirección de Nova y sus opciones de autorización y depósito.

### Paso 11 Autorizar y depositar con Nova

Acción: pulsa «Autorizar hasta 3 XLM adicionales» y confirma; después pulsa «Depositar 1 XLM de prueba» y confirma. Son dos operaciones diferentes.

Resultado esperado: «Estado confirmado: Funded», Atlas y Nova con depósito confirmado. Ya hay 2 XLM de prueba en el escrow y aparece «Ejecutar simulación».

No ejecutes ni declares financiación completa basándote solo en haber aceptado las ventanas: comprueba el estado confirmado de la aplicación.

## 7 Competir y comprobar el resultado

### Paso 12 Ejecutar la simulación

Acción: pulsa «Ejecutar simulación» en el panel Testnet y espera a que termine el recorrido de 60 ticks. Un tick es un paso del juego. Puedes pausar la reproducción, cambiar velocidad o revisar movimientos con la barra.

Qué significa: el motor calcula la partida y registra 120 movimientos, 60 por agente. La animación muestra ese replay. Este paso no necesita firma de Freighter y todavía no paga el premio.

Resultado esperado: aparece un ganador y «Sin premio liquidado». En nuestro ensayo de semilla 2026, Atlas obtuvo 16 puntos y Nova 27. No uses este marcador como resultado obligatorio para otras semillas o versiones del motor.

### Paso 13 Verificar replay y firma

Acción: pulsa «Verificar replay y firma», justo encima de «Cobrar premio en Testnet».

Qué significa: el navegador reproduce el resultado y comprueba que la resolución firmada corresponde a esta partida, contrato, semilla, versión, ganador y hash. No es una firma que debas hacer tú; se verifica la del árbitro.

Resultado esperado: «Replay y firma comprobados» y botón de cobro habilitado. El contrato sigue Funded. Si aparece «Evidencia inconsistente» o «Firma inválida», no intentes forzar el cobro: guarda el error y revisa el caso con el responsable.

El botón «Verificar reproducibilidad» de la tarjeta «Prueba de la partida» realiza una comprobación local del replay. Es útil, pero no sustituye la verificación de firma ni acredita un pago.

## 8 Cobrar y comprobar la liquidación

### Paso 14 Solicitar el premio

Acción: pulsa «Cobrar premio en Testnet». Revisa la solicitud de Freighter y confirma la operación de liquidación en la red de pruebas. En nuestro ensayo mantuvimos Nova conectada.

Qué significa: se pide al contrato que valide la resolución y entregue las dos inscripciones al ganador. La cuenta que firma la transacción paga la comisión; el premio se dirige al ganador registrado, no a una dirección elegida libremente por quien pulsa el botón.

Resultado esperado: «Estado confirmado: Settled» y «Premio liquidado» con el ganador. Hasta ver esa confirmación, no des por hecho que el pago terminó.

### Paso 15 Comparar el replay contra la cadena

Acción: pulsa «Comprobar replay contra la cadena».

Qué significa: se contrasta el resultado reproducido con el ganador y hash del contrato consultado. Así se une la evidencia del juego con el resultado registrado en Testnet.

Resultado esperado: «Hash coincide 100% con el resultado del contrato». La coincidencia acredita esos datos; no significa que todo el sistema esté auditado o libre de cualquier vulnerabilidad.

En la versión ensayada puede permanecer un mensaje antiguo que dice «El pago requiere confirmación» después de Settled. Es un defecto conocido de texto. Revisa el estado confirmado, la comparación y el recibo; no repitas el cobro por ese mensaje.

### Paso 16 Abrir y guardar el recibo

Acción: pulsa «Ver transacción en Testnet». En Stellar Expert comprueba Network testnet, Status Successful y la operación settle_match. Copia la URL de la barra del navegador. Descarga también el replay mediante «Descargar JSON».

Qué significa: el recibo identifica una operación concreta. Antes de liquidar, ese enlace podría corresponder a la última autorización o depósito: confirma que el recibo final es el de liquidación.

Resultado esperado: recibo exitoso de esta nueva partida, replay guardado y ganador coherente en la pantalla y el contrato. No confundas ese recibo con el enlace del despliegue del contrato ni con un ensayo anterior.

## 9 Qué ocurre con los XLM

En una partida completada, Atlas aporta 1 XLM y Nova aporta 1 XLM. El contrato entrega 2 XLM al ganador. No se entregan otros 2 XLM además de devolver las inscripciones.

Si gana Nova, aporta 1 y recibe 2: su diferencia por el juego es más 1 XLM antes de comisiones. Atlas tiene una diferencia de menos 1 XLM antes de comisiones. Los cambios de saldo de la wallet también incluyen comisiones y pueden reflejar otras operaciones, por lo que no sustituyen la lectura del recibo.

## 10 Vencimiento y devolución

La partida creada por esta interfaz tiene un plazo de 720 ledgers desde su creación. Su duración en minutos depende del ritmo de la red; utiliza los números «Actual» y «Vencimiento» del panel. El contrato admite un plazo limitado y no puedes extender esta partida desde la pantalla.

Si el plazo vence antes de liquidar, conecta una cuenta participante, actualiza el estado y utiliza «Cancelar y devolver depósitos» cuando aparezca. Revisa y firma en Freighter. El contrato devuelve únicamente los depósitos recibidos y marca Cancelled. Una partida ya Settled no se cancela de esta forma.

La devolución no repone el presupuesto acumulado utilizado y no implica recuperar las comisiones. Para repetir la competición crea otra partida; no reutilices una cancelada.

La cancelación manual es un escenario separado: no se ejecutó en el recorrido ganador documentado abajo. No marques una prueba de devolución como superada solo porque la liquidación funcionó.

## 11 Problemas frecuentes y siguiente acción

| Lo que ves | Qué puede significar | Qué hacer |
|---|---|---|
| La página local no abre | No están iniciados los servicios o existe un conflicto de puerto. | Inicia npm run dev en la carpeta correcta y revisa el mensaje de la terminal. No cierres procesos ajenos sin identificarlos. |
| La web pública no tiene conexión a Freighter | Es la edición estática sin operaciones nuevas. | Usa la aplicación local con servidor para la prueba con depósitos. |
| La cuenta no coincide | Está seleccionada otra cuenta o la aplicación conserva la anterior. | Compara la Public Key y vuelve a conectar después de cambiar en Freighter. |
| Freighter pide password | Necesita desbloquear la wallet. | Usa la contraseña de Freighter. Si la olvidaste, no borres la wallet sin comprobar antes cómo recuperar tus cuentas. |
| Se pide una frase de palabras al importar | Has abierto la recuperación por frase. | Vuelve a Add wallet y elige Import a Stellar secret key para las claves S del ejemplo. |
| Error con varios RPC consultados | Ningún servidor de lectura pudo confirmar el estado. | Reintenta la consulta; no repitas el depósito o cobro por ese error. |
| Depósito deshabilitado | Falta presupuesto válido, conexión correcta o la partida venció. | Revisa participante, disponible y plazo. Actualiza el estado antes de firmar otra vez. |
| No hay saldo suficiente | La cuenta necesita XLM de prueba y margen para comisiones. | Comprueba Testnet y utiliza su financiación de prueba; no cambies a Mainnet. |
| Estado Created tras el primer depósito | Falta el segundo participante. | Cambia a Nova y completa su autorización y depósito. |
| La operación tarda o devuelve error | Puede haber un problema de conexión o una transacción pendiente. | No repitas inmediatamente. Usa Actualizar estado y revisa el recibo existente. |
| No aparece la ventana de Freighter | La extensión puede estar bloqueada o tener una solicitud pendiente. | Abre la extensión, desbloquéala y revisa las solicitudes. |
| Evidencia o firma inválida | La comprobación no permite confiar en esa resolución. | No fuerces el pago. Guarda identificador, error y replay para diagnosticar. |
| Se recargó la página durante la prueba | La selección de partida se conserva en la interfaz solo durante la sesión. | No crees otra por impulso. Pide recuperar la partida por su identificador desde el registro local. |
| El explorador aún no muestra la operación | Puede existir retraso de consulta o indexación. | Actualiza y comprueba que la URL y la red son las correctas. No declares éxito solo por tener un enlace. |

La aplicación consulta el estado cada 15 segundos mientras la pestaña está visible. «Actualizar estado» fuerza una nueva consulta. Si hay un error de consulta, un estado anterior en pantalla no demuestra que la operación recién solicitada se haya completado.

## 12 Nuestro ensayo completado como referencia

Este ejemplo es evidencia histórica. Sus identificadores no deben copiarse como si fueran los de una nueva prueba. Las direcciones siguientes son públicas; las claves privadas no forman parte del documento.

### Ensayo manual v2 del 13 de septiembre

Atlas y Nova autorizaron y depositaron 1 XLM de prueba cada una desde Freighter. El motor `resource-arena/2.0.0` produjo Atlas 18 y Nova 27. Nova firmó el envío de liquidación, el contrato transfirió 2 XLM de prueba y la pantalla confirmó que el hash coincidía 100 % con el contrato.

Partida local: `68db5dd9-bcef-470e-b1d0-63ff201e8fcc`. Recibo: [b8f1d444…](https://stellar.expert/explorer/testnet/tx/b8f1d444402c4bcb976126b8e144eabde40b6e5dc8fb173f0a63ed178e43b448). Consulta el [informe con los seis recibos](https://github.com/hvaler/ArenaPay/blob/main/docs/guias/ensayo-manual-freighter-v2.md) y el [replay](https://github.com/hvaler/ArenaPay/blob/main/docs/evidencia/fixtures/testnet-replay-v2-manual.json).

Una persona operó ambas cuentas. El ensayo no equivale a una prueba con dos participantes independientes y no se grabó vídeo continuo.

### Ensayo histórico v1 del 12 de septiembre

| Dato | Valor |
|---|---|
| Fecha del pago | 12 de septiembre de 2026 a las 17:19:47 en Madrid, 15:19:47 UTC. |
| Atlas o Player A | GAARLVPR7GF6J72HMGII7Y6PKFOK35HPKZ7WRBJBPWASLSBTSUXSHIQZ |
| Nova o Player B | GBJGSL3A65PK6W3UC5SQQCRC3EPSHODI7QWW4UY5CW7M4VR2ITRGY2N7 |
| Partida local | 783ac81b-f929-4ba5-b3a9-d6df36120528 |
| Partida del contrato | 785730a55e8ec10aef7e41113626dab69d906b70b9b7349d3217ada8a58e4fbf |
| Contrato | CDHPEYP7KEYYO3D6G44PK22MUNKF4ZBFHLOM6DUL2NOUKXNNTO4R4RID |
| Motor y semilla | resource-arena/1.0.0 y 2026. |
| Marcador | Atlas 16 y Nova 27. |
| Liquidación | Exitosa, ganador Nova, premio del contrato de 2 XLM de prueba. |
| Ledger de la transacción | 4640560. |
| Comisión de liquidación | 0,002569 XLM de prueba, pagada por la cuenta emisora Nova. No es la suma de todas las comisiones del ensayo. |
| Hash final | 1f167557b9f13e95e9e5c2370bd10cc4e86cb8e079bc9374f28684c5edaf6161 |

[Abrir el recibo del ensayo manual](https://stellar.expert/explorer/testnet/tx/2b9577790a54d67d799feaa4c2b610956521eea7f6bfa09437715260a89d6b21).

El usuario completó las firmas en Freighter. Horizon confirmó la transacción exitosa y el servicio consultó el contrato en Settled, con ambos depósitos, ganador y hash coherentes. Las capturas mostraron la comparación satisfactoria del replay contra la cadena. No se reconstruyeron los saldos previos ni se afirma haber grabado las firmas del ensayo.

## 13 Hoja de registro para cada repetición

Completa una copia de esta hoja por partida. Escribe «pendiente» o «falló» si no lo has comprobado; no rellenes por intuición.

| Campo | Resultado de esta prueba |
|---|---|
| Fecha y persona que ejecuta | Pendiente |
| Versión o commit del proyecto | Pendiente |
| Navegador y versión de Freighter | Pendiente |
| Red y contrato | Pendiente |
| Public Key de Atlas | Pendiente |
| Public Key de Nova | Pendiente |
| Semilla e identificador de partida | Pendiente |
| Presupuesto Atlas autorizado y depósito confirmado | Pendiente |
| Presupuesto Nova autorizado y depósito confirmado | Pendiente |
| Estado Funded observado | Pendiente |
| Marcador y ganador | Pendiente |
| Replay y firma comprobados | Pendiente |
| Estado Settled o Cancelled observado | Pendiente |
| Comparación del replay contra la cadena | Pendiente |
| URL del recibo y estado Successful | Pendiente |
| Nombre del replay descargado | Pendiente |
| Errores y acciones realizadas | Pendiente |

Considera superado el recorrido de pago cuando se confirman las dos inscripciones, se valida el resultado, el contrato queda Settled, la comparación con la cadena coincide y existe un recibo exitoso de liquidación. La grabación de un vídeo, la prueba de devolución y la evaluación con cinco personas son tareas diferentes.

## 14 Preparar un vídeo entendible

La demostración final grabada el 20 de septiembre de 2026 está disponible en [YouTube](https://youtu.be/LECz_vXmFi0) y en el [archivo audiovisual del repositorio](https://github.com/hvaler/ArenaPay/tree/main/docs/evidencia/media). Es una presentación del recorrido operativo; no convierte retrospectivamente los ensayos históricos en pruebas con dos personas independientes.

Antes de grabar, importa las cuentas y oculta cualquier archivo privado. Mantén cerrados los menús ajenos a la demo. Comprueba Testnet, saldo y servicios. El plazo de una partida sigue avanzando mientras explicas: prepara el guion antes de crearla.

Para mostrar un pago nuevo, graba desde la creación y conserva las confirmaciones de presupuesto y depósito de ambos participantes. Explica que autorizar 3 XLM es un límite, mientras depositar 1 XLM es una transferencia. Luego muestra la competición, la verificación, la firma del cobro, Settled, la coincidencia con la cadena y el recibo.

Para mostrar un ensayo anterior, dilo expresamente: «Voy a revisar una partida que ya se pagó». Abrir ese replay no vuelve a ejecutar una transferencia. Nunca muestres una clave privada, contraseña o frase de recuperación en la grabación.

## 15 Archivos y mantenimiento

El proyecto de trabajo está en `C:\nexus\dev\ArenaPay`. La rama main de GitHub contiene código, pruebas y documentación. La rama gh-pages conserva la compilación de la demo pública. La copia local de publicación está en `.publish/arenapay` y es independiente del repositorio de trabajo principal.

Los archivos `.env`, los datos de cuentas, las dependencias y los datos de ejecución no se suben a GitHub. El respaldo del código no es un respaldo de tus credenciales. No pegues información privada en incidencias o capturas para pedir ayuda.

La fuente editable de esta guía es `docs/guias/runbook-pruebas-arenapay.md`. Su versión HTML se genera para lectura e incorporación a la web. Si cambian los textos de los botones o el flujo, actualiza ambas versiones a partir de esa fuente.

Se han contrastado los tres hallazgos recibidos sobre compromiso de semilla, determinismo y RPC. Las correcciones y sus límites están en `docs/seguridad/auditoria-correcciones-2026-09-12.md`. Este runbook no equivale a una auditoría de seguridad completa ni acredita preparación para Mainnet.

## 16 Fuentes y documentación relacionada

- [Guía oficial para conectar Freighter a Testnet](https://developers.stellar.org/docs/build/guides/freighter/connect-testnet).
- [Ayuda oficial sobre recuperación de wallets en Freighter](https://help.freighter.app/article/iev57sxvkc-import-an-existing-wallet).
- [Repositorio de ArenaPay y README](https://github.com/hvaler/ArenaPay).
- [Registro del ensayo manual](https://github.com/hvaler/ArenaPay/blob/main/docs/guias/ensayo-manual-freighter.md).
- [Código del panel que implementa el recorrido](https://github.com/hvaler/ArenaPay/blob/main/src/apps/web/src/components/TestnetPanel.tsx).

Los menús de importación descritos se observaron en las capturas de Freighter de esta sesión. Los estados y límites descritos corresponden al código local y al ensayo documentado; vuelve a comprobarlos si cambias de versión o despliegue.
