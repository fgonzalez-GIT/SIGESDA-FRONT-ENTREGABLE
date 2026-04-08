// ============================================
// TIPOS Y INTERFACES DE CATEGORÍAS DE ACTIVIDAD
// ============================================

// ============================================
// INTERFACES DE ENTIDADES PRINCIPALES
// ============================================

/**
 * Interfaz principal de CategoriaActividad
 * Representa una categoría de actividad en el sistema (Infantil, Juvenil, Adulto, etc.)
 */
export interface CategoriaActividad {
  id: number; // SERIAL autoincremental
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    actividades: number; // Cantidad de actividades usando esta categoría
  };
}

/**
 * Interfaz resumida de categoría de actividad (para relaciones)
 * Se usa cuando solo se necesita información básica
 */
export interface CategoriaActividadResumen {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

// ============================================
// DTOs - REQUEST (para enviar al backend)
// ============================================

/**
 * DTO para crear una nueva categoría de actividad
 */
export interface CreateCategoriaActividadDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
}

/**
 * DTO para actualizar una categoría de actividad existente
 * Todos los campos son opcionales
 */
export interface UpdateCategoriaActividadDto {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  orden?: number;
}

/**
 * DTO para reordenar categorías de actividad
 */
export interface ReorderCategoriasActividadDto {
  categoriaIds: number[];
}

// ============================================
// DTOs - RESPONSE (respuestas del backend)
// ============================================

/**
 * Respuesta genérica de la API para operaciones con categorías de actividad
 */
export interface CategoriaActividadApiResponse {
  success: boolean;
  data: CategoriaActividad;
  message?: string;
}

/**
 * Respuesta para listado de categorías de actividad
 */
export interface CategoriasActividadListResponse {
  success: boolean;
  data: CategoriaActividad[];
  total: number;
  message?: string;
}

/**
 * Respuesta con estadísticas de una categoría de actividad
 */
export interface CategoriaActividadStatsResponse {
  success: boolean;
  data: {
    categoria: CategoriaActividad;
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
 * Parámetros de consulta para listar categorías de actividad
 */
export interface CategoriasActividadQueryParams {
  includeInactive?: boolean;
  search?: string;
}

// ============================================
// TIPOS AUXILIARES PARA FORMULARIOS
// ============================================

/**
 * Datos del formulario de categoría de actividad
 * Usado con react-hook-form o estado local
 */
export interface CategoriaActividadFormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  orden?: number;
}

/**
 * Datos para edición de categoría de actividad
 */
export interface CategoriaActividadEditFormData extends CategoriaActividadFormData {
  activo: boolean;
}

// ============================================
// TYPES PARA COMPONENTES
// ============================================

/**
 * Props para selector de categoría de actividad
 */
export interface CategoriaActividadSelectProps {
  value?: number;
  onChange: (categoriaId: number) => void;
  error?: string;
  includeInactive?: boolean;
  required?: boolean;
  label?: string;
  disabled?: boolean;
}

/**
 * Props para badge de categoría de actividad
 */
export interface CategoriaActividadBadgeProps {
  categoria: CategoriaActividad | CategoriaActividadResumen;
  showCodigo?: boolean;
  size?: 'small' | 'medium';
}

// ============================================
// TIPOS PARA ESTADO DE REDUX
// ============================================

/**
 * Estado del slice de categorías de actividad en Redux
 */
export interface CategoriasActividadState {
  categorias: CategoriaActividad[];
  loading: boolean;
  error: string | null;
  selectedCategoria: CategoriaActividad | null;
  showInactive: boolean;
}
