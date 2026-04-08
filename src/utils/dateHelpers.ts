/**
 * Date Helpers para manejo de fechas ISO 8601
 *
 * **Estándar SIGESDA**: es-AR (Español Argentina)
 * - Backend: ISO 8601 completo con timezone (ej: "2025-11-26T10:00:00.000Z")
 * - Display: DD/MM/YYYY y formato 24 horas
 * - Locale: es-AR para consistencia con moneda ARS
 *
 * @see /src/constants/formats.ts para configuración de formatos
 */

import {
  LOCALE,
  DATE_FORMAT_SHORT,
  DATE_FORMAT_LONG,
  DATETIME_FORMAT_SHORT,
  DATETIME_FORMAT_SHORT_12H,
  DATETIME_FORMAT_LONG_12H,
  TIME_FORMAT,
  TIME_FORMAT_12H,
} from '@/constants/formats';

/**
 * Convierte un objeto Date a string ISO 8601
 */
export function toISO8601(date: Date): string {
  return date.toISOString();
}

/**
 * Convierte un string ISO 8601 a objeto Date
 */
export function fromISO8601(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Calcula la duración en minutos entre dos fechas
 */
export function calculateDuration(start: string | Date, end: string | Date): number {
  const startDate = typeof start === 'string' ? fromISO8601(start) : start;
  const endDate = typeof end === 'string' ? fromISO8601(end) : end;

  const durationMs = endDate.getTime() - startDate.getTime();
  return Math.floor(durationMs / (1000 * 60)); // Convertir a minutos
}

/**
 * Valida que la duración esté entre 30 minutos y 12 horas
 */
export function validateDuration(start: string | Date, end: string | Date): boolean {
  const durationMinutes = calculateDuration(start, end);
  return durationMinutes >= 30 && durationMinutes <= 720; // 30 min - 12 horas
}

/**
 * Verifica si una fecha está en el pasado (permite hasta 1 hora atrás)
 */
export function isInPast(date: string | Date, flexibilityHours: number = 1): boolean {
  const checkDate = typeof date === 'string' ? fromISO8601(date) : date;
  const now = new Date();
  const flexibilityMs = flexibilityHours * 60 * 60 * 1000;
  const threshold = new Date(now.getTime() - flexibilityMs);

  return checkDate < threshold;
}

/**
 * Verifica si una fecha/hora está en el futuro
 */
export function isInFuture(date: string | Date): boolean {
  const checkDate = typeof date === 'string' ? fromISO8601(date) : date;
  const now = new Date();
  return checkDate > now;
}

/**
 * Formatea una fecha ISO 8601 a formato legible en español (es-AR)
 * @param dateString - Fecha en formato ISO 8601
 * @returns Fecha formateada: "06/03/2026, 10:00"
 * @example
 * formatDateTimeES("2026-03-06T10:00:00.000Z")
 * // => "06/03/2026, 10:00"
 */
export function formatDateTimeES(dateString: string): string {
  const date = fromISO8601(dateString);
  return date.toLocaleString(LOCALE, DATETIME_FORMAT_SHORT);
}

/**
 * Formatea solo la fecha en español (es-AR)
 * @param dateString - Fecha en formato ISO 8601
 * @returns Fecha formateada: "06/03/2026"
 * @example
 * formatDateES("2026-03-06T10:00:00.000Z")
 * // => "06/03/2026"
 */
export function formatDateES(dateString: string): string {
  const date = fromISO8601(dateString);
  return date.toLocaleDateString(LOCALE, DATE_FORMAT_SHORT);
}

/**
 * Formatea la fecha en formato largo (es-AR)
 * @param dateString - Fecha en formato ISO 8601
 * @returns Fecha formateada: "6 de marzo de 2026"
 * @example
 * formatDateLongES("2026-03-06T10:00:00.000Z")
 * // => "6 de marzo de 2026"
 */
export function formatDateLongES(dateString: string): string {
  const date = fromISO8601(dateString);
  return date.toLocaleDateString(LOCALE, DATE_FORMAT_LONG);
}

/**
 * Formatea solo la hora en formato 24h (es-AR)
 * @param dateString - Fecha en formato ISO 8601
 * @returns Hora formateada: "10:00"
 * @example
 * formatTimeES("2026-03-06T10:00:00.000Z")
 * // => "10:00"
 */
export function formatTimeES(dateString: string): string {
  const date = fromISO8601(dateString);
  return date.toLocaleTimeString(LOCALE, TIME_FORMAT);
}

/**
 * Formatea solo la hora en formato 12h con AM/PM (es-AR)
 * @param dateString - Fecha en formato ISO 8601
 * @returns Hora formateada: "10:00 a. m."
 * @example
 * formatTimeES12h("2026-03-06T10:00:00.000Z")
 * // => "10:00 a. m."
 */
export function formatTimeES12h(dateString: string): string {
  const date = fromISO8601(dateString);
  return date.toLocaleTimeString(LOCALE, TIME_FORMAT_12H);
}

/**
 * Formatea una hora según la preferencia del usuario (24h o 12h)
 * Acepta múltiples formatos de entrada:
 * - ISO timestamp completo: "1970-01-01T10:00:00.000Z"
 * - Formato simple: "10:00:00" o "10:00"
 *
 * @param timeString - String de hora en cualquier formato
 * @param use12Hour - Si true, usa formato 12h (AM/PM), si false usa 24h
 * @returns Hora formateada según preferencia
 *
 * @example
 * formatTimeByPreference("10:30:00", false) // => "10:30"
 * formatTimeByPreference("10:30:00", true)  // => "10:30 a. m."
 * formatTimeByPreference("1970-01-01T22:00:00.000Z", false) // => "22:00"
 * formatTimeByPreference("1970-01-01T22:00:00.000Z", true)  // => "10:00 p. m."
 */
export function formatTimeByPreference(timeString: string | null | undefined, use12Hour: boolean = false): string {
  if (!timeString) return '';

  try {
    let timePart: string;

    // Detectar formato ISO timestamp completo (contiene 'T')
    if (timeString.includes('T')) {
      // Formato: "1970-01-01T10:00:00.000Z" → extraer "10:00"
      timePart = timeString.substring(11, 16);
    } else {
      // Formato simple: "10:00:00" o "10:00" → extraer "10:00"
      timePart = timeString.substring(0, 5);
    }

    // Si se requiere formato 24h, retornar directamente
    if (!use12Hour) {
      return timePart;
    }

    // Para formato 12h, convertir a Date y formatear
    const [hours, minutes] = timePart.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);

    return date.toLocaleTimeString(LOCALE, TIME_FORMAT_12H);
  } catch (error) {
    console.error('[formatTimeByPreference] Error al formatear:', timeString, error);
    return timeString.substring(0, 5); // Fallback: retornar HH:mm
  }
}

