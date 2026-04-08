/**
 * Custom Hook para manejar el estado de la lista de backups
 *
 * Proporciona estado reactivo y métodos para listar backups del servidor
 * Patrón similar a usePersonas.ts
 */

import { useState, useEffect, useCallback } from 'react';
import { backupsService } from '@/services/backupsService';
import type {
  BackupMetadata,
  ListBackupsResponse,
  ListBackupsParams,
} from '@/types/backup.types';

/**
 * Opciones de configuración para el hook useBackups
 */
interface UseBackupsOptions {
  /** Número de backups a mostrar (default: 50) */
  limit?: number;

  /** Campo por el cual ordenar (default: 'date') */
  sortBy?: 'name' | 'size' | 'date';

  /** Orden de los resultados (default: 'desc') */
  sortOrder?: 'asc' | 'desc';

  /** Auto-cargar datos al montar el componente (default: true) */
  autoFetch?: boolean;
}

/**
 * Valor de retorno del hook useBackups
 */
interface UseBackupsResult {
  /** Array de backups */
  backups: BackupMetadata[];

  /** Indica si se están cargando los datos */
  isLoading: boolean;

  /** Mensaje de error si ocurrió alguno */
  error: string | null;

  /** Metadata adicional (totales, tamaños, etc.) */
  meta: ListBackupsResponse['meta'] | null;

  /** Función para refrescar la lista de backups */
  refresh: () => Promise<void>;

  /** Función para cambiar parámetros de consulta */
  setParams: (params: ListBackupsParams) => void;
}

/**
 * Hook para manejar la lista de backups
 *
 * @param options - Opciones de configuración (opcional)
 * @returns Objeto con estado y métodos para manejar backups
 *
 * @example
 * const { backups, isLoading, error, meta, refresh } = useBackups({
 *   limit: 20,
 *   sortBy: 'date',
 *   sortOrder: 'desc'
 * });
 *
 * // Refrescar manualmente
 * await refresh();
 *
 * // Cambiar parámetros
 * setParams({ sortBy: 'size', sortOrder: 'asc' });
 */
