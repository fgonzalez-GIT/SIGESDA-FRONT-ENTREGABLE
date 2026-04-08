import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import cuotasService from '../../services/cuotasService';
import reportesService from '../../services/reportesService';
import exencionesService from '../../services/exencionesService';
import {
  Cuota,
  DashboardData,
  GenerarCuotasRequest,
  RegenerarCuotasRequest,
  ItemCuota,
  RecalcularCuotaRequest,
  RecalculoResponse,
  ValidacionGeneracionResponse,
  DesgloseItemsResponse,
  ExencionCuota,
  SolicitarExencionRequest,
  AprobarExencionRequest,
  RechazarExencionRequest,
  RevocarExencionRequest,
} from '../../types/cuota.types';

// State definition
export interface CuotasFilters {
  mes?: number;
  anio?: number;
  categoriaId?: number; // V2: Cambio de categoria (string) a categoriaId (number)
  page?: number;
  limit?: number;
  soloImpagas?: boolean;
  soloVencidas?: boolean;
  ordenarPor?: string;
  orden?: 'asc' | 'desc';
  personaId?: number; // Para filtrar por socio
  conDescuento?: boolean; // Filtrar cuotas con descuentos
  conRecargo?: boolean; // Filtrar cuotas con recargos
}



/**
 * State mejorado con tipado completo V2
 */
interface CuotasState {
  cuotas: Cuota[];
  selectedCuota: Cuota | null;
  itemsCuota: ItemCuota[];
  desgloseCuota: DesgloseItemsResponse | null; // V2: Tipado específico
  dashboardData: DashboardData | null;
  filters: CuotasFilters;
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
  operationLoading: boolean; // For create/update/delete operations

  // Cuotas V2
  validacionGeneracion: ValidacionGeneracionResponse | null;
  previewRecalculo: RecalculoResponse | null; // V2: Tipado específico
  comparacionCuota: {
    // V2: Tipado específico para comparación
    cuotaOriginal: Cuota;
    cuotaRecalculada: Cuota;
    diferencias: {
      montoTotal: number;
      itemsAgregados: ItemCuota[];
      itemsEliminados: ItemCuota[];
      itemsModificados: ItemCuota[];
    };
  } | null;

  // V2: Estado de exenciones
  exenciones: ExencionCuota[];
  selectedExencion: ExencionCuota | null;
  exencionesVigentes: ExencionCuota[];
}

const initialState: CuotasState = {
  cuotas: [],
  selectedCuota: null,
  itemsCuota: [],
  desgloseCuota: null,
  dashboardData: null,
  filters: {
    page: 1,
    limit: 20,
    soloImpagas: false
  },
  pagination: {
    total: 0,
    pages: 0,
    currentPage: 1,
    limit: 20
  },
  loading: false,
  error: null,
  operationLoading: false,
  validacionGeneracion: null,
  previewRecalculo: null,
  comparacionCuota: null,
  // V2: Estado de exenciones
  exenciones: [],
  selectedExencion: null,
  exencionesVigentes: [],
};

// Async Thunks

export const fetchCuotas = createAsyncThunk(
  'cuotas/fetchCuotas',
  async (filters: CuotasFilters, { rejectWithValue }) => {
    try {
      const response = await cuotasService.getCuotas(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cargar cuotas');
    }
  }
);

export const fetchCuotaById = createAsyncThunk(
  'cuotas/fetchCuotaById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await cuotasService.getCuotaById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cargar la cuota');
    }
  }
);

