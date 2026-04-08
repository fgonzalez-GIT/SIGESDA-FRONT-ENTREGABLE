import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}));

// Import after mock
import pagosActividadesService from '../pagosActividadesService';

describe('pagosActividadesService.bulkDeletePagosActividades', () => {
  let mockDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const axiosInstance = (axios.create as ReturnType<typeof vi.fn>)();
    mockDelete = axiosInstance.delete as ReturnType<typeof vi.fn>;
  });

  it('should delete multiple pagos successfully with reciboIds', async () => {
    const ids = [4, 5, 6];
    const mockResponse = {
      data: {
        success: true,
        message: '3 pagos de actividades eliminados exitosamente',
        data: {
          count: 3,
          reciboIds: [226, 227, 228]
        }
      }
    };

    mockDelete.mockResolvedValue(mockResponse);

    const result = await pagosActividadesService.bulkDeletePagosActividades(ids);

    expect(mockDelete).toHaveBeenCalledWith('/bulk', { data: { ids } });
    expect(result).toEqual({
      count: 3,
      reciboIds: [226, 227, 228]
    });
  });

  it('should delete a single pago', async () => {
    const ids = [10];
    const mockResponse = {
      data: {
        success: true,
        message: '1 pago de actividad eliminado exitosamente',
        data: {
          count: 1,
          reciboIds: [100]
        }
      }
    };

    mockDelete.mockResolvedValue(mockResponse);

    const result = await pagosActividadesService.bulkDeletePagosActividades(ids);

    expect(mockDelete).toHaveBeenCalledWith('/bulk', { data: { ids: [10] } });
    expect(result.count).toBe(1);
    expect(result.reciboIds).toEqual([100]);
  });

  it('should delete exactly 100 pagos', async () => {
    const ids = Array.from({ length: 100 }, (_, i) => i + 1);
    const reciboIds = Array.from({ length: 100 }, (_, i) => i + 1000);
    const mockResponse = {
      data: {
        success: true,
        message: '100 pagos eliminados exitosamente',
        data: {
          count: 100,
          reciboIds
        }
      }
    };

    mockDelete.mockResolvedValue(mockResponse);

    const result = await pagosActividadesService.bulkDeletePagosActividades(ids);

    expect(mockDelete).toHaveBeenCalledWith('/bulk', { data: { ids } });
    expect(result.count).toBe(100);
    expect(result.reciboIds).toHaveLength(100);
  });

  it('should handle response without data field', async () => {
    const ids = [20, 30];
    const mockResponse = {
      data: {
        success: true,
        message: '2 pagos eliminados'
      }
    };

    mockDelete.mockResolvedValue(mockResponse);

    const result = await pagosActividadesService.bulkDeletePagosActividades(ids);

    // Should fallback to default values
    expect(result).toEqual({ count: 2, reciboIds: [] });
  });

  it('should throw error when pago has paid status', async () => {
    const ids = [1, 2, 3];
    const errorResponse = {
      response: {
        status: 400,
        data: {
          success: false,
          error: 'No se pueden eliminar los siguientes pagos:\nID 2: recibo ya pagado'
        }
      }
    };

    mockDelete.mockRejectedValue(errorResponse);

    await expect(pagosActividadesService.bulkDeletePagosActividades(ids)).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          error: expect.stringContaining('pagado')
        }
      }
    });

    expect(mockDelete).toHaveBeenCalledWith('/bulk', { data: { ids } });
  });

  it('should throw error when pago ID does not exist', async () => {
    const ids = [999999];
    const errorResponse = {
      response: {
        status: 404,
        data: {
          success: false,
          error: 'No se pueden eliminar los siguientes pagos:\nID 999999: no encontrado'
        }
      }
    };

    mockDelete.mockRejectedValue(errorResponse);

    await expect(pagosActividadesService.bulkDeletePagosActividades(ids)).rejects.toMatchObject({
      response: {
        status: 404,
        data: {
          error: expect.stringContaining('no encontrado')
        }
      }
    });
  });

  it('should throw error for invalid IDs (empty array)', async () => {
    const ids: number[] = [];
    const errorResponse = {
      response: {
        status: 400,
        data: {
          success: false,
          error: 'Debe proporcionar al menos un ID'
        }
      }
    };

    mockDelete.mockRejectedValue(errorResponse);

    await expect(pagosActividadesService.bulkDeletePagosActividades(ids)).rejects.toMatchObject({
      response: {
        status: 400
      }
    });
  });

  it('should throw error for more than 100 IDs', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => i + 1);
    const errorResponse = {
      response: {
        status: 400,
        data: {
          success: false,
          error: 'No puede eliminar más de 100 pagos a la vez'
        }
      }
    };

    mockDelete.mockRejectedValue(errorResponse);

    await expect(pagosActividadesService.bulkDeletePagosActividades(ids)).rejects.toMatchObject({
      response: {
        status: 400
      }
    });
  });

  it('should apply atomicity (todo-o-nada)', async () => {
    // Si un pago no puede eliminarse, ninguno debería eliminarse
    const ids = [10, 20, 999]; // 999 no existe
    const errorResponse = {
      response: {
        status: 404,
        data: {
          success: false,
          error: 'No se pueden eliminar los siguientes pagos:\nID 999: no encontrado'
        }
      }
    };

    mockDelete.mockRejectedValue(errorResponse);

    await expect(pagosActividadesService.bulkDeletePagosActividades(ids)).rejects.toMatchObject({
      response: {
        status: 404
      }
    });

    // Verificar que se llamó una sola vez (no reintentos)
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('should handle mixed validation errors', async () => {
    const ids = [1, 2, 3];
    const errorResponse = {
      response: {
        status: 400,
        data: {
          success: false,
          error: 'No se pueden eliminar los siguientes pagos:\nID 1: recibo ya pagado\nID 3: no encontrado'
        }
      }
    };

    mockDelete.mockRejectedValue(errorResponse);

    await expect(pagosActividadesService.bulkDeletePagosActividades(ids)).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          error: expect.stringContaining('pagado')
        }
      }
    });
  });

  it('should handle network errors', async () => {
    const ids = [1, 2, 3];
    const networkError = new Error('Network Error');

    mockDelete.mockRejectedValue(networkError);

    await expect(pagosActividadesService.bulkDeletePagosActividades(ids)).rejects.toThrow('Network Error');
  });

  it('should handle server errors (500)', async () => {
    const ids = [1, 2];
    const errorResponse = {
      response: {
        status: 500,
        data: {
          success: false,
          error: 'Error interno del servidor'
        }
      }
    };

    mockDelete.mockRejectedValue(errorResponse);

    await expect(pagosActividadesService.bulkDeletePagosActividades(ids)).rejects.toMatchObject({
      response: {
        status: 500
      }
    });
  });

  it('should handle response with empty reciboIds array', async () => {
    const ids = [50];
    const mockResponse = {
      data: {
        success: true,
        message: '1 pago eliminado',
        data: {
          count: 1,
          reciboIds: []
        }
      }
    };

    mockDelete.mockResolvedValue(mockResponse);

    const result = await pagosActividadesService.bulkDeletePagosActividades(ids);

    expect(result.count).toBe(1);
    expect(result.reciboIds).toEqual([]);
  });
});
