/**
 * Tipos TypeScript para el Módulo Personas V2
 * Basado en: GUIA_PARA_FRONTEND.md del backend
 *
 * Sistema de múltiples tipos por persona con gestión dinámica de catálogos
 */

// ============================================================================
// ENUMS Y CONSTANTES
// ============================================================================

/**
 * Género de una persona
 * Utilizado para calcular correctamente relaciones familiares inversas
 */
export type GeneroPersona = 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'NO_ESPECIFICA';

// ============================================================================
// CATÁLOGOS BASE
// ============================================================================

/**
 * Tipo de Persona (catálogo dinámico)
 * Ejemplos: SOCIO, NO_SOCIO, DOCENTE, PROVEEDOR, etc.
 */
export interface TipoPersona {
  id: number;
  codigo: string;              // 'SOCIO', 'DOCENTE', 'PROVEEDOR', 'NO_SOCIO'
  nombre: string;              // 'Socio', 'Docente', etc.
  descripcion?: string;
  activo: boolean;
  orden: number;
  requiresCategoria?: boolean; // Si requiere categoría de socio
  requiresEspecialidad?: boolean; // Si requiere especialidad docente
  requiresCuit?: boolean;      // Si requiere CUIT (proveedor)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Especialidad Docente (catálogo dinámico)
 */
export interface EspecialidadDocente {
  id: number;
  codigo: string;
  nombre: string;              // 'Danza', 'Música', 'Teatro', etc.
  descripcion?: string;
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Categoría de Socio (ya existente en el sistema)
 */
export interface CategoriaSocio {
  id: number;                  // Int autoincrement
  codigo: string;
  nombre: string;
  descripcion?: string;
  montoCuota: string;          // Decimal como string
  descuento: string;           // Decimal como string
  activa: boolean;
  orden: number;
}

/**
 * Razón Social (catálogo dinámico para proveedores)
 */
export interface RazonSocial {
  id: number;
  codigo: string;              // 'SA', 'SRL', 'MONOTRIBUTO', etc.
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Tipo de Contacto (catálogo dinámico)
 * Basado en: FRONTEND_API_TIPOS_CONTACTO.md
 */
export interface TipoContacto {
  id: number;
  codigo: string;              // 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'EMAIL', etc.
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;       // Emoji o nombre del icono de MUI
  pattern?: string | null;     // Regex para validación de formato (ej: email, teléfono)
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Catálogos completos (para carga optimizada)
 */
export interface CatalogosPersonas {
  tiposPersona: TipoPersona[];
  especialidadesDocentes: EspecialidadDocente[];
  categoriasSocio: CategoriaSocio[];
  tiposContacto: TipoContacto[];
  razonesSociales: RazonSocial[];
}

// ============================================================================
// ENTIDADES PRINCIPALES
// ============================================================================

/**
 * Tipo asignado a una persona (tabla de relación)
 * NOTA: El backend envía tipoPersonaId (number), no tipoPersonaCodigo (string)
 */
export interface PersonaTipo {
  id: number;
  personaId: number;
  tipoPersonaId: number;       // ID del tipo (el backend NO envía tipoPersonaCodigo)

  // Campos específicos según el tipo
  categoriaId?: number;        // Para SOCIO (Int)
  numeroSocio?: number;        // Auto-generado para SOCIO
  fechaIngreso?: string;       // Para SOCIO (ISO 8601)
  fechaBaja?: string;          // Para SOCIO
  motivoBaja?: string;         // Para SOCIO
  especialidadId?: number;     // Para DOCENTE
  honorariosPorHora?: number | string;  // Para DOCENTE (backend envía string)
  cuit?: string;               // Para PROVEEDOR (11 dígitos)
  razonSocialId?: number;      // Para PROVEEDOR (Int)

  // Metadatos
  fechaAsignacion: string;     // ISO 8601
  fechaDesasignacion?: string; // ISO 8601
  activo: boolean;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;

  // Relaciones opcionales (cuando se incluyen)
  tipoPersona?: TipoPersona;
  categoria?: CategoriaSocio;
  especialidad?: EspecialidadDocente;
  razonSocial?: RazonSocial;

