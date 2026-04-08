/**
 * Provider de Catálogos para Actividades V2 + Reservas
 * Carga los catálogos una vez al inicio y los hace disponibles globalmente
 */

import React, { createContext, useContext, useEffect, useState, useRef, startTransition } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useCatalogos } from '../hooks/useActividades';
import estadosReservasApi from '../services/estadosReservasApi';
import type { TipoActividad, CategoriaActividad, EstadoActividad, DiaSemana, RolDocente } from '../types/actividad.types';
import type { EstadoReserva } from '../types/reserva.types';

interface Catalogos {
  tiposActividades: TipoActividad[];
  categoriasActividades: CategoriaActividad[];
  estadosActividades: EstadoActividad[];
  diasSemana: DiaSemana[];
  rolesDocentes: RolDocente[];
  estadosReservas: EstadoReserva[]; // NUEVO
}

interface CatalogosContextType {
  catalogos: Catalogos | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CatalogosContext = createContext<CatalogosContextType | null>(null);

interface CatalogosProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que carga los catálogos al inicio de la aplicación
 * y los hace disponibles para todos los componentes
 */
export const CatalogosProvider: React.FC<CatalogosProviderProps> = ({ children }) => {
  const { catalogos, loading: loadingActividades, error: errorActividades, refetch: refetchActividades } = useCatalogos();
  const [estadosReservas, setEstadosReservas] = useState<EstadoReserva[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [errorReservas, setErrorReservas] = useState<string | null>(null);
  const hasFetchedReservasRef = useRef(false);

  // Cargar estados de reservas al montar
  useEffect(() => {
    // Protección contra llamadas duplicadas en React.StrictMode
    if (hasFetchedReservasRef.current) return;
    hasFetchedReservasRef.current = true;

    const loadEstadosReservas = async () => {
      try {
        setLoadingReservas(true);
        const estados = await estadosReservasApi.getAll({
          activo: true,
          orderBy: 'orden',
          orderDir: 'asc'
        });

        // Usar startTransition para actualizaciones no urgentes
        startTransition(() => {
          setEstadosReservas(estados);
          setErrorReservas(null);
        });

        console.log('✅ Estados de reservas cargados:', estados.length);
      } catch (err: any) {
        console.error('❌ Error al cargar estados de reservas:', err);
        setErrorReservas(err.response?.data?.message || 'Error al cargar estados de reservas');
      } finally {
        setLoadingReservas(false);
      }
    };

    loadEstadosReservas();
  }, []);

  // Función para recargar ambos catálogos
  const refetch = async () => {
    await refetchActividades();
    setLoadingReservas(true);
    try {
      const estados = await estadosReservasApi.getAll({
        activo: true,
        orderBy: 'orden',
        orderDir: 'asc'
      });
      setEstadosReservas(estados);
      setErrorReservas(null);
    } catch (err: any) {
      setErrorReservas(err.response?.data?.message || 'Error al cargar estados de reservas');
    } finally {
      setLoadingReservas(false);
    }
  };

  // Combinar loading y error
  const loading = loadingActividades || loadingReservas;
  const error = errorActividades || errorReservas;

  // ✅ FIX: Remover filtro de IDs 1-7 para soportar cualquier ID del backend
  // Los componentes ahora usan el objeto diaSemana que viene del backend directamente
  // en lugar de buscar en este catálogo, así que no importa si los IDs son 15-21
  const catalogosFiltrados = React.useMemo(() => {
    if (!catalogos) return null;

    // Simplemente ordenar por orden (Lunes=1, Domingo=7) sin filtrar
    const diasOrdenados = [...catalogos.diasSemana].sort((a, b) => a.orden - b.orden);

    // Validación solo en desarrollo
    if (process.env.NODE_ENV === 'development' && catalogos.diasSemana.length > 0) {
      console.log(`📅 Días de semana cargados: ${diasOrdenados.length}`, {
        ids: diasOrdenados.map(d => d.id),
        ordenes: diasOrdenados.map(d => d.orden),
        nombres: diasOrdenados.map(d => d.nombre),
      });
    }

    return {
      ...catalogos,
      diasSemana: diasOrdenados,
      estadosReservas, // AGREGAR estados de reservas
    };
  }, [catalogos, estadosReservas]);

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={60} />
        <Box>Cargando catálogos del sistema...</Box>
      </Box>
    );
  }

  // Mostrar error si falla la carga
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={3}
      >
        <Alert
          severity="error"
          action={
            <button onClick={() => refetch()}>
              Reintentar
            </button>
          }
        >
          Error al cargar catálogos: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <CatalogosContext.Provider value={{ catalogos: catalogosFiltrados, loading, error, refetch }}>
      {children}
    </CatalogosContext.Provider>
  );
};

/**
 * Hook para usar los catálogos en cualquier componente
 *
 * @example
 * ```tsx
 * const { catalogos } = useCatalogosContext();
 *
 * return (
 *   <select>
 *     {catalogos?.tipos.map(tipo => (
 *       <option key={tipo.id} value={tipo.id}>
 *         {tipo.nombre}
 *       </option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export const useCatalogosContext = (): CatalogosContextType => {
  const context = useContext(CatalogosContext);

  if (!context) {
    throw new Error('useCatalogosContext debe ser usado dentro de un CatalogosProvider');
  }

  return context;
};

export default CatalogosProvider;
