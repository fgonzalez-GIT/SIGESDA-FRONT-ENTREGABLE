import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import cuotasReducer, {
  fetchCuotas,
  fetchCuotaById,
  fetchDashboard,
  setFilters,
  clearError
} from '../cuotasSlice';
import type { Cuota, DashboardData } from '../../../types/cuota.types';

// Helper to create a mock store
const createMockStore = (preloadedState?: any) => {
  return configureStore({
    reducer: { cuotas: cuotasReducer },
    preloadedState
  });
};

describe('cuotasSlice', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().cuotas;

      expect(state.cuotas).toEqual([]);
      expect(state.selectedCuota).toBeNull();
      expect(state.dashboardData).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.filters).toEqual({
        page: 1,
        limit: 20,
        soloImpagas: false
      });
      expect(state.pagination).toEqual({
        total: 0,
        pages: 0,
        currentPage: 1,
        limit: 20
      });
    });
  });

  describe('Synchronous Actions', () => {
    it('should handle setFilters', () => {
      const newFilters = { mes: 1, anio: 2024, categoria: 'ACTIVO' };

      store.dispatch(setFilters(newFilters));

      const state = store.getState().cuotas;
      expect(state.filters.mes).toBe(1);
      expect(state.filters.anio).toBe(2024);
      expect(state.filters.categoria).toBe('ACTIVO');
    });

    it('should handle clearError', () => {
      // First set error state
      const storeWithError = createMockStore({
        cuotas: { error: 'Test error', loading: false, cuotas: [] }
      });

      storeWithError.dispatch(clearError());

      const state = storeWithError.getState().cuotas;
      expect(state.error).toBeNull();
    });
  });

  describe('Async Thunks - fetchCuotas', () => {
    it('should handle fetchCuotas.pending', () => {
      store.dispatch(fetchCuotas.pending('', {}));

      const state = store.getState().cuotas;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fetchCuotas.fulfilled', () => {
      const mockData = {
        data: [
          {
            id: 1,
            mes: 1,
            anio: 2024,
            montoTotal: 5000,
            reciboId: 1,
            categoriaId: 1
          } as Cuota,
          {
            id: 2,
            mes: 1,
            anio: 2024,
            montoTotal: 4000,
            reciboId: 2,
            categoriaId: 2
          } as Cuota
        ],
        total: 2,
        pages: 1,
        currentPage: 1
      };

      store.dispatch(fetchCuotas.fulfilled(mockData, '', {}));

      const state = store.getState().cuotas;
      expect(state.loading).toBe(false);
      expect(state.cuotas).toHaveLength(2);
      expect(state.cuotas[0].id).toBe(1);
      expect(state.pagination.total).toBe(2);
      expect(state.pagination.pages).toBe(1);
    });

    it('should handle fetchCuotas.rejected', () => {
      const errorMessage = 'Error al cargar cuotas';

      store.dispatch(fetchCuotas.rejected(new Error(errorMessage), '', {}, errorMessage));

      const state = store.getState().cuotas;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('Async Thunks - fetchCuotaById', () => {
    it('should handle fetchCuotaById.fulfilled', () => {
      const mockCuota: Cuota = {
        id: 1,
        mes: 1,
        anio: 2024,
        montoTotal: 5000,
        montoBase: 4000,
        montoActividades: 1000,
        reciboId: 1,
        categoriaId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      store.dispatch(fetchCuotaById.fulfilled(mockCuota, '', 1));

      const state = store.getState().cuotas;
      expect(state.selectedCuota).toEqual(mockCuota);
      expect(state.selectedCuota?.id).toBe(1);
    });
  });

  describe('Async Thunks - fetchDashboard', () => {
    it('should handle fetchDashboard.fulfilled', () => {
      const mockDashboardData: DashboardData = {
        periodo: {
          mes: 1,
          anio: 2024,
          nombreMes: 'Enero'
        },
        metricas: {
          totalCuotas: 50,
          totalRecaudado: 250000,
          totalPendiente: 50000,
          totalDescuentos: 20000,
          promedioMonto: 5000,
          tasaCobro: 80
        },
        distribucion: {
          porEstado: {
            PAGADO: { cantidad: 40, monto: 200000 },
            PENDIENTE: { cantidad: 8, monto: 40000 },
            VENCIDO: { cantidad: 2, monto: 10000 },
            ANULADO: { cantidad: 0, monto: 0 }
          },
          porCategoria: {
            ACTIVO: { cantidad: 30, monto: 150000 },
            ESTUDIANTE: { cantidad: 15, monto: 75000 },
            JUBILADO: { cantidad: 5, monto: 25000 }
          }
        },
        tendencias: {
          variacionMesAnterior: 5.5,
          proyeccionRecaudacion: 260000
        }
      };

      store.dispatch(fetchDashboard.fulfilled(mockDashboardData, '', { mes: 1, anio: 2024 }));

      const state = store.getState().cuotas;
      expect(state.dashboardData).toEqual(mockDashboardData);
      expect(state.dashboardData?.metricas.totalCuotas).toBe(50);
      expect(state.dashboardData?.distribucion.porEstado.PAGADO.cantidad).toBe(40);
    });
  });

  describe('State Transitions', () => {
    it('should handle multiple filter changes', () => {
      store.dispatch(setFilters({ mes: 1, anio: 2024 }));
      store.dispatch(setFilters({ categoria: 'ACTIVO' }));
      store.dispatch(setFilters({ soloImpagas: true }));

      const state = store.getState().cuotas;
      expect(state.filters.mes).toBe(1);
      expect(state.filters.anio).toBe(2024);
      expect(state.filters.categoria).toBe('ACTIVO');
      expect(state.filters.soloImpagas).toBe(true);
    });

    it('should maintain state integrity during async operations', async () => {
      // Start with pending state
      store.dispatch(fetchCuotas.pending('', {}));
      expect(store.getState().cuotas.loading).toBe(true);

      // Fulfill with data
      const mockData = {
        data: [{ id: 1, mes: 1, anio: 2024, montoTotal: 5000 } as Cuota],
        total: 1,
        pages: 1,
        currentPage: 1
      };

      store.dispatch(fetchCuotas.fulfilled(mockData, '', {}));

      const state = store.getState().cuotas;
      expect(state.loading).toBe(false);
      expect(state.cuotas).toHaveLength(1);
      expect(state.error).toBeNull();
    });
  });
});
