// ============================================
// TIPOS Y INTERFACES DE TIPOS DE ACTIVIDAD
// ============================================

// ============================================
// INTERFACES DE ENTIDADES PRINCIPALES
// ============================================

/**
 * Interfaz principal de TipoActividad
 * Representa un tipo de actividad en el sistema (Coro, Clase, Taller, etc.)
 */
export interface TipoActividad {
  id: number; // SERIAL autoincremental
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    actividades: number; // Cantidad de actividades usando este tipo
  };
}

/**
 * Interfaz resumida de tipo de actividad (para relaciones)
 * Se usa cuando solo se necesita información básica
 */
export interface TipoActividadResumen {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

// ============================================
// DTOs - REQUEST (para enviar al backend)
// ============================================

/**
 * DTO para crear un nuevo tipo de actividad
 */
export interface CreateTipoActividadDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
}

/**
 * DTO para actualizar un tipo de actividad existente
 * Todos los campos son opcionales
 */
export interface UpdateTipoActividadDto {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  orden?: number;
}

/**
 * DTO para reordenar tipos de actividad
 */
export interface ReorderTiposActividadDto {
  tipoIds: number[];
}

// ============================================
// DTOs - RESPONSE (respuestas del backend)
// ============================================

/**
 * Respuesta genérica de la API para operaciones con tipos de actividad
 */
export interface TipoActividadApiResponse {
  success: boolean;
  data: TipoActividad;
  message?: string;
}

/**
 * Respuesta para listado de tipos de actividad
 */
export interface TiposActividadListResponse {
  success: boolean;
  data: TipoActividad[];
  total: number;
  message?: string;
}

/**
 * Respuesta con estadísticas de un tipo de actividad
 */
export interface TipoActividadStatsResponse {
  success: boolean;
  data: {
    tipo: TipoActividad;
    stats: {
      totalActividades: number;
      actividadesActivas: number;
      actividadesInactivas: number;
    };
  };
}

// ============================================
// FILTROS Y QUERY PARAMS
// ============================================

/**
 * Parámetros de consulta para listar tipos de actividad
 */
export interface TiposActividadQueryParams {
  includeInactive?: boolean;
  search?: string;
}

// ============================================
// TIPOS AUXILIARES PARA FORMULARIOS
// ============================================

/**
 * Datos del formulario de tipo de actividad
 * Usado con react-hook-form o estado local
 */
export interface TipoActividadFormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  orden?: number;
}

/**
 * Datos para edición de tipo de actividad
 */
export interface TipoActividadEditFormData extends TipoActividadFormData {
  activo: boolean;
}

// ============================================
// TYPES PARA COMPONENTES
// ============================================

/**
 * Props para selector de tipo de actividad
 */
export interface TipoActividadSelectProps {
  value?: number;
  onChange: (tipoId: number) => void;
  error?: string;
  includeInactive?: boolean;
  required?: boolean;
  label?: string;
  disabled?: boolean;
}

/**
 * Props para badge de tipo de actividad
 */
export interface TipoActividadBadgeProps {
  tipo: TipoActividad | TipoActividadResumen;
  showCodigo?: boolean;
  size?: 'small' | 'medium';
}

// ============================================
// TIPOS PARA ESTADO DE REDUX
// ============================================

/**
 * Estado del slice de tipos de actividad en Redux
 */
export interface TiposActividadState {
  tipos: TipoActividad[];
  loading: boolean;
  error: string | null;
  selectedTipo: TipoActividad | null;
  showInactive: boolean;
}
