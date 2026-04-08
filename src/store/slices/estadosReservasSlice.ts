import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import estadosReservasApi, {
  EstadoReserva,
  CreateEstadoReservaDto,
  UpdateEstadoReservaDto,
  EstadosReservaQueryParams,
  EstadisticasUso,
} from '../../services/estadosReservasApi';

/**
 * Redux Slice para Estados de Reservas
 *
 * Gestiona el catálogo de estados de reservas del sistema.
 */

interface EstadosReservasState {
  estados: EstadoReserva[];
  estadisticas: EstadisticasUso[];
  loading: boolean;
  error: string | null;
  selectedEstado: EstadoReserva | null;
}

const initialState: EstadosReservasState = {
  estados: [],
  estadisticas: [],
  loading: false,
  error: null,
  selectedEstado: null,
};

// ==================== ASYNC THUNKS ====================

/**
 * Listar Estados de Reserva
 */
export const fetchEstadosReservas = createAsyncThunk(
  'estadosReservas/fetchEstadosReservas',
  async (params?: EstadosReservaQueryParams, { rejectWithValue }) => {
    try {
      return await estadosReservasApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al cargar estados de reservas'
      );
    }
  }
);

/**
 * Obtener Estado por ID
 */
export const fetchEstadoReservaById = createAsyncThunk(
  'estadosReservas/fetchEstadoReservaById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await estadosReservasApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estado de reserva');
    }
  }
);

/**
 * Obtener Estado por Código
 */
export const fetchEstadoReservaByCodigo = createAsyncThunk(
  'estadosReservas/fetchEstadoReservaByCodigo',
  async (codigo: string, { rejectWithValue }) => {
    try {
      return await estadosReservasApi.getByCode(codigo);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estado de reserva');
    }
  }
);

/**
 * Crear Estado de Reserva
 */
export const createEstadoReserva = createAsyncThunk(
  'estadosReservas/createEstadoReserva',
  async (data: CreateEstadoReservaDto, { rejectWithValue }) => {
    try {
      return await estadosReservasApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear estado de reserva');
    }
  }
);

/**
 * Actualizar Estado de Reserva
 */
export const updateEstadoReserva = createAsyncThunk(
  'estadosReservas/updateEstadoReserva',
  async ({ id, data }: { id: number; data: UpdateEstadoReservaDto }, { rejectWithValue }) => {
    try {
      return await estadosReservasApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al actualizar estado de reserva'
      );
    }
  }
);

/**
 * Desactivar Estado (Soft Delete)
 */
export const deleteEstadoReserva = createAsyncThunk(
  'estadosReservas/deleteEstadoReserva',
  async (id: number, { rejectWithValue }) => {
    try {
      await estadosReservasApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al eliminar estado de reserva'
      );
    }
  }
);

/**
 * Reordenar Estados
 */
export const reorderEstadosReservas = createAsyncThunk(
  'estadosReservas/reorderEstadosReservas',
  async (ids: number[], { rejectWithValue }) => {
    try {
      await estadosReservasApi.reorder(ids);
      return ids;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al reordenar estados de reservas'
      );
    }
  }
);

/**
 * Obtener Estadísticas de Uso
 */
export const fetchEstadisticasUso = createAsyncThunk(
  'estadosReservas/fetchEstadisticasUso',
  async (_, { rejectWithValue }) => {
    try {
      return await estadosReservasApi.getEstadisticasUso();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estadísticas');
    }
  }
);

// ==================== SLICE ====================

const estadosReservasSlice = createSlice({
  name: 'estadosReservas',
  initialState,
  reducers: {
    setSelectedEstado: (state, action: PayloadAction<EstadoReserva | null>) => {
      state.selectedEstado = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearEstadosReservas: (state) => {
      state.estados = [];
      state.estadisticas = [];
      state.selectedEstado = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch estados
      .addCase(fetchEstadosReservas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstadosReservas.fulfilled, (state, action) => {
        state.loading = false;
        state.estados = action.payload;
      })
      .addCase(fetchEstadosReservas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch estado by ID
      .addCase(fetchEstadoReservaById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstadoReservaById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEstado = action.payload;
      })
      .addCase(fetchEstadoReservaById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch estado by codigo
      .addCase(fetchEstadoReservaByCodigo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstadoReservaByCodigo.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEstado = action.payload;
      })
      .addCase(fetchEstadoReservaByCodigo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create estado
      .addCase(createEstadoReserva.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEstadoReserva.fulfilled, (state, action) => {
        state.loading = false;
        state.estados.push(action.payload);
      })
      .addCase(createEstadoReserva.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update estado
      .addCase(updateEstadoReserva.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEstadoReserva.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.estados.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.estados[index] = action.payload;
        }
      })
      .addCase(updateEstadoReserva.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete estado
      .addCase(deleteEstadoReserva.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEstadoReserva.fulfilled, (state, action) => {
        state.loading = false;
        // Marcar como inactivo en lugar de eliminar
        const index = state.estados.findIndex((e) => e.id === action.payload);
        if (index !== -1) {
          state.estados[index].activo = false;
        }
      })
      .addCase(deleteEstadoReserva.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Reorder estados
      .addCase(reorderEstadosReservas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderEstadosReservas.fulfilled, (state, action) => {
        state.loading = false;
        // Actualizar el orden según los IDs recibidos
        const newOrder = action.payload;
        state.estados = state.estados.sort((a, b) => {
          return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
        });
      })
      .addCase(reorderEstadosReservas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch estadísticas
      .addCase(fetchEstadisticasUso.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstadisticasUso.fulfilled, (state, action) => {
        state.loading = false;
        state.estadisticas = action.payload;
      })
      .addCase(fetchEstadisticasUso.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedEstado, clearError, clearEstadosReservas } =
  estadosReservasSlice.actions;

export default estadosReservasSlice.reducer;
