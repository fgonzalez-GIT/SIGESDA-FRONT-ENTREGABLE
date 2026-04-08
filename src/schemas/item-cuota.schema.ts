/**
 * Schemas de Validación para Ítems de Cuota (Zod)
 * FASE 3: Schemas Zod y Validaciones
 * Sistema de Cuotas V2 con Ítems
 * Creado: 2026-01-07
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS BASE
// ============================================================================

/**
 * Schema para crear un ítem de cuota
 */
export const createItemCuotaSchema = z.object({
  cuotaId: z.number().int().positive('Cuota requerida'),
  tipoItemId: z.number().int().positive('Tipo de ítem requerido'),
  concepto: z.string().min(3, 'Concepto debe tener al menos 3 caracteres').max(200, 'Concepto no puede exceder 200 caracteres'),
  monto: z.number({
    required_error: 'Monto requerido',
    invalid_type_error: 'Monto debe ser un número',
  }),
  cantidad: z.number().int().positive('Cantidad debe ser mayor a 0').default(1),
  porcentaje: z.number().min(0, 'Porcentaje no puede ser negativo').max(100, 'Porcentaje no puede exceder 100').optional().nullable(),
  esAutomatico: z.boolean().default(true),
  esEditable: z.boolean().default(false),
  observaciones: z.string().max(500, 'Observaciones no puede exceder 500 caracteres').optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
})
.refine(data => {
  // Validar que descuentos sean negativos
  if (data.concepto.toLowerCase().includes('descuento') && data.monto > 0) {
    return false;
  }
  return true;
}, {
  message: 'Los descuentos deben tener monto negativo',
  path: ['monto'],
})
.refine(data => {
  // Validar que recargos sean positivos
  if (data.concepto.toLowerCase().includes('recargo') && data.monto < 0) {
    return false;
  }
  return true;
}, {
  message: 'Los recargos deben tener monto positivo',
  path: ['monto'],
});

/**
 * Schema para actualizar un ítem de cuota
 */
export const updateItemCuotaSchema = createItemCuotaSchema.partial().omit({ cuotaId: true });

/**
 * Schema para crear múltiples ítems en una cuota
 */
export const createMultipleItemsSchema = z.object({
  cuotaId: z.number().int().positive('Cuota requerida'),
  items: z.array(createItemCuotaSchema.omit({ cuotaId: true })).min(1, 'Debe especificar al menos un ítem'),
});

/**
 * Schema para eliminar un ítem de cuota
 */
export const deleteItemCuotaSchema = z.object({
  itemId: z.number().int().positive(),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(500),
  confirmarEliminacion: z.literal(true, {
    errorMap: () => ({ message: 'Debe confirmar la eliminación' })
  }),
}).refine(data => {
  // Solo se pueden eliminar ítems editables
  return data.confirmarEliminacion === true;
}, {
  message: 'Solo se pueden eliminar ítems editables',
  path: ['confirmarEliminacion'],
});

// ============================================================================
// SCHEMAS DE CATEGORÍAS Y TIPOS
// ============================================================================

/**
 * Schema para categorías de ítems
 */
export const categoriaItemSchema = z.object({
  codigo: z.string().min(1).max(50),
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional().nullable(),
  icono: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  activo: z.boolean().default(true),
  orden: z.number().int().positive().optional(),
});

/**
 * Schema para tipos de ítems
 */
export const tipoItemCuotaSchema = z.object({
  codigo: z.string().min(1).max(100),
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(1000).optional().nullable(),
  categoriaItemId: z.number().int().positive(),
  esCalculado: z.boolean().default(true),
  formula: z.record(z.string(), z.any()).optional().nullable(),
  activo: z.boolean().default(true),
  orden: z.number().int().positive().optional(),
  configurable: z.boolean().default(true),
});

// ============================================================================
// SCHEMAS DE ADMINISTRACIÓN (CRUD + VALIDACIONES AVANZADAS)
// ============================================================================

