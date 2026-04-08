/**
 * Utilidades para validación y manejo de contactos
 */

/**
 * Validar formato de valor según pattern del tipo de contacto
 *
 * @param valor - Valor del contacto a validar
 * @param pattern - Regex pattern del tipo de contacto (puede ser null)
 * @returns true si el valor es válido, false si no cumple el pattern
 *
 * @example
 * ```ts
 * validatePattern('test@example.com', '^[^@]+@[^@]+\\.[^@]+$') // true
 * validatePattern('invalid-email', '^[^@]+@[^@]+\\.[^@]+$')     // false
 * validatePattern('any-value', null)                            // true (sin pattern siempre válido)
 * ```
 */
export const validatePattern = (valor: string, pattern: string | null | undefined): boolean => {
  if (!pattern || pattern.trim() === '') {
    return true; // Sin pattern, siempre válido
  }

  try {
    const regex = new RegExp(pattern);
    return regex.test(valor);
  } catch (error) {
    console.error('Pattern inválido:', pattern, error);
    return true; // Si el pattern es inválido, permitir el valor (fail-safe)
  }
};

/**
 * Obtener mensaje de error de formato según el tipo de contacto
 *
 * @param tipoNombre - Nombre del tipo de contacto
 * @returns Mensaje de error formateado
 *
 * @example
 * ```ts
 * getPatternErrorMessage('Correo Electrónico')
 * // "El formato del valor no es válido para Correo Electrónico"
 * ```
 */
export const getPatternErrorMessage = (tipoNombre: string): string => {
  return `El formato del valor no es válido para ${tipoNombre}`;
};

/**
 * Obtener placeholder sugerido según el tipo de contacto
 * Usa el código del tipo para sugerir un formato apropiado
 *
 * @param tipoCodigo - Código del tipo de contacto
 * @returns Placeholder sugerido
 */
export const getPlaceholderByTipoCodigo = (tipoCodigo: string): string => {
  const codigo = tipoCodigo.toUpperCase();

  switch (codigo) {
    case 'WHATSAPP':
    case 'TELEFONO':
    case 'PHONE':
    case 'CELULAR':
      return '+54 9 11 1234-5678';
    case 'EMAIL':
      return 'ejemplo@email.com';
    case 'FACEBOOK':
      return 'usuario o URL completa';
    case 'INSTAGRAM':
      return '@usuario o URL completa';
    case 'TWITTER':
    case 'X':
      return '@usuario o URL completa';
    case 'LINKEDIN':
      return 'nombre-usuario o URL completa';
    case 'WEBSITE':
    case 'WEB':
      return 'https://www.ejemplo.com';
    default:
      return 'Ingrese el valor del contacto';
  }
};

/**
 * Obtener texto de ayuda según el tipo de contacto
 * Prioriza la descripción del catálogo si existe, sino usa texto por defecto
 *
 * @param tipoCodigo - Código del tipo de contacto
 * @param descripcionCatalogo - Descripción del catálogo (opcional)
 * @returns Texto de ayuda
 */
export const getHelperTextByTipoCodigo = (
  tipoCodigo: string,
  descripcionCatalogo?: string | null
): string => {
  // Priorizar descripción del catálogo
  if (descripcionCatalogo) {
    return descripcionCatalogo;
  }

  // Fallback a descripciones hardcodeadas
  const codigo = tipoCodigo.toUpperCase();

  switch (codigo) {
    case 'WHATSAPP':
      return 'Número con código de país (ej: +54 9 11 1234-5678)';
    case 'TELEFONO':
    case 'PHONE':
      return 'Número de teléfono';
    case 'CELULAR':
      return 'Número de teléfono celular';
    case 'EMAIL':
      return 'Dirección de email válida';
    case 'FACEBOOK':
    case 'INSTAGRAM':
    case 'TWITTER':
    case 'X':
    case 'LINKEDIN':
      return 'Nombre de usuario o URL completa del perfil';
    case 'WEBSITE':
    case 'WEB':
      return 'URL completa del sitio web';
    default:
      return '';
  }
};
