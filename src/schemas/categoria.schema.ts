import { z } from 'zod';

// ============================================
// SCHEMA PARA CREAR CATEGORÍA
// ============================================

export const createCategoriaSchema = z.object({
  codigo: z.string()
    .min(2, 'Código debe tener al menos 2 caracteres')
    .max(20, 'Código no puede exceder 20 caracteres')
    .regex(/^[A-Z_]+$/, 'Código debe contener solo letras mayúsculas y guiones bajos')
    .transform(val => val.toUpperCase()),

  nombre: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres')
    .trim(),

  descripcion: z.string()
    .max(200, 'Descripción no puede exceder 200 caracteres')
    .optional()
    .nullable(),

  montoCuota: z.number({
    required_error: 'Monto de cuota es requerido',
    invalid_type_error: 'Monto de cuota debe ser un número',
  })
    .min(0, 'Monto de cuota debe ser mayor o igual a 0')
    .max(1000000, 'Monto de cuota no puede exceder 1,000,000')
    .multipleOf(0.01, 'Monto de cuota debe tener máximo 2 decimales'),

  descuento: z.number()
    .min(0, 'Descuento debe ser mayor o igual a 0')
    .max(100, 'Descuento no puede exceder 100%')
    .multipleOf(0.01, 'Descuento debe tener máximo 2 decimales')
    .default(0),

  orden: z.number()
    .int('Orden debe ser un número entero')
    .positive('Orden debe ser un número positivo')
    .optional(),
});

// ============================================
// SCHEMA PARA ACTUALIZAR CATEGORÍA
// ============================================

export const updateCategoriaSchema = z.object({
  codigo: z.string()
    .min(2, 'Código debe tener al menos 2 caracteres')
    .max(20, 'Código no puede exceder 20 caracteres')
    .regex(/^[A-Z_]+$/, 'Código debe contener solo letras mayúsculas y guiones bajos')
    .transform(val => val.toUpperCase())
    .optional(),

  nombre: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres')
    .trim()
    .optional(),

  descripcion: z.string()
    .max(200, 'Descripción no puede exceder 200 caracteres')
    .optional()
    .nullable(),

  montoCuota: z.number()
    .min(0, 'Monto de cuota debe ser mayor o igual a 0')
    .max(1000000, 'Monto de cuota no puede exceder 1,000,000')
    .multipleOf(0.01, 'Monto de cuota debe tener máximo 2 decimales')
    .optional(),

  descuento: z.number()
    .min(0, 'Descuento debe ser mayor o igual a 0')
    .max(100, 'Descuento no puede exceder 100%')
    .multipleOf(0.01, 'Descuento debe tener máximo 2 decimales')
    .optional(),

  activa: z.boolean().optional(),

  orden: z.number()
    .int('Orden debe ser un número entero')
    .positive('Orden debe ser un número positivo')
    .optional(),
});

// ============================================
// SCHEMA PARA FORMULARIO DE CATEGORÍA
// (Usado en React Hook Form con valores por defecto)
// ============================================

export const categoriaFormSchema = z.object({
  codigo: z.string()
    .min(2, 'Código debe tener al menos 2 caracteres')
    .max(20, 'Código no puede exceder 20 caracteres')
    .regex(/^[A-Z_]+$/, 'Código debe contener solo letras mayúsculas y guiones bajos')
    .transform(val => val.toUpperCase()),

  nombre: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres')
    .trim(),

  descripcion: z.string()
    .max(200, 'Descripción no puede exceder 200 caracteres')
    .default(''),

  montoCuota: z.number({
    required_error: 'Monto de cuota es requerido',
    invalid_type_error: 'Monto de cuota debe ser un número',
  })
    .min(0, 'Monto de cuota debe ser mayor o igual a 0')
    .max(1000000, 'Monto de cuota no puede exceder 1,000,000')
    .multipleOf(0.01, 'Monto de cuota debe tener máximo 2 decimales'),

  descuento: z.number()
    .min(0, 'Descuento debe ser mayor o igual a 0')
    .max(100, 'Descuento no puede exceder 100%')
    .multipleOf(0.01, 'Descuento debe tener máximo 2 decimales')
    .default(0),

  orden: z.number()
    .int('Orden debe ser un número entero')
    .positive('Orden debe ser un número positivo')
    .optional(),
}).refine(data => {
  // Validación personalizada: si hay descuento, debe ser menor que el monto
  if (data.descuento > 0) {
    const descuentoCalculado = (data.montoCuota * data.descuento) / 100;
    return descuentoCalculado < data.montoCuota;
  }
  return true;
}, {
  message: 'El descuento no puede resultar en un monto negativo',
  path: ['descuento']
});

// ============================================
// SCHEMA PARA REORDENAR CATEGORÍAS
// ============================================

export const reorderCategoriasSchema = z.object({
  categoriaIds: z.array(z.string().min(1, 'ID de categoría inválido'))
    .min(1, 'Debe proporcionar al menos una categoría')
});

// ============================================
// EXPORTAR TIPOS INFERIDOS
// ============================================

export type CreateCategoriaFormData = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaFormData = z.infer<typeof updateCategoriaSchema>;
export type CategoriaFormData = z.infer<typeof categoriaFormSchema>;
export type ReorderCategoriasFormData = z.infer<typeof reorderCategoriasSchema>;
