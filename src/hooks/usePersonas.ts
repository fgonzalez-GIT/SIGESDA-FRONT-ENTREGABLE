/**
 * Hooks personalizados para gestión de Personas V2
 * Sistema de múltiples tipos por persona con catálogos dinámicos
 */

import { useState, useEffect, useCallback, useTransition } from 'react';
import type {
  Persona,
  PersonasQueryParams,
  PersonasPaginatedResponse,
  CatalogosPersonas,
  CreatePersonaDTO,
  UpdatePersonaDTO,
  PersonaTipo,
  CreatePersonaTipoDTO,
  UpdatePersonaTipoDTO,
  Contacto,
  CreateContactoDTO,
  UpdateContactoDTO,
  EstadisticasTipos,
} from '../types/persona.types';
import personasApi from '../services/personasApi';

// ============================================================================
// HOOK: useCatalogosPersonas
// ============================================================================

interface UseCatalogosPersonasResult {
  catalogos: CatalogosPersonas | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para cargar los catálogos necesarios para el módulo Personas V2
 * Se debe llamar una sola vez al inicio del módulo
 *
 * @example
 * ```tsx
 * const { catalogos, loading } = useCatalogosPersonas();
 *
 * if (loading) return <div>Cargando catálogos...</div>;
 *
 * console.log(catalogos.tiposPersona);
 * console.log(catalogos.especialidadesDocentes);
 * console.log(catalogos.categoriasSocio);
 * console.log(catalogos.tiposContacto);
 * ```
 */
export const useCatalogosPersonas = (): UseCatalogosPersonasResult => {
  const [catalogos, setCatalogos] = useState<CatalogosPersonas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchCatalogos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.getCatalogos();

      // Actualizar estado con baja prioridad para no bloquear UI
      startTransition(() => {
        setCatalogos(response.data);
      });
    } catch (err) {
      // Error inesperado - getCatalogos() ya maneja 404s gracefully
      console.error('❌ Error crítico al cargar catálogos:', err);
      startTransition(() => {
        setCatalogos({
          tiposPersona: [],
          categoriasSocio: [],
          especialidadesDocentes: [],
          tiposContacto: [],
          razonesSociales: [],
        });
      });
      setError(err instanceof Error ? err.message : 'Error al cargar catálogos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogos();
  }, [fetchCatalogos]);

  return { catalogos, loading, error, refetch: fetchCatalogos };
};

// ============================================================================
// HOOK: usePersonas
// ============================================================================

