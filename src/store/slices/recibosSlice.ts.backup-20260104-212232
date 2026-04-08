import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Recibo {
  id: number;
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  personaId: number;
  personaNombre: string;
  personaApellido: string;
  personaTipo: 'socio' | 'docente' | 'estudiante';
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

export interface PagarReciboRequest {
  reciboId: number;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta_debito' | 'tarjeta_credito' | 'cheque';
  montoPago: number;
  fechaPago: string;
  observaciones?: string;
}

export interface RecibosFilters {
  estado?: 'pendiente' | 'pagado' | 'vencido' | 'cancelado' | 'parcial';
  personaTipo?: 'socio' | 'docente' | 'estudiante';
  personaId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  metodoPago?: string;
  numeroRecibo?: string;
  enviado?: boolean;
}

interface RecibosState {
  recibos: Recibo[];
  filteredRecibos: Recibo[];
  filters: RecibosFilters;
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
}

const initialState: RecibosState = {
  recibos: [],
  filteredRecibos: [],
  filters: {},
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
};

// Mock API functions
const recibosAPI = {
  getAll: async (filters: RecibosFilters = {}): Promise<Recibo[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockRecibos: Recibo[] = [
      {
        id: 1,
        numero: 'REC-2025-001',
        fechaEmision: '2025-09-01',
        fechaVencimiento: '2025-09-10',
        personaId: 1,
        personaNombre: 'Juan',
        personaApellido: 'Pérez',
        personaTipo: 'socio',
        personaEmail: 'juan.perez@email.com',
        conceptos: [
          {
            id: 1,
            concepto: 'Cuota mensual - Septiembre 2025',
            cantidad: 1,
            precio: 5000,
            subtotal: 5000,
            cuotaId: 1,
          }
        ],
        subtotal: 5000,
        descuentos: 0,
        recargos: 0,
        total: 5000,
        estado: 'pagado',
        metodoPago: 'transferencia',
        fechaPago: '2025-09-08',
        montoPagado: 5000,
        cuotaIds: [1],
        enviado: true,
        fechaEnvio: '2025-09-01',
      },
      {
        id: 2,
        numero: 'REC-2025-002',
        fechaEmision: '2025-09-15',
        fechaVencimiento: '2025-09-25',
        personaId: 2,
        personaNombre: 'María',
        personaApellido: 'García',
        personaTipo: 'socio',
        personaEmail: 'maria.garcia@email.com',
        conceptos: [
          {
            id: 2,
            concepto: 'Cuota mensual - Septiembre 2025',
            cantidad: 1,
            precio: 5000,
            subtotal: 5000,
            cuotaId: 2,
          }
        ],
        subtotal: 5000,
        descuentos: 500,
        recargos: 0,
        total: 4500,
        estado: 'pendiente',
        montoPagado: 0,
        cuotaIds: [2],
        enviado: false,
      },
      {
        id: 3,
        numero: 'REC-2025-003',
        fechaEmision: '2025-08-01',
        fechaVencimiento: '2025-08-10',
        personaId: 3,
        personaNombre: 'Carlos',
        personaApellido: 'López',
        personaTipo: 'estudiante',
        personaEmail: 'carlos.lopez@email.com',
        conceptos: [
          {
            id: 3,
            concepto: 'Cuota mensual - Agosto 2025',
            cantidad: 1,
            precio: 3000,
            subtotal: 3000,
            cuotaId: 3,
          }
        ],
        subtotal: 3000,
        descuentos: 0,
        recargos: 500,
        total: 3500,
        estado: 'vencido',
        montoPagado: 0,
        cuotaIds: [3],
        enviado: true,
        fechaEnvio: '2025-08-01',
      },
    ];

    return mockRecibos.filter(recibo => {
      if (filters.estado && recibo.estado !== filters.estado) return false;
      if (filters.personaTipo && recibo.personaTipo !== filters.personaTipo) return false;
      if (filters.personaId && recibo.personaId !== filters.personaId) return false;
      if (filters.numeroRecibo && !recibo.numero.toLowerCase().includes(filters.numeroRecibo.toLowerCase())) return false;
      if (filters.enviado !== undefined && recibo.enviado !== filters.enviado) return false;
      return true;
    });
  },

  getById: async (id: number): Promise<Recibo> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const recibos = await recibosAPI.getAll();
    const recibo = recibos.find(r => r.id === id);
    if (!recibo) throw new Error('Recibo no encontrado');
    return recibo;
  },

  create: async (recibo: Omit<Recibo, 'id' | 'numero' | 'fechaEmision'>): Promise<Recibo> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const numero = `REC-2025-${String(Date.now()).slice(-3).padStart(3, '0')}`;
    return {
      ...recibo,
      id: Date.now(),
      numero,
      fechaEmision: new Date().toISOString().split('T')[0],
    };
  },

  update: async (id: number, recibo: Partial<Recibo>): Promise<Recibo> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { id, ...recibo } as Recibo;
  },

  delete: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  generarRecibo: async (request: GenerarReciboRequest): Promise<Recibo> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const conceptos: ReciboConcepto[] = request.cuotaIds.map((cuotaId, index) => ({
      id: Date.now() + index,
      concepto: `Cuota mensual - Concepto ${index + 1}`,
      cantidad: 1,
      precio: 5000,
      subtotal: 5000,
      cuotaId,
    }));

    const subtotal = conceptos.reduce((sum, c) => sum + c.subtotal, 0);
    const descuentos = request.descuentoMonto || (request.descuentoPorcentaje ? subtotal * (request.descuentoPorcentaje / 100) : 0);
    const total = subtotal - descuentos;

    return {
      id: Date.now(),
      numero: `REC-2025-${String(Date.now()).slice(-3).padStart(3, '0')}`,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: request.fechaVencimiento,
      personaId: request.personaId,
      personaNombre: 'Persona',
      personaApellido: 'Generada',
      personaTipo: 'socio',
      conceptos,
      subtotal,
      descuentos,
      recargos: 0,
      total,
      estado: 'pendiente',
      montoPagado: 0,
      cuotaIds: request.cuotaIds,
      enviado: false,
      observaciones: request.observaciones,
    };
  },

  pagarRecibo: async (request: PagarReciboRequest): Promise<Recibo> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const recibo = await recibosAPI.getById(request.reciboId);

    const montoPagadoTotal = recibo.montoPagado + request.montoPago;
    let estado: Recibo['estado'] = 'pendiente';

    if (montoPagadoTotal >= recibo.total) {
      estado = 'pagado';
    } else if (montoPagadoTotal > 0) {
      estado = 'parcial';
    }

    return {
      ...recibo,
      estado,
      metodoPago: request.metodoPago,
      fechaPago: request.fechaPago,
      montoPagado: montoPagadoTotal,
      observaciones: request.observaciones,
    };
  },

  generarPdf: async (reciboId: number): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `https://api.sigesda.com/recibos/${reciboId}/pdf`;
  },

  enviarRecibo: async (reciboId: number, email?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  anularRecibo: async (reciboId: number, motivo: string): Promise<Recibo> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const recibo = await recibosAPI.getById(reciboId);
    return {
      ...recibo,
      estado: 'cancelado',
      observaciones: `${recibo.observaciones || ''}\nAnulado: ${motivo}`,
    };
  },
};