export function useBackups(options: UseBackupsOptions = {}): UseBackupsResult {
  const {
    limit = 50,
    sortBy = 'date',
    sortOrder = 'desc',
    autoFetch = true,
  } = options;

  // Estado
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ListBackupsResponse['meta'] | null>(null);
  const [params, setParamsState] = useState<ListBackupsParams>({
    limit,
    sortBy,
    sortOrder,
  });

  /**
   * Función para obtener la lista de backups del servidor
   */
  const fetchBackups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await backupsService.listBackups(params);

      setBackups(response.data);
      setMeta(response.meta);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar backups';
      setError(errorMessage);
      console.error('Error en useBackups.fetchBackups:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  /**
   * Función para refrescar manualmente la lista de backups
   */
  const refresh = useCallback(async () => {
    await fetchBackups();
  }, [fetchBackups]);

  /**
   * Función para actualizar los parámetros de consulta
   */
  const setParams = useCallback((newParams: ListBackupsParams) => {
    setParamsState((prev) => ({
      ...prev,
      ...newParams,
    }));
  }, []);

  /**
   * Efecto: Cargar backups al montar el componente o cuando cambien los params
   */
  useEffect(() => {
    if (autoFetch) {
      fetchBackups();
    }
  }, [autoFetch, fetchBackups]);

  return {
    backups,
    isLoading,
    error,
    meta,
    refresh,
    setParams,
  };
}

/**
 * Hook para manejar acciones sobre backups (crear, descargar, restaurar, eliminar)
 *
 * Proporciona métodos y estados de loading para operaciones individuales
 */
interface UseBackupActionsResult {
  /** Método para crear un nuevo backup */
  createBackup: () => Promise<{ filename: string; size: string } | null>;

  /** Método para descargar un backup existente */
  downloadBackup: (filename: string) => Promise<boolean>;

  /** Método para restaurar un backup (operación destructiva) */
  restoreBackup: (filename: string) => Promise<boolean>;

  /** Método para restaurar desde un archivo subido (operación destructiva) */
  restoreBackupFromFile: (file: File) => Promise<boolean>;

  /** Método para eliminar un backup */
  deleteBackup: (filename: string) => Promise<boolean>;

  /** Indica si se está creando un backup */
  isCreating: boolean;

  /** Indica si se está descargando un backup */
  isDownloading: boolean;

  /** Indica si se está restaurando un backup */
  isRestoring: boolean;

  /** Indica si se está eliminando un backup */
  isDeleting: boolean;

  /** Mensaje de error si ocurrió alguno */
  error: string | null;

  /** Limpia el mensaje de error */
  clearError: () => void;
}

/**
 * Hook para manejar acciones sobre backups
 *
 * @returns Objeto con métodos y estados de loading
 *
 * @example
 * const { createBackup, downloadBackup, isCreating, error } = useBackupActions();
 *
 * // Crear backup
 * const backup = await createBackup();
 * if (backup) {
 *   console.log(`Backup creado: ${backup.filename}`);
 * }
 *
 * // Descargar backup
 * const success = await downloadBackup('backup_20260213_165223.dump');
 */
export function useBackupActions(): UseBackupActionsResult {
  const [isCreating, setIsCreating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crea un nuevo backup de la base de datos
   */
  const createBackup = useCallback(async () => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await backupsService.createBackup();

      return {
        filename: response.data.filename,
        size: response.data.sizeFormatted,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error creando backup';
      setError(errorMessage);
      console.error('Error en useBackupActions.createBackup:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Descarga un backup existente
   */
  const downloadBackup = useCallback(async (filename: string) => {
    try {
      setIsDownloading(true);
      setError(null);

      const blob = await backupsService.downloadBackup(filename);

      // Importar helper de descarga
      const { downloadFile } = await import('@/utils/file.helpers');
      downloadFile(blob, filename);

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error descargando backup';
      setError(errorMessage);
      console.error('Error en useBackupActions.downloadBackup:', err);
      return false;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  /**
   * Restaura la base de datos desde un backup
   * ⚠️ OPERACIÓN DESTRUCTIVA
   */
  const restoreBackup = useCallback(async (filename: string) => {
    try {
      setIsRestoring(true);
      setError(null);

      await backupsService.restoreBackup(filename, true);

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error restaurando backup';
      setError(errorMessage);
      console.error('Error en useBackupActions.restoreBackup:', err);
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  /**
   * Restaura la base de datos desde un archivo subido por el usuario
   * ⚠️ OPERACIÓN DESTRUCTIVA
   */
  const restoreBackupFromFile = useCallback(async (file: File) => {
    try {
      setIsRestoring(true);
      setError(null);

      // Validar extensión
      if (!file.name.endsWith('.dump')) {
        throw new Error('El archivo debe tener extensión .dump');
      }

      // Validar tamaño (100 MB máximo)
      const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
      if (file.size > MAX_SIZE) {
        throw new Error('El archivo excede el tamaño máximo (100 MB)');
      }

      await backupsService.restoreBackupFromFile(file, true);

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error restaurando backup desde archivo';
      setError(errorMessage);
      console.error('Error en useBackupActions.restoreBackupFromFile:', err);
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  /**
   * Elimina un backup del servidor
   */
  const deleteBackup = useCallback(async (filename: string) => {
    try {
      setIsDeleting(true);
      setError(null);

      await backupsService.deleteBackup(filename);

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error eliminando backup';
      setError(errorMessage);
      console.error('Error en useBackupActions.deleteBackup:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  /**
   * Limpia el mensaje de error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createBackup,
    downloadBackup,
    restoreBackup,
    restoreBackupFromFile,
    deleteBackup,
    isCreating,
    isDownloading,
    isRestoring,
    isDeleting,
    error,
    clearError,
  };
}