/**
 * Regex para validar códigos de catálogos (solo mayúsculas, números y guiones bajos)
 */
const CODIGO_REGEX = /^[A-Z0-9_]+$/;

/**
 * Schema para crear categoría de ítem (con validación de código)
 */
export const createCategoriaItemSchema = categoriaItemSchema
  .extend({
    codigo: z.string()
      .min(2, 'Código debe tener al menos 2 caracteres')
      .max(50, 'Código no puede exceder 50 caracteres')
      .regex(CODIGO_REGEX, 'Código solo puede contener mayúsculas, números y guiones bajos'),
    nombre: z.string()
      .min(3, 'Nombre debe tener al menos 3 caracteres')
      .max(100, 'Nombre no puede exceder 100 caracteres'),
    icono: z.string()
      .max(50)
      .optional()
      .nullable()
      .refine(val => !val || val.length <= 10, {
        message: 'Icono debe ser un emoji o texto corto (máx 10 caracteres)'
      }),
    color: z.string()
      .max(50)
      .optional()
      .nullable()
      .refine(val => !val || /^#[0-9A-Fa-f]{6}$/.test(val) || /^[a-z]+$/.test(val), {
        message: 'Color debe ser un código hex (#FFFFFF) o nombre de color CSS'
      }),
  });

/**
 * Schema para actualizar categoría de ítem (partial)
 */
export const updateCategoriaItemSchema = createCategoriaItemSchema.partial();

/**
 * Schema para crear tipo de ítem (con validación de código y fórmula)
 */
export const createTipoItemSchema = tipoItemCuotaSchema
  .extend({
    codigo: z.string()
      .min(2, 'Código debe tener al menos 2 caracteres')
      .max(100, 'Código no puede exceder 100 caracteres')
      .regex(CODIGO_REGEX, 'Código solo puede contener mayúsculas, números y guiones bajos'),
    nombre: z.string()
      .min(3, 'Nombre debe tener al menos 3 caracteres')
      .max(200, 'Nombre no puede exceder 200 caracteres'),
    // formula se usa como metadata (ej: { descuenta: true/false }) — sin restricciones de esCalculado
    formula: z.record(z.string(), z.any()).optional().nullable(),
    // Campo UI: determina si el ítem suma o descuenta del total de la cuota (se mapea a formula.descuenta)
    esDescuento: z.boolean().default(false),
  });

/**
 * Schema para actualizar tipo de ítem (partial)
 */
export const updateTipoItemSchema = createTipoItemSchema.partial();

/**
 * Schema para clonar tipo de ítem
 */
export const clonarTipoItemSchema = z.object({
  codigo: z.string()
    .min(2, 'Código debe tener al menos 2 caracteres')
    .max(100, 'Código no puede exceder 100 caracteres')
    .regex(CODIGO_REGEX, 'Código solo puede contener mayúsculas, números y guiones bajos'),
  nombre: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(200, 'Nombre no puede exceder 200 caracteres'),
});

/**
 * Schema para reordenar catálogos
 */
export const reordenarCatalogosSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'Debe especificar al menos un ID'),
});

/**
 * Schema para validar relaciones antes de eliminar
 */
