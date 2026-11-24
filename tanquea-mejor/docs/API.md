# API

## GET /api/stations

| Parámetro requerido | Valores                             |
| ------------------- | ----------------------------------- |
| city                | Código DANE de cinco dígitos        |
| fuel                | corriente, extra, diesel, biodiesel |
| kind                | auto, monthly, reported, demo       |

Devuelve JSON `{ stations: Observation[], warnings: string[] }`. Cada observación incluye identidad, nombre, dirección, ciudad, marca, combustible, precio, fecha, categoría, fuente y coordenadas opcionales.

- 200: lista; puede estar vacía.
- 400: parámetros inválidos.
- 429: límite de solicitudes por instancia.
- 503: error de la fuente.

Las coordenadas del usuario no se envían al servidor.
