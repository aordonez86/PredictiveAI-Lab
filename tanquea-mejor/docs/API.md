# API

## GET /api/stations

| Parámetro requerido | Valores                                   |
| ------------------- | ----------------------------------------- |
| city                | Código DANE de cinco dígitos              |
| fuel                | corriente, extra, diesel, biodiesel, gncv |
| kind                | current, auto, monthly, reported, demo    |

Devuelve JSON `{ stations: Observation[], warnings: string[] }`. Cada observación incluye identidad, nombre, dirección, ciudad, marca, combustible, precio, fecha, categoría, fuente y coordenadas opcionales.

- 200: lista; puede estar vacía.
- 400: parámetros inválidos.
- 429: límite de solicitudes por instancia.
- 503: error de la fuente.

Las coordenadas del usuario no se envían al servidor.

`current` devuelve datos de 2026 solo si existe observación individual autorizada para combustible y municipio. GNCV devuelve el periodo más reciente del municipio dentro de la copia 2026. La ausencia de precios líquidos individuales se expresa como lista vacía con advertencia. `auto` conserva la consulta histórica.
