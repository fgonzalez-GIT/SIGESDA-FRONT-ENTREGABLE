/**
 * API Service para Familiares - Conectado con Backend Real
 *
 * Mapea los campos entre frontend y backend:
 * Frontend -> Backend
 * - personaId -> socioId
 * - responsableFinanciero -> permisoResponsableFinanciero
 * - contactoEmergencia -> permisoContactoEmergencia
 * - autorizadoRetiro -> permisoAutorizadoRetiro
 * - porcentajeDescuento -> descuento
 * - tipoRelacion (minúsculas) -> parentesco (mayúsculas)
 */

import { RelacionFamiliar, CrearRelacionRequest } from '../store/slices/familiaresSlice';

// Usar la variable de entorno que apunta al proxy de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Mapeo de tipos de relación: frontend (minúsculas) -> backend (mayúsculas)
// IMPORTANTE: Incluye HIJO y HIJA para correcta determinación de género en relaciones inversas
const tipoRelacionMap: Record<string, string> = {
  'padre': 'PADRE',
  'madre': 'MADRE',
  'hijo': 'HIJO',     // ✓ Género masculino
  'hija': 'HIJA',     // ✓ Género femenino
  'conyuge': 'CONYUGE',
  'esposo': 'ESPOSO',
  'esposa': 'ESPOSA',
  'hermano': 'HERMANO',
  'hermana': 'HERMANA',
  'abuelo': 'ABUELO',
  'abuela': 'ABUELA',
  'nieto': 'NIETO',   // ✓ Género masculino
  'nieta': 'NIETA',   // ✓ Género femenino
  'tio': 'TIO',
  'tia': 'TIA',
  'sobrino': 'SOBRINO',  // ✓ Género masculino
  'sobrina': 'SOBRINA',  // ✓ Género femenino
  'primo': 'PRIMO',
  'prima': 'PRIMA',
  'otro': 'OTRO',
};

// Mapeo inverso: backend -> frontend
// IMPORTANTE: Cada género tiene su propio mapeo para preservar información de género
const parentescoToTipoRelacion: Record<string, RelacionFamiliar['tipoRelacion']> = {
  'PADRE': 'padre',
  'MADRE': 'madre',
  'HIJO': 'hijo',     // ✓ Preserva género masculino
  'HIJA': 'hija',     // ✓ Preserva género femenino
  'CONYUGE': 'conyuge', // Mapeo directo y de género neutro
  'ESPOSO': 'esposo',
  'ESPOSA': 'esposa',
  'HERMANO': 'hermano',
  'HERMANA': 'hermana',
  'ABUELO': 'abuelo',
  'ABUELA': 'abuela',
  'NIETO': 'nieto',   // ✓ Preserva género masculino
  'NIETA': 'nieta',   // ✓ Preserva género femenino
  'TIO': 'tio',
  'TIA': 'tia',
  'SOBRINO': 'sobrino',  // ✓ Preserva género masculino
  'SOBRINA': 'sobrina',  // ✓ Preserva género femenino
  'PRIMO': 'primo',
  'PRIMA': 'prima',
  'OTRO': 'otro',
};

// Mapear request de frontend a backend
const mapRequestToBackend = (request: CrearRelacionRequest) => {
  return {
    socioId: request.personaId,
    familiarId: request.familiarId,
    parentesco: tipoRelacionMap[request.tipoRelacion] || 'OTRO',
    descripcion: request.descripcion || '',
    permisoResponsableFinanciero: request.responsableFinanciero || false,
    permisoContactoEmergencia: request.contactoEmergencia || false,
    permisoAutorizadoRetiro: request.autorizadoRetiro || false,
    descuento: request.porcentajeDescuento || 0,
    activo: true,
    grupoFamiliarId: null,
  };
};

// Mapear respuesta de backend a frontend
const mapRelacionFromBackend = (backendRelacion: any): any => {
  return {
    id: backendRelacion.id,
    personaId: backendRelacion.socioId,
    familiarId: backendRelacion.familiarId,
    tipoRelacion: parentescoToTipoRelacion[backendRelacion.parentesco] || 'otro',
    descripcion: backendRelacion.descripcion,
    fechaCreacion: backendRelacion.createdAt,
    activo: backendRelacion.activo,
    responsableFinanciero: backendRelacion.permisoResponsableFinanciero,
    autorizadoRetiro: backendRelacion.permisoAutorizadoRetiro,
    contactoEmergencia: backendRelacion.permisoContactoEmergencia,
    porcentajeDescuento: parseFloat(backendRelacion.descuento) || 0,
    // Datos del familiar si están disponibles
    familiar: backendRelacion.familiar ? {
      id: backendRelacion.familiar.id,
      nombre: backendRelacion.familiar.nombre,
      apellido: backendRelacion.familiar.apellido,
      tipo: 'socio', // Por ahora todos son socios según el backend
    } : undefined,
  };
};

