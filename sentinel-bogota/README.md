# Sentinel Bogotá

**Proyecto 002 · Inteligencia estadística para la seguridad ciudadana · 2026-11-25**

Sentinel Bogotá es un observatorio experimental de seguridad y convivencia. Usa indicadores públicos agregados para facilitar la evaluación de tendencias, victimización, percepción y acceso a la denuncia. Está dirigido a analistas de política pública, investigadores y organizaciones comunitarias.

## MVP verificable

- Indicadores de toda Bogotá publicados oficialmente, con periodo, definición y procedencia.
- Comparación interanual de encuestas y variaciones oficiales de delitos registrados.
- Validación del esquema, rangos, fechas y duplicados.
- Tablero HTML generado de manera reproducible, sin servicios externos ni datos personales.
- Documentación de fuentes, metodología, arquitectura, gobernanza y validación.

El tablero distingue porcentajes de encuesta de variaciones relativas de registros administrativos. Los registros no equivalen a toda la incidencia delictiva. No hace inferencias individuales. Las cifras recientes no constituyen información en tiempo real.

## Ejecutar

Python 3.11+; biblioteca estándar.

```bash
cd sentinel-bogota
python -m unittest discover -s tests -v
python build_report.py
```

Abrir `dist/index.html` en el navegador. El reporte es autocontenido.

## Documentación

- [Especificación de producto y metodología](docs/SPECIFICATION.md)
- [Inventario y auditoría de fuentes](docs/DATA_SOURCES.md)
- [Política de publicación](docs/PUBLICATION.md)

Reutilización de código pendiente de selección de licencia por el mantenedor. Las fuentes conservan sus propias condiciones. Los datos incluidos son pequeñas estadísticas publicadas, con atribución y enlaces a los originales.

## Comparación territorial 0.2.0

Mapa coroplético histórico de percepción ciudadana por localidad, selector 2024/2025 y comparación de dos localidades. La consulta textual de barrios informa la ausencia de datos a esa escala. La geometría administrativa se atribuye a SDP, CC BY 4.0.
