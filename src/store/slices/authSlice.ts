import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types/auth.types';
import { getStoredAuth, setStoredAuth, clearStoredAuth } from '@/utils/auth.utils';

/**
 * Estado inicial del slice de autenticación
 * Se carga desde sessionStorage si existe
 */
const initialState: AuthState = {
  user: getStoredAuth(),
  isAuthenticated: getStoredAuth() !== null,
  loading: false,
  error: null,
};

/**
 * Slice de autenticación
 * Maneja el estado global de autenticación del usuario
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Establece el estado de carga
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null; // Limpiar error al iniciar carga
      }
    },

    /**
     * Establece un error de autenticación
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    /**
     * Realiza el login del usuario
     * Guarda el usuario en el estado y en sessionStorage
     */
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;

      // Persistir en sessionStorage
      setStoredAuth(action.payload);
    },

    /**
     * Realiza el logout del usuario
     * Limpia el estado y el sessionStorage
     */
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      // Limpiar sessionStorage
      clearStoredAuth();
    },

    /**
     * Actualiza los datos del usuario actual
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;

      // Actualizar en sessionStorage
      setStoredAuth(action.payload);
    },

    /**
     * Limpia el error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Exportar acciones
export const {
  setLoading,
  setError,
  loginSuccess,
  logout,
  setUser,
  clearError,
} = authSlice.actions;

// Exportar reducer
export default authSlice.reducer;

// Selectores
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
