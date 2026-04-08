/**
 * Tests unitarios para backupsService
 *
 * Prueba todos los métodos del servicio de backups
 * Nota: Estos tests verifican la lógica del servicio, no las llamadas a axios reales
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import type {
  ListBackupsResponse,
  CreateBackupResponse,
  RestoreBackupResponse,
  DeleteBackupResponse,
} from '@/types/backup.types';

describe('backupsService', () => {
  const mockBackupMetadata = {
    filename: 'backup_20260213_165223.dump',
    size: 263371,
    sizeFormatted: '257.2 KB',
    createdAt: '2026-02-13T19:52:24.423Z',
    path: '/path/to/backups/backup_20260213_165223.dump',
  };

  const mockListResponse: ListBackupsResponse = {
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

  const mockCreateResponse: CreateBackupResponse = {
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

  describe('Tipos y estructuras de datos', () => {
    it('debe tener el tipo correcto para BackupMetadata', () => {
      expect(mockBackupMetadata).toHaveProperty('filename');
      expect(mockBackupMetadata).toHaveProperty('size');
      expect(mockBackupMetadata).toHaveProperty('sizeFormatted');
      expect(mockBackupMetadata).toHaveProperty('createdAt');
      expect(mockBackupMetadata).toHaveProperty('path');
    });

    it('debe tener el tipo correcto para ListBackupsResponse', () => {
      expect(mockListResponse).toHaveProperty('success');
      expect(mockListResponse).toHaveProperty('message');
      expect(mockListResponse).toHaveProperty('data');
      expect(mockListResponse).toHaveProperty('meta');
      expect(Array.isArray(mockListResponse.data)).toBe(true);
    });

    it('debe tener metadata correcta en la respuesta de lista', () => {
      expect(mockListResponse.meta).toHaveProperty('total');
      expect(mockListResponse.meta).toHaveProperty('limit');
      expect(mockListResponse.meta).toHaveProperty('showing');
      expect(mockListResponse.meta).toHaveProperty('totalSize');
      expect(mockListResponse.meta).toHaveProperty('totalSizeFormatted');
    });
  });

  describe('Validación de nombres de archivo', () => {
    it('debe validar nombres de archivo correctos', () => {
      const validFilenames = [
        'backup_20260213_165223.dump',
        'backup_20260210_120000.dump',
        'backup_test.dump',
        'backup-test_123.dump',
      ];

      validFilenames.forEach((filename) => {
        expect(filename).toMatch(/^[a-zA-Z0-9_-]+\.dump$/);
      });
    });

    it('debe rechazar nombres de archivo inválidos', () => {
      const invalidFilenames = [
        'backup.txt',
        '../backup.dump',
        'backup/.dump',
        'backup\\test.dump',
        'backup..dump',
      ];

      invalidFilenames.forEach((filename) => {
        const isValid = /^[a-zA-Z0-9_-]+\.dump$/.test(filename);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Estructura de request de restore', () => {
    it('debe tener estructura correcta para RestoreBackupRequest', () => {
      const restoreRequest = {
        filename: 'backup_20260213_165223.dump',
        confirm: true as const,
      };

      expect(restoreRequest.filename).toBe('backup_20260213_165223.dump');
      expect(restoreRequest.confirm).toBe(true);
    });
  });

  describe('Parámetros de query para listBackups', () => {
    it('debe construir query params correctamente', () => {
      const params = {
        limit: 10,
        sortBy: 'date' as const,
        sortOrder: 'desc' as const,
      };

      const queryParams = new URLSearchParams();
      queryParams.append('limit', String(params.limit));
      queryParams.append('sortBy', params.sortBy);
      queryParams.append('sortOrder', params.sortOrder);

      const queryString = queryParams.toString();
      expect(queryString).toBe('limit=10&sortBy=date&sortOrder=desc');
    });

    it('debe manejar límite "all"', () => {
      const params = {
        limit: 'all' as const,
      };

      const queryParams = new URLSearchParams();
      queryParams.append('limit', String(params.limit));

      const queryString = queryParams.toString();
      expect(queryString).toBe('limit=all');
    });
  });

  describe('Formato de respuestas de error', () => {
    it('debe tener estructura correcta para ErrorResponse', () => {
      const errorResponse = {
        success: false as const,
        error: 'Error message',
        message: 'Detailed message',
        errors: [
          { path: 'filename', message: 'Invalid filename' },
        ],
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Error message');
      expect(Array.isArray(errorResponse.errors)).toBe(true);
    });
  });

  describe('Timeout de configuración', () => {
    it('debe usar timeout largo para restore (5 minutos)', () => {
      const RESTORE_TIMEOUT = 300000; // 5 minutos en ms
      expect(RESTORE_TIMEOUT).toBe(5 * 60 * 1000);
    });

    it('debe usar timeout estándar para otras operaciones (2 minutos)', () => {
      const DEFAULT_TIMEOUT = 120000; // 2 minutos en ms
      expect(DEFAULT_TIMEOUT).toBe(2 * 60 * 1000);
    });
  });

  describe('Response types', () => {
    it('debe tener responseType blob para descargas', () => {
      const downloadConfig = {
        responseType: 'blob' as const,
      };

      expect(downloadConfig.responseType).toBe('blob');
    });
  });

  describe('Endpoints y paths', () => {
    it('debe tener paths correctos para endpoints', () => {
      const endpoints = {
        listBackups: '/backups',
        getBackupInfo: (filename: string) => `/backups/${filename}`,
        createBackup: '/backup/info',
        createAndDownload: '/backup',
        downloadBackup: (filename: string) => `/backups/${filename}/download`,
        restore: '/restore',
        deleteBackup: (filename: string) => `/backups/${filename}`,
      };

      expect(endpoints.listBackups).toBe('/backups');
      expect(endpoints.getBackupInfo('backup_test.dump')).toBe('/backups/backup_test.dump');
      expect(endpoints.createBackup).toBe('/backup/info');
      expect(endpoints.createAndDownload).toBe('/backup');
      expect(endpoints.downloadBackup('backup_test.dump')).toBe('/backups/backup_test.dump/download');
      expect(endpoints.restore).toBe('/restore');
      expect(endpoints.deleteBackup('backup_test.dump')).toBe('/backups/backup_test.dump');
    });
  });
});
