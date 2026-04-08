import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import personasReducer from './slices/personasSlice';
import actividadesReducer from './slices/actividadesSlice';
import aulasReducer from './slices/aulasSlice';
import reservasReducer from './slices/reservasSlice';
import estadosReservasReducer from './slices/estadosReservasSlice';
import cuotasReducer from './slices/cuotasSlice';
import recibosReducer from './slices/recibosSlice';
import familiaresReducer from './slices/familiaresSlice';
import categoriasReducer from './slices/categoriasSlice';
import tiposActividadReducer from './slices/tiposActividadSlice';
import categoriasActividadReducer from './slices/categoriasActividadSlice';
import equipamientosReducer from './slices/equipamientosSlice';
import ajustesReducer from './slices/ajustesSlice';
import exencionesReducer from './slices/exencionesSlice';
import itemsCuotaReducer from './slices/itemsCuotaSlice';
import pagosActividadesReducer from './slices/pagosActividadesSlice';
import preferencesReducer from './slices/preferencesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    preferences: preferencesReducer,
    personas: personasReducer,
    actividades: actividadesReducer,
    aulas: aulasReducer,
    reservas: reservasReducer,
    estadosReservas: estadosReservasReducer,
    cuotas: cuotasReducer,
    recibos: recibosReducer,
    familiares: familiaresReducer,
    categorias: categoriasReducer,
    tiposActividad: tiposActividadReducer,
    categoriasActividad: categoriasActividadReducer,
    equipamientos: equipamientosReducer,
    ajustes: ajustesReducer,
    exenciones: exencionesReducer,
    itemsCuota: itemsCuotaReducer,
    pagosActividades: pagosActividadesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export hooks for convenience
export { useAppDispatch, useAppSelector } from '@/hooks/redux';