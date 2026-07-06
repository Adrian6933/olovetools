/**
 * Configuración central de Google Analytics 4. Este es el ÚNICO archivo a editar
 * cuando el usuario cree la propiedad GA4: pega el Measurement ID abajo.
 * Con el ID vacío, no se carga ningún script de analítica (ni en dev ni en producción).
 */
export const GA_MEASUREMENT_ID = '';

export const ANALYTICS_ENABLED = GA_MEASUREMENT_ID.length > 0;
