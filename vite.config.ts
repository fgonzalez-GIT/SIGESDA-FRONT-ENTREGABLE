import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3003,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Enfoque pragmático: Permitir build con errores TS conocidos (143 documentados)
    // Ver GUIA_DESARROLLO_FRONTEND.md sección "DEUDA TÉCNICA TYPESCRIPT"
    rollupOptions: {
      onwarn(warning, warn) {
        // Suprimir warnings de TS durante build
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      }
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
})