  // DEPRECATED: Solo para compatibilidad con código antiguo
  // Usar tipoPersona.codigo en su lugar
  tipoPersonaCodigo?: string;
}

/**
 * Contacto adicional de una persona
 */
export interface Contacto {
  id: number;
  personaId: number;
  tipoContactoId: number;
  valor: string;               // Número, email, URL, etc.
  descripcion?: string;
  principal: boolean;          // Solo uno puede ser principal por tipo de contacto
  activo: boolean;
  observaciones?: string;      // Max 500 caracteres
  createdAt?: string;
  updatedAt?: string;

  // Relaciones opcionales
  tipoContacto?: TipoContacto;
}

/**
 * Persona V2 - con múltiples tipos
 * NOTA: El backend envía 'activo' (boolean), no 'estado' (enum)
 * NOTA: El backend NO envía 'fechaIngreso' en la raíz, sino dentro de tipos[]
 */
export interface Persona {
  id: number;

  // Datos personales básicos
  nombre: string;
  apellido: string;
  dni: string;                 // Único
  email?: string;              // Único (opcional)
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;    // ISO 8601
  genero?: GeneroPersona;      // Género para relaciones familiares

  // Estado - El backend envía 'activo' (boolean)
  activo: boolean;             // Campo real del backend
  estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';  // Campo virtual calculado

  // Campos heredados del modelo legacy (aún presentes en backend)
  numeroSocio?: number | null;
  categoria?: any | null;
  fechaIngreso?: string | null;  // Campo legacy, ahora está en tipos[].fechaIngreso
  fechaBaja?: string | null;
  motivoBaja?: string | null;
  especialidad?: any | null;
  honorariosPorHora?: string | number | null;
  cuit?: string | null;
  razonSocial?: any | null;
  categoriaId?: number | null;
  observaciones?: string;

  // Metadatos
  createdAt?: string;
  updatedAt?: string;

  // Relaciones (array de tipos asignados)
  tipos?: PersonaTipo[];
  contactos?: Contacto[];

  // Campos calculados (virtuales)
  nombreCompleto?: string;     // `${nombre} ${apellido}`
  tiposCodigos?: string[];     // ['SOCIO', 'DOCENTE']
  esSocio?: boolean;
  esDocente?: boolean;
  esProveedor?: boolean;
}

// ============================================================================
// DTOs - CREAR
// ============================================================================

/**
 * DTO para crear un tipo de persona
 */
export interface CreatePersonaTipoDTO {
  tipoPersonaCodigo: string;

  // Campos condicionales según el tipo
  categoriaId?: number;        // Obligatorio si tipo === 'SOCIO'
  especialidadId?: number;     // Obligatorio si tipo === 'DOCENTE'
  honorariosPorHora?: number;  // Obligatorio si tipo === 'DOCENTE'
  cuit?: string;               // Obligatorio si tipo === 'PROVEEDOR' (11 dígitos)
  razonSocialId?: number;      // Obligatorio si tipo === 'PROVEEDOR'

  observaciones?: string;
}

/**
 * DTO para crear un contacto
 */
export interface CreateContactoDTO {
  tipoContactoId: number;
  valor: string;
  descripcion?: string;
  principal?: boolean;         // Solo uno puede ser principal por tipo de contacto
  observaciones?: string;      // Max 500 caracteres
}

/**
 * DTO para crear una persona con tipos y contactos
 */
export interface CreatePersonaDTO {
  // Datos personales
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  genero?: GeneroPersona;

  // Tipos y contactos (opcional al crear)
  tipos?: CreatePersonaTipoDTO[];
  contactos?: CreateContactoDTO[];

