import { useState, useEffect, useCallback } from 'react';
import { catalogosItemsAdminApi } from '@/services/catalogosItemsAdminApi';

/**
 * Estado de validación de código único
 */
export interface ValidacionCodigoState {
  /** Indica si se está validando actualmente */
  validando: boolean;
  /** Indica si el código es válido y está disponible */
  disponible: boolean | null;
  /** Mensaje de error o advertencia */
  mensaje: string | null;
}

/**
 * Tipo de catálogo a validar
 */
export type TipoCatalogo = 'categoria' | 'tipo';

/**
 * Hook para validar códigos únicos en tiempo real con debounce
 * Útil para formularios de creación/edición de catálogos
 *
 * @param tipo - Tipo de catálogo ('categoria' | 'tipo')
 * @param codigo - Código a validar
 * @param idExcluir - ID a excluir de la validación (para edición)
 * @param debounceMs - Tiempo de debounce en milisegundos (default: 500)
 * @returns Estado de validación con propiedades: validando, disponible, mensaje
 *
 * @example
 * ```tsx
 * const { validando, disponible, mensaje } = useValidacionCodigoUnico(
 *   'categoria',
 *   codigoValue,
 *   categoriaEditando?.id
 * );
 *
 * // Mostrar feedback en el formulario
 * <TextField
 *   error={disponible === false}
 *   helperText={mensaje || 'Código del catálogo'}
 * />
 * ```
 */
export const useValidacionCodigoUnico = (
  tipo: TipoCatalogo,
  codigo: string,
  idExcluir?: number,
  debounceMs: number = 500
): ValidacionCodigoState => {
  const [state, setState] = useState<ValidacionCodigoState>({
    validando: false,
    disponible: null,
    mensaje: null,
  });

  /**
   * Función de validación (memoizada)
   */
  const validarCodigo = useCallback(
    async (codigoAValidar: string, idAExcluir?: number) => {
      // No validar si el código está vacío
      if (!codigoAValidar || codigoAValidar.trim().length === 0) {
        setState({
          validando: false,
          disponible: null,
          mensaje: null,
        });
        return;
      }

      // Validar formato del código (solo mayúsculas, números y guiones bajos)
      const formatoValido = /^[A-Z0-9_]+$/.test(codigoAValidar);
      if (!formatoValido) {
        setState({
          validando: false,
          disponible: false,
          mensaje: 'El código solo puede contener mayúsculas, números y guiones bajos',
        });
        return;
      }

      // Iniciar validación
      setState({
        validando: true,
        disponible: null,
        mensaje: 'Validando código...',
      });

      try {
        let response;

        if (tipo === 'categoria') {
          response = await catalogosItemsAdminApi.validarCodigoCategoriaItem(
            codigoAValidar,
            idAExcluir
          );
        } else {
          response = await catalogosItemsAdminApi.validarCodigoTipoItem(
            codigoAValidar,
            idAExcluir
          );
        }

        if (response.success && response.data) {
          setState({
            validando: false,
            disponible: response.data.disponible,
            mensaje: response.data.disponible
              ? '✓ Código disponible'
              : response.data.mensaje || 'El código ya está en uso',
          });
        } else {
          setState({
            validando: false,
            disponible: false,
            mensaje: response.message || 'Error al validar código',
          });
        }
      } catch (error: any) {
        console.error('Error al validar código:', error);

        // Si el backend no implementa validación, asumir disponible
        if (error.response?.status === 404) {
          setState({
            validando: false,
            disponible: null,
            mensaje: null,
          });
        } else {
          setState({
            validando: false,
            disponible: null,
            mensaje: 'Error al validar código. Por favor, intenta nuevamente.',
          });
        }
      }
    },
    [tipo]
  );

  /**
   * Efecto con debounce para validar código
   */
  useEffect(() => {
    // No validar si el código está vacío o tiene menos de 2 caracteres
    if (!codigo || codigo.length < 2) {
      setState({
        validando: false,
        disponible: null,
        mensaje: null,
      });
      return;
    }

    // Debounce: esperar antes de validar
    const timeoutId = setTimeout(() => {
      validarCodigo(codigo, idExcluir);
    }, debounceMs);

    // Cleanup: cancelar validación anterior si el código cambia
    return () => {
      clearTimeout(timeoutId);
    };
  }, [codigo, idExcluir, debounceMs, validarCodigo]);

  return state;
};

/**
 * Hook simplificado para validar código de categoría
 */
export const useValidacionCodigoCategoria = (
  codigo: string,
  idExcluir?: number,
  debounceMs?: number
) => {
  return useValidacionCodigoUnico('categoria', codigo, idExcluir, debounceMs);
};

/**
 * Hook simplificado para validar código de tipo
 */
export const useValidacionCodigoTipo = (
  codigo: string,
  idExcluir?: number,
  debounceMs?: number
) => {
  return useValidacionCodigoUnico('tipo', codigo, idExcluir, debounceMs);
};

export default useValidacionCodigoUnico;
