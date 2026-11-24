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

## Actualización de 2026

- [CREG Circular 371/2026](https://gestornormativo.creg.gov.co/gestor/entorno/docs/originales/Circular_CREG_371_2026/Circular_CREG_371_2026.pdf), anexo de referencia vigente desde el 1 de noviembre: gasolina corriente y ACPM, 13 ciudades, COP/galón. Se transcriben los valores numéricos regulatorios y se incluyen los enlaces al acto oficial. No representan cotizaciones individuales.
- [UPME, estadísticas de precios mensuales EDS](https://www.upme.gov.co/simec/hidrocarburos/combustibles-liquidos/informacion-de-precios-mensuales-en-estaciones-de-servicio/): se descargó y examinó el Excel de julio de 2026, con estadísticas agregadas por ciudad y producto, consultado por UPME en SICOM el 27/08/2026. No identifica la estación con menor precio. Sus [condiciones de uso](https://www.upme.gov.co/nosotros/talento-humano/politica-privacidad-condiciones-uso/) limitan reproducción; se enlaza el informe y se evita redistribuir la hoja.
- [DANE, IPC octubre 2026](https://www.dane.gov.co/files/operaciones/IPC/oct2026/bol-IPC-oct2026.pdf), variación mensual de combustibles para vehículos 0,55 %. Indicador agregado, sin precios de estaciones.
- [SICOM, boletín estadístico](https://sicom.gov.co/index.php/boletin-estadistico): su reporte de precios de venta contiene un botón oficial de descarga con destino público `https://eds.sicom.gov.co/eds/api/v1/birest/datasetPrecios`. El sitio devolvió una página de acceso bloqueado el 24/11/2026; no se pudo verificar esquema ni nivel de desagregación del archivo. Se deja sin integración hasta obtener una exportación accesible y autorizada. El antiguo selector de consulta de precios termina en el segundo trimestre de 2024.
- [GNCV, he3q-86dn](https://www.datos.gov.co/d/he3q-86dn): fuente CC BY-SA 4.0. Se validaron 1.864 filas de 2026, 69 municipios y 154 filas en noviembre; el catálogo especifica promedio mensual por estación. No se mezcla con combustibles líquidos ni se usan coordenadas municipales como ubicación de EDS.
- [Despacho de combustibles líquidos, fbht-2fzd](https://www.datos.gov.co/d/fbht-2fzd): conjunto actualizado diariamente, contiene volumen despachado y municipio, pero no precio de venta ni nombre individual de estación, por lo que no se usa para inferir precios.

El modo predeterminado de la aplicación muestra referencias oficiales de 2026 y únicamente observaciones individuales de ese año con fuente verificada. El archivo de 2018/2022 se consulta explícitamente.

### Importar una exportación individual autorizada

Cuando se disponga de una exportación con identidad individual de EDS y autorización de uso, normalizar el archivo a un arreglo JSON con el siguiente esquema. No se asume que coincida con el esquema del archivo bloqueado de SICOM.

| Campo               | Tipo                                                                      |
| ------------------- | ------------------------------------------------------------------------- |
| stationId           | Identificador estable de EDS                                              |
| name, address, city | Texto                                                                     |
| cityCode            | Código DANE de cinco dígitos                                              |
| brand               | Texto opcional                                                            |
| fuel                | corriente, extra, diesel o biodiesel                                      |
| price               | Número positivo                                                           |
| unit                | galón                                                                     |
| date                | AAAA-MM o AAAA-MM-DD                                                      |
| kind                | monthly (promedio) o reported (observación individual)                    |
| source              | URL HTTPS del dominio oficial de gobierno                                 |
| point               | Coordenadas opcionales {lat, lon}, solo con locationSource y autorización |
| locationSource      | Fuente y fecha de las coordenadas                                         |

Guardar el archivo fuera del repositorio o con extensión `.local.json`, configurar `AUTHORIZED_LIQUID_STATIONS_FILE` en el entorno local, reiniciar la app y usar “Referencias y datos de 2026”. Se excluyen años anteriores del modo actual, se selecciona el último mes disponible y se evita mezclar promedios con registros individuales. El operador debe verificar la fuente y licencia antes de habilitarlo. La interfaz muestra fecha y procedencia.
