/**
 * API Service para Grupos Familiares - Conectado con Backend Real
 *
 * Endpoints disponibles:
 * - POST   /api/grupos                         - Crear grupo
 * - GET    /api/grupos                         - Listar grupos (paginado, con filtros)
 * - GET    /api/grupos/:id                     - Obtener grupo por ID
 * - GET    /api/grupos/referente/:personaId    - Grupos donde persona es referente
 * - GET    /api/grupos/miembro/:personaId      - Grupos donde persona es miembro
 * - GET    /api/grupos/sugerir-miembros/:referenteId - NUEVO: Sugerir miembros basado en relaciones familiares
 * - PUT    /api/grupos/:id                     - Actualizar grupo
 * - DELETE /api/grupos/:id                     - Eliminar grupo (soft delete)
 * - POST   /api/grupos/:id/miembros            - Agregar miembro
 * - DELETE /api/grupos/:id/miembros/:miembroId - Remover miembro
 * - PUT    /api/grupos/:id/miembros            - Actualizar lista de miembros
 * - GET    /api/grupos/search                  - Búsqueda avanzada
 * - GET    /api/grupos/stats                   - Estadísticas de grupos
 *
 * Mapeo de campos:
 * Frontend (camelCase) -> Backend (snake_case)
 * - personaReferenteId -> persona_referente_id
 * - descuentoGrupal -> descuento_grupal
 * - facturacionConjunta -> facturacion_conjunta
 * - descuentoProgresivo -> descuento_progresivo
 * - limiteCuotas -> limite_cuotas
 * - createdAt -> fechaCreacion
 * - updatedAt -> updatedAt (preservado)
 *
 * NUEVAS CARACTERÍSTICAS (v2026-02-26):
 * - skipFamilyValidation: Flag para omitir validación de relaciones familiares
 * - Referente auto-incluido: El backend incluye automáticamente al referente como primer miembro
 * - Warnings: Respuestas incluyen array de warnings cuando se usa skipFamilyValidation
 * - Sugerencias: Endpoint que retorna familiares del referente para pre-selección
 */

// Importar tipos desde el archivo centralizado
import type {
  GrupoFamiliar,
  CrearGrupoFamiliarRequest,
  ActualizarGrupoFamiliarRequest,
  AddMiembroRequest,
  FiltrosGrupos,
  EstadisticasGrupos,
  SuggestedMember,
  SuggestedMembersResponse,
  GrupoResponseWithWarnings,
} from '../types/grupoFamiliar.types';

// Usar la variable de entorno que apunta al proxy de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Re-exportar tipos para compatibilidad con código existente
export type {
  GrupoFamiliar,
  CrearGrupoFamiliarRequest as CrearGrupoRequest,
  ActualizarGrupoFamiliarRequest as ActualizarGrupoRequest,
  AddMiembroRequest,
  FiltrosGrupos,
  EstadisticasGrupos,
  SuggestedMember,
  SuggestedMembersResponse,
  GrupoResponseWithWarnings,
};

// ============================================================================
// FUNCIONES DE MAPEO - Frontend ↔ Backend
// ============================================================================

/**
 * Mapea request de creación/actualización de grupo desde frontend a backend
 */
const mapGrupoRequestToBackend = (
  request: CrearGrupoFamiliarRequest | ActualizarGrupoFamiliarRequest
) => {
  const baseRequest = {
    nombre: request.nombre,
    descripcion: request.descripcion || null,
    personaReferenteId: request.personaReferenteId,
    descuentoGrupal: request.descuentoGrupal || 0,
    activo: request.activo !== undefined ? request.activo : true,
    facturacionConjunta: request.facturacionConjunta || false,
    descuentoProgresivo: request.descuentoProgresivo || false,
    limiteCuotas: request.limiteCuotas || 0,
    skipFamilyValidation: request.skipFamilyValidation || false,
  };

  // Agregar miembros solo si está presente (CrearGrupoFamiliarRequest)
  if ('miembros' in request && Array.isArray(request.miembros)) {
    return { ...baseRequest, miembros: request.miembros };
  }

  return baseRequest;
};

