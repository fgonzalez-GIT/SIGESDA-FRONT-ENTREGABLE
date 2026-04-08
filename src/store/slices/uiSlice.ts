import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  loading: boolean;
  error: string | null;
  notification: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
}

const initialState: UiState = {
  sidebarOpen: true,
  loading: false,
  error: null,
  notification: {
    open: false,
    message: '',
    severity: 'info',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    showNotification: (state, action: PayloadAction<{
      message: string;
      severity?: 'success' | 'error' | 'warning' | 'info';
    }>) => {
      state.notification = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'info',
      };
    },
    hideNotification: (state) => {
      state.notification.open = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  setError,
  showNotification,
  hideNotification,
} = uiSlice.actions;

export default uiSlice.reducer;