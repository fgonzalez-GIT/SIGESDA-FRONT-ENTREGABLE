/**
 * Utilidades para manipulación de strings
 */

/**
 * Genera un código válido a partir de un nombre usando las primeras 4 letras de cada palabra
 *
 * @param nombre - El nombre del cual generar el código
 * @returns Código generado en formato MAYUSCULAS_CON_GUIONES_BAJOS
 *
 * @example
 * generateCodigoFromNombre("Categoría Base") // "CATE_BASE"
 * generateCodigoFromNombre("Tipo Especial Mensual") // "TIPO_ESPE_MENS"
 * generateCodigoFromNombre("Ítem de Cuota") // "ITEM_DE_CUOT"
 * generateCodigoFromNombre("No Socio") // "NO_SOCI"
 */
export function generateCodigoFromNombre(nombre: string): string {
  if (!nombre || typeof nombre !== 'string') {
    return '';
  }

  // Normalizar: remover acentos y caracteres especiales
  const normalizado = nombre
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    .replace(/ñ/gi, 'n') // Reemplazar ñ por n
    .toUpperCase(); // Convertir a mayúsculas

  // Dividir por espacios, guiones y otros separadores
  const palabras = normalizado
    .split(/[\s\-_,;.]+/) // Dividir por espacios, guiones, etc.
    .filter(palabra => palabra.length > 0); // Filtrar palabras vacías

  // Tomar las primeras 4 letras de cada palabra (o la palabra completa si es más corta)
  const prefijos = palabras.map(palabra => {
    // Si la palabra tiene 4 o menos caracteres, usar la palabra completa
    if (palabra.length <= 4) {
      return palabra;
    }
    // Si tiene más de 4 caracteres, tomar solo los primeros 4
    return palabra.substring(0, 4);
  });

  // Unir con guiones bajos
  let codigo = prefijos.join('_');

  // Filtrar solo caracteres válidos: A-Z, 0-9, y guiones bajos
  codigo = codigo.replace(/[^A-Z0-9_]/g, '');

  // Remover guiones bajos duplicados o al inicio/final
  codigo = codigo
    .replace(/_+/g, '_') // Reemplazar múltiples guiones bajos con uno solo
    .replace(/^_+/, '') // Eliminar guiones bajos al inicio
    .replace(/_+$/, ''); // Eliminar guiones bajos al final

  return codigo;
}

/**
 * Valida si un código cumple con el formato esperado
 *
 * @param codigo - El código a validar
 * @returns true si el código es válido, false en caso contrario
 */
export function isCodigoValido(codigo: string): boolean {
  if (!codigo || typeof codigo !== 'string') {
    return false;
  }

  // Debe contener solo mayúsculas, números y guiones bajos
  const CODIGO_REGEX = /^[A-Z0-9_]+$/;
  return CODIGO_REGEX.test(codigo);
}
