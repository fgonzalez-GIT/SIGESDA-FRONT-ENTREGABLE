import { z } from 'zod';

// ============================================
// SCHEMA PARA CREAR GRUPO FAMILIAR
// ============================================

export const createGrupoFamiliarSchema = z.object({
  nombre: z
    .string({
      required_error: 'Nombre del grupo es requerido',
      invalid_type_error: 'Nombre debe ser texto',
    })
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .trim(),

  descripcion: z
    .string()
    .max(500, 'Descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  personaReferenteId: z
    .number({
      required_error: 'Persona referente es requerida',
      invalid_type_error: 'Persona referente debe ser un número',
    })
    .int('Persona referente debe ser un número entero')
    .positive('Persona referente inválida'),

  descuentoGrupal: z
    .number({
      invalid_type_error: 'Descuento grupal debe ser un número',
    })
    .min(0, 'Descuento grupal debe ser mayor o igual a 0')
    .max(100, 'Descuento grupal no puede exceder 100%')
    .multipleOf(0.01, 'Descuento grupal debe tener máximo 2 decimales')
    .default(0),

  activo: z.boolean().default(true),

  // Configuración
  facturacionConjunta: z
    .boolean()
    .default(false)
    .describe('Si se factura todo al referente del grupo'),

  descuentoProgresivo: z
    .boolean()
    .default(false)
    .describe('Si el descuento aumenta por cantidad de miembros'),

  limiteCuotas: z
    .number({
      invalid_type_error: 'Límite de cuotas debe ser un número',
    })
    .int('Límite de cuotas debe ser un número entero')
    .min(0, 'Límite de cuotas debe ser mayor o igual a 0')
    .max(999, 'Límite de cuotas no puede exceder 999')
    .default(0)
    .describe('Límite de cuotas con descuento (0 = sin límite)'),

  // NUEVO (v2026-02-26): Array opcional de IDs de miembros iniciales
  miembros: z
    .array(z.number().int().positive('ID de miembro inválido'))
    .max(50, 'Un grupo no puede tener más de 50 miembros')
    .optional()
    .default([])
    .describe('Array de IDs de personas a incluir como miembros (excluyendo al referente, que se agrega automáticamente)'),

  // NUEVO (v2026-02-26): Flag para omitir validación de relaciones familiares
  skipFamilyValidation: z
    .boolean()
    .optional()
    .default(false)
    .describe('Si es true, permite agregar miembros sin relación familiar declarada (genera warnings)'),
});

// ============================================
// SCHEMA PARA ACTUALIZAR GRUPO FAMILIAR
// ============================================

export const updateGrupoFamiliarSchema = z.object({
  nombre: z
    .string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .trim()
    .optional(),

  descripcion: z
    .string()
    .max(500, 'Descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  personaReferenteId: z
    .number()
    .int('Persona referente debe ser un número entero')
    .positive('Persona referente inválida')
    .optional(),

  descuentoGrupal: z
    .number()
    .min(0, 'Descuento grupal debe ser mayor o igual a 0')
    .max(100, 'Descuento grupal no puede exceder 100%')
    .multipleOf(0.01, 'Descuento grupal debe tener máximo 2 decimales')
    .optional(),

  activo: z.boolean().optional(),

  // Configuración
  facturacionConjunta: z.boolean().optional(),

  descuentoProgresivo: z.boolean().optional(),

  limiteCuotas: z
    .number()
    .int('Límite de cuotas debe ser un número entero')
    .min(0, 'Límite de cuotas debe ser mayor o igual a 0')
    .max(999, 'Límite de cuotas no puede exceder 999')
    .optional(),

  // NUEVO (v2026-02-26): Flag para omitir validación de relaciones familiares
  skipFamilyValidation: z
    .boolean()
    .optional()
    .default(false)
    .describe('Si es true, permite actualizar sin validar relaciones familiares'),
});

// ============================================
// SCHEMA PARA FORMULARIO DE GRUPO FAMILIAR
// (Usado en React Hook Form con valores por defecto)
// ============================================

export const grupoFamiliarFormSchema = z
  .object({
    nombre: z
      .string({
        required_error: 'Nombre del grupo es requerido',
      })
      .min(3, 'Nombre debe tener al menos 3 caracteres')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .trim(),

    descripcion: z
      .string()
      .max(500, 'Descripción no puede exceder 500 caracteres')
      .default('')
      .transform((val) => (val.trim() === '' ? null : val.trim())),

    personaReferenteId: z
      .number({
        required_error: 'Persona referente es requerida',
        invalid_type_error: 'Debe seleccionar una persona referente',
      })
      .int('Persona referente inválida')
      .positive('Debe seleccionar una persona referente válida'),

    descuentoGrupal: z
      .number({
        invalid_type_error: 'Descuento grupal debe ser un número',
      })
      .min(0, 'Descuento grupal debe ser mayor o igual a 0')
      .max(100, 'Descuento grupal no puede exceder 100%')
      .default(0),

    activo: z.boolean().default(true),

    facturacionConjunta: z.boolean().default(false),

    descuentoProgresivo: z.boolean().default(false),

    limiteCuotas: z
      .number({
        invalid_type_error: 'Límite de cuotas debe ser un número',
      })
      .int('Límite de cuotas debe ser un número entero')
      .min(0, 'Límite de cuotas debe ser mayor o igual a 0')
      .max(999, 'Límite de cuotas no puede exceder 999')
      .default(0),

    // NUEVO (v2026-02-26): Array de miembros sugeridos/seleccionados
    miembros: z
      .array(z.number().int().positive())
      .max(50, 'Un grupo no puede tener más de 50 miembros')
      .default([])
      .optional(),

    // NUEVO (v2026-02-26): Flag para omitir validación familiar
    skipFamilyValidation: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Validación: si descuento progresivo está activo, debe haber un descuento base
      if (data.descuentoProgresivo && data.descuentoGrupal === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Para activar descuento progresivo, debe configurar un descuento grupal base mayor a 0',
      path: ['descuentoProgresivo'],
    }
  )
  .refine(
    (data) => {
      // Validación: si hay límite de cuotas, debe haber descuento grupal
      if (data.limiteCuotas > 0 && data.descuentoGrupal === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Para establecer límite de cuotas, debe configurar un descuento grupal mayor a 0',
      path: ['limiteCuotas'],
    }
  );

// ============================================
// SCHEMA PARA AGREGAR MIEMBRO
// ============================================

export const agregarMiembroSchema = z.object({
  grupoId: z
    .number({
      required_error: 'ID de grupo es requerido',
    })
    .int()
    .positive('ID de grupo inválido'),

  personaId: z
    .number({
      required_error: 'ID de persona es requerido',
      invalid_type_error: 'Debe seleccionar una persona válida',
    })
    .int()
    .positive('ID de persona inválido'),

  // NUEVO (v2026-02-26): Flag para omitir validación de relaciones familiares
  skipFamilyValidation: z
    .boolean()
    .optional()
    .default(false)
    .describe('Si es true, permite agregar miembro sin relación familiar (genera warnings)'),
});

// ============================================
// SCHEMA PARA ACTUALIZAR LISTA DE MIEMBROS
// ============================================

export const actualizarMiembrosSchema = z.object({
  grupoId: z
    .number({
      required_error: 'ID de grupo es requerido',
    })
    .int()
    .positive('ID de grupo inválido'),

  miembrosIds: z
    .array(
      z.number().int().positive('ID de miembro inválido'),
      {
        required_error: 'Lista de miembros es requerida',
        invalid_type_error: 'Lista de miembros debe ser un array',
      }
    )
    .min(1, 'Debe haber al menos un miembro en el grupo')
    .max(50, 'Un grupo no puede tener más de 50 miembros'),

  // NUEVO (v2026-02-26): Flag para omitir validación de relaciones familiares
  skipFamilyValidation: z
    .boolean()
    .optional()
    .default(false)
    .describe('Si es true, permite actualizar sin validar relaciones familiares'),
});

// ============================================
// SCHEMA PARA FILTROS DE GRUPOS
// ============================================

export const filtrosGruposSchema = z.object({
  page: z.number().int().positive().optional(),

  limit: z.number().int().positive().max(100).optional(),

  activo: z.boolean().optional(),

  conDescuento: z.boolean().optional(),

  referenteId: z.number().int().positive().optional(),

  busqueda: z.string().trim().optional(),
});

// ============================================
// EXPORTAR TIPOS INFERIDOS
// ============================================

export type CreateGrupoFamiliarFormData = z.infer<typeof createGrupoFamiliarSchema>;
export type UpdateGrupoFamiliarFormData = z.infer<typeof updateGrupoFamiliarSchema>;
export type GrupoFamiliarFormData = z.infer<typeof grupoFamiliarFormSchema>;
export type AgregarMiembroFormData = z.infer<typeof agregarMiembroSchema>;
export type ActualizarMiembrosFormData = z.infer<typeof actualizarMiembrosSchema>;
export type FiltrosGruposFormData = z.infer<typeof filtrosGruposSchema>;
