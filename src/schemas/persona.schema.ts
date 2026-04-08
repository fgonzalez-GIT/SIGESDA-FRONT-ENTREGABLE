import { z } from 'zod';

// Versión simplificada compatible con Zod v4
// Los mensajes de error personalizados se agregan en las validaciones, no en la construcción

const dniRegex = /^\d{7,8}$/;
const cuitRegex = /^(\d{2}-\d{8}-\d{1}|\d{11})$/; // Acepta XX-XXXXXXXX-X o 11 dígitos sin guiones
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const telefonoRegex = /^[\d\s\-\+\(\)]+$/;

export const createContactoSchema = z.object({
  tipoContactoId: z.number().int().positive('Tipo de contacto requerido'),
  valor: z.string().min(1, 'Valor requerido').max(200).trim(),
  descripcion: z.string().max(200).optional().nullable().transform(val => val === '' || val === null ? undefined : val),
  principal: z.boolean().default(false),
  observaciones: z.string().max(500).optional().nullable().transform(val => val === '' || val === null ? undefined : val),
});

export const updateContactoSchema = z.object({
  tipoContactoId: z.number().int().positive().optional(),
  valor: z.string().min(1).max(200).trim().optional(),
  descripcion: z.string().max(200).optional().nullable(),
  principal: z.boolean().optional(),
  activo: z.boolean().optional(),
  observaciones: z.string().max(500).optional().nullable(),
});

const personaTipoBaseSchema = z.object({
  tipoPersonaCodigo: z.string().min(1).trim(),
  tipoPersonaId: z.number().int().positive().optional(), // ID del tipo asignado (solo en modo edición)
  observaciones: z.string().max(500).optional().nullable().transform(val => val === '' || val === null ? undefined : val),
});

export const createTipoSocioSchema = personaTipoBaseSchema.extend({
  tipoPersonaCodigo: z.literal('SOCIO'),
  categoriaId: z.number().int().positive('Categoría requerida'),
});

export const createTipoDocenteSchema = personaTipoBaseSchema.extend({
  tipoPersonaCodigo: z.literal('DOCENTE'),
  // Permitir 0 temporalmente en el formulario, validación real al enviar
  especialidadId: z.number().int().nonnegative('Especialidad requerida para docente'),
  honorariosPorHora: z.number()
    .min(0, 'Honorarios no pueden ser negativos')
    .max(1000000, 'Honorarios demasiado altos')
    .multipleOf(0.01, 'Debe tener máximo 2 decimales'),
});

export const createTipoProveedorSchema = personaTipoBaseSchema.extend({
  tipoPersonaCodigo: z.literal('PROVEEDOR'),
  cuit: z.string()
    .min(11, 'CUIT debe tener 11 dígitos')
    .max(13, 'CUIT debe tener formato XX-XXXXXXXX-X')
    .regex(cuitRegex, 'CUIT debe tener formato XX-XXXXXXXX-X'),
  razonSocialId: z.number().int().positive('Razón social requerida'),
});

export const createTipoNoSocioSchema = personaTipoBaseSchema.extend({
  tipoPersonaCodigo: z.literal('NO_SOCIO'),
});

// Discriminated union para validación estricta de tipos de persona
// Solo acepta los 4 tipos definidos: SOCIO, DOCENTE, PROVEEDOR, NO_SOCIO
export const createPersonaTipoSchema = z.discriminatedUnion('tipoPersonaCodigo', [
  createTipoSocioSchema,
  createTipoDocenteSchema,
  createTipoProveedorSchema,
  createTipoNoSocioSchema,
]);

export const updatePersonaTipoSchema = z.object({
  categoriaId: z.number().int().positive().optional(),
  especialidadId: z.number().int().positive().optional(),
  honorariosPorHora: z.number().min(0).max(1000000).multipleOf(0.01).optional(),
  cuit: z.string().min(11).max(13).regex(cuitRegex).optional(),
  razonSocialId: z.number().int().positive().optional(),
  activo: z.boolean().optional(),
  observaciones: z.string().max(500).optional().nullable(),
});

export const createPersonaSchema = z.object({
  nombre: z.string().min(2).max(100).trim(),
  apellido: z.string().min(2).max(100).trim(),
  dni: z.string().regex(dniRegex).min(7).max(8),
  // Transformar strings vacíos a undefined para campos opcionales
  email: z.string()
    .trim()
    .max(200)
    .refine(val => !val || val === '' || emailRegex.test(val), {
      message: 'Email inválido, debe tener formato correcto (ej: usuario@dominio.com)'
    })
    .optional()
    .nullable()
    .transform(val => val === '' || val === null ? undefined : val),
  telefono: z.string()
    .trim()
    .max(50)
    .refine(val => !val || val === '' || telefonoRegex.test(val), {
      message: 'Formato de teléfono inválido'
    })
    .optional()
    .nullable()
    .transform(val => val === '' || val === null ? undefined : val),
  direccion: z.string().max(300).trim().optional().nullable().transform(val => val === '' || val === null ? undefined : val),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().transform(val => val === '' || val === null ? undefined : val),
  genero: z.enum(['MASCULINO', 'FEMENINO', 'OTRO', 'NO_ESPECIFICA']).optional().nullable(),
  observaciones: z.string().max(1000).optional().nullable().transform(val => val === '' || val === null ? undefined : val),
  tipos: z.array(createPersonaTipoSchema).optional().default([]),
  contactos: z.array(createContactoSchema).optional().default([]),
}).refine(data => data.tipos && data.tipos.length > 0, {
  message: 'Debe asignar al menos un tipo a la persona',
  path: ['tipos'],
}).refine(data => {
  // Validación de exclusión mutua: SOCIO y NO_SOCIO no pueden coexistir
  if (data.tipos && data.tipos.length > 0) {
    const codigos = data.tipos.map((t: any) => t.tipoPersonaCodigo?.toUpperCase());
    const hasSocio = codigos.includes('SOCIO');
    const hasNoSocio = codigos.includes('NO_SOCIO');
    return !(hasSocio && hasNoSocio);
  }
  return true;
}, {
  message: 'Una persona no puede ser SOCIO y NO_SOCIO simultáneamente',
  path: ['tipos'],
}).refine(data => {
  // Validación DOCENTE: especialidadId debe ser > 0 al enviar
  if (data.tipos && data.tipos.length > 0) {
    const docentes = data.tipos.filter((t: any) => t.tipoPersonaCodigo?.toUpperCase() === 'DOCENTE');
    return docentes.every((d: any) => d.especialidadId && d.especialidadId > 0);
  }
  return true;
}, {
  message: 'Debe seleccionar una especialidad para el tipo DOCENTE',
  path: ['tipos'],
}).refine(data => {
  if (data.contactos && data.contactos.length > 0) {
    const contactosPrincipales = data.contactos.filter(c => c.principal);
    return contactosPrincipales.length <= 1;
  }
  return true;
}, {
  message: 'Solo puede haber un contacto principal',
  path: ['contactos'],
});

