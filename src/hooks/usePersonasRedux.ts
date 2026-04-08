import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  fetchCatalogosPersonas,
  fetchPersonas,
  fetchPersonaById,
  createPersona,
  updatePersona,
  deletePersona,
  setFilters,
  resetFilters,
  setSelectedPersona,
  clearError,
} from '../store/slices/personasSlice';
import type {
  PersonasQueryParams,
  CreatePersonaDTO,
  UpdatePersonaDTO,
} from '../types/persona.types';

/**
 * Hook para gestionar Personas V2 usando Redux
 * Alternativa al hook usePersonasV2 que usa estado local
 *
 * Ventajas de usar Redux:
 * - Estado global compartido entre componentes
 * - Cache automático de datos
 * - Mejor para aplicaciones grandes con múltiples vistas de personas
 *
 * @example
 * ```tsx
 * const { personas, loading, pagination, filters, updateFilters } = usePersonasWithRedux();
 * ```
 */
export const usePersonasWithRedux = () => {
  const dispatch = useAppDispatch();
  const {
    personas,
    loading,
    error,
    pagination,
    filters,
    selectedPersona,
    selectedPersonaLoading,
  } = useAppSelector((state) => state.personasV2);

  // Cargar personas automáticamente cuando cambian los filtros
  useEffect(() => {
    dispatch(fetchPersonas(filters));
  }, [dispatch, JSON.stringify(filters)]);

  const updateFilters = (newFilters: PersonasQueryParams) => {
    dispatch(setFilters(newFilters));
  };

  const resetAllFilters = () => {
    dispatch(resetFilters());
  };

  const selectPersona = (id: number) => {
    dispatch(fetchPersonaById(id));
  };

  const createPersona = async (data: CreatePersonaDTO) => {
    const result = await dispatch(createPersona(data));
    if (createPersona.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string);
  };

  const updatePersona = async (id: number, data: UpdatePersonaDTO) => {
    const result = await dispatch(updatePersona({ id, data }));
    if (updatePersona.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string);
  };

  const deletePersona = async (id: number) => {
    const result = await dispatch(deletePersona(id));
    if (deletePersona.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string);
  };

  const refetch = () => {
    dispatch(fetchPersonas(filters));
  };

  const clearErrors = () => {
    dispatch(clearError());
  };

  return {
    // Estado
    personas,
    loading,
    error,
    pagination,
    filters,
    selectedPersona,
    selectedPersonaLoading,

    // Acciones
    updateFilters,
    resetFilters: resetAllFilters,
    selectPersona,
    createPersona,
    updatePersona,
    deletePersona,
    refetch,
    clearErrors,
  };
};

/**
 * Hook para gestionar catálogos de Personas V2 usando Redux
 *
 * @example
 * ```tsx
 * const { catalogos, loading, error } = useCatalogosPersonasWithRedux();
 * ```
 */
export const useCatalogosPersonasWithRedux = () => {
  const dispatch = useAppDispatch();
  const { catalogos, catalogosLoading, catalogosError } = useAppSelector(
    (state) => state.personasV2
  );

  // Cargar catálogos automáticamente al montar el componente
  useEffect(() => {
    if (!catalogos) {
      dispatch(fetchCatalogosPersonas());
    }
  }, [dispatch, catalogos]);

  const refetch = () => {
    dispatch(fetchCatalogosPersonas());
  };

  return {
    catalogos,
    loading: catalogosLoading,
    error: catalogosError,
    refetch,
  };
};

/**
 * Hook para gestionar una persona específica usando Redux
 *
 * @example
 * ```tsx
 * const { persona, loading, error, loadPersona } = usePersonaWithRedux(123);
 * ```
 */
export const usePersonaWithRedux = (personaId?: number) => {
  const dispatch = useAppDispatch();
  const { selectedPersona, selectedPersonaLoading, error } = useAppSelector(
    (state) => state.personasV2
  );

  useEffect(() => {
    if (personaId) {
      dispatch(fetchPersonaById(personaId));
    }
  }, [dispatch, personaId]);

  const loadPersona = (id: number) => {
    dispatch(fetchPersonaById(id));
  };

  const clearSelection = () => {
    dispatch(setSelectedPersona(null));
  };

  return {
    persona: selectedPersona,
    loading: selectedPersonaLoading,
    error,
    loadPersona,
    clearSelection,
  };
};