/**
 * Formatea fecha y hora en formato 12h (es-AR)
 * @param dateString - Fecha en formato ISO 8601
 * @returns Fecha y hora formateada: "06/03/2026, 10:00 a. m."
 * @example
 * formatDateTimeES12h("2026-03-06T10:00:00.000Z")
 * // => "06/03/2026, 10:00 a. m."
 */
export function formatDateTimeES12h(dateString: string): string {
  const date = fromISO8601(dateString);
  return date.toLocaleString(LOCALE, DATETIME_FORMAT_SHORT_12H);
}

/**
 * Formatea duración en minutos a string legible
 * Ejemplo: 90 minutos -> "1h 30min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

/**
 * Obtiene el día de la semana en español
 * 0 = Domingo, 6 = Sábado
 */
export function getDayOfWeek(dateString: string): number {
  const date = fromISO8601(dateString);
  return date.getDay();
}

/**
 * Obtiene el nombre del día de la semana en español
 */
export function getDayOfWeekName(dateString: string): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayIndex = getDayOfWeek(dateString);
  return days[dayIndex];
}

/**
 * Verifica si dos rangos de fechas se solapan
 */
export function doRangesOverlap(
  start1: string | Date,
  end1: string | Date,
  start2: string | Date,
  end2: string | Date
): boolean {
  const s1 = typeof start1 === 'string' ? fromISO8601(start1) : start1;
  const e1 = typeof end1 === 'string' ? fromISO8601(end1) : end1;
  const s2 = typeof start2 === 'string' ? fromISO8601(start2) : start2;
  const e2 = typeof end2 === 'string' ? fromISO8601(end2) : end2;

  // Dos rangos se solapan si: (inicio1 < fin2) AND (fin1 > inicio2)
  return s1 < e2 && e1 > s2;
}

/**
 * Agrega horas a una fecha
 */
export function addHours(date: string | Date, hours: number): string {
  const d = typeof date === 'string' ? fromISO8601(date) : date;
  const result = new Date(d.getTime() + hours * 60 * 60 * 1000);
  return toISO8601(result);
}

/**
 * Agrega minutos a una fecha
 */
export function addMinutes(date: string | Date, minutes: number): string {
  const d = typeof date === 'string' ? fromISO8601(date) : date;
  const result = new Date(d.getTime() + minutes * 60 * 1000);
  return toISO8601(result);
}

/**
 * Agrega días a una fecha
 */
