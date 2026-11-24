# Auditoría de fuentes — 24/11/2026

| Conjunto                      | ID        | Filas verificadas | Periodo de observación     | Licencia     |
| ----------------------------- | --------- | ----------------: | -------------------------- | ------------ |
| precio mes combustible        | gjy9-tpph |             1.368 | febrero de 2022            | CC BY-SA 4.0 |
| Precios Combustibles (2017-1) | x6id-4v3g |            13.574 | registro máximo 2018-05-13 | CC BY-SA 4.0 |

Ambos catálogos declaran alcance nacional y frecuencia mensual. La consulta de contenido confirma que el primero contiene exclusivamente Bogotá y un solo mes. Sus metadatos indican última modificación de filas en diciembre de 2022; los del segundo, mayo de 2018. La fecha de publicación o ingestión no se confunde con la fecha del precio.

Campos utilizados: municipio y código DANE, estación, bandera, dirección, producto, precio y periodo/mes o fecha de registro. Ninguno contiene coordenadas ni identificador SICOM común. Se normaliza la identidad a municipio + nombre + dirección; pueden quedar duplicados si cambia la identidad textual. Se excluyen registros inválidos y conflictos simultáneos. Los productos no reconocidos se excluyen.

Los documentos oficiales de MinEnergía expresan precios de combustibles líquidos en COP/galón; los esquemas de los conjuntos no incluyen columna explícita de unidad ni moneda. El MVP aplica esa convención colombiana de forma explícita, pendiente de confirmación formal del titular del conjunto. No se convierten ni mezclan fuentes de GNCV.

## Georreferenciación

La capa [Estaciones de servicio UPME](https://geo.upme.gov.co/server/rest/services/Capas_Hidrocarburos/estaciones_servicio/FeatureServer/6) permite consultas públicas con salida EPSG:4326. Se verificó una muestra para Bogotá con nombre, dirección, código municipal, coordenadas y año de fuente (2023). La [documentación UPME](https://sig.upme.gov.co/FAQ_Geovisores/Geovisor%20Infraestructura%20de%20Hidrocarburos.pdf) describe la descarga pública de capas; todavía falta confirmar la licencia específica de reutilización en esta aplicación. El adaptador permanece deshabilitado por defecto. Las coordenadas habilitadas se solicitan por municipio y no se persisten. Coincidencias ambiguas o incompletas se descartan.

## Reproducir auditoría

- https://www.datos.gov.co/api/views/gjy9-tpph.json
- https://www.datos.gov.co/api/views/x6id-4v3g.json
- https://www.datos.gov.co/resource/gjy9-tpph.json?$select=periodo,mes,count(*)%20as%20n&$group=periodo,mes
- https://www.datos.gov.co/resource/x6id-4v3g.json?$select=count(*)%20as%20n,max(fecharegistro)%20as%20latest
- https://www.minenergia.gov.co/es/ministerio/gestion/gestion-informacion/datos-abiertos/

Para actualizar la copia mensual, verificar esquema, licencia, número de registros, cobertura, fechas y unidades antes de sustituirla. No se garantiza una frecuencia de actualización.

## Control de duplicados

Para gasolina corriente, 541 filas de origen representan 369 identidades textuales; 44 identidades tienen precios incompatibles en el mismo periodo y se excluyen. Resultado: 325 estaciones comparables.

## Disponibilidad y siguientes fuentes

La copia nacional comprimida cubre 961 municipios, con 13.574 filas. Permite consultas sin acceso en vivo a la API y conserva la respuesta original. La opción automática elige el promedio mensual cuando existe para el municipio y combustible; de lo contrario usa la copia de registros individuales. SICOM publica indicadores actuales en su portal y tableros Power BI (https://sicom.gov.co/). No encontramos un contrato documentado de API de precios por estación para ese tablero; se deja pendiente su integración.
