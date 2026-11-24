# Tanquea Mejor

Geospatial fuel decision intelligence for Colombia. Una aplicación web experimental para consultar el último precio histórico de combustible disponible por estación, comparar alternativas y simular el costo de desplazamiento.

## Estado

MVP 0.1.0. La fuente mensual auditada contiene 1.368 filas de Bogotá correspondientes a febrero de 2022. La fuente de registros individuales llega hasta mayo de 2018. Los valores son históricos: **confirma el precio y disponibilidad con la estación**.

La búsqueda por municipio, combustible, precio, dirección y marca funciona sin ubicación. Las coordenadas oficiales requieren habilitación después de confirmar los términos de reutilización de la capa UPME. El modo demostración permite probar el mapa y el modelo de costos con datos ficticios claramente identificados.

## Instalación

Requisitos: Node.js 22 o posterior y npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abrir http://localhost:3000. Para producción:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Decisiones de diseño

Next.js con TypeScript, API routes, esquema Zod y Leaflet. La fuente mensual se conserva como copia reproducible con licencia propia. Los registros de 2018 también se conservan como copia reproducible, procedente de la API pública de Datos Abiertos, para permitir consultas en 961 municipios. El servicio de georreferenciación es opcional y solo acepta coincidencias únicas de municipio, nombre y dirección normalizados. No se guardan coordenadas del conductor ni existe una base de datos de usuarios.

- [Arquitectura](docs/ARCHITECTURE.md)
- [Auditoría y fuentes](docs/DATA_SOURCES.md)
- [Modelo de decisión](docs/DECISION_MODEL.md)
- [API](docs/API.md)
- [Despliegue](docs/DEPLOYMENT.md)

## Limitaciones

La cobertura comparativa real depende de la fuente elegida. Los promedios mensuales y registros individuales se muestran por separado. Las distancias son geodésicas de ida y vuelta aproximadas, por debajo de la distancia habitual por carretera. El mapa puede operar sin fondo cartográfico y admite un proveedor de teselas autorizado. No se ofrece navegación, predicción de precios, reportes comunitarios ni estimación probabilística en esta versión.

La licencia de los datos públicos pertenece a sus titulares; véase [data/README.md](data/README.md).

## Capturas de interfaz

La captura del panel de consulta de Bogotá y del mapa de demostración se incorporará después de validar la aplicación en un navegador con soporte completo de geolocalización.
