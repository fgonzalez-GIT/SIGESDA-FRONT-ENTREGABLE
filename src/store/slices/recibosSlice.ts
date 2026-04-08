import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { recibosService } from '../../services/recibosService';

export interface Recibo {
  id: number;
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  personaId: number;
  personaNombre: string;
  personaApellido: string;
  personaTipo: string;
  personaEmail?: string;
  personaTelefono?: string;
  conceptos: ReciboConcepto[];
  subtotal: number;
  descuentos: number;
  recargos: number;
  total: number;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'cancelado' | 'parcial';
  metodoPago?: 'efectivo' | 'transferencia' | 'tarjeta_debito' | 'tarjeta_credito' | 'cheque';
  fechaPago?: string;
  montoPagado: number;
  mediosPago?: MedioPago[]; // Array de medios de pago del backend
  observaciones?: string;
  cuotaIds: number[]; // Cuotas asociadas a este recibo
  enviado: boolean;
  fechaEnvio?: string;
  archivo?: string; // URL del archivo PDF generado
}

export interface ReciboConcepto {
  id: number;
  concepto: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  cuotaId?: number;
  tipoItem?: {
    id: number;
    codigo: string;
    nombre: string;
  };
  metadata?: any; // Datos adicionales del item (actividadId, participacionId, etc.)
}

// Tipos de medios de pago (formato backend)
export type TipoMedioPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'CHEQUE';

export interface MedioPago {
  id?: number;
  tipo: TipoMedioPago;
  importe: number;
  fecha: string; // ISO datetime
  banco?: string;
  numero?: string;
}

export interface GenerarReciboRequest {
  personaId: number;
  cuotaIds: number[];
  fechaVencimiento: string;
  observaciones?: string;
  aplicarDescuentos?: boolean;
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
}

/**
 * @deprecated Usar ProcesarPagoRequest en su lugar
 * Formato antiguo mantenido para compatibilidad
 */
export interface PagarReciboRequest {
  reciboId: number;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta_debito' | 'tarjeta_credito' | 'cheque';
  montoPago: number;
  fechaPago: string;
  observaciones?: string;
}

/**
 * Request para procesar pago de recibo (formato backend V2)
 * Soporta múltiples medios de pago y pagos parciales
 */
export interface ProcesarPagoRequest {
  mediosPago: MedioPago[];
}

export interface RecibosFilters {
  estado?: 'pendiente' | 'pagado' | 'vencido' | 'cancelado' | 'parcial';
  personaTipo?: string;
  personaId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  mes?: number; // Mes del recibo (1-12)
  anio?: number; // Año del recibo
  metodoPago?: string;
  numeroRecibo?: string;
  enviado?: boolean;
  page?: number;
  limit?: number;
}

interface RecibosState {
  recibos: Recibo[];
  filteredRecibos: Recibo[];
  filters: RecibosFilters;
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
  totalRecibos: number;
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  estadisticas: {
    pendientes: number;
    pagados: number;
    vencidos: number;
    cancelados: number;
    parciales: number;
    facturacionMensual: { [key: string]: number };
    cobranzaMensual: { [key: string]: number };
  };
  currentRecibo: Recibo | null;
  generatingPdf: boolean;
  bulkDeleteLoading: boolean;
  bulkDeleteError: string | null;
}

const initialState: RecibosState = {
  recibos: [],
  filteredRecibos: [],
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
  loading: false,
  error: null,
  totalRecibos: 0,
  totalFacturado: 0,
  totalCobrado: 0,
  totalPendiente: 0,
  estadisticas: {
    pendientes: 0,
    pagados: 0,
    vencidos: 0,
    cancelados: 0,
    parciales: 0,
    facturacionMensual: {},
    cobranzaMensual: {},
  },
  currentRecibo: null,
  generatingPdf: false,
  bulkDeleteLoading: false,
  bulkDeleteError: null,
};