interface UsePersonasResult {
  personas: Persona[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  loading: boolean;
  error: string | null;
  fetchPersonas: (params?: PersonasQueryParams) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para listar personas con filtros y paginación
 *
 * @example
 * ```tsx
 * const { personas, pagination, loading, fetchPersonas } = usePersonas({
 *   page: 1,
 *   limit: 20,
 *   tiposCodigos: ['SOCIO', 'DOCENTE'],
 *   estado: 'ACTIVO',
 *   includeTipos: true,
 *   includeContactos: true
 * });
 *
 * // Cambiar página
 * fetchPersonas({ page: 2 });
 *
 * // Filtrar por tipo
 * fetchPersonas({ tiposCodigos: ['SOCIO'] });
 * ```
 */
export const usePersonas = (initialParams?: PersonasQueryParams): UsePersonasResult => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<PersonasQueryParams | undefined>(initialParams);

  const fetchPersonas = useCallback(async (params?: PersonasQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const mergedParams = { ...currentParams, ...params };
      setCurrentParams(mergedParams);

      const response = await personasApi.getAll(mergedParams);
      setPersonas(response.data);
      if (response.meta) {
        // Mapear 'meta' del backend a estructura de paginación local
        setPagination({
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
          pages: response.meta.totalPages, // Backend usa 'totalPages', frontend usa 'pages'
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar personas');
      console.error('Error cargando personas:', err);
    } finally {
      setLoading(false);
    }
  }, [currentParams]);

  const refetch = useCallback(() => fetchPersonas(currentParams), [fetchPersonas, currentParams]);

  useEffect(() => {
    fetchPersonas();
  }, []);

  return { personas, pagination, loading, error, fetchPersonas, refetch };
};

// ============================================================================
// HOOK: usePersona
// ============================================================================

interface UsePersonaResult {
  persona: Persona | null;
  loading: boolean;
  error: string | null;
  fetchPersona: (id: number, includeRelaciones?: boolean) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener una persona por ID
 *
 * @example
 * ```tsx
 * const { persona, loading, refetch } = usePersona(personaId);
 *
 * if (loading) return <div>Cargando...</div>;
 *
 * console.log(persona.tipos); // Array de tipos asignados
 * console.log(persona.contactos); // Array de contactos
 * ```
 */
export const usePersona = (id?: number, includeRelaciones: boolean = true): UsePersonaResult => {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<number | undefined>(id);

  const fetchPersona = useCallback(async (personaId: number, includeRel: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentId(personaId);

      const response = await personasApi.getById(personaId, includeRel);
      setPersona(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar persona');
      console.error('Error cargando persona:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (currentId) {
      return fetchPersona(currentId, includeRelaciones);
    }
    return Promise.resolve();
  }, [currentId, includeRelaciones, fetchPersona]);

  useEffect(() => {
    if (id) {
      fetchPersona(id, includeRelaciones);
    }
  }, [id, includeRelaciones]);

  return { persona, loading, error, fetchPersona, refetch };
};

// ============================================================================
// HOOK: usePersonaTipos
// ============================================================================

interface UsePersonaTiposResult {
  tipos: PersonaTipo[];
  loading: boolean;
  error: string | null;
  asignarTipo: (tipo: CreatePersonaTipoDTO) => Promise<PersonaTipo | null>;
  actualizarTipo: (tipoId: number, data: UpdatePersonaTipoDTO) => Promise<PersonaTipo | null>;
  desasignarTipo: (tipoId: number) => Promise<boolean>;
  toggleTipo: (tipoId: number) => Promise<PersonaTipo | null>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gestionar los tipos asignados a una persona
 *
 * @example
 * ```tsx
 * const { tipos, asignarTipo, desasignarTipo, loading } = usePersonaTipos(personaId);
 *
 * // Asignar tipo SOCIO
 * await asignarTipo({
 *   tipoPersonaCodigo: 'SOCIO',
 *   categoriaId: 'cat_123'
 * });
 *
 * // Desasignar un tipo
 * await desasignarTipo(tipoId);
 * ```
 */
export const usePersonaTipos = (personaId?: number): UsePersonaTiposResult => {
  const [tipos, setTipos] = useState<PersonaTipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPersonaId, setCurrentPersonaId] = useState<number | undefined>(personaId);

  const fetchTipos = useCallback(async () => {
    if (!currentPersonaId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.getTipos(currentPersonaId);
      setTipos(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tipos');
      console.error('Error cargando tipos:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPersonaId]);

  const asignarTipo = useCallback(async (tipo: CreatePersonaTipoDTO): Promise<PersonaTipo | null> => {
    if (!currentPersonaId) return null;

    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.asignarTipo(currentPersonaId, tipo);
      await fetchTipos(); // Refrescar lista
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar tipo');
      console.error('Error asignando tipo:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPersonaId, fetchTipos]);

  const actualizarTipo = useCallback(async (
    tipoId: number,
    data: UpdatePersonaTipoDTO
  ): Promise<PersonaTipo | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.actualizarTipo(tipoId, data);
      await fetchTipos(); // Refrescar lista
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tipo');
      console.error('Error actualizando tipo:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTipos]);

  const desasignarTipo = useCallback(async (tipoId: number): Promise<boolean> => {
    if (!currentPersonaId) return false;

    try {
      setLoading(true);
      setError(null);
      await personasApi.desasignarTipo(currentPersonaId, tipoId);
      await fetchTipos(); // Refrescar lista
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desasignar tipo');
      console.error('Error desasignando tipo:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentPersonaId, fetchTipos]);

  const toggleTipo = useCallback(async (tipoId: number): Promise<PersonaTipo | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.toggleTipo(tipoId);
      await fetchTipos(); // Refrescar lista
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado del tipo');
      console.error('Error cambiando estado del tipo:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTipos]);

  useEffect(() => {
    if (personaId) {
      setCurrentPersonaId(personaId);
      fetchTipos();
    }
  }, [personaId]);

  return {
    tipos,
    loading,
    error,
    asignarTipo,
    actualizarTipo,
    desasignarTipo,
    toggleTipo,
    refetch: fetchTipos,
  };
};

// ============================================================================
// HOOK: usePersonaContactos
// ============================================================================

interface UsePersonaContactosResult {
  contactos: Contacto[];
  loading: boolean;
  error: string | null;
  addContacto: (contacto: CreateContactoDTO) => Promise<Contacto | null>;
  updateContacto: (contactoId: number, data: UpdateContactoDTO) => Promise<Contacto | null>;
  deleteContacto: (contactoId: number) => Promise<boolean>;
  setPrincipal: (contactoId: number) => Promise<Contacto | null>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gestionar los contactos de una persona
 *
 * @example
 * ```tsx
 * const { contactos, addContacto, deleteContacto, loading } = usePersonaContactos(personaId);
 *
 * // Agregar contacto
 * await addContacto({
 *   tipoContactoId: 1,
 *   valor: '+54911123456',
 *   descripcion: 'WhatsApp personal',
 *   principal: true
 * });
 *
 * // Eliminar contacto
 * await deleteContacto(contactoId);
 * ```
 */
export const usePersonaContactos = (personaId?: number): UsePersonaContactosResult => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPersonaId, setCurrentPersonaId] = useState<number | undefined>(personaId);

  const fetchContactos = useCallback(async () => {
    if (!currentPersonaId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.getContactos(currentPersonaId);
      setContactos(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar contactos');
      console.error('Error cargando contactos:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPersonaId]);

  const addContacto = useCallback(async (contacto: CreateContactoDTO): Promise<Contacto | null> => {
    if (!currentPersonaId) return null;

    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.addContacto(currentPersonaId, contacto);
      await fetchContactos(); // Refrescar lista
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar contacto');
      console.error('Error agregando contacto:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPersonaId, fetchContactos]);

  const updateContacto = useCallback(async (
    contactoId: number,
    data: UpdateContactoDTO
  ): Promise<Contacto | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.updateContacto(contactoId, data);
      await fetchContactos(); // Refrescar lista
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar contacto');
      console.error('Error actualizando contacto:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchContactos]);

  const deleteContacto = useCallback(async (contactoId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await personasApi.deleteContacto(contactoId);
      await fetchContactos(); // Refrescar lista
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar contacto');
      console.error('Error eliminando contacto:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchContactos]);

  const setPrincipal = useCallback(async (contactoId: number): Promise<Contacto | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.setPrincipal(contactoId);
      await fetchContactos(); // Refrescar lista
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al establecer contacto principal');
      console.error('Error estableciendo contacto principal:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchContactos]);

  useEffect(() => {
    if (personaId) {
      setCurrentPersonaId(personaId);
      fetchContactos();
    }
  }, [personaId]);

  return {
    contactos,
    loading,
    error,
    addContacto,
    updateContacto,
    deleteContacto,
    setPrincipal,
    refetch: fetchContactos,
  };
};

// ============================================================================
// HOOK: useEstadisticasTipos
// ============================================================================

interface UseEstadisticasTiposResult {
  estadisticas: EstadisticasTipos[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener estadísticas de tipos de persona
 *
 * @example
 * ```tsx
 * const { estadisticas, loading } = useEstadisticasTipos();
 *
 * estadisticas.forEach(stat => {
 *   console.log(`${stat.tipoPersona.nombre}: ${stat.totalPersonas} personas (${stat.porcentaje}%)`);
 * });
 * ```
 */
export const useEstadisticasTipos = (): UseEstadisticasTiposResult => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasTipos[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await personasApi.getEstadisticasTipos();
      setEstadisticas(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstadisticas();
  }, [fetchEstadisticas]);

  return { estadisticas, loading, error, refetch: fetchEstadisticas };
};
