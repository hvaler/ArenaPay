# Licencia, copyright y protección de ArenaPay

Revisión: 14 de septiembre de 2026. Este documento explica la política aplicada al repositorio público consolidado; no sustituye asesoramiento jurídico para acuerdos comerciales, registro de marca o constitución de una empresa.

## Decisión vigente

- Titular indicado: **Hugo Carlos Valer Rojas**.
- Licencia pública: [`AGPL-3.0-only`](../../LICENSE).
- Alternativa: licencia comercial mediante acuerdo escrito separado.
- Identificador SPDX de `package.json`: `AGPL-3.0-only`.

Quien no tenga un acuerdo comercial firmado debe cumplir AGPL-3.0-only. El aviso de [licencia comercial](../../COMMERCIAL-LICENSE.md) informa de la alternativa, pero por sí mismo no concede derechos adicionales.

## Qué protege AGPL

AGPL permite usar, estudiar, modificar y distribuir ArenaPay. Su condición específica para software de red exige que quien opere públicamente una versión modificada ofrezca a sus usuarios el código fuente correspondiente en los casos cubiertos por la licencia. La aplicación incluye un enlace visible al repositorio público.

La [Free Software Foundation recomienda considerar AGPL](https://www.gnu.org/licenses/license-recommendations.html) para programas que pueden modificarse y ofrecerse como servicios de red. El [texto oficial de AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) contiene las condiciones completas.

AGPL no impide cobrar por el software o por un servicio. Tampoco concede una licencia comercial cerrada ni permite eliminar los avisos exigidos.

## Para qué sirve la licencia comercial

El titular puede ofrecer, mediante contrato independiente, condiciones distintas a una organización que no quiera o no pueda operar bajo AGPL. Precio, alcance, soporte, garantía, duración y derechos de redistribución se definen en ese acuerdo; no están concedidos en el repositorio.

Este modelo solo puede mantenerse si el titular controla los derechos necesarios sobre las contribuciones. Antes de aceptar código externo debe utilizarse un acuerdo de contribución que permita conservar la opción comercial o solicitar una cesión adecuada.

Las dependencias conservan sus propias licencias. No forman parte de la licencia comercial de ArenaPay salvo que un acuerdo y sus licencias digan expresamente lo contrario.

## Publicación consolidada

El repositorio público `hvaler/ArenaPay` se crea como una instantánea consolidada con un único commit inicial y AGPL-3.0-only aplicada desde ese commit. El repositorio privado `hvaler/ArenaPay-Dev` conserva el historial de desarrollo.

Reescribir o separar el historial no revoca permisos que alguien hubiera recibido sobre copias anteriores. La separación establece con claridad las condiciones de la publicación consolidada y de las versiones futuras.

## Marca y materiales gráficos

La licencia de código no equivale al registro de una marca. El nombre ArenaPay y su logotipo no deben presentarse como marca registrada mientras no se complete un análisis de disponibilidad y, si procede, su registro en los territorios y categorías elegidos.

Antes de ofrecer licencias comerciales conviene definir por escrito el uso permitido del nombre y el logotipo, además de revisar la titularidad de dominios, cuentas y materiales gráficos.

## Mantenimiento

Al cambiar la política de licencia deben actualizarse conjuntamente `LICENSE`, `COMMERCIAL-LICENSE.md`, `package.json`, README, la aplicación y este documento. Cada publicación debe conservar el identificador SPDX y el aviso de copyright correctos.
