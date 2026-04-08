import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import pagosActividadesReducer, {
  bulkDeletePagosActividades,
  clearBulkDeleteError
} from '../pagosActividadesSlice';
import type { PagoActividad } from '@/types/pagosActividades.types';

// Mock pagosActividadesService
vi.mock('../../../services/pagosActividadesService', () => ({
  default: {
    bulkDeletePagosActividades: vi.fn()
  }
}));

import pagosActividadesService from '../../../services/pagosActividadesService';

// Helper to create a mock store
const createMockStore = (preloadedState?: any) => {
  return configureStore({
    reducer: { pagosActividades: pagosActividadesReducer },
    preloadedState
  });
};

// Mock pagos for testing
const mockPago1: PagoActividad = {
  id: 4,
  reciboId: 100,
  fecha: new Date('2024-01-15'),
  monto: 5000,
  participacionId: 50,
  participacion: {
    id: 50,
    actividadId: 20,
    personaId: 10,
    fechaInscripcion: new Date('2024-01-01'),
    estado: 'ACTIVO',
    honorarioMensual: 5000
  }
};

const mockPago2: PagoActividad = {
  ...mockPago1,
  id: 5,
  reciboId: 101,
  monto: 3000
};

const mockPago3: PagoActividad = {
  ...mockPago1,
  id: 6,
  reciboId: 102,
  monto: 4500
};

