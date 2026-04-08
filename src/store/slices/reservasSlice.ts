import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import reservasApi from '../../services/reservasApi';
import type {
  Reserva,
  CreateReservaDto,
  UpdateReservaDto,
  ReservasQueryParams,
  AprobarReservaDto,
  RechazarReservaDto,
  CancelarReservaDto,
  DetectarConflictosDto,
  ConflictosResponse,
  ConflictosAllResponse,
  DisponibilidadQueryParams,
  DisponibilidadResponse,
  BusquedaAvanzadaParams,
  EstadisticasReservasParams,
  EstadisticasReservasResponse,
  DashboardResponse,
  CreateReservasMasivasDto,
  ReservasMasivasResponse,
  DeleteReservasMasivasDto,
  CreateReservasRecurrentesDto,
} from '@/types/reserva.types';
import { PaginatedResponse } from '@/services/api';

/**
 * Redux Slice para Reservas de Aulas
 *
 * Maneja todo el ciclo de vida de las reservas:
 * - CRUD básico
 * - Workflow de estados (aprobar, rechazar, cancelar, completar)
 * - Consultas especiales (próximas, actuales, búsqueda)
 * - Detección de conflictos
 * - Operaciones masivas
 */

interface ReservasState {
  reservas: Reserva[];
  proximasReservas: Reserva[];
  reservasActuales: Reserva[];
  dashboard: DashboardResponse | null;
  estadisticas: EstadisticasReservasResponse[];
  conflictos: ConflictosResponse | ConflictosAllResponse | null;
  disponibilidad: DisponibilidadResponse | null;
  loading: boolean;
  error: string | null;
  selectedReserva: Reserva | null;
  filters: ReservasQueryParams;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ReservasState = {
  reservas: [],
  proximasReservas: [],
  reservasActuales: [],
  dashboard: null,
  estadisticas: [],
  conflictos: null,
  disponibilidad: null,
  loading: false,
  error: null,
  selectedReserva: null,
  filters: {
    soloActivas: true,
    incluirPasadas: false,
    page: 1,
    limit: 10,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// ==================== CRUD BÁSICO ====================

export const fetchReservas = createAsyncThunk(
  'reservas/fetchReservas',
  async (params?: ReservasQueryParams, { rejectWithValue }) => {
    try {
      return await reservasApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar reservas');
    }
  }
);

export const fetchReservaById = createAsyncThunk(
  'reservas/fetchReservaById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await reservasApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar reserva');
    }
  }
);

export const createReserva = createAsyncThunk(
  'reservas/createReserva',
  async (data: CreateReservaDto, { rejectWithValue }) => {
    try {
      return await reservasApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear reserva');
    }
  }
);

export const updateReserva = createAsyncThunk(
  'reservas/updateReserva',
  async ({ id, data }: { id: number; data: UpdateReservaDto }, { rejectWithValue }) => {
    try {
      return await reservasApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar reserva');
    }
  }
);

export const deleteReserva = createAsyncThunk(
  'reservas/deleteReserva',
  async (id: number, { rejectWithValue }) => {
    try {
      await reservasApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar reserva');
    }
  }
);

// ==================== CONSULTAS POR ENTIDAD ====================

export const fetchReservasByAula = createAsyncThunk(
  'reservas/fetchReservasByAula',
  async ({ aulaId, incluirPasadas }: { aulaId: number; incluirPasadas?: boolean }, { rejectWithValue }) => {
    try {
      return await reservasApi.getByAula(aulaId, incluirPasadas);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar reservas del aula');
    }
  }
);

export const fetchReservasByDocente = createAsyncThunk(
  'reservas/fetchReservasByDocente',
  async ({ docenteId, incluirPasadas }: { docenteId: number; incluirPasadas?: boolean }, { rejectWithValue }) => {
    try {
      return await reservasApi.getByDocente(docenteId, incluirPasadas);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar reservas del docente');
    }
  }
);

export const fetchReservasByActividad = createAsyncThunk(
  'reservas/fetchReservasByActividad',
  async ({ actividadId, incluirPasadas }: { actividadId: number; incluirPasadas?: boolean }, { rejectWithValue }) => {
    try {
      return await reservasApi.getByActividad(actividadId, incluirPasadas);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar reservas de la actividad');
    }
  }
);

