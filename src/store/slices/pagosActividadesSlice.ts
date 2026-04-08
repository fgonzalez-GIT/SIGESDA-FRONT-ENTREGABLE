import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import pagosActividadesService from '@/services/pagosActividadesService';
import {
  PagoActividad,
  GenerarPagosActividadesRequest,
  GenerarPagosActividadesResponse,
  GenerarPagosRetroactivosRequest,
  PagosActividadesFilters,
  PagosActividadesStats,
} from '@/types/pagosActividades.types';

/**
 * State para el módulo de Pagos de Actividades
 */
interface PagosActividadesState {
  pagos: PagoActividad[];
  selectedPago: PagoActividad | null;
  filters: PagosActividadesFilters;
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
  estadisticas: PagosActividadesStats | null;
  loading: boolean;
  error: string | null;
  operationLoading: boolean; // Para operaciones de create/delete/generate
  lastGeneration: GenerarPagosActividadesResponse | null; // Resultado de la última generación
  bulkDeleteLoading: boolean;
  bulkDeleteError: string | null;
}

const initialState: PagosActividadesState = {
  pagos: [],
  selectedPago: null,
  filters: {
    page: 1,
    limit: 20,
  },
  pagination: {
    total: 0,
    pages: 0,
    currentPage: 1,
    limit: 20,
  },
  estadisticas: null,
  loading: false,
  error: null,
  operationLoading: false,
  lastGeneration: null,
  bulkDeleteLoading: false,
  bulkDeleteError: null,
};

// ==================== ASYNC THUNKS ====================

/**
 * Generar pagos mensuales
 */
export const generarPagosMensuales = createAsyncThunk(
  'pagosActividades/generarMensuales',
  async (request: GenerarPagosActividadesRequest, { rejectWithValue }) => {
    try {
      return await pagosActividadesService.generarPagosMensuales(request);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al generar pagos mensuales'
      );
    }
  }
);

/**
 * Generar pagos retroactivos
 */
export const generarPagosRetroactivos = createAsyncThunk(
  'pagosActividades/generarRetroactivos',
  async (request: GenerarPagosRetroactivosRequest, { rejectWithValue }) => {
    try {
      return await pagosActividadesService.generarPagosRetroactivos(request);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al generar pagos retroactivos'
      );
    }
  }
);

/**
 * Obtener pagos con filtros
 */
export const fetchPagosActividades = createAsyncThunk(
  'pagosActividades/fetchPagos',
  async (filters: PagosActividadesFilters, { rejectWithValue }) => {
    try {
      return await pagosActividadesService.getPagosActividades(filters);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
        'Error al cargar pagos de actividades'
      );
    }
  }
);

/**
 * Obtener un pago por ID
 */
export const fetchPagoById = createAsyncThunk(
  'pagosActividades/fetchPagoById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await pagosActividadesService.getPagoById(id);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
        'Error al cargar el pago'
      );
    }
  }
);

/**
 * Eliminar un pago
 */
export const deletePago = createAsyncThunk(
  'pagosActividades/deletePago',
  async (id: number, { rejectWithValue }) => {
    try {
      await pagosActividadesService.deletePago(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al eliminar el pago. Solo se pueden eliminar pagos PENDIENTES.'
      );
    }
  }
);

/**
 * Obtener estadísticas
 */
export const fetchEstadisticas = createAsyncThunk(
  'pagosActividades/fetchEstadisticas',
  async (filters: { mes?: number; anio?: number } = {}, { rejectWithValue }) => {
    try {
      return await pagosActividadesService.getEstadisticas(filters);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
        'Error al cargar estadísticas'
      );
    }
  }
);

/**
 * Descargar exportación
 */
export const downloadExportacion = createAsyncThunk(
  'pagosActividades/downloadExportacion',
  async (
    params: { filters: PagosActividadesFilters; formato: 'excel' | 'csv'; filename?: string },
    { rejectWithValue }
  ) => {
    try {
      await pagosActividadesService.descargarExportacion(
        params.filters,
        params.formato,
        params.filename
      );
      return 'Exportación descargada correctamente';
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
        'Error al exportar pagos'
      );
    }
  }
);

/**
 * Eliminar múltiples pagos de actividades de forma atómica (todo o nada)
 * @see /SIGESDA-BACKEND/docs/API_BULK_DELETE.md
 */
export const bulkDeletePagosActividades = createAsyncThunk(
  'pagosActividades/bulkDelete',
  async (ids: number[], { rejectWithValue }) => {
    try {
      const result = await pagosActividadesService.bulkDeletePagosActividades(ids);
      return { deletedIds: ids, ...result };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error al eliminar pagos de actividades';
      return rejectWithValue(errorMsg);
    }
  }
);

