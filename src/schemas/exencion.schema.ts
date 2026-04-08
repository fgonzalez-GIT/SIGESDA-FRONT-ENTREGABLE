/**
 * Schemas de Validación para Exenciones Temporales (Zod)
 * FASE 3: Schemas Zod y Validaciones
 * Creado: 2026-01-07
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS BASE
// ============================================================================

/**
 * Schema para crear una solicitud de exención
 */
export const createExencionSchema = z.object({
  personaId: z.number().int().positive('Persona requerida'),
  tipoExencion: z.enum(['TOTAL', 'PARCIAL'], {
    errorMap: () => ({ message: 'Tipo de exención inválido' })
  }),
  porcentajeExencion: z.number().min(1, 'Porcentaje mínimo: 1%').max(100, 'Porcentaje máximo: 100%').optional().nullable(),
  motivoExencion: z.enum([
    'BECA',
    'SOCIO_FUNDADOR',
    'SOCIO_HONORARIO',
    'SITUACION_ECONOMICA',
    'MERITO_ACADEMICO',
    'COLABORACION_INSTITUCIONAL',
    'EMERGENCIA_FAMILIAR',
    'OTRO'
  ], {
    errorMap: () => ({ message: 'Motivo de exención inválido' })
  }),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000, 'La descripción no puede exceder 1000 caracteres'),
  documentoRespaldo: z.string().max(500, 'Ruta del documento no puede exceder 500 caracteres').optional().nullable(),
  fechaInicio: z.string().datetime('Fecha de inicio inválida'),
  fechaFin: z.string().datetime('Fecha de fin inválida').optional().nullable(),
  estado: z.enum(['PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA', 'REVOCADA', 'VIGENTE', 'EXPIRADA']).default('PENDIENTE_APROBACION'),
  activa: z.boolean(),
})
.refine(data => {
  // Validar que si es PARCIAL, debe tener porcentaje
  if (data.tipoExencion === 'PARCIAL') {
    return data.porcentajeExencion !== null && data.porcentajeExencion !== undefined;
  }
  return true;
}, {
  message: 'Porcentaje requerido para exención parcial',
  path: ['porcentajeExencion'],
})
.refine(data => {
  // Validar que si es TOTAL, el porcentaje debe ser 100
  if (data.tipoExencion === 'TOTAL' && data.porcentajeExencion !== null && data.porcentajeExencion !== undefined) {
    return data.porcentajeExencion === 100;
  }
  return true;
}, {
  message: 'Exención total debe tener porcentaje de 100%',
  path: ['porcentajeExencion'],
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
  // Validar que el período no exceda 2 años
  if (data.fechaFin) {
    const diffYears = (new Date(data.fechaFin).getTime() - new Date(data.fechaInicio).getTime()) / (1000 * 60 * 60 * 24 * 365);
    return diffYears <= 2;
  }
  return true;
}, {
  message: 'El período de exención no puede exceder 2 años',
  path: ['fechaFin'],
});

/**
 * Schema para actualizar una exención (solo campos editables)
 */
export const updateExencionSchema = createExencionSchema.partial().omit({ personaId: true, estado: true });

// ============================================================================
// SCHEMAS DE WORKFLOW
// ============================================================================

/**
 * Schema para aprobar una exención
 */
export const aprobarExencionSchema = z.object({
  aprobadoPor: z.string().min(1, 'Nombre del aprobador requerido').max(200),
  observaciones: z.string().max(1000, 'Observaciones no puede exceder 1000 caracteres').optional().nullable(),
  fechaAprobacion: z.string().datetime().optional(),
});

/**
 * Schema para rechazar una exención
 */
export const rechazarExencionSchema = z.object({
  rechazadoPor: z.string().min(1, 'Nombre del rechazador requerido').max(200),
  motivoRechazo: z.string().min(10, 'El motivo de rechazo debe tener al menos 10 caracteres').max(1000),
  fechaRechazo: z.string().datetime().optional(),
});

/**
 * Schema para revocar una exención vigente
 */
export const revocarExencionSchema = z.object({
  revocadoPor: z.string().min(1, 'Nombre del revocador requerido').max(200),
  motivoRevocacion: z.string().min(10, 'El motivo de revocación debe tener al menos 10 caracteres').max(1000),
  fechaRevocacion: z.string().datetime().optional(),
});

/**
 * Schema para renovar una exención expirada
 */
