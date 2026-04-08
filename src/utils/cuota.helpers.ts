/**
 * Cuota Helpers - V2 Architecture
 *
 * Funciones auxiliares para trabajar con la nueva estructura de cuotas V2
 * que incluye receptor.tipos[] (Architecture V2) e items[] (desglose completo).
 *
 * Basado en: GUIA_MIGRACION_FRONTEND_CUOTAS_V2.md del backend
 * Fecha: 29/01/2026
 */

import {
    Cuota,
    ItemCuota,
    ReceptorCuotaDTO,
    TipoPersonaActivo,
    CategoriaItemCuotaCodigo,
    TotalesCuota,
    ItemsPorCategoria,
    DesgloseItemsResponse,
} from '@/types/cuota.types';
import { CategoriaSocio as CategoriaSocioEntity } from '@/types/persona.types';

// ============================================================================
// HELPERS DE TIPO DE PERSONA V2
// ============================================================================

/**
 * Obtiene el tipo de persona activo de un receptor
 * El backend filtra por activo: true, así que usualmente será el primero
 *
 * @param receptor - Receptor de la cuota con tipos[]
 * @returns El primer tipo activo o null si no hay tipos
 *
 * @example
 * const tipoPersona = getTipoPersonaActivo(cuota.recibo.receptor);
 * console.log(tipoPersona?.tipoPersona.codigo); // 'SOCIO'
 */
export function getTipoPersonaActivo(
    receptor: ReceptorCuotaDTO
): TipoPersonaActivo | null {
    if (!receptor.tipos || receptor.tipos.length === 0) {
        return null;
    }

    // El backend ya filtra por activo: true, así que tomamos el primero
    return receptor.tipos[0] as TipoPersonaActivo;
}

/**
 * Verifica si una persona es SOCIO activo
 *
 * @param receptor - Receptor de la cuota
 * @returns true si es SOCIO activo, false en caso contrario
 *
 * @example
 * if (esSocioActivo(cuota.recibo.receptor)) {
 *   console.log('Es un socio activo');
 * }
 */
export function esSocioActivo(receptor: ReceptorCuotaDTO): boolean {
    const tipo = getTipoPersonaActivo(receptor);
    return tipo?.tipoPersona.codigo === 'SOCIO';
}

/**
 * Obtiene la categoría del socio (si es SOCIO)
 * Retorna null si la persona no es SOCIO o no tiene categoría
 *
 * @param receptor - Receptor de la cuota
 * @returns Categoría del socio o null
 *
 * @example
 * const categoria = getCategoriaSocio(cuota.recibo.receptor);
 * console.log(categoria?.nombre); // 'Estudiante'
 */
export function getCategoriaSocio(
    receptor: ReceptorCuotaDTO
): CategoriaSocioEntity | null {
    const tipo = getTipoPersonaActivo(receptor);
    if (tipo?.tipoPersona.codigo === 'SOCIO') {
        return tipo.categoria;
    }
    return null;
}

// ============================================================================
// HELPERS DE ÍTEMS DE CUOTA
// ============================================================================

/**
 * Determina si un ítem debe DESCONTAR del total de la cuota.
 *
 * Prioridad:
 *  1. formula.descuenta === true  → DESCUENTA (explícito, prevalece sobre categoria)
 *  2. formula.descuenta === false → SUMA       (explícito)
 *  3. categoriaItem.codigo === 'DESCUENTO' → DESCUENTA (fallback por categoría)
 *  4. En cualquier otro caso      → SUMA
 *
 * @param item - Ítem de cuota con tipoItem incluido
 */
export function esItemQueDescuenta(item: ItemCuota): boolean {
    if (item.tipoItem?.formula?.descuenta === true) return true;
    if (item.tipoItem?.formula?.descuenta === false) return false;
    return item.tipoItem?.categoriaItem?.codigo === 'DESCUENTO';
}

/**
 * Agrupa ítems de cuota por categoría
 *
 * @param items - Array de ítems de la cuota
 * @returns Objeto con ítems agrupados por código de categoría
 *
 * @example
 * const agrupados = agruparItemsPorCategoria(cuota.items);
 * console.log(agrupados.BASE); // [item1, item2, ...]
 * console.log(agrupados.DESCUENTO); // [item3, ...]
 */
