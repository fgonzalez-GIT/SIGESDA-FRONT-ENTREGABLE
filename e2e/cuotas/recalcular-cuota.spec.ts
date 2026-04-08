import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Recalcular Cuota', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('debe recalcular cuota existente', async ({ page }) => {
    // 1. Navegar a detalle de cuota
    await page.goto('/cuotas');
    await page.click('table tbody tr:first-child'); // Abrir primera cuota
    await expect(page.locator('h2:has-text("Detalle de Cuota")')).toBeVisible();

    // 2. Obtener monto actual
    const montoActual = await page.locator('[data-testid="monto-total"]').textContent();

    // 3. Hacer clic en Recalcular
    await page.click('button:has-text("Recalcular")');

    // 4. Confirmar recálculo
    await page.click('button:has-text("Confirmar")');

    // 5. Verificar que monto cambió (o se mantuvo)
    await page.waitForTimeout(2000); // Esperar respuesta del backend
    const montoNuevo = await page.locator('[data-testid="monto-total"]').textContent();
    expect(montoNuevo).toBeDefined();

    // 6. Verificar mensaje de éxito
    await expect(page.locator('text=/Cuota recalculada/')).toBeVisible();
  });
});
