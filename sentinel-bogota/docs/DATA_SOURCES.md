# Inventario de fuentes

Consulta: 25 de noviembre de 2026 (Colombia). Se utiliza el ámbito Bogotá D.C. en el MVP. Un catálogo actualizado no demuestra que la fecha de observación sea reciente.

| Entidad / conjunto | Periodo o publicación comprobados | Formato y granularidad | Licencia / estado |
|---|---|---|---|
| SDSCJ / [balance de delitos de alto impacto](https://bogota.gov.co/mi-ciudad/seguridad/2026-10/en-bogota-varios-delitos-siguen-disminuyendo-lea-y-conozca-cuales-son) | Enero–septiembre 2026 vs 2025; 15-oct-2026 | HTML, variaciones agregadas de toda la ciudad | Fuente oficial; extracción de cifras puntuales atribuidas; condiciones de redistribución del conjunto de origen pendientes |
| SDSCJ / [balance de octubre](https://bogota.gov.co/mi-ciudad/seguridad/2026-11/octubre-2026-de-ofensiva-contra-el-crimen-en-bogota-balance-seguridad) | Octubre 2026, publicado 2-nov-2026 | HTML, balance de actividad institucional, métrica diferente a delitos registrados | Consultado como contexto, no integrado en la serie |
| Policía Nacional / [Estadística delictiva](https://www.policia.gov.co/estadistica-delictiva) | Índice anuncia series 2020–2026; fecha exacta de último mes pendiente de verificación del archivo agregado | Cuadros de salida mensuales; cifras provisionales; calendario de difusión | Condiciones de reutilización pendientes; no se descargan registros de eventos |
| SDSCJ / [Delito de Alto Impacto](https://datosabiertos.bogota.gov.co/dataset/delito-de-alto-impacto-bogota-d-c) | Catálogo identificado; contenido y corte no comprobados | Servicio ESRI REST; campos y cobertura por verificar | CC BY-SA 4.0 según ficha indexada; no integrado |
| SDSCJ / [boletines de seguridad](https://experience.arcgis.com/experience/7f7e290408fd4218906a6e07b808f8fd/page/Page-Boletines-Estudios0) | Portal mensual; [boletín diciembre de 2025](https://scj.gov.co/sites/default/files/2026-01/Bolet%C3%ADn_Diciembre_2025.pdf) identificado | PDF y visor; series agregadas | Revisiones por registros posteriores; corte más reciente pendiente |
| CCB / [EPV 2025](https://www.ccb.org.co/de-interes/comunicados/bogota-mejoro-en-indicadores-de-victimizacion-y-percepcion-de-seguridad-en-2025) | 2025, publicado 17-feb-2026, comparación 2024 | Resumen de encuesta, proporciones; 20.038 entrevistados, 20 localidades | Derechos reservados; se citan estadísticas puntuales; no se redistribuyen microdatos |
| CCB / [EPV 2026](https://www.ccb.org.co/de-interes/noticias/encuesta-de-percepcion-y-victimizacion-de-seguridad-ciudadana-en-bogota-2026) | Recolección anunciada septiembre–noviembre 2026, anuncio 24-ago-2026 | Encuesta; resultados aún no verificados | Pendiente |
| DANE / [ECSC 2024](https://www.dane.gov.co/files/operaciones/ECSC/bol-ECSC-2024.pdf) | Referencia 2023; boletín 20-nov-2025 | PDF; encuesta probabilística, personas 15+ | Uso de indicadores publicados; no se combina con CCB sin armonización |
| SDP / [metodología proyecciones demográficas](https://sistemas002.sdp.gov.co/sites/default/files/documento_metodologico_proyecciones_pob.pdf) | Proyección por localidad 2018–2035 | Metodología; tabla de población y versión exactas pendientes | Validación pendiente |
| SDP / [Localidad Bogotá D.C.](https://datosabiertos.bogota.gov.co/dataset/localidad-bogota-d-c) | Ficha identificada; vigencia de geometrías pendiente | ESRI REST, WMS, WFS | CC BY 4.0 según ficha; no integrado |

La fuente más reciente por **publicación** entre los balances verificados es el informe de actividad de octubre del 2 de noviembre. Para **comparación de criminalidad registrada**, el último periodo comprobado en el MVP es enero–septiembre de 2026, no octubre. La Policía indica que el corte mensual se extrae el día 16 siguiente y que las cifras pasan a definitivas en marzo del año siguiente.

## Variables verificadas y limitaciones

Los seis valores CCB corresponden a estimaciones difundidas en el comunicado, no a conteos administrativos. La incorporación de Sumapaz en 2025 puede afectar comparabilidad. Los tres cambios SDSCJ comparan ventanas equivalentes; no permiten reconstruir conteos absolutos ni tasas. Se conserva la fecha de publicación, no se presume fecha de denuncia o registro individual. La variación y el redondeo corresponden a las publicaciones originales.

Se requiere una serie oficial agregada con denominadores, definiciones estables, fecha de corte, revisiones y metadatos para cuantificar incertidumbre. No se calculan tasas poblacionales a partir de los porcentajes publicados.

## Comparación territorial (25/11/2026)

- CCB, [EPV 2025 desagregación por localidades](https://bibliotecadigital.ccb.org.co/items/6bfdcdc8-8641-48ef-ac20-6e6fe6030f04). Se transcriben los valores publicados en el gráfico comparativo “Percepción de barrio seguro, según localidad donde vive” (2024–2025). El gráfico posterior de mapa contiene valores diferentes y no se usa para alimentar esta vista. Sumapaz no figura en la tabla comparativa y se representa sin dato. El valor corresponde a la localidad de residencia del encuestado y no a una medición por barrio.
- SDP, [Localidad Bogotá D.C.](https://datosabiertos.bogota.gov.co/dataset/localidad-bogota-d-c), licencia CC BY 4.0. Catálogo consultado 25/11/2026, metadatos modificados 28/02/2023, fecha de vigencia geométrica no comprobada. Archivo de 20 polígonos ESRI JSON en MAGNA-SIRGAS (EPSG:4686), simplificados para visualización y normalizados por nombre. Se conservan códigos administrativos. No contiene hechos delictivos.

## Series anuales de encuesta

Se añadieron 11 pares anuales, 2015–2025, de victimización y percepción de aumento de inseguridad de toda Bogotá, transcritos de los gráficos correspondientes de la presentación [EPV 2025 por localidad / COSEC](https://bibliotecadigital.ccb.org.co/items/6bfdcdc8-8641-48ef-ac20-6e6fe6030f04), consultada 25/11/2026. Son porcentajes publicados de la misma encuesta; se calcula Pearson sobre pares anuales completos. La muestra pequeña, cobertura cambiante y dependencia temporal impiden interpretar la asociación como causal.
