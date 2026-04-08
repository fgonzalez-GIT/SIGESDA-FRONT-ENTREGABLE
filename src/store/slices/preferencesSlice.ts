import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Preferencias de Usuario
 *
 * Almacena configuraciones personalizables del usuario:
 * - Formato de hora (24h vs 12h AM/PM)
 * - Futuras preferencias: idioma, tema, etc.
 */

export type TimeFormat = '24h' | '12h';

export interface PreferencesState {
  timeFormat: TimeFormat;
}

const STORAGE_KEY = 'userPreferences';

/**
 * Carga preferencias desde localStorage
 */
const loadPreferencesFromStorage = (): PreferencesState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        timeFormat: parsed.timeFormat || '24h',
      };
    }
  } catch (error) {
    console.error('[PreferencesSlice] Error al cargar preferencias:', error);
  }

  // Valores por defecto (estándar argentino)
  return {
    timeFormat: '24h',
  };
};

/**
 * Guarda preferencias en localStorage
 */
const savePreferencesToStorage = (state: PreferencesState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[PreferencesSlice] Error al guardar preferencias:', error);
  }
};

const initialState: PreferencesState = loadPreferencesFromStorage();

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setTimeFormat: (state, action: PayloadAction<TimeFormat>) => {
      state.timeFormat = action.payload;
      savePreferencesToStorage(state);
    },

    resetPreferences: (state) => {
      state.timeFormat = '24h';
      savePreferencesToStorage(state);
    },

    loadPreferences: (state) => {
      const loaded = loadPreferencesFromStorage();
      state.timeFormat = loaded.timeFormat;
    },
  },
});

export const { setTimeFormat, resetPreferences, loadPreferences } = preferencesSlice.actions;

export default preferencesSlice.reducer;
