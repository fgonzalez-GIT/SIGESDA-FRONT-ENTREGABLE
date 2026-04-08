/**
 * Types para el módulo de Equipamientos
 *
 * Equipamientos son recursos que pueden estar disponibles en aulas
 * (ej: Piano, Proyector, Pizarra, etc.)
 */

// ==================== INTERFACES PRINCIPALES ====================

/**
 * Entidad Equipamiento
 */
export interface Equipamiento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  observaciones?: string | null;
  categoriaEquipamientoId: number;
  categoriaEquipamiento?: CategoriaEquipamiento; // Opcional porque puede no venir incluida
  estadoEquipamientoId?: number | null; // NUEVO: ID del estado del equipamiento (nullable)
  estadoEquipamiento?: EstadoEquipamiento; // NUEVO: Relación con estado del equipamiento
  cantidad: number; // NUEVO: Cantidad/stock total del equipamiento (default: 1)
  orden?: number; // Orden de visualización
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    aulas_equipamientos: number; // Cantidad de aulas que tienen este equipamiento
  };
}

// ==================== ENUMS Y CONSTANTES ====================

/**
 * Categoría de equipamiento (entidad del backend)
 */
export interface CategoriaEquipamiento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Estado de equipamiento (entidad del backend)
 * Representa el estado actual del equipamiento (Nuevo, Usado, En Reparación, etc.)
 */
export interface EstadoEquipamiento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Código de categoría (para tipos)
 */
export type CategoriaEquipamientoCodigo =
  | 'MUSICAL'
  | 'AUDIOVISUAL'
  | 'MOBILIARIO'
  | 'CLIMATIZACION'
  | 'TECNOLOGIA'
  | 'OTRO';

export const CATEGORIAS_EQUIPAMIENTO_CODIGOS: CategoriaEquipamientoCodigo[] = [
  'MUSICAL',
  'AUDIOVISUAL',
  'MOBILIARIO',
  'CLIMATIZACION',
  'TECNOLOGIA',
  'OTRO',
];

/**
 * Labels legibles para categorías (fallback si no viene del backend)
 */
export const CATEGORIA_EQUIPAMIENTO_LABELS: Record<CategoriaEquipamientoCodigo, string> = {
  MUSICAL: 'Musical',
  AUDIOVISUAL: 'Audiovisual',
  MOBILIARIO: 'Mobiliario',
  CLIMATIZACION: 'Climatización',
  TECNOLOGIA: 'Tecnología',
  OTRO: 'Otro',
};

/**
 * Colores para chips de categorías (MUI palette - fallback)
 */
export const CATEGORIA_EQUIPAMIENTO_COLORS: Record<CategoriaEquipamientoCodigo, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  MUSICAL: 'secondary',
  AUDIOVISUAL: 'primary',
  MOBILIARIO: 'success',
  CLIMATIZACION: 'info',
  TECNOLOGIA: 'warning',
  OTRO: 'default',
};

/**
 * Código de estado de equipamiento (según guía backend)
 */
export type EstadoEquipamientoCodigo =
  | 'NUEVO'
  | 'USADO'
  | 'EN_REPARACION'
  | 'ROTO'
  | 'DADO_DE_BAJA';

export const ESTADOS_EQUIPAMIENTO_CODIGOS: EstadoEquipamientoCodigo[] = [
  'NUEVO',
  'USADO',
  'EN_REPARACION',
  'ROTO',
  'DADO_DE_BAJA',
];

/**
 * Labels legibles para estados (fallback si no viene del backend)
 */
export const ESTADO_EQUIPAMIENTO_LABELS: Record<EstadoEquipamientoCodigo, string> = {
  NUEVO: 'Nuevo',
  USADO: 'Usado',
  EN_REPARACION: 'En Reparación',
  ROTO: 'Roto',
  DADO_DE_BAJA: 'Dado de Baja',
};

/**
 * Colores para chips de estados (MUI palette)
 */
export const ESTADO_EQUIPAMIENTO_COLORS: Record<EstadoEquipamientoCodigo, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  NUEVO: 'success',
  USADO: 'info',
  EN_REPARACION: 'warning',
  ROTO: 'error',
  DADO_DE_BAJA: 'default',
};

/**
 * Estados que bloquean la asignación de equipamiento a aulas
 * Según guía: ROTO, EN_REPARACION, DADO_DE_BAJA no pueden asignarse
 */
export const ESTADOS_BLOQUEADOS: EstadoEquipamientoCodigo[] = [
  'ROTO',
  'EN_REPARACION',
  'DADO_DE_BAJA',
];

// ==================== DTOs ====================

/**
 * DTO para crear equipamiento
 * Nota: El código es autogenerado por el backend
 */
export interface CreateEquipamientoDto {
  nombre: string;
  descripcion?: string;
  observaciones?: string;
  categoriaEquipamientoId: number;
  estadoEquipamientoId?: number; // NUEVO: Estado del equipamiento (opcional, nullable)
  cantidad?: number; // NUEVO: Cantidad/stock total (default: 1 en backend)
  orden?: number;
}

/**
 * DTO para actualizar equipamiento
 * Nota: El código no se puede modificar una vez creado
 */
export interface UpdateEquipamientoDto {
  nombre?: string;
  descripcion?: string;
  observaciones?: string;
  categoriaEquipamientoId?: number;
  estadoEquipamientoId?: number; // NUEVO: Actualizar estado
  cantidad?: number; // NUEVO: Actualizar cantidad/stock
  activo?: boolean;
  orden?: number;
}

// ==================== QUERY PARAMS ====================

/**
 * Parámetros para filtrar equipamientos
 */