  observaciones?: string;
}

// ============================================================================
// DTOs - ACTUALIZAR
// ============================================================================

/**
 * DTO para actualizar una persona (todos los campos opcionales)
 */
export interface UpdatePersonaDTO {
  nombre?: string;
  apellido?: string;
  dni?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  genero?: GeneroPersona;
  estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  observaciones?: string;
}

/**
 * DTO para actualizar un tipo asignado
 */
export interface UpdatePersonaTipoDTO {
  categoriaId?: number;
  especialidadId?: number;
  honorariosPorHora?: number;
  cuit?: string;
  razonSocialId?: number;
  activo?: boolean;
  observaciones?: string;
}

/**
 * DTO para actualizar un contacto
 */
export interface UpdateContactoDTO {
  tipoContactoId?: number;
  valor?: string;
  descripcion?: string;
  principal?: boolean;         // Solo uno puede ser principal por tipo de contacto
  activo?: boolean;
  observaciones?: string;      // Max 500 caracteres
}

// ============================================================================
// QUERY PARAMS Y FILTROS
// ============================================================================

/**
 * Parámetros de consulta para listar personas
 */
export interface PersonasQueryParams {
  // Paginación
  page?: number;
  limit?: number;

  // Filtros
  search?: string;             // Búsqueda en nombre, apellido, DNI
  tiposCodigos?: string[];     // Filtrar por múltiples tipos ['SOCIO', 'DOCENTE']
  estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  categoriaId?: number;        // Filtrar socios por categoría
  especialidadId?: number;     // Filtrar docentes por especialidad

  // Filtros de estado
  activo?: boolean;            // true: solo activas, false: solo inactivas (default: true si no se envía)

  // Opciones de inclusión
  includeTipos?: boolean;      // Incluir tipos asignados (default: true)
  includeContactos?: boolean;  // Incluir contactos (default: false)
  includeRelaciones?: boolean; // Incluir relaciones de tipos/categorías/especialidades

