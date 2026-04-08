/**
 * Constantes para la API y servicios
 */

/**
 * Límite máximo de registros que el backend acepta en una sola petición
 *
 * El backend rechaza valores muy altos (como 9999) con error 400.
 * Este límite se usa cuando se necesita cargar "todos" los registros
 * disponibles para estadísticas, exportaciones, etc.
 *
 * NOTA: Si el backend actualiza su límite máximo, ajustar este valor.
 */
export const MAX_API_LIMIT = 500;

/**
 * Límite por defecto para paginación estándar
 */
export const DEFAULT_PAGE_LIMIT = 20;

/**
 * Opciones comunes de paginación
 */
export const PAGINATION_OPTIONS = [10, 20, 50, 100] as const;
