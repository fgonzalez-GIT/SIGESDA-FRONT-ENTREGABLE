/**
 * Tests E2E para el módulo de Backups
 *
 * Prueba flujos completos de usuario: listar, crear, descargar, restaurar, eliminar
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BackupsPage from '@/pages/Configuracion/BackupsPage';
import { backupsService } from '@/services/backupsService';
import uiReducer from '@/store/slices/uiSlice';

// Mock del servicio de backups
vi.mock('@/services/backupsService');
const mockedBackupsService = vi.mocked(backupsService);

// Mock de file helpers
vi.mock('@/utils/file.helpers', () => ({
  downloadFile: vi.fn(),
  formatFileSize: (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`,
}));

// Mock de date helpers
vi.mock('@/utils/dateHelpers', () => ({
  formatDateTimeES: (date: string) => new Date(date).toLocaleString('es-ES'),
}));

describe('BackupsPage E2E', () => {
  const mockBackup1 = {
    filename: 'backup_20260213_165223.dump',
    size: 263371,
    sizeFormatted: '257.2 KB',
    createdAt: '2026-02-13T19:52:24.423Z',
    path: '/backups/backup_20260213_165223.dump',
  };

  const mockBackup2 = {
    filename: 'backup_20260210_120000.dump',
    size: 245800,
    sizeFormatted: '240.0 KB',
    createdAt: '2026-02-10T12:00:00.000Z',
    path: '/backups/backup_20260210_120000.dump',
  };

  const mockListResponse = {
    success: true,
    message: 'Backups obtenidos exitosamente',
    data: [mockBackup1, mockBackup2],
    meta: {
      total: 2,
      limit: 50,
      showing: 2,
      totalSize: 509171,
      totalSizeFormatted: '497.2 KB',
      oldestBackup: mockBackup2,
      newestBackup: mockBackup1,
    },
  };

  // Configurar store de Redux para tests
  const createTestStore = () =>
    configureStore({
      reducer: {
        ui: uiReducer,
      },
    });

  const renderWithProviders = (component: React.ReactElement) => {
    const store = createTestStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado y carga inicial', () => {
    it('debe renderizar la página de backups', async () => {
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderWithProviders(<BackupsPage />);

      expect(screen.getByText('Backups del Sistema')).toBeInTheDocument();
      expect(screen.getByText('Crear Nuevo Backup')).toBeInTheDocument();
    });

    it('debe mostrar la lista de backups', async () => {
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
        expect(screen.getByText('backup_20260210_120000.dump')).toBeInTheDocument();
      });
    });

    it('debe mostrar estadísticas de backups', async () => {
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total de Backups')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Tamaño Total')).toBeInTheDocument();
        expect(screen.getByText('497.2 KB')).toBeInTheDocument();
      });
    });

    it('debe mostrar mensaje cuando no hay backups', async () => {
      const emptyResponse = {
        ...mockListResponse,
        data: [],
        meta: { ...mockListResponse.meta, total: 0, showing: 0 },
      };

      mockedBackupsService.listBackups = vi.fn().mockResolvedValue(emptyResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('No hay backups disponibles')).toBeInTheDocument();
      });
    });

    it('debe mostrar error si falla la carga', async () => {
      mockedBackupsService.listBackups = vi
        .fn()
        .mockRejectedValue(new Error('Error de red'));

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error cargando backups/)).toBeInTheDocument();
      });
    });
  });

  describe('Crear backup', () => {
    it('debe abrir el diálogo al hacer clic en Crear Backup', async () => {
      const user = userEvent.setup();
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Crear Nuevo Backup');
      await user.click(createButton);

      expect(screen.getByText('¿Está seguro que desea crear un backup de la base de datos?')).toBeInTheDocument();
    });

    it('debe crear un backup al confirmar', async () => {
      const user = userEvent.setup();
      const mockCreateResponse = {
        success: true,
        message: 'Backup creado',
        data: {
          filename: 'backup_new.dump',
          size: 300000,
          sizeFormatted: '293.0 KB',
          timestamp: '2026-02-13T21:00:00.000Z',
          location: '/backups/backup_new.dump',
        },
      };

      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);
      mockedBackupsService.createBackup = vi
        .fn()
        .mockResolvedValue(mockCreateResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('Crear Nuevo Backup')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Crear Nuevo Backup');
      await user.click(createButton);

      const confirmButton = screen.getByRole('button', { name: /Crear Backup/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockedBackupsService.createBackup).toHaveBeenCalled();
      });
    });
  });

  describe('Descargar backup', () => {
    it('debe descargar backup al hacer clic en el botón de descarga', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['backup data']);

      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);
      mockedBackupsService.downloadBackup = vi.fn().mockResolvedValue(mockBlob);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByLabelText(/Descargar backup/i);
      await user.click(downloadButtons[0]);

      await waitFor(() => {
        expect(mockedBackupsService.downloadBackup).toHaveBeenCalledWith(
          'backup_20260213_165223.dump'
        );
      });
    });
  });

  describe('Restaurar backup', () => {
    it('debe abrir diálogo de confirmación al hacer clic en restaurar', async () => {
      const user = userEvent.setup();
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByLabelText(/Restaurar backup/i);
      await user.click(restoreButtons[0]);

      expect(screen.getByText(/OPERACIÓN DESTRUCTIVA/)).toBeInTheDocument();
      expect(screen.getByText(/TODOS LOS DATOS ACTUALES SERÁN REEMPLAZADOS/)).toBeInTheDocument();
    });

    it('debe NO permitir restaurar sin escribir "RESTAURAR"', async () => {
      const user = userEvent.setup();
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByLabelText(/Restaurar backup/i);
      await user.click(restoreButtons[0]);

      const confirmButton = screen.getByRole('button', {
        name: /Confirmar Restauración/i,
      });

      expect(confirmButton).toBeDisabled();
    });

    it('debe habilitar botón de confirmación al escribir "RESTAURAR"', async () => {
      const user = userEvent.setup();
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByLabelText(/Restaurar backup/i);
      await user.click(restoreButtons[0]);

      const input = screen.getByPlaceholderText(/Escriba RESTAURAR/i);
      await user.type(input, 'RESTAURAR');

      const confirmButton = screen.getByRole('button', {
        name: /Confirmar Restauración/i,
      });

      expect(confirmButton).not.toBeDisabled();
    });

    it('debe restaurar backup al confirmar correctamente', async () => {
      const user = userEvent.setup();
      const mockRestoreResponse = {
        success: true,
        message: 'Restaurado',
        data: {
          filename: 'backup_20260213_165223.dump',
          restoredAt: '2026-02-13T21:00:00.000Z',
          databaseName: 'asociacion_musical',
          previousConnectionsClosed: 5,
        },
      };

      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);
      mockedBackupsService.restoreBackup = vi
        .fn()
        .mockResolvedValue(mockRestoreResponse);

      // Mock de window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByLabelText(/Restaurar backup/i);
      await user.click(restoreButtons[0]);

      const input = screen.getByPlaceholderText(/Escriba RESTAURAR/i);
      await user.type(input, 'RESTAURAR');

      const confirmButton = screen.getByRole('button', {
        name: /Confirmar Restauración/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockedBackupsService.restoreBackup).toHaveBeenCalledWith(
          'backup_20260213_165223.dump',
          true
        );
      });
    });
  });

  describe('Eliminar backup', () => {
    it('debe abrir diálogo de confirmación al hacer clic en eliminar', async () => {
      const user = userEvent.setup();
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/Eliminar backup/i);
      await user.click(deleteButtons[0]);

      expect(screen.getByText('Eliminar Backup')).toBeInTheDocument();
      expect(screen.getByText(/¿Está seguro que desea eliminar este backup?/)).toBeInTheDocument();
    });

    it('debe eliminar backup al confirmar', async () => {
      const user = userEvent.setup();
      const mockDeleteResponse = {
        success: true,
        message: 'Eliminado',
        data: {
          filename: 'backup_20260213_165223.dump',
          size: '257.2 KB',
          wasCreatedAt: '2026-02-13T19:52:24.423Z',
        },
      };

      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);
      mockedBackupsService.deleteBackup = vi
        .fn()
        .mockResolvedValue(mockDeleteResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/Eliminar backup/i);
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /Confirmar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockedBackupsService.deleteBackup).toHaveBeenCalledWith(
          'backup_20260213_165223.dump'
        );
      });
    });
  });

  describe('Refrescar lista', () => {
    it('debe refrescar la lista al hacer clic en el botón de refrescar', async () => {
      const user = userEvent.setup();
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderWithProviders(<BackupsPage />);

      await waitFor(() => {
        expect(screen.getByText('backup_20260213_165223.dump')).toBeInTheDocument();
      });

      // Limpiar llamadas anteriores
      mockedBackupsService.listBackups.mockClear();

      const refreshButton = screen.getByLabelText(/Refrescar lista de backups/i);
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockedBackupsService.listBackups).toHaveBeenCalled();
      });
    });
  });
});
