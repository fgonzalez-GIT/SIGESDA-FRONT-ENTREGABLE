// ============================================
// TIPOS Y INTERFACES DE CATEGORÍA DE SOCIO
// ============================================

// ============================================
// INTERFACES DE ENTIDADES PRINCIPALES
// ============================================

/**
 * Interfaz principal de CategoriaSocio
 * Representa una categoría de socio dinámica en el sistema
 */
export interface CategoriaSocio {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  montoCuota: string; // Decimal como string (ej: "25000.00")
  descuento: string;  // Decimal como string (ej: "10.00")
  activa: boolean;
  orden: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    personas: number;
    cuotas: number;
  };
}

/**
 * Interfaz resumida de categoría (para relaciones)
 * Se usa cuando solo se necesita información básica
 */
export interface CategoriaResumen {
  id: number;
  codigo: string;
  nombre: string;
  montoCuota: string;
  descuento: string;
  activa: boolean;
}

// ============================================
// DTOs - REQUEST (para enviar al backend)
// ============================================

/**
 * DTO para crear una nueva categoría
 */
export interface CreateCategoriaDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  montoCuota: number;
  descuento?: number;
  orden?: number;
}

/**
 * DTO para actualizar una categoría existente
 * Todos los campos son opcionales
 */
export interface UpdateCategoriaDto {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  montoCuota?: number;
  descuento?: number;
  activa?: boolean;
  orden?: number;
}

/**
 * DTO para reordenar categorías
 */
export interface ReorderCategoriasDto {
  categoriaIds: string[];
}

// ============================================
// DTOs - RESPONSE (respuestas del backend)
// ============================================

/**
 * Respuesta genérica de la API para operaciones con categorías
 */
export interface CategoriaApiResponse {
  success: boolean;
  data: CategoriaSocio;
  message?: string;
}

/**
 * Respuesta para listado de categorías
 */
export interface CategoriasListResponse {
  success: boolean;
  data: CategoriaSocio[];
  total: number;
  message?: string;
}

/**
 * Respuesta con estadísticas de una categoría
 */
export interface CategoriaStatsResponse {
  success: boolean;
  data: {
    categoria: CategoriaSocio;
    stats: {
      totalPersonas: number;
      totalCuotas: number;
      totalRecaudado: string; // Decimal como string
    };
  };
}

// ============================================
// FILTROS Y QUERY PARAMS
// ============================================

/**
 * Parámetros de consulta para listar categorías
 */
export interface CategoriasQueryParams {
  includeInactive?: boolean;
  search?: string;
}

// ============================================
// TIPOS AUXILIARES PARA FORMULARIOS
// ============================================

/**
 * Datos del formulario de categoría
 * Usado con react-hook-form
 */
export interface CategoriaFormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  montoCuota: number;
  descuento: number;
  orden?: number;
}

/**
 * Datos para edición de categoría
 */
export interface CategoriaEditFormData extends CategoriaFormData {
  activa: boolean;
}

// ============================================
// TYPES PARA COMPONENTES
// ============================================

/**
 * Props para selector de categoría
 */
export interface CategoriaSelectProps {
  value?: string;
  onChange: (categoriaId: string) => void;
  error?: string;
  includeInactive?: boolean;
  required?: boolean;
  label?: string;
  disabled?: boolean;
}

/**
 * Props para badge de categoría
 */
export interface CategoriaBadgeProps {
  categoria: CategoriaSocio | CategoriaResumen;
  showMonto?: boolean;
  showDescuento?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================
// TIPOS PARA ESTADO DE REDUX
// ============================================

/**
 * Estado del slice de categorías en Redux
 */
export interface CategoriasState {
  categorias: CategoriaSocio[];
  loading: boolean;
  error: string | null;
  selectedCategoria: CategoriaSocio | null;
  showInactive: boolean;
}
