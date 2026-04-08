/**
 * Type Definitions para Grupos Familiares
 *
 * Este archivo centraliza todas las interfaces y tipos relacionados con
 * el módulo de Grupos Familiares. Incluye:
 * - Modelos de dominio (GrupoFamiliar)
 * - DTOs de Request/Response
 * - Interfaces para filtros y estadísticas
 * - Tipos para sugerencias y validación familiar
 *
 * @version 2026-02-26 - Actualizado con nuevas características de integración backend
 */

// ============================================================================
// MODELOS DE DOMINIO
// ============================================================================

/**
 * Configuración avanzada de un grupo familiar
 */
export interface GrupoFamiliarConfiguracion {
  /** Si true, toda la facturación se unifica al referente del grupo */
  facturacionConjunta: boolean;

  /** Si true, el descuento aumenta progresivamente con la cantidad de miembros */
  descuentoProgresivo: boolean;

  /** Límite de cuotas mensuales con descuento aplicable (0 = ilimitado) */
  limiteCuotas: number;
}

/**
 * Representa un grupo familiar en el sistema
 * Un grupo familiar agrupa a varias personas relacionadas con descuentos compartidos
 */
export interface GrupoFamiliar {
  /** ID único del grupo */
  id: number;

  /** Nombre descriptivo del grupo (ej: "Familia Rodríguez") */
  nombre: string;

  /** Descripción opcional adicional */
  descripcion?: string;

  /** ID de la persona referente/principal del grupo */
  personaReferente: number;

  /**
   * IDs de todas las personas que son miembros del grupo
   * IMPORTANTE: El referente SIEMPRE está incluido como primer miembro (backend lo agrega automáticamente)
   */
  miembros: number[];

  /** Porcentaje de descuento aplicable al grupo (0-100) */
  descuentoGrupal: number;

  /** Fecha de creación del grupo (ISO 8601) */
  fechaCreacion: string;

  /** Si el grupo está activo o dado de baja */
  activo: boolean;

  /** Configuración avanzada del grupo */
  configuracion: GrupoFamiliarConfiguracion;
}

// ============================================================================
// DTOs - REQUESTS
// ============================================================================

/**
 * DTO para crear un nuevo grupo familiar
 *
 * IMPORTANTE:
 * - El campo `miembros` NO debe incluir al referente manualmente (backend lo agrega automáticamente)
 * - Si se incluye el referente en `miembros`, backend eliminará el duplicado
 * - Si `skipFamilyValidation` es false (default), todos los miembros deben tener relación familiar con el referente
 * - Si `skipFamilyValidation` es true, se permiten miembros sin relación (genera warnings)
 */
export interface CrearGrupoFamiliarRequest {
  /** Nombre del grupo (1-200 caracteres) */
  nombre: string;

  /** Descripción opcional (máx 500 caracteres) */
  descripcion?: string;

  /** ID de la persona que será el referente del grupo */
  personaReferenteId: number;

  /** Porcentaje de descuento grupal (0-100, default: 0) */
  descuentoGrupal?: number;

  /** Si el grupo está activo (default: true) */
  activo?: boolean;

  /** Si se factura conjuntamente al referente (default: false) */
  facturacionConjunta?: boolean;

  /** Si el descuento es progresivo (default: false) */
  descuentoProgresivo?: boolean;

  /** Límite de cuotas con descuento (0 = ilimitado, default: 0) */
  limiteCuotas?: number;

  /**
   * Array opcional de IDs de miembros iniciales (excluyendo al referente)
   * Default: [] (solo el referente será miembro)
   */
  miembros?: number[];

  /**
   * NUEVO (v2026-02-26): Flag para omitir validación de relaciones familiares
   * - false (default): Valida que todos los miembros tengan relación familiar con el referente
   * - true: Permite agregar miembros sin relación (genera warnings en la respuesta)
   */
  skipFamilyValidation?: boolean;
}

/**
 * DTO para actualizar un grupo familiar existente
 * Todos los campos son opcionales (solo se actualizan los campos enviados)
 */
export interface ActualizarGrupoFamiliarRequest {
  /** Nuevo nombre del grupo */
  nombre?: string;

  /** Nueva descripción */
  descripcion?: string;

  /** Nuevo referente (ID de persona) */
  personaReferenteId?: number;

  /** Nuevo porcentaje de descuento grupal (0-100) */
  descuentoGrupal?: number;

  /** Activar/desactivar grupo */
  activo?: boolean;

  /** Actualizar facturación conjunta */
  facturacionConjunta?: boolean;

  /** Actualizar descuento progresivo */
  descuentoProgresivo?: boolean;

  /** Actualizar límite de cuotas */
  limiteCuotas?: number;

  /**
   * NUEVO (v2026-02-26): Flag para omitir validación de relaciones familiares
   */
  skipFamilyValidation?: boolean;
}

/**
 * DTO para agregar un miembro individual a un grupo existente
 */
export interface AddMiembroRequest {
  /** ID de la persona a agregar como miembro */
  personaId: number;

  /**
   * NUEVO (v2026-02-26): Flag para omitir validación de relaciones familiares
   * - false (default): Valida que la persona tenga relación familiar con el referente
   * - true: Permite agregar sin relación (genera warning en la respuesta)
   */
  skipFamilyValidation?: boolean;
}

