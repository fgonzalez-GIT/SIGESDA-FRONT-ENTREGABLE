/**
 * Recibo Helpers
 *
 * Funciones auxiliares para trabajar con recibos, incluyendo
 * generación de títulos representativos y formateo de información.
 *
 * Fecha: 13/03/2026
 */

import { Recibo } from '@/store/slices/recibosSlice';
import { formatDateLongES } from '@/utils/dateHelpers';

// ============================================================================
// HELPERS DE TÍTULO REPRESENTATIVO
// ============================================================================

/**
 * Capitaliza la primera letra de un string
 * @param str - String a capitalizar
 * @returns String con primera letra mayúscula
 */
const capitalizeFirst = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Genera un título representativo para un recibo según su tipo y fecha
 *
 * Determina el tipo de recibo basándose en personaTipo:
 * - Si personaTipo incluye "SOCIO" (y NO es "NO_SOCIO") → "Cuota Socio"
 * - Si personaTipo es "NO_SOCIO" o cualquier otro → "Pago de Actividades"
 *
 * Casos manejados:
 * - "SOCIO", "socio" → "Cuota Socio"
 * - "SOCIO,DOCENTE" → "Cuota Socio" (combinación con otros tipos)
 * - "NO_SOCIO", "no_socio" → "Pago de Actividades"
 * - "DOCENTE", "PROVEEDOR", etc. → "Pago de Actividades"
 *
 * @param recibo - Objeto Recibo completo
 * @returns Título formateado (ej: "Cuota Socio - Marzo 2026")
 *
 * @example
 * // Recibo de socio en marzo 2026
 * generarTituloRecibo({
 *   personaTipo: 'SOCIO',
 *   fechaEmision: '2026-03-15T10:00:00.000Z',
 *   ...
 * }) // → "Cuota Socio - Marzo 2026"
 *
 * @example
 * // Recibo de no socio en abril 2026
 * generarTituloRecibo({
 *   personaTipo: 'NO_SOCIO',
 *   fechaEmision: '2026-04-20T10:00:00.000Z',
 *   ...
 * }) // → "Pago de Actividades - Abril 2026"
 *
 * @example
 * // Recibo de no socio (formato con guión bajo) en abril 2026
 * generarTituloRecibo({
 *   personaTipo: 'no_socio',
 *   fechaEmision: '2026-04-20T10:00:00.000Z',
 *   ...
 * }) // → "Pago de Actividades - Abril 2026"
 */
export const generarTituloRecibo = (recibo: Recibo): string => {
    // Obtener mes/año de fechaEmision
    const fecha = new Date(recibo.fechaEmision);

    // Usar formatDateLongES para obtener formato "6 de marzo de 2026"
    // Luego extraer solo "marzo de 2026"
    const fechaLarga = formatDateLongES(recibo.fechaEmision);
    const partes = fechaLarga.split(' de ');

    // partes[1] = mes (ej: "marzo")
    // partes[2] = año (ej: "2026")
    const mes = partes[1] || '';
    const anio = partes[2] || fecha.getFullYear().toString();

    // Determinar tipo de recibo según personaTipo
    // Normalizar a mayúsculas para comparación
    const tipoNormalizado = recibo.personaTipo?.toUpperCase() || '';

    // Verificar que NO sea NO_SOCIO y que contenga SOCIO
    // Esto maneja casos como: "SOCIO", "socio", "SOCIO,DOCENTE", etc.
    const esNoSocio = tipoNormalizado.includes('NO_SOCIO') || tipoNormalizado === 'NO SOCIO';
    const esSocio = !esNoSocio && tipoNormalizado.includes('SOCIO');

    const tipoBase = esSocio ? 'Cuota Socio' : 'Pago de Actividades';

    // Capitalizar mes (marzo → Marzo)
    const mesCapitalizado = capitalizeFirst(mes);

    return `${tipoBase} - ${mesCapitalizado} ${anio}`;
};

/**
 * Genera un resumen de items para mostrar en listados
 * @param cantidadItems - Número total de items/conceptos
 * @returns String formateado (ej: "3 items" o "1 item")
 */
export const generarResumenItems = (cantidadItems: number): string => {
    return `${cantidadItems} ${cantidadItems === 1 ? 'item' : 'items'}`;
};
