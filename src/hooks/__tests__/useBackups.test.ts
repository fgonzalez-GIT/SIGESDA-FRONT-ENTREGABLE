/**
 * Tests para custom hook useBackups
 *
 * Prueba la lógica de estado y métodos del hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBackups, useBackupActions } from '../useBackups';
import { backupsService } from '@/services/backupsService';

// Mock del servicio de backups
vi.mock('@/services/backupsService');
const mockedBackupsService = vi.mocked(backupsService);

// Mock de file helpers para downloadBackup
vi.mock('@/utils/file.helpers', () => ({
  downloadFile: vi.fn(),
}));

describe('useBackups', () => {
  const mockBackupMetadata = {
    filename: 'backup_20260213_165223.dump',
    size: 263371,
    sizeFormatted: '257.2 KB',
    createdAt: '2026-02-13T19:52:24.423Z',
    path: '/path/to/backups/backup_20260213_165223.dump',
  };

  const mockListResponse = {
    success: true,
    message: 'Backups obtenidos exitosamente',
    data: [mockBackupMetadata],
    meta: {
      total: 1,
      limit: 50,
      showing: 1,
      totalSize: 263371,
      totalSizeFormatted: '257.2 KB',
      oldestBackup: mockBackupMetadata,
      newestBackup: mockBackupMetadata,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useBackups hook', () => {
    it('debe cargar backups al montar', async () => {
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      const { result } = renderHook(() => useBackups());

      // Estado inicial: loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.backups).toEqual([]);

      // Esperar a que cargue
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verificar datos cargados
      expect(result.current.backups).toEqual([mockBackupMetadata]);
      expect(result.current.meta).toEqual(mockListResponse.meta);
      expect(result.current.error).toBeNull();
    });

    it('debe manejar errores al cargar backups', async () => {
      const mockError = new Error('Error de red');
      mockedBackupsService.listBackups = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useBackups());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Error de red');
      expect(result.current.backups).toEqual([]);
    });

    it('debe refrescar la lista de backups', async () => {
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      const { result } = renderHook(() => useBackups());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Limpiar llamadas anteriores
      mockedBackupsService.listBackups.mockClear();

      // Refrescar
      await result.current.refresh();

      await waitFor(() => {
        expect(mockedBackupsService.listBackups).toHaveBeenCalledTimes(1);
      });
    });

    it('debe actualizar parámetros de consulta', async () => {
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      const { result } = renderHook(() => useBackups());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Cambiar parámetros
      result.current.setParams({ sortBy: 'size', sortOrder: 'asc' });

      await waitFor(() => {
        expect(mockedBackupsService.listBackups).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'size',
            sortOrder: 'asc',
          })
        );
      });
    });

    it('debe NO cargar datos si autoFetch es false', async () => {
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderHook(() => useBackups({ autoFetch: false }));

      // Esperar un poco
      await new Promise((resolve) => setTimeout(resolve, 100));

      // No debe haber llamado al servicio
      expect(mockedBackupsService.listBackups).not.toHaveBeenCalled();
    });

    it('debe usar parámetros personalizados', async () => {
      mockedBackupsService.listBackups = vi
        .fn()
        .mockResolvedValue(mockListResponse);

      renderHook(() =>
        useBackups({
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc',
        })
      );

      await waitFor(() => {
        expect(mockedBackupsService.listBackups).toHaveBeenCalledWith({
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc',
        });
      });
    });
  });

  describe('useBackupActions hook', () => {
    const mockCreateResponse = {
      success: true,
      message: 'Backup creado exitosamente',
      data: {
        filename: 'backup_20260213_165223.dump',
        size: 263371,
        sizeFormatted: '257.2 KB',
        timestamp: '2026-02-13T19:52:24.423Z',
        location: '/path/to/backups/backup_20260213_165223.dump',
      },
    };

    it('debe crear un nuevo backup', async () => {
      mockedBackupsService.createBackup = vi
        .fn()
        .mockResolvedValue(mockCreateResponse);

      const { result } = renderHook(() => useBackupActions());

      expect(result.current.isCreating).toBe(false);

      const backup = await result.current.createBackup();

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(backup).toEqual({
        filename: 'backup_20260213_165223.dump',
        size: '257.2 KB',
      });
      expect(result.current.error).toBeNull();
    });

    it('debe manejar errores al crear backup', async () => {
      const mockError = new Error('Error creando backup');
      mockedBackupsService.createBackup = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useBackupActions());

      const backup = await result.current.createBackup();

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(backup).toBeNull();
      expect(result.current.error).toBe('Error creando backup');
    });

    it('debe descargar un backup', async () => {
      const mockBlob = new Blob(['backup data']);
      mockedBackupsService.downloadBackup = vi
        .fn()
        .mockResolvedValue(mockBlob);

      const { result } = renderHook(() => useBackupActions());

      const success = await result.current.downloadBackup(
        'backup_20260213_165223.dump'
      );

      await waitFor(() => {
        expect(result.current.isDownloading).toBe(false);
      });

      expect(success).toBe(true);
      expect(mockedBackupsService.downloadBackup).toHaveBeenCalledWith(
        'backup_20260213_165223.dump'
      );
    });

    it('debe restaurar un backup', async () => {
      const mockRestoreResponse = {
        success: true,
        message: 'Restaurado exitosamente',
        data: {
          filename: 'backup_20260213_165223.dump',
          restoredAt: '2026-02-13T20:15:30.123Z',
          databaseName: 'asociacion_musical',
          previousConnectionsClosed: 3,
        },
      };

      mockedBackupsService.restoreBackup = vi
        .fn()
        .mockResolvedValue(mockRestoreResponse);

      const { result } = renderHook(() => useBackupActions());

      const success = await result.current.restoreBackup(
        'backup_20260213_165223.dump'
      );

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      expect(success).toBe(true);
      expect(mockedBackupsService.restoreBackup).toHaveBeenCalledWith(
        'backup_20260213_165223.dump',
        true
      );
    });

    it('debe eliminar un backup', async () => {
      const mockDeleteResponse = {
        success: true,
        message: 'Eliminado exitosamente',
        data: {
          filename: 'backup_20260213_165223.dump',
          size: '257.2 KB',
          wasCreatedAt: '2026-02-13T19:52:24.423Z',
        },
      };

      mockedBackupsService.deleteBackup = vi
        .fn()
        .mockResolvedValue(mockDeleteResponse);

      const { result } = renderHook(() => useBackupActions());

      const success = await result.current.deleteBackup(
        'backup_20260213_165223.dump'
      );

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });

      expect(success).toBe(true);
      expect(mockedBackupsService.deleteBackup).toHaveBeenCalledWith(
        'backup_20260213_165223.dump'
      );
    });

    it('debe limpiar errores', async () => {
      const mockError = new Error('Error de prueba');
      mockedBackupsService.createBackup = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useBackupActions());

      await result.current.createBackup();

      await waitFor(() => {
        expect(result.current.error).toBe('Error de prueba');
      });

      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});
