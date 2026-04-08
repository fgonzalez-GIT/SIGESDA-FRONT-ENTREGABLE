import { test as setup, expect } from '@playwright/test';

const authFile = '.auth/user.json';

/**
 * Setup de autenticación para tests E2E
 *
 * Este test se ejecuta una vez antes de todos los tests y guarda
 * el estado de autenticación en `.auth/user.json`.
 *
 * ⚠️ LIMITACIÓN CONOCIDA: Storage State y sessionStorage
 * ------------------------------------------------------
 * Playwright `storageState()` solo captura:
 * - ✅ Cookies del navegador
 * - ✅ localStorage
 * - ❌ sessionStorage (NO soportado por diseño)
 *
 * SIGESDA Frontend usa sessionStorage para guardar la autenticación:
 * - Key: 'sigesda_auth' (ver src/utils/auth.utils.ts:34)
 * - Esto causa que `.auth/user.json` quede vacío
 * - Los tests subsecuentes no estarán autenticados
 *
 * SOLUCIÓN ACTUAL:
 * - Helper `loginAsAdmin()` en `e2e/helpers/auth.ts`
 * - Se ejecuta en cada test para hacer login manual
 * - Ver documentación completa en: docs/E2E_STORAGE_STATE_ISSUE.md
 *
 * SOLUCIÓN DEFINITIVA RECOMENDADA:
 * - Migrar a cookies HTTP-only (mejor práctica de seguridad)
 * - Storage state funcionará automáticamente
 * - Estimación: 4-6 horas de refactor (backend + frontend)
 */
setup('authenticate as admin', async ({ page }) => {
  // Navegar a la página de login
  await page.goto('/login');

  // Llenar formulario de login
  await page.fill('input[name="email"]', 'admin@sigesda.com');
  await page.fill('input[name="password"]', 'admin123');

  // Hacer clic en el botón de inicio de sesión
  await page.click('button:has-text("Iniciar Sesión")');

  // Esperar a que desaparezca el formulario de login (señal de éxito)
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });

  // Esperar un poco más para que se guarden cookies/localStorage
  await page.waitForTimeout(2000);

  // Verificar que hay un elemento que solo aparece cuando estamos autenticados
  // (por ejemplo, el header o sidebar del dashboard)
  await expect(page.locator('header, nav')).toBeVisible({ timeout: 5000 });

  // Guardar el estado de autenticación (incluye cookies y localStorage)
  // ⚠️ NOTA: Este archivo quedará vacío porque la app usa sessionStorage
  // Los tests deben usar el helper loginAsAdmin() en su lugar
  await page.context().storageState({ path: authFile });
});