export const renovarExencionSchema = z.object({
  nuevaFechaFin: z.string().datetime('Fecha de fin inválida'),
  justificacion: z.string().min(10, 'La justificación debe tener al menos 10 caracteres').max(1000),
  documentoRespaldo: z.string().max(500).optional().nullable(),
}).refine(data => {
  // Validar que la nueva fecha sea futura
  return new Date(data.nuevaFechaFin) > new Date();
}, {
  message: 'La nueva fecha de fin debe ser futura',
  path: ['nuevaFechaFin'],
});

// ============================================================================
// SCHEMAS DE FILTROS
// ============================================================================

/**
 * Schema para filtros de búsqueda de exenciones
 */
export const filtrosExencionesSchema = z.object({
  personaId: z.number().int().positive().optional(),
  tipoExencion: z.enum(['TOTAL', 'PARCIAL']).optional(),
  motivoExencion: z.enum([
    'BECA',
    'SOCIO_FUNDADOR',
    'SOCIO_HONORARIO',
    'SITUACION_ECONOMICA',
    'MERITO_ACADEMICO',
    'COLABORACION_INSTITUCIONAL',
    'EMERGENCIA_FAMILIAR',
    'OTRO'
  ]).optional(),
  estado: z.enum(['PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA', 'REVOCADA', 'VIGENTE', 'EXPIRADA']).optional(),
  activa: z.boolean().optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  porcentajeMin: z.number().min(0).max(100).optional(),
  porcentajeMax: z.number().min(0).max(100).optional(),
}).refine(data => {
  // Validar que fechaHasta sea posterior a fechaDesde
  if (data.fechaDesde && data.fechaHasta) {
    return new Date(data.fechaHasta) >= new Date(data.fechaDesde);
  }
  return true;
}, {
  message: 'Fecha hasta debe ser posterior o igual a fecha desde',
  path: ['fechaHasta'],
}).refine(data => {
  // Validar que porcentajeMax sea mayor o igual a porcentajeMin
  if (data.porcentajeMin !== undefined && data.porcentajeMax !== undefined) {
    return data.porcentajeMax >= data.porcentajeMin;
  }
  return true;
}, {
  message: 'Porcentaje máximo debe ser mayor o igual al mínimo',
  path: ['porcentajeMax'],
});

// ============================================================================
// SCHEMAS DE HISTORIAL
// ============================================================================

/**
 * Schema para registrar un cambio en el historial de exenciones
 */
export const registrarCambioExencionSchema = z.object({
  exencionId: z.number().int().positive(),
  accion: z.enum([
    'CREAR_EXENCION',
    'MODIFICAR_EXENCION',
    'APROBAR_EXENCION',
    'RECHAZAR_EXENCION',
    'REVOCAR_EXENCION',
    'RENOVAR_EXENCION',
    'EXPIRAR_EXENCION'
  ]),
  usuario: z.string().min(1, 'Usuario requerido'),
  motivoCambio: z.string().min(10, 'Motivo debe tener al menos 10 caracteres').max(1000),
  datosPrevios: z.record(z.any()).optional().nullable(),
  datosNuevos: z.record(z.any()).optional().nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateExencionFormData = z.infer<typeof createExencionSchema>;
export type UpdateExencionFormData = z.infer<typeof updateExencionSchema>;
export type AprobarExencionFormData = z.infer<typeof aprobarExencionSchema>;
export type RechazarExencionFormData = z.infer<typeof rechazarExencionSchema>;
export type RevocarExencionFormData = z.infer<typeof revocarExencionSchema>;
export type RenovarExencionFormData = z.infer<typeof renovarExencionSchema>;
export type FiltrosExencionesFormData = z.infer<typeof filtrosExencionesSchema>;
export type RegistrarCambioExencionFormData = z.infer<typeof registrarCambioExencionSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Helper para verificar si una exención está vigente
 */
export const esExencionVigente = (exencion: { estado: string; activa: boolean; fechaFin?: string | null }): boolean => {
  if (!exencion.activa) return false;
  if (exencion.estado !== 'VIGENTE' && exencion.estado !== 'APROBADA') return false;
  if (exencion.fechaFin && new Date(exencion.fechaFin) < new Date()) return false;
  return true;
};

/**
 * Helper para verificar si una exención está pendiente de aprobación
 */
export const esExencionPendiente = (estado: string): boolean => {
  return estado === 'PENDIENTE_APROBACION';
};

/**
 * Helper para verificar si una exención puede ser modificada
 */
export const puedeModificarExencion = (estado: string): boolean => {
  return estado === 'PENDIENTE_APROBACION' || estado === 'VIGENTE';
};

/**
 * Helper para verificar si una exención puede ser revocada
 */
export const puedeRevocarExencion = (estado: string): boolean => {
  return estado === 'VIGENTE' || estado === 'APROBADA';
};
