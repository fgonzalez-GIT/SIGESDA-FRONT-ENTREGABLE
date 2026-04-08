import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before imports
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance)
  }
}));

// Import after mock
import recibosService from '../recibosService';

describe('recibosService.bulkDeleteRecibos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete multiple recibos successfully', async () => {
    const ids = [1, 2, 3];
    const mockResponse = {
      data: {
        success: true,
        message: '3 recibos eliminados exitosamente',
        data: {
          count: 3
        }
      }
    };

    mockAxiosInstance.delete.mockResolvedValue(mockResponse);

    const result = await recibosService.bulkDeleteRecibos(ids);

    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/bulk', { data: { ids } });
    expect(result).toEqual({ count: 3 });
  });

  it('should delete a single recibo', async () => {
    const ids = [42];
    const mockResponse = {
      data: {
        success: true,
        message: '1 recibo eliminado exitosamente',
        data: {
          count: 1
        }
      }
    };

    mockAxiosInstance.delete.mockResolvedValue(mockResponse);

    const result = await recibosService.bulkDeleteRecibos(ids);

    expect(mockDelete).toHaveBeenCalledWith('/bulk', { data: { ids: [42] } });
    expect(result.count).toBe(1);
  });

  it('should delete exactly 100 recibos', async () => {
    const ids = Array.from({ length: 100 }, (_, i) => i + 1);
    const mockResponse = {
      data: {
        success: true,
        message: '100 recibos eliminados exitosamente',
        data: {
          count: 100
        }
      }
    };

    mockAxiosInstance.delete.mockResolvedValue(mockResponse);

    const result = await recibosService.bulkDeleteRecibos(ids);

    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/bulk', { data: { ids } });
    expect(result.count).toBe(100);
  });

  it('should handle response without data field', async () => {
    const ids = [10, 20];
    const mockResponse = {
      data: {
        success: true,
        message: '2 recibos eliminados'
      }
    };

    mockAxiosInstance.delete.mockResolvedValue(mockResponse);

    const result = await recibosService.bulkDeleteRecibos(ids);

    // Should fallback to ids.length
    expect(result).toEqual({ count: 2 });
  });

  it('should throw error when recibo is already paid', async () => {
    const ids = [1, 2, 3];
    const errorResponse = {
      response: {
        status: 400,
        data: {
          success: false,
          error: 'No se pueden eliminar los siguientes recibos (pagados o con pagos registrados): 2'
        }
      }
    };

    mockAxiosInstance.delete.mockRejectedValue(errorResponse);

    await expect(recibosService.bulkDeleteRecibos(ids)).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          error: expect.stringContaining('pagados')
        }
      }
    });

    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/bulk', { data: { ids } });
  });

  it('should throw error when recibo has registered payments', async () => {
    const ids = [5, 10];
    const errorResponse = {
      response: {
        status: 400,
        data: {
          success: false,
          error: 'No se pueden eliminar los siguientes recibos (pagados o con pagos registrados): 5, 10'
        }
      }
    };

    mockAxiosInstance.delete.mockRejectedValue(errorResponse);

    await expect(recibosService.bulkDeleteRecibos(ids)).rejects.toMatchObject({
      response: {
        status: 400
      }
    });
  });

  it('should throw error when recibo ID does not exist', async () => {
    const ids = [999999];
    const errorResponse = {
      response: {
        status: 404,
        data: {
          success: false,
          error: 'No se pueden eliminar los siguientes recibos:\nID 999999: no encontrado'
        }
      }
    };

    mockAxiosInstance.delete.mockRejectedValue(errorResponse);

    await expect(recibosService.bulkDeleteRecibos(ids)).rejects.toMatchObject({
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

    mockAxiosInstance.delete.mockRejectedValue(errorResponse);

    await expect(recibosService.bulkDeleteRecibos(ids)).rejects.toMatchObject({
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
          error: 'No puede eliminar más de 100 recibos a la vez'
        }
      }
    };

    mockAxiosInstance.delete.mockRejectedValue(errorResponse);

    await expect(recibosService.bulkDeleteRecibos(ids)).rejects.toMatchObject({
      response: {
        status: 400
      }
    });
  });

  it('should apply atomicity (todo-o-nada)', async () => {
    // Si un recibo no puede eliminarse, ninguno debería eliminarse
    const ids = [1, 2, 999]; // 999 no existe
    const errorResponse = {
      response: {
        status: 404,
        data: {
          success: false,
          error: 'No se pueden eliminar los siguientes recibos:\nID 999: no encontrado'
        }
      }
    };

    mockAxiosInstance.delete.mockRejectedValue(errorResponse);

    await expect(recibosService.bulkDeleteRecibos(ids)).rejects.toMatchObject({
      response: {
        status: 404
      }
    });

    // Verificar que se llamó una sola vez (no reintentos)
    expect(mockAxiosInstance.delete).toHaveBeenCalledTimes(1);
  });

  it('should handle network errors', async () => {
    const ids = [1, 2, 3];
    const networkError = new Error('Network Error');

    mockDelete.mockRejectedValue(networkError);

    await expect(recibosService.bulkDeleteRecibos(ids)).rejects.toThrow('Network Error');
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

    mockAxiosInstance.delete.mockRejectedValue(errorResponse);

    await expect(recibosService.bulkDeleteRecibos(ids)).rejects.toMatchObject({
      response: {
        status: 500
      }
    });
  });
});
