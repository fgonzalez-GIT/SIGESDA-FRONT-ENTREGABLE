/**
 * Tipos para el sistema de autenticación
 */

/**
 * Roles disponibles en el sistema
 */
export type UserRole =
  | 'admin'              // Administrador con todos los permisos
  | 'socio'              // Socio del club
  | 'docente'            // Docente de actividades
  | 'admin_catalogos'    // Administrador de catálogos
  | 'lectura';           // Usuario con permisos de solo lectura

/**
 * Usuario autenticado en el sistema
 */
export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  personaId?: number;  // ID de la persona asociada (opcional)
}

/**
 * Estado de autenticación en Redux
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Credenciales para el login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta del servicio de autenticación
 */
export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

/**
 * Datos almacenados en sessionStorage
 */
export interface StoredAuth {
  user: User;
  timestamp: number;
}
