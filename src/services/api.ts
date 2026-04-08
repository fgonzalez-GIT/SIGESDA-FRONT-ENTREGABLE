import axios from 'axios';
import { getStoredAuth } from '@/utils/auth.utils';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de request: Agregar información de autenticación
 */
api.interceptors.request.use(
  (config) => {
    const user = getStoredAuth();

    // Log de la petición
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}${user ? ` (User: ${user.email})` : ''}`);

    // En un sistema real, aquí se agregaría el token de autenticación
    // config.headers.Authorization = `Bearer ${token}`;

    // Por ahora solo agregamos el userId si existe (para backend mock)
    if (user) {
      config.headers['X-User-Id'] = String(user.id);
      config.headers['X-User-Role'] = user.rol;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de response: Manejar errores de autenticación
 */
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[API] ❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`, error.response?.data);

    // Manejar error 401 (No autorizado) - Auto logout
    if (error.response?.status === 401) {
      console.warn('[API] Error 401: Sesión expirada o no autorizada. Redirigiendo a login...');

      // Limpiar sesión y redirigir
      // Importación lazy del store para evitar dependencias circulares
      import('@/store').then(({ store }) => {
        import('@/store/slices/authSlice').then(({ logout }) => {
          store.dispatch(logout());
          window.location.href = '/login';
        });
      });
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: string[];
}