import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Actividad {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: 'CORO' | 'CLASE_CANTO' | 'CLASE_INSTRUMENTO' | 'TALLER' | 'EVENTO' | 'coro' | 'clase' | 'taller' | 'evento';
  categoria: 'infantil' | 'juvenil' | 'adulto' | 'general';
  docenteId?: number;
  docenteNombre?: string;
  aulaId?: number;
  aulaNombre?: string;
  diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  horaInicio: string; // HH:mm format
  horaFin: string; // HH:mm format
  fechaInicio: string; // YYYY-MM-DD
  fechaFin?: string; // YYYY-MM-DD
  cupoMaximo?: number;
  cupoActual: number;
  estado: 'activo' | 'inactivo' | 'suspendido' | 'finalizado';
  costo?: number;
  observaciones?: string;
  fechaCreacion: string;
}

interface ActividadesState {
  actividades: Actividad[];
  loading: boolean;
  error: string | null;
  selectedActividad: Actividad | null;
  filters: {
    tipo?: string;
    categoria?: string;
    estado?: string;
    docenteId?: number;
  };
}

const initialState: ActividadesState = {
  actividades: [],
  loading: false,
  error: null,
  selectedActividad: null,
  filters: {},
};

export const fetchActividades = createAsyncThunk(
  'actividades/fetchActividades',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/actividades?` + new URLSearchParams(params || {}));
      if (!response.ok) {
        throw new Error('Error al cargar actividades');
      }
      const result = await response.json();
      // Validación robusta: asegurar que siempre retornamos un array
      if (Array.isArray(result)) return result;
      if (Array.isArray(result.data)) return result.data;
      if (result?.data?.data && Array.isArray(result.data.data)) return result.data.data;
      console.warn('⚠️ API devolvió estructura inesperada para actividades:', result);
      return [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error desconocido');
    }
  }
);

export const createActividad = createAsyncThunk(
  'actividades/createActividad',
  async (actividad: Omit<Actividad, 'id' | 'cupoActual' | 'fechaCreacion'>, { rejectWithValue }) => {
    try {
      // Transformar datos del frontend al formato del backend
      const backendData = {
        nombre: actividad.nombre,
        tipo: actividad.tipo.toUpperCase(),
        descripcion: actividad.descripcion || undefined,
        precio: actividad.costo || 0,
        capacidadMaxima: actividad.cupoMaximo || undefined,
        activa: actividad.estado === 'activo',
        docenteIds: actividad.docenteId ? [String(actividad.docenteId)] : [],
        horarios: actividad.diaSemana ? [{
          diaSemana: actividad.diaSemana.toUpperCase(),
          horaInicio: actividad.horaInicio,
          horaFin: actividad.horaFin,
          activo: true
        }] : []
      };

      // Limpiar campos undefined
      const cleanData = Object.fromEntries(
        Object.entries(backendData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      const response = await fetch(`${import.meta.env.VITE_API_URL}/actividades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Error al crear actividad';
        console.error('Error creating actividad:', errorData);
        throw new Error(errorMessage);
      }
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error desconocido');
    }
  }
);

export const updateActividad = createAsyncThunk(
  'actividades/updateActividad',
  async (actividad: Actividad, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/actividades/${actividad.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actividad),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar actividad');
      }
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error desconocido');
    }
  }
);

export const deleteActividad = createAsyncThunk(
  'actividades/deleteActividad',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/actividades/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Error al eliminar actividad');
      }
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error desconocido');
    }
  }
);

export const duplicateActividad = createAsyncThunk(
  'actividades/duplicateActividad',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/actividades/${id}/duplicate`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Error al duplicar actividad');
      }
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error desconocido');
    }
  }
);

const actividadesSlice = createSlice({
  name: 'actividades',
  initialState,
  reducers: {
    setSelectedActividad: (state, action: PayloadAction<Actividad | null>) => {
      state.selectedActividad = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<ActividadesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    /**
     * NUEVO: Decrementar cupos tras inscripción exitosa
     * Actualiza cupoActual cuando se inscribe un participante
     */
    decrementarCupos: (state, action: PayloadAction<number>) => {
      const actividad = state.actividades.find((a) => a.id === action.payload);
      if (actividad && actividad.cupoMaximo) {
        // Incrementar cupoActual (inscriptos)
        actividad.cupoActual = (actividad.cupoActual || 0) + 1;
      }
    },
    /**
     * NUEVO: Incrementar cupos tras eliminar inscripción
     */
    incrementarCupos: (state, action: PayloadAction<number>) => {
      const actividad = state.actividades.find((a) => a.id === action.payload);
      if (actividad && actividad.cupoActual > 0) {
        actividad.cupoActual -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch actividades
      .addCase(fetchActividades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActividades.fulfilled, (state, action) => {
        state.loading = false;
        state.actividades = action.payload;
      })
      .addCase(fetchActividades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create actividad
      .addCase(createActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createActividad.fulfilled, (state, action) => {
        state.loading = false;
        state.actividades.push(action.payload);
      })
      .addCase(createActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update actividad
      .addCase(updateActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateActividad.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.actividades.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.actividades[index] = action.payload;
        }
      })
      .addCase(updateActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete actividad
      .addCase(deleteActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteActividad.fulfilled, (state, action) => {
        state.loading = false;
        state.actividades = state.actividades.filter(a => a.id !== action.payload);
      })
      .addCase(deleteActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Duplicate actividad
      .addCase(duplicateActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(duplicateActividad.fulfilled, (state, action) => {
        state.loading = false;
        state.actividades.push(action.payload);
      })
      .addCase(duplicateActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedActividad,
  clearError,
  setFilters,
  clearFilters,
  decrementarCupos,
  incrementarCupos,
} = actividadesSlice.actions;

export default actividadesSlice.reducer;