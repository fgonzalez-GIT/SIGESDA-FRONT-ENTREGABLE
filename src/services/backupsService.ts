/**
 * Servicio para interactuar con el Sistema de Backup y Restore del backend
 *
 * Endpoints base: /api/system/backup*
 * @see SIGESDA-BACKEND/docs/GUIA_INTEGRACION_FRONTEND_BACKUP_RESTORE.md
 */

import axios, { AxiosInstance } from 'axios';
import type {
  ListBackupsResponse,
  ListBackupsParams,
  BackupMetadata,
  CreateBackupResponse,
  RestoreBackupRequest,
  RestoreBackupResponse,
  DeleteBackupResponse,
  ApiResponse,
} from '@/types/backup.types';

// Obtener base URL del backend desde variables de entorno
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Cliente Axios dedicado para endpoints de backup/restore
 * Base URL: /api/system
 */
const backupsAPI: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/system`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutos default para operaciones normales
});

/**
 * Interceptor de request: Agrega headers de autenticación
 * NOTA: Actualmente los endpoints están sin autenticación (modo desarrollo)
 * Este interceptor está preparado para cuando se implemente JWT
 */
backupsAPI.interceptors.request.use(
  (config) => {
    // Obtener token de autenticación (cuando esté implementado)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Headers adicionales para compatibilidad con backend actual
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (userId) config.headers['X-User-Id'] = userId;
    if (userRole) config.headers['X-User-Role'] = userRole;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de response: Maneja errores 401 (no autorizado)
 */
backupsAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Usuario no autenticado - redirigir a login
      console.error('Sesión expirada o no autorizado');
      // Opcionalmente: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Servicio de Backups - Métodos públicos
 */
export const backupsService = {
  /**
   * Lista todos los backups disponibles en el servidor
   *
   * GET /api/system/backups
   *
   * @param params - Parámetros de paginación y ordenamiento (opcional)
   * @returns Promise con array de backups y metadata
   *
   * @example
   * const response = await backupsService.listBackups({ limit: 10, sortBy: 'date', sortOrder: 'desc' });
   * console.log(`Total: ${response.meta.total} backups`);
   * console.log(response.data); // Array de BackupMetadata
   */
  listBackups: async (
    params?: ListBackupsParams
  ): Promise<ListBackupsResponse> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.limit) {
        queryParams.append('limit', String(params.limit));
      }
      if (params?.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params?.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }

      const url = `/backups${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await backupsAPI.get<ListBackupsResponse>(url);

      return response.data;
    } catch (error) {
      console.error('Error listando backups:', error);
      throw error;
    }
  },

  /**
   * Obtiene información detallada de un backup específico
   *
   * GET /api/system/backups/:filename
   *
   * @param filename - Nombre del archivo de backup (ej: backup_20260213_165223.dump)
   * @returns Promise con metadata del backup
   *
   * @example
   * const info = await backupsService.getBackupInfo('backup_20260213_165223.dump');
   * console.log(`Tamaño: ${info.sizeFormatted}`);
   */
  getBackupInfo: async (
    filename: string
  ): Promise<ApiResponse<BackupMetadata>> => {
    try {
      const response = await backupsAPI.get<ApiResponse<BackupMetadata>>(
        `/backups/${filename}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo info del backup ${filename}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo backup de la base de datos (retorna JSON)
   *
   * GET /api/system/backup/info
   *
   * @returns Promise con metadata del backup creado
   *
   * @example
   * const backup = await backupsService.createBackup();
   * console.log(`Backup creado: ${backup.data.filename}`);
   * console.log(`Tamaño: ${backup.data.sizeFormatted}`);
   */
  createBackup: async (): Promise<CreateBackupResponse> => {
    try {
      const response = await backupsAPI.get<CreateBackupResponse>(
        '/backup/info'
      );
      return response.data;
    } catch (error) {
      console.error('Error creando backup:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo backup y lo descarga inmediatamente como archivo binario
   *
   * GET /api/system/backup
   *
   * @returns Promise con Blob del archivo .dump
   *
   * @example
   * const blob = await backupsService.createAndDownloadBackup();
   * downloadFile(blob, `backup_${new Date().toISOString()}.dump`);
   */
  createAndDownloadBackup: async (): Promise<Blob> => {
    try {
      const response = await backupsAPI.get('/backup', {
        responseType: 'blob', // Importante para archivos binarios
      });
      return response.data;
    } catch (error) {
      console.error('Error creando y descargando backup:', error);
      throw error;
    }
  },

  /**
   * Descarga un backup existente del servidor
   *
   * GET /api/system/backups/:filename/download
   *
   * @param filename - Nombre del archivo de backup
   * @returns Promise con Blob del archivo .dump
   *
   * @example
   * const blob = await backupsService.downloadBackup('backup_20260213_165223.dump');
   * downloadFile(blob, 'backup_20260213_165223.dump');
   */
  downloadBackup: async (filename: string): Promise<Blob> => {
    try {
      const response = await backupsAPI.get(`/backups/${filename}/download`, {
        responseType: 'blob', // Importante para archivos binarios
      });
      return response.data;
    } catch (error) {
      console.error(`Error descargando backup ${filename}:`, error);
      throw error;
    }
  },

  /**
   * Restaura la base de datos desde un archivo de backup
   *
   * ⚠️ OPERACIÓN DESTRUCTIVA: Reemplaza TODOS los datos actuales
   *
   * POST /api/system/restore
   *
   * @param filename - Nombre del archivo de backup en el servidor
   * @param confirm - Debe ser exactamente true para confirmar
   * @returns Promise con resultado del restore
   *
   * @example
   * const result = await backupsService.restoreBackup('backup_20260213_165223.dump', true);
   * console.log(`Restaurado: ${result.data.filename}`);
   * console.log(`Conexiones cerradas: ${result.data.previousConnectionsClosed}`);
   */
  restoreBackup: async (
    filename: string,
    confirm: true
  ): Promise<RestoreBackupResponse> => {
    try {
      const requestBody: RestoreBackupRequest = {
        filename,
        confirm, // Literal type: debe ser true
      };

      const response = await backupsAPI.post<RestoreBackupResponse>(
        '/restore',
        requestBody,
        {
          timeout: 300000, // 5 minutos - restore puede tardar
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error restaurando backup ${filename}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un archivo de backup del servidor
   *
   * DELETE /api/system/backups/:filename
   *
   * @param filename - Nombre del archivo de backup
   * @returns Promise con información del archivo eliminado
   *
   * @example
   * const result = await backupsService.deleteBackup('backup_20260213_165223.dump');
   * console.log(`Eliminado: ${result.data.filename} (${result.data.size})`);
   */
  deleteBackup: async (filename: string): Promise<DeleteBackupResponse> => {
    try {
      const response = await backupsAPI.delete<DeleteBackupResponse>(
        `/backups/${filename}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error eliminando backup ${filename}:`, error);
      throw error;
    }
  },

  /**
   * Restaura la base de datos desde un archivo subido por el usuario
   *
   * ⚠️ OPERACIÓN DESTRUCTIVA: Reemplaza TODOS los datos actuales
   *
   * POST /api/system/restore (multipart/form-data)
   *
   * @param file - Archivo .dump subido por el usuario
   * @param confirm - Debe ser exactamente true para confirmar
   * @returns Promise con resultado del restore
   *
   * @example
   * const file = document.getElementById('file-input').files[0];
   * const result = await backupsService.restoreBackupFromFile(file, true);
   * console.log(`Restaurado desde: ${file.name}`);
   * console.log(`Conexiones cerradas: ${result.data.previousConnectionsClosed}`);
   */
  restoreBackupFromFile: async (
    file: File,
    confirm: true
  ): Promise<RestoreBackupResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('confirm', String(confirm));

      const response = await backupsAPI.post<RestoreBackupResponse>(
        '/restore/upload',
        formData,
        {
          timeout: 300000, // 5 minutos - restore puede tardar
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error restaurando backup desde archivo:', error);
      throw error;
    }
  },
};

export default backupsService;
