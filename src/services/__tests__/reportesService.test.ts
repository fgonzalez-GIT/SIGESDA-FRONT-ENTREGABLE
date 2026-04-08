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
import { reportesService } from '../reportesService';

describe('reportesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should fetch dashboard data for a specific period', async () => {
      const mockDashboardData = {
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
            VENCIDO: { cantidad: 2, monto: 10000 }
          },
          porCategoria: {
            ACTIVO: { cantidad: 30, monto: 150000 },
            ESTUDIANTE: { cantidad: 15, monto: 75000 },
            GENERAL: { cantidad: 5, monto: 25000 }
          }
        },
        tendencias: {
          variacionMesAnterior: 5.5,
          proyeccionRecaudacion: 260000
        }
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockDashboardData }
      });

      const result = await reportesService.getDashboard(1, 2024);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/dashboard', {
        params: { mes: 1, anio: 2024 }
      });
      expect(result.metricas.totalCuotas).toBe(50);
      expect(result.metricas.tasaCobro).toBe(80);
      expect(result.distribucion.porEstado.PAGADO.cantidad).toBe(40);
    });

    it('should handle API errors when fetching dashboard', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Error al obtener dashboard'));

      await expect(reportesService.getDashboard(1, 2024)).rejects.toThrow(
        'Error al obtener dashboard'
      );
    });
  });

  describe('exportarReporte', () => {
    it('should export report as Excel', async () => {
      const mockBlob = new Blob(['fake excel data'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: mockBlob
      });

      const request = {
        tipoReporte: 'dashboard',
        formato: 'EXCEL' as const,
        parametros: { mes: 1, anio: 2024 }
      };

      const result = await reportesService.exportarReporte(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/exportar', request, {
        responseType: 'blob'
      });
      expect(result).toBeInstanceOf(Blob);
    });

    it('should export report as PDF', async () => {
      const mockBlob = new Blob(['fake pdf data'], {
        type: 'application/pdf'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: mockBlob
      });

      const request = {
        tipoReporte: 'recaudacion',
        formato: 'PDF' as const,
        parametros: { mes: 2, anio: 2024 }
      };

      const result = await reportesService.exportarReporte(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/exportar', request, {
        responseType: 'blob'
      });
      expect(result).toBeInstanceOf(Blob);
    });

    it('should export report as CSV', async () => {
      const mockBlob = new Blob(['fake csv data'], {
        type: 'text/csv'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: mockBlob
      });

      const request = {
        tipoReporte: 'categoria',
        formato: 'CSV' as const,
        parametros: { mes: 3, anio: 2024 }
      };

      const result = await reportesService.exportarReporte(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/exportar', request, {
        responseType: 'blob'
      });
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('getReportePorCategoria', () => {
    it('should fetch report by category', async () => {
      const mockReporte = {
        categoria: 'ACTIVO',
        resumen: {
          totalCuotas: 30,
          totalRecaudado: 150000,
          promedioMonto: 5000
        },
        detalles: [
          {
            socioId: 1,
            nombre: 'Juan Pérez',
            cuotaId: 1,
            monto: 5000,
            estado: 'PAGADO'
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockReporte }
      });

      const params = {
        mes: 1,
        anio: 2024,
        categoriaId: 1,
        incluirDetalle: true
      };

      const result = await reportesService.getReportePorCategoria(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/categoria', { params });
      expect(result.resumen.totalCuotas).toBe(30);
    });
  });

  describe('getReporteDescuentos', () => {
    it('should fetch discounts report', async () => {
      const mockReporte = {
        periodo: { mes: 1, anio: 2024 },
        resumen: {
          totalDescuentos: 20000,
          totalSociosConDescuento: 15,
          descuentoPorcentajePromedio: 12.5
        },
        descuentosPorTipo: {
          FAMILIAR: { cantidad: 8, monto: 12000 },
          CATEGORIA: { cantidad: 5, monto: 6000 },
          PAGO_ANTICIPADO: { cantidad: 2, monto: 2000 }
        }
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockReporte }
      });

      const params = {
        mes: 1,
        anio: 2024,
        tipoDescuento: 'todos' as const
      };

      const result = await reportesService.getReporteDescuentos(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/descuentos', { params });
      expect(result.resumen.totalDescuentos).toBe(20000);
    });
  });

  describe('getRecaudacion', () => {
    it('should fetch collection data', async () => {
      const mockRecaudacion = {
        periodo: { mes: 1, anio: 2024 },
        totalRecaudado: 250000,
        totalPendiente: 50000,
        tasaCobro: 80,
        recaudacionPorDia: [
          { dia: '2024-01-01', monto: 10000, cantidad: 2 },
          { dia: '2024-01-02', monto: 15000, cantidad: 3 }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockRecaudacion }
      });

      const result = await reportesService.getRecaudacion(1, 2024);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/recaudacion', {
        params: { mes: 1, anio: 2024 }
      });
      expect(result.totalRecaudado).toBe(250000);
      expect(result.tasaCobro).toBe(80);
    });
  });
});
