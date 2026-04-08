/**
 * Utilidades para manejo de horarios
 */

/**
 * Parsea una hora en formato "HH:MM" a minutos desde medianoche
 * @param hora - Hora en formato "HH:MM"
 * @returns Minutos desde las 00:00
 */
export const parseHorario = (hora: string): number => {
  const [hh, mm] = hora.split(':').map(Number);
  return hh * 60 + mm;
};

/**
 * Valida que una hora de fin sea mayor a la hora de inicio
 * @param inicio - Hora de inicio en formato "HH:MM"
 * @param fin - Hora de fin en formato "HH:MM"
 * @returns true si el horario es válido
 */
export const validarHorario = (inicio: string, fin: string): boolean => {
  return parseHorario(fin) > parseHorario(inicio);
};

/**
 * Detecta si dos horarios se solapan
 * @param h1 - Primer horario con inicio y fin
 * @param h2 - Segundo horario con inicio y fin
 * @returns true si los horarios se solapan
 */
export const detectarSolapamiento = (
  h1: { inicio: string; fin: string },
  h2: { inicio: string; fin: string }
): boolean => {
  const h1Start = parseHorario(h1.inicio);
  const h1End = parseHorario(h1.fin);
  const h2Start = parseHorario(h2.inicio);
  const h2End = parseHorario(h2.fin);

  // Dos rangos se solapan si:
  // El inicio de h1 está antes del fin de h2 Y el fin de h1 está después del inicio de h2
  return h1Start < h2End && h1End > h2Start;
};

/**
 * Calcula la duración de un horario en horas
 * @param inicio - Hora de inicio en formato "HH:MM"
 * @param fin - Hora de fin en formato "HH:MM"
 * @returns Duración en horas (decimal)
 */
export const calcularDuracionHoras = (inicio: string, fin: string): number => {
  const minutos = parseHorario(fin) - parseHorario(inicio);
  return minutos / 60;
};

/**
 * Formatea un rango horario
 * @param inicio - Hora de inicio en formato "HH:MM"
 * @param fin - Hora de fin en formato "HH:MM"
 * @returns String formateado "HH:MM-HH:MM"
 */
export const formatearHorario = (inicio: string, fin: string): string => {
  return `${inicio}-${fin}`;
};

/**
 * Convierte minutos a formato "HH:MM"
 * @param minutos - Minutos desde medianoche
 * @returns Hora en formato "HH:MM"
 */
export const minutosAHora = (minutos: number): string => {
  const hh = Math.floor(minutos / 60);
  const mm = minutos % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
};

/**
 * Valida el formato de una hora
 * @param hora - Hora a validar
 * @returns true si el formato es válido "HH:MM"
 */
export const validarFormatoHora = (hora: string): boolean => {
  const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(hora);
};
