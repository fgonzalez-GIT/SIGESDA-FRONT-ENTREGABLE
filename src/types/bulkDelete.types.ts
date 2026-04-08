/**
 * Types para funcionalidad de eliminación masiva (Bulk Delete)
 * @module bulkDelete.types
 * @see /SIGESDA-BACKEND/docs/API_BULK_DELETE.md
 */

/**
 * Request body para eliminación masiva
 * @description Usado para DELETE /api/recibos/bulk y /api/pagos-actividades/bulk
 */
export interface BulkDeleteRequest {
  /** Array de IDs a eliminar (1-100 elementos) */
  ids: number[];
}

/**
 * Response de eliminación masiva de pagos de actividades
 * @description Incluye count y los IDs de recibos eliminados
 */
export interface BulkDeletePagosResponse {
  /** Número de pagos eliminados */
  count: number;
  /** IDs de los recibos asociados eliminados */
  reciboIds: number[];
}

/**
 * Response de eliminación masiva de recibos
 */
export interface BulkDeleteRecibosResponse {
  /** Número de recibos eliminados */
  count: number;
}

/**
 * Resultado unificado de operación bulk delete
 */
export interface BulkDeleteResult {
  /** Indica si la operación fue exitosa */
  success: boolean;
  /** Mensaje descriptivo del resultado */
  message: string;
  /** Datos de la respuesta (count + reciboIds opcionales) */
  data?: BulkDeletePagosResponse | BulkDeleteRecibosResponse;
}

/**
 * Error response de bulk delete
 */
export interface BulkDeleteError {
  /** Mensaje de error principal */
  error: string;
  /** Detalles adicionales (por ID) */
  details?: string[];
}

/**
 * Resultado de validación frontend antes de eliminar
 */
export interface BulkDeleteValidation {
  /** Indica si la selección es válida */
  valid: boolean;
  /** IDs que no pueden eliminarse */
  invalidIds: number[];
  /** Mapa de ID -> razón de invalidez */
  reasons: Map<number, string>;
}

/**
 * Estado de un registro para validación de eliminación
 */
export interface DeletableRecordStatus {
  /** ID del registro */
  id: number;
  /** Puede ser eliminado */
  canDelete: boolean;
  /** Razón por la que no puede eliminarse (si canDelete = false) */
  reason?: string;
}