// Async thunks
export const fetchRecibos = createAsyncThunk(
  'recibos/fetchRecibos',
  async (filters: RecibosFilters = {}) => {
    const response = await recibosService.getRecibos(filters);
    return response;
  }
);

export const fetchReciboById = createAsyncThunk(
  'recibos/fetchReciboById',
  async (id: number) => {
    const response = await recibosService.getReciboById(id);
    return response;
  }
);

export const createRecibo = createAsyncThunk(
  'recibos/createRecibo',
  async (recibo: Omit<Recibo, 'id' | 'numero' | 'fechaEmision'>) => {
    const response = await recibosService.createRecibo(recibo);
    return response;
  }
);

export const updateRecibo = createAsyncThunk(
  'recibos/updateRecibo',
  async ({ id, recibo }: { id: number; recibo: Partial<Recibo> }) => {
    const response = await recibosService.updateRecibo(id, recibo);
    return response;
  }
);

export const deleteRecibo = createAsyncThunk(
  'recibos/deleteRecibo',
  async (id: number) => {
    await recibosService.deleteRecibo(id);
    return id;
  }
);

export const generarRecibo = createAsyncThunk(
  'recibos/generarRecibo',
  async (request: GenerarReciboRequest) => {
    const response = await recibosService.generarRecibo(request);
    return response;
  }
);

/**
 * Thunk para procesar pago de recibo (formato V2)
 * Soporta múltiples medios de pago y pagos parciales
 */
export const pagarRecibo = createAsyncThunk(
  'recibos/pagarRecibo',
  async ({ reciboId, request }: { reciboId: number; request: ProcesarPagoRequest }) => {
    const response = await recibosService.procesarPago(reciboId, request);
    return response;
  }
);

export const generarPdfRecibo = createAsyncThunk(
  'recibos/generarPdfRecibo',
  async (reciboId: number) => {
    const response = await recibosService.generarPdf(reciboId);
    return response;
  }
);

export const enviarRecibo = createAsyncThunk(
  'recibos/enviarRecibo',
  async ({ reciboId, email }: { reciboId: number; email?: string }) => {
    await recibosService.enviarRecibo(reciboId, email);
    return reciboId;
  }
);

export const anularRecibo = createAsyncThunk(
  'recibos/anularRecibo',
  async ({ reciboId, motivo }: { reciboId: number; motivo: string }) => {
    const response = await recibosService.anularRecibo(reciboId, motivo);
    return response;
  }
);

export const fetchEstadisticas = createAsyncThunk(
  'recibos/fetchEstadisticas',
  async (filtros?: { fechaDesde?: string; fechaHasta?: string; personaTipo?: string }) => {
    const response = await recibosService.getEstadisticas(filtros);
    return response;
  }
);

export const fetchVencidos = createAsyncThunk(
  'recibos/fetchVencidos',
  async () => {
    const response = await recibosService.getRecibosVencidos();
    return response;
  }
);

/**
 * Eliminar múltiples recibos de forma atómica (todo o nada)
 * @see /SIGESDA-BACKEND/docs/API_BULK_DELETE.md
 */
export const bulkDeleteRecibos = createAsyncThunk(
  'recibos/bulkDeleteRecibos',
  async (ids: number[], { rejectWithValue }) => {
    try {
      const result = await recibosService.bulkDeleteRecibos(ids);
      return { deletedIds: ids, ...result };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error al eliminar recibos';
      return rejectWithValue(errorMsg);
    }
  }
);

