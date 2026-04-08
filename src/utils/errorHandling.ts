/**
 * Sistema de Manejo de Errores Unificado
 * Proporciona manejo consistente de errores de API en toda la aplicación
 */

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

/** Mapeo de códigos de error a mensajes amigables */
const ERROR_MESSAGES: Record<string, string> = {
  'CAPACIDAD_MAXIMA_ALCANZADA': 'La actividad ha alcanzado su capacidad máxima',
  'YA_INSCRIPTO': 'Esta persona ya está inscripta en la actividad',
  'TIPOS_EXCLUYENTES': 'Los tipos SOCIO y NO_SOCIO son mutuamente excluyentes',
  'DOCENTE_YA_ASIGNADO': 'Este docente ya está asignado a la actividad',
  'AUTO_REFERENCIA': 'Una persona no puede agregarse a sí misma como familiar',
  'RELACION_YA_EXISTE': 'Esta relación familiar ya existe',
  'CUPO_COMPLETO': 'No hay cupos disponibles para esta actividad',
};

/**
 * Extrae un mensaje de error amigable de una respuesta de error
 */
export const getErrorMessage = (error: any): string => {
  const apiError: ApiError | undefined = error?.response?.data;

  if (!apiError) {
    return error?.message || 'Error inesperado. Por favor intente nuevamente.';
  }

  // Si hay un código de error conocido, usar el mensaje predefinido
  if (apiError.code && ERROR_MESSAGES[apiError.code]) {
    return ERROR_MESSAGES[apiError.code];
  }

  // Caso contrario, usar el mensaje del backend
  return apiError.error || 'Error al procesar la solicitud';
};

/**
 * Maneja errores de API y muestra mensajes apropiados
 * @param error Error capturado
 * @param toast Sistema de notificaciones (react-toastify, notistack, etc.)
 */
export const handleApiError = (error: any, toast?: any) => {
  const mensaje = getErrorMessage(error);

  if (toast && typeof toast.error === 'function') {
    toast.error(mensaje);
  } else {
    console.error('[API Error]:', mensaje, error);
  }
};

/**
 * Hook para manejo estandarizado de errores en componentes
 * Nota: Este debe ser usado como hook de React, pero se exporta como función utility
 * para compatibilidad. En componentes, usar con useCallback o similar.
 */
export const createErrorHandler = (toast?: any) => {
  return {
    handleError: (error: any) => handleApiError(error, toast),

    /**
     * Wrapper para llamadas API con manejo automático de errores
     * @param apiCall Función que realiza la llamada API
     * @param successMessage Mensaje opcional a mostrar en caso de éxito
     * @returns Resultado de la API o null en caso de error
     */
    withErrorHandling: async <T,>(
      apiCall: () => Promise<T>,
      successMessage?: string
    ): Promise<T | null> => {
      try {
        const result = await apiCall();
        if (successMessage && toast && typeof toast.success === 'function') {
          toast.success(successMessage);
        }
        return result;
      } catch (error) {
        handleApiError(error, toast);
        return null;
      }
    },
  };
};

/**
 * Valida si un error es de tipo específico
 */
export const isErrorCode = (error: any, code: string): boolean => {
  const apiError: ApiError | undefined = error?.response?.data;
  return apiError?.code === code;
};

/**
 * Obtiene detalles adicionales del error si están disponibles
 */
export const getErrorDetails = (error: any): any | null => {
  const apiError: ApiError | undefined = error?.response?.data;
  return apiError?.details || null;
};