/**
 * DTO para actualizar la lista completa de miembros de un grupo
 * NOTA: Este endpoint reemplaza toda la lista de miembros
 */
export interface ActualizarMiembrosRequest {
  /** Nueva lista completa de IDs de miembros (reemplaza la anterior) */
  miembrosIds: number[];

  /**
   * NUEVO (v2026-02-26): Flag para omitir validación de relaciones familiares
   */
  skipFamilyValidation?: boolean;
}

// ============================================================================
// DTOs - FILTERS & QUERIES
// ============================================================================

/**
 * Filtros para listado de grupos familiares
 */
export interface FiltrosGrupos {
  /** Número de página (paginación) */
  page?: number;

  /** Cantidad de resultados por página (default: 10, max: 100) */
  limit?: number;

  /** Filtrar por estado activo/inactivo */
  activo?: boolean;

  /** Filtrar grupos que tienen descuento > 0 */
  conDescuento?: boolean;

  /** Filtrar por ID de persona referente */
  referenteId?: number;

  /** Búsqueda por texto (nombre o descripción) */
  busqueda?: string;
}

// ============================================================================
// DTOs - STATISTICS
// ============================================================================

/**
 * Estadísticas agregadas de todos los grupos familiares
 */
export interface EstadisticasGrupos {
  /** Total de grupos registrados (activos + inactivos) */
  totalGrupos: number;

  /** Cantidad de grupos activos */
  gruposActivos: number;

  /** Cantidad de grupos inactivos */
  gruposInactivos: number;

  /** Promedio de miembros por grupo */
  promedioMiembrosPorGrupo: number;

  /** Descuento promedio aplicado en todos los grupos */
  descuentoPromedioGrupal: number;

  /** Cantidad de grupos con facturación conjunta habilitada */
  gruposConFacturacionConjunta: number;

  /** Cantidad de grupos con descuento progresivo habilitado */
  gruposConDescuentoProgresivo: number;

  /** Total de personas que pertenecen a algún grupo */
  totalPersonasEnGrupos: number;
}

// ============================================================================
// NUEVAS INTERFACES (v2026-02-26) - Sugerencias y Validación Familiar
// ============================================================================

/**
 * Representa una persona sugerida para ser miembro de un grupo
 * basándose en las relaciones familiares declaradas con el referente
 */
export interface SuggestedMember {
  /** ID de la persona */
  id: number;

  /** Nombre de la persona */
  nombre: string;

  /** Apellido de la persona */
  apellido: string;

  /** DNI/Documento de la persona */
  dni: string;

  /** Tipo de parentesco con el referente (ej: "ESPOSA", "HIJO", "HERMANO") */
  parentesco: string;

  /** ID de la relación familiar en la base de datos */
  relacionId: number;
}

/**
 * Resumen del árbol familiar del referente
 */
export interface FamilyTreeSummary {
  /** Cantidad de relaciones donde el referente es la persona principal */
  totalRelacionesDirectas: number;

  /** Cantidad de relaciones donde el referente es el familiar */
  totalRelacionesInversas: number;

  /** Total de relaciones bidireccionales */
  totalRelaciones: number;
}

/**
 * Respuesta del endpoint de sugerencias de miembros
 * GET /api/grupos/sugerir-miembros/:referenteId
 */
export interface SuggestedMembersResponse {
  /** ID del referente para quien se buscaron sugerencias */
  referenteId: number;

  /** Datos básicos del referente */
  referente: {
    id: number;
    nombre: string;
    apellido: string;
  };

  /** Cantidad total de personas sugeridas */
  totalSugerencias: number;

  /** Array de IDs de las personas sugeridas (siempre presente) */
  suggestedMembersIds: number[];

  /**
   * Array de objetos con detalles completos de las personas sugeridas
   * Presente solo si includeDetails=true en el request
   */
  suggestedPersons?: SuggestedMember[];

  /** Resumen del árbol familiar del referente */
  familyTreeSummary: FamilyTreeSummary;
}

/**
 * Response wrapper para operaciones que pueden generar warnings
 * Usado en: crearGrupo, agregarMiembro
 */
export interface GrupoResponseWithWarnings {
  /** El grupo creado/actualizado */
  grupo: GrupoFamiliar;

  /**
   * Array de warnings generados cuando se usa skipFamilyValidation=true
   * Ejemplo: ["ADVERTENCIA: La persona \"Juan Pérez\" (ID: 99) no tiene relación familiar declarada con el referente."]
   */
  warnings?: string[];
}

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

/**
 * Type guard para verificar si una response incluye warnings
 */
export function hasWarnings(
  response: GrupoFamiliar | GrupoResponseWithWarnings
): response is GrupoResponseWithWarnings {
  return 'warnings' in response && Array.isArray((response as GrupoResponseWithWarnings).warnings);
}

/**
 * Type guard para verificar si la response de sugerencias incluye detalles
 */
export function hasSuggestedPersonsDetails(
  response: SuggestedMembersResponse
): response is Required<SuggestedMembersResponse> {
  return response.suggestedPersons !== undefined && response.suggestedPersons.length > 0;
}