const recibosSlice = createSlice({
  name: 'recibos',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<RecibosFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset page when filters change (except paging itself)
      if (action.payload.page === undefined && action.payload.limit === undefined) {
        state.filters.page = 1;
      }
    },
    clearFilters: (state) => {
      state.filters = { page: 1, limit: 20 };
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRecibo: (state, action: PayloadAction<Recibo | null>) => {
      state.currentRecibo = action.payload;
    },
    clearBulkDeleteError: (state) => {
      state.bulkDeleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch recibos
      .addCase(fetchRecibos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecibos.fulfilled, (state, action) => {
        state.loading = false;

        // Si la respuesta tiene formato paginado
        if (action.payload && typeof action.payload === 'object' && 'data' in action.payload) {
          const paginatedResponse = action.payload as any;
          state.recibos = paginatedResponse.data || [];
          state.filteredRecibos = paginatedResponse.data || [];

          // Actualizar paginación desde meta
          if (paginatedResponse.meta) {
            state.pagination = {
              total: paginatedResponse.meta.total,
              pages: paginatedResponse.meta.totalPages,
              currentPage: paginatedResponse.meta.page,
              limit: paginatedResponse.meta.limit,
            };
            state.totalRecibos = paginatedResponse.meta.total;
          }
        } else {
          // Formato antiguo (array simple) - fallback
          const recibos = Array.isArray(action.payload) ? action.payload : [];
          state.recibos = recibos;
          state.filteredRecibos = recibos;
          state.totalRecibos = recibos.length;
        }

        // Calcular estadísticas de la página actual
        const currentRecibos = state.recibos;
        state.totalFacturado = currentRecibos.reduce((sum, r) => sum + r.total, 0);
        state.totalCobrado = currentRecibos
          .filter(r => r.estado === 'pagado')
          .reduce((sum, r) => sum + r.montoPagado, 0);
        state.totalPendiente = currentRecibos
          .filter(r => r.estado === 'pendiente' || r.estado === 'vencido' || r.estado === 'parcial')
          .reduce((sum, r) => sum + (r.total - r.montoPagado), 0);

        state.estadisticas = {
          pendientes: currentRecibos.filter(r => r.estado === 'pendiente').length,
          pagados: currentRecibos.filter(r => r.estado === 'pagado').length,
          vencidos: currentRecibos.filter(r => r.estado === 'vencido').length,
          cancelados: currentRecibos.filter(r => r.estado === 'cancelado').length,
          parciales: currentRecibos.filter(r => r.estado === 'parcial').length,
          facturacionMensual: currentRecibos
            .filter(r => r.fechaEmision && typeof r.fechaEmision === 'string')
            .reduce((acc, r) => {
              const mes = r.fechaEmision.substring(0, 7);
              acc[mes] = (acc[mes] || 0) + r.total;
              return acc;
            }, {} as { [key: string]: number }),
          cobranzaMensual: currentRecibos
            .filter(r => r.estado === 'pagado' && r.fechaPago && typeof r.fechaPago === 'string')
            .reduce((acc, r) => {
              const mes = r.fechaPago!.substring(0, 7);
              acc[mes] = (acc[mes] || 0) + r.montoPagado;
              return acc;
            }, {} as { [key: string]: number }),
        };
      })
      .addCase(fetchRecibos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar recibos';
      })

      // Fetch recibo by ID
      .addCase(fetchReciboById.fulfilled, (state, action) => {
        state.currentRecibo = action.payload;
      })

      // Create recibo
      .addCase(createRecibo.fulfilled, (state, action) => {
        state.recibos.push(action.payload);
        state.filteredRecibos.push(action.payload);
      })

      // Update recibo
      .addCase(updateRecibo.fulfilled, (state, action) => {
        const index = state.recibos.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.recibos[index] = action.payload;
          const filteredIndex = state.filteredRecibos.findIndex(r => r.id === action.payload.id);
          if (filteredIndex !== -1) {
            state.filteredRecibos[filteredIndex] = action.payload;
          }
        }
      })

      // Delete recibo
      .addCase(deleteRecibo.fulfilled, (state, action) => {
        state.recibos = state.recibos.filter(r => r.id !== action.payload);
        state.filteredRecibos = state.filteredRecibos.filter(r => r.id !== action.payload);
      })

      // Generar recibo
      .addCase(generarRecibo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generarRecibo.fulfilled, (state, action) => {
        state.loading = false;
        state.recibos.push(action.payload);
        state.filteredRecibos.push(action.payload);
      })
      .addCase(generarRecibo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al generar recibo';
      })

      // Pagar recibo
      .addCase(pagarRecibo.fulfilled, (state, action) => {
        const index = state.recibos.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.recibos[index] = action.payload;
          const filteredIndex = state.filteredRecibos.findIndex(r => r.id === action.payload.id);
          if (filteredIndex !== -1) {
            state.filteredRecibos[filteredIndex] = action.payload;
          }
        }
      })

      // Generar PDF
      .addCase(generarPdfRecibo.pending, (state) => {
        state.generatingPdf = true;
      })
      .addCase(generarPdfRecibo.fulfilled, (state, action) => {
        state.generatingPdf = false;
        // Actualizar el recibo con la URL del PDF
        if (state.currentRecibo) {
          state.currentRecibo.archivo = action.payload;
        }
      })
      .addCase(generarPdfRecibo.rejected, (state) => {
        state.generatingPdf = false;
      })

      // Enviar recibo
      .addCase(enviarRecibo.fulfilled, (state, action) => {
        const reciboId = action.payload;
        const index = state.recibos.findIndex(r => r.id === reciboId);
        if (index !== -1) {
          state.recibos[index].enviado = true;
          state.recibos[index].fechaEnvio = new Date().toISOString().split('T')[0];
        }
        const filteredIndex = state.filteredRecibos.findIndex(r => r.id === reciboId);
        if (filteredIndex !== -1) {
          state.filteredRecibos[filteredIndex].enviado = true;
          state.filteredRecibos[filteredIndex].fechaEnvio = new Date().toISOString().split('T')[0];
        }
      })

      // Anular recibo
      .addCase(anularRecibo.fulfilled, (state, action) => {
        const index = state.recibos.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.recibos[index] = action.payload;
          const filteredIndex = state.filteredRecibos.findIndex(r => r.id === action.payload.id);
          if (filteredIndex !== -1) {
            state.filteredRecibos[filteredIndex] = action.payload;
          }
        }
      })

      // Fetch estadísticas
      .addCase(fetchEstadisticas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstadisticas.fulfilled, (state, action) => {
        state.loading = false;
        // Las estadísticas se pueden actualizar según la estructura de la respuesta
        if (action.payload) {
          state.estadisticas = {
            ...state.estadisticas,
            ...action.payload,
          };
        }
      })
      .addCase(fetchEstadisticas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar estadísticas';
      })

      // Fetch vencidos
      .addCase(fetchVencidos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVencidos.fulfilled, (state, action) => {
        state.loading = false;
        // Actualizar recibos vencidos en el estado
        // Puedes decidir si reemplazar todos los recibos o solo agregar los vencidos
        state.filteredRecibos = action.payload;
      })
      .addCase(fetchVencidos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar recibos vencidos';
      })

      // Bulk Delete Recibos
      .addCase(bulkDeleteRecibos.pending, (state) => {
        state.bulkDeleteLoading = true;
        state.bulkDeleteError = null;
      })
      .addCase(bulkDeleteRecibos.fulfilled, (state, action) => {
        state.bulkDeleteLoading = false;
        // Remover recibos eliminados del estado
        const deletedIds = new Set(action.payload.deletedIds);
        state.recibos = state.recibos.filter(r => !deletedIds.has(r.id));
        state.filteredRecibos = state.filteredRecibos.filter(r => !deletedIds.has(r.id));
        // Actualizar total
        state.totalRecibos = Math.max(0, state.totalRecibos - action.payload.count);
        // Actualizar paginación
        state.pagination.total = Math.max(0, state.pagination.total - action.payload.count);
      })
      .addCase(bulkDeleteRecibos.rejected, (state, action) => {
        state.bulkDeleteLoading = false;
        state.bulkDeleteError = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearError, setCurrentRecibo, clearBulkDeleteError } = recibosSlice.actions;
export default recibosSlice.reducer;