export interface EquipamientoQueryParams {
  // Paginación
  page?: number;        // default: 1
  limit?: number;       // default: 10, max: 100 (backend NO acepta -1). Usar 100 para obtener todos.

  // Filtros
  includeInactive?: boolean;
  search?: string;
  categoria?: CategoriaEquipamiento;
  estadoEquipamientoId?: number; // NUEVO: Filtrar por estado
  conStock?: boolean; // NUEVO: Solo equipamiento con cantidad > 0
}

// ==================== API RESPONSES ====================

/**
 * Response de un equipamiento
 */
export interface EquipamientoApiResponse {
  success: boolean;
  data: Equipamiento;
  message?: string;
}

/**
 * Response de lista de equipamientos
 */
export interface EquipamientoListResponse {
  success: boolean;
  data: Equipamiento[];
  total: number;
  message?: string;
}

/**
 * Información de disponibilidad de un equipamiento
 * NUEVO: Según guía backend
 */
export interface DisponibilidadInfo {
  cantidadTotal: number;        // Stock total en inventario
  cantidadAsignada: number;     // Suma de cantidades asignadas en aulas
  cantidadDisponible: number;   // Total - Asignadas (puede ser negativo si hay déficit)
  tieneDeficit: boolean;        // true si cantidadDisponible < 0
}

/**
 * Response del endpoint de disponibilidad
 * GET /api/equipamientos/:id/disponibilidad
 */
export interface EquipamientoDisponibilidadResponse {
  success: boolean;
  data: Equipamiento & {
    disponibilidad: DisponibilidadInfo;
  };
  message?: string;
}

// ==================== HELPERS ====================

/**
 * Obtiene el label legible de una categoría
 */
export const getCategoriaLabel = (categoria: CategoriaEquipamiento | undefined): string => {
  // Si categoria es un objeto (del backend), usar su nombre
  if (categoria && typeof categoria === 'object' && categoria.nombre) {
    return categoria.nombre;
  }
  // Fallback
  return 'Sin categoría';
};

/**
 * Obtiene el color del chip de una categoría
 */
export const getCategoriaColor = (categoria: CategoriaEquipamiento | undefined): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default' => {
  // Si categoria es un objeto y tiene color definido, usarlo
  if (categoria && typeof categoria === 'object' && categoria.color) {
    return categoria.color as any;
  }
  // Fallback a colores por código
  if (categoria && typeof categoria === 'object' && categoria.codigo) {
    const codigo = categoria.codigo as CategoriaEquipamientoCodigo;
    return CATEGORIA_EQUIPAMIENTO_COLORS[codigo] || 'default';
  }
  return 'default';
};

/**
 * Filtra equipamientos activos
 */
export const getActiveEquipamientos = (equipamientos: Equipamiento[]): Equipamiento[] => {
  return equipamientos.filter(e => e.activo);
};

/**
 * Ordena equipamientos por orden y nombre
 */
export const sortEquipamientos = (equipamientos: Equipamiento[]): Equipamiento[] => {
  return [...equipamientos].sort((a, b) => {
    const ordenA = a.orden ?? 999;
    const ordenB = b.orden ?? 999;
    if (ordenA !== ordenB) return ordenA - ordenB;
    return a.nombre.localeCompare(b.nombre);
  });
};

/**
 * Agrupa equipamientos por categoría (por código)
 */
export const groupByCategoria = (equipamientos: Equipamiento[]): Record<string, Equipamiento[]> => {
  const grouped: Record<string, Equipamiento[]> = {};

  equipamientos.forEach(eq => {
    const codigo = eq.categoriaEquipamiento?.codigo || 'SIN_CATEGORIA';
    if (!grouped[codigo]) {
      grouped[codigo] = [];
    }
    grouped[codigo].push(eq);
  });

  return grouped;
};

/**
 * Obtiene el label legible de un estado
 * NUEVO: Helper para estados de equipamiento
 */
export const getEstadoLabel = (estado: EstadoEquipamiento | undefined): string => {
  // Si estado es un objeto (del backend), usar su nombre
  if (estado && typeof estado === 'object' && estado.nombre) {
    return estado.nombre;
  }
  // Fallback
  return 'Sin estado';
};

/**
 * Obtiene el color del chip de un estado
 * NUEVO: Helper para estados de equipamiento
 */
export const getEstadoColor = (estado: EstadoEquipamiento | undefined): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default' => {
  // Si estado es un objeto y tiene color definido, usarlo
  if (estado && typeof estado === 'object' && estado.color) {
    return estado.color as any;
  }
  // Fallback a colores por código
  if (estado && typeof estado === 'object' && estado.codigo) {
    const codigo = estado.codigo as EstadoEquipamientoCodigo;
    return ESTADO_EQUIPAMIENTO_COLORS[codigo] || 'default';
  }
  return 'default';
};

/**
 * Verifica si un equipamiento está en un estado bloqueado (no se puede asignar a aulas)
 * NUEVO: Validación según guía backend
 * Estados bloqueados: ROTO, EN_REPARACION, DADO_DE_BAJA
 */
export const isEstadoBloqueado = (estado: EstadoEquipamiento | undefined): boolean => {
  if (!estado || !estado.codigo) return false;
  return ESTADOS_BLOQUEADOS.includes(estado.codigo as EstadoEquipamientoCodigo);
};

/**
 * Verifica si un equipamiento puede asignarse a un aula
 * NUEVO: Validación combinada (activo + estado no bloqueado)
 */
export const puedeAsignarse = (equipamiento: Equipamiento): boolean => {
  if (!equipamiento.activo) return false;
  if (isEstadoBloqueado(equipamiento.estadoEquipamiento)) return false;
  return true;
};