// ==================== WORKFLOW DE ESTADOS ====================

export const aprobarReserva = createAsyncThunk(
  'reservas/aprobarReserva',
  async ({ id, data }: { id: number; data: AprobarReservaDto }, { rejectWithValue }) => {
    try {
      return await reservasApi.aprobar(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al aprobar reserva');
    }
  }
);

export const rechazarReserva = createAsyncThunk(
  'reservas/rechazarReserva',
  async ({ id, data }: { id: number; data: RechazarReservaDto }, { rejectWithValue }) => {
    try {
      return await reservasApi.rechazar(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al rechazar reserva');
    }
  }
);

export const cancelarReserva = createAsyncThunk(
  'reservas/cancelarReserva',
  async ({ id, data }: { id: number; data: CancelarReservaDto }, { rejectWithValue }) => {
    try {
      return await reservasApi.cancelar(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cancelar reserva');
    }
  }
);

export const completarReserva = createAsyncThunk(
  'reservas/completarReserva',
  async (id: number, { rejectWithValue }) => {
    try {
      return await reservasApi.completar(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al completar reserva');
    }
  }
);

// ==================== DETECCIÓN DE CONFLICTOS ====================

export const detectarConflictos = createAsyncThunk(
  'reservas/detectarConflictos',
  async (data: DetectarConflictosDto, { rejectWithValue }) => {
    try {
      return await reservasApi.detectarConflictos(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al detectar conflictos');
    }
  }
);

export const detectarConflictosAll = createAsyncThunk(
  'reservas/detectarConflictosAll',
  async (data: DetectarConflictosDto, { rejectWithValue }) => {
    try {
      return await reservasApi.detectarConflictosAll(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al detectar todos los conflictos');
    }
  }
);

export const checkDisponibilidad = createAsyncThunk(
  'reservas/checkDisponibilidad',
  async (params: DisponibilidadQueryParams, { rejectWithValue }) => {
    try {
      return await reservasApi.checkDisponibilidad(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al verificar disponibilidad');
    }
  }
);

// ==================== CONSULTAS ESPECIALES ====================

export const fetchProximasReservas = createAsyncThunk(
  'reservas/fetchProximasReservas',
  async (limit = 10, { rejectWithValue }) => {
    try {
      return await reservasApi.getProximas(limit);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar próximas reservas');
    }
  }
);

export const fetchReservasActuales = createAsyncThunk(
  'reservas/fetchReservasActuales',
  async (_, { rejectWithValue }) => {
    try {
      return await reservasApi.getActuales();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar reservas actuales');
    }
  }
);

export const searchReservasAvanzada = createAsyncThunk(
  'reservas/searchReservasAvanzada',
  async (params: BusquedaAvanzadaParams, { rejectWithValue }) => {
    try {
      return await reservasApi.searchAvanzada(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error en búsqueda avanzada');
    }
  }
);

export const fetchEstadisticasReservas = createAsyncThunk(
  'reservas/fetchEstadisticasReservas',
  async (params: EstadisticasReservasParams, { rejectWithValue }) => {
    try {
      return await reservasApi.getEstadisticas(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estadísticas');
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  'reservas/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      return await reservasApi.getDashboard();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar dashboard');
    }
  }
);

// ==================== OPERACIONES MASIVAS ====================

export const createReservasMasivas = createAsyncThunk(
  'reservas/createReservasMasivas',
  async (data: CreateReservasMasivasDto, { rejectWithValue }) => {
    try {
      return await reservasApi.createMasivas(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear reservas masivas');
    }
  }
);

export const deleteReservasMasivas = createAsyncThunk(
  'reservas/deleteReservasMasivas',
  async (data: DeleteReservasMasivasDto, { rejectWithValue }) => {
    try {
      return await reservasApi.deleteMasivas(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar reservas masivas');
    }
  }
);

export const createReservasRecurrentes = createAsyncThunk(
  'reservas/createReservasRecurrentes',
  async (data: CreateReservasRecurrentesDto, { rejectWithValue }) => {
    try {
      return await reservasApi.createRecurrentes(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear reservas recurrentes');
    }
  }
);

// ==================== SLICE ====================

const reservasSlice = createSlice({
  name: 'reservas',
  initialState,
  reducers: {
    setSelectedReserva: (state, action: PayloadAction<Reserva | null>) => {
      state.selectedReserva = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearConflictos: (state) => {
      state.conflictos = null;
    },
    clearDisponibilidad: (state) => {
      state.disponibilidad = null;
    },
    setFilters: (state, action: PayloadAction<Partial<ReservasQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        soloActivas: true,
        incluirPasadas: false,
        page: 1,
        limit: 10,
      };
    },
    clearReservas: (state) => {
      state.reservas = [];
      state.proximasReservas = [];
      state.reservasActuales = [];
      state.selectedReserva = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reservas
      .addCase(fetchReservas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservas.fulfilled, (state, action) => {
        state.loading = false;
        state.reservas = action.payload.data || [];
        if (action.payload.meta) {
          state.pagination = action.payload.meta;
        }
      })
      .addCase(fetchReservas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch reserva by ID
      .addCase(fetchReservaById.fulfilled, (state, action) => {
        state.selectedReserva = action.payload;
      })
      // Create reserva
      .addCase(createReserva.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReserva.fulfilled, (state, action) => {
        state.loading = false;
        state.reservas.unshift(action.payload); // Agregar al inicio
      })
      .addCase(createReserva.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update reserva
      .addCase(updateReserva.fulfilled, (state, action) => {
        const index = state.reservas.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reservas[index] = action.payload;
        }
        if (state.selectedReserva?.id === action.payload.id) {
          state.selectedReserva = action.payload;
        }
      })
      // Delete reserva
      .addCase(deleteReserva.fulfilled, (state, action) => {
        state.reservas = state.reservas.filter((r) => r.id !== action.payload);
        if (state.selectedReserva?.id === action.payload) {
          state.selectedReserva = null;
        }
      })
      // Workflow actions - Aprobar, Rechazar, Cancelar, Completar
      .addCase(aprobarReserva.fulfilled, (state, action) => {
        const index = state.reservas.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reservas[index] = action.payload;
        }
        if (state.selectedReserva?.id === action.payload.id) {
          state.selectedReserva = action.payload;
        }
      })
      .addCase(rechazarReserva.fulfilled, (state, action) => {
        const index = state.reservas.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reservas[index] = action.payload;
        }
        if (state.selectedReserva?.id === action.payload.id) {
          state.selectedReserva = action.payload;
        }
      })
      .addCase(cancelarReserva.fulfilled, (state, action) => {
        const index = state.reservas.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reservas[index] = action.payload;
        }
        if (state.selectedReserva?.id === action.payload.id) {
          state.selectedReserva = action.payload;
        }
      })
      .addCase(completarReserva.fulfilled, (state, action) => {
        const index = state.reservas.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reservas[index] = action.payload;
        }
        if (state.selectedReserva?.id === action.payload.id) {
          state.selectedReserva = action.payload;
        }
      })
      // Conflictos
      .addCase(detectarConflictos.fulfilled, (state, action) => {
        state.conflictos = action.payload;
      })
      .addCase(detectarConflictosAll.fulfilled, (state, action) => {
        state.conflictos = action.payload;
      })
      .addCase(checkDisponibilidad.fulfilled, (state, action) => {
        state.disponibilidad = action.payload;
      })
      // Consultas especiales
      .addCase(fetchProximasReservas.fulfilled, (state, action) => {
        state.proximasReservas = action.payload;
      })
      .addCase(fetchReservasActuales.fulfilled, (state, action) => {
        state.reservasActuales = action.payload;
      })
      .addCase(searchReservasAvanzada.fulfilled, (state, action) => {
        state.reservas = action.payload;
      })
      .addCase(fetchEstadisticasReservas.fulfilled, (state, action) => {
        state.estadisticas = action.payload;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      })
      // Consultas por entidad
      .addCase(fetchReservasByAula.fulfilled, (state, action) => {
        state.reservas = action.payload;
      })
      .addCase(fetchReservasByDocente.fulfilled, (state, action) => {
        state.reservas = action.payload;
      })
      .addCase(fetchReservasByActividad.fulfilled, (state, action) => {
        state.reservas = action.payload;
      });
  },
});

export const {
  setSelectedReserva,
  clearError,
  clearConflictos,
  clearDisponibilidad,
  setFilters,
  clearFilters,
  clearReservas,
} = reservasSlice.actions;

export default reservasSlice.reducer;