export const fetchItemsCuota = createAsyncThunk(
  'cuotas/fetchItems',
  async (cuotaId: number, { rejectWithValue }) => {
    try {
      return await cuotasService.getItemsCuota(cuotaId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cargar items');
    }
  }
);

export const fetchDesgloseCuota = createAsyncThunk(
  'cuotas/fetchDesglose',
  async (cuotaId: number, { rejectWithValue }) => {
    try {
      return await cuotasService.getDesgloseItems(cuotaId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cargar desglose');
    }
  }
);

export const generarCuotasMasivas = createAsyncThunk(
  'cuotas/generarMasivas',
  async (request: GenerarCuotasRequest, { rejectWithValue }) => {
    try {
      return await cuotasService.generarCuotasV2(request);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al generar cuotas');
    }
  }
);

export const validarGeneracion = createAsyncThunk(
  'cuotas/validarGeneracion',
  async ({ mes, anio, categoriaIds }: { mes: number; anio: number; categoriaIds?: number[] }, { rejectWithValue }) => {
    try {
      return await cuotasService.validarGeneracion(mes, anio, categoriaIds);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al validar generación');
    }
  }
);

export const recalcularCuota = createAsyncThunk(
  'cuotas/recalcular',
  async ({ id, options }: { id: number; options: RecalcularCuotaRequest }, { rejectWithValue }) => {
    try {
      return await cuotasService.recalcularCuota(id, options);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al recalcular cuota');
    }
  }
);

export const previewRecalculo = createAsyncThunk(
  'cuotas/previewRecalculo',
  async (request: any, { rejectWithValue }) => {
    try {
      return await cuotasService.previewRecalculo(request);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al generar preview');
    }
  }
);

export const regenerarCuotas = createAsyncThunk(
  'cuotas/regenerar',
  async (request: RegenerarCuotasRequest, { rejectWithValue }) => {
    try {
      return await cuotasService.regenerarCuotas(request);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al regenerar cuotas');
    }
  }
);

export const compararCuota = createAsyncThunk(
  'cuotas/comparar',
  async (cuotaId: number, { rejectWithValue }) => {
    try {
      return cuotasService.compararCuota(cuotaId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al comparar cuota');
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  'cuotas/fetchDashboard',
  async ({ mes, anio }: { mes: number; anio: number }, { rejectWithValue }) => {
    try {
      return await reportesService.getDashboard(mes, anio);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cargar dashboard');
    }
  }
);

export const deleteCuota = createAsyncThunk(
  'cuotas/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await cuotasService.deleteCuota(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al eliminar cuota');
    }
  }
);

// NUEVO: Exportar cuotas sin paginación
export const exportCuotas = createAsyncThunk(
  'cuotas/export',
  async (filters: Omit<CuotasFilters, 'page' | 'limit'>, { rejectWithValue }) => {
    try {
      return await cuotasService.exportCuotas(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al exportar cuotas');
    }
  }
);

// NUEVO: Obtener todas las cuotas con limit=all
export const fetchAllCuotas = createAsyncThunk(
  'cuotas/fetchAll',
  async (filters: Omit<CuotasFilters, 'page' | 'limit'>, { rejectWithValue }) => {
    try {
      return await cuotasService.getAllCuotas(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cargar todas las cuotas');
    }
  }
);

// ============================================================================
// THUNKS DE EXENCIONES V2
// ============================================================================

/**
 * Crea una nueva solicitud de exención
 */
export const createExencion = createAsyncThunk(
  'cuotas/exenciones/create',
  async (exencion: SolicitarExencionRequest, { rejectWithValue }) => {
    try {
      return await exencionesService.createExencion(exencion);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al crear exención');
    }
  }
);

/**
 * Obtiene exenciones de una persona
 */
export const fetchExencionesPersona = createAsyncThunk(
  'cuotas/exenciones/fetchByPersona',
  async ({ personaId, incluirInactivas = false }: { personaId: number; incluirInactivas?: boolean }, { rejectWithValue }) => {
    try {
      return await exencionesService.getExencionesPorPersona(personaId, incluirInactivas);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cargar exenciones');
    }
  }
);

/**
 * Obtiene exenciones vigentes de una persona
 */
export const fetchExencionesVigentes = createAsyncThunk(
  'cuotas/exenciones/fetchVigentes',
  async (personaId: number, { rejectWithValue }) => {
    try {
      return await exencionesService.getExencionesVigentes(personaId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cargar exenciones vigentes');
    }
  }
);

/**
 * Actualiza una exención
 */
export const updateExencion = createAsyncThunk(
  'cuotas/exenciones/update',
  async ({ id, cambios }: { id: number; cambios: Partial<SolicitarExencionRequest> }, { rejectWithValue }) => {
    try {
      return await exencionesService.updateExencion(id, cambios);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al actualizar exención');
    }
  }
);

/**
 * Aprueba una exención
 */
export const aprobarExencion = createAsyncThunk(
  'cuotas/exenciones/aprobar',
  async ({ id, data }: { id: number; data: AprobarExencionRequest }, { rejectWithValue }) => {
    try {
      return await exencionesService.aprobarExencion(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al aprobar exención');
    }
  }
);

/**
 * Rechaza una exención
 */
export const rechazarExencion = createAsyncThunk(
  'cuotas/exenciones/rechazar',
  async ({ id, data }: { id: number; data: RechazarExencionRequest }, { rejectWithValue }) => {
    try {
      return await exencionesService.rechazarExencion(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al rechazar exención');
    }
  }
);

/**
 * Revoca una exención vigente
 */
export const revocarExencion = createAsyncThunk(
  'cuotas/exenciones/revocar',
  async ({ id, data }: { id: number; data: RevocarExencionRequest }, { rejectWithValue }) => {
    try {
      return await exencionesService.revocarExencion(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al revocar exención');
    }
  }
);

/**
 * Elimina una exención
 */
export const deleteExencion = createAsyncThunk(
  'cuotas/exenciones/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await exencionesService.deleteExencion(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al eliminar exención');
    }
  }
);

// Slice
const cuotasSlice = createSlice({
  name: 'cuotas',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<CuotasFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset page when filters change (except paging itself)
      if (action.payload.page === undefined) {
        state.filters.page = 1;
      }
    },
    clearFilters: (state) => {
      state.filters = { page: 1, limit: 20 };
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCuota: (state, action: PayloadAction<Cuota | null>) => {
      state.selectedCuota = action.payload;
    },
    clearValidacion: (state) => {
      state.validacionGeneracion = null;
    },
    clearPreview: (state) => {
      state.previewRecalculo = null;
      state.comparacionCuota = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cuotas
      .addCase(fetchCuotas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCuotas.fulfilled, (state, action) => {
        state.loading = false;
        state.cuotas = action.payload.data || [];

        if (action.payload.meta) {
          state.pagination = {
            total: action.payload.meta.total,
            pages: action.payload.meta.totalPages,
            currentPage: action.payload.meta.page,
            limit: action.payload.meta.limit
          };
        }
      })
      .addCase(fetchCuotas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Cuota By ID
      .addCase(fetchCuotaById.fulfilled, (state, action) => {
        state.selectedCuota = action.payload;

        // V2: Actualizar también en el array cuotas[] si existe (para refrescar monto en tabla)
        const index = state.cuotas.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.cuotas[index] = action.payload;
        }
      })
      .addCase(fetchItemsCuota.fulfilled, (state, action) => {
        state.itemsCuota = action.payload;
      })
      .addCase(fetchDesgloseCuota.fulfilled, (state, action) => {
        state.desgloseCuota = action.payload;

        // Sync montoTotal in cuotas list so the table stays consistent with the detail view.
        // action.meta.arg is the cuotaId passed to the thunk.
        const cuotaId = action.meta.arg;
        const newTotal = action.payload?.totales?.total;
        if (cuotaId && newTotal !== undefined && newTotal !== null) {
          const index = state.cuotas.findIndex(c => c.id === cuotaId);
          if (index !== -1) {
            state.cuotas[index] = {
              ...state.cuotas[index],
              montoTotal: String(newTotal),
            };
          }
          if (state.selectedCuota?.id === cuotaId) {
            state.selectedCuota = {
              ...state.selectedCuota,
              montoTotal: String(newTotal),
            };
          }
        }
      })

      // Generar Masivas
      .addCase(generarCuotasMasivas.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(generarCuotasMasivas.fulfilled, (state, action) => {
        state.operationLoading = false;
        // Optionally refresh list or add new ones if feasible
      })
      .addCase(generarCuotasMasivas.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      })

      // Regenerar Cuotas
      .addCase(regenerarCuotas.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(regenerarCuotas.fulfilled, (state, action) => {
        state.operationLoading = false;
        // Optionally refresh list or add new ones if feasible
      })
      .addCase(regenerarCuotas.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      })

      // Validar Generación
      .addCase(validarGeneracion.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.validacionGeneracion = null;
      })
      .addCase(validarGeneracion.fulfilled, (state, action) => {
        state.loading = false;
        state.validacionGeneracion = action.payload;
      })
      .addCase(validarGeneracion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Recalcular
      .addCase(recalcularCuota.fulfilled, (state, action) => {
        const recalculada = action.payload.cuotaRecalculada;
        // Update the cuota in the list
        const index = state.cuotas.findIndex(c => c.id === recalculada.id);
        if (index !== -1) {
          // Preserve recibo from existing entry if not included in recalculation response
          state.cuotas[index] = {
            ...recalculada,
            recibo: recalculada.recibo ?? state.cuotas[index].recibo,
          };
        }
        if (state.selectedCuota?.id === recalculada.id) {
          // Preserve recibo with receptor from selectedCuota if not in recalculation response
          state.selectedCuota = {
            ...recalculada,
            recibo: recalculada.recibo ?? state.selectedCuota.recibo,
          };
        }
      })

      // Preview Recalculo
      .addCase(previewRecalculo.pending, (state) => { state.operationLoading = true; })
      .addCase(previewRecalculo.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.previewRecalculo = action.payload;
      })

      // Comparar
      .addCase(compararCuota.fulfilled, (state, action) => {
        state.comparacionCuota = action.payload;
      })

      // Dashboard
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboardData = action.payload;
      })

      // Delete
      .addCase(deleteCuota.fulfilled, (state, action) => {
        state.cuotas = state.cuotas.filter(c => c.id !== action.payload);
      })

      // Export Cuotas
      .addCase(exportCuotas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportCuotas.fulfilled, (state, action) => {
        state.loading = false;
        // Los datos exportados no se guardan en el state, solo se usan para descargar
        // Pero podríamos guardarlos temporalmente si se necesita
      })
      .addCase(exportCuotas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch All Cuotas (limit=all)
      .addCase(fetchAllCuotas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCuotas.fulfilled, (state, action) => {
        state.loading = false;
        state.cuotas = action.payload.data || [];

        if (action.payload.meta) {
          state.pagination = {
            total: action.payload.meta.total,
            pages: 1, // Solo una página cuando se cargan todas
            currentPage: 1,
            limit: action.payload.meta.total // El límite es el total
          };
        }
      })
      .addCase(fetchAllCuotas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // === REDUCERS DE EXENCIONES V2 ===

      // Create Exencion
      .addCase(createExencion.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(createExencion.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.exenciones.push(action.payload);
        state.selectedExencion = action.payload;
      })
      .addCase(createExencion.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Exenciones Por Persona
      .addCase(fetchExencionesPersona.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExencionesPersona.fulfilled, (state, action) => {
        state.loading = false;
        state.exenciones = action.payload;
      })
      .addCase(fetchExencionesPersona.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Exenciones Vigentes
      .addCase(fetchExencionesVigentes.fulfilled, (state, action) => {
        state.exencionesVigentes = action.payload;
      })

      // Update Exencion
      .addCase(updateExencion.fulfilled, (state, action) => {
        const index = state.exenciones.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.exenciones[index] = action.payload;
        }
        if (state.selectedExencion?.id === action.payload.id) {
          state.selectedExencion = action.payload;
        }
      })

      // Aprobar Exencion
      .addCase(aprobarExencion.fulfilled, (state, action) => {
        const index = state.exenciones.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.exenciones[index] = action.payload;
        }
      })

      // Rechazar Exencion
      .addCase(rechazarExencion.fulfilled, (state, action) => {
        const index = state.exenciones.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.exenciones[index] = action.payload;
        }
      })

      // Revocar Exencion
      .addCase(revocarExencion.fulfilled, (state, action) => {
        const index = state.exenciones.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.exenciones[index] = action.payload;
        }
      })

      // Delete Exencion
      .addCase(deleteExencion.fulfilled, (state, action) => {
        state.exenciones = state.exenciones.filter(e => e.id !== action.payload);
        if (state.selectedExencion?.id === action.payload) {
          state.selectedExencion = null;
        }
      });
  },
});

export const { setFilters, clearFilters, clearError, setSelectedCuota, clearValidacion, clearPreview } = cuotasSlice.actions;
export default cuotasSlice.reducer;