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
import { cuotasService } from '../cuotasService';

describe('cuotasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCuotas', () => {
    it('should fetch cuotas with filters', async () => {
      const mockData = {
        data: [
          { id: 1, mes: 1, anio: 2024, montoTotal: 5000, reciboId: 1 },
          { id: 2, mes: 1, anio: 2024, montoTotal: 4000, reciboId: 2 }
        ],
        total: 2,
        pages: 1,
        currentPage: 1
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockData }
      });

      const filters = { mes: 1, anio: 2024 };
      const result = await cuotasService.getCuotas(filters);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/', { params: filters });
      expect(result).toEqual(mockData);
      expect(result.data).toHaveLength(2);
    });

    it('should handle empty filters', async () => {
      const mockData = {
        data: [],
        total: 0,
        pages: 0,
        currentPage: 1
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockData }
      });

      const result = await cuotasService.getCuotas();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/', { params: {} });
      expect(result.data).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Network error';
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await expect(cuotasService.getCuotas()).rejects.toThrow(errorMessage);
    });
  });

  describe('getCuotaById', () => {
    it('should fetch a single cuota by ID', async () => {
      const mockCuota = {
        id: 1,
        mes: 1,
        anio: 2024,
        montoTotal: 5000,
        reciboId: 1,
        categoriaId: 1
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockCuota }
      });

      const result = await cuotasService.getCuotaById(1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/1');
      expect(result).toEqual(mockCuota);
      expect(result.id).toBe(1);
    });

    it('should throw error when cuota not found', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Cuota no encontrada'));

      await expect(cuotasService.getCuotaById(999)).rejects.toThrow('Cuota no encontrada');
    });
  });

  describe('generarCuotasV2', () => {
    it('should call generar-v2 endpoint with correct data', async () => {
      const requestData = {
        mes: 1,
        anio: 2024,
        categorias: ['ACTIVO', 'ESTUDIANTE'],
        aplicarDescuentos: true,
        aplicarMotorReglas: true,
        soloNuevas: true,
        incluirInactivos: false
      };

      const mockResponse = {
        generated: 10,
        errors: [],
        cuotas: [],
        resumenDescuentos: {
          totalSociosConDescuento: 5,
          montoTotalDescuentos: 12000,
          reglasAplicadas: {
            FAMILIAR: 3,
            CATEGORIA: 2
          }
        }
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true, data: mockResponse }
      });

      const result = await cuotasService.generarCuotasV2(requestData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/generar-v2', requestData);
      expect(result.generated).toBe(10);
      expect(result.resumenDescuentos.totalSociosConDescuento).toBe(5);
    });

    it('should handle generation errors', async () => {
      const requestData = {
        mes: 1,
        anio: 2024,
        categorias: ['ACTIVO'],
        aplicarDescuentos: true,
        aplicarMotorReglas: true,
        soloNuevas: true,
        incluirInactivos: false
      };

      mockAxiosInstance.post.mockRejectedValue(
        new Error('Ya existen cuotas para este período')
      );

      await expect(cuotasService.generarCuotasV2(requestData)).rejects.toThrow(
        'Ya existen cuotas para este período'
      );
    });
  });

  describe('recalcularCuota', () => {
    it('should recalculate a cuota', async () => {
      const requestData = {
        aplicarAjustes: true,
        aplicarExenciones: true,
        aplicarDescuentos: true
      };

      const mockResponse = {
        cuotaAnterior: { montoTotal: 5000 },
        cuotaRecalculada: { montoTotal: 4500 },
        cambios: {
          montoTotal: -500,
          itemsAgregados: 0,
          itemsEliminados: 1,
          itemsModificados: 0
        }
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true, data: mockResponse }
      });

      const result = await cuotasService.recalcularCuota(1, requestData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/1/recalcular', requestData);
      expect(result.cambios.montoTotal).toBe(-500);
    });
  });

  describe('getDesglose', () => {
    it('should fetch items breakdown', async () => {
      const mockDesglose = {
        desglose: {
          BASE: {
            items: [
              {
                id: 1,
                cuotaId: 1,
                tipoItemId: 1,
                concepto: 'Cuota Base Socio',
                monto: 5000,
                cantidad: 1
              }
            ],
            subtotal: 5000
          },
          DESCUENTO: {
            items: [
              {
                id: 2,
                cuotaId: 1,
                tipoItemId: 5,
                concepto: 'Descuento Familiar 15%',
                monto: -750,
                cantidad: 1
              }
            ],
            subtotal: -750
          }
        },
        totales: {
          base: 5000,
          actividades: 0,
          descuentos: -750,
          recargos: 0,
          total: 4250
        }
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockDesglose }
      });

      const result = await cuotasService.getDesgloseItems(1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/1/items/desglose');
      expect(result.totales.total).toBe(4250);
      expect(result.desglose.BASE.items).toHaveLength(1);
      expect(result.desglose.DESCUENTO.items).toHaveLength(1);
    });
  });

  describe('addItemManual', () => {
    it('should add a manual item to a cuota', async () => {
      const itemData = {
        tipoItemCodigo: 'AJUSTE_MANUAL_DESCUENTO',
        concepto: 'Descuento especial',
        monto: 500,
        cantidad: 1,
        observaciones: 'Aprobado por director'
      };

      const mockItem = {
        id: 10,
        cuotaId: 1,
        tipoItemId: 8,
        ...itemData,
        esAutomatico: false,
        esEditable: true
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true, data: mockItem }
      });

      const result = await cuotasService.addItemManual(1, itemData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/1/items', itemData);
      expect(result.esAutomatico).toBe(false);
      expect(result.esEditable).toBe(true);
    });
  });
});
