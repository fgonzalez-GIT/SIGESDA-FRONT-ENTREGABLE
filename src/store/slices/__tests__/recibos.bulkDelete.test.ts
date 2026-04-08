import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import recibosReducer, {
  bulkDeleteRecibos,
  clearBulkDeleteError
} from '../recibosSlice';
import type { Recibo } from '../recibosSlice';

// Mock recibosService
vi.mock('../../services/recibosService', () => ({
  default: {
    bulkDeleteRecibos: vi.fn()
  }
}));

import recibosService from '../../../services/recibosService';

// Helper to create a mock store
const createMockStore = (preloadedState?: any) => {
  return configureStore({
    reducer: { recibos: recibosReducer },
    preloadedState
  });
};

// Mock recibos for testing
const mockRecibo1: Recibo = {
  id: 1,
  numero: 'REC-2024-001',
  fecha: new Date('2024-01-15'),
  fechaVencimiento: new Date('2024-02-15'),
  montoTotal: 5000,
  montoPagado: 0,
  estado: 'pendiente',
  receptor: {
    id: 10,
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '12345678',
    email: 'juan@example.com',
    telefono: '123456789',
    direccion: 'Calle 123',
    tipoPersona: 'socio'
  },
  conceptos: [],
  mediosPago: []
};

const mockRecibo2: Recibo = {
  ...mockRecibo1,
  id: 2,
  numero: 'REC-2024-002',
  montoTotal: 3000
};

const mockRecibo3: Recibo = {
  ...mockRecibo1,
  id: 3,
  numero: 'REC-2024-003',
  montoTotal: 4500
};

