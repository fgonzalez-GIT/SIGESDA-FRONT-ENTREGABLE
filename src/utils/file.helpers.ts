/**
 * Utilidades para manejo de archivos (descarga, formateo de tamaños, etc.)
 */

/**
 * Formatea un tamaño en bytes a formato legible (KB, MB, GB)
 *
 * @param bytes - Tamaño en bytes
 * @returns String formateado (ej: "257.2 KB", "1.19 MB")
 *
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(263371) // "257.2 KB"
 * formatFileSize(1250000) // "1.19 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Descarga un archivo Blob en el navegador
 *
 * Crea un enlace temporal, triggerea el click, y limpia recursos.
 *
 * @param blob - Objeto Blob con los datos del archivo
 * @param filename - Nombre del archivo para la descarga
 *
 * @example
 * const blob = await backupsService.downloadBackup('backup_20260213_165223.dump');
 * downloadFile(blob, 'backup_20260213_165223.dump');
 */
export function downloadFile(blob: Blob, filename: string): void {
  // Crear URL temporal para el blob
  const url = window.URL.createObjectURL(blob);

  // Crear enlace de descarga
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Agregar al DOM, click, y remover
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Limpiar URL temporal para liberar memoria
  window.URL.revokeObjectURL(url);
}

/**
 * Valida que un archivo no exceda un tamaño máximo
 *
 * @param file - Archivo a validar
 * @param maxMB - Tamaño máximo permitido en megabytes
 * @returns true si el archivo es válido, false si excede el límite
 *
 * @example
 * if (!validateFileSize(file, 500)) {
 *   throw new Error('El archivo no puede superar 500 MB');
 * }
 */
export function validateFileSize(file: File, maxMB: number): boolean {
  const maxBytes = maxMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Obtiene la extensión de un archivo a partir de su nombre
 *
 * @param filename - Nombre del archivo
 * @returns Extensión del archivo (sin el punto) o string vacío si no tiene
 *
 * @example
 * getFileExtension('backup_20260213_165223.dump') // "dump"
 * getFileExtension('archivo.tar.gz') // "gz"
 * getFileExtension('sinextension') // ""
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Valida que un nombre de archivo de backup sea válido según las reglas del backend
 *
 * Reglas:
 * - Debe terminar en .dump
 * - Solo puede contener letras, números, guiones (-) y guiones bajos (_)
 * - No puede contener .., /, \
 *
 * @param filename - Nombre del archivo a validar
 * @returns null si es válido, mensaje de error si no lo es
 *
 * @example
 * validateBackupFilename('backup_20260213_165223.dump') // null (válido)
 * validateBackupFilename('backup.txt') // "El archivo debe tener extensión .dump"
 * validateBackupFilename('../backup.dump') // "El nombre no puede contener .., / o \\"
 */
export function validateBackupFilename(filename: string): string | null {
  if (!filename) {
    return 'El nombre del archivo es requerido';
  }

  if (!filename.endsWith('.dump')) {
    return 'El archivo debe tener extensión .dump';
  }

  // Validar caracteres permitidos (solo letras, números, guiones, guiones bajos, punto)
  if (!/^[a-zA-Z0-9_-]+\.dump$/.test(filename)) {
    return 'Nombre de archivo inválido. Solo se permiten letras, números, guiones y guiones bajos';
  }

  // Validar path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return 'El nombre no puede contener "..", "/" o "\\"';
  }

  return null; // Válido
}
