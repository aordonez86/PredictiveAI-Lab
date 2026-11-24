# Modelo de decisión

Dentro de una categoría de fuente y combustible, se toma la observación de fecha máxima por identidad de estación. Si existen precios distintos para una misma identidad y fecha máxima, se excluye la observación conflictiva.

Sea q la compra en galones, p el precio por galón observado, d la distancia geodésica al origen en km, r el rendimiento en km/galón y p0 el precio de referencia que introduce el conductor.

`C = q * p + (2 * d / r) * p0`

La distancia se calcula por Haversine con radio terrestre 6371 km. La multiplicación por dos representa un viaje hipotético de ida y vuelta. Sin coordenadas, rendimiento o precio de referencia, solo se presentan precios históricos y direcciones. El ahorro estimado se compara con la estación georreferenciada más cercana entre las alternativas visibles.

Ejemplo: 10 galones a COP 15.000, distancia de ida 2 km, 40 km/galón y referencia COP 16.000 por galón. Compra COP 150.000, desplazamiento COP 1.600 y costo COP 151.600.

El costo es una simulación basada en datos históricos y supuestos del usuario. No modela tráfico, ruta real, disponibilidad ni cambios de precio. No es un intervalo estadístico calibrado.