// Async thunks
export const fetchRecibos = createAsyncThunk(
  'recibos/fetchRecibos',
  async (filters: RecibosFilters = {}) => {
    const result = await recibosAPI.getAll(filters);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const fetchReciboById = createAsyncThunk(
  'recibos/fetchReciboById',
  async (id: number) => {
    const result = await recibosAPI.getById(id);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const createRecibo = createAsyncThunk(
  'recibos/createRecibo',
  async (recibo: Omit<Recibo, 'id' | 'numero' | 'fechaEmision'>) => {
    const result = await recibosAPI.create(recibo);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const updateRecibo = createAsyncThunk(
  'recibos/updateRecibo',
  async ({ id, recibo }: { id: number; recibo: Partial<Recibo> }) => {
    const result = await recibosAPI.update(id, recibo);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const deleteRecibo = createAsyncThunk(
  'recibos/deleteRecibo',
  async (id: number) => {
    await recibosAPI.delete(id);
    return id;
  }
);

export const generarRecibo = createAsyncThunk(
  'recibos/generarRecibo',
  async (request: GenerarReciboRequest) => {
    const result = await recibosAPI.generarRecibo(request);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const pagarRecibo = createAsyncThunk(
  'recibos/pagarRecibo',
  async (request: PagarReciboRequest) => {
    const result = await recibosAPI.pagarRecibo(request);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const generarPdfRecibo = createAsyncThunk(
  'recibos/generarPdfRecibo',
  async (reciboId: number) => {
    const result = await recibosAPI.generarPdf(reciboId);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const enviarRecibo = createAsyncThunk(
  'recibos/enviarRecibo',
  async ({ reciboId, email }: { reciboId: number; email?: string }) => {
    await recibosAPI.enviarRecibo(reciboId, email);
    return reciboId;
  }
);

export const anularRecibo = createAsyncThunk(
  'recibos/anularRecibo',
  async ({ reciboId, motivo }: { reciboId: number; motivo: string }) => {
    const result = await recibosAPI.anularRecibo(reciboId, motivo);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

const recibosSlice = createSlice({
  name: 'recibos',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<RecibosFilters>) => {
      state.filters = action.payload;
      state.filteredRecibos = state.recibos.filter(recibo => {
        const filters = action.payload;
        if (filters.estado && recibo.estado !== filters.estado) return false;
        if (filters.personaTipo && recibo.personaTipo !== filters.personaTipo) return false;
        if (filters.personaId && recibo.personaId !== filters.personaId) return false;
        if (filters.numeroRecibo && !recibo.numero.toLowerCase().includes(filters.numeroRecibo.toLowerCase())) return false;
        if (filters.enviado !== undefined && recibo.enviado !== filters.enviado) return false;
        return true;
      });
    },
    clearFilters: (state) => {
      state.filters = {};
      state.filteredRecibos = state.recibos;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRecibo: (state, action: PayloadAction<Recibo | null>) => {
      state.currentRecibo = action.payload;
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
        state.recibos = action.payload;
        state.filteredRecibos = action.payload;

        // Calcular estadísticas
        state.totalRecibos = action.payload.length;
        state.totalFacturado = action.payload.reduce((sum, r) => sum + r.total, 0);
        state.totalCobrado = action.payload
          .filter(r => r.estado === 'pagado')
          .reduce((sum, r) => sum + r.montoPagado, 0);
        state.totalPendiente = action.payload
          .filter(r => r.estado === 'pendiente' || r.estado === 'vencido' || r.estado === 'parcial')
          .reduce((sum, r) => sum + (r.total - r.montoPagado), 0);

        state.estadisticas = {
          pendientes: action.payload.filter(r => r.estado === 'pendiente').length,
          pagados: action.payload.filter(r => r.estado === 'pagado').length,
          vencidos: action.payload.filter(r => r.estado === 'vencido').length,
          cancelados: action.payload.filter(r => r.estado === 'cancelado').length,
          parciales: action.payload.filter(r => r.estado === 'parcial').length,
          facturacionMensual: action.payload.reduce((acc, r) => {
            const mes = r.fechaEmision.substring(0, 7);
            acc[mes] = (acc[mes] || 0) + r.total;
            return acc;
          }, {} as { [key: string]: number }),
          cobranzaMensual: action.payload
            .filter(r => r.estado === 'pagado' && r.fechaPago)
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
      });
  },
});

export const { setFilters, clearFilters, clearError, setCurrentRecibo } = recibosSlice.actions;
export default recibosSlice.reducer;