import { User, LoginCredentials, AuthResponse } from '@/types/auth.types';

/**
 * Usuarios mock para desarrollo
 * En producción, estos datos vendrían del backend
 */
const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 1,
    email: 'admin@sigesda.com',
    password: 'admin123',
    nombre: 'Admin',
    apellido: 'Sistema',
    rol: 'admin',
  },
  {
    id: 2,
    email: 'socio@sigesda.com',
    password: 'socio123',
    nombre: 'Juan',
    apellido: 'Pérez',
    rol: 'socio',
    personaId: 1,
  },
  {
    id: 3,
    email: 'docente@sigesda.com',
    password: 'docente123',
    nombre: 'María',
    apellido: 'González',
    rol: 'docente',
    personaId: 2,
  },
  {
    id: 4,
    email: 'catalogos@sigesda.com',
    password: 'cat123',
    nombre: 'Ana',
    apellido: 'Martínez',
    rol: 'admin_catalogos',
  },
  {
    id: 5,
    email: 'lectura@sigesda.com',
    password: 'lectura123',
    nombre: 'Pedro',
    apellido: 'López',
    rol: 'lectura',
  },
];

/**
 * Simula un delay de red
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Servicio de autenticación (mockeado)
 */
export const authApi = {
  /**
   * Realiza el login de un usuario
   * @param credentials - Email y contraseña
   * @returns Respuesta con el usuario autenticado
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Simular delay de red (300-800ms)
    await delay(300 + Math.random() * 500);

    const user = MOCK_USERS.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      return {
        success: false,
        error: 'Credenciales inválidas',
        message: 'El email o la contraseña son incorrectos',
      };
    }

    // No incluir password en la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      message: 'Inicio de sesión exitoso',
    };
  },

  /**
   * Cierra la sesión del usuario
   */
  logout: async (): Promise<void> => {
    // Simular delay mínimo
    await delay(100);

    // En un backend real, aquí se invalidaría el token de sesión
    console.log('Sesión cerrada');
  },

  /**
   * Obtiene el usuario actual desde el servidor
   * En este mock, no hace nada porque usamos sessionStorage
   * En producción, esto validaría un token con el backend
   */
  getCurrentUser: async (): Promise<User | null> => {
    await delay(100);

    // En producción, aquí se validaría el token con el backend
    // Por ahora retornamos null, el cliente usa sessionStorage
    return null;
  },

  /**
   * Verifica si un email está registrado (para futura implementación)
   */
  checkEmail: async (email: string): Promise<boolean> => {
    await delay(200);
    return MOCK_USERS.some((u) => u.email === email);
  },

  /**
   * Obtiene los usuarios mock (solo para desarrollo/debug)
   */
  getMockUsers: (): Array<Omit<User & { password: string }, 'password'>> => {
    return MOCK_USERS.map(({ password, ...user }) => ({
      ...user,
      password: '****', // Ocultar password real
    })) as Array<Omit<User & { password: string }, 'password'>>;
  },
};

/**
 * Helper para thunks de Redux
 * Envuelve la función de login y maneja errores
 */
export const loginThunk = async (credentials: LoginCredentials) => {
  const response = await authApi.login(credentials);

  if (!response.success || !response.user) {
    throw new Error(response.error || response.message || 'Error al iniciar sesión');
  }

  return response.user;
};