/**
 * Mapea respuesta de grupo desde backend a frontend
 */
const mapGrupoFromBackend = (backendGrupo: any): GrupoFamiliar => {
  return {
    id: backendGrupo.id,
    nombre: backendGrupo.nombre,
    descripcion: backendGrupo.descripcion || undefined,
    personaReferente: backendGrupo.persona_referente_id || backendGrupo.personaReferenteId,
    miembros: Array.isArray(backendGrupo.miembros)
      ? backendGrupo.miembros.map((m: any) => (typeof m === 'number' ? m : m.id))
      : [],
    descuentoGrupal: parseFloat(backendGrupo.descuento_grupal || backendGrupo.descuentoGrupal || '0'),
    fechaCreacion: backendGrupo.created_at || backendGrupo.createdAt || new Date().toISOString(),
    activo: backendGrupo.activo !== undefined ? backendGrupo.activo : true,
    configuracion: {
      facturacionConjunta: backendGrupo.facturacion_conjunta || backendGrupo.facturacionConjunta || false,
      descuentoProgresivo: backendGrupo.descuento_progresivo || backendGrupo.descuentoProgresivo || false,
      limiteCuotas: backendGrupo.limite_cuotas || backendGrupo.limiteCuotas || 0,
    },
  };
};

/**
 * Mapea estadísticas desde backend a frontend
 */
const mapEstadisticasFromBackend = (backendStats: any): EstadisticasGrupos => {
  return {
    totalGrupos: backendStats.total_grupos || backendStats.totalGrupos || 0,
    gruposActivos: backendStats.grupos_activos || backendStats.gruposActivos || 0,
    gruposInactivos: backendStats.grupos_inactivos || backendStats.gruposInactivos || 0,
    promedioMiembrosPorGrupo: parseFloat(
      backendStats.promedio_miembros_por_grupo || backendStats.promedioMiembrosPorGrupo || '0'
    ),
    descuentoPromedioGrupal: parseFloat(
      backendStats.descuento_promedio_grupal || backendStats.descuentoPromedioGrupal || '0'
    ),
    gruposConFacturacionConjunta:
      backendStats.grupos_con_facturacion_conjunta || backendStats.gruposConFacturacionConjunta || 0,
    gruposConDescuentoProgresivo:
      backendStats.grupos_con_descuento_progresivo || backendStats.gruposConDescuentoProgresivo || 0,
    totalPersonasEnGrupos: backendStats.total_personas_en_grupos || backendStats.totalPersonasEnGrupos || 0,
  };
};

// ============================================================================
// API FUNCTIONS - CRUD Básico
// ============================================================================

/**
 * Obtener todos los grupos con filtros opcionales
 * GET /api/grupos?page=1&limit=10&activo=true
 */
const getGrupos = async (
  filtros?: FiltrosGrupos
): Promise<{ data: GrupoFamiliar[]; total: number; pages: number }> => {
  try {
    const params = new URLSearchParams();
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    if (filtros?.activo !== undefined) params.append('activo', filtros.activo.toString());
    if (filtros?.conDescuento !== undefined) params.append('conDescuento', filtros.conDescuento.toString());
    if (filtros?.referenteId) params.append('referenteId', filtros.referenteId.toString());
    if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/grupos${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      return {
        data: result.data.map(mapGrupoFromBackend),
        total: result.meta?.total || result.data.length,
        pages: result.meta?.totalPages || result.meta?.pages || 1,
      };
    }

    return { data: [], total: 0, pages: 0 };
  } catch (error) {
    console.error('Error fetching grupos:', error);
    throw error;
  }
};

/**
 * Obtener grupo por ID
 * GET /api/grupos/:id
 */
