import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Crear Ajuste Manual', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('debe crear ajuste de descuento por porcentaje', async ({ page }) => {
    // 1. Navegar a persona
    await page.goto('/personas');
    await page.click('table tbody tr:first-child');

    // 2. Abrir modal de ajustes
    await page.click('button:has-text("Gestionar Ajustes")');
    await expect(page.locator('h2:has-text("Gestión de Ajustes")')).toBeVisible();

    // 3. Hacer clic en "Nuevo Ajuste"
    await page.click('button:has-text("Nuevo Ajuste")');

    // 4. Completar formulario
    await page.selectOption('select[name="tipoAjuste"]', 'DESCUENTO_PORCENTAJE');
    await page.fill('input[name="valor"]', '15');
    await page.selectOption('select[name="aplicaA"]', 'TOTAL_CUOTA');
    await page.fill('input[name="concepto"]', 'Descuento temporal por situación económica');
    await page.fill('textarea[name="motivo"]', 'Familia con dificultades financieras temporales debido a emergencia médica');
    await page.fill('input[name="fechaInicio"]', '2024-01-01');
    await page.fill('input[name="fechaFin"]', '2024-12-31');

    // 5. Enviar
    await page.click('button:has-text("Crear Ajuste")');

    // 6. Verificar éxito
    await expect(page.locator('text=/Ajuste creado exitosamente/')).toBeVisible({ timeout: 5000 });

    // 7. Verificar que aparece en lista
    await expect(page.locator('text=/15% de descuento/')).toBeVisible();
  });
});
