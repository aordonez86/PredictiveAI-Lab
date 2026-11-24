# Arquitectura

```mermaid
flowchart TD
  U[Interfaz web] --> A["GET /api/stations"]
  A --> P[FuelDataProvider]
  P --> S[Datos Abiertos]
  P --> G[UPME opcional]
  A --> D[Adaptador de demostración]
  A --> U
  U --> M[Motor puro de comparación]
  U --> L[Mapa Leaflet]
```

El frontend conserva el punto de origen únicamente en memoria. La API valida el código DANE, combustible y modo de datos; el proveedor consulta copias históricas comprobadas y la fuente geográfica opcional, con tiempos de espera y caché de una hora. El motor de decisión no depende de una API ni de React.

El dominio incluye identidad, nombre, municipio, dirección, marca, tipo de producto, precio, fecha o periodo, fuente, categoría de dato y coordenadas opcionales. Las categorías mensual, puntual y demostración se excluyen entre sí. El contrato del proveedor expone país, moneda y unidad. Añadir otro país requiere adaptador de fuente y configuración local.

PostgreSQL/PostGIS se reservaría para almacenamiento histórico autorizado, consultas espaciales y coincidencias entre fuentes. Para el volumen actual una copia histórica y consultas por municipio son suficientes.

## Vista 2026

La vista predeterminada utiliza una tabla de referencias regulatorias CREG separada de las observaciones de estaciones. El proveedor GNCV usa una copia oficial de 2026 y devuelve un único periodo mensual por municipio; una exportación individual autorizada de líquidos puede configurarse mediante un archivo local validado. El archivo histórico se mantiene disponible a pedido. El comparador de cotizaciones opera en el navegador y expresa el costo de compra y la desviación en la unidad del combustible seleccionado.
