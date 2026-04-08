import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Generar Cuotas V2', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/cuotas');
    await page.waitForLoadState('networkidle');
  });

  test('debe generar cuotas para período nuevo', async ({ page }) => {
    // 1. Abrir modal de generación
    await page.click('button:has-text("Generar Cuotas")');
    await expect(page.locator('h2:has-text("Generar Cuotas Masivamente")')).toBeVisible();

    // 2. Paso 1: Seleccionar período
    await page.selectOption('select[name="mes"]', '1');
    await page.selectOption('select[name="anio"]', '2024');
    await page.click('button:has-text("Siguiente")');

    // 3. Paso 2: Configurar opciones
    await page.check('input[name="aplicarDescuentos"]');
    await page.check('input[name="aplicarMotorReglas"]');
    await page.click('button:has-text("Siguiente")');

    // 4. Paso 3: Preview y confirmar
    await expect(page.locator('text=/Socios a generar: \\d+/')).toBeVisible();
    await page.click('button:has-text("Generar")');

    // 5. Verificar éxito
    await expect(page.locator('text=/Cuotas generadas exitosamente/')).toBeVisible({ timeout: 10000 });

    // 6. Verificar que aparecen en tabla
    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.click('button:has-text("Generar Cuotas")');
    await page.click('button:has-text("Siguiente")'); // Sin seleccionar período

    // Verificar errores de validación
    await expect(page.locator('text=/Mes es requerido/')).toBeVisible();
    await expect(page.locator('text=/Año es requerido/')).toBeVisible();
  });
});