export function addDays(date: string | Date, days: number): string {
  const d = typeof date === 'string' ? fromISO8601(date) : date;
  const result = new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
  return toISO8601(result);
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? fromISO8601(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Verifica si una reserva está actualmente en curso
 * (now >= fechaInicio AND now <= fechaFin)
 */
export function isCurrentlyActive(fechaInicio: string, fechaFin: string): boolean {
  const now = new Date();
  const inicio = fromISO8601(fechaInicio);
  const fin = fromISO8601(fechaFin);
  return now >= inicio && now <= fin;
}

/**
 * Convierte una fecha a formato YYYY-MM-DD (para inputs de tipo date)
 */
export function toDateInputFormat(date: string | Date): string {
  const d = typeof date === 'string' ? fromISO8601(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte una fecha a formato HH:mm (para inputs de tipo time)
 */
export function toTimeInputFormat(date: string | Date): string {
  const d = typeof date === 'string' ? fromISO8601(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Combina fecha (YYYY-MM-DD) y hora (HH:mm) en formato ISO 8601
 *
 * @param dateStr - Fecha en formato YYYY-MM-DD
 * @param timeStr - Hora en formato HH:mm
 * @param addDayIfEarlier - Si true y la hora es temprana (00:00-06:00), agrega un día.
 *                          Útil para manejar reservas que cruzan medianoche.
 * @returns Fecha y hora en formato ISO 8601
 *
 * @example
 * // Reserva normal (mismo día)
 * combineDateAndTime("2026-03-07", "10:00") // => "2026-03-07T10:00:00.000Z"
 *
 * @example
 * // Reserva que cruza medianoche (22:00 - 00:00)
 * combineDateAndTime("2026-03-07", "22:00") // => "2026-03-07T22:00:00.000Z" (inicio)
 * combineDateAndTime("2026-03-07", "00:00", true) // => "2026-03-08T00:00:00.000Z" (fin, día siguiente)
 */
export function combineDateAndTime(
  dateStr: string,
  timeStr: string,
  addDayIfEarlier?: boolean
): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // Si addDayIfEarlier está activo y la hora es temprana (00:00-06:00),
  // asumimos que es el día siguiente (cruce de medianoche)
  if (addDayIfEarlier && hours >= 0 && hours < 6) {
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    return toISO8601(nextDay);
  }

  return toISO8601(date);
}

/**
 * Obtiene el inicio del día (00:00:00) para una fecha
 */
export function getStartOfDay(date: string | Date): string {
  const d = typeof date === 'string' ? fromISO8601(date) : date;
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  return toISO8601(startOfDay);
}

/**
 * Obtiene el fin del día (23:59:59) para una fecha
 */
export function getEndOfDay(date: string | Date): string {
  const d = typeof date === 'string' ? fromISO8601(date) : date;
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return toISO8601(endOfDay);
}

// ========================================
// HELPERS PARA DÍAS DE SEMANA
// ========================================

/**
 * Interface para día de semana (compatible con backend)
 */
export interface DiaSemana {
  id: number;
  codigo: string;
  nombre: string;
  orden: number;
}

/**
 * Obtiene el nombre del día de semana desde el objeto diaSemana del backend
 *
 * **FIX para problema de IDs duplicados**: Este helper usa el objeto `diaSemana`
 * que viene directamente del backend en lugar de buscar en el catálogo del frontend.
 * Esto soluciona el problema donde el backend tiene IDs duplicados (15-21) que no
 * coinciden con los IDs esperados por el frontend (1-7).
 *
 * @param diaSemana - Objeto día de semana del backend (puede venir con cualquier ID)
 * @returns El nombre del día en español o 'N/A' si no está disponible
 *
 * @example
 * // Backend envía: { id: 17, codigo: "MIERCOLES", nombre: "Miércoles", orden: 3 }
 * getDiaNombre(horario.diaSemana) // => "Miércoles" ✅
 *
 * // Sin este helper, el frontend buscaría ID 17 en catálogo (solo tiene IDs 1-7) ❌
 */
export function getDiaNombre(diaSemana: DiaSemana | undefined | null): string {
  if (!diaSemana) return 'N/A';
  return diaSemana.nombre;
}

/**
 * Obtiene el código del día de semana desde el objeto diaSemana del backend
 *
 * @param diaSemana - Objeto día de semana del backend
 * @returns El código del día (ej: "LUN", "MAR") o 'N/A' si no está disponible
 *
 * @example
 * getDiaCodigo(horario.diaSemana) // => "MIERCOLES"
 */
export function getDiaCodigo(diaSemana: DiaSemana | undefined | null): string {
  if (!diaSemana) return 'N/A';
  return diaSemana.codigo;
}

/**
 * Obtiene el orden del día de semana (1=Lunes, 7=Domingo)
 *
 * @param diaSemana - Objeto día de semana del backend
 * @returns El orden del día (1-7) o -1 si no está disponible
 *
 * @example
 * getDiaOrden(horario.diaSemana) // => 3 (Miércoles)
 */
export function getDiaOrden(diaSemana: DiaSemana | undefined | null): number {
  if (!diaSemana) return -1;
  return diaSemana.orden;
}
