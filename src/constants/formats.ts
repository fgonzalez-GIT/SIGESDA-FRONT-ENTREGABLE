/**
 * Constantes de formato de fecha/hora para SIGESDA Frontend
 *
 * **Estándar adoptado**: es-AR (Español Argentina)
 * - Formato de fecha: DD/MM/YYYY
 * - Formato de hora: 24 horas (HH:mm)
 * - Moneda: ARS (Peso Argentino)
 *
 * @module constants/formats
 */

/**
 * Locale principal de la aplicación
 * @constant {string}
 */
export const LOCALE = 'es-AR';

/**
 * Locale para date-fns (usado en MUI DatePickers)
 * @constant {string}
 */
export const DATE_FNS_LOCALE = 'es';

/**
 * Opciones de formato para fechas cortas (DD/MM/YYYY)
 * @constant {Intl.DateTimeFormatOptions}
 * @example
 * new Date().toLocaleDateString(LOCALE, DATE_FORMAT_SHORT)
 * // => "06/03/2026"
 */
export const DATE_FORMAT_SHORT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

/**
 * Opciones de formato para fechas largas (DD de MMMM de YYYY)
 * @constant {Intl.DateTimeFormatOptions}
 * @example
 * new Date().toLocaleDateString(LOCALE, DATE_FORMAT_LONG)
 * // => "6 de marzo de 2026"
 */
export const DATE_FORMAT_LONG: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

/**
 * Opciones de formato para fechas con día de la semana
 * @constant {Intl.DateTimeFormatOptions}
 * @example
 * new Date().toLocaleDateString(LOCALE, DATE_FORMAT_WITH_WEEKDAY)
 * // => "viernes, 6 de marzo de 2026"
 */
export const DATE_FORMAT_WITH_WEEKDAY: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

/**
 * Opciones de formato para fecha y hora (DD/MM/YYYY HH:mm)
 * @constant {Intl.DateTimeFormatOptions}
 * @example
 * new Date().toLocaleString(LOCALE, DATETIME_FORMAT_SHORT)
 * // => "06/03/2026, 10:30"
 */
export const DATETIME_FORMAT_SHORT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

/**
 * Opciones de formato para fecha y hora larga (24h)
 * @constant {Intl.DateTimeFormatOptions}
 * @example
 * new Date().toLocaleString(LOCALE, DATETIME_FORMAT_LONG)
 * // => "6 de marzo de 2026, 10:30"
 */
export const DATETIME_FORMAT_LONG: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

/**
 * Opciones de formato para fecha y hora corta en formato 12h (DD/MM/YYYY hh:mm AM/PM)
 * @constant {Intl.DateTimeFormatOptions}
 * @example
 * new Date().toLocaleString(LOCALE, DATETIME_FORMAT_SHORT_12H)
 * // => "06/03/2026, 10:30 a. m."
 */
export const DATETIME_FORMAT_SHORT_12H: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

/**
 * Opciones de formato para fecha y hora larga en formato 12h
 * @constant {Intl.DateTimeFormatOptions}
 * @example
 * new Date().toLocaleString(LOCALE, DATETIME_FORMAT_LONG_12H)
 * // => "6 de marzo de 2026, 10:30 a. m."
 */
export const DATETIME_FORMAT_LONG_12H: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

/**
 * Opciones de formato para solo hora en formato 24h (HH:mm)
 * @constant {Intl.DateTimeFormatOptions}
 * @example
 * new Date().toLocaleTimeString(LOCALE, TIME_FORMAT)
 * // => "10:30"
 */
export const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

/**
 * Opciones de formato para solo hora en formato 12h (hh:mm AM/PM)
 * @constant {Intl.DateTimeFormatOptions}
 * @example
 * new Date().toLocaleTimeString(LOCALE, TIME_FORMAT_12H)
 * // => "10:30 a. m."
 */
export const TIME_FORMAT_12H: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

/**
 * Formato para inputs HTML5 type="date" (YYYY-MM-DD)
 * @constant {string}
 */
export const HTML5_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Formato para inputs HTML5 type="time" (HH:mm)
 * @constant {string}
 */
export const HTML5_TIME_FORMAT = 'HH:mm';

/**
 * Opciones de formato para moneda (ARS)
 * @constant {Intl.NumberFormatOptions}
 * @example
 * new Intl.NumberFormat(LOCALE, CURRENCY_FORMAT).format(1234.56)
 * // => "$1.234,56"
 */
export const CURRENCY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'ARS',
};

/**
 * Opciones de formato para números con decimales
 * @constant {Intl.NumberFormatOptions}
 * @example
 * new Intl.NumberFormat(LOCALE, NUMBER_FORMAT_DECIMAL).format(1234.56)
 * // => "1.234,56"
 */
export const NUMBER_FORMAT_DECIMAL: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/**
 * Opciones de formato para números enteros
 * @constant {Intl.NumberFormatOptions}
 * @example
 * new Intl.NumberFormat(LOCALE, NUMBER_FORMAT_INTEGER).format(1234)
 * // => "1.234"
 */
export const NUMBER_FORMAT_INTEGER: Intl.NumberFormatOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};