  // Ordenamiento
  orderBy?: 'nombre' | 'apellido' | 'dni' | 'fechaIngreso' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}

// ============================================================================
// RESPUESTAS DE API
// ============================================================================

/**
 * Respuesta paginada de personas
 * Usa el tipo estándar PaginatedResponse que retorna el backend con 'meta'
 */
export type PersonasPaginatedResponse = import('../services/api').PaginatedResponse<Persona>;

/**
 * Respuesta de catálogos
 */
export interface CatalogosResponse {
  success: boolean;
  data: CatalogosPersonas;
  message?: string;
}

/**
 * Respuesta de validación
 */
export interface ValidationResponse {
  success: boolean;
  data: {
    exists: boolean;
    field: string;
    value: string;
  };
  message?: string;
}

// ============================================================================
// ESTADÍSTICAS Y REPORTES
// ============================================================================

/**
 * Estadísticas de tipos de persona
 */
export interface EstadisticasTipos {
  tipoPersona: TipoPersona;
  totalPersonas: number;
  totalActivos: number;
  porcentaje: number;
}

/**
 * Resumen de tipos por persona
 */
export interface ResumenTiposPersona {
  persona: Persona;
  cantidadTipos: number;
  tiposActivos: string[];
  tiposInactivos: string[];
  fechaPrimerTipo?: string;
  fechaUltimoTipo?: string;
}

// ============================================================================
// DTOs ADMIN - GESTIÓN DE CATÁLOGOS
// ============================================================================

/**
 * DTO para crear un tipo de persona (admin)
 */
export interface CreateTipoPersonaDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiresCategoria?: boolean;
  requiresEspecialidad?: boolean;
  requiresCuit?: boolean;
  orden?: number;
}

/**
 * DTO para actualizar un tipo de persona (admin)
 */
export interface UpdateTipoPersonaDTO {
  nombre?: string;
  descripcion?: string;
  requiresCategoria?: boolean;
  requiresEspecialidad?: boolean;
  requiresCuit?: boolean;
  activo?: boolean;
  orden?: number;
}

/**
 * DTO para crear una especialidad docente (admin)
 */
export interface CreateEspecialidadDocenteDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
}

/**
 * DTO para actualizar una especialidad docente (admin)
 */
export interface UpdateEspecialidadDocenteDTO {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  orden?: number;
}

/**
 * DTO para crear un tipo de contacto (admin)
 */
export interface CreateTipoContactoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  pattern?: string;            // Regex para validación de formato
  orden?: number;
}

/**
 * DTO para actualizar un tipo de contacto (admin)
 */
export interface UpdateTipoContactoDTO {
  nombre?: string;
  descripcion?: string;
  icono?: string;
  pattern?: string;            // Regex para validación de formato
  activo?: boolean;
  orden?: number;
}

/**
 * DTO para reordenar catálogos
 */
export interface ReorderCatalogoDTO {
  items: Array<{
    id: number;
    orden: number;
  }>;
}

// ============================================================================
// UTILIDADES Y HELPERS
// ============================================================================

/**
 * Verificar si una persona tiene un tipo específico
 */
export const personaTieneTipo = (persona: Persona, codigoTipo: string): boolean => {
  return persona.tipos?.some(t =>
    t.tipoPersona?.codigo === codigoTipo && t.activo
  ) ?? false;
};

/**
 * Obtener tipos activos de una persona
 */
export const getTiposActivos = (persona: Persona): PersonaTipo[] => {
  return persona.tipos?.filter(t => t.activo) ?? [];
};

/**
 * Obtener códigos de tipos activos
 */
export const getCodigosTiposActivos = (persona: Persona): string[] => {
  return getTiposActivos(persona)
    .map(t => t.tipoPersona?.codigo)
    .filter((codigo): codigo is string => !!codigo);
};

/**
 * Obtener contacto principal de una persona
 */
export const getContactoPrincipal = (persona: Persona): Contacto | null => {
  return persona.contactos?.find(c => c.principal && c.activo) ?? null;
};

/**
 * Validar si un tipo requiere campos específicos
 */
export const tipoRequiereCampos = (tipoPersona: TipoPersona): {
  requiresCategoria: boolean;
  requiresEspecialidad: boolean;
  requiresCuit: boolean;
} => {
  return {
    requiresCategoria: tipoPersona.requiresCategoria ?? false,
    requiresEspecialidad: tipoPersona.requiresEspecialidad ?? false,
    requiresCuit: tipoPersona.requiresCuit ?? false,
  };
};

/**
 * Formatear nombre completo
 */
export const getNombreCompleto = (persona: Persona | CreatePersonaDTO): string => {
  return `${persona.apellido}, ${persona.nombre}`.trim();
};

/**
 * Validar formato de CUIT (11 dígitos)
 */
export const isValidCuit = (cuit: string): boolean => {
  return /^\d{11}$/.test(cuit);
};

/**
 * Validar formato de DNI (7-8 dígitos)
 */
export const isValidDni = (dni: string): boolean => {
  return /^\d{7,8}$/.test(dni);
};

/**
 * Obtener contactos por tipo
 */
export const getContactosPorTipo = (
  persona: Persona,
  tipoContactoCodigo: string
): Contacto[] => {
  if (!persona.contactos) return [];
  return persona.contactos.filter(
    c => c.tipoContacto?.codigo === tipoContactoCodigo && c.activo
  );
};

/**
 * Obtener contacto principal por tipo
 */
export const getContactoPrincipalPorTipo = (
  persona: Persona,
  tipoContactoCodigo: string
): Contacto | null => {
  if (!persona.contactos) return null;
  return persona.contactos.find(
    c => c.tipoContacto?.codigo === tipoContactoCodigo && c.principal && c.activo
  ) ?? null;
};

/**
 * Obtener email principal de contactos
 */
export const getEmailPrincipal = (persona: Persona): string | null => {
  const contacto = getContactoPrincipalPorTipo(persona, 'EMAIL');
  return contacto?.valor ?? null;
};

/**
 * Obtener teléfono principal de contactos
 */
export const getTelefonoPrincipal = (persona: Persona): string | null => {
  const contacto = getContactoPrincipalPorTipo(persona, 'TELEFONO');
  return contacto?.valor ?? null;
};

/**
 * Obtener celular principal de contactos
 */
export const getCelularPrincipal = (persona: Persona): string | null => {
  const contacto = getContactoPrincipalPorTipo(persona, 'CELULAR');
  return contacto?.valor ?? null;
};

/**
 * Obtener WhatsApp principal de contactos
 */
export const getWhatsAppPrincipal = (persona: Persona): string | null => {
  const contacto = getContactoPrincipalPorTipo(persona, 'WHATSAPP');
  return contacto?.valor ?? null;
};
