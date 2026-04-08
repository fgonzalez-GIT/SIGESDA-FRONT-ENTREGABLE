import { User, StoredAuth, UserRole } from '@/types/auth.types';

const AUTH_STORAGE_KEY = 'sigesda_auth';

/**
 * Lee los datos de autenticación desde sessionStorage
 */
export const getStoredAuth = (): User | null => {
  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const data: StoredAuth = JSON.parse(stored);

    // Validar que no haya expirado (opcional: agregar validación de tiempo)
    // Por ahora solo retornamos el usuario
    return data.user;
  } catch (error) {
    console.error('Error al leer autenticación almacenada:', error);
    clearStoredAuth();
    return null;
  }
};

/**
 * Guarda los datos de autenticación en sessionStorage
 */
export const setStoredAuth = (user: User): void => {
  try {
    const data: StoredAuth = {
      user,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error al guardar autenticación:', error);
  }
};

/**
 * Limpia los datos de autenticación del sessionStorage
 */
export const clearStoredAuth = (): void => {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Error al limpiar autenticación:', error);
  }
};

/**
 * Valida si un usuario tiene uno de los roles requeridos
 * @param user - Usuario a validar
 * @param allowedRoles - Array de roles permitidos
 * @returns true si el usuario tiene al menos uno de los roles
 */
export const hasRole = (user: User | null, allowedRoles: UserRole[]): boolean => {
  if (!user) return false;
  return allowedRoles.includes(user.rol);
};

/**
 * Obtiene el nombre completo del usuario
 */
export const getFullName = (user: User | null): string => {
  if (!user) return '';
  return `${user.nombre} ${user.apellido}`;
};

/**
 * Obtiene el label legible del rol
 */
export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: 'Administrador',
    socio: 'Socio',
    docente: 'Docente',
    admin_catalogos: 'Admin. Catálogos',
    lectura: 'Solo Lectura',
  };
  return labels[role] || role;
};