describe('recibosSlice - bulkDelete', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createMockStore({
      recibos: {
        recibos: [mockRecibo1, mockRecibo2, mockRecibo3],
        filteredRecibos: [mockRecibo1, mockRecibo2, mockRecibo3],
        filters: { page: 1, limit: 20 },
        pagination: { total: 3, pages: 1, currentPage: 1, limit: 20 },
        loading: false,
        error: null,
        totalRecibos: 3,
        totalFacturado: 12500,
        totalCobrado: 0,
        estadisticas: {
          totalRecibos: 3,
          recibosImpagas: 3,
          recibosPagadas: 0,
          facturacionMensual: {},
          cobranzaMensual: {}
        },
        currentRecibo: null,
        generatingPdf: false,
        bulkDeleteLoading: false,
        bulkDeleteError: null
      }
    });
  });

  describe('Initial State', () => {
    it('should have correct bulkDelete initial state', () => {
      const state = store.getState().recibos;

      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBeNull();
    });
  });

  describe('Synchronous Actions', () => {
    it('should handle clearBulkDeleteError', () => {
      const storeWithError = createMockStore({
        recibos: {
          recibos: [],
          filteredRecibos: [],
          bulkDeleteLoading: false,
          bulkDeleteError: 'Test error'
        }
      });

      storeWithError.dispatch(clearBulkDeleteError());

      const state = storeWithError.getState().recibos;
      expect(state.bulkDeleteError).toBeNull();
    });
  });

  describe('Async Thunk - bulkDeleteRecibos', () => {
    it('should handle bulkDeleteRecibos.pending', () => {
      store.dispatch(bulkDeleteRecibos.pending('', [1, 2]));

      const state = store.getState().recibos;
      expect(state.bulkDeleteLoading).toBe(true);
      expect(state.bulkDeleteError).toBeNull();
    });

    it('should handle bulkDeleteRecibos.fulfilled - single recibo', async () => {
      const idsToDelete = [1];
      const mockResponse = { count: 1 };

      vi.mocked(recibosService.bulkDeleteRecibos).mockResolvedValue(mockResponse);

      await store.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = store.getState().recibos;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBeNull();
      expect(state.recibos).toHaveLength(2);
      expect(state.recibos.find(r => r.id === 1)).toBeUndefined();
      expect(state.totalRecibos).toBe(2);
      expect(state.pagination.total).toBe(2);
    });

    it('should handle bulkDeleteRecibos.fulfilled - multiple recibos', async () => {
      const idsToDelete = [1, 2];
      const mockResponse = { count: 2 };

      vi.mocked(recibosService.bulkDeleteRecibos).mockResolvedValue(mockResponse);

      await store.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = store.getState().recibos;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.recibos).toHaveLength(1);
      expect(state.recibos[0].id).toBe(3);
      expect(state.totalRecibos).toBe(1);
      expect(state.pagination.total).toBe(1);
    });

    it('should handle bulkDeleteRecibos.fulfilled - all recibos', async () => {
      const idsToDelete = [1, 2, 3];
      const mockResponse = { count: 3 };

      vi.mocked(recibosService.bulkDeleteRecibos).mockResolvedValue(mockResponse);

      await store.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = store.getState().recibos;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.recibos).toHaveLength(0);
      expect(state.filteredRecibos).toHaveLength(0);
      expect(state.totalRecibos).toBe(0);
      expect(state.pagination.total).toBe(0);
    });

    it('should handle bulkDeleteRecibos.rejected - recibo already paid', async () => {
      const idsToDelete = [1, 2];
      const errorMessage = 'No se pueden eliminar los siguientes recibos (pagados o con pagos registrados): 2';

      vi.mocked(recibosService.bulkDeleteRecibos).mockRejectedValue({
        response: {
          status: 400,
          data: { error: errorMessage }
        }
      });

      await store.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = store.getState().recibos;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe(errorMessage);
      // State should remain unchanged (todo-o-nada)
      expect(state.recibos).toHaveLength(3);
      expect(state.totalRecibos).toBe(3);
    });

    it('should handle bulkDeleteRecibos.rejected - recibo not found', async () => {
      const idsToDelete = [999];
      const errorMessage = 'No se pueden eliminar los siguientes recibos:\nID 999: no encontrado';

      vi.mocked(recibosService.bulkDeleteRecibos).mockRejectedValue({
        response: {
          status: 404,
          data: { error: errorMessage }
        }
      });

      await store.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = store.getState().recibos;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe(errorMessage);
      // State should remain unchanged
      expect(state.recibos).toHaveLength(3);
    });

    it('should handle bulkDeleteRecibos.rejected - empty array', async () => {
      const idsToDelete: number[] = [];
      const errorMessage = 'Debe proporcionar al menos un ID';

      vi.mocked(recibosService.bulkDeleteRecibos).mockRejectedValue({
        response: {
          status: 400,
          data: { error: errorMessage }
        }
      });

      await store.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = store.getState().recibos;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe(errorMessage);
    });

    it('should handle bulkDeleteRecibos.rejected - more than 100 IDs', async () => {
      const idsToDelete = Array.from({ length: 101 }, (_, i) => i + 1);
      const errorMessage = 'No puede eliminar más de 100 recibos a la vez';

      vi.mocked(recibosService.bulkDeleteRecibos).mockRejectedValue({
        response: {
          status: 400,
          data: { error: errorMessage }
        }
      });

      await store.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = store.getState().recibos;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe(errorMessage);
    });

    it('should handle bulkDeleteRecibos.rejected - generic error', async () => {
      const idsToDelete = [1, 2];

      vi.mocked(recibosService.bulkDeleteRecibos).mockRejectedValue(
        new Error('Network Error')
      );

      await store.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = store.getState().recibos;
      expect(state.bulkDeleteLoading).toBe(false);
      expect(state.bulkDeleteError).toBe('Error al eliminar recibos');
    });

    it('should update filteredRecibos when recibos are deleted', async () => {
      const idsToDelete = [2];
      const mockResponse = { count: 1 };

      vi.mocked(recibosService.bulkDeleteRecibos).mockResolvedValue(mockResponse);

      await store.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = store.getState().recibos;
      expect(state.recibos).toHaveLength(2);
      expect(state.filteredRecibos).toHaveLength(2);
      expect(state.filteredRecibos.find(r => r.id === 2)).toBeUndefined();
    });

    it('should not set negative values for totalRecibos or pagination.total', async () => {
      // Create store with 2 recibos but totalRecibos = 1 (edge case)
      const storeEdgeCase = createMockStore({
        recibos: {
          recibos: [mockRecibo1, mockRecibo2],
          filteredRecibos: [mockRecibo1, mockRecibo2],
          totalRecibos: 1,
          pagination: { total: 1, pages: 1, currentPage: 1, limit: 20 },
          bulkDeleteLoading: false,
          bulkDeleteError: null
        }
      });

      const idsToDelete = [1, 2];
      const mockResponse = { count: 2 };

      vi.mocked(recibosService.bulkDeleteRecibos).mockResolvedValue(mockResponse);

      await storeEdgeCase.dispatch(bulkDeleteRecibos(idsToDelete));

      const state = storeEdgeCase.getState().recibos;
      expect(state.totalRecibos).toBe(0); // Math.max(0, 1 - 2)
      expect(state.pagination.total).toBe(0);
    });
  });
});