const getGrupoById = async (id: number): Promise<GrupoFamiliar> => {
  try {
    const response = await fetch(`${API_BASE_URL}/grupos/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return mapGrupoFromBackend(result.data);
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error(`Error fetching grupo ${id}:`, error);
    throw error;
  }
};

/**
 * Crear nuevo grupo familiar
 * POST /api/grupos
 * @returns Response con grupo creado y warnings opcionales
 */
const crearGrupo = async (
  request: CrearGrupoFamiliarRequest
): Promise<GrupoResponseWithWarnings> => {
  try {
    const backendRequest = mapGrupoRequestToBackend(request);

    const response = await fetch(`${API_BASE_URL}/grupos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;

      // Manejar errores específicos
      if (errorData.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.join(', ');
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (result.success && result.data) {
      // Extraer grupo y warnings del resultado
      const grupoData = result.data.grupo || result.data;
      const warnings = result.data.warnings || [];

      return {
        grupo: mapGrupoFromBackend(grupoData),
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error creating grupo:', error);
    throw error;
  }
};

/**
 * Actualizar grupo existente
 * PUT /api/grupos/:id
 */
const actualizarGrupo = async (
  id: number,
  request: ActualizarGrupoFamiliarRequest
): Promise<GrupoFamiliar> => {
  try {
    const backendRequest = mapGrupoRequestToBackend(request);

    const response = await fetch(`${API_BASE_URL}/grupos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;

      if (errorData.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.join(', ');
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return mapGrupoFromBackend(result.data);
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error(`Error updating grupo ${id}:`, error);
    throw error;
  }
};

/**
 * Eliminar grupo (soft delete)
 * DELETE /api/grupos/:id
 */
const eliminarGrupo = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/grupos/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Eliminación exitosa
  } catch (error) {
    console.error(`Error deleting grupo ${id}:`, error);
    throw error;
  }
};

// ============================================================================
// API FUNCTIONS - Consultas Especializadas
// ============================================================================

/**
 * Obtener grupos donde la persona es referente
 * GET /api/grupos/referente/:personaId
 */
const getGruposPorReferente = async (personaId: number): Promise<GrupoFamiliar[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/grupos/referente/${personaId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      return result.data.map(mapGrupoFromBackend);
    }

    return [];
  } catch (error) {
    console.error(`Error fetching grupos by referente ${personaId}:`, error);
    throw error;
  }
};

/**
 * Obtener grupos donde la persona es miembro
 * GET /api/grupos/miembro/:personaId
 */
const getGruposPorMiembro = async (personaId: number): Promise<GrupoFamiliar[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/grupos/miembro/${personaId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      return result.data.map(mapGrupoFromBackend);
    }

    return [];
  } catch (error) {
    console.error(`Error fetching grupos by miembro ${personaId}:`, error);
    throw error;
  }
};

/**
 * Búsqueda avanzada de grupos
 * GET /api/grupos/search?q=familia&activo=true
 */
const buscarGrupos = async (query: string, filtros?: Omit<FiltrosGrupos, 'busqueda'>): Promise<GrupoFamiliar[]> => {
  try {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filtros?.activo !== undefined) params.append('activo', filtros.activo.toString());
    if (filtros?.conDescuento !== undefined) params.append('conDescuento', filtros.conDescuento.toString());
    if (filtros?.referenteId) params.append('referenteId', filtros.referenteId.toString());

    const response = await fetch(`${API_BASE_URL}/grupos/search?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      return result.data.map(mapGrupoFromBackend);
    }

    return [];
  } catch (error) {
    console.error('Error searching grupos:', error);
    throw error;
  }
};

/**
 * NUEVO: Obtener sugerencias de miembros basadas en relaciones familiares
 * GET /api/grupos/sugerir-miembros/:referenteId
 * @param referenteId ID de la persona referente
 * @param includeDetails Si true, incluye detalles completos de las personas (default: true)
 * @param includeParentesco Si true, incluye tipo de parentesco (default: true)
 * @returns Lista de personas sugeridas con relación familiar al referente
 */
const getSuggestedMembers = async (
  referenteId: number,
  includeDetails: boolean = true,
  includeParentesco: boolean = true
): Promise<SuggestedMembersResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('includeDetails', includeDetails.toString());
    params.append('includeParentesco', includeParentesco.toString());

    const response = await fetch(
      `${API_BASE_URL}/grupos/sugerir-miembros/${referenteId}?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    }

    // Retornar respuesta vacía si no hay datos
    return {
      referenteId,
      referente: { id: referenteId, nombre: '', apellido: '' },
      totalSugerencias: 0,
      suggestedMembersIds: [],
      suggestedPersons: [],
      familyTreeSummary: {
        totalRelacionesDirectas: 0,
        totalRelacionesInversas: 0,
        totalRelaciones: 0,
      },
    };
  } catch (error) {
    console.error(`Error fetching suggested members for referente ${referenteId}:`, error);
    throw error;
  }
};

// ============================================================================
// API FUNCTIONS - Gestión de Miembros
// ============================================================================

/**
 * Agregar miembro a un grupo
 * POST /api/grupos/:id/miembros
 * @param grupoId ID del grupo
 * @param request Datos del miembro y opciones de validación
 * @returns Response con grupo actualizado y warnings opcionales
 */
const agregarMiembro = async (
  grupoId: number,
  request: AddMiembroRequest
): Promise<GrupoResponseWithWarnings> => {
  try {
    const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}/miembros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personaId: request.personaId,
        skipFamilyValidation: request.skipFamilyValidation || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      // Extraer grupo y warnings del resultado
      const grupoData = result.data.grupo || result.data;
      const warnings = result.data.warnings || [];

      return {
        grupo: mapGrupoFromBackend(grupoData),
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error(`Error adding miembro to grupo ${grupoId}:`, error);
    throw error;
  }
};

/**
 * Remover miembro de un grupo
 * DELETE /api/grupos/:id/miembros/:miembroId
 */
const removerMiembro = async (grupoId: number, miembroId: number): Promise<GrupoFamiliar> => {
  try {
    const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}/miembros/${miembroId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return mapGrupoFromBackend(result.data);
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error(`Error removing miembro ${miembroId} from grupo ${grupoId}:`, error);
    throw error;
  }
};

/**
 * Actualizar lista completa de miembros de un grupo
 * PUT /api/grupos/:id/miembros
 */
const actualizarMiembros = async (grupoId: number, miembrosIds: number[]): Promise<GrupoFamiliar> => {
  try {
    const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}/miembros`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ miembrosIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return mapGrupoFromBackend(result.data);
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error(`Error updating miembros for grupo ${grupoId}:`, error);
    throw error;
  }
};

// ============================================================================
// API FUNCTIONS - Estadísticas
// ============================================================================

/**
 * Obtener estadísticas de grupos familiares
 * GET /api/grupos/stats
 */
const getEstadisticasGrupos = async (): Promise<EstadisticasGrupos> => {
  try {
    const response = await fetch(`${API_BASE_URL}/grupos/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return mapEstadisticasFromBackend(result.data);
    }

    // Retornar estadísticas vacías si no hay datos
    return {
      totalGrupos: 0,
      gruposActivos: 0,
      gruposInactivos: 0,
      promedioMiembrosPorGrupo: 0,
      descuentoPromedioGrupal: 0,
      gruposConFacturacionConjunta: 0,
      gruposConDescuentoProgresivo: 0,
      totalPersonasEnGrupos: 0,
    };
  } catch (error) {
    console.error('Error fetching estadisticas grupos:', error);
    throw error;
  }
};

// ============================================================================
// EXPORT API Object
// ============================================================================

export const gruposApi = {
  // CRUD básico
  getGrupos,
  getGrupoById,
  crearGrupo,
  actualizarGrupo,
  eliminarGrupo,

  // Consultas especializadas
  getGruposPorReferente,
  getGruposPorMiembro,
  buscarGrupos,
  getSuggestedMembers, // NUEVO: Sugerencias basadas en relaciones familiares

  // Gestión de miembros
  agregarMiembro,
  removerMiembro,
  actualizarMiembros,

  // Estadísticas
  getEstadisticasGrupos,
};

export default gruposApi;
