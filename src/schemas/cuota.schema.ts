/**
 * Schemas de Validación para Cuotas (Zod)
 * FASE 3: Schemas Zod y Validaciones
 * Creado: 2026-01-07
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS BASE
// ============================================================================

/**
 * Schema para crear una cuota individual
 * Basado en CrearCuotaRequest de cuota.types.ts
 */
export const createCuotaSchema = z.object({
  reciboId: z.number().int().positive('Recibo requerido'),
  categoriaId: z.number().int().positive('Categoría requerida'),
  mes: z.number().int().min(1, 'Mes debe estar entre 1 y 12').max(12, 'Mes debe estar entre 1 y 12'),
  anio: z.number().int().min(2020, 'Año mínimo: 2020').max(2100, 'Año máximo: 2100'),
  montoBase: z.number().min(0, 'Monto base debe ser mayor o igual a 0').optional().nullable(), // V2: deprecated
  montoActividades: z.number().min(0, 'Monto actividades debe ser mayor o igual a 0').optional().nullable(), // V2: deprecated
  montoTotal: z.number().min(0.01, 'Monto total debe ser mayor a 0'),
});

/**
 * Schema para actualizar una cuota
 * Todos los campos son opcionales
 */
export const updateCuotaSchema = createCuotaSchema.partial();

/**
 * Schema para generación masiva de cuotas
 */
export const generarCuotasSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
  categoriaIds: z.array(z.number().int().positive()).optional(),
  aplicarDescuentos: z.boolean().default(true),
  incluirInactivos: z.boolean().default(false),
  soloNuevas: z.boolean().default(true),
  observaciones: z.string().max(500).optional().nullable(),
});

// ============================================================================
// SCHEMAS CON VALIDACIONES PERSONALIZADAS
// ============================================================================

/**
 * Schema de validación de período (mes/año)
 * Valida que no se generen cuotas con más de 12 meses de anticipación
 */
export const cuotaPeriodoSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
}).refine(data => {
  const periodoDate = new Date(data.anio, data.mes - 1, 1);
  const now = new Date();
  const maxFutureMonths = 12;

  const monthsDiff = (periodoDate.getFullYear() - now.getFullYear()) * 12
                     + (periodoDate.getMonth() - now.getMonth());

  return monthsDiff <= maxFutureMonths;
}, {
  message: 'No se pueden generar cuotas con más de 12 meses de anticipación',
  path: ['mes'],
});

/**
 * Schema para recalcular una cuota existente
 * Sincronizado con backend: RecalcularCuotaDto
 */
export const recalcularCuotaSchema = z.object({
  aplicarAjustes: z.boolean().default(true),
  aplicarExenciones: z.boolean().default(true),
  aplicarDescuentos: z.boolean().default(true),
});

/**
 * Schema para validación de cuotas con items V2
 */
export const generarCuotasV2Schema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
  categoriaIds: z.array(z.number().int().positive()).optional(),
  aplicarDescuentos: z.boolean(),
  aplicarMotorReglas: z.boolean(),
  incluirInactivos: z.boolean(),
  soloNuevas: z.boolean(),
  observaciones: z.string().max(500).optional().nullable(),
}).refine(data => {
  const periodoDate = new Date(data.anio, data.mes - 1, 1);
  const now = new Date();
  const maxFutureMonths = 12;

  const monthsDiff = (periodoDate.getFullYear() - now.getFullYear()) * 12
                     + (periodoDate.getMonth() - now.getMonth());

  return monthsDiff <= maxFutureMonths;
}, {
  message: 'No se pueden generar cuotas con más de 12 meses de anticipación',
  path: ['mes'],
}).refine(data => {
  const periodoDate = new Date(data.anio, data.mes - 1, 1);
  const now = new Date();
  const maxPastMonths = 6;

  const monthsDiff = (now.getFullYear() - periodoDate.getFullYear()) * 12
                     + (now.getMonth() - periodoDate.getMonth());

  return monthsDiff <= maxPastMonths;
}, {
  message: 'No se pueden generar cuotas de más de 6 meses en el pasado',
  path: ['anio'],
});

/**
 * Schema para filtros de búsqueda de cuotas
 */
export const filtrosCuotasSchema = z.object({
  mes: z.number().int().min(1).max(12).optional(),
  anio: z.number().int().min(2020).max(2100).optional(),
  categoriaId: z.number().int().positive().optional(),
  estado: z.enum(['PAGADA', 'PENDIENTE', 'VENCIDA', 'CANCELADA']).optional(),
  receptorId: z.number().int().positive().optional(),
  montoMin: z.number().min(0).optional(),
  montoMax: z.number().min(0).optional(),
  conDescuento: z.boolean().optional(),
  conRecargo: z.boolean().optional(),
}).refine(data => {
  if (data.montoMin !== undefined && data.montoMax !== undefined) {
    return data.montoMin <= data.montoMax;
  }
  return true;
}, {
  message: 'Monto mínimo no puede ser mayor que monto máximo',
  path: ['montoMax'],
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateCuotaFormData = z.infer<typeof createCuotaSchema>;
export type UpdateCuotaFormData = z.infer<typeof updateCuotaSchema>;
export type GenerarCuotasFormData = z.infer<typeof generarCuotasSchema>;
export type GenerarCuotasV2FormData = z.infer<typeof generarCuotasV2Schema>;
export type RecalcularCuotaFormData = z.infer<typeof recalcularCuotaSchema>;
export type FiltrosCuotasFormData = z.infer<typeof filtrosCuotasSchema>;
export type CuotaPeriodoFormData = z.infer<typeof cuotaPeriodoSchema>;