// ==================== SLICE ====================

const pagosActividadesSlice = createSlice({
  name: 'pagosActividades',
  initialState,
  reducers: {
    // Actualizar filtros
    setFilters: (state, action: PayloadAction<Partial<PagosActividadesFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Limpiar filtros
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 20,
      };
    },

    // Seleccionar un pago
    selectPago: (state, action: PayloadAction<PagoActividad | null>) => {
      state.selectedPago = action.payload;
    },

    // Limpiar error
    clearError: (state) => {
      state.error = null;
    },

    // Limpiar último resultado de generación
    clearLastGeneration: (state) => {
      state.lastGeneration = null;
    },

    // Limpiar error de bulk delete
    clearBulkDeleteError: (state) => {
      state.bulkDeleteError = null;
    },

    // Limpiar estado completo
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    // ========== Generar pagos mensuales ==========
    builder
      .addCase(generarPagosMensuales.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(generarPagosMensuales.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.lastGeneration = action.payload;
        // Agregar los pagos generados al estado (si hay)
        if (action.payload.pagos && action.payload.pagos.length > 0) {
          state.pagos = [...action.payload.pagos, ...state.pagos];
        }
      })
      .addCase(generarPagosMensuales.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      });

    // ========== Generar pagos retroactivos ==========
    builder
      .addCase(generarPagosRetroactivos.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(generarPagosRetroactivos.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.lastGeneration = action.payload;
        if (action.payload.pagos && action.payload.pagos.length > 0) {
          state.pagos = [...action.payload.pagos, ...state.pagos];
        }
      })
      .addCase(generarPagosRetroactivos.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      });

    // ========== Fetch pagos ==========
    builder
      .addCase(fetchPagosActividades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPagosActividades.fulfilled, (state, action) => {
        state.loading = false;
        state.pagos = action.payload.data;
        state.pagination = {
          total: action.payload.meta.total,
          pages: action.payload.meta.totalPages,
          currentPage: action.payload.meta.page,
          limit: action.payload.meta.limit,
        };
      })
      .addCase(fetchPagosActividades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ========== Fetch pago by ID ==========
    builder
      .addCase(fetchPagoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPagoById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPago = action.payload;
      })
      .addCase(fetchPagoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ========== Delete pago ==========
    builder
      .addCase(deletePago.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(deletePago.fulfilled, (state, action) => {
        state.operationLoading = false;
        // Eliminar el pago del estado
        state.pagos = state.pagos.filter((pago) => pago.id !== action.payload);
        // Si era el pago seleccionado, limpiarlo
        if (state.selectedPago?.id === action.payload) {
          state.selectedPago = null;
        }
      })
      .addCase(deletePago.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      });

    // ========== Fetch estadísticas ==========
    builder
      .addCase(fetchEstadisticas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstadisticas.fulfilled, (state, action) => {
        state.loading = false;
        state.estadisticas = action.payload;
      })
      .addCase(fetchEstadisticas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ========== Download exportación ==========
    builder
      .addCase(downloadExportacion.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(downloadExportacion.fulfilled, (state) => {
        state.operationLoading = false;
      })
      .addCase(downloadExportacion.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      });

    // ========== Bulk Delete Pagos Actividades ==========
    builder
      .addCase(bulkDeletePagosActividades.pending, (state) => {
        state.bulkDeleteLoading = true;
        state.bulkDeleteError = null;
      })
      .addCase(bulkDeletePagosActividades.fulfilled, (state, action) => {
        state.bulkDeleteLoading = false;
        // Remover pagos eliminados del estado
        const deletedIds = new Set(action.payload.deletedIds);
        state.pagos = state.pagos.filter(p => !deletedIds.has(p.id));
        // Si el pago seleccionado fue eliminado, limpiarlo
        if (state.selectedPago && deletedIds.has(state.selectedPago.id)) {
          state.selectedPago = null;
        }
        // Actualizar paginación
        state.pagination.total = Math.max(0, state.pagination.total - action.payload.count);
      })
      .addCase(bulkDeletePagosActividades.rejected, (state, action) => {
        state.bulkDeleteLoading = false;
        state.bulkDeleteError = action.payload as string;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  selectPago,
  clearError,
  clearLastGeneration,
  clearBulkDeleteError,
  resetState,
} = pagosActividadesSlice.actions;

export default pagosActividadesSlice.reducer;