export const familiaresApiReal = {
  // Obtener familiares de un socio
  getRelacionesDePersona: async (personaId: number): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/familiares/socio/${personaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // El backend retorna: { success: true, data: [...], meta: {...} }
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(mapRelacionFromBackend);
      }

      return [];
    } catch (error) {
      console.error('Error fetching relaciones de persona:', error);
      throw error;
    }
  },

  // Crear nueva relación
  crearRelacion: async (request: CrearRelacionRequest): Promise<any> => {
    try {
      const backendRequest = mapRequestToBackend(request);

      const response = await fetch(`${API_BASE_URL}/familiares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error response:', errorData);

        // Intentar extraer un mensaje más específico si existe
        let errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;

        // Caso específico: Relación duplicada (el backend a veces lo devuelve en el stack o en un formato anidado)
        if (errorData.stack && errorData.stack.includes('Ya existe una relación familiar')) {
          errorMessage = 'Ya existe una relación familiar entre estas dos personas.';
        } else if (errorMessage === 'Internal Server Error' && errorData.stack) {
          // Intentar buscar mensajes conocidos en el stack trace si el mensaje principal es genérico
          if (errorData.stack.includes('Unique constraint failed')) {
            errorMessage = 'Ya existe este registro en la base de datos.';
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Backend success response:', result);

      // El backend retorna: { success: true, message: "...", data: {...} }
      if (result.success && result.data) {
        return mapRelacionFromBackend(result.data);
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Error creating relacion:', error);
      console.error('Request was:', mapRequestToBackend(request));
      throw error;
    }
  },

  // Actualizar relación
  actualizarRelacion: async (id: number, relacion: Partial<RelacionFamiliar>): Promise<any> => {
    try {
      const backendUpdate: any = {};

      // Mapear solo los campos que están presentes
      if (relacion.tipoRelacion) {
        backendUpdate.parentesco = tipoRelacionMap[relacion.tipoRelacion];
      }
      if (relacion.descripcion !== undefined) {
        backendUpdate.descripcion = relacion.descripcion;
      }
      if (relacion.responsableFinanciero !== undefined) {
        backendUpdate.permisoResponsableFinanciero = relacion.responsableFinanciero;
      }
      if (relacion.contactoEmergencia !== undefined) {
        backendUpdate.permisoContactoEmergencia = relacion.contactoEmergencia;
      }
      if (relacion.autorizadoRetiro !== undefined) {
        backendUpdate.permisoAutorizadoRetiro = relacion.autorizadoRetiro;
      }
      if (relacion.porcentajeDescuento !== undefined) {
        backendUpdate.descuento = relacion.porcentajeDescuento;
      }

      const response = await fetch(`${API_BASE_URL}/familiares/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Intentar extraer un mensaje más específico si existe
        let errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;

        // Buscamos mensajes en el stack si es un error genérico
        if (errorMessage === 'Internal Server Error' && errorData.stack) {
          if (errorData.stack.includes('Unique constraint failed')) {
            errorMessage = 'Ya existe este registro en la base de datos.';
          } else if (errorData.stack.includes('Ya existe una relación familiar')) {
            errorMessage = 'Ya existe una relación familiar con estos datos.';
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return mapRelacionFromBackend(result.data);
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Error updating relacion:', error);
      throw error;
    }
  },

  // Eliminar relación
  eliminarRelacion: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/familiares/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Eliminación exitosa
    } catch (error) {
      console.error('Error deleting relacion:', error);
      throw error;
    }
  },

  // Obtener todas las personas con familiares (para compatibilidad)
  getPersonasConFamiliares: async (): Promise<any[]> => {
    // Por ahora retornar array vacío ya que este endpoint no está implementado en el backend
    // Se puede implementar más adelante si es necesario
    return [];
  },

  // FASE 2: Obtener TODAS las relaciones familiares (con filtros opcionales)
  getAllRelaciones: async (filters?: {
    page?: number;
    limit?: number;
    soloActivos?: boolean;
    socioId?: number;
    parentesco?: string;
  }): Promise<{ data: any[]; total: number; pages: number }> => {
    try {
      // Construir query string
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.soloActivos !== undefined) params.append('soloActivos', filters.soloActivos.toString());
      if (filters?.socioId) params.append('socioId', filters.socioId.toString());
      if (filters?.parentesco) params.append('parentesco', tipoRelacionMap[filters.parentesco] || filters.parentesco);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/familiares${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // El backend retorna: { success: true, data: [...], meta: { total, page, limit } }
      if (result.success && Array.isArray(result.data)) {
        return {
          data: result.data.map(mapRelacionFromBackend),
          total: result.meta?.total || result.data.length,
          pages: result.meta?.pages || 1,
        };
      }

      return { data: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('Error fetching all relaciones:', error);
      throw error;
    }
  },

  // Obtener estadísticas de parentesco
  getEstadisticasParentesco: async (): Promise<Array<{ parentesco: string; count: number }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/familiares/stats/parentesco`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Mapear parentesco de backend a frontend
        return result.data.map((stat: any) => ({
          parentesco: parentescoToTipoRelacion[stat.parentesco] || stat.parentesco,
          count: stat.count || stat._count,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching estadisticas parentesco:', error);
      throw error;
    }
  },
};

export default familiaresApiReal;
