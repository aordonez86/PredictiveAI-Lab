# Despliegue

Ejecutar npm ci, npm run lint, npm run typecheck, npm test y npm run build con Node.js 22+. Ejecutar npm start en un entorno HTTPS (requerido para geolocalización fuera de localhost).

Configurar variables de entorno según .env.example. No habilitar la consulta geográfica hasta confirmar los términos de UPME. Cualquier proveedor de teselas debe autorizar el volumen y el uso en navegador y mostrar atribución. El fondo cartográfico es opcional.

Para producción con tráfico público, configurar límites de solicitudes y concurrencia por IP en el proxy de entrada según el entorno de despliegue. La API aplica validación, caché, timeout, misma procedencia y un límite global de 120 solicitudes por minuto por instancia, sin almacenar direcciones IP. No publicar secretos; los valores NEXT_PUBLIC son visibles en el navegador.

Ejecutar npm audit como parte de la revisión de dependencias.

Para habilitar precios individuales de combustibles líquidos con una exportación autorizada, usar `AUTHORIZED_LIQUID_STATIONS_FILE` y el esquema descrito en DATA_SOURCES.md. Mantener el archivo fuera del repositorio. El MVP incluye la copia GNCV de 2026. Las referencias regulatorias reflejan la Circular 371 de 2026; verificar las circulares posteriores antes de actualizar la referencia.
