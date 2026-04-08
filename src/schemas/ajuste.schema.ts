/**
 * Schemas de Validación para Ajustes Manuales (Zod)
 * FASE 3: Schemas Zod y Validaciones
 * Creado: 2026-01-07
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS BASE
// ============================================================================

/**
 * Schema para crear un ajuste manual de cuota
 */
export const createAjusteSchema = z.object({
  personaId: z.number().int().positive('Persona requerida'),
  tipoAjuste: z.enum([
    'DESCUENTO_FIJO',
    'DESCUENTO_PORCENTAJE',
    'RECARGO_FIJO',
    'RECARGO_PORCENTAJE',
    'MONTO_FIJO_TOTAL'
  ], {
    errorMap: () => ({ message: 'Tipo de ajuste inválido' })
  }),
  valor: z.number().positive('Valor debe ser mayor a 0'),
  aplicaA: z.enum(['TOTAL_CUOTA', 'BASE', 'ACTIVIDADES', 'ITEMS_ESPECIFICOS'], {
    errorMap: () => ({ message: 'Campo de aplicación inválido' })
  }),
  itemsEspecificos: z.array(z.number().int().positive()).optional(),
  concepto: z.string().min(3, 'Concepto debe tener al menos 3 caracteres').max(200, 'Concepto no puede exceder 200 caracteres'),
  motivo: z.string().max(500, 'Motivo no puede exceder 500 caracteres').optional().nullable(),
  fechaInicio: z.string().datetime('Fecha de inicio inválida'),
  fechaFin: z.string().datetime('Fecha de fin inválida').optional().nullable(),
  activo: z.boolean(),
})
.refine(data => {
  // Validar que si aplicaA es ITEMS_ESPECIFICOS, itemsEspecificos no puede estar vacío
  if (data.aplicaA === 'ITEMS_ESPECIFICOS') {
    return data.itemsEspecificos && data.itemsEspecificos.length > 0;
  }
  return true;
}, {
  message: 'Debe especificar al menos un ítem cuando "Aplica a" es "Ítems específicos"',
  path: ['itemsEspecificos'],
})
.refine(data => {
  // Validar que fechaFin sea posterior a fechaInicio
  if (data.fechaFin) {
    return new Date(data.fechaFin) > new Date(data.fechaInicio);
  }
  return true;
}, {
  message: 'Fecha de fin debe ser posterior a fecha de inicio',
  path: ['fechaFin'],
})
.refine(data => {
  // Validar que porcentajes estén entre 0 y 100
  if (data.tipoAjuste === 'DESCUENTO_PORCENTAJE' || data.tipoAjuste === 'RECARGO_PORCENTAJE') {
    return data.valor > 0 && data.valor <= 100;
  }
  return true;
}, {
  message: 'El porcentaje debe estar entre 0 y 100',
  path: ['valor'],
});

/**
 * Schema para actualizar un ajuste existente
 * No permite cambiar la persona asociada
 */
export const updateAjusteSchema = createAjusteSchema.partial().omit({ personaId: true });

/**
 * Schema para desactivar/activar un ajuste
 */
export const toggleAjusteSchema = z.object({
  activo: z.boolean(),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(500),
});

/**
 * Schema para eliminar un ajuste
 */
export const deleteAjusteSchema = z.object({
  motivo: z.string().min(10, 'El motivo de eliminación debe tener al menos 10 caracteres').max(500),
  confirmarEliminacion: z.literal(true, {
    errorMap: () => ({ message: 'Debe confirmar la eliminación' })
  }),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN DE WORKFLOW
// ============================================================================

/**
 * Schema para aplicar un ajuste a una cuota específica
 */
export const aplicarAjusteACuotaSchema = z.object({
  ajusteId: z.number().int().positive(),
  cuotaId: z.number().int().positive(),
  observaciones: z.string().max(500).optional().nullable(),
});

/**
 * Schema para filtros de búsqueda de ajustes
 */
export const filtrosAjustesSchema = z.object({
  personaId: z.number().int().positive().optional(),
  tipoAjuste: z.enum([
    'DESCUENTO_FIJO',
    'DESCUENTO_PORCENTAJE',
    'RECARGO_FIJO',
    'RECARGO_PORCENTAJE',
    'MONTO_FIJO_TOTAL'
  ]).optional(),
  aplicaA: z.enum(['TOTAL_CUOTA', 'BASE', 'ACTIVIDADES', 'ITEMS_ESPECIFICOS']).optional(),
  activo: z.boolean().optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
}).refine(data => {
  // Validar que fechaHasta sea posterior a fechaDesde
  if (data.fechaDesde && data.fechaHasta) {
    return new Date(data.fechaHasta) >= new Date(data.fechaDesde);
  }
  return true;
}, {
  message: 'Fecha hasta debe ser posterior o igual a fecha desde',
  path: ['fechaHasta'],
});

// ============================================================================
// SCHEMAS DE HISTORIAL
// ============================================================================

/**
 * Schema para registrar un cambio en el historial de ajustes
 */
export const registrarCambioAjusteSchema = z.object({
  ajusteId: z.number().int().positive(),
  accion: z.enum(['CREAR_AJUSTE', 'MODIFICAR_AJUSTE', 'DESACTIVAR_AJUSTE', 'ACTIVAR_AJUSTE', 'ELIMINAR_AJUSTE']),
  usuario: z.string().min(1, 'Usuario requerido'),
  motivoCambio: z.string().min(10, 'Motivo debe tener al menos 10 caracteres').max(1000),
  datosPrevios: z.record(z.any()).optional().nullable(),
  datosNuevos: z.record(z.any()).optional().nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateAjusteFormData = z.infer<typeof createAjusteSchema>;
export type UpdateAjusteFormData = z.infer<typeof updateAjusteSchema>;
export type ToggleAjusteFormData = z.infer<typeof toggleAjusteSchema>;
export type DeleteAjusteFormData = z.infer<typeof deleteAjusteSchema>;
export type AplicarAjusteACuotaFormData = z.infer<typeof aplicarAjusteACuotaSchema>;
export type FiltrosAjustesFormData = z.infer<typeof filtrosAjustesSchema>;
export type RegistrarCambioAjusteFormData = z.infer<typeof registrarCambioAjusteSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Helper para validar si un ajuste es de tipo porcentaje
 */
export const esAjustePorcentaje = (tipoAjuste: string): boolean => {
  return tipoAjuste === 'DESCUENTO_PORCENTAJE' || tipoAjuste === 'RECARGO_PORCENTAJE';
};

/**
 * Helper para validar si un ajuste es de tipo descuento
 */
export const esAjusteDescuento = (tipoAjuste: string): boolean => {
  return tipoAjuste === 'DESCUENTO_FIJO' || tipoAjuste === 'DESCUENTO_PORCENTAJE';
};

/**
 * Helper para validar si un ajuste es de tipo recargo
 */
export const esAjusteRecargo = (tipoAjuste: string): boolean => {
  return tipoAjuste === 'RECARGO_FIJO' || tipoAjuste === 'RECARGO_PORCENTAJE';
};