export const updatePersonaSchema = z.object({
  nombre: z.string().min(2).max(100).trim().optional(),
  apellido: z.string().min(2).max(100).trim().optional(),
  dni: z.string().regex(dniRegex).min(7).max(8).optional(),
  email: z.string().regex(emailRegex).max(200).trim().optional().nullable(),
  telefono: z.string().regex(telefonoRegex).max(50).optional().nullable(),
  direccion: z.string().max(300).trim().optional().nullable(),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  genero: z.enum(['MASCULINO', 'FEMENINO', 'OTRO', 'NO_ESPECIFICA']).optional().nullable(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'SUSPENDIDO']).optional(),
  observaciones: z.string().max(1000).optional().nullable(),
});

export const createTipoPersonaSchema = z.object({
  codigo: z.string().min(2).max(50).regex(/^[A-Z_]+$/).transform(val => val.toUpperCase()),
  nombre: z.string().min(3).max(100).trim(),
  descripcion: z.string().max(300).optional().nullable(),
  requiresCategoria: z.boolean().default(false),
  requiresEspecialidad: z.boolean().default(false),
  requiresCuit: z.boolean().default(false),
  orden: z.number().int().positive().optional(),
});

export const updateTipoPersonaSchema = z.object({
  nombre: z.string().min(3).max(100).trim().optional(),
  descripcion: z.string().max(300).optional().nullable(),
  requiresCategoria: z.boolean().optional(),
  requiresEspecialidad: z.boolean().optional(),
  requiresCuit: z.boolean().optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().positive().optional(),
});

export const createEspecialidadDocenteSchema = z.object({
  codigo: z.string().min(2).max(50).regex(/^[A-Z_]+$/).transform(val => val.toUpperCase()),
  nombre: z.string().min(3).max(100).trim(),
  descripcion: z.string().max(300).optional().nullable(),
  orden: z.number().int().positive().optional(),
});

export const updateEspecialidadDocenteSchema = z.object({
  nombre: z.string().min(3).max(100).trim().optional(),
  descripcion: z.string().max(300).optional().nullable(),
  activo: z.boolean().optional(),
  orden: z.number().int().positive().optional(),
});

export const createTipoContactoSchema = z.object({
  codigo: z.string().min(2).max(50).regex(/^[A-Z_]+$/).transform(val => val.toUpperCase()),
  nombre: z.string().min(3).max(100).trim(),
  descripcion: z.string().max(500).optional().nullable(),
  icono: z.string().max(50).optional().nullable(),
  pattern: z.string().max(500).optional().nullable(),
  orden: z.number().int().nonnegative().optional(),
});

export const updateTipoContactoSchema = z.object({
  nombre: z.string().min(3).max(100).trim().optional(),
  descripcion: z.string().max(500).optional().nullable(),
  icono: z.string().max(50).optional().nullable(),
  pattern: z.string().max(500).optional().nullable(),
  activo: z.boolean().optional(),
  orden: z.number().int().nonnegative().optional(),
});

export const reorderCatalogoSchema = z.object({
  items: z.array(z.object({
    id: z.number().int().positive(),
    orden: z.number().int().positive(),
  })).min(1),
});

export type CreateContactoFormData = z.infer<typeof createContactoSchema>;
export type UpdateContactoFormData = z.infer<typeof updateContactoSchema>;
export type CreatePersonaTipoFormData = z.infer<typeof createPersonaTipoSchema>;
export type UpdatePersonaTipoFormData = z.infer<typeof updatePersonaTipoSchema>;
export type CreatePersonaFormData = z.infer<typeof createPersonaSchema>;
export type UpdatePersonaFormData = z.infer<typeof updatePersonaSchema>;
export type CreateTipoPersonaFormData = z.infer<typeof createTipoPersonaSchema>;
export type UpdateTipoPersonaFormData = z.infer<typeof updateTipoPersonaSchema>;
export type CreateEspecialidadDocenteFormData = z.infer<typeof createEspecialidadDocenteSchema>;
export type UpdateEspecialidadDocenteFormData = z.infer<typeof updateEspecialidadDocenteSchema>;
export type CreateTipoContactoFormData = z.infer<typeof createTipoContactoSchema>;
export type UpdateTipoContactoFormData = z.infer<typeof updateTipoContactoSchema>;
export type ReorderCatalogoFormData = z.infer<typeof reorderCatalogoSchema>;