export function agruparItemsPorCategoria(
    items: ItemCuota[]
): Partial<ItemsPorCategoria> {
    return items.reduce((acc, item) => {
        // Si formula.descuenta es explícitamente true, agrupar siempre como DESCUENTO
        const categoria = esItemQueDescuenta(item)
            ? 'DESCUENTO'
            : item.tipoItem.categoriaItem.codigo;
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria]!.push(item);
        return acc;
    }, {} as Partial<ItemsPorCategoria>);
}

/**
 * Calcula totales de una cuota desde sus ítems
 * Reemplaza el uso de montoBase y montoActividades (deprecated)
 *
 * @param cuota - Cuota con items[]
 * @returns Totales calculados por categoría
 *
 * @example
 * const totales = calcularTotalesCuota(cuota);
 * console.log(totales.base); // 5000
 * console.log(totales.actividades); // 2500
 * console.log(totales.descuentos); // 300 (valor absoluto)
 * console.log(totales.total); // 7200
 */
export function calcularTotalesCuota(cuota: Cuota): TotalesCuota {
    const items = cuota.items || [];

    const totales: TotalesCuota = {
        base: 0,
        actividades: 0,
        descuentos: 0,
        recargos: 0,
        ajustes: 0,
        total: 0,
    };

    items.forEach((item) => {
        const monto = decimalToNumber(item.monto);
        const categoria = item.tipoItem.categoriaItem.codigo;

        // Si el ítem descuenta (por formula.descuenta o por categoría DESCUENTO)
        // siempre se cuenta como descuento, independiente del código de categoría
        if (esItemQueDescuenta(item)) {
            totales.descuentos += Math.abs(monto);
            return;
        }

        switch (categoria) {
            case 'BASE':
                totales.base += monto;
                break;
            case 'ACTIVIDAD':
                totales.actividades += monto;
                break;
            case 'RECARGO':
                totales.recargos += monto;
                break;
            case 'AJUSTE':
                totales.ajustes += monto;
                break;
            default:
                // ADICIONAL u otros que suman
                totales.ajustes += monto;
        }
    });

    // Calcular total real desde ítems usando esItemQueDescuenta() para determinar el signo.
    // Prioridad: formula.descuenta (explícito) → categoriaItem.codigo === 'DESCUENTO' (fallback).
    // No se confía en el signo del monto almacenado; siempre se fuerza resta para descuentos.
    // Fallback a montoTotal solo cuando items[] está vacío.
    if (items.length > 0) {
        totales.total = items.reduce((sum, item) => {
            const valor = decimalToNumber(item.monto) * decimalToNumber(item.cantidad);
            if (esItemQueDescuenta(item)) {
                return sum - Math.abs(valor);
            }
            return sum + valor;
        }, 0);
    } else {
        totales.total = decimalToNumber(cuota.montoTotal);
    }

    return totales;
}

/**
 * Obtiene ítems de una categoría específica
 *
 * @param cuota - Cuota con items[]
 * @param categoria - Código de categoría a filtrar
 * @returns Array de ítems de la categoría especificada
 *
 * @example
 * const actividades = getItemsPorCategoria(cuota, 'ACTIVIDAD');
 * console.log(actividades.length); // 2
 */
export function getItemsPorCategoria(
    cuota: Cuota,
    categoria: CategoriaItemCuotaCodigo
): ItemCuota[] {
    return (
        cuota.items?.filter(
            (item) => item.tipoItem.categoriaItem.codigo === categoria
        ) || []
    );
}

/**
 * Verifica si una cuota tiene descuentos aplicados
 *
 * @param cuota - Cuota a verificar
 * @returns true si tiene al menos un descuento
 *
 * @example
 * if (tieneDescuentos(cuota)) {
 *   console.log('Esta cuota tiene descuentos aplicados');
 * }
 */
export function tieneDescuentos(cuota: Cuota): boolean {
    return (
        cuota.items?.some(
            (item) => item.tipoItem.categoriaItem.codigo === 'DESCUENTO'
        ) || false
    );
}