describe('pagosActividadesSlice - bulkDelete', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createMockStore({
      pagosActividades: {
        pagos: [mockPago1, mockPago2, mockPago3],
        selectedPago: null,
        filters: { page: 1, limit: 20 },
        pagination: { total: 3, pages: 1, currentPage: 1, limit: 20 },
        estadisticas: null,
        loading: false,
        error: null,
        operationLoading: false,
        lastGeneration: null,
        bulkDeleteLoading: false,
        bulkDeleteError: null
      }
    });
  });

  describe('Initial State', () => {
    it('should have correct bulkDelete initial state', () => {
      const state = store.getState().pagosActividades;

      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBeNull();
    });
  });

  describe('Synchronous Actions', () => {
    it('should handle clearBulkDeleteError', () => {
      const storeWithError = createMockStore({
        pagosActividades: {
          pagos: [],
          bulkDeleteLoading: false,
          bulkDeleteError: 'Test error'
        }
      });

      storeWithError.dispatch(clearBulkDeleteError());

      const state = storeWithError.getState().pagosActividades;
      expect(state.bulkDeleteError).toBeNull();
    });
  });

  describe('Async Thunk - bulkDeletePagosActividades', () => {
    it('should handle bulkDeletePagosActividades.pending', () => {
      store.dispatch(bulkDeletePagosActividades.pending('', [4, 5]));

      const state = store.getState().pagosActividades;
      expect(state.bulkDeleteLoading).toBe(true);
      expect(state.bulkDeleteError).toBeNull();
    });

    it('should handle bulkDeletePagosActividades.fulfilled - single pago', async () => {
      const idsToDelete = [4];
      const mockResponse = {
        count: 1,
        reciboIds: [100]
      };

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockResolvedValue(mockResponse);

      await store.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = store.getState().pagosActividades;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBeNull();
      expect(state.pagos).toHaveLength(2);
      expect(state.pagos.find(p => p.id === 4)).toBeUndefined();
      expect(state.pagination.total).toBe(2);
    });

    it('should handle bulkDeletePagosActividades.fulfilled - multiple pagos', async () => {
      const idsToDelete = [4, 5];
      const mockResponse = {
        count: 2,
        reciboIds: [100, 101]
      };

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockResolvedValue(mockResponse);

      await store.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = store.getState().pagosActividades;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.pagos).toHaveLength(1);
      expect(state.pagos[0].id).toBe(6);
      expect(state.pagination.total).toBe(1);
    });

    it('should handle bulkDeletePagosActividades.fulfilled - all pagos', async () => {
      const idsToDelete = [4, 5, 6];
      const mockResponse = {
        count: 3,
        reciboIds: [100, 101, 102]
      };

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockResolvedValue(mockResponse);

      await store.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = store.getState().pagosActividades;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.pagos).toHaveLength(0);
      expect(state.pagination.total).toBe(0);
    });

    it('should clear selectedPago if it was deleted', async () => {
      // Set selectedPago first
      const storeWithSelection = createMockStore({
        pagosActividades: {
          pagos: [mockPago1, mockPago2, mockPago3],
          selectedPago: mockPago2, // ID 5
          pagination: { total: 3, pages: 1, currentPage: 1, limit: 20 },
          bulkDeleteLoading: false,
          bulkDeleteError: null
        }
      });

      const idsToDelete = [5];
      const mockResponse = {
        count: 1,
        reciboIds: [101]
      };

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockResolvedValue(mockResponse);

      await storeWithSelection.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = storeWithSelection.getState().pagosActividades;
      expect(state.selectedPago).toBeNull();
      expect(state.pagos).toHaveLength(2);
    });

    it('should NOT clear selectedPago if it was not deleted', async () => {
      // Set selectedPago first
      const storeWithSelection = createMockStore({
        pagosActividades: {
          pagos: [mockPago1, mockPago2, mockPago3],
          selectedPago: mockPago3, // ID 6
          pagination: { total: 3, pages: 1, currentPage: 1, limit: 20 },
          bulkDeleteLoading: false,
          bulkDeleteError: null
        }
      });

      const idsToDelete = [4, 5];
      const mockResponse = {
        count: 2,
        reciboIds: [100, 101]
      };

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockResolvedValue(mockResponse);

      await storeWithSelection.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = storeWithSelection.getState().pagosActividades;
      expect(state.selectedPago).not.toBeNull();
      expect(state.selectedPago?.id).toBe(6);
    });

    it('should handle bulkDeletePagosActividades.rejected - pago already paid', async () => {
      const idsToDelete = [4, 5];
      const errorMessage = 'No se pueden eliminar los siguientes pagos:\nID 5: recibo ya pagado';

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockRejectedValue({
        response: {
          status: 400,
          data: { error: errorMessage }
        }
      });

      await store.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = store.getState().pagosActividades;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe(errorMessage);
      // State should remain unchanged (todo-o-nada)
      expect(state.pagos).toHaveLength(3);
    });

    it('should handle bulkDeletePagosActividades.rejected - pago not found', async () => {
      const idsToDelete = [999];
      const errorMessage = 'No se pueden eliminar los siguientes pagos:\nID 999: no encontrado';

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockRejectedValue({
        response: {
          status: 404,
          data: { error: errorMessage }
        }
      });

      await store.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = store.getState().pagosActividades;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe(errorMessage);
      // State should remain unchanged
      expect(state.pagos).toHaveLength(3);
    });

    it('should handle bulkDeletePagosActividades.rejected - empty array', async () => {
      const idsToDelete: number[] = [];
      const errorMessage = 'Debe proporcionar al menos un ID';

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockRejectedValue({
        response: {
          status: 400,
          data: { error: errorMessage }
        }
      });

      await store.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = store.getState().pagosActividades;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe(errorMessage);
    });

    it('should handle bulkDeletePagosActividades.rejected - more than 100 IDs', async () => {
      const idsToDelete = Array.from({ length: 101 }, (_, i) => i + 1);
      const errorMessage = 'No puede eliminar más de 100 pagos a la vez';

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockRejectedValue({
        response: {
          status: 400,
          data: { error: errorMessage }
        }
      });

      await store.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = store.getState().pagosActividades;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe(errorMessage);
    });

    it('should handle bulkDeletePagosActividades.rejected - generic error', async () => {
      const idsToDelete = [4, 5];

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockRejectedValue(
        new Error('Network Error')
      );

      await store.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = store.getState().pagosActividades;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe('Error al eliminar pagos de actividades');
    });

    it('should not set negative values for pagination.total', async () => {
      // Create store with edge case
      const storeEdgeCase = createMockStore({
        pagosActividades: {
          pagos: [mockPago1, mockPago2],
          pagination: { total: 1, pages: 1, currentPage: 1, limit: 20 },
          bulkDeleteLoading: false,
          bulkDeleteError: null
        }
      });

      const idsToDelete = [4, 5];
      const mockResponse = {
        count: 2,
        reciboIds: [100, 101]
      };

      vi.mocked(pagosActividadesService.bulkDeletePagosActividades).mockResolvedValue(mockResponse);

      await storeEdgeCase.dispatch(bulkDeletePagosActividades(idsToDelete));

      const state = storeEdgeCase.getState().pagosActividades;
      expect(state.pagination.total).toBe(0); // Math.max(0, 1 - 2)
    });
  });
});
