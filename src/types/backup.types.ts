/**
 * Tipos TypeScript para el Sistema de Backup y Restore
 * Alineados con la API del backend: /api/system/backup*
 *
 * @see SIGESDA-BACKEND/docs/GUIA_INTEGRACION_FRONTEND_BACKUP_RESTORE.md
 */

/**
 * Metadata de un archivo de backup
 * Respuesta típica de GET /api/system/backups y GET /api/system/backups/:filename
 */
export interface BackupMetadata {
  /** Nombre del archivo (ej: backup_20260213_165223.dump) */
  filename: string;

  /** Tamaño en bytes */
  size: number;

  /** Tamaño formateado legible (ej: "257.2 KB") */
  sizeFormatted: string;

  /** Fecha de creación en formato ISO 8601 */
  createdAt: string;

  /** Path absoluto en el servidor (solo informativo) */
  path: string;
}

/**
 * Respuesta de GET /api/system/backups (lista de backups)
 */
export interface ListBackupsResponse {
  success: boolean;
  message: string;
  data: BackupMetadata[];
  meta: {
    /** Total de backups en el servidor */
    total: number;

    /** Límite aplicado en la consulta */
    limit: number;

    /** Cantidad de backups retornados */
    showing: number;

    /** Tamaño total de todos los backups en bytes */
    totalSize: number;

    /** Tamaño total formateado (ej: "1.19 MB") */
    totalSizeFormatted: string;

    /** Backup más antiguo */
    oldestBackup?: BackupMetadata;

    /** Backup más reciente */
    newestBackup?: BackupMetadata;
  };
}

/**
 * Respuesta de GET /api/system/backup/info (crear backup, retorna JSON)
 */
export interface CreateBackupResponse {
  success: boolean;
  message: string;
  data: {
    /** Nombre del archivo generado */
    filename: string;

    /** Tamaño en bytes */
    size: number;

    /** Tamaño formateado */
    sizeFormatted: string;

    /** Timestamp de creación ISO 8601 */
    timestamp: string;

    /** Path absoluto en el servidor */
    location: string;
  };
}

/**
 * Request body para POST /api/system/restore
 */
export interface RestoreBackupRequest {
  /** Nombre del archivo de backup existente en el servidor */
  filename: string;

  /** Debe ser exactamente true para confirmar la operación destructiva */
  confirm: true; // Literal type - MUST be true
}

/**
 * Respuesta de POST /api/system/restore
 */
export interface RestoreBackupResponse {
  success: boolean;
  message: string;
  data: {
    /** Nombre del archivo usado para restore */
    filename: string;

    /** Timestamp de cuando se completó el restore */
    restoredAt: string;

    /** Nombre de la base de datos restaurada */
    databaseName: string;

    /** Cantidad de conexiones activas que se cerraron */
    previousConnectionsClosed: number;
  };

  /** Mensaje de advertencia adicional */
  warning?: string;
}

/**
 * Respuesta de DELETE /api/system/backups/:filename
 */
export interface DeleteBackupResponse {
  success: boolean;
  message: string;
  data: {
    /** Nombre del archivo eliminado */
    filename: string;

    /** Tamaño del archivo eliminado */
    size: string;

    /** Fecha de creación del archivo eliminado */
    wasCreatedAt: string;
  };
}

/**
 * Respuesta de error genérica del backend
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Parámetros de query para GET /api/system/backups
 */
export interface ListBackupsParams {
  /** Número de resultados (default: 50, max: 999999, usa "all" para sin límite) */
  limit?: number | 'all';

  /** Campo por el cual ordenar */
  sortBy?: 'name' | 'size' | 'date';

  /** Orden de los resultados */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Tipo helper para respuestas de API genéricas
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
