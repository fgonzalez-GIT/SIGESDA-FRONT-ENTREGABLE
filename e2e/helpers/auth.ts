import { Page } from '@playwright/test';

/**
 * Helper de autenticación para tests E2E
 *
 * Workaround temporal para la limitación de Playwright con sessionStorage.
 * Ejecuta el flujo completo de login UI para autenticar al usuario admin.
 *
 * ## Contexto Técnico
 *
 * SIGESDA Frontend usa `sessionStorage` para guardar la autenticación
 * (key: 'sigesda_auth'), pero Playwright `storageState()` NO captura
 * sessionStorage, solo cookies y localStorage.
 *
 * Por lo tanto, necesitamos este helper para ejecutar login manual
 * en cada test hasta que se implemente la solución definitiva
 * (migrar a cookies HTTP-only).
 *
 * ## Uso
 *
 * ```typescript
 * import { loginAsAdmin } from '../helpers/auth';
 *
 * test.describe('Mi suite de tests', () => {
 *   test.beforeEach(async ({ page }) => {
 *     await loginAsAdmin(page);
 *     await page.goto('/cuotas');
 *   });
 *
 *   test('mi test', async ({ page }) => {
 *     // El usuario ya está autenticado
 *   });
 * });
 * ```
 *
 * ## Credenciales
 *
 * - **Email:** admin@sigesda.com
 * - **Password:** admin123
 * - **Rol:** admin (acceso completo)
 *
 * ## Tiempo de Ejecución
 *
 * - ~2 segundos por invocación
 * - Incluye navegación, esperas de UI y guardado en sessionStorage
 *
 * ## Documentación Adicional
 *
 * Ver análisis completo del issue en: `docs/E2E_STORAGE_STATE_ISSUE.md`
 *
 * @param page - Instancia de Page de Playwright
 * @returns Promise<void> - Se resuelve cuando el login está completo
 *
 * @throws Error si el login falla o los selectores no se encuentran
 *
 * @example
 * ```typescript
 * // En un test individual
 * test('debe crear cuota', async ({ page }) => {
 *   await loginAsAdmin(page);
 *   await page.goto('/cuotas/nueva');
 *   // ... resto del test
 * });
 * ```
 *
 * @example
 * ```typescript
 * // En beforeEach para toda una suite
 * test.describe('Gestión de Cuotas', () => {
 *   test.beforeEach(async ({ page }) => {
 *     await loginAsAdmin(page);
 *   });
 *
 *   test('test 1', async ({ page }) => { ... });
 *   test('test 2', async ({ page }) => { ... });
 * });
 * ```
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  // Navegar a la página de login
  await page.goto('/login');

  // Verificar que estamos en la página de login
  await page.waitForSelector('input[name="email"]', { timeout: 5000 });

  // Llenar formulario de login
  await page.fill('input[name="email"]', 'admin@sigesda.com');
  await page.fill('input[name="password"]', 'admin123');

  // Hacer clic en el botón de inicio de sesión
  await page.click('button:has-text("Iniciar Sesión")');

  // Esperar a que la navegación complete (salir de /login)
  // Esto indica que el login fue exitoso
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });

  // Esperar un poco para que:
  // 1. Redux hydrate desde sessionStorage
  // 2. El dashboard termine de cargar
  // 3. Las llamadas API iniciales completen
  await page.waitForTimeout(2000);
}