export const validarRelacionesSchema = z.object({
  tieneRelaciones: z.boolean(),
  totalRelaciones: z.number().int().nonnegative(),
  mensajeAdvertencia: z.string().optional(),
  puedeEliminar: z.boolean(),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Schema para validar integridad de cuota (suma de ítems = monto total)
 */
export const validarIntegridadCuotaSchema = z.object({
  cuotaId: z.number().int().positive(),
  items: z.array(z.object({
    monto: z.number(),
  })),
  montoTotal: z.number(),
}).refine(data => {
  const sumaItems = data.items.reduce((sum, item) => sum + item.monto, 0);
  const diff = Math.abs(sumaItems - data.montoTotal);
  return diff < 0.01; // Tolerancia de 1 centavo por redondeo
}, {
  message: 'La suma de los ítems no coincide con el monto total de la cuota',
  path: ['items'],
});

/**
 * Schema para recalcular ítems de una cuota
 */
export const recalcularItemsCuotaSchema = z.object({
  cuotaId: z.number().int().positive(),
  mantenerItemsManuales: z.boolean().default(true),
  aplicarDescuentos: z.boolean().default(true),
  aplicarAjustes: z.boolean().default(true),
  observaciones: z.string().max(500).optional().nullable(),
});

/**
 * Schema para filtros de búsqueda de ítems
 */
export const filtrosItemsCuotaSchema = z.object({
  cuotaId: z.number().int().positive().optional(),
  tipoItemId: z.number().int().positive().optional(),
  categoriaItemId: z.number().int().positive().optional(),
  esAutomatico: z.boolean().optional(),
  esEditable: z.boolean().optional(),
  montoMin: z.number().optional(),
  montoMax: z.number().optional(),
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

// Tipos para ítems
export type CreateItemCuotaFormData = z.infer<typeof createItemCuotaSchema>;
export type UpdateItemCuotaFormData = z.infer<typeof updateItemCuotaSchema>;
export type CreateMultipleItemsFormData = z.infer<typeof createMultipleItemsSchema>;
export type DeleteItemCuotaFormData = z.infer<typeof deleteItemCuotaSchema>;

// Tipos base para catálogos
export type CategoriaItemFormData = z.infer<typeof categoriaItemSchema>;
export type TipoItemCuotaFormData = z.infer<typeof tipoItemCuotaSchema>;

// Tipos para administración de catálogos
export type CreateCategoriaItemFormData = z.infer<typeof createCategoriaItemSchema>;
export type UpdateCategoriaItemFormData = z.infer<typeof updateCategoriaItemSchema>;
export type CreateTipoItemFormData = z.infer<typeof createTipoItemSchema>;
export type UpdateTipoItemFormData = z.infer<typeof updateTipoItemSchema>;
export type ClonarTipoItemFormData = z.infer<typeof clonarTipoItemSchema>;
export type ReordenarCatalogosFormData = z.infer<typeof reordenarCatalogosSchema>;
export type ValidarRelacionesFormData = z.infer<typeof validarRelacionesSchema>;

// Tipos para validación
export type ValidarIntegridadCuotaFormData = z.infer<typeof validarIntegridadCuotaSchema>;
export type RecalcularItemsCuotaFormData = z.infer<typeof recalcularItemsCuotaSchema>;
export type FiltrosItemsCuotaFormData = z.infer<typeof filtrosItemsCuotaSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Helper para calcular el monto total de una cuota desde sus ítems
 */
export const calcularMontoTotalDesdeItems = (items: { monto: number }[]): number => {
  return items.reduce((sum, item) => sum + item.monto, 0);
};

/**
 * Helper para validar si un ítem es de tipo descuento
 */
export const esItemDescuento = (concepto: string, monto: number): boolean => {
  return monto < 0 || concepto.toLowerCase().includes('descuento');
};

/**
 * Helper para validar si un ítem es de tipo recargo
 */
export const esItemRecargo = (concepto: string, monto: number): boolean => {
  return (monto > 0 && concepto.toLowerCase().includes('recargo')) ||
         concepto.toLowerCase().includes('mora');
};

/**
 * Helper para validar si un ítem es de tipo base
 */
export const esItemBase = (concepto: string): boolean => {
  return concepto.toLowerCase().includes('cuota base') ||
         concepto.toLowerCase().includes('base socio');
};

/**
 * Helper para validar si un ítem es de tipo actividad
 */
export const esItemActividad = (concepto: string): boolean => {
  return concepto.toLowerCase().includes('actividad') ||
         concepto.toLowerCase().includes('clase');
};

/**
 * Helper para formatear monto de ítem con símbolo apropiado
 */
export const formatearMontoItem = (monto: number): string => {
  const simbolo = monto >= 0 ? '+' : '';
  return `${simbolo}$${monto.toFixed(2)}`;
};