/**
 * Crea un desglose completo de la cuota con ítems agrupados y totales
 *
 * @param cuota - Cuota a desgl osar
 * @returns Desglose completo con ítems por categoría y totales
 *
 * @example
 * const desglose = crearDesgloseCompleto(cuota);
 * console.log(desglose.base); // [item1, item2]
 * console.log(desglose.totales.total); // 7200
 */
export function crearDesgloseCompleto(cuota: Cuota): DesgloseItemsResponse {
    const items = cuota.items || [];
    const agrupados = agruparItemsPorCategoria(items);

    return {
        base: agrupados.BASE || [],
        actividades: agrupados.ACTIVIDAD || [],
        descuentos: agrupados.DESCUENTO || [],
        recargos: agrupados.RECARGO || [],
        ajustes: agrupados.AJUSTE || [],
        totales: calcularTotalesCuota(cuota),
    };
}

// ============================================================================
// HELPERS DE FORMATEO Y UTILIDADES
// ============================================================================

/**
 * Formatea el período de la cuota (Ej: "Febrero 2026")
 *
 * @param cuota - Cuota con mes y año
 * @returns String formateado con el período
 *
 * @example
 * const periodo = formatearPeriodoCuota(cuota);
 * console.log(periodo); // 'Febrero 2026'
 */
export function formatearPeriodoCuota(cuota: Cuota): string {
    const meses = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
    ];

    return `${meses[cuota.mes - 1]} ${cuota.anio}`;
}

/**
 * Obtiene el nombre completo del receptor en formato "Apellido, Nombre"
 *
 * @param cuota - Cuota con recibo.receptor
 * @returns Nombre completo formateado
 *
 * @example
 * const nombre = getNombreCompletoReceptor(cuota);
 * console.log(nombre); // 'Gómez, Daniel'
 */
export function getNombreCompletoReceptor(cuota: Cuota): string {
    const receptor = cuota.recibo.receptor;
    return `${receptor.apellido}, ${receptor.nombre}`;
}

/**
 * Convierte Decimal string a número
 * Maneja null, undefined, y strings del backend
 *
 * @param decimal - Valor decimal como string, number, null o undefined
 * @returns Número parseado o 0 si es null/undefined
 *
 * @example
 * const monto = decimalToNumber('5000.50'); // 5000.5
 * const montoNull = decimalToNumber(null); // 0
 * const montoNumber = decimalToNumber(5000); // 5000
 */
export function decimalToNumber(
    decimal: string | number | null | undefined
): number {
    if (decimal === null || decimal === undefined) return 0;
    if (typeof decimal === 'number') return decimal;
    const parsed = parseFloat(decimal);
    return isNaN(parsed) ? 0 : parsed;
}

// ============================================================================
// HELPERS DE COMPARACIÓN Y VALIDACIÓN
// ============================================================================

/**
 * Verifica si una cuota tiene recargos aplicados
 *
 * @param cuota - Cuota a verificar
 * @returns true si tiene al menos un recargo
 */
export function tieneRecargos(cuota: Cuota): boolean {
    return (
        cuota.items?.some(
            (item) => item.tipoItem.categoriaItem.codigo === 'RECARGO'
        ) || false
    );
}

/**
 * Verifica si una cuota tiene ajustes manuales
 *
 * @param cuota - Cuota a verificar
 * @returns true si tiene al menos un ajuste manual
 */
export function tieneAjustesManuales(cuota: Cuota): boolean {
    return (
        cuota.items?.some(
            (item) =>
                item.tipoItem.categoriaItem.codigo === 'AJUSTE' &&
                !item.esAutomatico
        ) || false
    );
}

/**
 * Obtiene el número de socio del receptor (si existe)
 *
 * @param cuota - Cuota con recibo.receptor
 * @returns Número de socio o null
 */
export function getNumeroSocio(cuota: Cuota): number | null {
    return cuota.recibo.receptor.numeroSocio;
}

/**
 * Obtiene todos los conceptos de ítems de una cuota
 *
 * @param cuota - Cuota con items[]
 * @returns Array de strings con los conceptos
 *
 * @example
 * const conceptos = getConceptosItems(cuota);
 * // ['Cuota base Estudiante', 'Actividad: Guitarra', 'Descuento Familiar']
 */
export function getConceptosItems(cuota: Cuota): string[] {
    return cuota.items?.map((item) => item.concepto) || [];
}
